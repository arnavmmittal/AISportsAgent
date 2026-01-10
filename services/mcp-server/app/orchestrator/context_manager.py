"""
Conversation Context Manager

Manages conversation state and context across turns.
Stores session information, detected emotions, topics, and agent state.
"""

from dataclasses import dataclass, field
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from enum import Enum
import json
from app.core.logging import setup_logging

logger = setup_logging()


class ConversationPhase(str, Enum):
    """Discovery-First Protocol phases."""
    DISCOVERY = "discovery"  # Initial information gathering
    UNDERSTANDING = "understanding"  # Reflecting back understanding
    FRAMEWORK = "framework"  # Applying evidence-based framework
    ACTION = "action"  # Concrete action steps
    FOLLOW_UP = "follow_up"  # Checking in on progress


@dataclass
class EmotionalState:
    """Tracked emotional state of the user."""
    primary_emotion: str = "neutral"
    intensity: float = 0.5  # 0-1 scale
    trend: str = "stable"  # improving, stable, declining
    last_updated: datetime = field(default_factory=datetime.now)


@dataclass
class ConversationContext:
    """
    Full conversation context for an athlete session.

    Tracks:
    - Session metadata
    - Conversation history
    - Detected topics and emotions
    - Current protocol phase
    - Agent state
    """
    # Session info
    session_id: str
    athlete_id: str
    started_at: datetime = field(default_factory=datetime.now)
    last_activity: datetime = field(default_factory=datetime.now)

    # Conversation state
    message_count: int = 0
    conversation_history: List[Dict[str, str]] = field(default_factory=list)
    current_phase: ConversationPhase = ConversationPhase.DISCOVERY
    discovery_questions_asked: int = 0

    # Detected context
    topics: List[str] = field(default_factory=list)
    emotional_state: EmotionalState = field(default_factory=EmotionalState)
    crisis_flags: List[str] = field(default_factory=list)

    # Sport context
    sport: Optional[str] = None
    upcoming_event: Optional[str] = None
    recent_performance: Optional[str] = None

    # Agent state
    active_agent: str = "athlete_agent"
    active_framework: Optional[str] = None
    pending_intervention: Optional[Dict[str, Any]] = None

    # Metadata
    metadata: Dict[str, Any] = field(default_factory=dict)

    def add_message(self, role: str, content: str) -> None:
        """Add a message to conversation history."""
        self.conversation_history.append({
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat(),
        })
        self.message_count += 1
        self.last_activity = datetime.now()

    def add_topic(self, topic: str) -> None:
        """Add a detected topic."""
        if topic not in self.topics:
            self.topics.append(topic)

    def update_emotion(
        self,
        emotion: str,
        intensity: float,
        trend: Optional[str] = None,
    ) -> None:
        """Update tracked emotional state."""
        old_intensity = self.emotional_state.intensity

        self.emotional_state.primary_emotion = emotion
        self.emotional_state.intensity = intensity
        self.emotional_state.last_updated = datetime.now()

        if trend:
            self.emotional_state.trend = trend
        else:
            # Auto-determine trend
            if intensity < old_intensity - 0.1:
                self.emotional_state.trend = "improving" if emotion in ["anxiety", "stress"] else "declining"
            elif intensity > old_intensity + 0.1:
                self.emotional_state.trend = "declining" if emotion in ["anxiety", "stress"] else "improving"
            else:
                self.emotional_state.trend = "stable"

    def should_advance_phase(self) -> bool:
        """Check if ready to advance to next protocol phase."""
        if self.current_phase == ConversationPhase.DISCOVERY:
            # Need minimum discovery questions
            return self.discovery_questions_asked >= 3
        elif self.current_phase == ConversationPhase.UNDERSTANDING:
            # Ready after reflection
            return self.message_count > 5
        elif self.current_phase == ConversationPhase.FRAMEWORK:
            # Ready after framework applied
            return self.active_framework is not None
        return False

    def advance_phase(self) -> ConversationPhase:
        """Advance to next protocol phase."""
        phase_order = list(ConversationPhase)
        current_idx = phase_order.index(self.current_phase)

        if current_idx < len(phase_order) - 1:
            self.current_phase = phase_order[current_idx + 1]

        return self.current_phase

    def get_recent_history(self, n: int = 5) -> List[Dict[str, str]]:
        """Get last n messages."""
        return self.conversation_history[-n:]

    def is_active(self, timeout_minutes: int = 30) -> bool:
        """Check if session is still active."""
        cutoff = datetime.now() - timedelta(minutes=timeout_minutes)
        return self.last_activity > cutoff

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "session_id": self.session_id,
            "athlete_id": self.athlete_id,
            "started_at": self.started_at.isoformat(),
            "last_activity": self.last_activity.isoformat(),
            "message_count": self.message_count,
            "current_phase": self.current_phase.value,
            "topics": self.topics,
            "emotional_state": {
                "primary_emotion": self.emotional_state.primary_emotion,
                "intensity": self.emotional_state.intensity,
                "trend": self.emotional_state.trend,
            },
            "active_agent": self.active_agent,
            "active_framework": self.active_framework,
            "sport": self.sport,
            "metadata": self.metadata,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ConversationContext":
        """Create from dictionary."""
        ctx = cls(
            session_id=data["session_id"],
            athlete_id=data["athlete_id"],
        )
        ctx.started_at = datetime.fromisoformat(data.get("started_at", datetime.now().isoformat()))
        ctx.last_activity = datetime.fromisoformat(data.get("last_activity", datetime.now().isoformat()))
        ctx.message_count = data.get("message_count", 0)
        ctx.current_phase = ConversationPhase(data.get("current_phase", "discovery"))
        ctx.topics = data.get("topics", [])
        ctx.active_agent = data.get("active_agent", "athlete_agent")
        ctx.active_framework = data.get("active_framework")
        ctx.sport = data.get("sport")
        ctx.metadata = data.get("metadata", {})

        if "emotional_state" in data:
            es = data["emotional_state"]
            ctx.emotional_state = EmotionalState(
                primary_emotion=es.get("primary_emotion", "neutral"),
                intensity=es.get("intensity", 0.5),
                trend=es.get("trend", "stable"),
            )

        return ctx


class ContextManager:
    """
    Manages conversation contexts across sessions.

    Uses in-memory storage with optional Redis persistence.
    """

    def __init__(self, use_redis: bool = False):
        """
        Initialize context manager.

        Args:
            use_redis: Whether to use Redis for persistence
        """
        self._contexts: Dict[str, ConversationContext] = {}
        self.use_redis = use_redis
        self._redis_client = None

        if use_redis:
            self._init_redis()

    def _init_redis(self) -> None:
        """Initialize Redis client."""
        try:
            import redis
            from app.core.config import settings
            self._redis_client = redis.from_url(settings.redis_url)
            logger.info("Redis context storage initialized")
        except Exception as e:
            logger.warning(f"Redis initialization failed: {e}")
            self.use_redis = False

    def get_context(
        self,
        session_id: str,
        athlete_id: Optional[str] = None,
    ) -> Optional[ConversationContext]:
        """
        Get context for a session.

        Args:
            session_id: Session identifier
            athlete_id: Optional athlete ID for new context

        Returns:
            ConversationContext or None if not found
        """
        # Check in-memory first
        if session_id in self._contexts:
            ctx = self._contexts[session_id]
            if ctx.is_active():
                return ctx
            else:
                # Clean up expired context
                del self._contexts[session_id]

        # Check Redis
        if self.use_redis and self._redis_client:
            try:
                data = self._redis_client.get(f"context:{session_id}")
                if data:
                    ctx = ConversationContext.from_dict(json.loads(data))
                    self._contexts[session_id] = ctx
                    return ctx
            except Exception as e:
                logger.warning(f"Redis get failed: {e}")

        return None

    def create_context(
        self,
        session_id: str,
        athlete_id: str,
        sport: Optional[str] = None,
    ) -> ConversationContext:
        """
        Create a new conversation context.

        Args:
            session_id: Session identifier
            athlete_id: Athlete identifier
            sport: Optional sport for context

        Returns:
            New ConversationContext
        """
        ctx = ConversationContext(
            session_id=session_id,
            athlete_id=athlete_id,
            sport=sport,
        )

        self._contexts[session_id] = ctx
        self._persist_context(ctx)

        logger.info(f"Created context for session {session_id}")
        return ctx

    def update_context(
        self,
        session_id: str,
        **updates,
    ) -> Optional[ConversationContext]:
        """
        Update an existing context.

        Args:
            session_id: Session identifier
            **updates: Fields to update

        Returns:
            Updated context or None
        """
        ctx = self.get_context(session_id)
        if not ctx:
            return None

        for key, value in updates.items():
            if hasattr(ctx, key):
                setattr(ctx, key, value)

        ctx.last_activity = datetime.now()
        self._persist_context(ctx)

        return ctx

    def _persist_context(self, ctx: ConversationContext) -> None:
        """Persist context to Redis if enabled."""
        if self.use_redis and self._redis_client:
            try:
                self._redis_client.setex(
                    f"context:{ctx.session_id}",
                    3600,  # 1 hour TTL
                    json.dumps(ctx.to_dict()),
                )
            except Exception as e:
                logger.warning(f"Redis persist failed: {e}")

    def cleanup_expired(self, timeout_minutes: int = 60) -> int:
        """
        Clean up expired contexts.

        Args:
            timeout_minutes: Inactivity threshold

        Returns:
            Number of contexts cleaned up
        """
        expired = []
        for session_id, ctx in self._contexts.items():
            if not ctx.is_active(timeout_minutes):
                expired.append(session_id)

        for session_id in expired:
            del self._contexts[session_id]

        if expired:
            logger.info(f"Cleaned up {len(expired)} expired contexts")

        return len(expired)


# Global context manager instance
_context_manager: Optional[ContextManager] = None


def get_context_manager() -> ContextManager:
    """Get global context manager."""
    global _context_manager
    if _context_manager is None:
        _context_manager = ContextManager()
    return _context_manager


# Convenience functions
def get_context(
    session_id: str,
    athlete_id: Optional[str] = None,
) -> Optional[ConversationContext]:
    """Get context for a session."""
    return get_context_manager().get_context(session_id, athlete_id)


def update_context(session_id: str, **updates) -> Optional[ConversationContext]:
    """Update a session context."""
    return get_context_manager().update_context(session_id, **updates)
