import json
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from .base_agent import BaseAgent
from schemas import AgentInput, AgentOutput
from models import Project, Document, DocumentReview, KPIMetric, AgentTrace
from datetime import datetime, timedelta

class ProgressTrackingAgent(BaseAgent):
    def __init__(self, openrouter_client):
        super().__init__("ProgressTrackingAgent", openrouter_client)
        self.required_chile_documents = [
            "environmental_impact_assessment",
            "interconnection_request", 
            "land_use_permit",
            "construction_permit",
            "electrical_safety_certification"
        ]
    
    def process(self, input_data: AgentInput, db: Session) -> AgentOutput:
        task_type = input_data.task_type
        
        if task_type == "calculate_project_kpis":
            return self._calculate_project_kpis(input_data, db)
        elif task_type == "calculate_global_kpis":
            return self._calculate_global_kpis(input_data, db)
        elif task_type == "generate_progress_report":
            return self._generate_progress_report(input_data, db)
        else:
            return AgentOutput(
                agent_name=self.name,
                task_type=task_type,
                project_id=input_data.project_id,
                output_data={},
                model_used="none",
                reasoning=f"Unknown progress tracking task: {task_type}",
                execution_time=0.0,
                success=False,
                error_message=f"Unknown task type: {task_type}"
            )
    
    def _calculate_project_kpis(self, input_data: AgentInput, db: Session) -> AgentOutput:
        project_id = input_data.project_id
        
        # Get project documents
        documents = db.query(Document).filter(Document.project_id == project_id).all()
        
        # Calculate KPIs
        kpis = {}
        
        # 1. Document completion percentage
        required_docs = len(self.required_chile_documents)
        generated_docs = len([d for d in documents if d.doc_type in self.required_chile_documents])
        kpis["document_completion_percentage"] = (generated_docs / required_docs * 100) if required_docs > 0 else 0
        
        # 2. Average quality score
        quality_scores = [d.quality_score for d in documents if d.quality_score is not None]
        kpis["average_quality_score"] = sum(quality_scores) / len(quality_scores) if quality_scores else 0
        
        # 3. Documents by status
        status_counts = {}
        for doc in documents:
            status_counts[doc.status] = status_counts.get(doc.status, 0) + 1
        kpis["documents_by_status"] = status_counts
        
        # 4. Documents needing attention (low quality or rejected)
        needs_attention = len([d for d in documents if (d.quality_score and d.quality_score < 70) or d.status == "rejected"])
        kpis["documents_needing_attention"] = needs_attention
        
        # 5. Average feedback iterations
        reviews = db.query(DocumentReview).join(Document).filter(Document.project_id == project_id).all()
        doc_review_counts = {}
        for review in reviews:
            doc_review_counts[review.document_id] = doc_review_counts.get(review.document_id, 0) + 1
        avg_iterations = sum(doc_review_counts.values()) / len(doc_review_counts) if doc_review_counts else 0
        kpis["average_feedback_iterations"] = avg_iterations
        
        # 6. Compliance readiness score
        approved_critical_docs = len([d for d in documents 
                                    if d.doc_type in self.required_chile_documents and d.status == "approved"])
        kpis["compliance_readiness_score"] = (approved_critical_docs / required_docs * 100) if required_docs > 0 else 0
        
        # Store KPIs in database
        for metric_name, metric_value in kpis.items():
            if isinstance(metric_value, (int, float)):
                kpi_record = KPIMetric(
                    project_id=project_id,
                    metric_name=metric_name,
                    metric_value=float(metric_value),
                    metric_type="percentage" if "percentage" in metric_name or "score" in metric_name else "count"
                )
                db.add(kpi_record)
        
        db.commit()
        
        return AgentOutput(
            agent_name=self.name,
            task_type=input_data.task_type,
            project_id=project_id,
            output_data={
                "kpis": kpis,
                "total_documents": len(documents),
                "required_documents": required_docs,
                "calculation_timestamp": datetime.utcnow().isoformat()
            },
            model_used="calculation",
            reasoning=f"Calculated {len(kpis)} KPI metrics for project",
            execution_time=0.0,
            success=True
        )
    
    def _calculate_global_kpis(self, input_data: AgentInput, db: Session) -> AgentOutput:
        # System-wide KPIs across all projects
        
        # Total projects
        total_projects = db.query(Project).count()
        
        # Total documents
        total_documents = db.query(Document).count()
        
        # System-wide quality metrics
        avg_quality = db.query(func.avg(Document.quality_score)).filter(
            Document.quality_score.isnot(None)
        ).scalar() or 0
        
        # Agent performance metrics
        agent_success_rate = db.query(func.avg(AgentTrace.success.cast(db.bind.dialect.FLOAT))).scalar() or 0
        agent_avg_execution_time = db.query(func.avg(AgentTrace.execution_time)).scalar() or 0
        
        # Documents by status (system-wide)
        status_counts = {}
        status_results = db.query(Document.status, func.count(Document.id)).group_by(Document.status).all()
        for status, count in status_results:
            status_counts[status] = count
        
        # Project completion rates
        completed_projects = db.query(Project).filter(Project.status == "completed").count()
        project_completion_rate = (completed_projects / total_projects * 100) if total_projects > 0 else 0
        
        global_kpis = {
            "total_projects": total_projects,
            "total_documents": total_documents,
            "system_average_quality_score": float(avg_quality),
            "agent_success_rate_percentage": float(agent_success_rate * 100),
            "agent_average_execution_time": float(agent_avg_execution_time),
            "project_completion_rate_percentage": project_completion_rate,
            "documents_by_status": status_counts
        }
        
        # Store global KPIs (project_id = None for global metrics)
        for metric_name, metric_value in global_kpis.items():
            if isinstance(metric_value, (int, float)):
                kpi_record = KPIMetric(
                    project_id=None,  # Global metric
                    metric_name=metric_name,
                    metric_value=float(metric_value),
                    metric_type="percentage" if "percentage" in metric_name or "rate" in metric_name else "count"
                )
                db.add(kpi_record)
        
        db.commit()
        
        return AgentOutput(
            agent_name=self.name,
            task_type=input_data.task_type,
            project_id=input_data.project_id,
            output_data={
                "global_kpis": global_kpis,
                "calculation_timestamp": datetime.utcnow().isoformat()
            },
            model_used="calculation",
            reasoning=f"Calculated global system KPIs across {total_projects} projects",
            execution_time=0.0,
            success=True
        )
    
    def _generate_progress_report(self, input_data: AgentInput, db: Session) -> AgentOutput:
        project_id = input_data.project_id
        report_type = input_data.input_data.get("report_type", "summary")  # summary, detailed, executive
        
        # Get project info
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return self._create_error_output(input_data, "Project not found")
        
        # Get recent KPIs
        recent_kpis = db.query(KPIMetric).filter(
            KPIMetric.project_id == project_id,
            KPIMetric.calculated_at >= datetime.utcnow() - timedelta(days=1)
        ).all()
        
        kpi_data = {kpi.metric_name: kpi.metric_value for kpi in recent_kpis}
        
        # Get documents status
        documents = db.query(Document).filter(Document.project_id == project_id).all()
        
        # Get recent agent activity
        recent_traces = db.query(AgentTrace).filter(
            AgentTrace.project_id == project_id,
            AgentTrace.created_at >= datetime.utcnow() - timedelta(days=7)
        ).order_by(AgentTrace.created_at.desc()).limit(10).all()
        
        # Generate report using LLM
        report_content = self._generate_llm_report(project, kpi_data, documents, recent_traces, report_type)
        
        return AgentOutput(
            agent_name=self.name,
            task_type=input_data.task_type,
            project_id=project_id,
            output_data={
                "report_content": report_content,
                "report_type": report_type,
                "kpi_summary": kpi_data,
                "document_count": len(documents),
                "recent_activity_count": len(recent_traces),
                "generation_timestamp": datetime.utcnow().isoformat()
            },
            model_used=self.openrouter_client.get_optimal_model("default"),
            reasoning=f"Generated {report_type} progress report for project",
            execution_time=0.0,
            success=True
        )
    
    def _generate_llm_report(self, project: Project, kpis: Dict[str, float], 
                           documents: List[Document], traces: List[AgentTrace], 
                           report_type: str) -> str:
        
        system_message = self.openrouter_client.create_system_message(
            f"""You are a project management expert specializing in Chilean BESS permitting projects.
            Generate a comprehensive {report_type} progress report in Spanish.
            
            Report should include:
            1. Executive summary of project status
            2. Document generation progress and quality metrics
            3. Key performance indicators analysis
            4. Risk assessment and blockers identification
            5. Next steps and recommendations
            6. Timeline and milestone tracking
            
            Use professional language appropriate for leadership review.
            Highlight critical issues that need immediate attention.
            Provide actionable insights and recommendations.
            """
        )
        
        # Prepare data summary for LLM
        doc_summary = {}
        for doc in documents:
            status = doc.status
            doc_summary[status] = doc_summary.get(status, 0) + 1
        
        recent_activity = [
            {
                "agent": trace.agent_name,
                "task": trace.task_type,
                "success": trace.success,
                "date": trace.created_at.strftime("%Y-%m-%d")
            } for trace in traces
        ]
        
        user_message = self.openrouter_client.create_user_message(
            f"""Project: {project.name}
            Substation: {project.substation_id}
            Status: {project.status}
            Created: {project.created_at.strftime('%Y-%m-%d')}
            
            KPIs:
            {json.dumps(kpis, indent=2, ensure_ascii=False)}
            
            Documents Summary:
            {json.dumps(doc_summary, indent=2, ensure_ascii=False)}
            
            Recent Agent Activity:
            {json.dumps(recent_activity, indent=2, ensure_ascii=False)}
            
            Generate a comprehensive progress report."""
        )
        
        response = self.openrouter_client.chat_completion(
            messages=[system_message, user_message],
            task_type="default",
            temperature=0.3
        )
        
        if response["success"]:
            return response["data"]["choices"][0]["message"]["content"]
        else:
            return f"""REPORTE DE PROGRESO - {project.name}
            
            Estado del Proyecto: {project.status}
            Documentos Generados: {len(documents)}
            
            Error: No se pudo generar el reporte detallado automáticamente.
            Se requiere revisión manual de las métricas del proyecto.
            """
    
    def _create_error_output(self, input_data: AgentInput, error_message: str) -> AgentOutput:
        return AgentOutput(
            agent_name=self.name,
            task_type=input_data.task_type,
            project_id=input_data.project_id,
            output_data={},
            model_used="none",
            reasoning=error_message,
            execution_time=0.0,
            success=False,
            error_message=error_message
        )