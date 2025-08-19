import json
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from .base_agent import BaseAgent
from schemas import AgentInput, AgentOutput
from models import Document, DocumentReview

class QualityReviewerAgent(BaseAgent):
    def __init__(self, openrouter_client):
        super().__init__("QualityReviewerAgent", openrouter_client)
        self.chile_compliance_criteria = {
            "environmental_impact_assessment": [
                "Contains project description",
                "Includes environmental baseline",
                "Lists potential impacts",
                "Provides mitigation measures", 
                "References Chilean environmental law",
                "Includes public participation plan"
            ],
            "interconnection_request": [
                "Technical specifications complete",
                "Connection point clearly defined",
                "Equipment certifications referenced",
                "Grid code compliance addressed",
                "Protection systems described",
                "References Chilean electrical regulations"
            ],
            "land_use_permit": [
                "Site coordinates provided",
                "Land use classification verified",
                "Municipal requirements addressed",
                "Environmental constraints identified",
                "Access routes described"
            ]
        }
    
    def process(self, input_data: AgentInput, db: Session) -> AgentOutput:
        task_type = input_data.task_type
        
        if task_type == "review_document":
            return self._review_single_document(input_data, db)
        elif task_type == "review_updated_documents":
            return self._review_updated_documents(input_data, db)
        elif task_type == "review_all_project_documents":
            return self._review_all_project_documents(input_data, db)
        else:
            return AgentOutput(
                agent_name=self.name,
                task_type=task_type,
                project_id=input_data.project_id,
                output_data={},
                model_used="none",
                reasoning=f"Unknown review task: {task_type}",
                execution_time=0.0,
                success=False,
                error_message=f"Unknown task type: {task_type}"
            )
    
    def _review_single_document(self, input_data: AgentInput, db: Session) -> AgentOutput:
        document_id = input_data.input_data.get("document_id")
        if not document_id:
            return self._create_error_output(input_data, "Document ID not provided")
        
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            return self._create_error_output(input_data, "Document not found")
        
        review_result = self._perform_document_review(document)
        
        # Create review record
        review = DocumentReview(
            document_id=document.id,
            reviewer_type="agent",
            reviewer_name=self.name,
            status=review_result["status"],
            score=review_result["score"],
            feedback=review_result["feedback"],
            missing_elements=review_result["missing_elements"],
            recommendations=review_result["recommendations"]
        )
        
        db.add(review)
        
        # Update document quality score
        document.quality_score = review_result["score"]
        if review_result["status"] == "approved":
            document.status = "approved"
        elif review_result["status"] == "rejected":
            document.status = "rejected"
        else:
            document.status = "needs_review"
        
        db.commit()
        
        return AgentOutput(
            agent_name=self.name,
            task_type=input_data.task_type,
            project_id=input_data.project_id,
            output_data={
                "review_id": review.id,
                "document_id": document.id,
                "score": review_result["score"],
                "status": review_result["status"],
                "feedback": review_result["feedback"][:200] + "..." if len(review_result["feedback"]) > 200 else review_result["feedback"]
            },
            model_used=self.openrouter_client.get_optimal_model("quality_review"),
            reasoning=f"Completed quality review with score {review_result['score']}/100",
            execution_time=0.0,
            success=True
        )
    
    def _review_updated_documents(self, input_data: AgentInput, db: Session) -> AgentOutput:
        updated_docs = input_data.input_data.get("updated_documents", [])
        review_results = []
        
        for doc_info in updated_docs:
            document_id = doc_info.get("document_id")
            if document_id:
                document = db.query(Document).filter(Document.id == document_id).first()
                if document:
                    review_result = self._perform_document_review(document)
                    
                    # Create review record
                    review = DocumentReview(
                        document_id=document.id,
                        reviewer_type="agent",
                        reviewer_name=self.name,
                        status=review_result["status"],
                        score=review_result["score"],
                        feedback=review_result["feedback"],
                        missing_elements=review_result["missing_elements"],
                        recommendations=review_result["recommendations"]
                    )
                    
                    db.add(review)
                    document.quality_score = review_result["score"]
                    document.status = "needs_review"
                    
                    review_results.append({
                        "document_id": document.id,
                        "doc_type": document.doc_type,
                        "score": review_result["score"],
                        "status": review_result["status"]
                    })
        
        db.commit()
        
        return AgentOutput(
            agent_name=self.name,
            task_type=input_data.task_type,
            project_id=input_data.project_id,
            output_data={
                "reviewed_documents": review_results,
                "average_score": sum(r["score"] for r in review_results) / len(review_results) if review_results else 0
            },
            model_used=self.openrouter_client.get_optimal_model("quality_review"),
            reasoning=f"Reviewed {len(review_results)} updated documents",
            execution_time=0.0,
            success=True
        )
    
    def _review_all_project_documents(self, input_data: AgentInput, db: Session) -> AgentOutput:
        project_id = input_data.project_id
        
        documents = db.query(Document).filter(
            Document.project_id == project_id,
            Document.status.in_(["draft", "needs_review"])
        ).all()
        
        review_results = []
        
        for document in documents:
            review_result = self._perform_document_review(document)
            
            # Create review record
            review = DocumentReview(
                document_id=document.id,
                reviewer_type="agent",
                reviewer_name=self.name,
                status=review_result["status"],
                score=review_result["score"],
                feedback=review_result["feedback"],
                missing_elements=review_result["missing_elements"],
                recommendations=review_result["recommendations"]
            )
            
            db.add(review)
            document.quality_score = review_result["score"]
            
            review_results.append({
                "document_id": document.id,
                "doc_type": document.doc_type,
                "score": review_result["score"],
                "status": review_result["status"]
            })
        
        db.commit()
        
        return AgentOutput(
            agent_name=self.name,
            task_type=input_data.task_type,
            project_id=project_id,
            output_data={
                "reviewed_documents": review_results,
                "total_documents": len(review_results),
                "average_score": sum(r["score"] for r in review_results) / len(review_results) if review_results else 0
            },
            model_used=self.openrouter_client.get_optimal_model("quality_review"),
            reasoning=f"Completed comprehensive review of {len(review_results)} project documents",
            execution_time=0.0,
            success=True
        )
    
    def _perform_document_review(self, document: Document) -> Dict[str, Any]:
        # Get compliance criteria for document type
        criteria = self.chile_compliance_criteria.get(document.doc_type, [
            "Document structure appropriate",
            "Content clarity acceptable",
            "Technical accuracy verified",
            "Regulatory compliance addressed"
        ])
        
        system_message = self.openrouter_client.create_system_message(
            f"""You are a senior regulatory compliance reviewer specializing in Chilean BESS permitting documents.
            
            Review the provided {document.doc_type} document for:
            1. Completeness against Chilean regulatory requirements
            2. Technical accuracy
            3. Clarity and professional presentation
            4. Compliance with specific criteria
            
            Specific criteria for {document.doc_type}:
            {chr(10).join(f"- {criterion}" for criterion in criteria)}
            
            Provide detailed feedback and score 0-100. Score breakdown:
            - 90-100: Excellent, ready for submission with minimal changes
            - 80-89: Good, minor revisions needed
            - 70-79: Adequate, moderate revisions required
            - 60-69: Poor, significant revisions needed
            - 0-59: Unacceptable, major rework required
            
            Return JSON with:
            - "score": numeric score 0-100
            - "status": "approved" (90+), "needs_revision" (60-89), or "rejected" (<60)
            - "feedback": detailed written feedback in Spanish
            - "missing_elements": list of missing required elements
            - "recommendations": list of specific improvement suggestions
            - "compliance_check": object with each criterion marked true/false
            """
        )
        
        user_message = self.openrouter_client.create_user_message(
            f"""Document Type: {document.doc_type}
            Document Title: {document.title}
            
            Content to review:
            {document.content[:6000]}  # Limit content for API
            
            Known Placeholders: {json.dumps(document.placeholders) if document.placeholders else 'None'}
            
            Please provide comprehensive quality review."""
        )
        
        response = self.openrouter_client.chat_completion(
            messages=[system_message, user_message],
            task_type="quality_review",
            temperature=0.2  # Lower temperature for consistent scoring
        )
        
        if response["success"]:
            try:
                content = response["data"]["choices"][0]["message"]["content"]
                if "```json" in content:
                    json_start = content.find("```json") + 7
                    json_end = content.find("```", json_start)
                    json_str = content[json_start:json_end].strip()
                else:
                    json_str = content.strip()
                
                result = json.loads(json_str)
                
                # Validate and sanitize the result
                return {
                    "score": max(0, min(100, result.get("score", 50))),  # Clamp between 0-100
                    "status": result.get("status", "needs_revision"),
                    "feedback": result.get("feedback", "Review feedback not available"),
                    "missing_elements": result.get("missing_elements", []),
                    "recommendations": result.get("recommendations", []),
                    "compliance_check": result.get("compliance_check", {})
                }
                
            except json.JSONDecodeError:
                # Fallback scoring
                return {
                    "score": 50,
                    "status": "needs_revision",
                    "feedback": "Error al procesar la revisión automática. Se requiere revisión manual.",
                    "missing_elements": ["Error en procesamiento automático"],
                    "recommendations": ["Realizar revisión manual del documento"],
                    "compliance_check": {}
                }
        
        # Fallback if LLM call fails
        return {
            "score": 30,
            "status": "needs_revision", 
            "feedback": "No se pudo completar la revisión automática. Se requiere revisión manual urgente.",
            "missing_elements": ["Revisión automática falló"],
            "recommendations": ["Realizar revisión manual completa"],
            "compliance_check": {}
        }
    
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