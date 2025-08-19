import json
from typing import Dict, Any
from sqlalchemy.orm import Session
from .base_agent import BaseAgent
from schemas import AgentInput, AgentOutput
from models import Document, DocumentReview

class FeedbackIntegrationAgent(BaseAgent):
    def __init__(self, openrouter_client):
        super().__init__("FeedbackIntegrationAgent", openrouter_client)
    
    def process(self, input_data: AgentInput, db: Session) -> AgentOutput:
        task_type = input_data.task_type
        
        if task_type == "integrate_human_feedback":
            return self._integrate_human_feedback(input_data, db)
        elif task_type == "integrate_agent_feedback":
            return self._integrate_agent_feedback(input_data, db)
        elif task_type == "iterative_improvement":
            return self._iterative_improvement(input_data, db)
        else:
            return AgentOutput(
                agent_name=self.name,
                task_type=task_type,
                project_id=input_data.project_id,
                output_data={},
                model_used="none",
                reasoning=f"Unknown feedback integration task: {task_type}",
                execution_time=0.0,
                success=False,
                error_message=f"Unknown task type: {task_type}"
            )
    
    def _integrate_human_feedback(self, input_data: AgentInput, db: Session) -> AgentOutput:
        document_id = input_data.input_data.get("document_id")
        feedback_text = input_data.input_data.get("feedback")
        reviewer_name = input_data.input_data.get("reviewer_name", "Human Reviewer")
        
        if not document_id or not feedback_text:
            return self._create_error_output(input_data, "Document ID and feedback are required")
        
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            return self._create_error_output(input_data, "Document not found")
        
        # Analyze feedback and generate improved version
        improved_content = self._generate_improved_document(document, feedback_text, "human")
        
        if improved_content:
            # Update document
            document.content = improved_content["content"]
            document.version += 1
            document.status = "needs_review"
            document.placeholders = improved_content.get("remaining_placeholders", [])
            
            # Create review record for human feedback
            review = DocumentReview(
                document_id=document.id,
                reviewer_type="human",
                reviewer_name=reviewer_name,
                status="needs_revision",
                feedback=feedback_text
            )
            db.add(review)
            db.commit()
            
            return AgentOutput(
                agent_name=self.name,
                task_type=input_data.task_type,
                project_id=input_data.project_id,
                output_data={
                    "document_id": document.id,
                    "new_version": document.version,
                    "improvements_made": improved_content.get("improvements", []),
                    "remaining_issues": improved_content.get("remaining_placeholders", [])
                },
                model_used=self.openrouter_client.get_optimal_model("feedback_integration"),
                reasoning="Successfully integrated human feedback and updated document",
                execution_time=0.0,
                success=True
            )
        else:
            return self._create_error_output(input_data, "Failed to generate improved document")
    
    def _integrate_agent_feedback(self, input_data: AgentInput, db: Session) -> AgentOutput:
        document_id = input_data.input_data.get("document_id")
        review_id = input_data.input_data.get("review_id")
        
        if not document_id:
            return self._create_error_output(input_data, "Document ID is required")
        
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            return self._create_error_output(input_data, "Document not found")
        
        # Get latest agent review
        if review_id:
            review = db.query(DocumentReview).filter(DocumentReview.id == review_id).first()
        else:
            review = db.query(DocumentReview).filter(
                DocumentReview.document_id == document_id,
                DocumentReview.reviewer_type == "agent"
            ).order_by(DocumentReview.created_at.desc()).first()
        
        if not review:
            return self._create_error_output(input_data, "No agent review found")
        
        # Generate improved version based on agent feedback
        feedback_data = {
            "feedback": review.feedback,
            "missing_elements": review.missing_elements,
            "recommendations": review.recommendations
        }
        
        improved_content = self._generate_improved_document(document, feedback_data, "agent")
        
        if improved_content:
            # Update document
            document.content = improved_content["content"]
            document.version += 1
            document.status = "needs_review"
            document.placeholders = improved_content.get("remaining_placeholders", [])
            db.commit()
            
            return AgentOutput(
                agent_name=self.name,
                task_type=input_data.task_type,
                project_id=input_data.project_id,
                output_data={
                    "document_id": document.id,
                    "new_version": document.version,
                    "improvements_made": improved_content.get("improvements", []),
                    "issues_resolved": improved_content.get("resolved_issues", [])
                },
                model_used=self.openrouter_client.get_optimal_model("feedback_integration"),
                reasoning="Successfully integrated agent feedback and updated document",
                execution_time=0.0,
                success=True
            )
        else:
            return self._create_error_output(input_data, "Failed to generate improved document")
    
    def _iterative_improvement(self, input_data: AgentInput, db: Session) -> AgentOutput:
        document_id = input_data.input_data.get("document_id")
        max_iterations = input_data.input_data.get("max_iterations", 3)
        
        if not document_id:
            return self._create_error_output(input_data, "Document ID is required")
        
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            return self._create_error_output(input_data, "Document not found")
        
        improvements_log = []
        current_iteration = 0
        
        while current_iteration < max_iterations and document.quality_score and document.quality_score < 90:
            # Get latest review
            latest_review = db.query(DocumentReview).filter(
                DocumentReview.document_id == document_id
            ).order_by(DocumentReview.created_at.desc()).first()
            
            if not latest_review:
                break
            
            # Apply improvements based on review
            feedback_data = {
                "feedback": latest_review.feedback,
                "missing_elements": latest_review.missing_elements,
                "recommendations": latest_review.recommendations
            }
            
            improved_content = self._generate_improved_document(document, feedback_data, "iterative")
            
            if improved_content:
                document.content = improved_content["content"]
                document.version += 1
                document.placeholders = improved_content.get("remaining_placeholders", [])
                
                improvements_log.append({
                    "iteration": current_iteration + 1,
                    "version": document.version,
                    "improvements": improved_content.get("improvements", [])
                })
            else:
                break
            
            current_iteration += 1
        
        db.commit()
        
        return AgentOutput(
            agent_name=self.name,
            task_type=input_data.task_type,
            project_id=input_data.project_id,
            output_data={
                "document_id": document.id,
                "final_version": document.version,
                "iterations_completed": current_iteration,
                "improvements_log": improvements_log
            },
            model_used=self.openrouter_client.get_optimal_model("feedback_integration"),
            reasoning=f"Completed {current_iteration} iterations of document improvement",
            execution_time=0.0,
            success=True
        )
    
    def _generate_improved_document(self, document: Document, feedback: Any, feedback_type: str) -> Dict[str, Any]:
        if feedback_type == "human":
            feedback_text = feedback if isinstance(feedback, str) else str(feedback)
        else:
            feedback_text = json.dumps(feedback, ensure_ascii=False, indent=2)
        
        system_message = self.openrouter_client.create_system_message(
            f"""You are an expert document editor specializing in Chilean BESS permitting documents.
            Your task is to improve the provided document based on the feedback received.
            
            Document type: {document.doc_type}
            Current version: {document.version}
            Feedback type: {feedback_type}
            
            Instructions:
            1. Carefully analyze the feedback and identify specific areas for improvement
            2. Make targeted revisions to address each point raised
            3. Maintain the document's overall structure and Chilean regulatory compliance
            4. Preserve existing good content while improving problematic areas
            5. Ensure all changes are technically accurate for BESS projects
            6. Use formal Spanish appropriate for regulatory submissions
            
            Return JSON with:
            - "content": The improved document content
            - "improvements": List of specific improvements made
            - "resolved_issues": List of feedback points addressed
            - "remaining_placeholders": List of items still requiring information
            """
        )
        
        user_message = self.openrouter_client.create_user_message(
            f"""Current Document Content:
            {document.content}
            
            Feedback to Address:
            {feedback_text}
            
            Current Placeholders: {json.dumps(document.placeholders) if document.placeholders else 'None'}
            
            Please generate the improved document version."""
        )
        
        response = self.openrouter_client.chat_completion(
            messages=[system_message, user_message],
            task_type="feedback_integration",
            temperature=0.3
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
                
                return json.loads(json_str)
                
            except json.JSONDecodeError:
                # Fallback: return the raw content as improvement
                return {
                    "content": response["data"]["choices"][0]["message"]["content"],
                    "improvements": ["Document content updated based on feedback"],
                    "resolved_issues": ["JSON parsing failed, manual review needed"],
                    "remaining_placeholders": document.placeholders or []
                }
        
        return None
    
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