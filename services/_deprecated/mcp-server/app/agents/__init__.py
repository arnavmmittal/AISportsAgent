"""AI agents for sports psychology platform."""

# from app.agents.knowledge_agent import KnowledgeAgent  # Disabled for MVP (requires chromadb)
from app.agents.athlete_agent import AthleteAgent
from app.agents.coach_agent import CoachAgent
from app.agents.governance_agent import GovernanceAgent

__all__ = [
    # "KnowledgeAgent",  # Disabled for MVP
    "AthleteAgent",
    "CoachAgent",
    "GovernanceAgent"
]
