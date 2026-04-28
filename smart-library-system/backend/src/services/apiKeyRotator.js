/**
 * API Key Rotator - OpenRouter Key Auto-Switching
 * Manages multiple OpenRouter API keys with automatic failover
 */

import axios from 'axios';
import supabase from '../config/supabase.js';

class APIKeyRotator {
  constructor() {
    this.apiKeys = [];
    this.currentIndex = 0;
    this.healthStatus = new Map();
    this.failureCount = new Map();
    this.requestCount = new Map();
    this.rateLimitInfo = new Map();
  }

  /**
   * Load all API keys from database
   */
  async loadAPIKeys() {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('service', 'openrouter')
        .eq('enabled', true)
        .order('priority', { ascending: true });

      if (error) throw error;

      this.apiKeys = data || [];

      // Initialize tracking
      this.apiKeys.forEach((key, index) => {
        this.healthStatus.set(index, {
          healthy: true,
          lastChecked: null,
          lastError: null,
        });
        this.failureCount.set(index, 0);
        this.requestCount.set(index, 0);
        this.rateLimitInfo.set(index, {
          requestsPerMinute: null,
          remainingRequests: null,
          resetTime: null,
        });
      });

      console.log(`✅ Loaded ${this.apiKeys.length} OpenRouter API keys`);
      return this.apiKeys;
    } catch (error) {
      console.error('❌ Error loading API keys:', error);
      return [];
    }
  }

  /**
   * Add new API key
   */
  async addAPIKey(keyData) {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          service: 'openrouter',
          api_key: keyData.apiKey,
          name: keyData.name,
          description: keyData.description,
          enabled: true,
          priority: keyData.priority || 10,
          monthly_limit: keyData.monthlyLimit,
          created_at: new Date(),
        })
        .select();

      if (error) throw error;

      console.log(`✅ API key added: ${keyData.name}`);
      await this.loadAPIKeys();
      return data[0];
    } catch (error) {
      console.error('❌ Error adding API key:', error);
      throw error;
    }
  }

  /**
   * Remove API key
   */
  async removeAPIKey(keyId) {
    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId);

      if (error) throw error;

      console.log(`✅ API key removed`);
      await this.loadAPIKeys();
    } catch (error) {
      console.error('❌ Error removing API key:', error);
      throw error;
    }
  }

  /**
   * Get current healthy API key
   */
  async getCurrentAPIKey() {
    if (this.apiKeys.length === 0) {
      throw new Error('No OpenRouter API keys configured');
    }

    // Try to find a healthy key with available quota
    for (let i = 0; i < this.apiKeys.length; i++) {
      const index = (this.currentIndex + i) % this.apiKeys.length;
      const health = this.healthStatus.get(index);
      const rateLimitInfo = this.rateLimitInfo.get(index);

      if (
        health &&
        health.healthy &&
        rateLimitInfo &&
        rateLimitInfo.remainingRequests !== 0
      ) {
        this.currentIndex = index;
        return this.apiKeys[index];
      }
    }

    // If all problematic, use next anyway
    console.warn('⚠️ All API keys exhausted or unhealthy, using next in rotation');
    this.currentIndex = (this.currentIndex + 1) % this.apiKeys.length;
    return this.apiKeys[this.currentIndex];
  }

  /**
   * Make API request with automatic failover
   */
  async makeRequest(requestConfig) {
    let lastError;

    // Try each API key
    for (let attempt = 0; attempt < this.apiKeys.length; attempt++) {
      try {
        const apiKey = await this.getCurrentAPIKey();
        const keyIndex = this.currentIndex;

        // Increment request count
        const count = (this.requestCount.get(keyIndex) || 0) + 1;
        this.requestCount.set(keyIndex, count);

        // Make request
        const response = await axios({
          ...requestConfig,
          headers: {
            ...requestConfig.headers,
            Authorization: `Bearer ${apiKey.api_key}`,
          },
          timeout: 30000,
        });

        // Update rate limit info from headers
        if (response.headers) {
          const rateLimitInfo = this.rateLimitInfo.get(keyIndex) || {};
          rateLimitInfo.remainingRequests = parseInt(
            response.headers['x-openrouter-remaining-requests'] || -1
          );
          rateLimitInfo.requestsPerMinute = parseInt(
            response.headers['x-openrouter-requests-per-min'] || -1
          );
          this.rateLimitInfo.set(keyIndex, rateLimitInfo);
        }

        // Mark as healthy
        const health = this.healthStatus.get(keyIndex);
        health.healthy = true;
        health.lastChecked = new Date();
        health.lastError = null;
        this.failureCount.set(keyIndex, 0);

        // Log successful request
        await this.logRequest(apiKey.id, 'success', null, response.status);

        console.log(
          `✅ Request successful via key: ${apiKey.name} (Remaining: ${rateLimitInfo.remainingRequests})`
        );
        return response.data;
      } catch (error) {
        lastError = error;
        const keyIndex = this.currentIndex;
        const apiKey = this.apiKeys[keyIndex];

        console.error(
          `❌ Request failed via key ${keyIndex} (${apiKey.name}):`,
          error.message
        );

        // Handle different error types
        if (error.response) {
          const status = error.response.status;

          // 429 = Rate Limited
          if (status === 429) {
            const resetTime = error.response.headers['retry-after'];
            const rateLimitInfo = this.rateLimitInfo.get(keyIndex) || {};
            rateLimitInfo.remainingRequests = 0;
            rateLimitInfo.resetTime = resetTime;
            this.rateLimitInfo.set(keyIndex, rateLimitInfo);

            console.warn(`⚠️ API key ${apiKey.name} rate limited`);
          }

          // 401 = Unauthorized
          if (status === 401) {
            await this.disableAPIKey(keyIndex);
            console.error(`🔴 API key ${apiKey.name} unauthorized - disabled`);
          }

          // Log failed request
          await this.logRequest(
            apiKey.id,
            'failed',
            error.message,
            status
          );
        }

        // Mark as unhealthy
        const health = this.healthStatus.get(keyIndex);
        health.healthy = error.response?.status !== 429; // Rate limiting is not a health issue
        health.lastError = error.message;

        const failures = (this.failureCount.get(keyIndex) || 0) + 1;
        this.failureCount.set(keyIndex, failures);

        // Disable after too many failures
        if (failures > 10) {
          await this.disableAPIKey(keyIndex);
        }

        // Move to next key
        this.currentIndex = (this.currentIndex + 1) % this.apiKeys.length;
      }
    }

    throw new Error(
      `Failed to make request after trying all API keys: ${lastError?.message}`
    );
  }

  /**
   * Health check all API keys
   */
  async healthCheck() {
    const results = [];

    for (let index = 0; index < this.apiKeys.length; index++) {
      try {
        const apiKey = this.apiKeys[index];

        const response = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'user',
                content: 'ping',
              },
            ],
            max_tokens: 10,
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey.api_key}`,
            },
            timeout: 10000,
          }
        );

        this.healthStatus.get(index).healthy = true;
        this.healthStatus.get(index).lastError = null;
        this.failureCount.set(index, 0);

        // Update rate limit info
        const rateLimitInfo = this.rateLimitInfo.get(index) || {};
        rateLimitInfo.remainingRequests = parseInt(
          response.headers['x-openrouter-remaining-requests'] || -1
        );
        this.rateLimitInfo.set(index, rateLimitInfo);

        results.push({
          index,
          name: apiKey.name,
          status: 'healthy',
          remainingRequests: rateLimitInfo.remainingRequests,
          timestamp: new Date(),
        });

        console.log(`✅ ${apiKey.name} is healthy`);
      } catch (error) {
        this.healthStatus.get(index).healthy = false;
        this.healthStatus.get(index).lastError = error.message;

        results.push({
          index,
          name: this.apiKeys[index].name,
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date(),
        });

        console.error(
          `❌ ${this.apiKeys[index].name} is unhealthy:`,
          error.message
        );
      }
    }

    // Store health check results
    await supabase.from('api_key_health_checks').insert(results);

    return results;
  }

  /**
   * Disable API key temporarily
   */
  async disableAPIKey(index) {
    const apiKey = this.apiKeys[index];

    await supabase
      .from('api_keys')
      .update({ enabled: false })
      .eq('id', apiKey.id);

    console.log(`🔴 Disabled API key: ${apiKey.name}`);
    await this.loadAPIKeys();
  }

  /**
   * Enable API key
   */
  async enableAPIKey(keyId) {
    const { error } = await supabase
      .from('api_keys')
      .update({ enabled: true })
      .eq('id', keyId);

    if (error) throw error;

    const index = this.apiKeys.findIndex((k) => k.id === keyId);
    if (index !== -1) {
      this.healthStatus.get(index).healthy = true;
      this.failureCount.set(index, 0);
    }

    console.log(`🟢 Re-enabled API key`);
    await this.loadAPIKeys();
  }

  /**
   * Log API request
   */
  async logRequest(keyId, status, error, statusCode) {
    try {
      await supabase.from('api_request_logs').insert({
        api_key_id: keyId,
        status: status,
        error_message: error,
        http_status_code: statusCode,
        logged_at: new Date(),
      });
    } catch (err) {
      console.error('Error logging API request:', err);
    }
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      totalKeys: this.apiKeys.length,
      enabledKeys: this.apiKeys.filter((k) => k.enabled).length,
      healthStatus: Array.from(this.healthStatus.entries()).map(
        ([index, status]) => ({
          name: this.apiKeys[index]?.name,
          healthy: status.healthy,
          lastError: status.lastError,
          failureCount: this.failureCount.get(index) || 0,
          requestCount: this.requestCount.get(index) || 0,
          rateLimitInfo: this.rateLimitInfo.get(index),
          lastChecked: status.lastChecked,
        })
      ),
      currentIndex: this.currentIndex,
    };
  }

  /**
   * Reset statistics
   */
  resetStatistics() {
    this.apiKeys.forEach((_, index) => {
      this.failureCount.set(index, 0);
      this.requestCount.set(index, 0);
    });
    console.log('📊 Statistics reset');
  }
}

export default new APIKeyRotator();
