/**
 * Credential Management UI Component
 * Admin panel for managing email credentials and API keys
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CredentialManagement.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const CredentialManagement = () => {
  // State
  const [activeTab, setActiveTab] = useState('email');
  const [emailCredentials, setEmailCredentials] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formType, setFormType] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [message, setMessage] = useState(null);

  // Form state
  const [formData, setFormData] = useState({});

  // Fetch credentials
  useEffect(() => {
    fetchCredentials();
    const interval = setInterval(fetchCredentials, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchCredentials = async () => {
    try {
      setLoading(true);
      const endpoint = activeTab === 'email' ? '/credentials/email' : '/credentials/apikeys';
      const response = await axios.get(`${API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (activeTab === 'email') {
        setEmailCredentials(response.data.data.credentials);
      } else {
        setApiKeys(response.data.data.keys);
      }
      setStatistics(response.data.data.statistics);
    } catch (error) {
      showNotification('Error fetching credentials: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Add credential/key
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      if (activeTab === 'email') {
        await axios.post(`${API_URL}/credentials/email`, formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        showNotification('Email credential added successfully', 'success');
      } else {
        await axios.post(`${API_URL}/credentials/apikeys`, formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        showNotification('API key added successfully', 'success');
      }

      setFormData({});
      setShowAddForm(false);
      fetchCredentials();
    } catch (error) {
      showNotification('Error adding credential: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Remove credential/key
  const handleRemove = async (id) => {
    if (!window.confirm('Are you sure you want to remove this credential?')) return;

    try {
      setLoading(true);
      const endpoint = activeTab === 'email' ? `/credentials/email/${id}` : `/credentials/apikeys/${id}`;

      await axios.delete(`${API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      showNotification('Credential removed successfully', 'success');
      fetchCredentials();
    } catch (error) {
      showNotification('Error removing credential: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Test credential/key
  const handleTest = async (id) => {
    try {
      setLoading(true);
      const endpoint =
        activeTab === 'email' ? `/credentials/email/test/${id}` : `/credentials/apikeys/test/${id}`;

      const response = await axios.post(`${API_URL}${endpoint}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      setTestResults({
        credentialId: id,
        success: response.data.success,
        message: response.data.message,
        data: response.data.data,
      });

      showNotification(response.data.message, 'success');
    } catch (error) {
      showNotification('Test failed: ' + error.message, 'error');
      setTestResults({
        credentialId: id,
        success: false,
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Health check
  const handleHealthCheck = async () => {
    try {
      setLoading(true);
      const endpoint =
        activeTab === 'email' ? '/credentials/email/health-check' : '/credentials/apikeys/health-check';

      const response = await axios.post(`${API_URL}${endpoint}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      showNotification('Health check completed', 'success');
      setTestResults({
        type: 'health-check',
        results: response.data.data,
      });
    } catch (error) {
      showNotification('Health check failed: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Toggle enable/disable
  const handleToggle = async (id, currentEnabled) => {
    try {
      setLoading(true);
      const endpoint =
        activeTab === 'email' ? `/credentials/email/${id}` : `/credentials/apikeys/${id}`;

      await axios.put(
        `${API_URL}${endpoint}`,
        { enabled: !currentEnabled },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );

      showNotification(
        `Credential ${!currentEnabled ? 'enabled' : 'disabled'} successfully`,
        'success'
      );
      fetchCredentials();
    } catch (error) {
      showNotification('Error updating credential: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Show notification
  const showNotification = (msg, type) => {
    setMessage({ text: msg, type });
    setTimeout(() => setMessage(null), 5000);
  };

  // Handle form input
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'priority' || name === 'monthlyLimit' ? parseInt(value) : value,
    }));
  };

  return (
    <div className="credential-management">
      {/* Header */}
      <div className="cm-header">
        <h1>Credential Management</h1>
        <p>Manage email credentials and API keys with automatic failover</p>
      </div>

      {/* Notification */}
      {message && (
        <div className={`notification notification-${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="cm-tabs">
        <button
          className={`cm-tab ${activeTab === 'email' ? 'active' : ''}`}
          onClick={() => setActiveTab('email')}
        >
          📧 Email Credentials ({emailCredentials.length})
        </button>
        <button
          className={`cm-tab ${activeTab === 'apikeys' ? 'active' : ''}`}
          onClick={() => setActiveTab('apikeys')}
        >
          🔑 API Keys ({apiKeys.length})
        </button>
      </div>

      {/* Content */}
      <div className="cm-content">
        {/* Statistics */}
        {statistics && (
          <div className="cm-statistics">
            <div className="stat-card">
              <strong>Total</strong>
              <span className="stat-number">
                {activeTab === 'email' ? statistics.totalCredentials : statistics.totalKeys}
              </span>
            </div>
            <div className="stat-card">
              <strong>Enabled</strong>
              <span className="stat-number">
                {activeTab === 'email' ? statistics.enabledCredentials : statistics.enabledKeys}
              </span>
            </div>
            <div className="stat-card">
              <strong>Current Index</strong>
              <span className="stat-number">{statistics.currentIndex}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="cm-actions">
          <button
            className="btn btn-primary"
            onClick={() => {
              setShowAddForm(true);
              setFormType(activeTab);
            }}
            disabled={loading}
          >
            ➕ Add {activeTab === 'email' ? 'Email' : 'API Key'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleHealthCheck}
            disabled={loading}
          >
            🏥 Health Check
          </button>
          <button
            className="btn btn-default"
            onClick={fetchCredentials}
            disabled={loading}
          >
            🔄 Refresh
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="cm-form-container">
            <div className="cm-form">
              <h3>{activeTab === 'email' ? 'Add Email Credential' : 'Add API Key'}</h3>

              <form onSubmit={handleAddSubmit}>
                {activeTab === 'email' ? (
                  <>
                    <div className="form-group">
                      <label>Email Address</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email || ''}
                        onChange={handleFormChange}
                        required
                        placeholder="sender@gmail.com"
                      />
                    </div>
                    <div className="form-group">
                      <label>App Password</label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password || ''}
                        onChange={handleFormChange}
                        required
                        placeholder="Gmail app-specific password"
                      />
                      <small>Use app-specific passwords for Gmail (not your regular password)</small>
                    </div>
                    <div className="form-group">
                      <label>Sender Name</label>
                      <input
                        type="text"
                        name="fromName"
                        value={formData.fromName || ''}
                        onChange={handleFormChange}
                        placeholder="Library System"
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>SMTP Host</label>
                        <input
                          type="text"
                          name="smtpHost"
                          value={formData.smtpHost || 'smtp.gmail.com'}
                          onChange={handleFormChange}
                        />
                      </div>
                      <div className="form-group">
                        <label>SMTP Port</label>
                        <input
                          type="number"
                          name="smtpPort"
                          value={formData.smtpPort || 587}
                          onChange={handleFormChange}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="form-group">
                      <label>API Key</label>
                      <input
                        type="password"
                        name="apiKey"
                        value={formData.apiKey || ''}
                        onChange={handleFormChange}
                        required
                        placeholder="sk-or-..."
                      />
                    </div>
                    <div className="form-group">
                      <label>Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name || ''}
                        onChange={handleFormChange}
                        required
                        placeholder="Primary Key"
                      />
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <textarea
                        name="description"
                        value={formData.description || ''}
                        onChange={handleFormChange}
                        placeholder="Optional description..."
                        rows="2"
                      />
                    </div>
                    <div className="form-group">
                      <label>Monthly Limit</label>
                      <input
                        type="number"
                        name="monthlyLimit"
                        value={formData.monthlyLimit || ''}
                        onChange={handleFormChange}
                        placeholder="Leave empty for unlimited"
                      />
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label>Priority (lower = higher priority)</label>
                  <input
                    type="number"
                    name="priority"
                    value={formData.priority || 10}
                    onChange={handleFormChange}
                    min="1"
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-success" disabled={loading}>
                    {loading ? 'Adding...' : 'Add'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-default"
                    onClick={() => setShowAddForm(false)}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Credentials List */}
        <div className="cm-list">
          {activeTab === 'email' && emailCredentials.length > 0 && (
            <table className="credentials-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Added</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {emailCredentials.map((cred) => (
                  <tr key={cred.id}>
                    <td>{cred.email}</td>
                    <td>
                      <span className={`badge ${cred.enabled ? 'badge-success' : 'badge-danger'}`}>
                        {cred.enabled ? '✅ Enabled' : '❌ Disabled'}
                      </span>
                    </td>
                    <td>{cred.priority}</td>
                    <td>{new Date(cred.created_at).toLocaleDateString()}</td>
                    <td className="actions">
                      <button
                        className="btn-small btn-info"
                        onClick={() => handleTest(cred.id)}
                        disabled={loading}
                        title="Test credential"
                      >
                        🧪 Test
                      </button>
                      <button
                        className={`btn-small ${cred.enabled ? 'btn-warning' : 'btn-success'}`}
                        onClick={() => handleToggle(cred.id, cred.enabled)}
                        disabled={loading}
                        title={cred.enabled ? 'Disable' : 'Enable'}
                      >
                        {cred.enabled ? '🔴 Disable' : '🟢 Enable'}
                      </button>
                      <button
                        className="btn-small btn-danger"
                        onClick={() => handleRemove(cred.id)}
                        disabled={loading}
                        title="Remove credential"
                      >
                        🗑️ Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'apikeys' && apiKeys.length > 0 && (
            <table className="credentials-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Monthly Limit</th>
                  <th>Added</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {apiKeys.map((key) => (
                  <tr key={key.id}>
                    <td>{key.name}</td>
                    <td>
                      <span className={`badge ${key.enabled ? 'badge-success' : 'badge-danger'}`}>
                        {key.enabled ? '✅ Enabled' : '❌ Disabled'}
                      </span>
                    </td>
                    <td>{key.priority}</td>
                    <td>{key.monthly_limit || 'Unlimited'}</td>
                    <td>{new Date(key.created_at).toLocaleDateString()}</td>
                    <td className="actions">
                      <button
                        className="btn-small btn-info"
                        onClick={() => handleTest(key.id)}
                        disabled={loading}
                        title="Test key"
                      >
                        🧪 Test
                      </button>
                      <button
                        className={`btn-small ${key.enabled ? 'btn-warning' : 'btn-success'}`}
                        onClick={() => handleToggle(key.id, key.enabled)}
                        disabled={loading}
                        title={key.enabled ? 'Disable' : 'Enable'}
                      >
                        {key.enabled ? '🔴 Disable' : '🟢 Enable'}
                      </button>
                      <button
                        className="btn-small btn-danger"
                        onClick={() => handleRemove(key.id)}
                        disabled={loading}
                        title="Remove key"
                      >
                        🗑️ Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'email' && emailCredentials.length === 0 && (
            <div className="empty-state">
              <p>No email credentials configured</p>
              <button
                className="btn btn-primary"
                onClick={() => setShowAddForm(true)}
              >
                Add First Email Credential
              </button>
            </div>
          )}

          {activeTab === 'apikeys' && apiKeys.length === 0 && (
            <div className="empty-state">
              <p>No API keys configured</p>
              <button
                className="btn btn-primary"
                onClick={() => setShowAddForm(true)}
              >
                Add First API Key
              </button>
            </div>
          )}
        </div>

        {/* Health Check Results */}
        {testResults && (
          <div className="test-results">
            <h4>
              {testResults.type === 'health-check' ? '🏥 Health Check Results' : '🧪 Test Results'}
            </h4>
            {testResults.type === 'health-check' ? (
              <pre>{JSON.stringify(testResults.results, null, 2)}</pre>
            ) : (
              <div>
                <p className={testResults.success ? 'text-success' : 'text-danger'}>
                  {testResults.message}
                </p>
                {testResults.data && (
                  <pre>{JSON.stringify(testResults.data, null, 2)}</pre>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Loading Indicator */}
      {loading && <div className="loading-overlay">Loading...</div>}
    </div>
  );
};

export default CredentialManagement;
