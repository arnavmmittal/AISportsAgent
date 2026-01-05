"""
Crisis Escalation System - Email & SMS Alerts

Handles immediate notification when crisis situations are detected.
Uses SendGrid for email and Twilio for SMS.
"""

from typing import Dict, Any, Optional, List
from datetime import datetime
import os

from app.core.config import settings
from app.core.logging import setup_logging

logger = setup_logging()


class EscalationSystem:
    """
    Crisis escalation system for sending alerts.

    Provides:
    - Email alerts via SendGrid
    - SMS alerts via Twilio
    - Fallback mechanisms if primary method fails
    - Logging and audit trail
    """

    def __init__(self):
        """Initialize escalation system with API clients."""
        logger.info("Initializing EscalationSystem")

        # SendGrid setup
        self.sendgrid_api_key = os.getenv("SENDGRID_API_KEY")
        self.sendgrid_enabled = bool(self.sendgrid_api_key)

        if self.sendgrid_enabled:
            try:
                from sendgrid import SendGridAPIClient
                self.sendgrid_client = SendGridAPIClient(self.sendgrid_api_key)
                logger.info("SendGrid client initialized")
            except ImportError:
                logger.warning("SendGrid library not installed. Email alerts disabled.")
                self.sendgrid_enabled = False
            except Exception as e:
                logger.error(f"Error initializing SendGrid: {str(e)}")
                self.sendgrid_enabled = False
        else:
            logger.warning("SENDGRID_API_KEY not set. Email alerts disabled.")

        # Twilio setup
        self.twilio_account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.twilio_auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.twilio_phone_number = os.getenv("TWILIO_PHONE_NUMBER")
        self.twilio_enabled = bool(self.twilio_account_sid and self.twilio_auth_token and self.twilio_phone_number)

        if self.twilio_enabled:
            try:
                from twilio.rest import Client
                self.twilio_client = Client(self.twilio_account_sid, self.twilio_auth_token)
                logger.info("Twilio client initialized")
            except ImportError:
                logger.warning("Twilio library not installed. SMS alerts disabled.")
                self.twilio_enabled = False
            except Exception as e:
                logger.error(f"Error initializing Twilio: {str(e)}")
                self.twilio_enabled = False
        else:
            logger.warning("Twilio credentials not set. SMS alerts disabled.")

        # Crisis contact configuration
        self.crisis_email = os.getenv("CRISIS_ALERT_EMAIL", "coach@university.edu")
        self.crisis_phone = os.getenv("CRISIS_ALERT_PHONE", "+1234567890")
        self.from_email = os.getenv("FROM_EMAIL", "alerts@aisportsagent.com")

        logger.info(f"Escalation system initialized - Email: {self.sendgrid_enabled}, SMS: {self.twilio_enabled}")

    def send_crisis_alert(
        self,
        athlete_id: str,
        athlete_name: str,
        risk_level: str,
        categories: List[str],
        message_content: str,
        reasoning: str,
        session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send crisis alert via email and SMS.

        Args:
            athlete_id: Athlete user ID
            athlete_name: Athlete's name
            risk_level: CRITICAL | HIGH | MEDIUM | LOW
            categories: List of crisis categories detected
            message_content: The message that triggered the alert
            reasoning: AI's explanation of the alert
            session_id: Optional chat session ID

        Returns:
            Dictionary with alert results
        """
        logger.info(f"Sending crisis alert for athlete {athlete_name} (risk: {risk_level})")

        results = {
            "timestamp": datetime.now().isoformat(),
            "athleteId": athlete_id,
            "athleteName": athlete_name,
            "riskLevel": risk_level,
            "emailSent": False,
            "smsSent": False,
            "errors": []
        }

        # Only send alerts for CRITICAL and HIGH risk levels
        if risk_level not in ["CRITICAL", "HIGH"]:
            logger.info(f"Risk level {risk_level} does not require escalation")
            results["message"] = "Risk level does not require escalation"
            return results

        # Send email alert
        if self.sendgrid_enabled:
            email_result = self._send_email_alert(
                athlete_name=athlete_name,
                risk_level=risk_level,
                categories=categories,
                reasoning=reasoning,
                message_content=message_content,
                session_id=session_id
            )
            results["emailSent"] = email_result["success"]
            if not email_result["success"]:
                results["errors"].append(email_result.get("error"))
        else:
            logger.warning("Email alerts disabled - skipping email notification")
            results["errors"].append("Email alerts not configured")

        # Send SMS alert
        if self.twilio_enabled:
            sms_result = self._send_sms_alert(
                athlete_name=athlete_name,
                risk_level=risk_level,
                categories=categories
            )
            results["smsSent"] = sms_result["success"]
            if not sms_result["success"]:
                results["errors"].append(sms_result.get("error"))
        else:
            logger.warning("SMS alerts disabled - skipping SMS notification")
            results["errors"].append("SMS alerts not configured")

        # Log result
        if results["emailSent"] or results["smsSent"]:
            logger.info(f"Crisis alert sent successfully (email: {results['emailSent']}, SMS: {results['smsSent']})")
        else:
            logger.error(f"Crisis alert failed to send: {results['errors']}")

        return results

    def _send_email_alert(
        self,
        athlete_name: str,
        risk_level: str,
        categories: List[str],
        reasoning: str,
        message_content: str,
        session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send email alert via SendGrid."""
        try:
            from sendgrid.helpers.mail import Mail, Email, To, Content

            # Email subject
            subject = f"🚨 CRISIS ALERT: {risk_level} Risk - {athlete_name}"

            # Email body
            html_content = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 3px solid {'#dc2626' if risk_level == 'CRITICAL' else '#f59e0b'}; border-radius: 8px;">
                    <h1 style="color: {'#dc2626' if risk_level == 'CRITICAL' else '#f59e0b'}; margin-top: 0;">
                        🚨 CRISIS ALERT
                    </h1>

                    <div style="background-color: #fee2e2; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                        <h2 style="margin-top: 0; color: #991b1b;">Risk Level: {risk_level}</h2>
                        <p><strong>Athlete:</strong> {athlete_name}</p>
                        <p><strong>Categories Detected:</strong> {", ".join(categories)}</p>
                        <p><strong>Detected At:</strong> {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</p>
                        {f'<p><strong>Session ID:</strong> {session_id}</p>' if session_id else ''}
                    </div>

                    <div style="margin-bottom: 20px;">
                        <h3>AI Analysis:</h3>
                        <p style="background-color: #f3f4f6; padding: 10px; border-radius: 5px;">{reasoning}</p>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <h3>Message Content (Excerpt):</h3>
                        <p style="background-color: #f3f4f6; padding: 10px; border-radius: 5px; font-style: italic;">
                            "{message_content[:200]}{'...' if len(message_content) > 200 else ''}"
                        </p>
                    </div>

                    <div style="background-color: #dbeafe; padding: 15px; border-radius: 5px;">
                        <h3 style="margin-top: 0;">Immediate Actions Required:</h3>
                        <ul>
                            <li>Contact athlete immediately (call, don't text)</li>
                            <li>Assess current safety and wellbeing</li>
                            <li>Connect with campus counseling services if needed</li>
                            <li>Document all interactions in coaching notes</li>
                            <li>Follow institutional crisis protocol</li>
                        </ul>
                    </div>

                    <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-radius: 5px;">
                        <h4 style="margin-top: 0;">Crisis Resources:</h4>
                        <ul style="margin-bottom: 0;">
                            <li><strong>988 Suicide & Crisis Lifeline:</strong> Call/Text 988</li>
                            <li><strong>Crisis Text Line:</strong> Text HOME to 741741</li>
                            <li><strong>Campus Counseling:</strong> [Contact campus resources]</li>
                        </ul>
                    </div>

                    <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">
                        This is an automated alert from AI Sports Agent. Please respond within 1 hour.
                    </p>
                </div>
            </body>
            </html>
            """

            # Create email
            message = Mail(
                from_email=Email(self.from_email),
                to_emails=To(self.crisis_email),
                subject=subject,
                html_content=Content("text/html", html_content)
            )

            # Send email
            response = self.sendgrid_client.send(message)

            if response.status_code in [200, 201, 202]:
                logger.info(f"Email alert sent successfully to {self.crisis_email}")
                return {"success": True, "status_code": response.status_code}
            else:
                logger.error(f"Email alert failed: {response.status_code} - {response.body}")
                return {"success": False, "error": f"SendGrid returned {response.status_code}"}

        except Exception as e:
            logger.error(f"Error sending email alert: {str(e)}")
            return {"success": False, "error": str(e)}

    def _send_sms_alert(
        self,
        athlete_name: str,
        risk_level: str,
        categories: List[str]
    ) -> Dict[str, Any]:
        """Send SMS alert via Twilio."""
        try:
            # SMS body (keep it short for SMS)
            sms_body = f"""
🚨 CRISIS ALERT: {risk_level} Risk

Athlete: {athlete_name}
Categories: {", ".join(categories)}
Time: {datetime.now().strftime("%I:%M %p")}

IMMEDIATE ACTION REQUIRED
Contact athlete immediately.
Check email for full details.

AI Sports Agent
            """.strip()

            # Send SMS
            message = self.twilio_client.messages.create(
                body=sms_body,
                from_=self.twilio_phone_number,
                to=self.crisis_phone
            )

            logger.info(f"SMS alert sent successfully to {self.crisis_phone} (SID: {message.sid})")
            return {"success": True, "sid": message.sid}

        except Exception as e:
            logger.error(f"Error sending SMS alert: {str(e)}")
            return {"success": False, "error": str(e)}

    def test_escalation(self) -> Dict[str, Any]:
        """
        Test escalation system with a mock alert.

        Returns:
            Test results
        """
        logger.info("Running escalation system test")

        test_result = self.send_crisis_alert(
            athlete_id="test-12345",
            athlete_name="Test Athlete",
            risk_level="HIGH",
            categories=["test"],
            message_content="This is a test crisis alert from the AI Sports Agent system.",
            reasoning="This is a test to verify the escalation system is working correctly.",
            session_id="test-session-123"
        )

        return {
            "testRan": True,
            "timestamp": test_result["timestamp"],
            "results": test_result,
            "status": "PASS" if (test_result["emailSent"] or test_result["smsSent"]) else "FAIL"
        }


# Singleton instance
_escalation_system = None


def get_escalation_system() -> EscalationSystem:
    """Get singleton instance of escalation system."""
    global _escalation_system
    if _escalation_system is None:
        _escalation_system = EscalationSystem()
    return _escalation_system
