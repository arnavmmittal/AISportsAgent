"""
GovernanceAgent - Crisis detection and safety monitoring.

Monitors conversations and mood data for crisis indicators
and triggers appropriate escalation protocols.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
import re

from openai import OpenAI
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.logging import setup_logging
from app.db import models

logger = setup_logging()


class GovernanceAgent:
    """
    AI agent for crisis detection and safety monitoring.

    Monitors for:
    - Self-harm indicators
    - Suicidal ideation
    - Severe depression or anxiety
    - Substance abuse mentions
    - Eating disorder signs

    Triggers escalation when concerning content is detected.
    """

    # Crisis keywords (case-insensitive)
    CRISIS_KEYWORDS = [
        # Self-harm and suicide
        "kill myself", "end my life", "suicide", "suicidal", "want to die",
        "better off dead", "self-harm", "cut myself", "hurt myself",

        # Severe distress
        "can't go on", "no point in living", "worthless", "hopeless",
        "everything would be better without me",

        # Eating disorders
        "starving myself", "purging", "binge", "not eating",

        # Substance abuse (severe)
        "drinking every day", "can't stop drinking", "overdose"
    ]

    # Moderate concern keywords
    CONCERN_KEYWORDS = [
        "depressed", "anxiety", "panic attack", "can't sleep",
        "losing weight", "no appetite", "drinking too much",
        "feel alone", "nobody cares", "giving up"
    ]

    CRISIS_DETECTION_PROMPT = """You are a crisis detection system for a sports psychology platform.

Analyze the following message from a college athlete and determine if it contains indicators of:
1. Self-harm or suicidal ideation (CRITICAL)
2. Severe depression or anxiety requiring professional help (HIGH)
3. Substance abuse concerns (HIGH)
4. Eating disorder signs (HIGH)
5. Moderate mental health concerns (MEDIUM)

Respond with JSON:
{
  "risk_level": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "categories": ["self-harm", "depression", "substance", "eating_disorder", "anxiety"],
  "reasoning": "Brief explanation of why this level was assigned",
  "recommended_action": "What should be done"
}

Message to analyze: """

    def __init__(self, db: Session):
        """
        Initialize the GovernanceAgent.

        Args:
            db: Database session
        """
        logger.info("Initializing GovernanceAgent")
        self.db = db
        self.openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
        logger.info("GovernanceAgent initialized")

    def _keyword_scan(self, text: str) -> Dict[str, Any]:
        """
        Quick keyword-based scan for crisis indicators.

        Args:
            text: Text to scan

        Returns:
            Dictionary with scan results
        """
        text_lower = text.lower()

        crisis_matches = [kw for kw in self.CRISIS_KEYWORDS if kw in text_lower]
        concern_matches = [kw for kw in self.CONCERN_KEYWORDS if kw in text_lower]

        if crisis_matches:
            return {
                "flagged": True,
                "level": "CRITICAL",
                "matched_keywords": crisis_matches
            }
        elif concern_matches:
            return {
                "flagged": True,
                "level": "MEDIUM",
                "matched_keywords": concern_matches
            }
        else:
            return {
                "flagged": False,
                "level": "LOW",
                "matched_keywords": []
            }

    def _ai_analysis(self, text: str) -> Dict[str, Any]:
        """
        Deep AI analysis of message content.

        Args:
            text: Text to analyze

        Returns:
            Analysis results from OpenAI
        """
        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-4",  # Use GPT-4 for more accurate crisis detection
                messages=[
                    {"role": "system", "content": self.CRISIS_DETECTION_PROMPT},
                    {"role": "user", "content": text}
                ],
                temperature=0.0,  # Deterministic for safety
                max_tokens=300,
                response_format={"type": "json_object"}
            )

            import json
            result = json.loads(response.choices[0].message.content)
            return result

        except Exception as e:
            logger.error(f"Error in AI crisis analysis: {e}")
            return {
                "risk_level": "UNKNOWN",
                "categories": [],
                "reasoning": "Analysis failed",
                "recommended_action": "Manual review recommended"
            }

    def analyze_message(
        self,
        message: str,
        athlete_id: str,
        session_id: str
    ) -> Dict[str, Any]:
        """
        Analyze a message for crisis indicators.

        Args:
            message: Message text to analyze
            athlete_id: Athlete user ID
            session_id: Chat session ID

        Returns:
            Analysis result with risk level and recommended actions
        """
        logger.info(f"Analyzing message for crisis indicators (athlete: {athlete_id})")

        # Quick keyword scan first
        keyword_result = self._keyword_scan(message)

        # If keywords flagged, do deep AI analysis
        if keyword_result["flagged"] and keyword_result["level"] == "CRITICAL":
            ai_result = self._ai_analysis(message)

            analysis = {
                "athlete_id": athlete_id,
                "session_id": session_id,
                "timestamp": datetime.utcnow().isoformat(),
                "keyword_scan": keyword_result,
                "ai_analysis": ai_result,
                "final_risk_level": ai_result.get("risk_level", "UNKNOWN")
            }

            # Log crisis event
            if ai_result.get("risk_level") in ["CRITICAL", "HIGH"]:
                logger.critical(f"CRISIS DETECTED: Athlete {athlete_id}, Risk: {ai_result.get('risk_level')}")
                self._trigger_escalation(analysis)

            return analysis

        elif keyword_result["flagged"]:
            # Medium concern - log but don't escalate
            analysis = {
                "athlete_id": athlete_id,
                "session_id": session_id,
                "timestamp": datetime.utcnow().isoformat(),
                "keyword_scan": keyword_result,
                "final_risk_level": "MEDIUM"
            }
            logger.warning(f"Medium concern detected: Athlete {athlete_id}")
            return analysis

        else:
            # No concerns
            return {
                "athlete_id": athlete_id,
                "session_id": session_id,
                "timestamp": datetime.utcnow().isoformat(),
                "final_risk_level": "LOW"
            }

    def _trigger_escalation(self, analysis: Dict[str, Any]) -> None:
        """
        Trigger escalation protocol for crisis situations.

        Args:
            analysis: Crisis analysis results
        """
        logger.critical(f"Triggering escalation protocol for athlete {analysis['athlete_id']}")

        # In production, this would:
        # 1. Send email to crisis team
        # 2. Send webhook notification
        # 3. Flag the session in database
        # 4. Potentially notify coach/athletic director

        # For now, just log
        logger.critical(f"ESCALATION: {analysis}")

        # TODO: Implement actual escalation
        # - Email to settings.CRISIS_ALERT_EMAIL
        # - POST to settings.CRISIS_ALERT_WEBHOOK
        # - Create alert record in database

    def check_mood_patterns(
        self,
        athlete_id: str,
        days: int = 14
    ) -> Dict[str, Any]:
        """
        Check mood log patterns for concerning trends.

        Args:
            athlete_id: Athlete user ID
            days: Number of days to analyze

        Returns:
            Pattern analysis with risk assessment
        """
        from datetime import timedelta

        logger.info(f"Checking mood patterns for athlete {athlete_id}")

        cutoff_date = datetime.utcnow() - timedelta(days=days)

        mood_logs = self.db.query(models.MoodLog).filter(
            models.MoodLog.athleteId == athlete_id,
            models.MoodLog.createdAt >= cutoff_date
        ).order_by(models.MoodLog.createdAt).all()

        if len(mood_logs) < 3:
            return {
                "athlete_id": athlete_id,
                "sufficient_data": False,
                "message": "Not enough data for pattern analysis"
            }

        # Calculate concerning patterns
        concerns = []

        # Consistently low mood (< 4 for 5+ consecutive logs)
        low_mood_streak = 0
        for log in mood_logs:
            if log.mood < 4:
                low_mood_streak += 1
            else:
                low_mood_streak = 0

            if low_mood_streak >= 5:
                concerns.append({
                    "type": "persistent_low_mood",
                    "severity": "HIGH",
                    "description": f"Mood below 4 for {low_mood_streak} consecutive logs"
                })
                break

        # Consistently high stress (> 8 for 5+ consecutive logs)
        high_stress_streak = 0
        for log in mood_logs:
            if log.stress > 8:
                high_stress_streak += 1
            else:
                high_stress_streak = 0

            if high_stress_streak >= 5:
                concerns.append({
                    "type": "persistent_high_stress",
                    "severity": "HIGH",
                    "description": f"Stress above 8 for {high_stress_streak} consecutive logs"
                })
                break

        # Declining trend (mood dropping significantly)
        if len(mood_logs) >= 7:
            first_half = mood_logs[:len(mood_logs)//2]
            second_half = mood_logs[len(mood_logs)//2:]

            first_avg = sum(log.mood for log in first_half) / len(first_half)
            second_avg = sum(log.mood for log in second_half) / len(second_half)

            if first_avg - second_avg > 3:  # Drop of more than 3 points
                concerns.append({
                    "type": "declining_mood",
                    "severity": "MEDIUM",
                    "description": f"Mood declined by {round(first_avg - second_avg, 1)} points"
                })

        # Overall risk level
        if any(c["severity"] == "HIGH" for c in concerns):
            risk_level = "HIGH"
        elif any(c["severity"] == "MEDIUM" for c in concerns):
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        analysis = {
            "athlete_id": athlete_id,
            "period_days": days,
            "logs_analyzed": len(mood_logs),
            "concerns": concerns,
            "risk_level": risk_level,
            "averages": {
                "mood": round(sum(log.mood for log in mood_logs) / len(mood_logs), 1),
                "stress": round(sum(log.stress for log in mood_logs) / len(mood_logs), 1),
                "confidence": round(sum(log.confidence for log in mood_logs) / len(mood_logs), 1)
            }
        }

        if risk_level == "HIGH":
            logger.warning(f"HIGH RISK mood pattern detected for athlete {athlete_id}")

        return analysis
