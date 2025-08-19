"""Base agent classes and event system"""

import asyncio
import time
import uuid
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Callable, Union
import json
import logging

logger = logging.getLogger(__name__)


class EventType(str, Enum):
    """Types of events agents can emit"""
    STARTED = "started"
    PROGRESS = "progress" 
    STEP_STARTED = "step_started"
    STEP_COMPLETED = "step_completed"
    WARNING = "warning"
    ERROR = "error"
    COMPLETED = "completed"
    FAILED = "failed"


class RunStatus(str, Enum):
    """Overall run status"""
    QUEUED = "queued"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELED = "canceled"


@dataclass
class AgentEvent:
    """Event emitted by agents during execution"""
    run_id: str
    agent_id: str
    event_type: EventType
    timestamp: datetime = field(default_factory=datetime.now)
    message: str = ""
    data: Dict[str, Any] = field(default_factory=dict)
    error: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "run_id": self.run_id,
            "agent_id": self.agent_id,
            "event_type": self.event_type,
            "timestamp": self.timestamp.isoformat(),
            "message": self.message,
            "data": self.data,
            "error": self.error
        }


@dataclass
class RunState:
    """Current state of an agent run"""
    id: str
    status: RunStatus = RunStatus.QUEUED
    query: str = ""
    max_docs: int = 0
    processed_docs: int = 0
    total_docs: Optional[int] = None
    current_step: str = ""
    progress: float = 0.0
    error: Optional[str] = None
    finished: bool = False
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    result: Optional[Dict[str, Any]] = None
    events: List[AgentEvent] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "status": self.status,
            "query": self.query,
            "max_docs": self.max_docs,
            "processed_docs": self.processed_docs,
            "total_docs": self.total_docs,
            "current_step": self.current_step,
            "progress": self.progress,
            "error": self.error,
            "finished": self.finished,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "result": self.result
        }


class EventEmitter:
    """Handles event emission and subscription"""
    
    def __init__(self):
        self.subscribers: List[Callable[[AgentEvent], None]] = []
    
    def subscribe(self, callback: Callable[[AgentEvent], None]):
        """Subscribe to agent events"""
        self.subscribers.append(callback)
    
    def emit(self, event: AgentEvent):
        """Emit an event to all subscribers"""
        logger.info(f"[{event.run_id}] {event.agent_id}: {event.event_type} - {event.message}")
        for callback in self.subscribers:
            try:
                callback(event)
            except Exception as e:
                logger.error(f"Event callback error: {e}")


class BaseAgent(ABC):
    """Base class for all agents"""
    
    def __init__(self, agent_id: str, emitter: EventEmitter):
        self.agent_id = agent_id
        self.emitter = emitter
        self.is_running = False
        self.current_run_id: Optional[str] = None
    
    def emit_event(
        self, 
        event_type: EventType, 
        message: str = "", 
        data: Optional[Dict[str, Any]] = None,
        error: Optional[str] = None
    ):
        """Emit an event during execution"""
        if not self.current_run_id:
            return
            
        event = AgentEvent(
            run_id=self.current_run_id,
            agent_id=self.agent_id,
            event_type=event_type,
            message=message,
            data=data or {},
            error=error
        )
        self.emitter.emit(event)
    
    async def execute(self, run_id: str, **kwargs) -> Any:
        """Execute the agent with given parameters"""
        self.current_run_id = run_id
        self.is_running = True
        
        try:
            self.emit_event(EventType.STARTED, f"Starting {self.agent_id}")
            result = await self._execute(**kwargs)
            self.emit_event(EventType.COMPLETED, f"Completed {self.agent_id}", {"result": str(result)})
            return result
        except Exception as e:
            error_msg = str(e)
            self.emit_event(EventType.FAILED, f"Failed {self.agent_id}", error=error_msg)
            raise
        finally:
            self.is_running = False
            self.current_run_id = None
    
    @abstractmethod
    async def _execute(self, **kwargs) -> Any:
        """Implement the agent's core logic"""
        pass
    
    def emit_step(self, step_name: str, message: str = ""):
        """Emit a step started event"""
        self.emit_event(EventType.STEP_STARTED, message or f"Starting {step_name}", {"step": step_name})
    
    def emit_progress(self, current: int, total: int, message: str = ""):
        """Emit progress update"""
        progress = (current / total) * 100 if total > 0 else 0
        self.emit_event(
            EventType.PROGRESS, 
            message or f"Progress: {current}/{total}",
            {"current": current, "total": total, "progress": progress}
        )
    
    def emit_warning(self, message: str, data: Optional[Dict[str, Any]] = None):
        """Emit a warning"""
        self.emit_event(EventType.WARNING, message, data)


class AgentOrchestrator:
    """Orchestrates multiple agents for document generation"""
    
    def __init__(self):
        self.emitter = EventEmitter()
        self.agents: Dict[str, BaseAgent] = {}
        self.runs: Dict[str, RunState] = {}
    
    def register_agent(self, agent: BaseAgent):
        """Register an agent with the orchestrator"""
        self.agents[agent.agent_id] = agent
    
    def subscribe_to_events(self, callback: Callable[[AgentEvent], None]):
        """Subscribe to all agent events"""
        self.emitter.subscribe(callback)
    
    async def start_run(self, query: str, max_docs: int = 10) -> str:
        """Start a new document generation run"""
        run_id = str(uuid.uuid4())
        
        run_state = RunState(
            id=run_id,
            query=query,
            max_docs=max_docs,
            status=RunStatus.QUEUED
        )
        
        self.runs[run_id] = run_state
        
        # Start the run in background
        asyncio.create_task(self._execute_run(run_id))
        
        return run_id
    
    async def _execute_run(self, run_id: str):
        """Execute a complete document generation run"""
        run_state = self.runs[run_id]
        
        try:
            run_state.status = RunStatus.RUNNING
            run_state.updated_at = datetime.now()
            
            # This will be implemented by specific orchestrator subclasses
            result = await self._run_pipeline(run_id, run_state)
            
            run_state.status = RunStatus.SUCCEEDED
            run_state.finished = True
            run_state.result = result
            run_state.progress = 100.0
            
        except Exception as e:
            run_state.status = RunStatus.FAILED
            run_state.finished = True
            run_state.error = str(e)
            logger.error(f"Run {run_id} failed: {e}")
        
        run_state.updated_at = datetime.now()
    
    @abstractmethod
    async def _run_pipeline(self, run_id: str, run_state: RunState) -> Dict[str, Any]:
        """Implement the specific pipeline logic"""
        pass
    
    def get_run_status(self, run_id: str) -> Optional[Dict[str, Any]]:
        """Get current status of a run"""
        if run_id not in self.runs:
            return None
        return self.runs[run_id].to_dict()
    
    def get_run_events(self, run_id: str) -> List[Dict[str, Any]]:
        """Get all events for a run"""
        if run_id not in self.runs:
            return []
        return [event.to_dict() for event in self.runs[run_id].events]