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

## 🚀 Quick Start (Direct Laptop Installation)

### Prerequisites

Before installing RAG Assistant on your laptop, ensure you have:

- **Node.js** 18+ and **yarn** package manager
- **Python** 3.9+ and **pip**
- **Git** for repository cloning
- **MongoDB** Community Edition (local installation)
- **OLLAMA** for AI model inference
- **PostgreSQL** 14+ with pgvector extension
- **4GB+ RAM** (8GB+ recommended for optimal performance)
- **GitLab** instance with API access
- **JIRA** instance with API access

### 1. System Dependencies Installation

#### On Ubuntu/Debian:
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+ and yarn
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g yarn

# Install Python 3.9+ and pip
sudo apt install python3 python3-pip python3-venv -y

# Install Git
sudo apt install git -y

# Install MongoDB Community Edition
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# Install PostgreSQL with pgvector
sudo apt install postgresql postgresql-contrib postgresql-client -y
sudo apt install postgresql-14-pgvector -y

# Install build essentials for Python packages
sudo apt install build-essential python3-dev libpq-dev -y
```

#### On macOS:
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js and yarn
brew install node yarn

# Install Python 3.9+
brew install python@3.9

# Install Git
brew install git

# Install MongoDB Community Edition
brew tap mongodb/brew
brew install mongodb-community

# Install PostgreSQL with pgvector
brew install postgresql
brew install pgvector
```

#### On Windows:
```powershell
# Install using Chocolatey (install Chocolatey first if needed)
# Install Chocolatey: https://chocolatey.org/install

# Install Node.js and yarn
choco install nodejs yarn -y

# Install Python 3.9+
choco install python39 -y

# Install Git
choco install git -y

# Install MongoDB Community Edition
choco install mongodb -y

# Install PostgreSQL
choco install postgresql -y
# Note: pgvector needs manual installation on Windows
```

### 2. Service Setup and Configuration

#### MongoDB Setup:
```bash
# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify MongoDB is running
mongosh --eval "db.runCommand('ping')"

# Create database and user (optional but recommended)
mongosh
> use rag_assistant
> db.createUser({
    user: "rag_user",
    pwd: "secure_password",
    roles: ["readWrite"]
  })
> exit
```

#### PostgreSQL Setup:
```bash
# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and enable pgvector
sudo -u postgres createdb vector_db
sudo -u postgres psql vector_db -c "CREATE EXTENSION vector;"

# Create user and grant permissions
sudo -u postgres psql -c "CREATE USER rag_user WITH PASSWORD 'secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE vector_db TO rag_user;"

# Test connection
psql -h localhost -U rag_user -d vector_db -c "SELECT 1;"
```

#### OLLAMA Setup:
```bash
# Install OLLAMA
curl -fsSL https://ollama.com/install.sh | sh

# Start OLLAMA service (runs automatically on port 11434)
ollama serve &

# Pull recommended models for code generation
ollama pull codellama
ollama pull codellama:13b
ollama pull deepseek-coder

# Verify OLLAMA is working
curl http://localhost:11434/api/tags
```

### 3. Application Installation

#### Clone and Setup:
```bash
# Clone the repository
git clone <repository-url>
cd rag-assistant

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install backend dependencies
cd backend
pip install -r requirements.txt

# Install frontend dependencies
cd ../frontend
yarn install

# Return to root directory
cd ..
```

### 4. Environment Configuration

#### Backend Environment (`/app/backend/.env`):
```env
# Database Configuration
MONGO_URL=mongodb://localhost:27017
DB_NAME=rag_assistant

# If using MongoDB authentication
# MONGO_URL=mongodb://rag_user:secure_password@localhost:27017/rag_assistant

# PostgreSQL Configuration (used by application)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=vector_db
POSTGRES_USER=rag_user
POSTGRES_PASSWORD=secure_password

# Application Settings
ENVIRONMENT=development
LOG_LEVEL=INFO
DEBUG=True

# Security (change in production)
SECRET_KEY=your-secret-key-here
CORS_ORIGINS=["http://localhost:3000"]
```

#### Frontend Environment (`/app/frontend/.env`):
```env
# Backend API URL for local development
REACT_APP_BACKEND_URL=http://localhost:8001

# Development settings
REACT_APP_DEBUG=true
REACT_APP_LOG_LEVEL=debug

# Optional: API timeout settings
REACT_APP_API_TIMEOUT=30000
```

### 5. Start Services

#### Option A: Manual Startup (Recommended for Development)

**Terminal 1 - Backend:**
```bash
cd rag-assistant
source venv/bin/activate  # Activate virtual environment
cd backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**Terminal 2 - Frontend:**
```bash
cd rag-assistant/frontend
yarn start
# Frontend will start on http://localhost:3000
```

**Terminal 3 - MongoDB (if not running as service):**
```bash
mongod --dbpath /usr/local/var/mongodb
```

**Terminal 4 - OLLAMA (if not running as service):**
```bash
ollama serve
```

#### Option B: Using Process Manager (PM2)

```bash
# Install PM2 globally
npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'rag-backend',
      cwd: './backend',
      script: 'uvicorn',
      args: 'server:app --host 0.0.0.0 --port 8001',
      interpreter: '../venv/bin/python',
      env: {
        'PYTHONPATH': '.'
      }
    },
    {
      name: 'rag-frontend',
      cwd: './frontend',
      script: 'yarn',
      args: 'start',
      env: {
        'PORT': 3000
      }
    }
  ]
};
EOF

# Start all services
pm2 start ecosystem.config.js

# Monitor services
pm2 monit

# Stop services
pm2 stop all
```

### 6. Service Verification

#### Check All Services:
```bash
# Test MongoDB
mongosh --eval "db.runCommand('ping')"

# Test PostgreSQL
psql -h localhost -U rag_user -d vector_db -c "SELECT 1;"

# Test OLLAMA
curl http://localhost:11434/api/tags

# Test Backend API
curl http://localhost:8001/api/config

# Test Frontend (open browser)
open http://localhost:3000  # macOS
# or visit http://localhost:3000 in your browser
```

### 7. Initial Application Configuration

1. **Open RAG Assistant** in browser: `http://localhost:3000`

2. **Navigate to Configuration tab**

3. **Configure Services:**

   **OLLAMA Configuration:**
   - URL: `http://localhost:11434`
   - Model: `codellama` (or any model you've pulled)
   - Click refresh to load available models

   **GitLab Configuration:**
   - URL: `https://your-gitlab-instance.com`
   - Access Token: `glpat-xxxxxxxxxxxxxxxxxxxx`
   - Target Repository: `group/your-ansible-repo`

   **JIRA Configuration:**
   - URL: `https://your-company.atlassian.net`
   - Username: `your-email@company.com`
   - API Token: `your-jira-api-token`

   **PostgreSQL Configuration:**
   - Host: `localhost`
   - Port: `5432`
   - Database: `vector_db`
   - Username: `rag_user`
   - Password: `secure_password`

4. **Save Configuration** and verify all services show "Connected" status

5. **Test Code Suggestion:**
   - Go to "Code Suggestions" tab
   - Enter a JIRA ticket ID
   - Click "Generate Code"
   - Review the AI-generated suggestions

### 8. Development Workflow

#### Daily Development:
```bash
# 1. Start services
cd rag-assistant
source venv/bin/activate
cd backend && uvicorn server:app --host 0.0.0.0 --port 8001 --reload &
cd ../frontend && yarn start &

# 2. Make code changes
# Edit files in backend/ or frontend/src/

# 3. Test changes
# Backend changes reload automatically with --reload flag
# Frontend changes reload automatically with yarn start

# 4. Stop services when done
# Ctrl+C in each terminal or:
pkill -f uvicorn
pkill -f "yarn start"
```

#### Database Management:
```bash
# View MongoDB data
mongosh rag_assistant
> db.service_config.find().pretty()
> db.code_suggestions.find().limit(5).pretty()

# View PostgreSQL data
psql -h localhost -U rag_user -d vector_db
\dt  -- List tables
SELECT * FROM code_chunks LIMIT 5;

# Backup databases
mongodump --db rag_assistant --out ./backup/
pg_dump -h localhost -U rag_user vector_db > ./backup/vector_db.sql
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

### Common Issues and Solutions

#### 1. Service Connection Issues

**MongoDB Connection Failed:**
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB if not running
sudo systemctl start mongod

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Test connection manually
mongosh --eval "db.runCommand('ping')"

# Common fixes:
# - Ensure MongoDB is installed and started
# - Check if port 27017 is available: sudo netstat -tlnp | grep 27017
# - Verify disk space: df -h
```

**OLLAMA Connection Failed:**
```bash
# Check if OLLAMA is running
ps aux | grep ollama

# Start OLLAMA manually
ollama serve

# Check OLLAMA API
curl http://localhost:11434/api/tags

# Pull missing models
ollama pull codellama

# Check available models
ollama list

# Common fixes:
# - Ensure OLLAMA is installed: which ollama
# - Check port 11434 is available: sudo netstat -tlnp | grep 11434
# - Try restarting: pkill ollama && ollama serve
```

**PostgreSQL Connection Failed:**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL if needed
sudo systemctl start postgresql

# Test connection
psql -h localhost -U rag_user -d vector_db -c "SELECT 1;"

# Check pgvector extension
sudo -u postgres psql vector_db -c "SELECT * FROM pg_extension WHERE extname = 'vector';"

# Common fixes:
# - Ensure PostgreSQL is installed and running
# - Verify user permissions: sudo -u postgres psql -c "\du"
# - Check database exists: sudo -u postgres psql -l
# - Install pgvector if missing: sudo apt install postgresql-14-pgvector
```

**GitLab/JIRA Authentication:**
```bash
# Test GitLab token
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-gitlab-instance.com/api/v4/user

# Test JIRA token
curl -u username:token \
  https://your-jira.atlassian.net/rest/api/2/myself

# Common fixes:
# - Verify token is correct and not expired
# - Check API scope permissions
# - Ensure URLs are correct (include https://)
# - Test network connectivity to services
```

#### 2. Frontend Issues

**Application Not Loading:**
```bash
# Check frontend process
ps aux | grep "yarn start"

# Check if port 3000 is in use
sudo netstat -tlnp | grep 3000

# Restart frontend
cd frontend
yarn start

# Clear cache and reinstall
rm -rf node_modules package-lock.json
yarn install
yarn start

# Check browser console for errors (F12)
```

**API Connection Issues:**
```bash
# Verify backend URL in frontend/.env
cat frontend/.env

# Test backend API directly
curl http://localhost:8001/api/config

# Check CORS settings
# Backend should allow frontend origin in CORS_ORIGINS

# Common fixes:
# - Ensure REACT_APP_BACKEND_URL is correct
# - Check backend is running on port 8001
# - Verify no firewall blocking requests
# - Clear browser cache and cookies
```

#### 3. Backend Issues

**Dependencies Missing:**
```bash
# Activate virtual environment
source venv/bin/activate

# Reinstall requirements
cd backend
pip install -r requirements.txt --upgrade

# Check for conflicting packages
pip check

# Common fixes:
# - Use virtual environment: python3 -m venv venv
# - Update pip: pip install --upgrade pip
# - Install system dependencies: sudo apt install python3-dev libpq-dev
```

**Import or Module Errors:**
```bash
# Check Python path
cd backend
python -c "import sys; print(sys.path)"

# Test imports manually
python -c "from server import app; print('Backend imports OK')"

# Check for missing system packages
sudo apt install build-essential python3-dev libpq-dev

# Virtual environment activation
source ../venv/bin/activate  # From backend directory
```

**Database Connection:**
```bash
# Test MongoDB connection from Python
python -c "from motor.motor_asyncio import AsyncIOMotorClient; print('MongoDB client OK')"

# Test PostgreSQL connection
python -c "import psycopg2; conn=psycopg2.connect('host=localhost user=rag_user dbname=vector_db password=secure_password'); print('PostgreSQL OK')"

# Check environment variables
cd backend && python -c "import os; print(os.environ.get('MONGO_URL'))"
```

#### 4. Performance Issues

**Slow Code Generation:**
```bash
# Check system resources
htop  # or top

# Check OLLAMA model size
ollama list

# Use smaller models for faster responses
ollama pull codellama:7b  # Instead of larger models

# Monitor OLLAMA performance
curl http://localhost:11434/api/ps

# Common fixes:
# - Use smaller models (codellama vs codellama:34b)
# - Increase system RAM
# - Close other applications
# - Reduce chunk_size in configuration
```

**High Memory Usage:**
```bash
# Monitor memory usage
free -h
ps aux --sort=-%mem | head -10

# Check OLLAMA memory usage
ps aux | grep ollama

# Restart services to free memory
pm2 restart all  # If using PM2
# Or restart manually

# Common fixes:
# - Restart OLLAMA periodically
# - Use smaller embedding models
# - Limit concurrent requests
# - Increase swap space
```

#### 5. Development Issues

**Hot Reload Not Working:**
```bash
# Backend hot reload
cd backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Frontend hot reload
cd frontend
yarn start

# Common fixes:
# - Ensure --reload flag for uvicorn
# - Check file watchers: echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
# - Restart development servers
# - Check file permissions
```

**Port Conflicts:**
```bash
# Check what's using ports
sudo netstat -tlnp | grep :3000
sudo netstat -tlnp | grep :8001
sudo netstat -tlnp | grep :11434
sudo netstat -tlnp | grep :27017

# Kill processes using ports
sudo kill -9 $(sudo lsof -t -i:3000)
sudo kill -9 $(sudo lsof -t -i:8001)

# Use different ports if needed
# Frontend: yarn start --port 3001
# Backend: uvicorn server:app --port 8002
```

### Log Locations and Debugging

#### Application Logs:
```bash
# Backend logs (if running manually)
cd backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload --log-level debug

# Frontend logs (browser console)
# Open browser Developer Tools (F12) -> Console tab

# MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log

# OLLAMA logs
# Check terminal where ollama serve is running
```

#### Enable Debug Mode:
```bash
# Backend debug mode
# Edit backend/.env:
DEBUG=True
LOG_LEVEL=DEBUG

# Frontend debug mode
# Edit frontend/.env:
REACT_APP_DEBUG=true

# Restart services after changes
```

#### System Resource Monitoring:
```bash
# Monitor system resources
htop
iotop  # Disk I/O
nethogs  # Network usage

# Monitor specific processes
watch -n 1 'ps aux | grep -E "(python|node|ollama|mongod)"'

# Check disk space
df -h
du -sh rag-assistant/

# Check memory usage
free -h
cat /proc/meminfo
```

### Getting Help

#### Self-Diagnosis Checklist:
1. ✅ All services (MongoDB, PostgreSQL, OLLAMA) are running
2. ✅ Virtual environment is activated for Python
3. ✅ Environment files (.env) are correctly configured
4. ✅ Required ports (3000, 8001, 11434, 27017, 5432) are available
5. ✅ External service credentials (GitLab, JIRA) are valid
6. ✅ System has sufficient memory (4GB+ recommended)
7. ✅ Internet connection for downloading models and accessing APIs

#### Quick Health Check Script:
```bash
#!/bin/bash
# Save as health-check.sh and run: bash health-check.sh

echo "=== RAG Assistant Health Check ==="

echo "Checking MongoDB..."
mongosh --eval "db.runCommand('ping')" >/dev/null 2>&1 && echo "✅ MongoDB OK" || echo "❌ MongoDB Failed"

echo "Checking PostgreSQL..."
psql -h localhost -U rag_user -d vector_db -c "SELECT 1;" >/dev/null 2>&1 && echo "✅ PostgreSQL OK" || echo "❌ PostgreSQL Failed"

echo "Checking OLLAMA..."
curl -s http://localhost:11434/api/tags >/dev/null 2>&1 && echo "✅ OLLAMA OK" || echo "❌ OLLAMA Failed"

echo "Checking Backend..."
curl -s http://localhost:8001/api/config >/dev/null 2>&1 && echo "✅ Backend OK" || echo "❌ Backend Failed"

echo "Checking Frontend..."
curl -s http://localhost:3000 >/dev/null 2>&1 && echo "✅ Frontend OK" || echo "❌ Frontend Failed"

echo "=== Health Check Complete ==="
```

#### When to Seek Help:
- Error messages you can't resolve with this guide
- Performance issues persisting after optimization
- Integration problems with external services
- Custom deployment scenarios

#### Support Channels:
1. **Documentation**: Review this README first
2. **GitHub Issues**: Create detailed issue with logs
3. **Community**: Stack Overflow with "rag-assistant" tag
4. **Enterprise**: Professional support available

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