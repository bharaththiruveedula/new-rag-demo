# RAG Assistant

AI-powered code suggestions and intelligent development automation platform for Ansible-based repositories.

![RAG Assistant](https://img.shields.io/badge/AI-Powered-blue) ![Status](https://img.shields.io/badge/Status-Production%20Ready-green) ![License](https://img.shields.io/badge/License-MIT-blue)

## 🎯 Overview

RAG Assistant is an enterprise-grade application that combines Retrieval-Augmented Generation (RAG) with modern AI to provide intelligent code suggestions for JIRA tickets. Built specifically for Ansible-based repositories with custom modules, it automates the development workflow from ticket analysis to GitLab merge request creation.

### ✨ Key Features

- **🧠 AI-Powered Code Generation**: Uses OLLAMA with CodeLlama models for intelligent code suggestions
- **📋 JIRA Integration**: Automatically processes JIRA tickets and generates relevant code
- **🔍 Semantic Search**: RAG-based repository analysis with pgvector for similarity matching
- **🦊 GitLab Automation**: Automated merge request creation with suggested changes
- **📊 Real-time Analytics**: System monitoring and performance metrics
- **🎨 Modern UI**: Clean Swiss design with responsive layout for all screen sizes

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   External      │
│   (React)       │    │   (FastAPI)     │    │   Services      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • Dashboard     │◄──►│ • REST APIs     │◄──►│ • OLLAMA AI     │
│ • Code Suggest  │    │ • RAG Engine    │    │ • GitLab        │
│ • Vectorization │    │ • Vector Store  │    │ • JIRA          │
│ • Configuration │    │ • ML Models     │    │ • PostgreSQL    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and **yarn**
- **Python** 3.9+ and **pip**
- **MongoDB** for configuration storage
- **OLLAMA** for AI model inference
- **PostgreSQL** with pgvector extension (optional)
- **GitLab** instance with API access
- **JIRA** instance with API access

### 1. Installation

```bash
# Clone the repository
git clone <repository-url>
cd rag-assistant

# Install backend dependencies
cd backend
pip install -r requirements.txt

# Install frontend dependencies
cd ../frontend
yarn install

# Return to root directory
cd ..
```

### 2. Environment Setup

#### Backend Configuration

Create `/app/backend/.env`:

```env
# Database Configuration
MONGO_URL=mongodb://localhost:27017
DB_NAME=rag_assistant

# Optional: Production settings
ENVIRONMENT=development
LOG_LEVEL=INFO
```

#### Frontend Configuration

Create `/app/frontend/.env`:

```env
# Backend API URL (configured for production)
REACT_APP_BACKEND_URL=<your-backend-url>
```

### 3. Start Services

#### Option A: Development Mode

```bash
# Terminal 1: Start Backend
cd backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Terminal 2: Start Frontend
cd frontend
yarn start
```

#### Option B: Production Mode (Supervisor)

```bash
# Start all services
sudo supervisorctl restart all

# Check status
sudo supervisorctl status
```

### 4. Initial Configuration

1. **Open the application** at `http://localhost:3000`
2. **Navigate to Configuration tab**
3. **Configure external services:**

#### OLLAMA Setup
```bash
# Install OLLAMA
curl -fsSL https://ollama.com/install.sh | sh

# Pull a code model
ollama pull codellama

# Start OLLAMA (runs on http://localhost:11434 by default)
ollama serve
```

#### PostgreSQL with pgvector
```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install pgvector extension
sudo apt install postgresql-14-pgvector

# Create database
sudo -u postgres createdb vector_db

# Enable extension
sudo -u postgres psql vector_db -c "CREATE EXTENSION vector;"
```

## 📋 Detailed Configuration

### External Service Configuration

#### 1. OLLAMA AI Configuration

| Setting | Description | Example |
|---------|-------------|---------|
| **OLLAMA URL** | Local OLLAMA instance URL | `http://localhost:11434` |
| **Model Name** | AI model for code generation | `codellama`, `deepseek-coder` |

**Available Models:**
- `codellama` - General purpose code generation
- `codellama:13b` - Larger model, better quality
- `codellama:34b` - Largest model, highest quality
- `deepseek-coder` - Specialized for code understanding
- `magicoder` - Enhanced code completion

#### 2. GitLab Configuration

| Setting | Description | Example |
|---------|-------------|---------|
| **GitLab URL** | Your GitLab instance | `https://gitlab.company.com` |
| **Access Token** | Personal access token with API scope | `glpat-xxxxxxxxxxxx` |
| **Target Repository** | Repository for code suggestions | `team/ansible-automation` |

**Creating GitLab Token:**
1. Go to GitLab → Settings → Access Tokens
2. Create token with `api` scope
3. Copy the token (save securely)

#### 3. JIRA Configuration

| Setting | Description | Example |
|---------|-------------|---------|
| **JIRA URL** | Your JIRA instance | `https://company.atlassian.net` |
| **Username** | JIRA username or email | `user@company.com` |
| **API Token** | JIRA API token | Generate from account settings |

**Creating JIRA Token:**
1. Go to JIRA → Account Settings → Security → API tokens
2. Create new token
3. Copy the token (save securely)

#### 4. PostgreSQL Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| **Host** | PostgreSQL server host | `localhost` |
| **Port** | PostgreSQL server port | `5432` |
| **Database** | Database name | `vector_db` |
| **Username** | Database username | `postgres` |
| **Password** | Database password | (required) |

## 🔧 Usage Guide

### 1. System Status Monitoring

The **Dashboard** tab provides real-time monitoring:

- **Service Status**: Connection status for all external services
- **Analytics**: Usage statistics and performance metrics
- **Quick Actions**: Direct access to main features

### 2. Repository Vectorization

Before generating code suggestions, vectorize your repository:

1. **Configure GitLab** with repository details
2. **Navigate to Vectorization tab**
3. **Click "Start Vectorization"**
4. **Monitor progress** in real-time

This process:
- Clones the repository
- Parses Python and Ansible files
- Generates semantic embeddings
- Stores vectors for similarity search

### 3. Generating Code Suggestions

Main workflow for code generation:

1. **Navigate to Code Suggestions tab**
2. **Enter JIRA Ticket ID** (e.g., `PROJ-123`, `ANSIBLE-456`)
3. **Click "Generate Code"**
4. **Review the suggestions:**
   - AI-generated code with confidence score
   - Git diff format with syntax highlighting
   - Similar code references from repository
   - Detailed explanation
5. **Create Merge Request** directly to GitLab

### 4. Advanced Configuration

#### Custom Model Configuration

```python
# Example: Using custom OLLAMA model
{
    "ollama_model": "custom-model:latest",
    "embedding_model": "all-MiniLM-L6-v2",
    "chunk_size": 512,
    "chunk_overlap": 50
}
```

#### RAG Parameters Tuning

```python
# Backend configuration for RAG optimization
{
    "similarity_threshold": 0.7,
    "max_chunks_per_query": 5,
    "temperature": 0.2,
    "max_tokens": 500
}
```

## 🔍 API Reference

### Authentication

All API endpoints use the same authentication as configured external services.

### Core Endpoints

#### Configuration Management
```http
GET  /api/config              # Get current configuration
POST /api/config              # Update configuration
```

#### Service Status
```http
GET /api/status/all           # Check all service connections
GET /api/status/{service}     # Check specific service
```

#### Repository Vectorization
```http
POST /api/vectorize/repository # Start vectorization
GET  /api/vectorize/status     # Get vectorization status
```

#### Code Suggestions
```http
POST /api/suggest/code        # Generate code suggestions
```

#### GitLab Integration
```http
POST /api/gitlab/merge-request # Create merge request
```

#### Analytics
```http
GET /api/analytics            # Get system analytics
GET /api/search/code          # Semantic code search
```

### Example API Usage

#### Generate Code Suggestion
```bash
curl -X POST http://localhost:8001/api/suggest/code \
  -H "Content-Type: application/json" \
  -d '{"ticket_id": "PROJ-123"}'
```

#### Response Format
```json
{
  "id": "uuid",
  "ticket_id": "PROJ-123",
  "suggested_changes": [
    {
      "file_path": "modules/custom_module.py",
      "change_type": "create",
      "content": "# Generated code...",
      "explanation": "Implementation details..."
    }
  ],
  "confidence_score": 0.87,
  "processing_time_ms": 1250,
  "similar_code_snippets": [...]
}
```

## 🛠️ Development

### Project Structure

```
/app/
├── backend/                 # FastAPI backend
│   ├── server.py           # Main application
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Environment variables
├── frontend/               # React frontend
│   ├── src/
│   │   ├── App.js         # Main component
│   │   ├── App.css        # Styling
│   │   └── index.js       # Entry point
│   ├── package.json       # Node dependencies
│   └── .env              # Environment variables
├── tests/                 # Test files
└── README.md             # This file
```

### Development Workflow

```bash
# 1. Make changes to code
# 2. Test changes
cd backend && python -m pytest
cd frontend && yarn test

# 3. Restart services (if needed)
sudo supervisorctl restart all

# 4. Check logs
tail -f /var/log/supervisor/backend.*.log
tail -f /var/log/supervisor/frontend.*.log
```

### Adding New Features

1. **Backend Changes:**
   - Add endpoints in `server.py`
   - Update requirements if needed
   - Test with curl or API client

2. **Frontend Changes:**
   - Add components in `App.js`
   - Update styling in `App.css`
   - Test in browser

3. **Integration:**
   - Test full workflow
   - Update this README
   - Add to API documentation

## 🐛 Troubleshooting

### Common Issues

#### 1. Services Not Connecting

**OLLAMA Connection Failed:**
```bash
# Check if OLLAMA is running
curl http://localhost:11434/api/tags

# Restart OLLAMA
ollama serve

# Check available models
ollama list
```

**GitLab/JIRA Authentication:**
```bash
# Test GitLab token
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://gitlab.com/api/v4/user

# Test JIRA token
curl -u username:token \
  https://your-jira.atlassian.net/rest/api/2/myself
```

#### 2. Frontend Issues

**Application Not Loading:**
```bash
# Check frontend status
sudo supervisorctl status frontend

# Check logs
tail -f /var/log/supervisor/frontend.*.log

# Restart if needed
sudo supervisorctl restart frontend
```

**API Connection Issues:**
- Verify `REACT_APP_BACKEND_URL` in `/app/frontend/.env`
- Check backend is running on correct port
- Verify CORS settings

#### 3. Backend Issues

**Dependencies Missing:**
```bash
# Reinstall requirements
cd backend
pip install -r requirements.txt --upgrade

# Restart backend
sudo supervisorctl restart backend
```

**Database Connection:**
```bash
# Check MongoDB
sudo systemctl status mongod

# Test connection
mongo --eval "db.runCommand('ping')"
```

#### 4. Performance Issues

**Slow Code Generation:**
- Use smaller OLLAMA models for faster responses
- Reduce chunk size in configuration
- Check available memory and CPU

**High Memory Usage:**
- Monitor model loading
- Restart services periodically
- Consider using smaller embedding models

### Log Locations

```bash
# Application logs
/var/log/supervisor/backend.*.log
/var/log/supervisor/frontend.*.log

# System logs
/var/log/mongodb/mongod.log
journalctl -u ollama
```

## 📊 Monitoring & Analytics

### Built-in Metrics

The application tracks:
- Total code suggestions generated
- Average confidence scores
- Processing times
- Successful merge requests
- Service uptime and response times

### External Monitoring

For production deployments, consider:
- **Prometheus** for metrics collection
- **Grafana** for visualization
- **ELK Stack** for log analysis
- **Sentry** for error tracking

## 🚀 Production Deployment

### Security Considerations

1. **API Keys & Tokens:**
   - Store in secure key management system
   - Rotate regularly
   - Use environment variables, never hard-code

2. **Network Security:**
   - Use HTTPS in production
   - Implement proper firewall rules
   - Consider VPN for internal services

3. **Database Security:**
   - Enable authentication
   - Use SSL connections
   - Regular backups

### Scaling

#### Horizontal Scaling

```yaml
# docker-compose.yml example
version: '3.8'
services:
  backend:
    replicas: 3
    ports:
      - "8001-8003:8001"
  
  frontend:
    replicas: 2
    ports:
      - "3000-3001:3000"
```

#### Performance Optimization

- **Caching:** Implement Redis for frequent queries
- **Database:** Use connection pooling
- **Models:** Consider model quantization for faster inference
- **CDN:** Use CDN for static assets

### Health Checks

```bash
# Backend health
curl http://localhost:8001/api/status/all

# Frontend health  
curl http://localhost:3000

# Database health
mongo --eval "db.runCommand('ping')"
```

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and test thoroughly
4. Commit with clear messages: `git commit -m 'Add amazing feature'`
5. Push to branch: `git push origin feature/amazing-feature`
6. Create Pull Request

### Code Standards

- **Python:** Follow PEP 8, use black formatter
- **JavaScript:** Use ESLint and Prettier
- **Documentation:** Update README for new features
- **Testing:** Add tests for new functionality

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

1. **Documentation:** Check this README first
2. **Issues:** Create GitHub issue with detailed description
3. **Discussions:** Use GitHub discussions for questions
4. **Enterprise:** Contact for enterprise support options

## 🙏 Acknowledgments

- **OLLAMA** for local AI model inference
- **pgvector** for vector similarity search
- **FastAPI** for modern Python web framework
- **React** for user interface
- **Tailwind CSS** for styling system

---

**Built with ❤️ by the RAG Assistant Team**

*Transforming development workflows with AI-powered automation*