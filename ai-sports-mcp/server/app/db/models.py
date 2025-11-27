"""
SQLAlchemy ORM models matching Prisma schema.
"""

from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime, Text, JSON,
    ForeignKey, Enum as SQLEnum, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import ARRAY
from datetime import datetime
import enum

from .database import Base


# ============================================
# ENUMS
# ============================================

class Role(str, enum.Enum):
    """User role enum."""
    ATHLETE = "ATHLETE"
    COACH = "COACH"
    ADMIN = "ADMIN"


class MessageRole(str, enum.Enum):
    """Message role enum."""
    user = "user"
    assistant = "assistant"
    system = "system"


class GoalCategory(str, enum.Enum):
    """Goal category enum."""
    PERFORMANCE = "PERFORMANCE"
    MENTAL = "MENTAL"
    ACADEMIC = "ACADEMIC"
    PERSONAL = "PERSONAL"


class GoalStatus(str, enum.Enum):
    """Goal status enum."""
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    ABANDONED = "ABANDONED"


class KnowledgeCategory(str, enum.Enum):
    """Knowledge category enum."""
    ANXIETY = "ANXIETY"
    CONFIDENCE = "CONFIDENCE"
    FOCUS = "FOCUS"
    RECOVERY = "RECOVERY"
    GOAL_SETTING = "GOAL_SETTING"
    MOTIVATION = "MOTIVATION"
    TEAM_DYNAMICS = "TEAM_DYNAMICS"
    STRESS_MANAGEMENT = "STRESS_MANAGEMENT"
    PERFORMANCE_ANXIETY = "PERFORMANCE_ANXIETY"
    FLOW_STATE = "FLOW_STATE"
    SELF_TALK = "SELF_TALK"
    VISUALIZATION = "VISUALIZATION"
    MINDFULNESS = "MINDFULNESS"
    BURNOUT = "BURNOUT"


# ============================================
# USER MANAGEMENT
# ============================================

class School(Base):
    """School model."""
    __tablename__ = "School"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    division = Column(String, nullable=False)  # D1, D2, D3
    customConfig = Column(JSON, nullable=True)

    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    users = relationship("User", back_populates="school")

    __table_args__ = (
        Index("idx_school_name", "name"),
    )


class User(Base):
    """User model."""
    __tablename__ = "User"

    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    emailVerified = Column(DateTime, nullable=True)
    name = Column(String, nullable=False)
    password = Column(String, nullable=True)
    image = Column(String, nullable=True)
    role = Column(SQLEnum(Role), default=Role.ATHLETE, nullable=False)

    schoolId = Column(String, ForeignKey("School.id"), nullable=False)

    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    school = relationship("School", back_populates="users")
    athlete = relationship("Athlete", back_populates="user", uselist=False)
    coach = relationship("Coach", back_populates="user", uselist=False)
    accounts = relationship("Account", back_populates="user")
    sessions = relationship("Session", back_populates="user")

    __table_args__ = (
        Index("idx_user_email", "email"),
        Index("idx_user_schoolId", "schoolId"),
    )


# ============================================
# ATHLETE DATA
# ============================================

class Athlete(Base):
    """Athlete model."""
    __tablename__ = "Athlete"

    userId = Column(String, ForeignKey("User.id", ondelete="CASCADE"), primary_key=True)
    sport = Column(String, nullable=False)
    year = Column(String, nullable=False)
    teamPosition = Column(String, nullable=True)

    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="athlete")
    sessions = relationship("ChatSession", back_populates="athlete")
    moodLogs = relationship("MoodLog", back_populates="athlete")
    goals = relationship("Goal", back_populates="athlete")

    __table_args__ = (
        Index("idx_athlete_sport", "sport"),
    )


# ============================================
# COACH DATA
# ============================================

class Coach(Base):
    """Coach model."""
    __tablename__ = "Coach"

    userId = Column(String, ForeignKey("User.id", ondelete="CASCADE"), primary_key=True)
    sport = Column(String, nullable=False)
    title = Column(String, nullable=True)

    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="coach")
    notes = relationship("CoachNote", back_populates="coach")


class CoachNote(Base):
    """Coach note model."""
    __tablename__ = "CoachNote"

    id = Column(String, primary_key=True)
    coachId = Column(String, ForeignKey("Coach.userId"), nullable=False)
    athleteId = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    isPrivate = Column(Boolean, default=True, nullable=False)

    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    coach = relationship("Coach", back_populates="notes")

    __table_args__ = (
        Index("idx_coachnote_coachId", "coachId"),
        Index("idx_coachnote_athleteId", "athleteId"),
    )


# ============================================
# CHAT & AI SESSIONS
# ============================================

class ChatSession(Base):
    """Chat session model."""
    __tablename__ = "ChatSession"

    id = Column(String, primary_key=True)
    athleteId = Column(String, ForeignKey("Athlete.userId"), nullable=False)

    summary = Column(Text, nullable=True)
    topic = Column(String, nullable=True)
    sentiment = Column(String, nullable=True)

    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    athlete = relationship("Athlete", back_populates="sessions")
    messages = relationship("Message", back_populates="session", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_chatsession_athleteId", "athleteId"),
        Index("idx_chatsession_createdAt", "createdAt"),
    )


class Message(Base):
    """Message model."""
    __tablename__ = "Message"

    id = Column(String, primary_key=True)
    sessionId = Column(String, ForeignKey("ChatSession.id", ondelete="CASCADE"), nullable=False)
    role = Column(SQLEnum(MessageRole), nullable=False)
    content = Column(Text, nullable=False)
    embedding = Column(JSON, nullable=True)

    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    session = relationship("ChatSession", back_populates="messages")

    __table_args__ = (
        Index("idx_message_sessionId", "sessionId"),
        Index("idx_message_createdAt", "createdAt"),
    )


# ============================================
# MENTAL PERFORMANCE TRACKING
# ============================================

class MoodLog(Base):
    """Mood log model."""
    __tablename__ = "MoodLog"

    id = Column(String, primary_key=True)
    athleteId = Column(String, ForeignKey("Athlete.userId"), nullable=False)

    mood = Column(Integer, nullable=False)
    confidence = Column(Integer, nullable=False)
    stress = Column(Integer, nullable=False)
    energy = Column(Integer, nullable=True)
    sleep = Column(Integer, nullable=True)

    notes = Column(Text, nullable=True)
    tags = Column(ARRAY(String), nullable=False, default=[])

    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    athlete = relationship("Athlete", back_populates="moodLogs")

    __table_args__ = (
        Index("idx_moodlog_athleteId", "athleteId"),
        Index("idx_moodlog_createdAt", "createdAt"),
    )


class Goal(Base):
    """Goal model."""
    __tablename__ = "Goal"

    id = Column(String, primary_key=True)
    athleteId = Column(String, ForeignKey("Athlete.userId"), nullable=False)

    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(SQLEnum(GoalCategory), nullable=False)
    status = Column(SQLEnum(GoalStatus), default=GoalStatus.IN_PROGRESS, nullable=False)

    targetDate = Column(DateTime, nullable=True)
    completedAt = Column(DateTime, nullable=True)

    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    athlete = relationship("Athlete", back_populates="goals")

    __table_args__ = (
        Index("idx_goal_athleteId", "athleteId"),
        Index("idx_goal_status", "status"),
    )


# ============================================
# KNOWLEDGE BASE
# ============================================

class KnowledgeBase(Base):
    """Knowledge base model."""
    __tablename__ = "KnowledgeBase"

    id = Column(String, primary_key=True)

    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    source = Column(String, nullable=False)
    sourceUrl = Column(String, nullable=True)

    embedding = Column(JSON, nullable=True)

    category = Column(SQLEnum(KnowledgeCategory), nullable=False)
    tags = Column(ARRAY(String), nullable=False, default=[])

    isActive = Column(Boolean, default=True, nullable=False)

    createdAt = Column(DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_knowledgebase_category", "category"),
        Index("idx_knowledgebase_isActive", "isActive"),
    )


# ============================================
# NEXTAUTH MODELS
# ============================================

class Account(Base):
    """NextAuth account model."""
    __tablename__ = "Account"

    id = Column(String, primary_key=True)
    userId = Column(String, ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=False)
    provider = Column(String, nullable=False)
    providerAccountId = Column(String, nullable=False)
    refresh_token = Column(Text, nullable=True)
    access_token = Column(Text, nullable=True)
    expires_at = Column(Integer, nullable=True)
    token_type = Column(String, nullable=True)
    scope = Column(String, nullable=True)
    id_token = Column(Text, nullable=True)
    session_state = Column(String, nullable=True)

    # Relationships
    user = relationship("User", back_populates="accounts")

    __table_args__ = (
        Index("idx_account_userId", "userId"),
    )


class Session(Base):
    """NextAuth session model."""
    __tablename__ = "Session"

    id = Column(String, primary_key=True)
    sessionToken = Column(String, unique=True, nullable=False)
    userId = Column(String, ForeignKey("User.id", ondelete="CASCADE"), nullable=False)
    expires = Column(DateTime, nullable=False)

    # Relationships
    user = relationship("User", back_populates="sessions")

    __table_args__ = (
        Index("idx_session_userId", "userId"),
    )


class VerificationToken(Base):
    """NextAuth verification token model."""
    __tablename__ = "VerificationToken"

    identifier = Column(String, primary_key=True)
    token = Column(String, unique=True, nullable=False)
    expires = Column(DateTime, nullable=False)
