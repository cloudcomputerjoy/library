/**
 * AI Service - OpenRouter Integration
 * Production-ready AI functionalities
 */

import axios from 'axios';

class AIService {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'openrouter/auto';
    this.baseUrl = 'https://openrouter.ai/api/v1';
  }

  /**
   * Chat completion
   */
  async chat(messages, temperature = 0.7, maxTokens = 1000) {
    try {
      if (!this.apiKey) {
        throw new Error('OpenRouter API key not configured');
      }

      const response = await axios.post(`${this.baseUrl}/chat/completions`, {
        model: this.model,
        messages: messages,
        temperature: temperature,
        max_tokens: maxTokens,
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://smartlibrary.local',
          'X-Title': 'Smart Library System',
          'Content-Type': 'application/json',
        },
      });

      if (response.data.choices && response.data.choices[0]) {
        return {
          success: true,
          content: response.data.choices[0].message.content,
          usage: response.data.usage,
        };
      }

      throw new Error('Unexpected API response');
    } catch (error) {
      console.error('OpenRouter chat error:', error);
      throw error;
    }
  }

  /**
   * Generate book recommendation
   */
  async generateBookRecommendation(bookTitle, genre, userPreferences) {
    const messages = [
      {
        role: 'system',
        content: 'You are a helpful library assistant. Provide brief, relevant book recommendations.',
      },
      {
        role: 'user',
        content: `Based on the book "${bookTitle}" in ${genre} genre and user preferences: ${userPreferences}, suggest 3 similar books the user might enjoy. Format as JSON.`,
      },
    ];

    return this.chat(messages, 0.6, 500);
  }

  /**
   * Generate book summary
   */
  async generateBookSummary(bookTitle, author, description) {
    const messages = [
      {
        role: 'system',
        content: 'You are a professional book summarizer. Create concise, informative summaries.',
      },
      {
        role: 'user',
        content: `Please summarize the book "${bookTitle}" by ${author}. Description: ${description}. Keep summary under 200 words.`,
      },
    ];

    return this.chat(messages, 0.5, 300);
  }

  /**
   * Generate library report analysis
   */
  async analyzeLibraryReport(reportData) {
    const messages = [
      {
        role: 'system',
        content: 'You are a data analyst for library management systems. Provide insights and recommendations.',
      },
      {
        role: 'user',
        content: `Analyze the following library report data and provide insights: ${JSON.stringify(reportData)}. Provide 3-5 key insights and recommendations.`,
      },
    ];

    return this.chat(messages, 0.6, 1000);
  }

  /**
   * Generate fine reduction recommendation
   */
  async analyzeFineReduction(userId, totalFines, reason, paymentHistory) {
    const messages = [
      {
        role: 'system',
        content: 'You are a fair library manager. Help make equitable fine reduction decisions.',
      },
      {
        role: 'user',
        content: `A user with ID ${userId} is requesting a fine reduction. Total fines: ${totalFines} BDT. Reason: ${reason}. Payment history: ${paymentHistory}. Should a reduction be granted? Provide analysis and recommendation.`,
      },
    ];

    return this.chat(messages, 0.5, 500);
  }

  /**
   * Generate user engagement recommendation
   */
  async generateEngagementStrategy(userData) {
    const messages = [
      {
        role: 'system',
        content: 'You are a user engagement specialist for libraries. Provide personalized recommendations.',
      },
      {
        role: 'user',
        content: `Based on this user profile: ${JSON.stringify(userData)}, suggest 3 personalized strategies to increase their library engagement and reading habits.`,
      },
    ];

    return this.chat(messages, 0.7, 500);
  }

  /**
   * Generate system maintenance recommendation
   */
  async generateMaintenanceRecommendation(systemHealth) {
    const messages = [
      {
        role: 'system',
        content: 'You are a systems administrator. Provide practical maintenance recommendations.',
      },
      {
        role: 'user',
        content: `Based on these system health metrics: ${JSON.stringify(systemHealth)}, what maintenance tasks should be prioritized? Provide a prioritized list.`,
      },
    ];

    return this.chat(messages, 0.5, 500);
  }

  /**
   * Extract keywords from text
   */
  async extractKeywords(text, maxKeywords = 10) {
    const messages = [
      {
        role: 'system',
        content: 'You extract keywords from text. Return only a JSON array of keywords.',
      },
      {
        role: 'user',
        content: `Extract up to ${maxKeywords} relevant keywords from: "${text}". Return as JSON array.`,
      },
    ];

    return this.chat(messages, 0.3, 200);
  }

  /**
   * Moderate content
   */
  async moderateContent(content) {
    const messages = [
      {
        role: 'system',
        content: 'You moderate library content. Flag inappropriate material. Return JSON with isSafe boolean and reason.',
      },
      {
        role: 'user',
        content: `Is this content appropriate for a public library setting? "${content}". Respond in JSON format.`,
      },
    ];

    try {
      const result = await this.chat(messages, 0.3, 200);
      return {
        ...result,
        content: JSON.parse(result.content),
      };
    } catch (error) {
      console.error('Content moderation error:', error);
      throw error;
    }
  }

  /**
   * Generate FAQ answer
   */
  async generateFAQAnswer(question, context = '') {
    const messages = [
      {
        role: 'system',
        content: 'You provide helpful answers to library-related questions. Be concise and accurate.',
      },
      {
        role: 'user',
        content: `${context ? 'Context: ' + context + '\n' : ''}Question: ${question}`,
      },
    ];

    return this.chat(messages, 0.6, 400);
  }

  /**
   * Test API connection
   */
  async testConnection() {
    try {
      if (!this.apiKey) {
        throw new Error('OpenRouter API key not configured');
      }

      const response = await axios.post(`${this.baseUrl}/chat/completions`, {
        model: this.model,
        messages: [{ role: 'user', content: 'Say hello' }],
        max_tokens: 10,
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://smartlibrary.local',
          'X-Title': 'Smart Library System',
          'Content-Type': 'application/json',
        },
      });

      return {
        success: true,
        message: 'OpenRouter API connection successful',
        model: this.model,
      };
    } catch (error) {
      console.error('OpenRouter connection test error:', error);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }
}

export default AIService;
