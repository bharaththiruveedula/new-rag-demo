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
  const [jiraTicketId, setJiraTicketId] = useState('');
  const [codeSuggestion, setCodeSuggestion] = useState(null);

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
        // Show success message with proper feedback
        const message = `✅ Merge Request Created Successfully!\n\n` +
                       `Branch: ${result.branch_name}\n` +
                       `URL: ${result.merge_request_url}\n` +
                       `Changes: ${result.suggested_changes || 1} file(s)\n` +
                       `Confidence: ${result.confidence_score ? (result.confidence_score * 100).toFixed(1) + '%' : 'N/A'}`;
        
        alert(message);
      }
    } catch (error) {
      console.error('Failed to create merge request:', error);
      alert('❌ Failed to create merge request. Please check your GitLab configuration.');
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

  const formatAsGitDiff = (suggestion) => {
    if (!suggestion || !suggestion.suggested_changes || suggestion.suggested_changes.length === 0) {
      return suggestion?.suggested_code || '';
    }

    const change = suggestion.suggested_changes[0];
    const lines = change.content.split('\n');
    
    return `diff --git a/${change.file_path} b/${change.file_path}
new file mode 100644
index 0000000..${Math.random().toString(36).substr(2, 7)}
--- /dev/null
+++ b/${change.file_path}
@@ -0,0 +1,${lines.length} @@
${lines.map(line => '+' + line).join('\n')}`;
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

  // Code Suggestions Tab - Core Feature
  const CodeSuggestionsTab = () => (
    <div className="space-y-12">
      <div className="space-y-6">
        <h1 className="text-4xl font-light text-gray-900 tracking-tight">
          Code Suggestions
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl leading-relaxed">
          Generate intelligent code suggestions from JIRA tickets using AI-powered analysis
        </p>
      </div>

      {/* Input Section */}
      <div className="bg-white border border-gray-200 p-8 space-y-6">
        <h2 className="text-2xl font-light text-gray-900 border-b border-gray-200 pb-4">
          Generate Code Suggestion
        </h2>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900">
              JIRA Ticket ID
            </label>
            <div className="flex space-x-4">
              <input
                type="text"
                value={jiraTicketId}
                onChange={(e) => setJiraTicketId(e.target.value)}
                placeholder="e.g., PROJ-123, ANSIBLE-456"
                className="flex-1 px-4 py-3 border border-gray-300 focus:border-black focus:outline-none text-gray-900"
              />
              <button
                onClick={generateCodeSuggestion}
                disabled={isLoading || !jiraTicketId.trim()}
                className="px-8 py-3 bg-black text-white font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Generating...' : 'Generate Code'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Code Suggestion Display */}
      {codeSuggestion && (
        <div className="space-y-8">
          {/* Suggestion Header */}
          <div className="bg-white border border-gray-200 p-8 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <h2 className="text-2xl font-light text-gray-900">
                  Code Suggestion for {codeSuggestion.ticket_id}
                </h2>
                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  <span>
                    Confidence: <strong>{(codeSuggestion.confidence_score * 100).toFixed(1)}%</strong>
                  </span>
                  {codeSuggestion.suggested_changes && codeSuggestion.suggested_changes.length > 0 && (
                    <span>
                      File: <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {codeSuggestion.suggested_changes[0].file_path}
                      </code>
                    </span>
                  )}
                  {codeSuggestion.processing_time_ms && (
                    <span>
                      Processing: {(codeSuggestion.processing_time_ms / 1000).toFixed(2)}s
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={createMergeRequest}
                disabled={isLoading}
                className="px-6 py-2 bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Create Merge Request'}
              </button>
            </div>
          </div>

          {/* Explanation */}
          <div className="bg-white border border-gray-200 p-8 space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Explanation</h3>
            <p className="text-gray-700 leading-relaxed">
              {codeSuggestion.explanation}
            </p>
          </div>

          {/* Similar Code Snippets */}
          {codeSuggestion.similar_code_snippets && codeSuggestion.similar_code_snippets.length > 0 && (
            <div className="bg-white border border-gray-200 p-8 space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Similar Code References</h3>
              <div className="space-y-4">
                {codeSuggestion.similar_code_snippets.map((snippet, index) => (
                  <div key={index} className="border border-gray-100 p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <code className="text-sm text-gray-800">{snippet.file_path}</code>
                      <span className="text-xs text-gray-500">
                        {(snippet.similarity_score * 100).toFixed(1)}% similarity
                      </span>
                    </div>
                    <pre className="text-xs text-gray-600 bg-gray-50 p-3 rounded overflow-x-auto">
                      {snippet.content}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Git Diff Display */}
          <div className="bg-white border border-gray-200 p-8 space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Code Changes (Git Diff Format)</h3>
            <div className="bg-gray-900 text-green-400 p-6 rounded font-mono text-sm overflow-x-auto">
              <pre className="whitespace-pre-wrap">
                {formatAsGitDiff(codeSuggestion)}
              </pre>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-gray-50 border border-gray-200 p-6">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Generated {new Date(codeSuggestion.created_at).toLocaleString()}
                {codeSuggestion.model_used && (
                  <span> • Model: {codeSuggestion.model_used}</span>
                )}
              </div>
              <div className="space-x-3">
                <button className="px-4 py-2 border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                  Copy Code
                </button>
                <button 
                  onClick={generateCodeSuggestion}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Regenerate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Usage Tips */}
      {!codeSuggestion && (
        <div className="bg-gray-50 border border-gray-200 p-8 space-y-6">
          <h3 className="text-lg font-medium text-gray-900">How to Use</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">JIRA Ticket Examples</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• PROJ-123 (Project tickets)</li>
                <li>• ANSIBLE-456 (Ansible-specific)</li>
                <li>• BUG-789 (Bug fixes)</li>
                <li>• FEAT-101 (New features)</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">What You'll Get</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• AI-generated code suggestions</li>
                <li>• Git diff format for easy review</li>
                <li>• Confidence scoring</li>
                <li>• Similar code references</li>
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
      {/* Verizon-style Header */}
      <header className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-600"></div>
                <h1 className="text-xl font-medium">RAG Assistant</h1>
              </div>
              <nav className="hidden md:flex items-center space-x-8">
                <a href="#" className="text-sm hover:text-gray-300 transition-colors">Solutions</a>
                <a href="#" className="text-sm hover:text-gray-300 transition-colors">Support</a>
                <a href="#" className="text-sm hover:text-gray-300 transition-colors">Documentation</a>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-sm hover:text-gray-300 transition-colors">Sign In</button>
              <button className="px-4 py-2 bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb Navigation */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>RAG Assistant</span>
            <span>›</span>
            <span className="text-gray-900 font-medium capitalize">{activeTab}</span>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex space-x-12">
            {[
              { id: 'dashboard', name: 'Dashboard' },
              { id: 'suggestions', name: 'Code Suggestions' },
              { id: 'vectorization', name: 'Vectorization' },
              { id: 'config', name: 'Configuration' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-red-600 text-red-600'
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
        {activeTab === 'suggestions' && <CodeSuggestionsTab />}
        {activeTab === 'vectorization' && <VectorizationTab />}
        {activeTab === 'config' && <ConfigurationTab />}
      </main>

      {/* Verizon-style Footer */}
      <footer className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-red-600"></div>
                <span className="font-medium">RAG Assistant</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                AI-powered code suggestions and intelligent development automation platform.
              </p>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-medium">Solutions</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Code Generation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">JIRA Integration</a></li>
                <li><a href="#" className="hover:text-white transition-colors">GitLab Automation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Repository Analysis</a></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-medium">Support</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Support</a></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-medium">Company</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 RAG Assistant. All rights reserved.
            </p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">GitHub</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">LinkedIn</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
