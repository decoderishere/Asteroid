"""Main orchestrator for BESS document generation"""

import asyncio
from typing import Dict, Any

from .base import AgentOrchestrator, RunState, EventType
from .document_processor import DocumentProcessor
from .content_generator import ContentGenerator
from .document_assembler import DocumentAssembler


class BESSOrchestrator(AgentOrchestrator):
    """Orchestrator for BESS permitting document generation"""
    
    def __init__(self, documents_path: str = "documents", output_path: str = "documents"):
        super().__init__()
        
        # Initialize agents
        self.doc_processor = DocumentProcessor(self.emitter, documents_path)
        self.content_generator = ContentGenerator(self.emitter)
        self.doc_assembler = DocumentAssembler(self.emitter, output_path)
        
        # Register agents
        self.register_agent(self.doc_processor)
        self.register_agent(self.content_generator)
        self.register_agent(self.doc_assembler)
        
        # Subscribe to events to update run state
        self.emitter.subscribe(self._handle_agent_event)
    
    def _handle_agent_event(self, event):
        """Handle agent events and update run state"""
        run_id = event.run_id
        if run_id not in self.runs:
            return
        
        run_state = self.runs[run_id]
        
        # Add event to run history
        run_state.events.append(event)
        
        # Update run state based on event
        if event.event_type == EventType.STEP_STARTED:
            run_state.current_step = event.data.get("step", event.message)
        
        elif event.event_type == EventType.PROGRESS:
            # Update progress if it's document processing
            if event.agent_id == "document_processor":
                data = event.data
                if "current" in data and "total" in data:
                    run_state.processed_docs = data["current"]
                    run_state.total_docs = data["total"]
                    # Calculate overall progress (doc processing is 40% of total)
                    doc_progress = (data["current"] / data["total"]) * 40 if data["total"] > 0 else 0
                    run_state.progress = max(run_state.progress, doc_progress)
                
                if "total_docs" in data:
                    run_state.total_docs = data["total_docs"]
            
            elif event.agent_id == "content_generator":
                # Content generation is 50% of total (from 40% to 90%)
                data = event.data
                if "current" in data and "total" in data:
                    section_progress = (data["current"] / data["total"]) * 50 if data["total"] > 0 else 0
                    run_state.progress = max(run_state.progress, 40 + section_progress)
            
            elif event.agent_id == "document_assembler":
                # Document assembly is final 10% (from 90% to 100%)
                data = event.data
                if "current" in data and "total" in data:
                    assembly_progress = (data["current"] / data["total"]) * 10 if data["total"] > 0 else 0
                    run_state.progress = max(run_state.progress, 90 + assembly_progress)
        
        elif event.event_type == EventType.WARNING:
            # Could collect warnings in run state if needed
            pass
        
        elif event.event_type == EventType.ERROR:
            run_state.error = event.error
        
        # Always update timestamp
        from datetime import datetime
        run_state.updated_at = datetime.now()
    
    async def _run_pipeline(self, run_id: str, run_state: RunState) -> Dict[str, Any]:
        """Execute the complete BESS document generation pipeline"""
        
        query = run_state.query
        max_docs = run_state.max_docs
        
        try:
            # Step 1: Process documents (0-40% progress)
            run_state.current_step = "Processing source documents"
            doc_result = await self.doc_processor.execute(
                run_id, 
                query=query, 
                max_docs=max_docs
            )
            
            # Step 2: Generate content (40-90% progress)
            run_state.current_step = "Generating document content"
            content_result = await self.content_generator.execute(
                run_id,
                extracted_content=doc_result["extracted_content"],
                query=query,
                document_type="environmental_study_chile_dia_v1"
            )
            
            # Step 3: Assemble final document (90-100% progress)
            run_state.current_step = "Assembling final document"
            assembly_result = await self.doc_assembler.execute(
                run_id,
                generated_sections=content_result,
                query=query,
                document_type="environmental_study_chile_dia_v1"
            )
            
            # Final result
            final_result = {
                "pipeline_completed": True,
                "document_processing": {
                    "files_found": doc_result["total_found"],
                    "files_processed": doc_result["total_processed"],
                    "processed_files": doc_result["processed_files"]
                },
                "content_generation": {
                    "sections_generated": len(content_result["sections"]),
                    "using_mock": content_result["using_mock"],
                    "sections": content_result["sections"]
                },
                "document_assembly": {
                    "markdown": assembly_result["markdown"],
                    "html": assembly_result["html"],
                    "files": assembly_result["files"],
                    "metadata": assembly_result["metadata"]
                },
                "summary": {
                    "query": query,
                    "document_type": "environmental_study_chile_dia_v1",
                    "source_files_processed": doc_result["total_processed"],
                    "sections_generated": len(content_result["sections"]),
                    "output_files": assembly_result["files"]
                }
            }
            
            run_state.current_step = "Generation completed successfully"
            return final_result
            
        except Exception as e:
            run_state.current_step = f"Failed: {str(e)}"
            raise
    
    def get_run_summary(self, run_id: str) -> Dict[str, Any]:
        """Get a summary of the run including key metrics"""
        if run_id not in self.runs:
            return None
        
        run_state = self.runs[run_id]
        base_status = run_state.to_dict()
        
        # Add summary statistics
        events = run_state.events
        base_status["summary"] = {
            "total_events": len(events),
            "warnings": len([e for e in events if e.event_type == EventType.WARNING]),
            "errors": len([e for e in events if e.event_type == EventType.ERROR]),
            "steps_completed": len([e for e in events if e.event_type == EventType.STEP_COMPLETED]),
            "agents_involved": len(set(e.agent_id for e in events))
        }
        
        return base_status