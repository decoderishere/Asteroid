from agents.orchestrator_agent import OrchestratorAgent
from agents.ingestion_agent import IngestionAgent
from agents.drafting_agent import DraftingAgent
from agents.quality_reviewer_agent import QualityReviewerAgent
from agents.feedback_integration_agent import FeedbackIntegrationAgent
from agents.progress_tracking_agent import ProgressTrackingAgent
from openrouter_client import OpenRouterClient

class AgentRegistry:
    def __init__(self):
        self.openrouter_client = OpenRouterClient()
        self.agents = {}
        self._initialize_agents()
    
    def _initialize_agents(self):
        # Initialize all agents
        ingestion_agent = IngestionAgent(self.openrouter_client)
        drafting_agent = DraftingAgent(self.openrouter_client)
        quality_reviewer_agent = QualityReviewerAgent(self.openrouter_client)
        feedback_integration_agent = FeedbackIntegrationAgent(self.openrouter_client)
        progress_tracking_agent = ProgressTrackingAgent(self.openrouter_client)
        
        # Orchestrator needs reference to other agents
        orchestrator_agent = OrchestratorAgent(self.openrouter_client, {
            "IngestionAgent": ingestion_agent,
            "DraftingAgent": drafting_agent,
            "QualityReviewerAgent": quality_reviewer_agent,
            "FeedbackIntegrationAgent": feedback_integration_agent,
            "ProgressTrackingAgent": progress_tracking_agent
        })
        
        self.agents = {
            "OrchestratorAgent": orchestrator_agent,
            "IngestionAgent": ingestion_agent,
            "DraftingAgent": drafting_agent,
            "QualityReviewerAgent": quality_reviewer_agent,
            "FeedbackIntegrationAgent": feedback_integration_agent,
            "ProgressTrackingAgent": progress_tracking_agent
        }
    
    def get_agent(self, agent_name: str):
        return self.agents.get(agent_name)
    
    def list_agents(self):
        return list(self.agents.keys())
    
    def execute_task(self, agent_name: str, input_data, db):
        agent = self.get_agent(agent_name)
        if not agent:
            raise ValueError(f"Agent {agent_name} not found")
        
        return agent.execute_with_tracing(input_data, db)