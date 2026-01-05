"""
CoachAgent - Analytics and insights agent for coaches.

Provides team-wide mental performance insights, trend analysis,
and actionable recommendations for coaches.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_

from app.core.config import settings
from app.core.logging import setup_logging
from app.db import models

logger = setup_logging()


class CoachAgent:
    """
    AI agent for coaches to monitor team mental performance.

    Provides:
    - Aggregated team mood and stress analytics
    - Individual athlete risk detection
    - Trend analysis over time
    - Actionable recommendations
    """

    def __init__(self, db: Session):
        """
        Initialize the CoachAgent.

        Args:
            db: Database session
        """
        logger.info("Initializing CoachAgent")
        self.db = db
        logger.info("CoachAgent initialized")

    def get_team_analytics(
        self,
        coach_id: str,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Get team-wide mental performance analytics.

        Args:
            coach_id: Coach user ID
            days: Number of days to analyze

        Returns:
            Analytics dictionary with trends and insights
        """
        logger.info(f"Getting team analytics for coach {coach_id}")

        # Get coach
        coach = self.db.query(models.Coach).filter(
            models.Coach.userId == coach_id
        ).first()

        if not coach:
            logger.warning(f"Coach {coach_id} not found")
            return {"error": "Coach not found"}

        # Get all athletes in the same sport and school
        athletes = self.db.query(models.Athlete).join(
            models.User, models.Athlete.userId == models.User.id
        ).filter(
            and_(
                models.Athlete.sport == coach.sport,
                models.User.schoolId == self.db.query(models.User.schoolId).filter(
                    models.User.id == coach_id
                ).scalar_subquery()
            )
        ).all()

        athlete_ids = [a.userId for a in athletes]

        if not athlete_ids:
            return {
                "team_size": 0,
                "message": "No athletes found for this team"
            }

        # Get mood logs from last N days
        cutoff_date = datetime.utcnow() - timedelta(days=days)

        mood_logs = self.db.query(models.MoodLog).filter(
            and_(
                models.MoodLog.athleteId.in_(athlete_ids),
                models.MoodLog.createdAt >= cutoff_date
            )
        ).all()

        # Calculate aggregated metrics
        if not mood_logs:
            return {
                "team_size": len(athletes),
                "message": "No mood data available for the selected period"
            }

        total_logs = len(mood_logs)
        avg_mood = sum(log.mood for log in mood_logs) / total_logs
        avg_confidence = sum(log.confidence for log in mood_logs) / total_logs
        avg_stress = sum(log.stress for log in mood_logs) / total_logs
        avg_energy = sum(log.energy for log in mood_logs if log.energy) / len([l for l in mood_logs if l.energy]) if any(l.energy for l in mood_logs) else None
        avg_sleep = sum(log.sleep for log in mood_logs if log.sleep) / len([l for l in mood_logs if l.sleep]) if any(l.sleep for l in mood_logs) else None

        # Identify at-risk athletes (low mood, high stress)
        at_risk = []
        for athlete in athletes:
            athlete_logs = [log for log in mood_logs if log.athleteId == athlete.userId]
            if athlete_logs:
                recent_logs = sorted(athlete_logs, key=lambda x: x.createdAt, reverse=True)[:5]
                recent_avg_mood = sum(log.mood for log in recent_logs) / len(recent_logs)
                recent_avg_stress = sum(log.stress for log in recent_logs) / len(recent_logs)

                # Flag if mood < 5 or stress > 7
                if recent_avg_mood < 5 or recent_avg_stress > 7:
                    at_risk.append({
                        "athlete_id": athlete.userId,
                        "name": athlete.user.name,
                        "avg_mood": round(recent_avg_mood, 1),
                        "avg_stress": round(recent_avg_stress, 1),
                        "logs_count": len(recent_logs)
                    })

        # Calculate trends (compare first half vs second half of period)
        mid_date = cutoff_date + timedelta(days=days/2)
        first_half_logs = [log for log in mood_logs if log.createdAt < mid_date]
        second_half_logs = [log for log in mood_logs if log.createdAt >= mid_date]

        trends = {}
        if first_half_logs and second_half_logs:
            first_avg_mood = sum(log.mood for log in first_half_logs) / len(first_half_logs)
            second_avg_mood = sum(log.mood for log in second_half_logs) / len(second_half_logs)
            trends["mood_trend"] = "improving" if second_avg_mood > first_avg_mood else "declining"
            trends["mood_change"] = round(second_avg_mood - first_avg_mood, 1)

            first_avg_stress = sum(log.stress for log in first_half_logs) / len(first_half_logs)
            second_avg_stress = sum(log.stress for log in second_half_logs) / len(second_half_logs)
            trends["stress_trend"] = "decreasing" if second_avg_stress < first_avg_stress else "increasing"
            trends["stress_change"] = round(second_avg_stress - first_avg_stress, 1)

        # Get engagement metrics (chat sessions)
        chat_sessions = self.db.query(models.ChatSession).filter(
            and_(
                models.ChatSession.athleteId.in_(athlete_ids),
                models.ChatSession.createdAt >= cutoff_date
            )
        ).all()

        engaged_athletes = len(set(session.athleteId for session in chat_sessions))
        engagement_rate = round((engaged_athletes / len(athletes)) * 100, 1) if athletes else 0

        return {
            "period_days": days,
            "team_size": len(athletes),
            "total_mood_logs": total_logs,
            "averages": {
                "mood": round(avg_mood, 1),
                "confidence": round(avg_confidence, 1),
                "stress": round(avg_stress, 1),
                "energy": round(avg_energy, 1) if avg_energy else None,
                "sleep": round(avg_sleep, 1) if avg_sleep else None
            },
            "trends": trends,
            "at_risk_athletes": at_risk,
            "engagement": {
                "athletes_using_platform": engaged_athletes,
                "engagement_rate": engagement_rate,
                "total_chat_sessions": len(chat_sessions)
            },
            "sport": coach.sport
        }

    def get_athlete_summary(
        self,
        coach_id: str,
        athlete_id: str,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Get individual athlete summary for coach.

        Args:
            coach_id: Coach user ID
            athlete_id: Athlete user ID
            days: Number of days to analyze

        Returns:
            Athlete summary with trends and recent activity
        """
        logger.info(f"Getting athlete summary for coach {coach_id}, athlete {athlete_id}")

        # Verify coach has access to this athlete
        coach = self.db.query(models.Coach).filter(
            models.Coach.userId == coach_id
        ).first()

        athlete = self.db.query(models.Athlete).filter(
            models.Athlete.userId == athlete_id
        ).first()

        if not coach or not athlete:
            return {"error": "Coach or athlete not found"}

        # Check same sport
        if coach.sport != athlete.sport:
            return {"error": "Athlete not on your team"}

        # Get mood logs
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        mood_logs = self.db.query(models.MoodLog).filter(
            and_(
                models.MoodLog.athleteId == athlete_id,
                models.MoodLog.createdAt >= cutoff_date
            )
        ).order_by(models.MoodLog.createdAt.desc()).all()

        # Calculate metrics
        summary = {
            "athlete": {
                "id": athlete_id,
                "name": athlete.user.name,
                "sport": athlete.sport,
                "year": athlete.year,
                "position": athlete.teamPosition
            },
            "period_days": days,
            "mood_logs_count": len(mood_logs)
        }

        if mood_logs:
            summary["recent_averages"] = {
                "mood": round(sum(log.mood for log in mood_logs) / len(mood_logs), 1),
                "confidence": round(sum(log.confidence for log in mood_logs) / len(mood_logs), 1),
                "stress": round(sum(log.stress for log in mood_logs) / len(mood_logs), 1)
            }

            # Recent trend (last 7 days vs previous 7 days)
            last_7_days = datetime.utcnow() - timedelta(days=7)
            prev_7_days = datetime.utcnow() - timedelta(days=14)

            recent_logs = [log for log in mood_logs if log.createdAt >= last_7_days]
            previous_logs = [log for log in mood_logs if prev_7_days <= log.createdAt < last_7_days]

            if recent_logs and previous_logs:
                recent_mood = sum(log.mood for log in recent_logs) / len(recent_logs)
                prev_mood = sum(log.mood for log in previous_logs) / len(previous_logs)
                summary["trend"] = {
                    "direction": "improving" if recent_mood > prev_mood else "declining",
                    "mood_change": round(recent_mood - prev_mood, 1)
                }

        # Get chat activity
        chat_sessions = self.db.query(models.ChatSession).filter(
            and_(
                models.ChatSession.athleteId == athlete_id,
                models.ChatSession.createdAt >= cutoff_date
            )
        ).all()

        summary["engagement"] = {
            "chat_sessions": len(chat_sessions),
            "last_session": max(s.updatedAt for s in chat_sessions).isoformat() if chat_sessions else None
        }

        # Get goals
        active_goals = self.db.query(models.Goal).filter(
            and_(
                models.Goal.athleteId == athlete_id,
                models.Goal.status.in_([models.GoalStatus.IN_PROGRESS, models.GoalStatus.NOT_STARTED])
            )
        ).all()

        summary["goals"] = {
            "active_count": len(active_goals),
            "goals": [{
                "id": goal.id,
                "title": goal.title,
                "category": goal.category.value,
                "status": goal.status.value
            } for goal in active_goals]
        }

        return summary

    def get_recommendations(
        self,
        coach_id: str
    ) -> List[Dict[str, Any]]:
        """
        Get actionable recommendations for coach.

        Args:
            coach_id: Coach user ID

        Returns:
            List of recommendations based on team data
        """
        logger.info(f"Generating recommendations for coach {coach_id}")

        analytics = self.get_team_analytics(coach_id, days=30)

        if "error" in analytics or "message" in analytics:
            return []

        recommendations = []

        # High stress recommendation
        if analytics["averages"]["stress"] > 6.5:
            recommendations.append({
                "priority": "high",
                "category": "team_stress",
                "title": "Team Stress Levels Elevated",
                "description": f"Average team stress is {analytics['averages']['stress']}/10. Consider team-wide stress management session or recovery day.",
                "action": "Schedule recovery activities or mental skills workshop"
            })

        # At-risk athletes
        if analytics["at_risk_athletes"]:
            recommendations.append({
                "priority": "high",
                "category": "at_risk",
                "title": f"{len(analytics['at_risk_athletes'])} Athletes May Need Support",
                "description": f"Athletes showing low mood or high stress: {', '.join(a['name'] for a in analytics['at_risk_athletes'][:3])}",
                "action": "Check in individually with these athletes"
            })

        # Low engagement
        if analytics["engagement"]["engagement_rate"] < 40:
            recommendations.append({
                "priority": "medium",
                "category": "engagement",
                "title": "Low Platform Engagement",
                "description": f"Only {analytics['engagement']['engagement_rate']}% of team is using the mental performance platform.",
                "action": "Encourage team to log moods and use AI coach"
            })

        # Declining trend
        if analytics.get("trends", {}).get("mood_trend") == "declining":
            recommendations.append({
                "priority": "medium",
                "category": "trend",
                "title": "Team Mood Declining",
                "description": f"Team mood has decreased by {abs(analytics['trends']['mood_change'])} points over the past {analytics['period_days']} days.",
                "action": "Investigate stressors and adjust training load if needed"
            })

        return recommendations
