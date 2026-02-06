"""
ReadinessEngine - Pre-competition readiness scoring agent.

Calculates mental readiness scores (0-100) for athletes before competitions
based on mood, stress, sleep, wearable data, and engagement metrics.
"""

from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc

from app.core.config import settings
from app.core.logging import setup_logging
from app.db import models

logger = setup_logging()


class ReadinessEngine:
    """
    AI agent for calculating pre-competition readiness scores.

    Provides:
    - Real-time readiness scoring (0-100 scale)
    - Traffic light levels (GREEN/YELLOW/RED)
    - Contributing factor analysis
    - Historical readiness tracking
    """

    def __init__(self, db: Session):
        """
        Initialize the ReadinessEngine.

        Args:
            db: Database session
        """
        logger.info("Initializing ReadinessEngine")
        self.db = db
        logger.info("ReadinessEngine initialized")

    def calculate_readiness_score(
        self,
        athlete_id: str,
        game_date: datetime,
        save_to_db: bool = True
    ) -> Dict[str, Any]:
        """
        Calculate readiness score for an athlete before a competition.

        Args:
            athlete_id: Athlete user ID
            game_date: Date of the upcoming game
            save_to_db: Whether to save the score to database

        Returns:
            Dictionary with score, level, factors, and raw values
        """
        logger.info(f"Calculating readiness score for athlete {athlete_id}, game date: {game_date}")

        # Get athlete
        athlete = self.db.query(models.Athlete).filter(
            models.Athlete.userId == athlete_id
        ).first()

        if not athlete:
            logger.warning(f"Athlete {athlete_id} not found")
            return {"error": "Athlete not found"}

        # Calculate feature values
        features = self._extract_features(athlete_id, game_date)

        if not features:
            logger.warning(f"Insufficient data to calculate readiness for athlete {athlete_id}")
            return {
                "error": "Insufficient data",
                "message": "Need at least 3 days of mood logs to calculate readiness"
            }

        # Calculate weighted composite score
        score_data = self._calculate_composite_score(features)

        # Determine traffic light level
        level = self._determine_level(score_data['score'])

        # Identify contributing factors
        factors = self._analyze_factors(features)

        result = {
            "score": round(score_data['score'], 1),
            "level": level,
            "factors": factors[:3],  # Top 3 factors
            "gameDate": game_date.isoformat(),
            "calculatedAt": datetime.now().isoformat(),
            "rawValues": {
                "moodAvg7d": features['mood_avg_7d'],
                "stressAvg7d": features['stress_avg_7d'],
                "sleepAvg3d": features['sleep_avg_3d'],
                "hrvRecovery": features.get('hrv_recovery'),
                "daysSinceGame": features.get('days_since_last_game'),
                "chatEngagement": features.get('chat_engagement_7d')
            }
        }

        # Save to database
        if save_to_db:
            self._save_readiness_score(athlete_id, game_date, result)

        logger.info(f"Readiness score for {athlete_id}: {result['score']} ({level})")
        return result

    def get_team_readiness(
        self,
        sport: str,
        school_id: str,
        game_date: datetime
    ) -> List[Dict[str, Any]]:
        """
        Get readiness scores for all athletes on a team.

        Args:
            sport: Sport name (basketball, football, etc.)
            school_id: School ID
            game_date: Date of the upcoming game

        Returns:
            List of athlete readiness scores sorted by score (descending)
        """
        logger.info(f"Calculating team readiness for {sport} at school {school_id}")

        # Get all athletes for this sport and school
        athletes = self.db.query(models.Athlete).join(
            models.User, models.Athlete.userId == models.User.id
        ).filter(
            and_(
                models.Athlete.sport == sport,
                models.User.schoolId == school_id
            )
        ).all()

        team_readiness = []
        for athlete in athletes:
            readiness = self.calculate_readiness_score(
                athlete.userId,
                game_date,
                save_to_db=True
            )

            if 'error' not in readiness:
                team_readiness.append({
                    "athleteId": athlete.userId,
                    "athleteName": athlete.user.name,
                    "position": athlete.teamPosition,
                    "score": readiness['score'],
                    "level": readiness['level'],
                    "topFactors": readiness['factors'][:2]  # Top 2 factors
                })

        # Sort by score (descending - highest readiness first)
        team_readiness.sort(key=lambda x: x['score'], reverse=True)

        logger.info(f"Team readiness calculated for {len(team_readiness)} athletes")
        return team_readiness

    def _extract_features(
        self,
        athlete_id: str,
        game_date: datetime
    ) -> Optional[Dict[str, float]]:
        """
        Extract all features needed for readiness calculation.

        Args:
            athlete_id: Athlete user ID
            game_date: Date of upcoming game

        Returns:
            Dictionary of feature values or None if insufficient data
        """
        features = {}

        # 1. Mood metrics (7-day rolling average)
        mood_avg_7d = self._get_mood_average(athlete_id, days=7)
        if mood_avg_7d is None:
            return None  # Need at least some mood data

        features['mood_avg_7d'] = mood_avg_7d

        # 2. Stress metrics (7-day rolling average)
        stress_avg_7d = self._get_stress_average(athlete_id, days=7)
        features['stress_avg_7d'] = stress_avg_7d if stress_avg_7d is not None else 5.0  # Default neutral

        # 3. Sleep metrics (3-day rolling average)
        sleep_avg_3d = self._get_sleep_average(athlete_id, days=3)
        features['sleep_avg_3d'] = sleep_avg_3d if sleep_avg_3d is not None else 7.0  # Default 7 hours

        # 4. HRV recovery score from wearables (latest)
        hrv_recovery = self._get_latest_hrv_recovery(athlete_id)
        features['hrv_recovery'] = hrv_recovery  # None if not available

        # 5. Days since last game (freshness factor)
        days_since = self._get_days_since_last_game(athlete_id, game_date)
        features['days_since_last_game'] = days_since

        # 6. Chat engagement (past 7 days)
        chat_engagement = self._get_chat_engagement(athlete_id, days=7)
        features['chat_engagement_7d'] = chat_engagement

        return features

    def _get_mood_average(self, athlete_id: str, days: int) -> Optional[float]:
        """Get average mood over past N days."""
        cutoff_date = datetime.now() - timedelta(days=days)

        result = self.db.query(func.avg(models.MoodLog.mood)).filter(
            and_(
                models.MoodLog.athleteId == athlete_id,
                models.MoodLog.createdAt >= cutoff_date
            )
        ).scalar()

        return float(result) if result else None

    def _get_stress_average(self, athlete_id: str, days: int) -> Optional[float]:
        """Get average stress over past N days."""
        cutoff_date = datetime.now() - timedelta(days=days)

        result = self.db.query(func.avg(models.MoodLog.stress)).filter(
            and_(
                models.MoodLog.athleteId == athlete_id,
                models.MoodLog.createdAt >= cutoff_date
            )
        ).scalar()

        return float(result) if result else None

    def _get_sleep_average(self, athlete_id: str, days: int) -> Optional[float]:
        """Get average sleep hours over past N days."""
        cutoff_date = datetime.now() - timedelta(days=days)

        result = self.db.query(func.avg(models.MoodLog.sleep)).filter(
            and_(
                models.MoodLog.athleteId == athlete_id,
                models.MoodLog.createdAt >= cutoff_date,
                models.MoodLog.sleep.isnot(None)
            )
        ).scalar()

        return float(result) if result else None

    def _get_latest_hrv_recovery(self, athlete_id: str) -> Optional[float]:
        """Get latest HRV recovery score from wearable data."""
        # Check if WearableData model exists (it's new)
        if not hasattr(models, 'WearableData'):
            return None

        latest = self.db.query(models.WearableData).filter(
            and_(
                models.WearableData.athleteId == athlete_id,
                models.WearableData.metricType == 'recovery'
            )
        ).order_by(desc(models.WearableData.recordedAt)).first()

        return float(latest.value) if latest else None

    def _get_days_since_last_game(self, athlete_id: str, game_date: datetime) -> int:
        """Get days since athlete's last game."""
        # Check if PerformanceMetric model exists (it's new)
        if not hasattr(models, 'PerformanceMetric'):
            return 7  # Default to 1 week

        last_game = self.db.query(models.PerformanceMetric).filter(
            and_(
                models.PerformanceMetric.athleteId == athlete_id,
                models.PerformanceMetric.gameDate < game_date
            )
        ).order_by(desc(models.PerformanceMetric.gameDate)).first()

        if last_game:
            delta = game_date - last_game.gameDate
            return delta.days
        else:
            return 7  # Default to 1 week if no previous games

    def _get_chat_engagement(self, athlete_id: str, days: int) -> int:
        """Get number of chat sessions in past N days."""
        cutoff_date = datetime.now() - timedelta(days=days)

        count = self.db.query(func.count(models.ChatSession.id)).filter(
            and_(
                models.ChatSession.athleteId == athlete_id,
                models.ChatSession.createdAt >= cutoff_date
            )
        ).scalar()

        return int(count) if count else 0

    def _calculate_composite_score(self, features: Dict[str, float]) -> Dict[str, Any]:
        """
        Calculate weighted composite readiness score.

        Weights (sum to 1.0):
        - Mood: 0.25 (25%)
        - Stress: 0.20 (20%, inverse)
        - Sleep: 0.20 (20%)
        - HRV Recovery: 0.15 (15%)
        - Freshness: 0.10 (10%)
        - Engagement: 0.10 (10%)

        Args:
            features: Dictionary of feature values

        Returns:
            Dictionary with score and component scores
        """
        # Normalize features to 0-1 scale
        mood_norm = self._normalize(features['mood_avg_7d'], 1, 10)
        stress_norm = 1 - self._normalize(features['stress_avg_7d'], 1, 10)  # Inverse (low stress is good)
        sleep_norm = self._normalize(features['sleep_avg_3d'], 4, 10)  # 4-10 hours

        # HRV recovery (0-100 scale, optional)
        if features.get('hrv_recovery'):
            hrv_norm = self._normalize(features['hrv_recovery'], 0, 100)
            hrv_weight = 0.15
        else:
            hrv_norm = 0
            hrv_weight = 0  # Redistribute weight if no HRV data

        # Freshness (days since last game, 0-14 days optimal)
        freshness_norm = self._normalize(features.get('days_since_last_game', 7), 0, 14)

        # Engagement (chat sessions per week, 0-7 optimal)
        engagement_norm = min(features.get('chat_engagement_7d', 0) / 7.0, 1.0)

        # Weighted composite (redistribute HRV weight if missing)
        if hrv_weight == 0:
            # Redistribute HRV weight to mood and sleep
            mood_weight = 0.32  # 0.25 + 0.07
            sleep_weight = 0.28  # 0.20 + 0.08
        else:
            mood_weight = 0.25
            sleep_weight = 0.20

        score = (
            mood_weight * mood_norm +
            0.20 * stress_norm +
            sleep_weight * sleep_norm +
            hrv_weight * hrv_norm +
            0.10 * freshness_norm +
            0.10 * engagement_norm
        ) * 100

        return {
            "score": score,
            "components": {
                "mood": mood_norm * 100,
                "stress": stress_norm * 100,
                "sleep": sleep_norm * 100,
                "hrv": hrv_norm * 100 if hrv_weight > 0 else None,
                "freshness": freshness_norm * 100,
                "engagement": engagement_norm * 100
            }
        }

    def _normalize(self, value: float, min_val: float, max_val: float) -> float:
        """Normalize value to 0-1 range."""
        if value <= min_val:
            return 0.0
        if value >= max_val:
            return 1.0
        return (value - min_val) / (max_val - min_val)

    def _determine_level(self, score: float) -> str:
        """Determine traffic light level from score."""
        if score >= 75:
            return "GREEN"  # Ready to compete
        elif score >= 55:
            return "YELLOW"  # Monitor closely
        else:
            return "RED"  # At-risk, intervention recommended

    def _analyze_factors(self, features: Dict[str, float]) -> List[Dict[str, Any]]:
        """
        Analyze contributing factors to readiness score.

        Returns top factors sorted by impact (positive or negative).
        """
        factors = []

        # Mood factor
        mood_impact = (features['mood_avg_7d'] - 5.5) / 4.5 * 25  # Scale to ±25 points
        factors.append({
            "factor": "mood",
            "label": "Mood (7-day avg)",
            "value": round(features['mood_avg_7d'], 1),
            "impact": round(mood_impact, 1),
            "description": self._get_mood_description(features['mood_avg_7d'])
        })

        # Stress factor (inverse)
        stress_impact = -(features['stress_avg_7d'] - 5.5) / 4.5 * 20  # Scale to ±20 points
        factors.append({
            "factor": "stress",
            "label": "Stress (7-day avg)",
            "value": round(features['stress_avg_7d'], 1),
            "impact": round(stress_impact, 1),
            "description": self._get_stress_description(features['stress_avg_7d'])
        })

        # Sleep factor
        sleep_impact = (features['sleep_avg_3d'] - 7) / 3 * 20  # Scale to ±20 points
        factors.append({
            "factor": "sleep",
            "label": "Sleep (3-day avg)",
            "value": round(features['sleep_avg_3d'], 1),
            "impact": round(sleep_impact, 1),
            "description": self._get_sleep_description(features['sleep_avg_3d'])
        })

        # HRV factor (if available)
        if features.get('hrv_recovery'):
            hrv_impact = (features['hrv_recovery'] - 50) / 50 * 15  # Scale to ±15 points
            factors.append({
                "factor": "hrv",
                "label": "HRV Recovery",
                "value": round(features['hrv_recovery'], 1),
                "impact": round(hrv_impact, 1),
                "description": self._get_hrv_description(features['hrv_recovery'])
            })

        # Engagement factor
        engagement_impact = (features.get('chat_engagement_7d', 0) - 3.5) / 3.5 * 10  # Scale to ±10 points
        factors.append({
            "factor": "engagement",
            "label": "AI Chat Engagement",
            "value": features.get('chat_engagement_7d', 0),
            "impact": round(engagement_impact, 1),
            "description": self._get_engagement_description(features.get('chat_engagement_7d', 0))
        })

        # Sort by absolute impact (most significant factors first)
        factors.sort(key=lambda x: abs(x['impact']), reverse=True)

        return factors

    def _get_mood_description(self, mood: float) -> str:
        """Get description for mood value."""
        if mood >= 8:
            return "Excellent mood, high positivity"
        elif mood >= 7:
            return "Good mood, generally positive"
        elif mood >= 5:
            return "Neutral mood"
        elif mood >= 3:
            return "Low mood, some negativity"
        else:
            return "Very low mood, concerning"

    def _get_stress_description(self, stress: float) -> str:
        """Get description for stress value."""
        if stress <= 3:
            return "Very low stress, well-managed"
        elif stress <= 5:
            return "Low stress, comfortable"
        elif stress <= 7:
            return "Moderate stress, manageable"
        elif stress <= 8:
            return "High stress, may impact performance"
        else:
            return "Very high stress, intervention recommended"

    def _get_sleep_description(self, sleep: float) -> str:
        """Get description for sleep value."""
        if sleep >= 8:
            return "Excellent sleep, well-rested"
        elif sleep >= 7:
            return "Good sleep, adequate rest"
        elif sleep >= 6:
            return "Moderate sleep, may need more rest"
        elif sleep >= 5:
            return "Poor sleep, fatigue likely"
        else:
            return "Very poor sleep, significant fatigue"

    def _get_hrv_description(self, hrv: float) -> str:
        """Get description for HRV recovery score."""
        if hrv >= 67:
            return "High recovery, ready to perform"
        elif hrv >= 34:
            return "Moderate recovery, adequate"
        else:
            return "Low recovery, needs rest"

    def _get_engagement_description(self, sessions: int) -> str:
        """Get description for chat engagement."""
        if sessions >= 5:
            return "High engagement, actively using platform"
        elif sessions >= 2:
            return "Moderate engagement"
        elif sessions >= 1:
            return "Low engagement"
        else:
            return "No recent engagement"

    def _save_readiness_score(
        self,
        athlete_id: str,
        game_date: datetime,
        score_data: Dict[str, Any]
    ) -> None:
        """Save readiness score to database."""
        # Check if ReadinessScore model exists (it's new)
        if not hasattr(models, 'ReadinessScore'):
            logger.warning("ReadinessScore model not available, skipping save")
            return

        try:
            # Check if score already exists for this athlete/game
            existing = self.db.query(models.ReadinessScore).filter(
                and_(
                    models.ReadinessScore.athleteId == athlete_id,
                    models.ReadinessScore.gameDate == game_date
                )
            ).first()

            if existing:
                # Update existing score
                existing.score = int(score_data['score'])
                existing.level = score_data['level']
                existing.factors = score_data['factors']
                existing.moodAvg7d = score_data['rawValues']['moodAvg7d']
                existing.stressAvg7d = score_data['rawValues']['stressAvg7d']
                existing.sleepAvg3d = score_data['rawValues']['sleepAvg3d']
                existing.hrvRecovery = score_data['rawValues'].get('hrvRecovery')
                existing.daysSinceGame = score_data['rawValues'].get('daysSinceGame')
                existing.chatEngagement = score_data['rawValues'].get('chatEngagement')
                existing.calculatedAt = datetime.now()
            else:
                # Create new score
                new_score = models.ReadinessScore(
                    athleteId=athlete_id,
                    gameDate=game_date,
                    score=int(score_data['score']),
                    level=score_data['level'],
                    factors=score_data['factors'],
                    moodAvg7d=score_data['rawValues']['moodAvg7d'],
                    stressAvg7d=score_data['rawValues']['stressAvg7d'],
                    sleepAvg3d=score_data['rawValues']['sleepAvg3d'],
                    hrvRecovery=score_data['rawValues'].get('hrvRecovery'),
                    daysSinceGame=score_data['rawValues'].get('daysSinceGame'),
                    chatEngagement=score_data['rawValues'].get('chatEngagement')
                )
                self.db.add(new_score)

            self.db.commit()
            logger.info(f"Saved readiness score for athlete {athlete_id}")

        except Exception as e:
            logger.error(f"Error saving readiness score: {str(e)}")
            self.db.rollback()
