import os
import requests
import json
from typing import Dict, Any, Optional

class OpenRouterClient:
    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.base_url = "https://openrouter.ai/api/v1"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        # Model preferences for different tasks
        self.task_models = {
            "ingestion": "anthropic/claude-3.5-sonnet",  # Best for document parsing
            "drafting": "openai/gpt-4o",                 # Good for content generation
            "quality_review": "anthropic/claude-3.5-sonnet", # Excellent for analysis
            "feedback_integration": "openai/gpt-4o",     # Good for revisions
            "default": "anthropic/claude-3.5-sonnet"
        }
    
    def get_optimal_model(self, task_type: str, custom_model: Optional[str] = None) -> str:
        if custom_model:
            return custom_model
        return self.task_models.get(task_type, self.task_models["default"])
    
    def chat_completion(self, 
                       messages: list, 
                       task_type: str = "default",
                       custom_model: Optional[str] = None,
                       temperature: float = 0.7,
                       max_tokens: int = 4000) -> Dict[str, Any]:
        
        model = self.get_optimal_model(task_type, custom_model)
        
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=self.headers,
                json=payload,
                timeout=60
            )
            response.raise_for_status()
            return {
                "success": True,
                "data": response.json(),
                "model_used": model
            }
        except requests.exceptions.RequestException as e:
            return {
                "success": False,
                "error": str(e),
                "model_used": model
            }
    
    def create_system_message(self, content: str) -> Dict[str, str]:
        return {"role": "system", "content": content}
    
    def create_user_message(self, content: str) -> Dict[str, str]:
        return {"role": "user", "content": content}