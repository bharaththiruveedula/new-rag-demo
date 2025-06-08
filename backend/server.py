from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
import uuid
from datetime import datetime
import httpx
import asyncio
import psycopg2
from psycopg2.extras import RealDictCursor
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="RAG Code Suggestion API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configuration Models
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

class ConnectionStatus(BaseModel):
    service: str
    status: str
    message: str
    response_time_ms: Optional[float] = None
    details: Optional[Dict[str, Any]] = None

class JIRATicketInput(BaseModel):
    ticket_id: str
    
class CodeSuggestion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    ticket_id: str
    suggested_code: str
    file_path: str
    explanation: str
    confidence_score: float
    created_at: datetime = Field(default_factory=datetime.utcnow)

class VectorizationStatus(BaseModel):
    status: str
    total_files: int
    processed_files: int
    failed_files: int
    last_updated: datetime
    details: List[str] = []

# Helper Functions
async def get_config() -> ServiceConfig:
    """Get the current configuration"""
    config_doc = await db.service_config.find_one({}, sort=[("created_at", -1)])
    if config_doc:
        return ServiceConfig(**config_doc)
    # Return default config
    default_config = ServiceConfig()
    await db.service_config.insert_one(default_config.dict())
    return default_config

async def check_ollama_connection(config: ServiceConfig) -> ConnectionStatus:
    """Check OLLAMA service connection"""
    start_time = datetime.now()
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{config.ollama_url}/api/tags")
            response_time = (datetime.now() - start_time).total_seconds() * 1000
            
            if response.status_code == 200:
                models = response.json().get("models", [])
                return ConnectionStatus(
                    service="ollama",
                    status="connected",
                    message=f"Connected successfully. Available models: {len(models)}",
                    response_time_ms=response_time,
                    details={"models": [m.get("name", "") for m in models]}
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
    """Check GitLab service connection"""
    start_time = datetime.now()
    try:
        if not config.gitlab_token:
            return ConnectionStatus(
                service="gitlab",
                status="not_configured",
                message="GitLab token not configured"
            )
            
        headers = {"Authorization": f"Bearer {config.gitlab_token}"}
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{config.gitlab_url}/api/v4/user", headers=headers)
            response_time = (datetime.now() - start_time).total_seconds() * 1000
            
            if response.status_code == 200:
                user_data = response.json()
                return ConnectionStatus(
                    service="gitlab",
                    status="connected",
                    message=f"Connected as {user_data.get('name', 'Unknown')}",
                    response_time_ms=response_time,
                    details={"user": user_data.get("username", "")}
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
    """Check JIRA service connection"""
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
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{config.jira_url}/rest/api/2/myself", headers=headers)
            response_time = (datetime.now() - start_time).total_seconds() * 1000
            
            if response.status_code == 200:
                user_data = response.json()
                return ConnectionStatus(
                    service="jira",
                    status="connected",
                    message=f"Connected as {user_data.get('displayName', 'Unknown')}",
                    response_time_ms=response_time,
                    details={"user": user_data.get("name", "")}
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
    """Check PostgreSQL with pgvector connection"""
    start_time = datetime.now()
    try:
        if not config.postgres_password:
            return ConnectionStatus(
                service="postgres",
                status="not_configured",
                message="PostgreSQL password not configured"
            )
            
        connection_string = f"host={config.postgres_host} port={config.postgres_port} dbname={config.postgres_db} user={config.postgres_user} password={config.postgres_password}"
        
        # Test connection in a thread since psycopg2 is synchronous
        def test_connection():
            conn = psycopg2.connect(connection_string)
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            cursor.execute("SELECT extname FROM pg_extension WHERE extname = 'vector'")
            has_vector = cursor.fetchone() is not None
            cursor.close()
            conn.close()
            return has_vector
            
        import asyncio
        loop = asyncio.get_event_loop()
        has_vector = await loop.run_in_executor(None, test_connection)
        
        response_time = (datetime.now() - start_time).total_seconds() * 1000
        
        return ConnectionStatus(
            service="postgres",
            status="connected",
            message=f"Connected successfully. pgvector extension: {'enabled' if has_vector else 'not found'}",
            response_time_ms=response_time,
            details={"pgvector_enabled": has_vector}
        )
        
    except Exception as e:
        response_time = (datetime.now() - start_time).total_seconds() * 1000
        return ConnectionStatus(
            service="postgres",
            status="error",
            message=f"Connection failed: {str(e)}",
            response_time_ms=response_time
        )

# API Routes
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
        raise HTTPException(status_code=404, message=f"Service {service} not found")

@api_router.post("/vectorize/repository")
async def vectorize_repository():
    """Start repository vectorization process"""
    config = await get_config()
    
    # Check if GitLab is configured
    if not config.gitlab_token or not config.target_repository:
        raise HTTPException(status_code=400, detail="GitLab not configured or repository not specified")
    
    # This is a placeholder - actual implementation would:
    # 1. Clone/fetch the repository
    # 2. Parse Python/Ansible files
    # 3. Create embeddings using a suitable model
    # 4. Store in pgvector
    
    # For now, return a mock response
    status = VectorizationStatus(
        status="in_progress",
        total_files=0,
        processed_files=0,
        failed_files=0,
        last_updated=datetime.utcnow(),
        details=["Repository vectorization started", "This is a placeholder implementation"]
    )
    
    await db.vectorization_status.insert_one(status.dict())
    return status

@api_router.get("/vectorize/status", response_model=VectorizationStatus)
async def get_vectorization_status():
    """Get current vectorization status"""
    status_doc = await db.vectorization_status.find_one({}, sort=[("last_updated", -1)])
    if status_doc:
        return VectorizationStatus(**status_doc)
    
    return VectorizationStatus(
        status="not_started",
        total_files=0,
        processed_files=0,
        failed_files=0,
        last_updated=datetime.utcnow(),
        details=["No vectorization has been performed yet"]
    )

@api_router.post("/suggest/code", response_model=CodeSuggestion)
async def suggest_code(ticket_input: JIRATicketInput):
    """Generate code suggestions for a JIRA ticket"""
    config = await get_config()
    
    # This is a placeholder implementation
    # Actual implementation would:
    # 1. Fetch JIRA ticket details
    # 2. Use RAG to find relevant code snippets
    # 3. Generate suggestions using OLLAMA
    # 4. Format as git diff
    
    suggestion = CodeSuggestion(
        ticket_id=ticket_input.ticket_id,
        suggested_code="""# Placeholder code suggestion for ticket {ticket_id}
def fix_ansible_module():
    '''
    This is a placeholder implementation.
    Actual code would be generated based on:
    - JIRA ticket description
    - RAG search results
    - OLLAMA model inference
    '''
    pass""".format(ticket_id=ticket_input.ticket_id),
        file_path=f"modules/custom_module_{ticket_input.ticket_id.lower()}.py",
        explanation=f"This is a placeholder code suggestion for JIRA ticket {ticket_input.ticket_id}",
        confidence_score=0.85
    )
    
    await db.code_suggestions.insert_one(suggestion.dict())
    return suggestion

@api_router.post("/gitlab/merge-request")
async def create_merge_request(ticket_id: str):
    """Create a GitLab merge request with suggested code changes"""
    config = await get_config()
    
    if not config.gitlab_token:
        raise HTTPException(status_code=400, detail="GitLab not configured")
    
    # This is a placeholder implementation
    # Actual implementation would:
    # 1. Get the code suggestion for the ticket
    # 2. Create a new branch
    # 3. Commit the changes
    # 4. Create a merge request
    
    return {
        "status": "success",
        "message": f"Merge request created for ticket {ticket_id}",
        "merge_request_url": f"{config.gitlab_url}/merge_requests/placeholder",
        "branch_name": f"feature/jira-{ticket_id}"
    }

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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
