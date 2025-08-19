from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from datetime import datetime
import time
import uuid
from sqlalchemy.orm import Session
from models import AgentTrace
from schemas import AgentInput, AgentOutput
from openrouter_client import OpenRouterClient

class BaseAgent(ABC):
    def __init__(self, name: str, openrouter_client: OpenRouterClient):
        self.name = name
        self.openrouter_client = openrouter_client
    
    @abstractmethod
    def process(self, input_data: AgentInput, db: Session) -> AgentOutput:
        pass
    
    def log_trace(self, 
                  db: Session, 
                  project_id: str, 
                  task_type: str,
                  input_data: Dict[str, Any], 
                  output_data: Dict[str, Any],
                  model_used: str,
                  reasoning: str,
                  execution_time: float,
                  success: bool = True,
                  error_message: Optional[str] = None):
        
        # Clean data to remove non-JSON serializable objects like bytes
        cleaned_input_data = self._clean_data_for_json(input_data)
        cleaned_output_data = self._clean_data_for_json(output_data)
        
        trace = AgentTrace(
            project_id=project_id,
            agent_name=self.name,
            task_type=task_type,
            input_data=cleaned_input_data,
            output_data=cleaned_output_data,
            model_used=model_used,
            reasoning=reasoning,
            execution_time=execution_time,
            success=success,
            error_message=error_message
        )
        
        db.add(trace)
        db.commit()
        return trace.id
    
    def _clean_data_for_json(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Remove or convert non-JSON serializable data"""
        if not isinstance(data, dict):
            return data
        
        cleaned = {}
        for key, value in data.items():
            if isinstance(value, bytes):
                # Convert bytes to a summary instead of the raw data
                cleaned[key] = f"<bytes data: {len(value)} bytes>"
            elif isinstance(value, dict):
                cleaned[key] = self._clean_data_for_json(value)
            elif isinstance(value, list):
                cleaned[key] = [self._clean_data_for_json(item) if isinstance(item, dict) else 
                               f"<bytes data: {len(item)} bytes>" if isinstance(item, bytes) else item 
                               for item in value]
            else:
                cleaned[key] = value
        
        return cleaned
    
    def execute_with_tracing(self, input_data: AgentInput, db: Session) -> AgentOutput:
        start_time = time.time()
        
        try:
            output = self.process(input_data, db)
            execution_time = time.time() - start_time
            
            self.log_trace(
                db=db,
                project_id=input_data.project_id,
                task_type=input_data.task_type,
                input_data=input_data.input_data,
                output_data=output.output_data,
                model_used=output.model_used,
                reasoning=output.reasoning,
                execution_time=execution_time,
                success=output.success,
                error_message=output.error_message
            )
            
            return output
            
        except Exception as e:
            execution_time = time.time() - start_time
            error_message = str(e)
            
            # Rollback the session to handle any pending transaction issues
            try:
                db.rollback()
            except:
                pass
            
            try:
                self.log_trace(
                    db=db,
                    project_id=input_data.project_id,
                    task_type=input_data.task_type,
                    input_data=input_data.input_data,
                    output_data={},
                    model_used="error",
                    reasoning=f"Agent execution failed: {error_message}",
                    execution_time=execution_time,
                    success=False,
                    error_message=error_message
                )
            except:
                # If logging fails, continue with the error output
                pass
            
            return AgentOutput(
                agent_name=self.name,
                task_type=input_data.task_type,
                project_id=input_data.project_id,
                output_data={},
                model_used="error",
                reasoning=f"Agent execution failed: {error_message}",
                execution_time=execution_time,
                success=False,
                error_message=error_message
            )