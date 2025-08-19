from typing import Dict, Any, List
from sqlalchemy.orm import Session
from .base_agent import BaseAgent
from schemas import AgentInput, AgentOutput
from models import Project, Document, ProjectFile
import json

class OrchestratorAgent(BaseAgent):
    def __init__(self, openrouter_client, agent_registry):
        super().__init__("OrchestratorAgent", openrouter_client)
        self.agent_registry = agent_registry
    
    def process(self, input_data: AgentInput, db: Session) -> AgentOutput:
        task_type = input_data.task_type
        project_id = input_data.project_id
        
        if task_type == "create_project":
            return self._orchestrate_project_creation(input_data, db)
        elif task_type == "process_file_upload":
            return self._orchestrate_file_processing(input_data, db)
        elif task_type == "update_project":
            return self._orchestrate_project_update(input_data, db)
        elif task_type == "project_chat":
            return self._handle_project_chat(input_data, db)
        elif task_type == "generate_single_document":
            return self._orchestrate_single_document_generation(input_data, db)
        else:
            return AgentOutput(
                agent_name=self.name,
                task_type=task_type,
                project_id=project_id,
                output_data={},
                model_used="none",
                reasoning=f"Unknown task type: {task_type}",
                execution_time=0.0,
                success=False,
                error_message=f"Unknown task type: {task_type}"
            )
    
    def _orchestrate_project_creation(self, input_data: AgentInput, db: Session) -> AgentOutput:
        project_data = input_data.input_data
        project_id = input_data.project_id
        
        steps_completed = []
        
        # Step 1: Create project record
        project = Project(
            id=project_id,
            name=project_data["name"],
            substation_id=project_data["substation_id"],
            description=project_data.get("description"),
            language=project_data.get("language", "es")
        )
        db.add(project)
        db.commit()
        steps_completed.append("project_created")
        
        # Step 2: If files were uploaded, process them
        uploaded_files = project_data.get("files", [])
        ingestion_results = []
        
        for file_data in uploaded_files:
            ingestion_input = AgentInput(
                agent_name="IngestionAgent",
                task_type="process_file",
                project_id=project_id,
                input_data=file_data
            )
            
            ingestion_agent = self.agent_registry["IngestionAgent"]
            result = ingestion_agent.execute_with_tracing(ingestion_input, db)
            ingestion_results.append(result.output_data)
            
            if result.success:
                steps_completed.append(f"file_processed_{file_data.get('filename', 'unknown')}")
        
        # Step 3: Generate initial drafts if we have data
        if ingestion_results and any(r.get("extracted_data") for r in ingestion_results):
            drafting_input = AgentInput(
                agent_name="DraftingAgent",
                task_type="generate_initial_drafts",
                project_id=project_id,
                input_data={"extracted_data": ingestion_results}
            )
            
            drafting_agent = self.agent_registry["DraftingAgent"]
            drafting_result = drafting_agent.execute_with_tracing(drafting_input, db)
            steps_completed.append("initial_drafts_generated")
        
        return AgentOutput(
            agent_name=self.name,
            task_type=input_data.task_type,
            project_id=project_id,
            output_data={
                "project_id": project_id,
                "steps_completed": steps_completed,
                "ingestion_results": ingestion_results
            },
            model_used="orchestration",
            reasoning="Successfully orchestrated project creation with file processing and initial drafting",
            execution_time=0.0,
            success=True
        )
    
    def _orchestrate_file_processing(self, input_data: AgentInput, db: Session) -> AgentOutput:
        project_id = input_data.project_id
        file_data = input_data.input_data
        
        steps_completed = []
        
        # Step 1: Process file with ingestion agent
        ingestion_input = AgentInput(
            agent_name="IngestionAgent",
            task_type="process_file",
            project_id=project_id,
            input_data=file_data
        )
        
        ingestion_agent = self.agent_registry["IngestionAgent"]
        ingestion_result = ingestion_agent.execute_with_tracing(ingestion_input, db)
        steps_completed.append("file_ingested")
        
        if not ingestion_result.success:
            return AgentOutput(
                agent_name=self.name,
                task_type=input_data.task_type,
                project_id=project_id,
                output_data={"error": "File ingestion failed"},
                model_used="orchestration",
                reasoning="File ingestion failed, stopping orchestration",
                execution_time=0.0,
                success=False,
                error_message="File ingestion failed"
            )
        
        # Step 2: Update affected documents
        drafting_input = AgentInput(
            agent_name="DraftingAgent",
            task_type="update_affected_documents",
            project_id=project_id,
            input_data={"new_extracted_data": ingestion_result.output_data}
        )
        
        drafting_agent = self.agent_registry["DraftingAgent"]
        drafting_result = drafting_agent.execute_with_tracing(drafting_input, db)
        steps_completed.append("documents_updated")
        
        # Step 3: Quality review of updated documents
        quality_input = AgentInput(
            agent_name="QualityReviewerAgent",
            task_type="review_updated_documents",
            project_id=project_id,
            input_data={"updated_documents": drafting_result.output_data.get("updated_documents", [])}
        )
        
        quality_agent = self.agent_registry["QualityReviewerAgent"]
        quality_result = quality_agent.execute_with_tracing(quality_input, db)
        steps_completed.append("quality_review_completed")
        
        return AgentOutput(
            agent_name=self.name,
            task_type=input_data.task_type,
            project_id=project_id,
            output_data={
                "steps_completed": steps_completed,
                "ingestion_result": ingestion_result.output_data,
                "drafting_result": drafting_result.output_data,
                "quality_result": quality_result.output_data
            },
            model_used="orchestration",
            reasoning="Successfully orchestrated file processing with document updates and quality review",
            execution_time=0.0,
            success=True
        )
    
    def _orchestrate_project_update(self, input_data: AgentInput, db: Session) -> AgentOutput:
        # Similar orchestration logic for project updates
        return AgentOutput(
            agent_name=self.name,
            task_type=input_data.task_type,
            project_id=input_data.project_id,
            output_data={"message": "Project update orchestration not yet implemented"},
            model_used="orchestration",
            reasoning="Project update orchestration placeholder",
            execution_time=0.0,
            success=True
        )
    
    def _handle_project_chat(self, input_data: AgentInput, db: Session) -> AgentOutput:
        """Handle chat messages with no-assumptions policy"""
        project_id = input_data.project_id
        user_message = input_data.input_data.get("user_message", "")
        project_context = input_data.input_data.get("project_context", {})
        
        # Get project documents for context
        documents = db.query(Document).filter(Document.project_id == project_id).all()
        doc_summaries = [
            {
                "id": doc.id,
                "title": doc.title,
                "type": doc.doc_type,
                "status": doc.status,
                "placeholders": len(doc.placeholders or [])
            }
            for doc in documents
        ]
        
        # Use LLM to generate contextual response following no-assumptions policy
        system_message = self.openrouter_client.create_system_message(
            """You are a helpful AI assistant for Chilean BESS permitting projects. 
            
            CRITICAL RULE - NO ASSUMPTIONS POLICY:
            - NEVER make assumptions about missing information
            - ALWAYS ask for specific clarification when information is unclear or missing
            - ALWAYS request precise details rather than guessing
            - When users ask vague questions, ask them to be more specific
            - If generating documents, always ask for missing required information
            
            Guidelines:
            - Be helpful and knowledgeable about Chilean BESS regulations
            - Provide accurate information about permitting requirements
            - Guide users through document generation processes
            - Reference specific documents when relevant
            - Ask clarifying questions to ensure accuracy
            
            Available project documents: {doc_summaries}
            Project context: {project_context}
            
            Always prioritize accuracy over assumptions. When in doubt, ask for clarification.""".format(
                doc_summaries=json.dumps(doc_summaries, indent=2),
                project_context=json.dumps(project_context, indent=2)
            )
        )
        
        user_message_formatted = self.openrouter_client.create_user_message(
            f"User message: {user_message}\n\nPlease provide a helpful response following the no-assumptions policy. If the request is unclear or missing information, ask for specific clarification."
        )
        
        response = self.openrouter_client.chat_completion(
            messages=[system_message, user_message_formatted],
            task_type="chat",
            temperature=0.7
        )
        
        if response["success"]:
            ai_response = response["data"]["choices"][0]["message"]["content"]
            
            # Check if response mentions any documents
            related_docs = []
            for doc in documents:
                if doc.doc_type.lower() in user_message.lower() or doc.title.lower() in user_message.lower():
                    related_docs.append({
                        "id": doc.id,
                        "title": doc.title,
                        "type": doc.doc_type
                    })
            
            return AgentOutput(
                agent_name=self.name,
                task_type=input_data.task_type,
                project_id=project_id,
                output_data={
                    "response": ai_response,
                    "related_documents": related_docs,
                    "suggestions": [
                        "Ask about specific document types",
                        "Request document generation",
                        "Check project status",
                        "Review document requirements"
                    ]
                },
                model_used=self.openrouter_client.get_optimal_model("chat"),
                reasoning="Generated contextual chat response following no-assumptions policy",
                execution_time=0.0,
                success=True
            )
        else:
            return AgentOutput(
                agent_name=self.name,
                task_type=input_data.task_type,
                project_id=project_id,
                output_data={
                    "response": "I apologize, but I encountered an error. Could you please rephrase your question or be more specific about what you need?",
                    "related_documents": [],
                    "suggestions": []
                },
                model_used="error",
                reasoning="LLM call failed",
                execution_time=0.0,
                success=False,
                error_message=response.get("error", "Unknown error")
            )
    
    def _orchestrate_single_document_generation(self, input_data: AgentInput, db: Session) -> AgentOutput:
        """Orchestrate single document generation"""
        # Delegate to the drafting agent
        drafting_agent = self.agent_registry["DraftingAgent"]
        result = drafting_agent.execute_with_tracing(input_data, db)
        
        return AgentOutput(
            agent_name=self.name,
            task_type=input_data.task_type,
            project_id=input_data.project_id,
            output_data=result.output_data,
            model_used="orchestration",
            reasoning="Orchestrated single document generation",
            execution_time=0.0,
            success=result.success,
            error_message=result.error_message
        )