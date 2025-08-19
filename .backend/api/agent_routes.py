"""API routes for agent-driven document generation"""

import asyncio
from typing import Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
import json
import logging

from agents.bess_orchestrator import BESSOrchestrator

logger = logging.getLogger(__name__)

# Global orchestrator instance
orchestrator = BESSOrchestrator()

# API Models
class GenerateRequest(BaseModel):
    query: str = Field(..., description="Project query or description")
    max_docs: int = Field(default=10, description="Maximum documents to process")
    document_type: str = Field(default="environmental_study_chile_dia_v1", description="Type of document to generate")

class GenerateResponse(BaseModel):
    run_id: str
    status: str = "queued"
    message: str = "Document generation started"

class RunStatus(BaseModel):
    id: str
    status: str
    query: str
    max_docs: int
    processed_docs: int
    total_docs: Optional[int]
    current_step: str
    progress: float
    error: Optional[str]
    finished: bool
    created_at: str
    updated_at: str
    result: Optional[dict] = None

# Create router
router = APIRouter(prefix="/api/agent", tags=["agent"])

@router.post("/generate", response_model=GenerateResponse)
async def start_generation(request: GenerateRequest):
    """Start a new document generation run"""
    try:
        run_id = await orchestrator.start_run(
            query=request.query,
            max_docs=request.max_docs
        )
        
        return GenerateResponse(
            run_id=run_id,
            status="queued",
            message=f"Started generation for: {request.query}"
        )
        
    except Exception as e:
        logger.error(f"Failed to start generation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/runs/{run_id}", response_model=RunStatus)
async def get_run_status(run_id: str):
    """Get current status of a run"""
    status = orchestrator.get_run_status(run_id)
    
    if not status:
        raise HTTPException(status_code=404, detail="Run not found")
    
    return RunStatus(**status)

@router.get("/runs/{run_id}/summary")
async def get_run_summary(run_id: str):
    """Get detailed summary of a run including events and metrics"""
    summary = orchestrator.get_run_summary(run_id)
    
    if not summary:
        raise HTTPException(status_code=404, detail="Run not found")
    
    return summary

@router.get("/runs/{run_id}/events")
async def get_run_events(run_id: str):
    """Get all events for a run"""
    events = orchestrator.get_run_events(run_id)
    return {"run_id": run_id, "events": events}

@router.get("/runs/{run_id}/stream")
async def stream_run_progress(run_id: str):
    """Stream real-time progress updates for a run"""
    
    async def event_generator():
        """Generate Server-Sent Events for run progress"""
        
        # First, send current status
        status = orchestrator.get_run_status(run_id)
        if not status:
            yield f"data: {json.dumps({'error': 'Run not found'})}\n\n"
            return
        
        yield f"data: {json.dumps(status)}\n\n"
        
        # If run is already finished, stop here
        if status.get('finished'):
            return
        
        # Stream updates while run is active
        last_event_count = len(orchestrator.get_run_events(run_id))
        
        while True:
            await asyncio.sleep(0.5)  # Check every 500ms
            
            current_status = orchestrator.get_run_status(run_id)
            if not current_status:
                break
            
            # Check for new events
            current_events = orchestrator.get_run_events(run_id)
            if len(current_events) > last_event_count:
                # Send new events
                new_events = current_events[last_event_count:]
                for event in new_events:
                    yield f"event: agent_event\ndata: {json.dumps(event)}\n\n"
                last_event_count = len(current_events)
            
            # Send status update
            yield f"event: status_update\ndata: {json.dumps(current_status)}\n\n"
            
            # Break if run is finished
            if current_status.get('finished'):
                break
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )

@router.get("/runs/{run_id}/result")
async def get_run_result(run_id: str):
    """Get the final result of a completed run"""
    status = orchestrator.get_run_status(run_id)
    
    if not status:
        raise HTTPException(status_code=404, detail="Run not found")
    
    if not status.get('finished'):
        raise HTTPException(status_code=400, detail="Run not yet completed")
    
    if status.get('status') != 'succeeded':
        raise HTTPException(
            status_code=400, 
            detail=f"Run failed: {status.get('error', 'Unknown error')}"
        )
    
    result = status.get('result')
    if not result:
        raise HTTPException(status_code=404, detail="No result available")
    
    return result

@router.get("/runs")
async def list_runs(limit: int = 50):
    """List recent runs"""
    all_runs = []
    
    for run_id, run_state in list(orchestrator.runs.items())[-limit:]:
        run_dict = run_state.to_dict()
        # Remove large result data for list view
        if 'result' in run_dict:
            del run_dict['result']
        all_runs.append(run_dict)
    
    # Sort by created_at descending (newest first)
    all_runs.sort(key=lambda x: x['created_at'], reverse=True)
    
    return {"runs": all_runs, "total": len(all_runs)}

@router.delete("/runs/{run_id}")
async def cancel_run(run_id: str):
    """Cancel a running job (if possible)"""
    status = orchestrator.get_run_status(run_id)
    
    if not status:
        raise HTTPException(status_code=404, detail="Run not found")
    
    if status.get('finished'):
        raise HTTPException(status_code=400, detail="Run already finished")
    
    # For now, just mark as canceled (real cancellation would need more complex logic)
    run_state = orchestrator.runs[run_id]
    run_state.status = "canceled"
    run_state.finished = True
    run_state.error = "Canceled by user"
    
    return {"message": "Run canceled", "run_id": run_id}

# Health check endpoint
@router.get("/health")
async def health_check():
    """Check if the agent system is healthy"""
    return {
        "status": "healthy",
        "active_runs": len([r for r in orchestrator.runs.values() if not r.finished]),
        "total_runs": len(orchestrator.runs),
        "agents": list(orchestrator.agents.keys())
    }