import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [connectionStatuses, setConnectionStatuses] = useState([]);
  const [config, setConfig] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [jiraTicketId, setJiraTicketId] = useState('');
  const [codeSuggestion, setCodeSuggestion] = useState(null);
  const [vectorizationStatus, setVectorizationStatus] = useState(null);
  const [analytics, setAnalytics] = useState({
    totalSuggestions: 0,
    avgConfidence: 0,
    successfulMRs: 0,
    processingTime: 0
  });
  const [suggestions, setSuggestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Load configuration and data on component mount
  useEffect(() => {
    loadConfiguration();
    checkAllConnections();
    loadAnalytics();
    getVectorizationStatus();
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

  const loadAnalytics = async () => {
    // Mock analytics data - in real implementation, this would come from the backend
    setAnalytics({
      totalSuggestions: 247,
      avgConfidence: 87.3,
      successfulMRs: 156,
      processingTime: 2.4
    });
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
        setSuggestions(prev => [suggestion, ...prev.slice(0, 4)]);
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
        alert(`🚀 Merge request created successfully!\n${result.merge_request_url}`);
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
        return '🟢';
      case 'error':
        return '🔴';
      case 'not_configured':
        return '🟡';
      default:
        return '⚪';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
        return 'text-emerald-400';
      case 'error':
        return 'text-red-400';
      case 'not_configured':
        return 'text-amber-400';
      default:
        return 'text-slate-400';
    }
  };

  // Modern Dashboard Component
  const DashboardTab = () => (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-8">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1652449823136-b279fbe5dfd3')] bg-cover bg-center opacity-20"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                AI Code Assistant
              </h1>
              <p className="text-xl text-indigo-200">
                Intelligent code suggestions powered by RAG technology
              </p>
            </div>
            <div className="glass-card p-6 text-center">
              <div className="text-3xl font-bold text-white">
                {analytics.totalSuggestions}
              </div>
              <div className="text-sm text-indigo-200">
                Suggestions Generated
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-4 right-4 w-32 h-32 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full opacity-20 blur-xl"></div>
        <div className="absolute bottom-4 left-4 w-24 h-24 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full opacity-20 blur-xl"></div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Avg Confidence', value: `${analytics.avgConfidence}%`, icon: '🎯', color: 'from-emerald-500 to-teal-600' },
          { title: 'Successful MRs', value: analytics.successfulMRs, icon: '🚀', color: 'from-blue-500 to-indigo-600' },
          { title: 'Processing Time', value: `${analytics.processingTime}s`, icon: '⚡', color: 'from-amber-500 to-orange-600' },
          { title: 'Success Rate', value: '94.2%', icon: '📈', color: 'from-purple-500 to-pink-600' },
        ].map((stat, index) => (
          <div key={index} className="glass-card p-6 hover:scale-105 transition-all duration-300">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-2xl mb-4`}>
              {stat.icon}
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {stat.value}
            </div>
            <div className="text-sm text-slate-400">
              {stat.title}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={() => setActiveTab('suggestions')}
            className="modern-button bg-gradient-to-r from-indigo-500 to-purple-600"
          >
            💡 Generate Code
          </button>
          <button 
            onClick={() => setActiveTab('vectorization')}
            className="modern-button bg-gradient-to-r from-emerald-500 to-teal-600"
          >
            📊 Vectorize Repo
          </button>
          <button 
            onClick={() => setActiveTab('connections')}
            className="modern-button bg-gradient-to-r from-amber-500 to-orange-600"
          >
            🔗 Check Status
          </button>
          <button 
            onClick={() => setActiveTab('config')}
            className="modern-button bg-gradient-to-r from-pink-500 to-rose-600"
          >
            ⚙️ Configure
          </button>
        </div>
      </div>

      {/* Recent Suggestions */}
      {suggestions.length > 0 && (
        <div className="glass-card p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Recent Suggestions</h2>
          <div className="space-y-4">
            {suggestions.slice(0, 3).map((suggestion, index) => (
              <div key={index} className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-indigo-400 font-semibold">{suggestion.ticket_id}</span>
                  <span className="text-emerald-400 text-sm">
                    {(suggestion.confidence_score * 100).toFixed(1)}% confidence
                  </span>
                </div>
                <p className="text-slate-300 text-sm mb-3">{suggestion.explanation}</p>
                <div className="text-xs text-slate-500">{suggestion.file_path}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Enhanced Configuration Tab
  const ConfigurationTab = () => (
    <div className="space-y-8">
      <div className="glass-card p-8">
        <h2 className="text-3xl font-bold text-white mb-2">Service Configuration</h2>
        <p className="text-slate-400 mb-8">Configure your external integrations and AI models</p>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* OLLAMA Configuration */}
          <div className="config-section">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-2xl mr-4">
                🧠
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">OLLAMA AI</h3>
                <p className="text-slate-400 text-sm">Local language model configuration</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">OLLAMA URL</label>
                <input
                  type="text"
                  value={config.ollama_url || ''}
                  onChange={(e) => setConfig({...config, ollama_url: e.target.value})}
                  className="modern-input"
                  placeholder="http://localhost:11434"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Model Name</label>
                <select
                  value={config.ollama_model || ''}
                  onChange={(e) => setConfig({...config, ollama_model: e.target.value})}
                  className="modern-input"
                >
                  <option value="">Select Model</option>
                  <option value="codellama">CodeLlama</option>
                  <option value="codellama:13b">CodeLlama 13B</option>
                  <option value="codellama:34b">CodeLlama 34B</option>
                  <option value="deepseek-coder">DeepSeek Coder</option>
                  <option value="magicoder">MagiCoder</option>
                </select>
              </div>
            </div>
          </div>

          {/* GitLab Configuration */}
          <div className="config-section">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-2xl mr-4">
                🦊
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">GitLab</h3>
                <p className="text-slate-400 text-sm">Source code repository integration</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">GitLab URL</label>
                <input
                  type="text"
                  value={config.gitlab_url || ''}
                  onChange={(e) => setConfig({...config, gitlab_url: e.target.value})}
                  className="modern-input"
                  placeholder="https://gitlab.example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Access Token</label>
                <input
                  type="password"
                  value={config.gitlab_token || ''}
                  onChange={(e) => setConfig({...config, gitlab_token: e.target.value})}
                  className="modern-input"
                  placeholder="glpat-xxxxxxxxxxxxxxxxxxxx"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Target Repository</label>
                <input
                  type="text"
                  value={config.target_repository || ''}
                  onChange={(e) => setConfig({...config, target_repository: e.target.value})}
                  className="modern-input"
                  placeholder="group/ansible-automation"
                />
              </div>
            </div>
          </div>

          {/* JIRA Configuration */}
          <div className="config-section">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-2xl mr-4">
                📋
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">JIRA</h3>
                <p className="text-slate-400 text-sm">Issue tracking integration</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">JIRA URL</label>
                <input
                  type="text"
                  value={config.jira_url || ''}
                  onChange={(e) => setConfig({...config, jira_url: e.target.value})}
                  className="modern-input"
                  placeholder="https://company.atlassian.net"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Username/Email</label>
                <input
                  type="text"
                  value={config.jira_username || ''}
                  onChange={(e) => setConfig({...config, jira_username: e.target.value})}
                  className="modern-input"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">API Token</label>
                <input
                  type="password"
                  value={config.jira_token || ''}
                  onChange={(e) => setConfig({...config, jira_token: e.target.value})}
                  className="modern-input"
                  placeholder="API token from JIRA settings"
                />
              </div>
            </div>
          </div>

          {/* PostgreSQL Configuration */}
          <div className="config-section">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-2xl mr-4">
                🐘
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">PostgreSQL + pgvector</h3>
                <p className="text-slate-400 text-sm">Vector database for semantic search</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Host</label>
                  <input
                    type="text"
                    value={config.postgres_host || ''}
                    onChange={(e) => setConfig({...config, postgres_host: e.target.value})}
                    className="modern-input"
                    placeholder="localhost"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Port</label>
                  <input
                    type="number"
                    value={config.postgres_port || ''}
                    onChange={(e) => setConfig({...config, postgres_port: parseInt(e.target.value)})}
                    className="modern-input"
                    placeholder="5432"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Database</label>
                <input
                  type="text"
                  value={config.postgres_db || ''}
                  onChange={(e) => setConfig({...config, postgres_db: e.target.value})}
                  className="modern-input"
                  placeholder="vector_db"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
                <input
                  type="text"
                  value={config.postgres_user || ''}
                  onChange={(e) => setConfig({...config, postgres_user: e.target.value})}
                  className="modern-input"
                  placeholder="postgres"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                <input
                  type="password"
                  value={config.postgres_password || ''}
                  onChange={(e) => setConfig({...config, postgres_password: e.target.value})}
                  className="modern-input"
                  placeholder="Enter password"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-8">
          <button
            onClick={() => updateConfiguration(config)}
            disabled={isLoading}
            className="modern-button bg-gradient-to-r from-indigo-500 to-purple-600 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>💾 Save Configuration</>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Enhanced Connection Status Tab
  const ConnectionsTab = () => (
    <div className="space-y-8">
      <div className="glass-card p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Service Status</h2>
            <p className="text-slate-400">Monitor your external integrations in real-time</p>
          </div>
          <button
            onClick={checkAllConnections}
            disabled={isLoading}
            className="modern-button bg-gradient-to-r from-cyan-500 to-blue-600"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Checking...
              </>
            ) : (
              <>🔄 Refresh All</>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {connectionStatuses.map((status) => (
            <div key={status.service} className="status-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${
                    status.service === 'ollama' ? 'from-purple-500 to-indigo-600' :
                    status.service === 'gitlab' ? 'from-orange-500 to-red-600' :
                    status.service === 'jira' ? 'from-blue-500 to-cyan-600' :
                    'from-emerald-500 to-green-600'
                  } flex items-center justify-center text-lg mr-3`}>
                    {status.service === 'ollama' ? '🧠' :
                     status.service === 'gitlab' ? '🦊' :
                     status.service === 'jira' ? '📋' : '🐘'}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold capitalize text-white">{status.service}</h3>
                    <p className="text-slate-400 text-sm">{
                      status.service === 'ollama' ? 'AI Language Model' :
                      status.service === 'gitlab' ? 'Source Control' :
                      status.service === 'jira' ? 'Issue Tracking' : 'Vector Database'
                    }</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-2xl mr-2">{getStatusIcon(status.status)}</span>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    status.status === 'connected' ? 'bg-emerald-500/20 text-emerald-400' :
                    status.status === 'error' ? 'bg-red-500/20 text-red-400' :
                    'bg-amber-500/20 text-amber-400'
                  }`}>
                    {status.status.replace('_', ' ').toUpperCase()}
                  </div>
                </div>
              </div>
              
              <p className="text-slate-300 text-sm mb-4">{status.message}</p>
              
              {status.response_time_ms && (
                <div className="flex items-center text-slate-500 text-xs mb-3">
                  <span className="mr-2">⚡</span>
                  Response time: {status.response_time_ms.toFixed(0)}ms
                </div>
              )}
              
              {status.details && (
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                  <pre className="text-xs text-slate-400 overflow-x-auto">
                    {JSON.stringify(status.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Enhanced Vectorization Tab  
  const VectorizationTab = () => (
    <div className="space-y-8">
      <div className="glass-card p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Repository Vectorization</h2>
            <p className="text-slate-400">Process and index your Ansible codebase for semantic search</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={getVectorizationStatus}
              className="modern-button bg-gradient-to-r from-slate-600 to-slate-700"
            >
              📊 Refresh Status
            </button>
            <button
              onClick={startVectorization}
              disabled={isLoading}
              className="modern-button bg-gradient-to-r from-emerald-500 to-teal-600"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>🚀 Start Vectorization</>
              )}
            </button>
          </div>
        </div>

        {vectorizationStatus && (
          <div className="space-y-6">
            {/* Progress Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="metric-card">
                <div className="text-3xl font-bold text-blue-400">{vectorizationStatus.total_files}</div>
                <div className="text-sm text-slate-400">Total Files</div>
                <div className="text-xs text-slate-500 mt-1">📁 Discovered</div>
              </div>
              <div className="metric-card">
                <div className="text-3xl font-bold text-emerald-400">{vectorizationStatus.processed_files}</div>
                <div className="text-sm text-slate-400">Processed</div>
                <div className="text-xs text-slate-500 mt-1">✅ Completed</div>
              </div>
              <div className="metric-card">
                <div className="text-3xl font-bold text-red-400">{vectorizationStatus.failed_files}</div>
                <div className="text-sm text-slate-400">Failed</div>
                <div className="text-xs text-slate-500 mt-1">❌ Errors</div>
              </div>
              <div className="metric-card">
                <div className={`text-3xl font-bold ${
                  vectorizationStatus.status === 'completed' ? 'text-emerald-400' : 
                  vectorizationStatus.status === 'in_progress' ? 'text-amber-400' : 'text-slate-400'
                }`}>
                  {vectorizationStatus.status === 'completed' ? '✨' :
                   vectorizationStatus.status === 'in_progress' ? '⚡' : '⏸️'}
                </div>
                <div className="text-sm text-slate-400">{vectorizationStatus.status.replace('_', ' ').toUpperCase()}</div>
                <div className="text-xs text-slate-500 mt-1">Current Status</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white font-semibold">Processing Progress</span>
                <span className="text-slate-400 text-sm">
                  {vectorizationStatus.total_files > 0 
                    ? ((vectorizationStatus.processed_files / vectorizationStatus.total_files) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill bg-gradient-to-r from-emerald-500 to-teal-600"
                  style={{ 
                    width: vectorizationStatus.total_files > 0 
                      ? `${(vectorizationStatus.processed_files / vectorizationStatus.total_files) * 100}%`
                      : '0%'
                  }}
                ></div>
              </div>
            </div>

            {/* Details */}
            {vectorizationStatus.details && vectorizationStatus.details.length > 0 && (
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                <h4 className="text-white font-semibold mb-4">Processing Details</h4>
                <div className="space-y-2">
                  {vectorizationStatus.details.map((detail, index) => (
                    <div key={index} className="flex items-center text-sm text-slate-300">
                      <span className="text-cyan-400 mr-2">→</span>
                      {detail}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // Enhanced Code Suggestions Tab
  const CodeSuggestionsTab = () => (
    <div className="space-y-8">
      <div className="glass-card p-8">
        <h2 className="text-3xl font-bold text-white mb-2">AI Code Suggestions</h2>
        <p className="text-slate-400 mb-8">Generate intelligent code suggestions from JIRA tickets</p>
        
        {/* Input Section */}
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-300 mb-2">JIRA Ticket ID</label>
              <input
                type="text"
                value={jiraTicketId}
                onChange={(e) => setJiraTicketId(e.target.value)}
                placeholder="e.g., PROJ-123, ANSIBLE-456"
                className="modern-input"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={generateCodeSuggestion}
                disabled={isLoading || !jiraTicketId.trim()}
                className="modern-button bg-gradient-to-r from-indigo-500 to-purple-600 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>✨ Generate Code</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Code Suggestion Display */}
        {codeSuggestion && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-2xl border border-indigo-500/30">
              <div>
                <h3 className="text-xl font-bold text-white">Code Suggestion for {codeSuggestion.ticket_id}</h3>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-emerald-400 text-sm font-semibold">
                    🎯 {(codeSuggestion.confidence_score * 100).toFixed(1)}% Confidence
                  </span>
                  <span className="text-slate-400 text-sm">
                    📁 {codeSuggestion.file_path}
                  </span>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={createMergeRequest}
                  disabled={isLoading}
                  className="modern-button bg-gradient-to-r from-emerald-500 to-teal-600"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating MR...
                    </>
                  ) : (
                    <>🚀 Create Merge Request</>
                  )}
                </button>
              </div>
            </div>

            {/* Explanation */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
              <h4 className="text-white font-semibold mb-3 flex items-center">
                <span className="mr-2">💡</span>
                Explanation
              </h4>
              <p className="text-slate-300 leading-relaxed">{codeSuggestion.explanation}</p>
            </div>

            {/* Code Display */}
            <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-700">
              <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
                <h4 className="text-white font-semibold flex items-center">
                  <span className="mr-2">🔧</span>
                  Suggested Code Changes
                </h4>
                <div className="flex space-x-2">
                  <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs">Python</span>
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">Ansible</span>
                </div>
              </div>
              <div className="p-6 overflow-x-auto">
                <pre className="text-sm text-slate-300 leading-relaxed">
                  <code>{codeSuggestion.suggested_code}</code>
                </pre>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center p-6 bg-slate-800/30 rounded-2xl border border-slate-700">
              <div className="text-slate-400 text-sm">
                ⏰ Generated {new Date(codeSuggestion.created_at).toLocaleString()}
              </div>
              <div className="flex space-x-3">
                <button className="modern-button bg-gradient-to-r from-slate-600 to-slate-700">
                  📋 Copy Code
                </button>
                <button className="modern-button bg-gradient-to-r from-amber-500 to-orange-600">
                  🔄 Regenerate
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-[url('https://images.unsplash.com/photo-1618397746666-63405ce5d015')] bg-cover bg-center opacity-5"></div>
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-indigo-900/20 to-purple-900/20"></div>
      
      {/* Header */}
      <header className="relative z-10 border-b border-slate-800/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl">
                🤖
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">RAG Code Assistant</h1>
                <p className="text-slate-400 text-sm">AI-Powered Development Automation</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="glass-card px-4 py-2">
                <span className="text-emerald-400 text-sm font-semibold">🟢 Online</span>
              </div>
              <button className="w-10 h-10 rounded-xl bg-slate-800/50 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                ⚙️
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-slate-800/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-8 overflow-x-auto">
            {[
              { id: 'dashboard', name: 'Dashboard', icon: '📊' },
              { id: 'suggestions', name: 'Code Suggestions', icon: '💡' },
              { id: 'search', name: 'Code Search', icon: '🔍' },
              { id: 'vectorization', name: 'Vectorization', icon: '📈' },
              { id: 'connections', name: 'Status', icon: '🔗' },
              { id: 'config', name: 'Configuration', icon: '⚙️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-3 font-medium transition-all duration-300 border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {activeTab === 'dashboard' && <DashboardTab />}
          {activeTab === 'suggestions' && <CodeSuggestionsTab />}
          {activeTab === 'vectorization' && <VectorizationTab />}
          {activeTab === 'connections' && <ConnectionsTab />}
          {activeTab === 'config' && <ConfigurationTab />}
        </div>
      </main>
    </div>
  );
}

export default App;
