from pydantic import BaseModel, ConfigDict
from typing import List, Dict, Any, Optional
from datetime import datetime

class AgentInput(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    
    agent_name: str
    task_type: str
    project_id: str
    input_data: Dict[str, Any]
    model_preference: Optional[str] = None

class AgentOutput(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    
    agent_name: str
    task_type: str
    project_id: str
    output_data: Dict[str, Any]
    model_used: str
    reasoning: str
    execution_time: float
    success: bool
    error_message: Optional[str] = None

class FileUpload(BaseModel):
    filename: str
    content: bytes
    file_type: str

class ProjectCreate(BaseModel):
    name: str
    substation_id: str
    substation_name: Optional[str] = None
    description: Optional[str] = None
    language: str = "es"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    voltage_level: Optional[str] = None
    capacity_mw: Optional[float] = None
    technology_type: Optional[str] = None
    grid_connection_type: Optional[str] = None
    project_developer: Optional[str] = None

class ProjectResponse(BaseModel):
    id: str
    name: str
    substation_id: str
    substation_name: Optional[str]
    description: Optional[str]
    language: str
    status: str
    latitude: Optional[float]
    longitude: Optional[float]
    voltage_level: Optional[str]
    capacity_mw: Optional[float]
    technology_type: Optional[str]
    grid_connection_type: Optional[str]
    project_developer: Optional[str]
    created_at: datetime
    updated_at: datetime

class DocumentResponse(BaseModel):
    id: str
    project_id: str
    doc_type: str
    title: str
    version: int
    status: str
    quality_score: Optional[float]
    placeholders: Optional[List[str]]
    origin: Optional[str]
    content: Optional[str]
    created_at: datetime
    updated_at: datetime

class DocumentVersionRequest(BaseModel):
    content: str
    change_summary: Optional[str] = None
    author_name: str = "User"
    author_email: Optional[str] = None

class DocumentVersionResponse(BaseModel):
    id: str
    document_id: str
    version_number: int
    author_id: str
    author_name: str
    author_email: Optional[str]
    origin: str
    change_summary: Optional[str]
    created_at: datetime

class DocumentReviewRequest(BaseModel):
    status: str  # approved, rejected, needs_revision
    feedback: Optional[str] = None
    reviewer_name: Optional[str] = None

class KPIResponse(BaseModel):
    metric_name: str
    metric_value: float
    metric_type: str
    calculated_at: datetime

class AgentTraceResponse(BaseModel):
    id: str
    agent_name: str
    task_type: str
    model_used: str
    execution_time: float
    success: bool
    created_at: datetime