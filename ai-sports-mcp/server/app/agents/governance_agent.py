"""
GovernanceAgent - Crisis detection and safety monitoring.

Monitors conversations and mood data for crisis indicators
and triggers appropriate escalation protocols.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
import re
import smtplib
import json
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from openai import OpenAI
from sqlalchemy.orm import Session
import httpx

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

        SAFETY-CRITICAL: This function handles detection of self-harm, suicide, and severe mental health crises.
        It creates a database record, sends email alerts, and POSTs to configured webhooks.

        Args:
            analysis: Crisis analysis results including athlete_id, session_id, risk_level, and AI analysis
        """
        logger.critical(f"🚨 TRIGGERING ESCALATION PROTOCOL for athlete {analysis['athlete_id']}")
        logger.critical(f"ANALYSIS: {analysis}")

        athlete_id = analysis.get('athlete_id')
        session_id = analysis.get('session_id')
        risk_level = analysis.get('final_risk_level', 'UNKNOWN')
        ai_analysis = analysis.get('ai_analysis', {})

        # 1. Create CrisisAlert database record
        try:
            import uuid
            alert = models.CrisisAlert(
                id=str(uuid.uuid4()),
                athleteId=athlete_id,
                sessionId=session_id,
                severity=models.CrisisSeverity[risk_level] if risk_level in ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] else models.CrisisSeverity.HIGH,
                detectedAt=datetime.utcnow(),
                escalated=True,
                escalatedAt=datetime.utcnow(),
                escalatedTo=getattr(settings, 'CRISIS_ALERT_EMAIL', 'team@university.edu'),
                context=analysis,  # Store full analysis for review
                reviewed=False,
                resolved=False,
                createdAt=datetime.utcnow(),
                updatedAt=datetime.utcnow()
            )
            self.db.add(alert)
            self.db.commit()
            logger.critical(f"✓ CrisisAlert record created: {alert.id}")
        except Exception as e:
            logger.error(f"❌ Failed to create CrisisAlert record: {e}", exc_info=True)
            self.db.rollback()
            # Continue with alerts even if DB fails

        # 2. Send email to crisis team
        try:
            self._send_crisis_email(analysis, alert.id if 'alert' in locals() else 'UNKNOWN')
        except Exception as e:
            logger.error(f"❌ Failed to send crisis email: {e}", exc_info=True)

        # 3. Send webhook notification (Slack/Discord/Teams)
        try:
            self._send_crisis_webhook(analysis, alert.id if 'alert' in locals() else 'UNKNOWN')
        except Exception as e:
            logger.error(f"❌ Failed to send crisis webhook: {e}", exc_info=True)

        logger.critical(f"✓ Escalation protocol completed for athlete {athlete_id}")

    def _send_crisis_email(self, analysis: Dict[str, Any], alert_id: str) -> None:
        """
        Send crisis alert email to configured recipient(s).

        Args:
            analysis: Crisis analysis results
            alert_id: Database alert ID for reference
        """
        # Check if email is configured
        if not hasattr(settings, 'CRISIS_ALERT_EMAIL') or not settings.CRISIS_ALERT_EMAIL:
            logger.warning("CRISIS_ALERT_EMAIL not configured, skipping email notification")
            return

        if not all([
            hasattr(settings, 'SMTP_HOST'),
            hasattr(settings, 'SMTP_PORT'),
            hasattr(settings, 'SMTP_USER'),
            hasattr(settings, 'SMTP_PASSWORD')
        ]):
            logger.warning("SMTP settings not configured, skipping email notification")
            return

        athlete_id = analysis.get('athlete_id', 'UNKNOWN')
        risk_level = analysis.get('final_risk_level', 'UNKNOWN')
        ai_analysis = analysis.get('ai_analysis', {})
        recommended_action = ai_analysis.get('recommended_action', 'Immediate professional intervention')

        # Create email
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"🚨 CRISIS ALERT: Athlete {athlete_id} - Risk Level: {risk_level}"
        msg['From'] = settings.SMTP_USER
        msg['To'] = settings.CRISIS_ALERT_EMAIL

        # Plain text version
        text_body = f"""
CRISIS ALERT - IMMEDIATE ACTION REQUIRED

Alert ID: {alert_id}
Athlete ID: {athlete_id}
Session ID: {analysis.get('session_id', 'UNKNOWN')}
Risk Level: {risk_level}
Timestamp: {analysis.get('timestamp', datetime.utcnow().isoformat())}

Analysis:
{ai_analysis.get('reasoning', 'See full analysis in dashboard')}

Recommended Action:
{recommended_action}

Categories Detected:
{', '.join(ai_analysis.get('categories', []))}

Dashboard: {getattr(settings, 'NEXTAUTH_URL', 'http://localhost:3000')}/coach/alerts/{alert_id}

---
This is an automated alert from AI Sports Agent Crisis Detection System
        """

        # HTML version
        html_body = f"""
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
        .alert {{ background-color: #f44336; color: white; padding: 20px; margin-bottom: 20px; }}
        .info {{ background-color: #f5f5f5; padding: 15px; margin: 10px 0; }}
        .action {{ background-color: #ff9800; color: white; padding: 15px; margin: 10px 0; }}
        .button {{ background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; display: inline-block; }}
    </style>
</head>
<body>
    <div class="alert">
        <h1>🚨 CRISIS ALERT - IMMEDIATE ACTION REQUIRED</h1>
        <p>Risk Level: <strong>{risk_level}</strong></p>
    </div>

    <div class="info">
        <h2>Alert Details</h2>
        <p><strong>Alert ID:</strong> {alert_id}</p>
        <p><strong>Athlete ID:</strong> {athlete_id}</p>
        <p><strong>Session ID:</strong> {analysis.get('session_id', 'UNKNOWN')}</p>
        <p><strong>Timestamp:</strong> {analysis.get('timestamp', datetime.utcnow().isoformat())}</p>
    </div>

    <div class="action">
        <h2>Recommended Action</h2>
        <p>{recommended_action}</p>
    </div>

    <div class="info">
        <h2>AI Analysis</h2>
        <p>{ai_analysis.get('reasoning', 'See full analysis in dashboard')}</p>
        <p><strong>Categories:</strong> {', '.join(ai_analysis.get('categories', []))}</p>
    </div>

    <p>
        <a href="{getattr(settings, 'NEXTAUTH_URL', 'http://localhost:3000')}/coach/alerts/{alert_id}" class="button">
            View Full Alert in Dashboard
        </a>
    </p>

    <hr>
    <p style="color: #666; font-size: 12px;">
        This is an automated alert from AI Sports Agent Crisis Detection System
    </p>
</body>
</html>
        """

        # Attach both versions
        part1 = MIMEText(text_body, 'plain')
        part2 = MIMEText(html_body, 'html')
        msg.attach(part1)
        msg.attach(part2)

        # Send email
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)

        logger.critical(f"✓ Crisis email sent to {settings.CRISIS_ALERT_EMAIL}")

    def _send_crisis_webhook(self, analysis: Dict[str, Any], alert_id: str) -> None:
        """
        Send crisis alert to configured webhook (Slack/Discord/Teams).

        Args:
            analysis: Crisis analysis results
            alert_id: Database alert ID for reference
        """
        # Check if webhook is configured
        if not hasattr(settings, 'CRISIS_ALERT_WEBHOOK') or not settings.CRISIS_ALERT_WEBHOOK:
            logger.warning("CRISIS_ALERT_WEBHOOK not configured, skipping webhook notification")
            return

        athlete_id = analysis.get('athlete_id', 'UNKNOWN')
        risk_level = analysis.get('final_risk_level', 'UNKNOWN')
        ai_analysis = analysis.get('ai_analysis', {})

        # Slack/Discord compatible payload
        payload = {
            "text": f"🚨 CRISIS ALERT: Athlete {athlete_id}",
            "blocks": [
                {
                    "type": "header",
                    "text": {
                        "type": "plain_text",
                        "text": f"🚨 CRISIS ALERT - Risk Level: {risk_level}"
                    }
                },
                {
                    "type": "section",
                    "fields": [
                        {"type": "mrkdwn", "text": f"*Alert ID:*\n{alert_id}"},
                        {"type": "mrkdwn", "text": f"*Athlete ID:*\n{athlete_id}"},
                        {"type": "mrkdwn", "text": f"*Session ID:*\n{analysis.get('session_id', 'UNKNOWN')}"},
                        {"type": "mrkdwn", "text": f"*Timestamp:*\n{analysis.get('timestamp', datetime.utcnow().isoformat())}"}
                    ]
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"*Analysis:*\n{ai_analysis.get('reasoning', 'See dashboard for details')}"
                    }
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"*Recommended Action:*\n{ai_analysis.get('recommended_action', 'Immediate professional intervention')}"
                    }
                },
                {
                    "type": "actions",
                    "elements": [
                        {
                            "type": "button",
                            "text": {"type": "plain_text", "text": "View in Dashboard"},
                            "url": f"{getattr(settings, 'NEXTAUTH_URL', 'http://localhost:3000')}/coach/alerts/{alert_id}",
                            "style": "danger"
                        }
                    ]
                }
            ]
        }

        # Send webhook (with timeout)
        response = httpx.post(
            settings.CRISIS_ALERT_WEBHOOK,
            json=payload,
            timeout=10.0
        )
        response.raise_for_status()

        logger.critical(f"✓ Crisis webhook sent to {settings.CRISIS_ALERT_WEBHOOK}")

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

    async def detect_crisis(
        self,
        message: str
    ) -> tuple[bool, str, Dict[str, Any]]:
        """
        Async wrapper for crisis detection (called from voice route).

        Args:
            message: User's message to analyze

        Returns:
            Tuple of (crisis_detected, severity, crisis_info)
        """
        # Quick keyword scan
        keyword_result = self._keyword_scan(message)

        crisis_detected = keyword_result["flagged"]
        severity = keyword_result["level"]

        # If critical keywords found, run AI analysis for confirmation
        if crisis_detected and severity == "CRITICAL":
            ai_result = self._ai_analysis(message)
            severity = ai_result.get("risk_level", "UNKNOWN")
            crisis_info = {
                'keywords_matched': keyword_result.get("matched_keywords", []),
                'analysis': ai_result.get("reasoning", ""),
                'categories': ai_result.get("categories", []),
                'recommended_actions': ai_result.get("recommended_action", "")
            }
        else:
            crisis_info = {
                'keywords_matched': keyword_result.get("matched_keywords", []),
                'analysis': 'Keyword-based detection',
                'categories': [],
                'recommended_actions': 'Monitor' if crisis_detected else 'None'
            }

        return crisis_detected, severity, crisis_info
