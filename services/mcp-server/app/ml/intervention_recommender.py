"""
Intervention Recommender

Evidence-based intervention recommendations using:
- Risk profile analysis
- Historical effectiveness data
- Context-aware personalization
- Multi-factor scoring
"""

import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from app.core.logging import setup_logging

logger = setup_logging()


class InterventionRecommender:
    """
    Recommend interventions based on athlete state and history.

    Uses evidence-based sports psychology interventions.
    """

    # Intervention catalog with evidence base
    INTERVENTIONS = {
        # Stress/Anxiety interventions
        "breathing_4_7_8": {
            "name": "4-7-8 Breathing",
            "type": "BREATHING",
            "duration_minutes": 5,
            "description": "Inhale for 4 seconds, hold for 7, exhale for 8",
            "targets": ["stress", "anxiety", "pre_game_nerves"],
            "evidence_level": "high",
            "best_time": "pre_competition",
        },
        "box_breathing": {
            "name": "Box Breathing",
            "type": "BREATHING",
            "duration_minutes": 5,
            "description": "4-count inhale, hold, exhale, hold",
            "targets": ["stress", "focus", "calm"],
            "evidence_level": "high",
            "best_time": "any",
        },
        "pmr": {
            "name": "Progressive Muscle Relaxation",
            "type": "RELAXATION",
            "duration_minutes": 15,
            "description": "Systematically tense and release muscle groups",
            "targets": ["tension", "stress", "sleep"],
            "evidence_level": "high",
            "best_time": "evening",
        },

        # Confidence interventions
        "visualization_success": {
            "name": "Success Visualization",
            "type": "VISUALIZATION",
            "duration_minutes": 10,
            "description": "Vividly imagine successful performance",
            "targets": ["confidence", "preparation", "focus"],
            "evidence_level": "high",
            "best_time": "pre_competition",
        },
        "strengths_recall": {
            "name": "Strengths Recall Exercise",
            "type": "COGNITIVE",
            "duration_minutes": 5,
            "description": "List and reflect on past successes",
            "targets": ["confidence", "self_efficacy"],
            "evidence_level": "moderate",
            "best_time": "morning",
        },
        "positive_self_talk": {
            "name": "Positive Self-Talk Script",
            "type": "COGNITIVE",
            "duration_minutes": 5,
            "description": "Replace negative thoughts with affirmations",
            "targets": ["confidence", "anxiety", "motivation"],
            "evidence_level": "high",
            "best_time": "any",
        },

        # Focus interventions
        "centering": {
            "name": "Centering Routine",
            "type": "FOCUS",
            "duration_minutes": 3,
            "description": "Brief focus routine before performance",
            "targets": ["focus", "present_moment", "pre_game"],
            "evidence_level": "high",
            "best_time": "pre_competition",
        },
        "mindful_awareness": {
            "name": "Mindful Awareness",
            "type": "MINDFULNESS",
            "duration_minutes": 10,
            "description": "Present-moment attention without judgment",
            "targets": ["focus", "calm", "emotional_regulation"],
            "evidence_level": "high",
            "best_time": "morning",
        },

        # Recovery interventions
        "body_scan": {
            "name": "Body Scan Meditation",
            "type": "MINDFULNESS",
            "duration_minutes": 15,
            "description": "Awareness scan through body for tension release",
            "targets": ["recovery", "tension", "sleep"],
            "evidence_level": "high",
            "best_time": "evening",
        },
        "gratitude_journal": {
            "name": "Gratitude Journaling",
            "type": "JOURNALING",
            "duration_minutes": 10,
            "description": "Write 3-5 things grateful for in sport/life",
            "targets": ["mood", "perspective", "motivation"],
            "evidence_level": "moderate",
            "best_time": "evening",
        },

        # Performance interventions
        "goal_setting": {
            "name": "SMART Goal Setting",
            "type": "PLANNING",
            "duration_minutes": 15,
            "description": "Set specific, measurable, achievable goals",
            "targets": ["motivation", "direction", "confidence"],
            "evidence_level": "high",
            "best_time": "weekly",
        },
        "pre_performance_routine": {
            "name": "Pre-Performance Routine",
            "type": "ROUTINE",
            "duration_minutes": 10,
            "description": "Consistent routine before competition",
            "targets": ["consistency", "confidence", "focus"],
            "evidence_level": "high",
            "best_time": "pre_competition",
        },
    }

    # Context definitions
    CONTEXTS = {
        "PRE_GAME": ["breathing_4_7_8", "visualization_success", "centering", "positive_self_talk"],
        "POST_GAME": ["body_scan", "gratitude_journal", "pmr"],
        "MORNING": ["mindful_awareness", "strengths_recall", "goal_setting"],
        "EVENING": ["pmr", "body_scan", "gratitude_journal"],
        "HIGH_STRESS": ["breathing_4_7_8", "box_breathing", "pmr", "mindful_awareness"],
        "LOW_CONFIDENCE": ["visualization_success", "strengths_recall", "positive_self_talk"],
        "POOR_SLEEP": ["pmr", "body_scan", "breathing_4_7_8"],
        "LOW_ENERGY": ["centering", "positive_self_talk", "strengths_recall"],
        "SLUMP": ["goal_setting", "strengths_recall", "visualization_success", "positive_self_talk"],
    }

    def __init__(self):
        """Initialize recommender."""
        pass

    def recommend(
        self,
        risk_factors: List[Dict[str, Any]],
        context: Optional[str] = None,
        past_interventions: Optional[List[Dict[str, Any]]] = None,
        athlete_preferences: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Recommend interventions based on risk factors and context.

        Args:
            risk_factors: List of identified risk factors
            context: Current context (PRE_GAME, POST_GAME, etc.)
            past_interventions: Historical intervention data with outcomes
            athlete_preferences: Athlete's preferred intervention types

        Returns:
            Dictionary with ranked recommendations
        """
        # Identify target areas from risk factors
        target_areas = self._identify_targets(risk_factors)

        # Get candidate interventions
        candidates = self._get_candidates(target_areas, context)

        # Score and rank candidates
        scored_candidates = self._score_candidates(
            candidates,
            target_areas,
            context,
            past_interventions,
            athlete_preferences,
        )

        # Sort by score
        scored_candidates.sort(key=lambda x: x["score"], reverse=True)

        # Get top recommendations
        top_recommendations = scored_candidates[:5]

        # Generate protocol for top recommendation
        protocol = None
        if top_recommendations:
            protocol = self._generate_protocol(top_recommendations[0]["intervention_id"])

        return {
            "recommendations": top_recommendations,
            "primary_protocol": protocol,
            "target_areas": target_areas,
            "context": context,
            "total_candidates": len(candidates),
        }

    def _identify_targets(
        self,
        risk_factors: List[Dict[str, Any]],
    ) -> List[str]:
        """Identify target areas from risk factors."""
        targets = set()

        # Map risk factor patterns to target areas
        pattern_targets = {
            "stress": ["stress", "calm"],
            "confidence": ["confidence", "self_efficacy"],
            "mood": ["mood", "motivation"],
            "sleep": ["sleep", "recovery"],
            "energy": ["recovery", "motivation"],
            "anxiety": ["anxiety", "calm"],
            "hrv": ["recovery", "stress"],
        }

        for factor in risk_factors:
            pattern = factor.get("pattern", "").lower()
            for key, target_list in pattern_targets.items():
                if key in pattern:
                    targets.update(target_list)

        return list(targets) if targets else ["stress", "confidence"]

    def _get_candidates(
        self,
        target_areas: List[str],
        context: Optional[str],
    ) -> List[str]:
        """Get candidate intervention IDs."""
        candidates = set()

        # Add interventions targeting identified areas
        for int_id, intervention in self.INTERVENTIONS.items():
            intervention_targets = set(intervention.get("targets", []))
            if intervention_targets.intersection(target_areas):
                candidates.add(int_id)

        # Add context-specific interventions
        if context and context in self.CONTEXTS:
            candidates.update(self.CONTEXTS[context])

        return list(candidates)

    def _score_candidates(
        self,
        candidates: List[str],
        target_areas: List[str],
        context: Optional[str],
        past_interventions: Optional[List[Dict[str, Any]]],
        preferences: Optional[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """Score and rank candidate interventions."""
        scored = []

        # Calculate effectiveness from history
        effectiveness_scores = self._calculate_effectiveness(past_interventions)

        for int_id in candidates:
            intervention = self.INTERVENTIONS.get(int_id)
            if not intervention:
                continue

            score = 0.0

            # Target match score (0-30 points)
            intervention_targets = set(intervention.get("targets", []))
            target_overlap = len(intervention_targets.intersection(target_areas))
            score += target_overlap * 10

            # Evidence level score (0-20 points)
            evidence_scores = {"high": 20, "moderate": 15, "low": 10}
            score += evidence_scores.get(intervention.get("evidence_level", "low"), 10)

            # Context appropriateness (0-15 points)
            if context:
                if context in self.CONTEXTS and int_id in self.CONTEXTS[context]:
                    score += 15
                elif intervention.get("best_time") == "any":
                    score += 10

            # Historical effectiveness (0-25 points)
            if int_id in effectiveness_scores:
                score += effectiveness_scores[int_id] * 25

            # Preference bonus (0-10 points)
            if preferences:
                preferred_types = preferences.get("preferred_types", [])
                if intervention.get("type") in preferred_types:
                    score += 10

            # Normalize to 0-100
            score = min(100, score)

            scored.append({
                "intervention_id": int_id,
                "name": intervention["name"],
                "type": intervention["type"],
                "description": intervention["description"],
                "duration_minutes": intervention["duration_minutes"],
                "score": round(score, 1),
                "targets": intervention["targets"],
                "evidence_level": intervention["evidence_level"],
            })

        return scored

    def _calculate_effectiveness(
        self,
        past_interventions: Optional[List[Dict[str, Any]]],
    ) -> Dict[str, float]:
        """Calculate effectiveness scores from historical data."""
        if not past_interventions:
            return {}

        # Group by intervention type
        outcomes_by_type = {}
        for intervention in past_interventions:
            int_type = intervention.get("type", "").upper()
            rating = intervention.get("athlete_rating") or intervention.get("athleteRating")

            if int_type and rating is not None:
                if int_type not in outcomes_by_type:
                    outcomes_by_type[int_type] = []
                outcomes_by_type[int_type].append(float(rating))

        # Calculate average effectiveness
        effectiveness = {}
        for int_id, intervention in self.INTERVENTIONS.items():
            int_type = intervention["type"]
            if int_type in outcomes_by_type:
                ratings = outcomes_by_type[int_type]
                # Normalize to 0-1 (assuming 10-point scale)
                effectiveness[int_id] = np.mean(ratings) / 10.0

        return effectiveness

    def _generate_protocol(self, intervention_id: str) -> Dict[str, Any]:
        """Generate detailed protocol for an intervention."""
        intervention = self.INTERVENTIONS.get(intervention_id)
        if not intervention:
            return {}

        # Protocol templates
        protocols = {
            "breathing_4_7_8": {
                "steps": [
                    "Find a comfortable seated position",
                    "Close your eyes and relax your shoulders",
                    "Inhale quietly through nose for 4 seconds",
                    "Hold breath for 7 seconds",
                    "Exhale completely through mouth for 8 seconds",
                    "Repeat for 4-6 cycles",
                ],
                "tips": [
                    "Best done before high-pressure moments",
                    "Can be done anywhere discreetly",
                    "Focus on making the exhale longer than inhale",
                ],
            },
            "box_breathing": {
                "steps": [
                    "Sit comfortably with back straight",
                    "Inhale for 4 counts",
                    "Hold for 4 counts",
                    "Exhale for 4 counts",
                    "Hold for 4 counts",
                    "Repeat for 4-5 minutes",
                ],
                "tips": [
                    "Visualize tracing a square as you breathe",
                    "Used by Navy SEALs for focus",
                    "Great for pre-game or between plays",
                ],
            },
            "visualization_success": {
                "steps": [
                    "Find a quiet space and close your eyes",
                    "Take 3 deep breaths to center yourself",
                    "Visualize your upcoming performance in vivid detail",
                    "See yourself executing skills perfectly",
                    "Feel the emotions of success",
                    "Hear the sounds of the environment",
                    "End with 3 deep breaths",
                ],
                "tips": [
                    "Use all senses in your visualization",
                    "Practice the same visualization consistently",
                    "Best done 15-30 minutes before competition",
                ],
            },
            "pmr": {
                "steps": [
                    "Lie down in a comfortable position",
                    "Start with your feet - tense muscles for 5 seconds",
                    "Release and notice the relaxation for 10 seconds",
                    "Move to calves, thighs, glutes",
                    "Continue to core, arms, shoulders, face",
                    "End with full body relaxation",
                ],
                "tips": [
                    "Great for recovery after training",
                    "Can help with sleep when done before bed",
                    "Focus on the contrast between tension and relaxation",
                ],
            },
            "mindful_awareness": {
                "steps": [
                    "Sit comfortably and close your eyes",
                    "Focus on your breath without changing it",
                    "Notice sensations in your body",
                    "When mind wanders, gently return to breath",
                    "Observe thoughts without judgment",
                    "Continue for 10-15 minutes",
                ],
                "tips": [
                    "It's normal for mind to wander",
                    "Consistency matters more than duration",
                    "Try a guided meditation app to start",
                ],
            },
        }

        protocol = protocols.get(intervention_id, {
            "steps": ["Follow the intervention description"],
            "tips": ["Adapt to your personal preference"],
        })

        return {
            "intervention_id": intervention_id,
            "name": intervention["name"],
            "type": intervention["type"],
            "duration_minutes": intervention["duration_minutes"],
            "steps": protocol["steps"],
            "tips": protocol["tips"],
        }


# Convenience functions
def recommend_interventions(
    risk_factors: List[Dict[str, Any]],
    context: Optional[str] = None,
    past_interventions: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Get intervention recommendations.

    Convenience wrapper around InterventionRecommender.
    """
    recommender = InterventionRecommender()
    return recommender.recommend(risk_factors, context, past_interventions)


def get_intervention_priority(
    mood_value: float,
    stress_value: float,
    confidence_value: float,
) -> str:
    """
    Determine intervention priority based on current state.

    Returns: "low", "medium", "high", or "urgent"
    """
    # Calculate composite score (lower = worse)
    composite = (mood_value + confidence_value + (10 - stress_value)) / 3

    if composite < 3:
        return "urgent"
    elif composite < 4.5:
        return "high"
    elif composite < 6:
        return "medium"
    else:
        return "low"
