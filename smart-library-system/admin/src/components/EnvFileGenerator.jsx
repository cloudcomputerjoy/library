import React, { useState, useEffect } from 'react';
import './EnvFileGenerator.css';

/**
 * Environment File Generator Component
 * Provides an interface to create and export .env files for Backend, Admin, and Mobile
 * Features:
 * - Add/remove environment variables
 * - Download .env files for each folder
 * - Copy to clipboard functionality
 * - Save/load templates
 * - Validation of environment variables
 */

const EnvFileGenerator = () => {
  const [variables, setVariables] = useState([
    { key: '', value: '' }
  ]);
  const [selectedFolder, setSelectedFolder] = useState('backend');
  const [notifications, setNotifications] = useState([]);
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [templateName, setTemplateName] = useState('');
  const [showTemplateForm, setShowTemplateForm] = useState(false);

  // Folder-specific environment variables templates
  const folderTemplates = {
    backend: [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_KEY',
      'JWT_SECRET',
      'SMTP_HOST',
      'SMTP_PORT',
      'SMTP_USER',
      'SMTP_PASSWORD',
      'OPENROUTER_API_KEY',
      'PORT',
      'NODE_ENV',
      'LOG_LEVEL'
    ],
    admin: [
      'REACT_APP_API_URL',
      'REACT_APP_SUPABASE_URL',
      'REACT_APP_SUPABASE_ANON_KEY',
      'REACT_APP_ENVIRONMENT'
    ],
    mobile: [
      'API_URL',
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'APP_ENV'
    ]
  };

  // Load saved templates from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('envTemplates');
    if (saved) {
      try {
        setSavedTemplates(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading templates:', e);
      }
    }
  }, []);

  // Add notification
  const addNotification = (message, type = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  // Add new variable
  const addVariable = () => {
    setVariables([...variables, { key: '', value: '' }]);
  };

  // Remove variable
  const removeVariable = (index) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  // Update variable
  const updateVariable = (index, field, value) => {
    const updated = [...variables];
    updated[index][field] = value;
    setVariables(updated);
  };

  // Generate .env content
  const generateEnvContent = () => {
    let content = `# ${selectedFolder.toUpperCase()} Environment Variables\n`;
    content += `# Generated on ${new Date().toLocaleString()}\n`;
    content += `# Folder: ${selectedFolder}\n\n`;

    variables.forEach(({ key, value }) => {
      if (key.trim()) {
        // Escape special characters in values
        const escapedValue = escapeEnvValue(value);
        content += `${key}=${escapedValue}\n`;
      }
    });

    return content;
  };

  // Escape special characters in environment values
  const escapeEnvValue = (value) => {
    if (!value) return '';
    
    // If value contains spaces or special chars, wrap in quotes
    if (value.includes(' ') || value.includes('#') || value.includes('=')) {
      return `"${value.replace(/"/g, '\\"')}"`;
    }
    
    return value;
  };

  // Download .env file
  const downloadEnvFile = () => {
    const content = generateEnvContent();
    const element = document.createElement('a');
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`);
    element.setAttribute('download', `.env.${selectedFolder}`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    addNotification(`✓ .env.${selectedFolder} downloaded successfully!`, 'success');
  };

  // Copy to clipboard
  const copyToClipboard = () => {
    const content = generateEnvContent();
    navigator.clipboard.writeText(content).then(() => {
      addNotification('✓ Copied to clipboard!', 'success');
    }).catch(() => {
      addNotification('✗ Failed to copy to clipboard', 'error');
    });
  };

  // Generate all three .env files
  const downloadAllEnvFiles = () => {
    Object.keys(folderTemplates).forEach(folder => {
      setSelectedFolder(folder);
      setTimeout(() => {
        const content = generateEnvContent();
        const element = document.createElement('a');
        element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`);
        element.setAttribute('download', `.env.${folder}`);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      }, 100);
    });
    addNotification('✓ All .env files downloaded!', 'success');
  };

  // Load template
  const loadTemplate = (templateId) => {
    const template = savedTemplates.find(t => t.id === templateId);
    if (template) {
      setVariables(JSON.parse(template.content));
      addNotification(`✓ Loaded template: ${template.name}`, 'success');
    }
  };

  // Save template
  const saveTemplate = () => {
    if (!templateName.trim()) {
      addNotification('✗ Template name is required', 'error');
      return;
    }

    const newTemplate = {
      id: Date.now(),
      name: templateName,
      content: JSON.stringify(variables),
      createdAt: new Date().toLocaleString(),
      folder: selectedFolder
    };

    const updated = [...savedTemplates, newTemplate];
    setSavedTemplates(updated);
    localStorage.setItem('envTemplates', JSON.stringify(updated));
    setTemplateName('');
    setShowTemplateForm(false);
    addNotification(`✓ Template saved: ${templateName}`, 'success');
  };

  // Delete template
  const deleteTemplate = (templateId) => {
    const updated = savedTemplates.filter(t => t.id !== templateId);
    setSavedTemplates(updated);
    localStorage.setItem('envTemplates', JSON.stringify(updated));
    addNotification('✓ Template deleted', 'success');
  };

  // Quick fill template for folder
  const insertFolderTemplate = () => {
    const template = folderTemplates[selectedFolder];
    const newVariables = template.map(key => ({
      key,
      value: ''
    }));
    setVariables(newVariables);
    addNotification(`✓ Inserted ${selectedFolder} template with ${template.length} variables`, 'success');
  };

  // Clear all variables
  const clearAll = () => {
    if (window.confirm('Are you sure you want to clear all variables?')) {
      setVariables([{ key: '', value: '' }]);
      addNotification('✓ All variables cleared', 'success');
    }
  };

  // Export as JSON for backup
  const exportAsJSON = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      folder: selectedFolder,
      variables,
      templates: savedTemplates
    };
    const element = document.createElement('a');
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`);
    element.setAttribute('download', `env-backup-${Date.now()}.json`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    addNotification('✓ Backup exported as JSON', 'success');
  };

  // Import from JSON
  const importFromJSON = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result);
        setVariables(data.variables || []);
        if (data.templates) {
          setSavedTemplates(data.templates);
          localStorage.setItem('envTemplates', JSON.stringify(data.templates));
        }
        addNotification('✓ Settings imported successfully', 'success');
      } catch (error) {
        addNotification('✗ Failed to import file', 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const envContent = generateEnvContent();
  const validVariables = variables.filter(v => v.key.trim());

  return (
    <div className="env-generator">
      {/* Notifications */}
      <div className="notifications">
        {notifications.map(notif => (
          <div key={notif.id} className={`notification notification-${notif.type}`}>
            {notif.message}
          </div>
        ))}
      </div>

      <div className="eg-header">
        <h1>Environment File Generator</h1>
        <p>Create and manage .env files for Backend, Admin, and Mobile folders with ease</p>
      </div>

      <div className="eg-container">
        {/* Left Panel - Folder Selection & Templates */}
        <div className="eg-left">
          <div className="eg-section">
            <h3>Select Folder</h3>
            <div className="folder-buttons">
              {Object.keys(folderTemplates).map(folder => (
                <button
                  key={folder}
                  className={`folder-btn ${selectedFolder === folder ? 'active' : ''}`}
                  onClick={() => setSelectedFolder(folder)}
                >
                  <span className="folder-icon">📁</span>
                  {folder.charAt(0).toUpperCase() + folder.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="eg-section">
            <h3>Quick Template</h3>
            <button 
              className="btn btn-secondary"
              onClick={insertFolderTemplate}
            >
              Insert {selectedFolder} Template
            </button>
            <p className="hint">Adds common variables for this folder</p>
          </div>

          <div className="eg-section">
            <h3>Saved Templates ({savedTemplates.length})</h3>
            {savedTemplates.length > 0 ? (
              <div className="templates-list">
                {savedTemplates.map(template => (
                  <div key={template.id} className="template-item">
                    <div>
                      <strong>{template.name}</strong>
                      <small>{template.folder} • {template.createdAt}</small>
                    </div>
                    <div className="template-actions">
                      <button 
                        className="btn-small btn-info"
                        onClick={() => loadTemplate(template.id)}
                      >
                        Load
                      </button>
                      <button 
                        className="btn-small btn-danger"
                        onClick={() => deleteTemplate(template.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="hint">No templates saved yet</p>
            )}
          </div>

          <div className="eg-section">
            <h3>Import / Export</h3>
            <div className="import-export">
              <label className="btn btn-default w-full">
                📥 Import JSON
                <input 
                  type="file" 
                  accept=".json"
                  onChange={importFromJSON}
                  style={{ display: 'none' }}
                />
              </label>
              <button 
                className="btn btn-default"
                onClick={exportAsJSON}
              >
                📤 Export as JSON
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel - Variables Editor */}
        <div className="eg-right">
          <div className="eg-stats">
            <div className="stat">
              <span className="stat-label">Variables</span>
              <span className="stat-value">{validVariables.length}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Total Lines</span>
              <span className="stat-value">{envContent.split('\n').length}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Size</span>
              <span className="stat-value">{(envContent.length / 1024).toFixed(2)} KB</span>
            </div>
          </div>

          <div className="eg-section">
            <div className="section-header">
              <h3>Environment Variables</h3>
              <div className="header-actions">
                <button 
                  className="btn-small btn-success"
                  onClick={addVariable}
                >
                  + Add Variable
                </button>
                <button 
                  className="btn-small btn-danger"
                  onClick={clearAll}
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="variables-editor">
              {variables.map((variable, index) => (
                <div key={index} className="variable-row">
                  <input
                    type="text"
                    placeholder="Variable name (e.g., SUPABASE_URL)"
                    value={variable.key}
                    onChange={(e) => updateVariable(index, 'key', e.target.value)}
                    className="var-key"
                  />
                  <input
                    type="text"
                    placeholder="Variable value"
                    value={variable.value}
                    onChange={(e) => updateVariable(index, 'value', e.target.value)}
                    className="var-value"
                  />
                  <button
                    className="btn-small btn-danger"
                    onClick={() => removeVariable(index)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Save Template Section */}
          <div className="eg-section">
            <h3>Save Current as Template</h3>
            {!showTemplateForm ? (
              <button 
                className="btn btn-secondary"
                onClick={() => setShowTemplateForm(true)}
              >
                Save as Template
              </button>
            ) : (
              <div className="template-form">
                <input
                  type="text"
                  placeholder="Template name (e.g., Production Setup)"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="template-input"
                />
                <div className="form-actions">
                  <button 
                    className="btn btn-success"
                    onClick={saveTemplate}
                  >
                    Save
                  </button>
                  <button 
                    className="btn btn-default"
                    onClick={() => setShowTemplateForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview & Download Section */}
      <div className="eg-preview-section">
        <div className="eg-section">
          <h3>.env File Preview (.env.{selectedFolder})</h3>
          <div className="env-preview">
            <pre>{envContent}</pre>
          </div>

          <div className="preview-actions">
            <button 
              className="btn btn-info"
              onClick={copyToClipboard}
            >
              📋 Copy to Clipboard
            </button>
            <button 
              className="btn btn-success"
              onClick={downloadEnvFile}
            >
              📥 Download .env.{selectedFolder}
            </button>
            <button 
              className="btn btn-primary"
              onClick={downloadAllEnvFiles}
            >
              📦 Download All 3 Folders
            </button>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="eg-help">
        <h3>💡 Tips & Help</h3>
        <ul>
          <li><strong>Quick Template:</strong> Click "Insert {selectedFolder} Template" to add common variables for the current folder</li>
          <li><strong>Save Template:</strong> Save your current variables as a template for future use</li>
          <li><strong>Multiple Folders:</strong> Switch between Backend, Admin, and Mobile tabs to create environment files for each</li>
          <li><strong>Download All:</strong> Use "Download All 3 Folders" to get .env files for all sections at once</li>
          <li><strong>Import/Export:</strong> Backup your settings as JSON for easy restoration</li>
          <li><strong>Special Characters:</strong> Values with spaces or special characters are automatically quoted</li>
          <li><strong>Comments:</strong> Comments in the generated .env files help identify variables</li>
        </ul>
      </div>
    </div>
  );
};

export default EnvFileGenerator;
