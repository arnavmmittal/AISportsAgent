"""
Protocol Phase State Machine for Elite Sports Psychology System.

Manages automatic phase transitions and protocol flow enforcement.
"""

from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime

from app.core.structured_response import StructuredResponse, SessionStage


# ============================================
# PHASE TRANSITION LOGIC
# ============================================

class ProtocolPhaseManager:
    """
    Manages protocol phase transitions and enforcement.

    Implements 6-phase Discovery-First protocol:
    1. CHECK_IN: Rapid triage (2-3 turns)
    2. CLARIFY: Deep dive (1-2 turns)
    3. FORMULATION: Select intervention (1 turn)
    4. INTERVENTION: Practice technique (1-2 turns)
    5. PLAN: Create action plan (1 turn)
    6. WRAP_UP: Set homework (1 turn)
    """

    PHASE_ORDER = [
        SessionStage.CHECK_IN,
        SessionStage.CLARIFY,
        SessionStage.FORMULATION,
        SessionStage.INTERVENTION,
        SessionStage.PLAN,
        SessionStage.WRAP_UP
    ]

    # Minimum turns required before advancing
    MIN_TURNS = {
        SessionStage.CHECK_IN: 2,      # Need at least 2 turns to understand situation
        SessionStage.CLARIFY: 1,       # At least 1 turn to dig deeper
        SessionStage.FORMULATION: 1,   # 1 turn to select intervention
        SessionStage.INTERVENTION: 1,  # 1 turn to practice
        SessionStage.PLAN: 1,          # 1 turn to create plan
        SessionStage.WRAP_UP: 1        # 1 turn to wrap up
    }

    def __init__(self):
        """Initialize the protocol phase manager."""
        pass

    def determine_next_phase(
        self,
        current_phase: SessionStage,
        turn_count_in_phase: int,
        structured_response: StructuredResponse,
        athlete_readiness: str = "unknown"
    ) -> SessionStage:
        """
        Determine the next protocol phase based on conversation state.

        Args:
            current_phase: Current protocol phase
            turn_count_in_phase: Number of turns in current phase
            structured_response: Latest AI response with metadata
            athlete_readiness: Athlete readiness indicator

        Returns:
            Next phase to transition to
        """
        # If in final phase, stay there
        if current_phase == SessionStage.WRAP_UP:
            return SessionStage.WRAP_UP

        # Check if minimum turns met
        min_turns = self.MIN_TURNS.get(current_phase, 1)
        if turn_count_in_phase < min_turns:
            return current_phase  # Stay in current phase

        # Phase-specific transition logic
        if current_phase == SessionStage.CHECK_IN:
            return self._transition_from_check_in(
                turn_count_in_phase,
                structured_response
            )

        elif current_phase == SessionStage.CLARIFY:
            return self._transition_from_clarify(
                turn_count_in_phase,
                structured_response
            )

        elif current_phase == SessionStage.FORMULATION:
            return self._transition_from_formulation(
                structured_response
            )

        elif current_phase == SessionStage.INTERVENTION:
            return self._transition_from_intervention(
                turn_count_in_phase,
                structured_response
            )

        elif current_phase == SessionStage.PLAN:
            return self._transition_from_plan(
                structured_response
            )

        # Default: advance to next phase
        return self._get_next_phase_in_sequence(current_phase)

    def _transition_from_check_in(
        self,
        turn_count: int,
        response: StructuredResponse
    ) -> SessionStage:
        """
        Transition logic from CHECK_IN phase.

        Advance to CLARIFY when:
        - At least 2 turns completed
        - Issues have been detected
        - Initial hypotheses formed
        """
        # Need at least 2 turns
        if turn_count < 2:
            return SessionStage.CHECK_IN

        # Check if we have enough info to move forward
        has_issues = len(response.detected_issue_tags) > 0
        has_hypotheses = len(response.key_hypotheses) > 0
        has_sport_context = response.sport_context.setting != "unknown"

        if has_issues and has_hypotheses and has_sport_context:
            return SessionStage.CLARIFY

        # If we've done 3+ turns and still no clarity, force advance
        if turn_count >= 3:
            return SessionStage.CLARIFY

        return SessionStage.CHECK_IN

    def _transition_from_clarify(
        self,
        turn_count: int,
        response: StructuredResponse
    ) -> SessionStage:
        """
        Transition logic from CLARIFY phase.

        Advance to FORMULATION when:
        - At least 1 turn completed
        - Hypotheses are refined
        - Ready to select intervention
        """
        # Need at least 1 turn
        if turn_count < 1:
            return SessionStage.CLARIFY

        # Check if hypotheses are refined enough
        has_refined_hypotheses = len(response.key_hypotheses) >= 2
        has_sport_specifics = response.sport_context.recent_event is not None

        if has_refined_hypotheses or has_sport_specifics:
            return SessionStage.FORMULATION

        # If we've done 2+ turns, force advance
        if turn_count >= 2:
            return SessionStage.FORMULATION

        return SessionStage.CLARIFY

    def _transition_from_formulation(
        self,
        response: StructuredResponse
    ) -> SessionStage:
        """
        Transition logic from FORMULATION phase.

        Advance to INTERVENTION when:
        - Protocol has been selected
        - Rationale provided
        """
        # Check if protocol selected
        if response.selected_protocol is not None:
            return SessionStage.INTERVENTION

        # Stay in formulation if no protocol selected yet
        return SessionStage.FORMULATION

    def _transition_from_intervention(
        self,
        turn_count: int,
        response: StructuredResponse
    ) -> SessionStage:
        """
        Transition logic from INTERVENTION phase.

        Advance to PLAN when:
        - Exercise has been practiced
        - At least 1 turn completed
        """
        # Need at least 1 turn
        if turn_count < 1:
            return SessionStage.INTERVENTION

        # Check if exercise was provided (indicates practice occurred)
        has_exercise = response.in_chat_exercise is not None

        if has_exercise:
            return SessionStage.PLAN

        # If we've done 2+ turns without exercise, still advance
        # (maybe they practiced verbally without structured exercise)
        if turn_count >= 2:
            return SessionStage.PLAN

        return SessionStage.INTERVENTION

    def _transition_from_plan(
        self,
        response: StructuredResponse
    ) -> SessionStage:
        """
        Transition logic from PLAN phase.

        Advance to WRAP_UP when:
        - Action plan has been created
        - Tracking metrics defined
        """
        # Check if action plan created
        has_action_plan = (
            len(response.action_plan.today) > 0 or
            len(response.action_plan.this_week) > 0 or
            len(response.action_plan.next_competition) > 0
        )

        has_tracking = len(response.tracking.metrics) > 0

        if has_action_plan or has_tracking:
            return SessionStage.WRAP_UP

        # Stay in plan if no plan created yet
        return SessionStage.PLAN

    def _get_next_phase_in_sequence(
        self,
        current_phase: SessionStage
    ) -> SessionStage:
        """
        Get the next phase in the standard sequence.

        Args:
            current_phase: Current phase

        Returns:
            Next phase in sequence, or current if at end
        """
        try:
            current_idx = self.PHASE_ORDER.index(current_phase)
            if current_idx < len(self.PHASE_ORDER) - 1:
                return self.PHASE_ORDER[current_idx + 1]
        except ValueError:
            pass

        return current_phase

    def should_reset_phase(
        self,
        current_phase: SessionStage,
        new_user_message: str,
        time_since_last_message: Optional[int] = None
    ) -> bool:
        """
        Determine if phase should be reset to CHECK_IN.

        Reset conditions:
        - New issue introduced mid-protocol
        - Long time gap (>24 hours) since last message
        - User explicitly starts new topic

        Args:
            current_phase: Current protocol phase
            new_user_message: User's latest message
            time_since_last_message: Hours since last message

        Returns:
            True if phase should reset to CHECK_IN
        """
        # Reset if long time gap (new session essentially)
        if time_since_last_message and time_since_last_message > 24:
            return True

        # Reset if user explicitly signals new topic
        reset_signals = [
            "new issue",
            "different problem",
            "something else",
            "change topics",
            "actually",
            "forget that"
        ]

        message_lower = new_user_message.lower()
        for signal in reset_signals:
            if signal in message_lower:
                return True

        return False

    def get_phase_description(self, phase: SessionStage) -> str:
        """
        Get human-readable description of phase.

        Args:
            phase: Protocol phase

        Returns:
            Short description for UI
        """
        descriptions = {
            SessionStage.CHECK_IN: "Understanding your situation",
            SessionStage.CLARIFY: "Exploring the details",
            SessionStage.FORMULATION: "Selecting the right approach",
            SessionStage.INTERVENTION: "Practicing the technique",
            SessionStage.PLAN: "Creating your action plan",
            SessionStage.WRAP_UP: "Setting you up for success"
        }
        return descriptions.get(phase, "Working with you")


# ============================================
# INTERVENTION SELECTION
# ============================================

class InterventionSelector:
    """
    Maps athlete issues to evidence-based mental skills interventions.
    """

    # Issue → Primary intervention mapping
    INTERVENTION_MAP = {
        # Anxiety/Arousal issues
        "pre_game_anxiety": "arousal_regulation",
        "performance_anxiety": "arousal_regulation",
        "over_arousal": "arousal_regulation",
        "panic": "arousal_regulation",
        "nervousness": "arousal_regulation",

        # Confidence issues
        "low_confidence": "confidence_building",
        "self_doubt": "confidence_building",
        "imposter_syndrome": "confidence_building",
        "fear_of_failure": "confidence_building",

        # Focus/Attention issues
        "distraction": "attentional_control",
        "focus_drift": "attentional_control",
        "mind_wandering": "attentional_control",
        "overthinking": "attentional_control",

        # Negative self-talk
        "negative_self_talk": "self_talk",
        "self_criticism": "self_talk",
        "catastrophizing": "self_talk",

        # Recovery/mistakes
        "dwelling_on_mistakes": "recovery_mindset",
        "cant_let_go": "recovery_mindset",
        "rumination": "recovery_mindset",

        # Motivation
        "burnout": "motivation",
        "lost_passion": "motivation",
        "lack_of_drive": "motivation",

        # Consistency/routines
        "inconsistent_performance": "routine_development",
        "needs_structure": "routine_development",
    }

    def select_intervention(
        self,
        detected_issues: List[str],
        sport: str,
        timeline: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Select best intervention based on detected issues.

        Args:
            detected_issues: List of detected issue tags
            sport: Athlete's sport
            timeline: Time to next competition

        Returns:
            Dictionary with intervention recommendation
        """
        if not detected_issues:
            return {
                "framework": "general_support",
                "confidence": 5,
                "rationale": "No specific issues detected; providing general support"
            }

        # Normalize issue tags (lowercase, replace spaces with underscores)
        normalized_issues = [
            issue.lower().replace(" ", "_").replace("-", "_")
            for issue in detected_issues
        ]

        # Find matching intervention
        for issue in normalized_issues:
            if issue in self.INTERVENTION_MAP:
                framework = self.INTERVENTION_MAP[issue]
                return {
                    "framework": framework,
                    "confidence": 8,
                    "rationale": self._get_rationale(framework, issue, sport, timeline)
                }

        # Fallback: arousal regulation (most common)
        return {
            "framework": "arousal_regulation",
            "confidence": 6,
            "rationale": "Arousal regulation is a foundational skill for most performance issues"
        }

    def _get_rationale(
        self,
        framework: str,
        issue: str,
        sport: str,
        timeline: Optional[str]
    ) -> str:
        """Generate rationale for intervention selection."""
        rationales = {
            "arousal_regulation": f"Managing pre-performance arousal is critical in {sport}. Breathing and relaxation techniques provide quick, portable tools.",
            "confidence_building": f"Building confidence through evidence-based self-talk and accomplishment review will improve performance in {sport}.",
            "attentional_control": f"Maintaining focus under pressure is essential in {sport}. Attentional cues and present-moment awareness help.",
            "self_talk": f"Replacing negative self-talk with constructive, realistic statements improves mental resilience in {sport}.",
            "recovery_mindset": f"In {sport}, quick recovery from mistakes prevents error spirals. Mental reset protocols are key.",
            "routine_development": f"Pre-performance routines create consistency and anchor focus in {sport}.",
            "motivation": f"Reconnecting with your 'why' and setting process goals can reignite passion for {sport}.",
        }

        rationale = rationales.get(framework, "This evidence-based approach matches your needs.")

        # Add timeline urgency if applicable
        if timeline and ("tomorrow" in timeline or "today" in timeline):
            rationale += " Given the tight timeline, we'll focus on quick-win techniques."

        return rationale
