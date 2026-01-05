"""
Structured Response Models for Elite Sports Psychology System.

Pydantic models for protocol-aware AI responses with rich metadata.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum


# ============================================
# ENUMS
# ============================================

class SessionStage(str, Enum):
    """Protocol phase stages."""
    CHECK_IN = "check_in"
    CLARIFY = "clarify"
    FORMULATION = "formulation"
    INTERVENTION = "intervention"
    PLAN = "plan"
    WRAP_UP = "wrap_up"


class MentalSkillFramework(str, Enum):
    """Mental skill intervention frameworks."""
    AROUSAL_REGULATION = "arousal_regulation"
    CONFIDENCE_BUILDING = "confidence_building"
    ATTENTIONAL_CONTROL = "attentional_control"
    SELF_TALK = "self_talk"
    IMAGERY = "imagery"
    ROUTINE_DEVELOPMENT = "routine_development"
    MOTIVATION = "motivation"
    RECOVERY_MINDSET = "recovery_mindset"
    CBT = "CBT"
    ACT = "ACT"
    MINDFULNESS = "mindfulness"


# ============================================
# NESTED MODELS
# ============================================

class SportContext(BaseModel):
    """Sport context parsed from conversation."""
    sport: str = Field(..., description="Sport name (basketball, soccer, etc.)")
    position: Optional[str] = Field(None, description="Playing position")
    setting: str = Field(..., description="Context: pre-game, mid-season, practice, etc.")
    timeline: Optional[str] = Field(None, description="Time to event: 'game tomorrow', 'season in 2 weeks'")
    recent_event: Optional[str] = Field(None, description="Recent triggering event")


class SelectedProtocol(BaseModel):
    """Selected mental skills intervention."""
    name: str = Field(..., description="Protocol name: 'Box breathing', 'Pre-shot routine'")
    framework: MentalSkillFramework = Field(..., description="Underlying framework")
    why_chosen: str = Field(..., description="Rationale for selecting this protocol")
    confidence: int = Field(..., ge=1, le=10, description="Confidence this will help (1-10)")


class InChatExercise(BaseModel):
    """In-chat practice exercise (INTERVENTION phase only)."""
    name: str = Field(..., description="Exercise name")
    steps: List[str] = Field(..., description="Step-by-step instructions")
    duration_seconds: int = Field(..., description="Expected duration in seconds")
    cue_word: Optional[str] = Field(None, description="Mental cue word to remember")
    sport_context: str = Field(..., description="When to use in sport context")


class ActionPlan(BaseModel):
    """Three-timeframe action plan."""
    today: List[str] = Field(default_factory=list, description="Actions for next 24 hours")
    this_week: List[str] = Field(default_factory=list, description="Practice before next competition")
    next_competition: List[str] = Field(default_factory=list, description="Pre-game, during, post-game protocols")


class TrackingMetric(BaseModel):
    """Individual tracking metric."""
    name: str = Field(..., description="Metric name: 'Pre-game anxiety'")
    scale: str = Field(..., description="Scale description: '0-10 (0=calm, 10=panic)'")
    target: Optional[int] = Field(None, description="Target value")
    when_to_log: str = Field(..., description="When to log: '30min before game'")


class Tracking(BaseModel):
    """Tracking and accountability metrics."""
    metrics: List[TrackingMetric] = Field(default_factory=list, description="Metrics to track")
    adherence_check: str = Field(default="", description="Yes/No adherence question")
    one_word_debrief: str = Field(default="", description="One-word check-in after competition")


class PracticeDrillResponse(BaseModel):
    """Practice drill that integrates mental skill into physical training (Phase 5.1)."""
    name: str = Field(..., description="Drill name")
    mental_skill: str = Field(..., description="Mental skill being trained")
    setup: str = Field(..., description="Equipment and setup instructions")
    mental_component: str = Field(..., description="Mental skill integrated into drill")
    physical_component: str = Field(..., description="Physical actions/reps")
    progression: List[str] = Field(..., description="4-week progression plan")
    success_metrics: List[str] = Field(..., description="What to measure")
    duration_minutes: int = Field(..., description="Estimated drill duration")
    coaching_notes: str = Field(..., description="Tips for implementation")


class RoutineCueResponse(BaseModel):
    """Single cue in a pre-performance routine."""
    type: str = Field(..., description="Cue type: physical, mental, environmental, social")
    description: str = Field(..., description="What to do")
    duration_seconds: int = Field(..., description="How long this cue takes")
    why_included: Optional[str] = Field(None, description="Brief explanation of purpose")


class PrePerformanceRoutineResponse(BaseModel):
    """Pre-performance routine with timer-based cues (Phase 5.1)."""
    name: str = Field(..., description="Routine name")
    sport: str = Field(..., description="Sport")
    phase: str = Field(..., description="When routine is used: pre_game, warmup, final_prep, immediate, between_play")
    total_duration_seconds: int = Field(..., description="Total routine duration")
    cues: List[RoutineCueResponse] = Field(..., description="Sequential cues")
    customization_notes: str = Field(..., description="How athlete can personalize")
    effectiveness_tracking: List[str] = Field(..., description="What to track to measure effectiveness")


# ============================================
# MAIN STRUCTURED RESPONSE
# ============================================

class StructuredResponse(BaseModel):
    """
    Complete structured response from AI agent.

    Includes human-readable text plus rich metadata for:
    - Protocol phase tracking
    - Issue detection
    - Intervention selection
    - Action planning
    - Progress tracking
    """

    # Protocol phase
    session_stage: SessionStage = Field(
        ...,
        description="Current protocol phase"
    )

    # Detected issues
    detected_issue_tags: List[str] = Field(
        default_factory=list,
        description="Detected issues: ['pre-game anxiety', 'perfectionism', 'focus drift']"
    )

    # Sport context
    sport_context: SportContext = Field(
        ...,
        description="Sport context parsed from conversation"
    )

    # Working hypotheses
    key_hypotheses: List[str] = Field(
        default_factory=list,
        description="Working hypotheses about athlete's situation (1-3 bullets)"
    )

    # Selected intervention (null in early phases)
    selected_protocol: Optional[SelectedProtocol] = Field(
        None,
        description="Selected mental skills protocol (populated in FORMULATION phase)"
    )

    # In-chat exercise (INTERVENTION phase only)
    in_chat_exercise: Optional[InChatExercise] = Field(
        None,
        description="Practical exercise to practice right now"
    )

    # Action plan (PLAN phase)
    action_plan: ActionPlan = Field(
        default_factory=ActionPlan,
        description="Three-timeframe action plan"
    )

    # Tracking metrics
    tracking: Tracking = Field(
        default_factory=Tracking,
        description="Accountability and progress tracking"
    )

    # Next prompt suggestion
    next_prompt: str = Field(
        default="",
        description="Suggested prompt for next session"
    )

    # Knowledge base citations
    kb_citations: List[str] = Field(
        default_factory=list,
        description="KB chunk IDs used in response"
    )

    # Phase 5.1: Practice Integration
    practice_drill: Optional[PracticeDrillResponse] = Field(
        None,
        description="Practice drill integrating mental skill (PLAN phase only)"
    )

    # Phase 5.1: Routine Builder
    pre_performance_routine: Optional[PrePerformanceRoutineResponse] = Field(
        None,
        description="Pre-performance routine with timer cues (PLAN phase only)"
    )

    # Human-readable response
    human_response: str = Field(
        ...,
        description="The actual text response to stream to user"
    )

    class Config:
        """Pydantic config."""
        use_enum_values = True  # Serialize enums as strings


# ============================================
# HELPER FUNCTIONS
# ============================================

def create_default_structured_response(
    human_response: str,
    session_stage: SessionStage,
    sport: str,
    setting: str = "unknown"
) -> StructuredResponse:
    """
    Create a default structured response for early conversation turns.

    Args:
        human_response: The AI's text response
        session_stage: Current protocol phase
        sport: Athlete's sport
        setting: Context (pre-game, practice, etc.)

    Returns:
        StructuredResponse with minimal metadata
    """
    return StructuredResponse(
        session_stage=session_stage,
        detected_issue_tags=[],
        sport_context=SportContext(
            sport=sport,
            setting=setting
        ),
        key_hypotheses=[],
        human_response=human_response
    )


def validate_structured_response(response_dict: Dict[str, Any]) -> StructuredResponse:
    """
    Validate and parse a structured response from OpenAI function calling.

    Args:
        response_dict: Raw dictionary from OpenAI tool call

    Returns:
        Validated StructuredResponse object

    Raises:
        ValidationError: If response doesn't match schema
    """
    return StructuredResponse(**response_dict)
