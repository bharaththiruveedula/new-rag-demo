import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function App() {
  const [activeTab, setActiveTab] = useState('connections');
  const [connectionStatuses, setConnectionStatuses] = useState([]);
  const [config, setConfig] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [jiraTicketId, setJiraTicketId] = useState('');
  const [codeSuggestion, setCodeSuggestion] = useState(null);
  const [vectorizationStatus, setVectorizationStatus] = useState(null);

  // Load configuration on component mount
  useEffect(() => {
    loadConfiguration();
    checkAllConnections();
  }, []);

  const loadConfiguration = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/config`);
      if (response.ok) {
        const configData = await response.json();
        setConfig(configData);
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
    }
  };

  const updateConfiguration = async (updates) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (response.ok) {
        const updatedConfig = await response.json();
        setConfig(updatedConfig);
        // Re-check connections after config update
        await checkAllConnections();
      }
    } catch (error) {
      console.error('Failed to update configuration:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAllConnections = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/status/all`);
      if (response.ok) {
        const statuses = await response.json();
        setConnectionStatuses(statuses);
      }
    } catch (error) {
      console.error('Failed to check connections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startVectorization = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/vectorize/repository`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const status = await response.json();
        setVectorizationStatus(status);
      }
    } catch (error) {
      console.error('Failed to start vectorization:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getVectorizationStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/vectorize/status`);
      if (response.ok) {
        const status = await response.json();
        setVectorizationStatus(status);
      }
    } catch (error) {
      console.error('Failed to get vectorization status:', error);
    }
  };

  const generateCodeSuggestion = async () => {
    if (!jiraTicketId.trim()) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/suggest/code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ticket_id: jiraTicketId }),
      });
      
      if (response.ok) {
        const suggestion = await response.json();
        setCodeSuggestion(suggestion);
      }
    } catch (error) {
      console.error('Failed to generate code suggestion:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createMergeRequest = async () => {
    if (!jiraTicketId.trim()) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/gitlab/merge-request?ticket_id=${jiraTicketId}`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`Merge request created: ${result.merge_request_url}`);
      }
    } catch (error) {
      console.error('Failed to create merge request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
        return '✅';
      case 'error':
        return '❌';
      case 'not_configured':
        return '⚠️';
      default:
        return '⚪';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'not_configured':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const ConfigurationTab = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Service Configuration</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* OLLAMA Configuration */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-purple-700">OLLAMA Configuration</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">OLLAMA URL</label>
              <input
                type="text"
                value={config.ollama_url || ''}
                onChange={(e) => setConfig({...config, ollama_url: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                placeholder="http://localhost:11434"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Model Name</label>
              <input
                type="text"
                value={config.ollama_model || ''}
                onChange={(e) => setConfig({...config, ollama_model: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                placeholder="codellama"
              />
            </div>
          </div>
        </div>

        {/* GitLab Configuration */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-orange-700">GitLab Configuration</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">GitLab URL</label>
              <input
                type="text"
                value={config.gitlab_url || ''}
                onChange={(e) => setConfig({...config, gitlab_url: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                placeholder="https://gitlab.example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Access Token</label>
              <input
                type="password"
                value={config.gitlab_token || ''}
                onChange={(e) => setConfig({...config, gitlab_token: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                placeholder="Enter GitLab token"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Target Repository</label>
              <input
                type="text"
                value={config.target_repository || ''}
                onChange={(e) => setConfig({...config, target_repository: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                placeholder="group/repository-name"
              />
            </div>
          </div>
        </div>

        {/* JIRA Configuration */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-blue-700">JIRA Configuration</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">JIRA URL</label>
              <input
                type="text"
                value={config.jira_url || ''}
                onChange={(e) => setConfig({...config, jira_url: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="https://jira.example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <input
                type="text"
                value={config.jira_username || ''}
                onChange={(e) => setConfig({...config, jira_username: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="your-username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">API Token</label>
              <input
                type="password"
                value={config.jira_token || ''}
                onChange={(e) => setConfig({...config, jira_token: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter JIRA token"
              />
            </div>
          </div>
        </div>

        {/* PostgreSQL Configuration */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-green-700">PostgreSQL Configuration</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Host</label>
                <input
                  type="text"
                  value={config.postgres_host || ''}
                  onChange={(e) => setConfig({...config, postgres_host: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  placeholder="localhost"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Port</label>
                <input
                  type="number"
                  value={config.postgres_port || ''}
                  onChange={(e) => setConfig({...config, postgres_port: parseInt(e.target.value)})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  placeholder="5432"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Database</label>
              <input
                type="text"
                value={config.postgres_db || ''}
                onChange={(e) => setConfig({...config, postgres_db: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                placeholder="vector_db"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <input
                type="text"
                value={config.postgres_user || ''}
                onChange={(e) => setConfig({...config, postgres_user: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                placeholder="postgres"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={config.postgres_password || ''}
                onChange={(e) => setConfig({...config, postgres_password: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                placeholder="Enter password"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => updateConfiguration(config)}
          disabled={isLoading}
          className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );

  const ConnectionsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Connection Status</h2>
        <button
          onClick={checkAllConnections}
          disabled={isLoading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Checking...' : 'Refresh All'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {connectionStatuses.map((status) => (
          <div key={status.service} className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold capitalize">{status.service}</h3>
              <span className="text-2xl">{getStatusIcon(status.status)}</span>
            </div>
            
            <div className={`text-sm font-medium mb-2 ${getStatusColor(status.status)}`}>
              Status: {status.status.replace('_', ' ').toUpperCase()}
            </div>
            
            <p className="text-gray-600 text-sm mb-3">{status.message}</p>
            
            {status.response_time_ms && (
              <p className="text-gray-500 text-xs">
                Response time: {status.response_time_ms.toFixed(0)}ms
              </p>
            )}
            
            {status.details && (
              <div className="mt-3 p-3 bg-gray-50 rounded text-xs">
                <pre>{JSON.stringify(status.details, null, 2)}</pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const VectorizationTab = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Repository Vectorization</h2>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Vectorization Status</h3>
          <div className="space-x-2">
            <button
              onClick={getVectorizationStatus}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Refresh Status
            </button>
            <button
              onClick={startVectorization}
              disabled={isLoading}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? 'Starting...' : 'Start Vectorization'}
            </button>
          </div>
        </div>

        {vectorizationStatus && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{vectorizationStatus.total_files}</div>
                <div className="text-sm text-gray-600">Total Files</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{vectorizationStatus.processed_files}</div>
                <div className="text-sm text-gray-600">Processed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{vectorizationStatus.failed_files}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${vectorizationStatus.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {vectorizationStatus.status.toUpperCase()}
                </div>
                <div className="text-sm text-gray-600">Status</div>
              </div>
            </div>

            {vectorizationStatus.details && vectorizationStatus.details.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Details:</h4>
                <div className="bg-gray-50 p-3 rounded">
                  {vectorizationStatus.details.map((detail, index) => (
                    <div key={index} className="text-sm text-gray-700">{detail}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const CodeSuggestionsTab = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Code Suggestions</h2>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Generate Code Suggestions</h3>
        
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            value={jiraTicketId}
            onChange={(e) => setJiraTicketId(e.target.value)}
            placeholder="Enter JIRA Ticket ID (e.g., PROJ-123)"
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
          <button
            onClick={generateCodeSuggestion}
            disabled={isLoading || !jiraTicketId.trim()}
            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? 'Generating...' : 'Generate Suggestion'}
          </button>
        </div>

        {codeSuggestion && (
          <div className="space-y-4">
            <div className="border-l-4 border-indigo-400 pl-4">
              <h4 className="font-semibold text-lg">Code Suggestion for {codeSuggestion.ticket_id}</h4>
              <p className="text-gray-600 text-sm">Confidence: {(codeSuggestion.confidence_score * 100).toFixed(1)}%</p>
              <p className="text-gray-600 text-sm">File: {codeSuggestion.file_path}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded">
              <h5 className="font-semibold mb-2">Explanation:</h5>
              <p className="text-gray-700">{codeSuggestion.explanation}</p>
            </div>

            <div className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto">
              <h5 className="font-semibold mb-2 text-green-400">Suggested Code:</h5>
              <pre className="text-sm"><code>{codeSuggestion.suggested_code}</code></pre>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={createMergeRequest}
                disabled={isLoading}
                className="bg-orange-600 text-white px-6 py-2 rounded-md hover:bg-orange-700 disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Create Merge Request'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">RAG Code Suggestion System</h1>
              <p className="text-gray-600">AI-powered code suggestions for JIRA tickets</p>
            </div>
            <div className="text-sm text-gray-500">
              Ansible Repository Assistant
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'connections', name: 'Connection Status', icon: '🔗' },
              { id: 'config', name: 'Configuration', icon: '⚙️' },
              { id: 'vectorization', name: 'Vectorization', icon: '📊' },
              { id: 'suggestions', name: 'Code Suggestions', icon: '💡' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  console.log('Tab clicked:', tab.id);
                  setActiveTab(tab.id);
                }}
                className={`flex items-center space-x-2 py-2 px-4 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-indigo-100 text-indigo-700 border-b-2 border-indigo-700'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div>
          {activeTab === 'connections' && <ConnectionsTab />}
          {activeTab === 'config' && <ConfigurationTab />}
          {activeTab === 'vectorization' && <VectorizationTab />}
          {activeTab === 'suggestions' && <CodeSuggestionsTab />}
        </div>
      </div>
    </div>
  );
}

export default App;
