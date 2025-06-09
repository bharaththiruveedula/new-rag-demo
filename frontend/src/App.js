import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [connectionStatuses, setConnectionStatuses] = useState([]);
  const [config, setConfig] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [vectorizationStatus, setVectorizationStatus] = useState(null);
  const [analytics, setAnalytics] = useState({
    totalSuggestions: 0,
    avgConfidence: 0,
    successfulMRs: 0,
    processingTime: 0
  });
  const [searchResults, setSearchResults] = useState([]);
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

  const performCodeSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/search/code?query=${encodeURIComponent(searchQuery)}`);
      
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results.results || []);
      }
    } catch (error) {
      console.error('Failed to search code:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
        return '●';
      case 'error':
        return '●';
      case 'not_configured':
        return '●';
      default:
        return '●';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
        return 'text-emerald-500';
      case 'error':
        return 'text-red-500';
      case 'not_configured':
        return 'text-amber-500';
      default:
        return 'text-gray-400';
    }
  };

  // Dashboard Tab (combines status and analytics)
  const DashboardTab = () => (
    <div className="space-y-12">
      {/* Hero Section - Clean and Minimal */}
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-light text-gray-900 tracking-tight">
          RAG Assistant
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Intelligent code analysis and suggestions powered by advanced AI technology
        </p>
      </div>

      {/* System Status - Swiss Grid Layout */}
      <div className="space-y-8">
        <h2 className="text-3xl font-light text-gray-900 border-b border-gray-200 pb-4">
          System Status
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {connectionStatuses.map((status) => (
            <div key={status.service} className="bg-white border border-gray-200 p-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 capitalize">
                  {status.service}
                </h3>
                <span className={`text-2xl ${getStatusColor(status.status)}`}>
                  {getStatusIcon(status.status)}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className={`text-sm font-medium ${getStatusColor(status.status)}`}>
                  {status.status.replace('_', ' ').toUpperCase()}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {status.message}
                </p>
                {status.response_time_ms && (
                  <div className="text-xs text-gray-400">
                    {status.response_time_ms.toFixed(0)}ms
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center pt-8">
          <button
            onClick={checkAllConnections}
            disabled={isLoading}
            className="px-8 py-3 bg-black text-white font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Checking...' : 'Refresh Status'}
          </button>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="space-y-8">
        <h2 className="text-3xl font-light text-gray-900 border-b border-gray-200 pb-4">
          Analytics
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { title: 'Total Suggestions', value: analytics.totalSuggestions, unit: '' },
            { title: 'Avg Confidence', value: analytics.avgConfidence, unit: '%' },
            { title: 'Successful MRs', value: analytics.successfulMRs, unit: '' },
            { title: 'Processing Time', value: analytics.processingTime, unit: 's' },
          ].map((metric, index) => (
            <div key={index} className="bg-white border border-gray-200 p-8 text-center space-y-4">
              <div className="text-4xl font-light text-gray-900">
                {metric.value}{metric.unit}
              </div>
              <div className="text-sm text-gray-600 font-medium">
                {metric.title}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Search Tab - Clean Swiss Design
  const SearchTab = () => (
    <div className="space-y-12">
      <div className="space-y-6">
        <h1 className="text-4xl font-light text-gray-900 tracking-tight">
          Code Search
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl leading-relaxed">
          Search your codebase using natural language and semantic similarity
        </p>
      </div>

      {/* Search Interface */}
      <div className="bg-white border border-gray-200 p-8 space-y-6">
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-900">
            Search Query
          </label>
          <div className="flex space-x-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g., ansible module for file operations"
              className="flex-1 px-4 py-3 border border-gray-300 focus:border-black focus:outline-none text-gray-900"
              onKeyPress={(e) => e.key === 'Enter' && performCodeSearch()}
            />
            <button
              onClick={performCodeSearch}
              disabled={isLoading || !searchQuery.trim()}
              className="px-8 py-3 bg-black text-white font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-8">
          <h2 className="text-2xl font-light text-gray-900">
            {searchResults.length} Results for "{searchQuery}"
          </h2>
          
          <div className="space-y-6">
            {searchResults.map((result, index) => (
              <div key={index} className="bg-white border border-gray-200 p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium text-gray-900">
                      {result.file_path}
                    </h3>
                    <div className="text-sm text-gray-600 space-x-6">
                      <span>Similarity: {(result.similarity * 100).toFixed(1)}%</span>
                      <span>Language: {result.language}</span>
                      {result.function_name && (
                        <span>Function: {result.function_name}</span>
                      )}
                    </div>
                  </div>
                  <div className={`px-3 py-1 text-xs font-medium ${
                    result.similarity > 0.8 ? 'bg-emerald-100 text-emerald-800' :
                    result.similarity > 0.6 ? 'bg-amber-100 text-amber-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {result.similarity > 0.8 ? 'High Match' :
                     result.similarity > 0.6 ? 'Good Match' : 'Low Match'}
                  </div>
                </div>
                
                <div className="bg-gray-50 p-6 border-l-4 border-gray-300">
                  <pre className="text-sm text-gray-800 font-mono leading-relaxed overflow-x-auto">
                    {result.content}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {searchResults.length === 0 && searchQuery && !isLoading && (
        <div className="text-center py-12 space-y-4">
          <p className="text-lg text-gray-600">No results found for "{searchQuery}"</p>
          <p className="text-sm text-gray-500">
            Try different search terms or ensure your repository has been vectorized
          </p>
        </div>
      )}

      {/* Search Tips */}
      {!searchQuery && (
        <div className="bg-gray-50 border border-gray-200 p-8 space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Search Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Natural Language</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• "file upload functions"</li>
                <li>• "error handling code"</li>
                <li>• "database connection logic"</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Technical Terms</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• "ansible module"</li>
                <li>• "API endpoints"</li>
                <li>• "configuration management"</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Vectorization Tab - Minimal Design
  const VectorizationTab = () => (
    <div className="space-y-12">
      <div className="space-y-6">
        <h1 className="text-4xl font-light text-gray-900 tracking-tight">
          Repository Vectorization
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl leading-relaxed">
          Process and index your codebase for semantic search capabilities
        </p>
      </div>

      <div className="bg-white border border-gray-200 p-8 space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-light text-gray-900">Processing Status</h2>
          <div className="space-x-4">
            <button
              onClick={getVectorizationStatus}
              className="px-6 py-2 border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={startVectorization}
              disabled={isLoading}
              className="px-6 py-2 bg-black text-white font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Start Vectorization'}
            </button>
          </div>
        </div>

        {vectorizationStatus && (
          <div className="space-y-8">
            {/* Progress Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center space-y-2">
                <div className="text-3xl font-light text-gray-900">
                  {vectorizationStatus.total_files}
                </div>
                <div className="text-sm text-gray-600">Total Files</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-light text-emerald-600">
                  {vectorizationStatus.processed_files}
                </div>
                <div className="text-sm text-gray-600">Processed</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-light text-red-600">
                  {vectorizationStatus.failed_files}
                </div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div className="text-center space-y-2">
                <div className={`text-3xl font-light ${
                  vectorizationStatus.status === 'completed' ? 'text-emerald-600' : 
                  vectorizationStatus.status === 'in_progress' ? 'text-amber-600' : 'text-gray-400'
                }`}>
                  {vectorizationStatus.status === 'completed' ? '✓' :
                   vectorizationStatus.status === 'in_progress' ? '⟳' : '⏸'}
                </div>
                <div className="text-sm text-gray-600">
                  {vectorizationStatus.status.replace('_', ' ').toUpperCase()}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            {vectorizationStatus.total_files > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Progress</span>
                  <span>
                    {((vectorizationStatus.processed_files / vectorizationStatus.total_files) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 h-2">
                  <div 
                    className="bg-black h-2 transition-all duration-500"
                    style={{ 
                      width: `${(vectorizationStatus.processed_files / vectorizationStatus.total_files) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
            )}

            {/* Details */}
            {vectorizationStatus.details && vectorizationStatus.details.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Processing Details</h3>
                <div className="bg-gray-50 p-6 space-y-2">
                  {vectorizationStatus.details.map((detail, index) => (
                    <div key={index} className="text-sm text-gray-700">
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

  // Configuration Tab - Clean Form Design
  const ConfigurationTab = () => (
    <div className="space-y-12">
      <div className="space-y-6">
        <h1 className="text-4xl font-light text-gray-900 tracking-tight">
          Configuration
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl leading-relaxed">
          Configure your external integrations and AI models
        </p>
      </div>
      
      <div className="space-y-12">
        {/* OLLAMA Configuration */}
        <div className="bg-white border border-gray-200 p-8 space-y-6">
          <h2 className="text-2xl font-light text-gray-900 border-b border-gray-200 pb-4">
            OLLAMA AI
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900">OLLAMA URL</label>
              <input
                type="text"
                value={config.ollama_url || ''}
                onChange={(e) => setConfig({...config, ollama_url: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 focus:border-black focus:outline-none text-gray-900"
                placeholder="http://localhost:11434"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900">Model Name</label>
              <select
                value={config.ollama_model || ''}
                onChange={(e) => setConfig({...config, ollama_model: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 focus:border-black focus:outline-none text-gray-900"
              >
                <option value="">Select Model</option>
                <option value="codellama">CodeLlama</option>
                <option value="codellama:13b">CodeLlama 13B</option>
                <option value="codellama:34b">CodeLlama 34B</option>
                <option value="deepseek-coder">DeepSeek Coder</option>
              </select>
            </div>
          </div>
        </div>

        {/* GitLab Configuration */}
        <div className="bg-white border border-gray-200 p-8 space-y-6">
          <h2 className="text-2xl font-light text-gray-900 border-b border-gray-200 pb-4">
            GitLab
          </h2>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900">GitLab URL</label>
              <input
                type="text"
                value={config.gitlab_url || ''}
                onChange={(e) => setConfig({...config, gitlab_url: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 focus:border-black focus:outline-none text-gray-900"
                placeholder="https://gitlab.example.com"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900">Access Token</label>
              <input
                type="password"
                value={config.gitlab_token || ''}
                onChange={(e) => setConfig({...config, gitlab_token: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 focus:border-black focus:outline-none text-gray-900"
                placeholder="glpat-xxxxxxxxxxxxxxxxxxxx"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900">Target Repository</label>
              <input
                type="text"
                value={config.target_repository || ''}
                onChange={(e) => setConfig({...config, target_repository: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 focus:border-black focus:outline-none text-gray-900"
                placeholder="group/ansible-automation"
              />
            </div>
          </div>
        </div>

        {/* JIRA Configuration */}
        <div className="bg-white border border-gray-200 p-8 space-y-6">
          <h2 className="text-2xl font-light text-gray-900 border-b border-gray-200 pb-4">
            JIRA
          </h2>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900">JIRA URL</label>
              <input
                type="text"
                value={config.jira_url || ''}
                onChange={(e) => setConfig({...config, jira_url: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 focus:border-black focus:outline-none text-gray-900"
                placeholder="https://company.atlassian.net"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900">Username/Email</label>
              <input
                type="text"
                value={config.jira_username || ''}
                onChange={(e) => setConfig({...config, jira_username: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 focus:border-black focus:outline-none text-gray-900"
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900">API Token</label>
              <input
                type="password"
                value={config.jira_token || ''}
                onChange={(e) => setConfig({...config, jira_token: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 focus:border-black focus:outline-none text-gray-900"
                placeholder="API token from JIRA settings"
              />
            </div>
          </div>
        </div>

        {/* PostgreSQL Configuration */}
        <div className="bg-white border border-gray-200 p-8 space-y-6">
          <h2 className="text-2xl font-light text-gray-900 border-b border-gray-200 pb-4">
            PostgreSQL + pgvector
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900">Host</label>
              <input
                type="text"
                value={config.postgres_host || ''}
                onChange={(e) => setConfig({...config, postgres_host: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 focus:border-black focus:outline-none text-gray-900"
                placeholder="localhost"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900">Port</label>
              <input
                type="number"
                value={config.postgres_port || ''}
                onChange={(e) => setConfig({...config, postgres_port: parseInt(e.target.value)})}
                className="w-full px-4 py-3 border border-gray-300 focus:border-black focus:outline-none text-gray-900"
                placeholder="5432"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900">Database</label>
              <input
                type="text"
                value={config.postgres_db || ''}
                onChange={(e) => setConfig({...config, postgres_db: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 focus:border-black focus:outline-none text-gray-900"
                placeholder="vector_db"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900">Username</label>
              <input
                type="text"
                value={config.postgres_user || ''}
                onChange={(e) => setConfig({...config, postgres_user: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 focus:border-black focus:outline-none text-gray-900"
                placeholder="postgres"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900">Password</label>
              <input
                type="password"
                value={config.postgres_password || ''}
                onChange={(e) => setConfig({...config, postgres_password: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 focus:border-black focus:outline-none text-gray-900"
                placeholder="Enter password"
              />
            </div>
          </div>
        </div>

        <div className="text-center pt-8">
          <button
            onClick={() => updateConfiguration(config)}
            disabled={isLoading}
            className="px-12 py-3 bg-black text-white font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Clean Header - Swiss Design */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-black"></div>
              <h1 className="text-xl font-medium text-gray-900">RAG Assistant</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Clean Navigation */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex space-x-12">
            {[
              { id: 'dashboard', name: 'Dashboard' },
              { id: 'search', name: 'Search' },
              { id: 'vectorization', name: 'Vectorization' },
              { id: 'config', name: 'Configuration' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-black text-gray-900'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-12">
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'search' && <SearchTab />}
        {activeTab === 'vectorization' && <VectorizationTab />}
        {activeTab === 'config' && <ConfigurationTab />}
      </main>
    </div>
  );
}

export default App;
