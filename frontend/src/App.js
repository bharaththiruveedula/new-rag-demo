import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [connectionStatuses, setConnectionStatuses] = useState([]);
  const [config, setConfig] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [vectorizationStatus, setVectorizationStatus] = useState(null);
  const [jiraTicketId, setJiraTicketId] = useState('');
  const [codeSuggestion, setCodeSuggestion] = useState(null);
  const [availableModels, setAvailableModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');

  // Load configuration and data on component mount
  useEffect(() => {
    loadConfiguration();
    checkAllConnections();
    getVectorizationStatus();
    fetchOllamaModels();
  }, []);

  const loadConfiguration = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/config`);
      if (response.ok) {
        const configData = await response.json();
        setConfig(configData);
        
        // If OLLAMA URL is configured, fetch available models
        if (configData.ollama_url) {
          await fetchOllamaModels();
        }
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
    }
  };


  const fetchOllamaModels = async () => {
    try {
      setLoadingModels(true);
      const response = await fetch(`${API_BASE_URL}/api/ollama/models`);
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success' && data.models) {
          setAvailableModels(data.models);
          // Set the first model as default if none selected
          if (data.models.length > 0 && !selectedModel) {
            setSelectedModel(data.models[0]);
          }
        } else {
          // Use fallback models only if backend returns them
          setAvailableModels(data.models || []);
        }
      } else {
        console.error('Failed to fetch OLLAMA models');
        setAvailableModels([]);
      }
    } catch (error) {
      console.error('Failed to fetch OLLAMA models:', error);
      setAvailableModels([]);
    } finally {
      setLoadingModels(false);
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
        
        // If OLLAMA URL was updated, fetch available models
        if (updates.ollama_url) {
          await fetchOllamaModels();
        }
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
    try {
      const response = await fetch(`${API_BASE_URL}/api/analytics`);
      if (response.ok) {
        const analyticsData = await response.json();
        setAnalytics({
          totalSuggestions: analyticsData.total_suggestions || 0,
          avgConfidence: analyticsData.avg_confidence || 0,
          successfulMRs: analyticsData.successful_merge_requests || 0,
          processingTime: analyticsData.avg_processing_time || 0
        });
      } else {
        // Fallback to zeros if API fails
        setAnalytics({
          totalSuggestions: 0,
          avgConfidence: 0,
          successfulMRs: 0,
          processingTime: 0
        });
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
      // Fallback to zeros if API fails
      setAnalytics({
        totalSuggestions: 0,
        avgConfidence: 0,
        successfulMRs: 0,
        processingTime: 0
      });
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
      const requestData = { 
        ticket_id: jiraTicketId
      };
      
      // Add selected model if one is chosen
      if (selectedModel) {
        requestData.model = selectedModel;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/suggest/code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
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

  // Dashboard Tab (combines status only)
  const DashboardTab = () => (
    <div className="content-section">
      {/* Hero Section - Clean and Minimal */}
      <div className="text-center content-section">
        <h1 className="text-3xl lg:text-5xl font-light text-gray-900 tracking-tight">
          RAG Assistant
        </h1>
        <p className="text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Intelligent code analysis and suggestions powered by advanced AI technology
        </p>
      </div>

      {/* System Status - Responsive Grid Layout */}
      <div className="content-section">
        <h2 className="text-2xl lg:text-3xl font-light text-gray-900 border-b border-gray-200 pb-4">
          System Status
        </h2>
        
        <div className="responsive-grid-4">
          {connectionStatuses.map((status) => (
            <div key={status.service} className="card card-padding content-section">
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
            className="btn-primary disabled:opacity-50"
          >
            {isLoading ? 'Checking...' : 'Refresh Status'}
          </button>
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
            <input
              type="text"
              value={jiraTicketId}
              onChange={(e) => setJiraTicketId(e.target.value)}
              placeholder="e.g., PROJ-123, ANSIBLE-456"
              className="w-full px-4 py-3 border border-gray-300 focus:border-black focus:outline-none text-gray-900"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900">
              AI Model
            </label>
            <div className="flex space-x-4">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 focus:border-black focus:outline-none text-gray-900"
                disabled={loadingModels}
              >
                <option value="">
                  {loadingModels ? 'Loading models...' : 'Select Model (or use default)'}
                </option>
                {availableModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
              <button
                onClick={fetchOllamaModels}
                disabled={loadingModels}
                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                title="Refresh available models"
              >
                {loadingModels ? '⟳' : '🔄'}
              </button>
            </div>
            {availableModels.length === 0 && !loadingModels && (
              <p className="text-xs text-amber-600">
                No models found. Check OLLAMA connection or click refresh.
              </p>
            )}
            {availableModels.length > 0 && (
              <p className="text-xs text-gray-500">
                {availableModels.length} model(s) available from OLLAMA
              </p>
            )}
          </div>
          
          <div className="pt-4">
            <button
              onClick={generateCodeSuggestion}
              disabled={isLoading || !jiraTicketId.trim()}
              className="w-full px-8 py-3 bg-black text-white font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Generating...' : `Generate Code${selectedModel ? ` with ${selectedModel}` : ''}`}
            </button>
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

          {/* Show message if no similar code found but suggestion exists */}
          {codeSuggestion.similar_code_snippets && codeSuggestion.similar_code_snippets.length === 0 && (
            <div className="bg-gray-50 border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Similar Code References</h3>
              <p className="text-gray-600 text-sm">
                No similar code snippets found in the current repository. This could indicate a novel implementation or that the repository needs to be vectorized.
              </p>
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

  // Configuration Tab - Read-only Display
  const ConfigurationTab = () => (
    <div className="content-section">
      <div className="content-section">
        <h1 className="text-3xl lg:text-4xl font-light text-gray-900 tracking-tight">
          Configuration
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl leading-relaxed">
          Current system configuration (read-only)
        </p>
      </div>
      
      <div className="content-section">
        {/* OLLAMA Configuration */}
        <div className="card card-padding content-section">
          <h2 className="text-xl lg:text-2xl font-light text-gray-900 border-b border-gray-200 pb-4">
            OLLAMA AI
          </h2>
          <div className="responsive-grid-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900">OLLAMA URL</label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 text-gray-700 rounded">
                {config.ollama_url || 'Not configured'}
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900">Default Model</label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 text-gray-700 rounded">
                {config.ollama_model || 'Not configured'}
              </div>
            </div>
          </div>
        </div>

        {/* GitLab Configuration */}
        <div className="card card-padding content-section">
          <h2 className="text-xl lg:text-2xl font-light text-gray-900 border-b border-gray-200 pb-4">
            GitLab
          </h2>
          <div className="content-section">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900">GitLab URL</label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 text-gray-700 rounded">
                {config.gitlab_url || 'Not configured'}
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900">Access Token</label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 text-gray-700 rounded">
                {config.gitlab_token ? '••••••••••••••••••••' : 'Not configured'}
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900">Target Repository</label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 text-gray-700 rounded">
                {config.target_repository || 'Not configured'}
              </div>
            </div>
          </div>
        </div>

        {/* JIRA Configuration */}
        <div className="card card-padding content-section">
          <h2 className="text-xl lg:text-2xl font-light text-gray-900 border-b border-gray-200 pb-4">
            JIRA
          </h2>
          <div className="content-section">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900">JIRA URL</label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 text-gray-700 rounded">
                {config.jira_url || 'Not configured'}
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900">Username/Email</label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 text-gray-700 rounded">
                {config.jira_username || 'Not configured'}
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900">API Token</label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 text-gray-700 rounded">
                {config.jira_token ? '••••••••••••••••••••' : 'Not configured'}
              </div>
            </div>
          </div>
        </div>

        {/* PostgreSQL Configuration */}
        <div className="card card-padding content-section">
          <h2 className="text-xl lg:text-2xl font-light text-gray-900 border-b border-gray-200 pb-4">
            PostgreSQL + pgvector
          </h2>
          <div className="responsive-grid-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900">Host</label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 text-gray-700 rounded">
                {config.postgres_host || 'Not configured'}
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900">Port</label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 text-gray-700 rounded">
                {config.postgres_port || 'Not configured'}
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900">Database</label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 text-gray-700 rounded">
                {config.postgres_db || 'Not configured'}
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900">Username</label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 text-gray-700 rounded">
                {config.postgres_user || 'Not configured'}
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900">Password</label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 text-gray-700 rounded">
                {config.postgres_password ? '••••••••••••••••••••' : 'Not configured'}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-6 content-section">
          <h3 className="text-lg font-medium text-blue-900 mb-2">Configuration Management</h3>
          <p className="text-blue-700 text-sm">
            Configuration is managed via environment variables in the backend .env file. 
            Contact your system administrator to update these settings.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Clean Header - App Focused */}
      <header className="bg-black text-white">
        <div className="responsive-container">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-600"></div>
              <h1 className="text-xl font-medium">RAG Assistant</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Navigation */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="responsive-container">
          <div className="flex space-x-8 lg:space-x-12 overflow-x-auto">
            {[
              { id: 'dashboard', name: 'Dashboard' },
              { id: 'suggestions', name: 'Code Suggestions' },
              { id: 'vectorization', name: 'Vectorization' },
              { id: 'config', name: 'Configuration' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 font-medium transition-colors border-b-2 whitespace-nowrap ${
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
      <main className="responsive-container py-8 lg:py-12">
        <div className="content-area">
          {activeTab === 'dashboard' && <DashboardTab />}
          {activeTab === 'suggestions' && <CodeSuggestionsTab />}
          {activeTab === 'vectorization' && <VectorizationTab />}
          {activeTab === 'config' && <ConfigurationTab />}
        </div>
      </main>

      {/* Clean Footer */}
      <footer className="bg-black text-white">
        <div className="responsive-container py-8 lg:py-12">
          <div className="text-center content-section">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-6 h-6 bg-red-600"></div>
              <span className="text-xl font-medium">RAG Assistant</span>
            </div>
            <p className="text-gray-400 text-sm">
              AI-powered code suggestions and intelligent development automation platform
            </p>
            <div className="border-t border-gray-800 pt-8">
              <p className="text-gray-400 text-sm">
                © 2025 RAG Assistant. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
