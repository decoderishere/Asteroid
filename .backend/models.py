from sqlalchemy import Column, Integer, String, DateTime, Text, Float, Boolean, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

Base = declarative_base()

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    substation_id = Column(String, nullable=False)
    substation_name = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    voltage_level = Column(String)
    capacity_mw = Column(Float)
    technology_type = Column(String)
    grid_connection_type = Column(String)
    project_developer = Column(String)
    description = Column(Text)
    language = Column(String, default="es")  # Spanish by default
    status = Column(String, default="draft")
    setup_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    files = relationship("ProjectFile", back_populates="project", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="project", cascade="all, delete-orphan")
    agent_traces = relationship("AgentTrace", back_populates="project", cascade="all, delete-orphan")

class ProjectFile(Base):
    __tablename__ = "project_files"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    file_size = Column(Integer)
    origin = Column(String, nullable=False, default="user_uploaded")  # user_uploaded, ai_generated, coordinator_provided
    processed = Column(Boolean, default=False)
    extracted_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    project = relationship("Project", back_populates="files")

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    doc_type = Column(String, nullable=False)  # "environmental_impact", "interconnection_request", etc.
    title = Column(String, nullable=False)
    content = Column(Text)
    version = Column(Integer, default=1)
    status = Column(String, default="draft")  # draft, needs_review, approved, rejected
    quality_score = Column(Float)
    file_path = Column(String)
    origin = Column(String, nullable=False, default="ai_generated")  # ai_generated, user_uploaded, coordinator_provided
    source_files = Column(JSON)  # Track which files contributed to this doc
    placeholders = Column(JSON)  # Missing info flagged as placeholders
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    project = relationship("Project", back_populates="documents")
    reviews = relationship("DocumentReview", back_populates="document", cascade="all, delete-orphan")
    versions = relationship("DocumentVersion", back_populates="document", cascade="all, delete-orphan", order_by="DocumentVersion.version_number")

class DocumentReview(Base):
    __tablename__ = "document_reviews"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String, ForeignKey("documents.id"), nullable=False)
    reviewer_type = Column(String, nullable=False)  # "agent" or "human"
    reviewer_name = Column(String)
    status = Column(String, nullable=False)  # "approved", "rejected", "needs_revision"
    score = Column(Float)
    feedback = Column(Text)
    missing_elements = Column(JSON)
    recommendations = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    document = relationship("Document", back_populates="reviews")

class AgentTrace(Base):
    __tablename__ = "agent_traces"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    agent_name = Column(String, nullable=False)
    task_type = Column(String, nullable=False)
    input_data = Column(JSON)
    output_data = Column(JSON)
    model_used = Column(String)
    reasoning = Column(Text)
    execution_time = Column(Float)
    success = Column(Boolean, default=True)
    error_message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    project = relationship("Project", back_populates="agent_traces")

class DocumentVersion(Base):
    __tablename__ = "document_versions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String, ForeignKey("documents.id"), nullable=False)
    version_number = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    author_id = Column(String, nullable=False)
    author_name = Column(String, nullable=False)
    author_email = Column(String)
    origin = Column(String, nullable=False)  # 'AI_GENERATED', 'USER_EDITED', 'COORDINATOR_UPDATED'
    change_summary = Column(String)
    file_path = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    document = relationship("Document", back_populates="versions")

class KPIMetric(Base):
    __tablename__ = "kpi_metrics"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id"))
    metric_name = Column(String, nullable=False)
    metric_value = Column(Float, nullable=False)
    metric_type = Column(String, nullable=False)  # "percentage", "count", "average", etc.
    calculated_at = Column(DateTime, default=datetime.utcnow)
    
    # Global metrics (project_id can be null for system-wide KPIs)
    
class PermittingTemplate(Base):
    __tablename__ = "permitting_templates"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    template_name = Column(String, nullable=False)
    template_type = Column(String, nullable=False)
    language = Column(String, default="es")
    content_template = Column(Text, nullable=False)
    required_fields = Column(JSON)
    chile_specific_rules = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)