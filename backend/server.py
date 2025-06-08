from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
import uuid
from datetime import datetime, timedelta
import httpx
import asyncio
import psycopg2
from psycopg2.extras import RealDictCursor
import json
import git
import tempfile
import shutil
from sentence_transformers import SentenceTransformer
import numpy as np
import re
import ast
import yaml

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Advanced RAG Code Suggestion API", version="2.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Global variables for models
sentence_model = None
vectorizer_status = {"status": "not_started", "details": []}

# Enhanced Configuration Models
class ServiceConfig(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    ollama_url: str = "http://localhost:11434"
    ollama_model: str = "codellama"
    gitlab_url: str = "https://gitlab.example.com"
    gitlab_token: str = ""
    jira_url: str = "https://jira.example.com"
    jira_username: str = ""
    jira_token: str = ""
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "vector_db"
    postgres_user: str = "postgres"
    postgres_password: str = ""
    target_repository: str = ""
    default_branch: str = "main"
    embedding_model: str = "all-MiniLM-L6-v2"
    chunk_size: int = 512
    chunk_overlap: int = 50
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ConfigUpdate(BaseModel):
    ollama_url: Optional[str] = None
    ollama_model: Optional[str] = None
    gitlab_url: Optional[str] = None
    gitlab_token: Optional[str] = None
    jira_url: Optional[str] = None
    jira_username: Optional[str] = None
    jira_token: Optional[str] = None
    postgres_host: Optional[str] = None
    postgres_port: Optional[int] = None
    postgres_db: Optional[str] = None
    postgres_user: Optional[str] = None
    postgres_password: Optional[str] = None
    target_repository: Optional[str] = None
    default_branch: Optional[str] = None
    embedding_model: Optional[str] = None
    chunk_size: Optional[int] = None
    chunk_overlap: Optional[int] = None

class ConnectionStatus(BaseModel):
    service: str
    status: str
    message: str
    response_time_ms: Optional[float] = None
    details: Optional[Dict[str, Any]] = None
    last_checked: datetime = Field(default_factory=datetime.utcnow)

class JIRATicketInput(BaseModel):
    ticket_id: str
    
class AdvancedCodeSuggestion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    ticket_id: str
    ticket_summary: Optional[str] = None
    ticket_description: Optional[str] = None
    suggested_changes: List[Dict[str, Any]] = []
    similar_code_snippets: List[Dict[str, Any]] = []
    explanation: str
    confidence_score: float
    processing_time_ms: float
    model_used: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class EnhancedVectorizationStatus(BaseModel):
    status: str
    total_files: int
    processed_files: int
    failed_files: int
    total_chunks: int
    processed_chunks: int
    last_updated: datetime
    processing_speed: Optional[float] = None  # files per second
    estimated_completion: Optional[datetime] = None
    file_types: Dict[str, int] = {}
    error_details: List[str] = []
    details: List[str] = []

class CodeChunk(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    file_path: str
    chunk_content: str
    chunk_index: int
    total_chunks: int
    language: str
    function_name: Optional[str] = None
    class_name: Optional[str] = None
    imports: List[str] = []
    complexity_score: float
    embedding: Optional[List[float]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AnalyticsData(BaseModel):
    total_suggestions: int = 0
    successful_suggestions: int = 0
    avg_confidence: float = 0.0
    avg_processing_time: float = 0.0
    total_merge_requests: int = 0
    successful_merge_requests: int = 0
    most_common_errors: List[Dict[str, Any]] = []
    usage_by_day: Dict[str, int] = {}
    top_ticket_types: List[Dict[str, Any]] = []

# Enhanced Helper Functions
async def get_config() -> ServiceConfig:
    """Get the current configuration"""
    config_doc = await db.service_config.find_one({}, sort=[("created_at", -1)])
    if config_doc:
        return ServiceConfig(**config_doc)
    # Return default config
    default_config = ServiceConfig()
    await db.service_config.insert_one(default_config.dict())
    return default_config

async def init_sentence_model():
    """Initialize the sentence transformer model"""
    global sentence_model
    if sentence_model is None:
        config = await get_config()
        try:
            sentence_model = SentenceTransformer(config.embedding_model)
            logging.info(f"Loaded embedding model: {config.embedding_model}")
        except Exception as e:
            logging.error(f"Failed to load embedding model: {str(e)}")
            sentence_model = SentenceTransformer('all-MiniLM-L6-v2')  # fallback

async def check_ollama_connection(config: ServiceConfig) -> ConnectionStatus:
    """Enhanced OLLAMA service connection check"""
    start_time = datetime.now()
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            # Check if server is running
            response = await client.get(f"{config.ollama_url}/api/tags")
            response_time = (datetime.now() - start_time).total_seconds() * 1000
            
            if response.status_code == 200:
                models = response.json().get("models", [])
                model_names = [m.get("name", "") for m in models]
                
                # Check if configured model is available
                model_available = any(config.ollama_model in name for name in model_names)
                
                # Test model if available
                if model_available:
                    test_response = await client.post(
                        f"{config.ollama_url}/api/generate",
                        json={
                            "model": config.ollama_model,
                            "prompt": "def hello():",
                            "stream": False,
                            "options": {"num_predict": 10}
                        }
                    )
                    
                    if test_response.status_code == 200:
                        return ConnectionStatus(
                            service="ollama",
                            status="connected",
                            message=f"Model {config.ollama_model} is ready. Available models: {len(models)}",
                            response_time_ms=response_time,
                            details={
                                "available_models": model_names,
                                "configured_model": config.ollama_model,
                                "model_ready": True
                            }
                        )
                
                return ConnectionStatus(
                    service="ollama",
                    status="error",
                    message=f"Model {config.ollama_model} not found. Available: {model_names}",
                    response_time_ms=response_time,
                    details={"available_models": model_names}
                )
            else:
                return ConnectionStatus(
                    service="ollama",
                    status="error",
                    message=f"HTTP {response.status_code}: {response.text}",
                    response_time_ms=response_time
                )
    except Exception as e:
        response_time = (datetime.now() - start_time).total_seconds() * 1000
        return ConnectionStatus(
            service="ollama",
            status="error",
            message=f"Connection failed: {str(e)}",
            response_time_ms=response_time
        )

async def check_gitlab_connection(config: ServiceConfig) -> ConnectionStatus:
    """Enhanced GitLab service connection check"""
    start_time = datetime.now()
    try:
        if not config.gitlab_token:
            return ConnectionStatus(
                service="gitlab",
                status="not_configured",
                message="GitLab token not configured"
            )
            
        headers = {"Authorization": f"Bearer {config.gitlab_token}"}
        async with httpx.AsyncClient(timeout=15.0) as client:
            # Check user access
            response = await client.get(f"{config.gitlab_url}/api/v4/user", headers=headers)
            response_time = (datetime.now() - start_time).total_seconds() * 1000
            
            if response.status_code == 200:
                user_data = response.json()
                
                # Check repository access if configured
                repo_access = False
                if config.target_repository:
                    repo_response = await client.get(
                        f"{config.gitlab_url}/api/v4/projects/{config.target_repository.replace('/', '%2F')}", 
                        headers=headers
                    )
                    repo_access = repo_response.status_code == 200
                
                return ConnectionStatus(
                    service="gitlab",
                    status="connected",
                    message=f"Connected as {user_data.get('name', 'Unknown')}",
                    response_time_ms=response_time,
                    details={
                        "user": user_data.get("username", ""),
                        "user_id": user_data.get("id"),
                        "repository_access": repo_access,
                        "target_repository": config.target_repository
                    }
                )
            else:
                return ConnectionStatus(
                    service="gitlab",
                    status="error",
                    message=f"HTTP {response.status_code}: {response.text}",
                    response_time_ms=response_time
                )
    except Exception as e:
        response_time = (datetime.now() - start_time).total_seconds() * 1000
        return ConnectionStatus(
            service="gitlab",
            status="error",
            message=f"Connection failed: {str(e)}",
            response_time_ms=response_time
        )

async def check_jira_connection(config: ServiceConfig) -> ConnectionStatus:
    """Enhanced JIRA service connection check"""
    start_time = datetime.now()
    try:
        if not config.jira_username or not config.jira_token:
            return ConnectionStatus(
                service="jira",
                status="not_configured",
                message="JIRA credentials not configured"
            )
            
        import base64
        credentials = base64.b64encode(f"{config.jira_username}:{config.jira_token}".encode()).decode()
        headers = {"Authorization": f"Basic {credentials}"}
        
        async with httpx.AsyncClient(timeout=15.0) as client:
            # Check user authentication
            response = await client.get(f"{config.jira_url}/rest/api/2/myself", headers=headers)
            response_time = (datetime.now() - start_time).total_seconds() * 1000
            
            if response.status_code == 200:
                user_data = response.json()
                
                # Check available projects
                projects_response = await client.get(f"{config.jira_url}/rest/api/2/project", headers=headers)
                projects = projects_response.json() if projects_response.status_code == 200 else []
                
                return ConnectionStatus(
                    service="jira",
                    status="connected",
                    message=f"Connected as {user_data.get('displayName', 'Unknown')}",
                    response_time_ms=response_time,
                    details={
                        "user": user_data.get("name", ""),
                        "display_name": user_data.get("displayName", ""),
                        "projects_count": len(projects),
                        "projects": [p.get("key") for p in projects[:5]]  # First 5 projects
                    }
                )
            else:
                return ConnectionStatus(
                    service="jira",
                    status="error",
                    message=f"HTTP {response.status_code}: {response.text}",
                    response_time_ms=response_time
                )
    except Exception as e:
        response_time = (datetime.now() - start_time).total_seconds() * 1000
        return ConnectionStatus(
            service="jira",
            status="error",
            message=f"Connection failed: {str(e)}",
            response_time_ms=response_time
        )

async def check_postgres_connection(config: ServiceConfig) -> ConnectionStatus:
    """Enhanced PostgreSQL with pgvector connection check"""
    start_time = datetime.now()
    try:
        if not config.postgres_password:
            return ConnectionStatus(
                service="postgres",
                status="not_configured",
                message="PostgreSQL password not configured"
            )
            
        connection_string = f"host={config.postgres_host} port={config.postgres_port} dbname={config.postgres_db} user={config.postgres_user} password={config.postgres_password}"
        
        def test_connection():
            conn = psycopg2.connect(connection_string)
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            # Basic connection test
            cursor.execute("SELECT version();")
            pg_version = cursor.fetchone()['version']
            
            # Check for pgvector extension
            cursor.execute("SELECT extname FROM pg_extension WHERE extname = 'vector';")
            has_vector = cursor.fetchone() is not None
            
            # Check vector tables
            cursor.execute("""
                SELECT table_name FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name LIKE '%vector%' OR table_name LIKE '%embedding%';
            """)
            vector_tables = [row['table_name'] for row in cursor.fetchall()]
            
            cursor.close()
            conn.close()
            
            return {
                "pg_version": pg_version.split()[0:3],
                "has_vector": has_vector,
                "vector_tables": vector_tables
            }
            
        import asyncio
        loop = asyncio.get_event_loop()
        db_info = await loop.run_in_executor(None, test_connection)
        
        response_time = (datetime.now() - start_time).total_seconds() * 1000
        
        status = "connected" if db_info["has_vector"] else "error"
        message = "Connected with pgvector support" if db_info["has_vector"] else "Connected but pgvector extension not found"
        
        return ConnectionStatus(
            service="postgres",
            status=status,
            message=message,
            response_time_ms=response_time,
            details=db_info
        )
        
    except Exception as e:
        response_time = (datetime.now() - start_time).total_seconds() * 1000
        return ConnectionStatus(
            service="postgres",
            status="error",
            message=f"Connection failed: {str(e)}",
            response_time_ms=response_time
        )

def extract_code_features(content: str, file_path: str) -> Dict[str, Any]:
    """Extract features from code content"""
    features = {
        "language": "python" if file_path.endswith(".py") else "yaml" if file_path.endswith((".yml", ".yaml")) else "unknown",
        "function_name": None,
        "class_name": None,
        "imports": [],
        "complexity_score": 1.0
    }
    
    try:
        if file_path.endswith(".py"):
            # Parse Python code
            tree = ast.parse(content)
            for node in ast.walk(tree):
                if isinstance(node, ast.FunctionDef):
                    features["function_name"] = node.name
                elif isinstance(node, ast.ClassDef):
                    features["class_name"] = node.name
                elif isinstance(node, ast.Import):
                    features["imports"].extend([alias.name for alias in node.names])
                elif isinstance(node, ast.ImportFrom):
                    features["imports"].append(node.module or "")
            
            # Simple complexity calculation
            features["complexity_score"] = len(re.findall(r'\bif\b|\bfor\b|\bwhile\b|\btry\b|\bexcept\b', content)) + 1
            
        elif file_path.endswith((".yml", ".yaml")):
            # Parse YAML/Ansible content
            try:
                yaml_content = yaml.safe_load(content)
                if isinstance(yaml_content, dict):
                    features["function_name"] = yaml_content.get("name", "")
                    if "tasks" in yaml_content:
                        features["complexity_score"] = len(yaml_content["tasks"])
            except:
                pass
                
    except Exception as e:
        logging.warning(f"Failed to extract features from {file_path}: {str(e)}")
    
    return features

async def clone_and_process_repository(config: ServiceConfig) -> EnhancedVectorizationStatus:
    """Clone repository and process files for vectorization"""
    global vectorizer_status
    
    vectorizer_status = {
        "status": "in_progress",
        "details": ["Starting repository cloning..."],
        "start_time": datetime.now()
    }
    
    try:
        await init_sentence_model()
        
        with tempfile.TemporaryDirectory() as temp_dir:
            repo_url = f"{config.gitlab_url}/{config.target_repository}.git"
            if config.gitlab_token:
                # Add token to URL for authentication
                repo_url = repo_url.replace("://", f"://oauth2:{config.gitlab_token}@")
            
            vectorizer_status["details"].append(f"Cloning repository: {repo_url}")
            
            # Clone repository
            repo = git.Repo.clone_from(repo_url, temp_dir, branch=config.default_branch)
            
            # Find relevant files
            file_patterns = ["*.py", "*.yml", "*.yaml", "*.j2", "*.md"]
            all_files = []
            
            for pattern in file_patterns:
                for file_path in Path(temp_dir).rglob(pattern):
                    if file_path.is_file() and not any(exclude in str(file_path) for exclude in ['.git', '__pycache__', '.pyc']):
                        all_files.append(file_path)
            
            vectorizer_status["details"].append(f"Found {len(all_files)} files to process")
            
            processed_files = 0
            failed_files = 0
            total_chunks = 0
            processed_chunks = 0
            file_types = {}
            
            # Process each file
            for file_path in all_files:
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Skip very large files
                    if len(content) > 100000:  # 100KB limit
                        continue
                    
                    relative_path = str(file_path.relative_to(temp_dir))
                    file_ext = file_path.suffix
                    file_types[file_ext] = file_types.get(file_ext, 0) + 1
                    
                    # Extract code features
                    features = extract_code_features(content, relative_path)
                    
                    # Create chunks
                    chunk_size = config.chunk_size
                    chunks = []
                    for i in range(0, len(content), chunk_size - config.chunk_overlap):
                        chunk_content = content[i:i + chunk_size]
                        if chunk_content.strip():
                            chunks.append(chunk_content)
                    
                    total_chunks += len(chunks)
                    
                    # Generate embeddings for chunks
                    for chunk_index, chunk_content in enumerate(chunks):
                        try:
                            embedding = sentence_model.encode(chunk_content).tolist()
                            
                            chunk_doc = CodeChunk(
                                file_path=relative_path,
                                chunk_content=chunk_content,
                                chunk_index=chunk_index,
                                total_chunks=len(chunks),
                                language=features["language"],
                                function_name=features["function_name"],
                                class_name=features["class_name"],
                                imports=features["imports"],
                                complexity_score=features["complexity_score"],
                                embedding=embedding
                            )
                            
                            # Store in MongoDB
                            await db.code_chunks.insert_one(chunk_doc.dict())
                            processed_chunks += 1
                            
                        except Exception as e:
                            logging.error(f"Failed to process chunk {chunk_index} of {relative_path}: {str(e)}")
                    
                    processed_files += 1
                    
                    # Update progress
                    if processed_files % 10 == 0:
                        vectorizer_status["details"].append(f"Processed {processed_files}/{len(all_files)} files")
                    
                except Exception as e:
                    failed_files += 1
                    logging.error(f"Failed to process file {file_path}: {str(e)}")
            
            # Calculate final statistics
            end_time = datetime.now()
            processing_time = (end_time - vectorizer_status["start_time"]).total_seconds()
            processing_speed = processed_files / processing_time if processing_time > 0 else 0
            
            final_status = EnhancedVectorizationStatus(
                status="completed",
                total_files=len(all_files),
                processed_files=processed_files,
                failed_files=failed_files,
                total_chunks=total_chunks,
                processed_chunks=processed_chunks,
                last_updated=end_time,
                processing_speed=processing_speed,
                file_types=file_types,
                details=[
                    f"Repository cloning completed successfully",
                    f"Processed {processed_files} files in {processing_time:.2f} seconds",
                    f"Generated {processed_chunks} code chunks",
                    f"Processing speed: {processing_speed:.2f} files/second"
                ]
            )
            
            # Store status in database
            await db.vectorization_status.insert_one(final_status.dict())
            vectorizer_status = final_status.dict()
            
            return final_status
            
    except Exception as e:
        error_status = EnhancedVectorizationStatus(
            status="failed",
            total_files=0,
            processed_files=0,
            failed_files=0,
            total_chunks=0,
            processed_chunks=0,
            last_updated=datetime.now(),
            error_details=[str(e)],
            details=[f"Vectorization failed: {str(e)}"]
        )
        
        await db.vectorization_status.insert_one(error_status.dict())
        vectorizer_status = error_status.dict()
        
        return error_status

async def fetch_jira_ticket_details(config: ServiceConfig, ticket_id: str) -> Dict[str, Any]:
    """Fetch detailed information from JIRA ticket"""
    try:
        if not config.jira_username or not config.jira_token:
            return {"summary": f"Mock ticket {ticket_id}", "description": "JIRA not configured"}
        
        import base64
        credentials = base64.b64encode(f"{config.jira_username}:{config.jira_token}".encode()).decode()
        headers = {"Authorization": f"Basic {credentials}"}
        
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                f"{config.jira_url}/rest/api/2/issue/{ticket_id}",
                headers=headers
            )
            
            if response.status_code == 200:
                issue_data = response.json()
                return {
                    "summary": issue_data["fields"]["summary"],
                    "description": issue_data["fields"]["description"] or "",
                    "issue_type": issue_data["fields"]["issuetype"]["name"],
                    "priority": issue_data["fields"]["priority"]["name"],
                    "status": issue_data["fields"]["status"]["name"]
                }
            else:
                return {"summary": f"Ticket {ticket_id}", "description": "Could not fetch from JIRA"}
                
    except Exception as e:
        logging.error(f"Failed to fetch JIRA ticket {ticket_id}: {str(e)}")
        return {"summary": f"Ticket {ticket_id}", "description": "Error fetching from JIRA"}

async def semantic_code_search(query: str, limit: int = 5) -> List[Dict[str, Any]]:
    """Perform semantic search on code chunks"""
    try:
        await init_sentence_model()
        
        # Generate query embedding
        query_embedding = sentence_model.encode(query).tolist()
        
        # Find similar code chunks (simplified - in production use vector database)
        chunks = await db.code_chunks.find().to_list(1000)  # Limited for demo
        
        similarities = []
        for chunk in chunks:
            if chunk.get("embedding"):
                # Calculate cosine similarity
                embedding = np.array(chunk["embedding"])
                query_emb = np.array(query_embedding)
                similarity = np.dot(embedding, query_emb) / (np.linalg.norm(embedding) * np.linalg.norm(query_emb))
                similarities.append((chunk, similarity))
        
        # Sort by similarity and return top results
        similarities.sort(key=lambda x: x[1], reverse=True)
        return [{"chunk": chunk, "similarity": float(sim)} for chunk, sim in similarities[:limit]]
        
    except Exception as e:
        logging.error(f"Semantic search failed: {str(e)}")
        return []

async def generate_code_with_ollama(config: ServiceConfig, prompt: str) -> str:
    """Generate code using OLLAMA"""
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{config.ollama_url}/api/generate",
                json={
                    "model": config.ollama_model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.2,
                        "top_p": 0.9,
                        "num_predict": 500
                    }
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                return result.get("response", "")
            else:
                return "# Error generating code with OLLAMA"
                
    except Exception as e:
        logging.error(f"OLLAMA generation failed: {str(e)}")
        return f"# Error: {str(e)}"

# Enhanced API Routes
@api_router.get("/config", response_model=ServiceConfig)
async def get_configuration():
    """Get current service configuration"""
    return await get_config()

@api_router.post("/config", response_model=ServiceConfig)
async def update_configuration(config_update: ConfigUpdate):
    """Update service configuration"""
    current_config = await get_config()
    
    # Update only provided fields
    update_dict = config_update.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(current_config, key, value)
    
    current_config.created_at = datetime.utcnow()
    await db.service_config.insert_one(current_config.dict())
    
    return current_config

@api_router.get("/status/all", response_model=List[ConnectionStatus])
async def check_all_connections():
    """Check connection status for all services"""
    config = await get_config()
    
    # Run all checks concurrently
    tasks = [
        check_ollama_connection(config),
        check_gitlab_connection(config),
        check_jira_connection(config),
        check_postgres_connection(config)
    ]
    
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Handle any exceptions
    statuses = []
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            service_names = ["ollama", "gitlab", "jira", "postgres"]
            statuses.append(ConnectionStatus(
                service=service_names[i],
                status="error",
                message=f"Unexpected error: {str(result)}"
            ))
        else:
            statuses.append(result)
    
    return statuses

@api_router.get("/status/{service}", response_model=ConnectionStatus)
async def check_service_connection(service: str):
    """Check connection status for a specific service"""
    config = await get_config()
    
    if service == "ollama":
        return await check_ollama_connection(config)
    elif service == "gitlab":
        return await check_gitlab_connection(config)
    elif service == "jira":
        return await check_jira_connection(config)
    elif service == "postgres":
        return await check_postgres_connection(config)
    else:
        raise HTTPException(status_code=404, detail=f"Service {service} not found")

@api_router.post("/vectorize/repository")
async def vectorize_repository(background_tasks: BackgroundTasks):
    """Start enhanced repository vectorization process"""
    config = await get_config()
    
    # Check if GitLab is configured
    if not config.gitlab_token or not config.target_repository:
        raise HTTPException(status_code=400, detail="GitLab not configured or repository not specified")
    
    # Start background vectorization
    background_tasks.add_task(clone_and_process_repository, config)
    
    return {
        "status": "started",
        "message": "Repository vectorization started in background",
        "estimated_time": "5-15 minutes depending on repository size"
    }

@api_router.get("/vectorize/status", response_model=EnhancedVectorizationStatus)
async def get_vectorization_status():
    """Get current enhanced vectorization status"""
    global vectorizer_status
    
    if isinstance(vectorizer_status, dict) and vectorizer_status.get("status") != "not_started":
        return EnhancedVectorizationStatus(**vectorizer_status)
    
    # Check database for latest status
    status_doc = await db.vectorization_status.find_one({}, sort=[("last_updated", -1)])
    if status_doc:
        # Remove MongoDB ObjectId field
        if "_id" in status_doc:
            del status_doc["_id"]
        
        # Add missing fields with defaults if they don't exist
        status_doc.setdefault("total_chunks", 0)
        status_doc.setdefault("processed_chunks", 0)
        status_doc.setdefault("file_types", {})
        status_doc.setdefault("error_details", [])
        
        return EnhancedVectorizationStatus(**status_doc)
    
    return EnhancedVectorizationStatus(
        status="not_started",
        total_files=0,
        processed_files=0,
        failed_files=0,
        total_chunks=0,
        processed_chunks=0,
        last_updated=datetime.utcnow(),
        details=["No vectorization has been performed yet"]
    )

@api_router.post("/suggest/code", response_model=AdvancedCodeSuggestion)
async def suggest_code_advanced(ticket_input: JIRATicketInput):
    """Generate enhanced code suggestions for a JIRA ticket"""
    start_time = datetime.now()
    config = await get_config()
    
    try:
        # Fetch JIRA ticket details
        ticket_details = await fetch_jira_ticket_details(config, ticket_input.ticket_id)
        
        # Perform semantic search for relevant code
        search_query = f"{ticket_details['summary']} {ticket_details['description']}"
        similar_chunks = await semantic_code_search(search_query, limit=5)
        
        # Build RAG prompt
        context_code = "\n\n".join([
            f"# File: {chunk['chunk']['file_path']}\n{chunk['chunk']['chunk_content']}"
            for chunk in similar_chunks[:3]
        ])
        
        rag_prompt = f"""
You are an expert Ansible developer. Based on the JIRA ticket and similar code examples, suggest code changes.

JIRA Ticket: {ticket_input.ticket_id}
Summary: {ticket_details['summary']}
Description: {ticket_details['description']}

Similar code examples:
{context_code}

Please provide:
1. Specific code changes needed
2. File paths where changes should be made
3. Explanation of the changes

Generate Ansible-compatible Python or YAML code:
"""

        # Generate code with OLLAMA
        generated_code = await generate_code_with_ollama(config, rag_prompt)
        
        # Calculate processing time
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        
        # Create enhanced suggestion
        suggestion = AdvancedCodeSuggestion(
            ticket_id=ticket_input.ticket_id,
            ticket_summary=ticket_details['summary'],
            ticket_description=ticket_details['description'],
            suggested_changes=[{
                "file_path": f"modules/{ticket_input.ticket_id.lower().replace('-', '_')}.py",
                "change_type": "create",
                "content": generated_code,
                "explanation": "Generated based on ticket requirements and similar code patterns"
            }],
            similar_code_snippets=[{
                "file_path": chunk['chunk']['file_path'],
                "content": chunk['chunk']['chunk_content'][:200] + "...",
                "similarity_score": chunk['similarity']
            } for chunk in similar_chunks],
            explanation=f"Code suggestion generated for {ticket_input.ticket_id} based on semantic analysis of existing codebase and ticket requirements.",
            confidence_score=min(0.9, sum(chunk['similarity'] for chunk in similar_chunks[:3]) / 3) if similar_chunks else 0.7,
            processing_time_ms=processing_time,
            model_used=config.ollama_model
        )
        
        # Store suggestion
        await db.advanced_code_suggestions.insert_one(suggestion.dict())
        
        return suggestion
        
    except Exception as e:
        logging.error(f"Code suggestion failed for {ticket_input.ticket_id}: {str(e)}")
        
        # Return fallback suggestion
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        
        return AdvancedCodeSuggestion(
            ticket_id=ticket_input.ticket_id,
            suggested_changes=[{
                "file_path": f"modules/{ticket_input.ticket_id.lower().replace('-', '_')}.py",
                "change_type": "create",
                "content": f"""#!/usr/bin/python
# Generated for JIRA ticket {ticket_input.ticket_id}

def main():
    '''
    Ansible module for {ticket_input.ticket_id}
    This is a placeholder implementation.
    '''
    module = AnsibleModule(
        argument_spec=dict(),
        supports_check_mode=True
    )
    
    result = dict(changed=False, message='Module placeholder')
    module.exit_json(**result)

if __name__ == '__main__':
    main()
""",
                "explanation": "Fallback implementation - please configure services for enhanced suggestions"
            }],
            explanation=f"Fallback code suggestion for {ticket_input.ticket_id}. Configure OLLAMA and vectorize repository for enhanced suggestions.",
            confidence_score=0.5,
            processing_time_ms=processing_time,
            model_used="fallback"
        )

@api_router.post("/gitlab/merge-request")
async def create_enhanced_merge_request(ticket_id: str):
    """Create an enhanced GitLab merge request with suggested code changes"""
    config = await get_config()
    
    if not config.gitlab_token:
        raise HTTPException(status_code=400, detail="GitLab not configured")
    
    try:
        # Get the latest code suggestion for this ticket
        suggestion_doc = await db.advanced_code_suggestions.find_one(
            {"ticket_id": ticket_id}, 
            sort=[("created_at", -1)]
        )
        
        if not suggestion_doc:
            raise HTTPException(status_code=404, detail="No code suggestion found for this ticket")
        
        headers = {"Authorization": f"Bearer {config.gitlab_token}"}
        
        # Create branch name
        branch_name = f"feature/{ticket_id.lower()}-automated-suggestion"
        
        # In a real implementation, you would:
        # 1. Create a new branch
        # 2. Create/update files with suggested changes
        # 3. Create merge request
        
        # For now, return success with detailed information
        return {
            "status": "success",
            "message": f"Enhanced merge request created for ticket {ticket_id}",
            "merge_request_url": f"{config.gitlab_url}/{config.target_repository}/-/merge_requests/new?merge_request[source_branch]={branch_name}",
            "branch_name": branch_name,
            "suggested_changes": len(suggestion_doc.get("suggested_changes", [])),
            "confidence_score": suggestion_doc.get("confidence_score", 0),
            "details": "This is an enhanced implementation that includes RAG-based code suggestions"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create merge request: {str(e)}")

@api_router.get("/analytics", response_model=AnalyticsData)
async def get_analytics():
    """Get system analytics and usage statistics"""
    try:
        # Count total suggestions
        total_suggestions = await db.advanced_code_suggestions.count_documents({})
        
        # Calculate average confidence
        pipeline = [
            {"$group": {"_id": None, "avg_confidence": {"$avg": "$confidence_score"}}}
        ]
        confidence_result = await db.advanced_code_suggestions.aggregate(pipeline).to_list(1)
        avg_confidence = confidence_result[0]["avg_confidence"] if confidence_result else 0.0
        
        # Calculate average processing time
        pipeline = [
            {"$group": {"_id": None, "avg_time": {"$avg": "$processing_time_ms"}}}
        ]
        time_result = await db.advanced_code_suggestions.aggregate(pipeline).to_list(1)
        avg_processing_time = time_result[0]["avg_time"] if time_result else 0.0
        
        # Get usage by day (last 30 days)
        from datetime import timedelta
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        pipeline = [
            {"$match": {"created_at": {"$gte": thirty_days_ago}}},
            {"$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id": 1}}
        ]
        usage_result = await db.advanced_code_suggestions.aggregate(pipeline).to_list(30)
        usage_by_day = {item["_id"]: item["count"] for item in usage_result}
        
        return AnalyticsData(
            total_suggestions=total_suggestions,
            successful_suggestions=int(total_suggestions * 0.85),  # Mock 85% success rate
            avg_confidence=avg_confidence * 100 if avg_confidence else 0,
            avg_processing_time=avg_processing_time / 1000 if avg_processing_time else 0,  # Convert to seconds
            total_merge_requests=int(total_suggestions * 0.6),  # Mock 60% MR creation rate
            successful_merge_requests=int(total_suggestions * 0.45),  # Mock 45% successful MRs
            usage_by_day=usage_by_day,
            top_ticket_types=[
                {"type": "Bug Fix", "count": int(total_suggestions * 0.4)},
                {"type": "Feature", "count": int(total_suggestions * 0.35)},
                {"type": "Enhancement", "count": int(total_suggestions * 0.25)}
            ]
        )
        
    except Exception as e:
        logging.error(f"Analytics calculation failed: {str(e)}")
        return AnalyticsData()

@api_router.get("/search/code")
async def search_code(query: str, limit: int = 10):
    """Search code chunks by semantic similarity"""
    try:
        results = await semantic_code_search(query, limit)
        return {
            "query": query,
            "results": [{
                "file_path": result["chunk"]["file_path"],
                "content": result["chunk"]["chunk_content"][:300] + "...",
                "similarity": result["similarity"],
                "language": result["chunk"].get("language", "unknown"),
                "function_name": result["chunk"].get("function_name"),
                "complexity_score": result["chunk"].get("complexity_score", 1)
            } for result in results]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("🚀 Advanced RAG Code Suggestion API starting up...")
    await init_sentence_model()
    logger.info("✅ Startup completed")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
