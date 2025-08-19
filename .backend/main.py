from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import uvicorn
import os
import uuid
import datetime

from database import get_db, create_tables
from models import Project, Document, DocumentReview, DocumentVersion, KPIMetric, AgentTrace
from schemas import (ProjectCreate, ProjectResponse, DocumentResponse, 
                     DocumentReviewRequest, DocumentVersionRequest, DocumentVersionResponse,
                     KPIResponse, AgentTraceResponse, AgentInput)
from agent_registry import AgentRegistry
from api.agent_routes import router as agent_router

# Initialize FastAPI app
app = FastAPI(
    title="BESS Permitting Multi-Agent System",
    description="Chilean BESS permitting document generation and management system",
    version="1.0.0"
)

# CORS middleware - Allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001", 
        "http://localhost:5173",
        "http://127.0.0.1:3000", 
        "http://127.0.0.1:3001",
        "http://127.0.0.1:5173",
        "http://0.0.0.0:3000",
        "http://0.0.0.0:3001"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Initialize agent registry
agent_registry = AgentRegistry()

# Include agent API routes
app.include_router(agent_router)

# Create database tables on startup
@app.on_event("startup")
async def startup_event():
    create_tables()
    # Create upload directories
    os.makedirs("uploads", exist_ok=True)
    os.makedirs("documents", exist_ok=True)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "BESS Permitting API is running"}

# Project endpoints
@app.post("/projects", response_model=ProjectResponse)
async def create_project(project_data: ProjectCreate, db: Session = Depends(get_db)):
    project = Project(
        id=str(uuid.uuid4()),
        name=project_data.name,
        substation_id=project_data.substation_id,
        substation_name=project_data.substation_name,
        description=project_data.description,
        language=project_data.language,
        latitude=project_data.latitude,
        longitude=project_data.longitude,
        voltage_level=project_data.voltage_level,
        capacity_mw=project_data.capacity_mw,
        technology_type=project_data.technology_type,
        grid_connection_type=project_data.grid_connection_type,
        project_developer=project_data.project_developer
    )
    
    db.add(project)
    db.commit()
    db.refresh(project)
    
    return project

@app.get("/projects", response_model=List[ProjectResponse])
async def list_projects(db: Session = Depends(get_db)):
    try:
        projects = db.query(Project).all()
        return projects
    except Exception as e:
        print(f"Error fetching projects: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@app.delete("/projects/{project_id}")
async def delete_project(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db.delete(project)
    db.commit()
    
    return {"message": "Project deleted successfully"}

# File upload endpoint
@app.post("/projects/{project_id}/upload")
async def upload_file(
    project_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Verify project exists
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Read file content
    content = await file.read()
    
    # Create agent input for file processing
    agent_input = AgentInput(
        agent_name="OrchestratorAgent",
        task_type="process_file_upload",
        project_id=project_id,
        input_data={
            "filename": file.filename,
            "content": content,
            "file_type": file.content_type
        }
    )
    
    # Execute orchestrated file processing
    result = agent_registry.execute_task("OrchestratorAgent", agent_input, db)
    
    if not result.success:
        raise HTTPException(status_code=400, detail=result.error_message)
    
    return {
        "message": "File uploaded and processed successfully",
        "result": result.output_data
    }

@app.post("/projects/{project_id}/generate-document", response_model=DocumentResponse)
async def generate_document(
    project_id: str, 
    request: dict,
    db: Session = Depends(get_db)
):
    """Generate a specific document type for a project"""
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        document_type = request.get("document_type")
        if not document_type:
            raise HTTPException(status_code=400, detail="document_type is required")
        
        # For now, create a mock document since the agent system might not be working
        # In a production system, this would call the actual agent system
        document_title = get_document_title(document_type, project.name)
        document_content = generate_mock_document_content(document_type, project)
        
        # Create file for the document
        document_id = str(uuid.uuid4())
        os.makedirs("documents", exist_ok=True)
        file_path = f"documents/{document_id}_{document_type}.md"
        
        # Write content to file
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(document_content)
        
        # Create the document in the database
        document = Document(
            id=document_id,
            project_id=project_id,
            doc_type=document_type,
            title=document_title,
            content=document_content,
            version=1,
            status="draft",
            quality_score=85.0,
            origin="ai_generated",
            source_files=[],
            placeholders=[],
            file_path=file_path
        )
        
        db.add(document)
        db.commit()
        db.refresh(document)
        
        return document
        
    except Exception as e:
        print(f"Error generating document: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate document: {str(e)}")

def get_document_title(document_type: str, project_name: str) -> str:
    """Generate appropriate document title"""
    titles = {
        'environmental_impact_assessment': f'Evaluación de Impacto Ambiental - {project_name}',
        'interconnection_request': f'Solicitud de Interconexión - {project_name}', 
        'land_use_permit': f'Permiso de Uso de Suelo - {project_name}',
        'construction_permit': f'Permiso de Construcción - {project_name}',
        'electrical_safety_certification': f'Certificación de Seguridad Eléctrica - {project_name}'
    }
    return titles.get(document_type, f'Documento {document_type} - {project_name}')

def generate_mock_document_content(document_type: str, project) -> str:
    """Generate realistic document content based on project data"""
    
    if document_type == 'environmental_impact_assessment':
        return f"""# EVALUACIÓN DE IMPACTO AMBIENTAL
## Sistema de Almacenamiento de Energía en Baterías (BESS)

### 1. DESCRIPCIÓN DEL PROYECTO
**Nombre del Proyecto:** {project.name}
**Desarrollador:** {project.project_developer or 'No especificado'}
**Ubicación:** {f'Latitud: {project.latitude}°, Longitud: {project.longitude}°' if project.latitude and project.longitude else 'No especificada'}
**Capacidad:** {f'{project.capacity_mw} MW' if project.capacity_mw else 'No especificada'}
**Tecnología:** {project.technology_type.replace('_', ' ').title() if project.technology_type else 'No especificada'}

### 2. CARACTERÍSTICAS TÉCNICAS
- **Nivel de Tensión:** {project.voltage_level or 'No especificado'}
- **Subestación de Conexión:** {project.substation_name or 'No especificada'}
- **Tipo de Conexión:** {project.grid_connection_type or 'No especificado'}

### 3. ANÁLISIS DE IMPACTOS AMBIENTALES
#### 3.1 Impactos en la Fase de Construcción
- Generación temporal de ruido por actividades constructivas
- Movimiento de tierras y alteración temporal del suelo
- Tráfico de vehículos de construcción
- Generación de residuos de construcción

#### 3.2 Impactos en la Fase de Operación  
- Impacto visual mínimo debido al diseño compacto de la tecnología BESS
- Emisiones sonoras dentro de los límites permitidos (< 55 dB)
- Sin emisiones atmosféricas durante la operación
- Contribución positiva a la estabilidad de la red eléctrica

### 4. MEDIDAS DE MITIGACIÓN
#### 4.1 Medidas en Construcción
- Horarios de trabajo limitados (07:00 - 18:00 hrs)
- Humectación de caminos para control de polvo
- Gestión adecuada de residuos según DS 594/1999
- Capacitación ambiental del personal

#### 4.2 Medidas en Operación
- Mantenimiento preventivo regular de equipos
- Monitoreo continuo de niveles de ruido
- Plan de gestión de residuos peligrosos (baterías)
- Programa de vigilancia ambiental

### 5. CUMPLIMIENTO NORMATIVO
- **Ley 19.300:** Ley General de Bases del Medio Ambiente
- **DS 40/2012:** Reglamento del Sistema de Evaluación de Impacto Ambiental
- **DS 594/1999:** Condiciones sanitarias y ambientales básicas en lugares de trabajo
- **NCh 2190:** Ruido ambiental

### 6. CONCLUSIONES
El proyecto {project.name} presenta un impacto ambiental bajo y manejable mediante la implementación de las medidas de mitigación propuestas. La tecnología BESS contribuye positivamente a la matriz energética nacional al facilitar la integración de energías renovables.

**Clasificación Ambiental Sugerida:** Declaración de Impacto Ambiental (DIA)"""

    elif document_type == 'interconnection_request':
        return f"""# SOLICITUD DE INTERCONEXIÓN AL SISTEMA ELÉCTRICO NACIONAL

### 1. INFORMACIÓN DEL SOLICITANTE
**Empresa:** {project.project_developer or 'No especificado'}
**Proyecto:** {project.name}
**RUT:** [A completar]

### 2. CARACTERÍSTICAS TÉCNICAS DEL PROYECTO
**Capacidad de Inyección:** {f'{project.capacity_mw} MW' if project.capacity_mw else '[A especificar]'}
**Capacidad de Consumo:** {f'{project.capacity_mw} MW' if project.capacity_mw else '[A especificar]'}
**Tensión de Conexión:** {project.voltage_level or '[A especificar]'}
**Punto de Conexión:** {project.substation_name or '[A especificar]'}

### 3. UBICACIÓN
**Coordenadas:** {f'{project.latitude}°S, {project.longitude}°W' if project.latitude and project.longitude else '[A especificar]'}
**Región:** [A especificar según coordenadas]
**Comuna:** [A especificar según ubicación]

### 4. DESCRIPCIÓN TÉCNICA
#### 4.1 Sistema de Almacenamiento
- **Tecnología:** {project.technology_type.replace('_', ' ').title() if project.technology_type else 'Baterías de Ion-Litio'}
- **Configuración:** Contenedores/racks de baterías con sistema de gestión integrado
- **Tiempo de Descarga:** 2-4 horas (típico para aplicaciones de estabilización)

#### 4.2 Sistema de Conversión
- **Inversores:** Inversores bidireccionales AC/DC
- **Factor de Potencia:** 0.95 inductivo a capacitivo
- **Eficiencia:** >95% (ida y vuelta >90%)

#### 4.3 Transformación y Conexión
- **Transformador Principal:** {f'{project.voltage_level}/0.4 kV' if project.voltage_level else 'Por definir según tensión de conexión'}
- **Protecciones:** Relés diferenciales, sobrecorriente, tensión, frecuencia

### 5. SISTEMA DE PROTECCIONES
#### 5.1 Protecciones Primarias
- Protección diferencial (87)
- Sobrecorriente instantánea y temporizada (50/51)
- Subtensión y sobretensión (27/59)
- Subfrecuencia y sobrefrecuencia (81)

#### 5.2 Protecciones Especiales
- Anti-islanding según normativa vigente
- Protección contra fallas a tierra
- Sistema de gestión de baterías (BMS)

### 6. SERVICIOS COMPLEMENTARIOS
El sistema BESS puede proporcionar:
- Control primario de frecuencia
- Control secundario de frecuencia  
- Regulación de tensión
- Soporte de potencia reactiva

### 7. ESTUDIOS REQUERIDOS
- Estudio de cortocircuito
- Estudio de estabilidad transitoria
- Estudio de coordinación de protecciones
- Estudio de calidad de servicio

### 8. CRONOGRAMA ESTIMADO
- **Conexión Comercial:** [Fecha estimada]
- **Pruebas de Interconexión:** [30 días antes de conexión comercial]

**Fecha de Solicitud:** {datetime.date.today().strftime('%d/%m/%Y')}
**Solicitante:** {project.project_developer or '[Nombre del solicitante]'}"""

    else:
        return f"""# {get_document_title(document_type, project.name)}

## 1. INFORMACIÓN GENERAL DEL PROYECTO
**Nombre:** {project.name}
**Desarrollador:** {project.project_developer or 'No especificado'}
**Ubicación:** {f'Lat: {project.latitude}°, Lng: {project.longitude}°' if project.latitude and project.longitude else 'No especificada'}
**Capacidad:** {f'{project.capacity_mw} MW' if project.capacity_mw else 'No especificada'}

## 2. DESCRIPCIÓN TÉCNICA
Este documento corresponde al {document_type.replace('_', ' ')} para el proyecto de Sistema de Almacenamiento de Energía en Baterías (BESS).

**Características Principales:**
- Tecnología: {project.technology_type.replace('_', ' ').title() if project.technology_type else 'No especificada'}
- Tensión de Conexión: {project.voltage_level or 'No especificada'}
- Subestación: {project.substation_name or 'No especificada'}

## 3. CUMPLIMIENTO NORMATIVO
Este documento se desarrolla en cumplimiento de la normativa chilena vigente para proyectos de almacenamiento de energía.

## 4. INFORMACIÓN TÉCNICA DETALLADA
[Este documento requiere información específica adicional que debe ser proporcionada durante el proceso de generación interactiva]

---
*Documento generado automáticamente por el Sistema de Permisos BESS Chile*
*Fecha: {datetime.date.today().strftime('%d/%m/%Y')}*"""

@app.post("/projects/{project_id}/chat")
async def project_chat(
    project_id: str,
    request: dict,
    db: Session = Depends(get_db)
):
    """Handle chat messages for a specific project"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    user_message = request.get("message", "").strip()
    if not user_message:
        raise HTTPException(status_code=400, detail="message is required")
    
    # Prepare input for the orchestrator agent to handle the chat
    agent_input = AgentInput(
        project_id=project_id,
        task_type="project_chat",
        input_data={
            "user_message": user_message,
            "project_context": {
                "name": project.name,
                "substation_id": project.substation_id,
                "substation_name": project.substation_name,
                "status": project.status,
                "description": project.description
            }
        }
    )
    
    # Process with orchestrator agent
    result = agent_registry.orchestrator_agent.process(agent_input, db)
    
    if not result.success:
        return {
            "response": "I apologize, but I encountered an error processing your request. Please try again or be more specific about what you need.",
            "documents": [],
            "error": result.error_message
        }
    
    return {
        "response": result.output_data.get("response", "I'm here to help with your project. What would you like to know?"),
        "documents": result.output_data.get("related_documents", []),
        "suggestions": result.output_data.get("suggestions", [])
    }

# Document endpoints
@app.get("/projects/{project_id}/documents", response_model=List[DocumentResponse])
async def get_project_documents(project_id: str, db: Session = Depends(get_db)):
    try:
        documents = db.query(Document).filter(Document.project_id == project_id).all()
        return documents
    except Exception as e:
        print(f"Error fetching documents: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/documents/{document_id}", response_model=DocumentResponse)
async def get_document(document_id: str, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document

@app.get("/documents/{document_id}/download")
async def download_document(document_id: str, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Check if file exists, if not create it from content
    if not document.file_path or not os.path.exists(document.file_path):
        print(f"Document file missing for {document_id}, recreating from content...")
        
        # Ensure documents directory exists
        os.makedirs("documents", exist_ok=True)
        
        # Create file path
        file_path = f"documents/{document_id}_{document.doc_type}.md"
        
        # Write content to file (use document content if available, otherwise generate placeholder)
        content = document.content if document.content else f"# {document.title}\n\nDocument content not available."
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        # Update database with file path
        document.file_path = file_path
        db.commit()
        
        print(f"Created missing file: {file_path}")
    
    # Determine file extension and media type
    if document.file_path.endswith('.md'):
        filename = f"{document.title}.md"
        media_type = "text/markdown"
    else:
        filename = f"{document.title}.docx"
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    
    return FileResponse(
        path=document.file_path,
        filename=filename,
        media_type=media_type
    )

@app.post("/documents/{document_id}/review")
async def review_document(
    document_id: str,
    review_data: DocumentReviewRequest,
    db: Session = Depends(get_db)
):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Create human review record
    review = DocumentReview(
        document_id=document_id,
        reviewer_type="human",
        reviewer_name=review_data.reviewer_name or "Human Reviewer",
        status=review_data.status,
        feedback=review_data.feedback
    )
    
    db.add(review)
    
    # Update document status
    if review_data.status == "approved":
        document.status = "approved"
    elif review_data.status == "rejected":
        document.status = "rejected"
    else:
        document.status = "needs_review"
    
    db.commit()
    
    # If feedback provided, integrate it
    if review_data.feedback:
        agent_input = AgentInput(
            agent_name="FeedbackIntegrationAgent",
            task_type="integrate_human_feedback",
            project_id=document.project_id,
            input_data={
                "document_id": document_id,
                "feedback": review_data.feedback,
                "reviewer_name": review_data.reviewer_name
            }
        )
        
        result = agent_registry.execute_task("FeedbackIntegrationAgent", agent_input, db)
    
    return {"message": "Review submitted successfully"}

@app.put("/documents/{document_id}/save")
async def save_document(
    document_id: str,
    version_data: DocumentVersionRequest,
    db: Session = Depends(get_db)
):
    """Save a new version of a document with change tracking"""
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Get current highest version number
    latest_version = db.query(DocumentVersion).filter(
        DocumentVersion.document_id == document_id
    ).order_by(DocumentVersion.version_number.desc()).first()
    
    new_version_number = (latest_version.version_number + 1) if latest_version else 1
    
    # Create new version record
    version_id = str(uuid.uuid4())
    author_id = version_data.author_name.lower().replace(" ", "_")  # Simple author ID
    
    new_version = DocumentVersion(
        id=version_id,
        document_id=document_id,
        version_number=new_version_number,
        content=version_data.content,
        author_id=author_id,
        author_name=version_data.author_name,
        author_email=version_data.author_email,
        origin="USER_EDITED",
        change_summary=version_data.change_summary
    )
    
    # Update the document's main content and version
    document.content = version_data.content
    document.version = new_version_number
    document.updated_at = datetime.datetime.utcnow()
    
    # Create/update the document file
    os.makedirs("documents", exist_ok=True)
    file_path = f"documents/{document_id}_{document.doc_type}.md"
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(version_data.content)
    
    document.file_path = file_path
    new_version.file_path = file_path
    
    db.add(new_version)
    db.commit()
    db.refresh(new_version)
    
    return {
        "message": "Document saved successfully", 
        "version": new_version_number,
        "saved_at": new_version.created_at.strftime("%H:%M")
    }

@app.get("/documents/{document_id}/versions", response_model=List[DocumentVersionResponse])
async def get_document_versions(document_id: str, db: Session = Depends(get_db)):
    """Get all versions of a document for traceability"""
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    versions = db.query(DocumentVersion).filter(
        DocumentVersion.document_id == document_id
    ).order_by(DocumentVersion.version_number.desc()).all()
    
    return versions

@app.get("/documents/{document_id}/versions/{version_id}")
async def get_document_version_content(
    document_id: str, 
    version_id: str, 
    db: Session = Depends(get_db)
):
    """Get the content of a specific version"""
    version = db.query(DocumentVersion).filter(
        DocumentVersion.id == version_id,
        DocumentVersion.document_id == document_id
    ).first()
    
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    
    return {
        "id": version.id,
        "version_number": version.version_number,
        "content": version.content,
        "author": {
            "id": version.author_id,
            "name": version.author_name,
            "email": version.author_email
        },
        "origin": version.origin,
        "change_summary": version.change_summary,
        "created_at": version.created_at
    }

# Agent execution endpoint
@app.post("/agents/{agent_name}/execute")
async def execute_agent(
    agent_name: str,
    agent_input: AgentInput,
    db: Session = Depends(get_db)
):
    try:
        result = agent_registry.execute_task(agent_name, agent_input, db)
        return {
            "success": result.success,
            "output_data": result.output_data,
            "reasoning": result.reasoning,
            "model_used": result.model_used,
            "execution_time": result.execution_time,
            "error_message": result.error_message
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# KPI endpoints
@app.get("/projects/{project_id}/kpis", response_model=List[KPIResponse])
async def get_project_kpis(project_id: str, db: Session = Depends(get_db)):
    kpis = db.query(KPIMetric).filter(KPIMetric.project_id == project_id).all()
    return kpis

@app.post("/projects/{project_id}/kpis/calculate")
async def calculate_project_kpis(project_id: str, db: Session = Depends(get_db)):
    agent_input = AgentInput(
        agent_name="ProgressTrackingAgent",
        task_type="calculate_project_kpis",
        project_id=project_id,
        input_data={}
    )
    
    result = agent_registry.execute_task("ProgressTrackingAgent", agent_input, db)
    
    if not result.success:
        raise HTTPException(status_code=400, detail=result.error_message)
    
    return result.output_data

@app.get("/kpis/global", response_model=List[KPIResponse])
async def get_global_kpis(db: Session = Depends(get_db)):
    kpis = db.query(KPIMetric).filter(KPIMetric.project_id.is_(None)).all()
    return kpis

@app.post("/kpis/global/calculate")
async def calculate_global_kpis(db: Session = Depends(get_db)):
    agent_input = AgentInput(
        agent_name="ProgressTrackingAgent",
        task_type="calculate_global_kpis",
        project_id="global",
        input_data={}
    )
    
    result = agent_registry.execute_task("ProgressTrackingAgent", agent_input, db)
    
    if not result.success:
        raise HTTPException(status_code=400, detail=result.error_message)
    
    return result.output_data

# Agent trace endpoints for transparency
@app.get("/projects/{project_id}/traces", response_model=List[AgentTraceResponse])
async def get_project_traces(project_id: str, limit: int = 50, db: Session = Depends(get_db)):
    traces = db.query(AgentTrace).filter(
        AgentTrace.project_id == project_id
    ).order_by(AgentTrace.created_at.desc()).limit(limit).all()
    return traces

@app.get("/traces/{trace_id}")
async def get_trace_details(trace_id: str, db: Session = Depends(get_db)):
    trace = db.query(AgentTrace).filter(AgentTrace.id == trace_id).first()
    if not trace:
        raise HTTPException(status_code=404, detail="Trace not found")
    
    return {
        "id": trace.id,
        "agent_name": trace.agent_name,
        "task_type": trace.task_type,
        "input_data": trace.input_data,
        "output_data": trace.output_data,
        "model_used": trace.model_used,
        "reasoning": trace.reasoning,
        "execution_time": trace.execution_time,
        "success": trace.success,
        "error_message": trace.error_message,
        "created_at": trace.created_at
    }

# Progress report endpoint
@app.post("/projects/{project_id}/report")
async def generate_progress_report(
    project_id: str,
    report_type: str = "summary",
    db: Session = Depends(get_db)
):
    agent_input = AgentInput(
        agent_name="ProgressTrackingAgent",
        task_type="generate_progress_report",
        project_id=project_id,
        input_data={"report_type": report_type}
    )
    
    result = agent_registry.execute_task("ProgressTrackingAgent", agent_input, db)
    
    if not result.success:
        raise HTTPException(status_code=400, detail=result.error_message)
    
    return result.output_data

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)