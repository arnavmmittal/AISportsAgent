"""
Session Context Management for Elite Sports Psychology System.

This module provides comprehensive session context loading for protocol-driven
sports psychology conversations. It gathers:
- Conversation history (last 10 messages)
- Athlete profile (sport, position, year)
- Athlete memory (patterns, effective techniques, transient state)
- Recent mood logs (last 3 days avg)
- Active goals
- Upcoming performance metrics

Phase 1.2 of Elite Sports Psychology System implementation.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import desc
import numpy as np

from app.db.models import (
    ChatSession,
    Message,
    MessageRole,
    Athlete,
    User,
    MoodLog,
    Goal,
    GoalStatus,
    PerformanceMetric,
)


# ============================================
# DATA STRUCTURES
# ============================================

class SessionContext:
    """
    Comprehensive context for a chat session.
    Contains all data needed to generate protocol-aware responses.
    """
    def __init__(
        self,
        session_id: str,
        athlete_id: str,
        sport: str,
        position: Optional[str],
        year: str,
        current_phase: str,
        message_history: List[Dict[str, Any]],
        athlete_memory: Optional[Dict[str, Any]],
        recent_mood: Optional[Dict[str, Any]],
        active_goals: List[Dict[str, Any]],
        upcoming_games: List[Dict[str, Any]],
    ):
        self.session_id = session_id
        self.athlete_id = athlete_id
        self.sport = sport
        self.position = position
        self.year = year
        self.current_phase = current_phase
        self.message_history = message_history
        self.athlete_memory = athlete_memory
        self.recent_mood = recent_mood
        self.active_goals = active_goals
        self.upcoming_games = upcoming_games

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "session_id": self.session_id,
            "athlete_id": self.athlete_id,
            "sport": self.sport,
            "position": self.position,
            "year": self.year,
            "current_phase": self.current_phase,
            "message_history": self.message_history,
            "athlete_memory": self.athlete_memory,
            "recent_mood": self.recent_mood,
            "active_goals": self.active_goals,
            "upcoming_games": self.upcoming_games,
        }


# ============================================
# SESSION CONTEXT LOADING
# ============================================

async def get_session_context(
    db: Session,
    session_id: str,
    athlete_id: str
) -> SessionContext:
    """
    Load all context needed for generating protocol-aware response.

    Args:
        db: SQLAlchemy database session
        session_id: Chat session identifier
        athlete_id: Athlete user ID

    Returns:
        SessionContext with full conversation context

    Raises:
        ValueError: If athlete not found
    """

    # 1. Get or create ChatSession
    chat_session = db.query(ChatSession).filter(
        ChatSession.id == session_id
    ).first()

    if not chat_session:
        # Create new session with default discovery phase
        now = datetime.utcnow()
        chat_session = ChatSession(
            id=session_id,
            athleteId=athlete_id,
            discoveryPhase="check_in",
            phaseStartedAt=now,  # Track when CHECK_IN phase started
            isActive=True,
            createdAt=now,
            updatedAt=now,
        )
        db.add(chat_session)
        db.commit()
        db.refresh(chat_session)

    # 2. Load conversation history (last 10 messages in chronological order)
    messages = db.query(Message).filter(
        Message.sessionId == session_id
    ).order_by(desc(Message.createdAt)).limit(10).all()

    # Reverse to get chronological order
    messages = list(reversed(messages))

    message_history = [
        {
            "id": msg.id,
            "role": msg.role.value if hasattr(msg.role, 'value') else msg.role,
            "content": msg.content,
            "createdAt": msg.createdAt.isoformat() if msg.createdAt else None,
        }
        for msg in messages
    ]

    # 3. Load athlete profile
    athlete = db.query(Athlete).join(User).filter(
        Athlete.userId == athlete_id
    ).first()

    if not athlete:
        raise ValueError(f"Athlete not found: {athlete_id}")

    # 4. Load athlete memory (note: memory table may not exist yet)
    # For now, create default empty memory structure
    # TODO: Query AthleteMemory table once migration is run
    athlete_memory = create_default_memory(athlete_id)

    # 5. Load recent mood logs (last 3 days)
    three_days_ago = datetime.utcnow() - timedelta(days=3)
    recent_moods = db.query(MoodLog).filter(
        MoodLog.athleteId == athlete_id,
        MoodLog.createdAt >= three_days_ago
    ).order_by(desc(MoodLog.createdAt)).all()

    aggregated_mood = aggregate_mood_logs(recent_moods) if recent_moods else None

    # 6. Load active goals
    active_goals_list = db.query(Goal).filter(
        Goal.athleteId == athlete_id,
        Goal.status == GoalStatus.IN_PROGRESS
    ).all()

    active_goals = [
        {
            "id": goal.id,
            "title": goal.title,
            "description": goal.description,
            "category": goal.category.value if hasattr(goal.category, 'value') else goal.category,
            "targetDate": goal.targetDate.isoformat() if goal.targetDate else None,
        }
        for goal in active_goals_list
    ]

    # 7. Load upcoming performance metrics (next 3 games)
    now = datetime.utcnow()
    upcoming_games_list = db.query(PerformanceMetric).filter(
        PerformanceMetric.athleteId == athlete_id,
        PerformanceMetric.gameDate >= now
    ).order_by(PerformanceMetric.gameDate).limit(3).all()

    upcoming_games = [
        {
            "id": game.id,
            "gameDate": game.gameDate.isoformat() if game.gameDate else None,
            "sport": game.sport,
            "opponentName": game.opponentName,
        }
        for game in upcoming_games_list
    ]

    # 8. Build SessionContext
    return SessionContext(
        session_id=session_id,
        athlete_id=athlete_id,
        sport=athlete.sport,
        position=athlete.teamPosition,
        year=athlete.year,
        current_phase=chat_session.discoveryPhase or "check_in",
        message_history=message_history,
        athlete_memory=athlete_memory,
        recent_mood=aggregated_mood,
        active_goals=active_goals,
        upcoming_games=upcoming_games,
    )


# ============================================
# ATHLETE MEMORY MANAGEMENT
# ============================================

def create_default_memory(athlete_id: str) -> Dict[str, Any]:
    """
    Create default empty memory structure for new athletes.

    This is used when AthleteMemory record doesn't exist yet.
    Memory will be populated over time as athlete uses the system.

    Args:
        athlete_id: Athlete user ID

    Returns:
        Default memory dictionary with empty fields
    """
    return {
        "id": f"memory_{athlete_id}",
        "athleteId": athlete_id,
        # Stable traits (populated after 3+ confirming sessions)
        "typicalAnxietyPattern": None,
        "effectiveTechniques": [],  # [{name, effectiveness, sessions_used}]
        "commonTriggers": [],  # ["high-pressure situations", "mistakes"]
        "preferredCommunication": None,  # "direct", "empathetic", "data-driven"
        "bestLearningStyle": None,  # "visual", "kinesthetic", "conceptual"
        # Transient state (refreshed every session)
        "currentStressLevel": None,  # 0-10
        "upcomingCompetitions": [],  # [{date, importance}]
        "recentSleep": None,  # Avg hours last 3 days
        "activeGoals": [],  # [{id, focus}]
        "recentPerformance": None,  # "improving", "declining", "stable"
        # Technique outcomes
        "techniqueHistory": [],  # [{technique, tried_at, outcome, adherence}]
        "lastUpdated": datetime.utcnow().isoformat(),
    }


# ============================================
# MOOD LOG AGGREGATION
# ============================================

def aggregate_mood_logs(mood_logs: List[MoodLog]) -> Optional[Dict[str, Any]]:
    """
    Aggregate mood logs from last 3 days into average scores.

    Computes mean values for:
    - mood (1-10)
    - confidence (1-10)
    - stress (1-10)
    - energy (1-10, optional)
    - sleep (hours, optional)

    Args:
        mood_logs: List of MoodLog objects from last 3 days

    Returns:
        Dictionary with averaged values, or None if no logs
    """
    if not mood_logs:
        return None

    # Extract values
    moods = [log.mood for log in mood_logs if log.mood is not None]
    confidences = [log.confidence for log in mood_logs if log.confidence is not None]
    stresses = [log.stress for log in mood_logs if log.stress is not None]
    energies = [log.energy for log in mood_logs if log.energy is not None]
    sleeps = [log.sleep for log in mood_logs if log.sleep is not None]

    # Compute averages
    result = {}

    if moods:
        result["mood_avg"] = float(np.mean(moods))
        result["mood_min"] = int(min(moods))
        result["mood_max"] = int(max(moods))

    if confidences:
        result["confidence_avg"] = float(np.mean(confidences))
        result["confidence_min"] = int(min(confidences))
        result["confidence_max"] = int(max(confidences))

    if stresses:
        result["stress_avg"] = float(np.mean(stresses))
        result["stress_min"] = int(min(stresses))
        result["stress_max"] = int(max(stresses))

    if energies:
        result["energy_avg"] = float(np.mean(energies))

    if sleeps:
        result["sleep_avg"] = float(np.mean(sleeps))

    result["sample_size"] = len(mood_logs)
    result["date_range"] = {
        "oldest": mood_logs[-1].createdAt.isoformat() if mood_logs else None,
        "newest": mood_logs[0].createdAt.isoformat() if mood_logs else None,
    }

    return result


# ============================================
# MEMORY UPDATE (Phase 4)
# ============================================

async def update_athlete_memory(
    db: Session,
    athlete_id: str,
    session_id: str,
    structured_response: Dict[str, Any],
    session_outcome: Optional[str] = None
) -> None:
    """
    Update athlete memory based on session interactions.

    This function will be fully implemented in Phase 4 (Memory + RAG Enhancement).
    For now, it's a placeholder that will track technique usage.

    Args:
        db: SQLAlchemy database session
        athlete_id: Athlete user ID
        session_id: Current session ID
        structured_response: Structured response from AI with metadata
        session_outcome: Optional session outcome ("helpful", "neutral", "not_helpful")
    """
    # TODO: Implement in Phase 4
    # This will:
    # 1. Update stable traits (after 3+ confirming sessions)
    # 2. Track technique outcomes
    # 3. Refresh transient state (mood, sleep, upcoming games)
    # 4. Apply decay rules
    pass
