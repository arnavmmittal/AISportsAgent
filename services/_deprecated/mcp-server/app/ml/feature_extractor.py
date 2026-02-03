"""
Feature Extraction for Athlete Performance Prediction

Extracts and engineers features from multi-modal athlete data:
- Mood logs (mood, confidence, stress, energy, sleep)
- Biometrics (HRV, resting HR, sleep quality from wearables)
- Chat sentiment (from conversation analysis)
- Performance outcomes (game/practice performance)
- Temporal patterns (day of week, time trends)
"""

import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from app.core.logging import setup_logging

logger = setup_logging()


class FeatureExtractor:
    """
    Extract features from athlete data for ML models.

    Handles missing data gracefully and provides normalized features.
    """

    # Feature categories
    MOOD_FEATURES = ["mood", "confidence", "stress", "energy", "sleep"]
    BIOMETRIC_FEATURES = ["hrv", "resting_hr", "sleep_score", "recovery_score"]
    TEMPORAL_FEATURES = ["day_of_week", "days_until_competition", "time_of_day"]

    def __init__(self, lookback_days: int = 14):
        """
        Initialize feature extractor.

        Args:
            lookback_days: Number of days to look back for historical features
        """
        self.lookback_days = lookback_days

    def extract_features(
        self,
        mood_logs: List[Dict[str, Any]],
        biometrics: Optional[List[Dict[str, Any]]] = None,
        chat_sessions: Optional[List[Dict[str, Any]]] = None,
        performance_data: Optional[List[Dict[str, Any]]] = None,
        target_date: Optional[datetime] = None,
    ) -> Dict[str, float]:
        """
        Extract all features for a single prediction.

        Args:
            mood_logs: List of mood log entries
            biometrics: List of biometric entries (from wearables)
            chat_sessions: List of chat session summaries
            performance_data: List of performance outcomes
            target_date: Date to predict for (default: today)

        Returns:
            Dictionary of feature name -> value
        """
        target_date = target_date or datetime.now()
        features = {}

        # Extract mood features
        mood_features = self._extract_mood_features(mood_logs, target_date)
        features.update(mood_features)

        # Extract biometric features
        if biometrics:
            bio_features = self._extract_biometric_features(biometrics, target_date)
            features.update(bio_features)
        else:
            # Fill with defaults if no biometric data
            features.update(self._get_default_biometric_features())

        # Extract chat sentiment features
        if chat_sessions:
            chat_features = self._extract_chat_features(chat_sessions, target_date)
            features.update(chat_features)
        else:
            features.update(self._get_default_chat_features())

        # Extract temporal features
        temporal_features = self._extract_temporal_features(target_date)
        features.update(temporal_features)

        # Extract trend features
        trend_features = self._extract_trend_features(mood_logs, target_date)
        features.update(trend_features)

        # Extract performance baseline
        if performance_data:
            perf_features = self._extract_performance_baseline(performance_data)
            features.update(perf_features)
        else:
            features.update(self._get_default_performance_features())

        return features

    def _extract_mood_features(
        self,
        mood_logs: List[Dict[str, Any]],
        target_date: datetime,
    ) -> Dict[str, float]:
        """Extract features from mood logs."""
        features = {}

        # Filter logs within lookback window
        cutoff = target_date - timedelta(days=self.lookback_days)
        recent_logs = [
            log for log in mood_logs
            if self._parse_date(log.get("date") or log.get("createdAt")) >= cutoff
        ]

        if not recent_logs:
            return self._get_default_mood_features()

        # Latest values
        latest = recent_logs[-1] if recent_logs else {}
        for feat in self.MOOD_FEATURES:
            features[f"latest_{feat}"] = float(latest.get(feat, 5.0))

        # Averages over lookback period
        for feat in self.MOOD_FEATURES:
            values = [float(log.get(feat, 5.0)) for log in recent_logs if log.get(feat) is not None]
            features[f"avg_{feat}"] = np.mean(values) if values else 5.0
            features[f"std_{feat}"] = np.std(values) if len(values) > 1 else 0.0

        # Recent vs historical comparison (last 3 days vs prior)
        recent_3_days = target_date - timedelta(days=3)
        last_3 = [log for log in recent_logs if self._parse_date(log.get("date") or log.get("createdAt")) >= recent_3_days]
        prior = [log for log in recent_logs if self._parse_date(log.get("date") or log.get("createdAt")) < recent_3_days]

        for feat in self.MOOD_FEATURES:
            recent_vals = [float(log.get(feat, 5.0)) for log in last_3 if log.get(feat) is not None]
            prior_vals = [float(log.get(feat, 5.0)) for log in prior if log.get(feat) is not None]

            recent_avg = np.mean(recent_vals) if recent_vals else 5.0
            prior_avg = np.mean(prior_vals) if prior_vals else 5.0

            features[f"delta_{feat}"] = recent_avg - prior_avg

        # Logging frequency (engagement metric)
        features["log_frequency"] = len(recent_logs) / max(self.lookback_days, 1)

        return features

    def _extract_biometric_features(
        self,
        biometrics: List[Dict[str, Any]],
        target_date: datetime,
    ) -> Dict[str, float]:
        """Extract features from biometric data."""
        features = {}

        cutoff = target_date - timedelta(days=self.lookback_days)
        recent = [
            b for b in biometrics
            if self._parse_date(b.get("date") or b.get("createdAt")) >= cutoff
        ]

        if not recent:
            return self._get_default_biometric_features()

        # Latest values
        latest = recent[-1]
        for feat in self.BIOMETRIC_FEATURES:
            features[f"latest_{feat}"] = float(latest.get(feat, 0.0))

        # Averages
        for feat in self.BIOMETRIC_FEATURES:
            values = [float(b.get(feat, 0.0)) for b in recent if b.get(feat) is not None]
            features[f"avg_{feat}"] = np.mean(values) if values else 0.0

        # HRV trend (key indicator of recovery)
        hrv_values = [float(b.get("hrv", 0.0)) for b in recent if b.get("hrv") is not None]
        if len(hrv_values) >= 3:
            features["hrv_trend"] = self._calculate_trend(hrv_values)
        else:
            features["hrv_trend"] = 0.0

        return features

    def _extract_chat_features(
        self,
        chat_sessions: List[Dict[str, Any]],
        target_date: datetime,
    ) -> Dict[str, float]:
        """Extract features from chat session analysis."""
        features = {}

        cutoff = target_date - timedelta(days=self.lookback_days)
        recent = [
            s for s in chat_sessions
            if self._parse_date(s.get("date") or s.get("createdAt")) >= cutoff
        ]

        if not recent:
            return self._get_default_chat_features()

        # Average sentiment
        sentiments = [float(s.get("sentiment", 0.0)) for s in recent if s.get("sentiment") is not None]
        features["avg_chat_sentiment"] = np.mean(sentiments) if sentiments else 0.0

        # Topic frequencies
        topics = ["anxiety", "confidence", "motivation", "stress", "sleep", "injury"]
        for topic in topics:
            topic_count = sum(1 for s in recent if topic in str(s.get("topics", [])).lower())
            features[f"topic_{topic}_freq"] = topic_count / max(len(recent), 1)

        # Engagement metrics
        features["chat_frequency"] = len(recent) / max(self.lookback_days, 1)

        avg_length = np.mean([int(s.get("message_count", 0)) for s in recent])
        features["avg_session_length"] = avg_length if not np.isnan(avg_length) else 0.0

        return features

    def _extract_temporal_features(self, target_date: datetime) -> Dict[str, float]:
        """Extract temporal features."""
        return {
            "day_of_week": float(target_date.weekday()),
            "day_of_week_sin": np.sin(2 * np.pi * target_date.weekday() / 7),
            "day_of_week_cos": np.cos(2 * np.pi * target_date.weekday() / 7),
            "month": float(target_date.month),
            "is_weekend": float(target_date.weekday() >= 5),
        }

    def _extract_trend_features(
        self,
        mood_logs: List[Dict[str, Any]],
        target_date: datetime,
    ) -> Dict[str, float]:
        """Extract trend features over time."""
        features = {}

        cutoff = target_date - timedelta(days=self.lookback_days)
        recent = [
            log for log in mood_logs
            if self._parse_date(log.get("date") or log.get("createdAt")) >= cutoff
        ]

        if len(recent) < 3:
            return {
                "mood_trend": 0.0,
                "confidence_trend": 0.0,
                "stress_trend": 0.0,
                "overall_trend": 0.0,
            }

        # Calculate trends for key metrics
        for metric in ["mood", "confidence", "stress"]:
            values = [float(log.get(metric, 5.0)) for log in recent if log.get(metric) is not None]
            features[f"{metric}_trend"] = self._calculate_trend(values) if len(values) >= 3 else 0.0

        # Overall trend (composite)
        overall_values = []
        for log in recent:
            mood = float(log.get("mood", 5.0))
            conf = float(log.get("confidence", 5.0))
            stress = float(log.get("stress", 5.0))
            # Composite score: high mood + high confidence + low stress = positive
            overall_values.append(mood + conf + (10 - stress))

        features["overall_trend"] = self._calculate_trend(overall_values) if len(overall_values) >= 3 else 0.0

        return features

    def _extract_performance_baseline(
        self,
        performance_data: List[Dict[str, Any]],
    ) -> Dict[str, float]:
        """Extract baseline performance features."""
        features = {}

        if not performance_data:
            return self._get_default_performance_features()

        # Recent performance average
        recent = performance_data[-10:]  # Last 10 performances
        ratings = [float(p.get("rating", 5.0)) for p in recent if p.get("rating") is not None]

        features["baseline_performance"] = np.mean(ratings) if ratings else 5.0
        features["performance_std"] = np.std(ratings) if len(ratings) > 1 else 0.0
        features["best_recent_performance"] = max(ratings) if ratings else 5.0

        # Performance trend
        features["performance_trend"] = self._calculate_trend(ratings) if len(ratings) >= 3 else 0.0

        return features

    def _calculate_trend(self, values: List[float]) -> float:
        """Calculate linear trend (slope) of values."""
        if len(values) < 2:
            return 0.0

        x = np.arange(len(values))
        y = np.array(values)

        # Linear regression slope
        slope, _ = np.polyfit(x, y, 1)
        return float(slope)

    def _parse_date(self, date_value: Any) -> datetime:
        """Parse date from various formats."""
        if isinstance(date_value, datetime):
            return date_value
        if isinstance(date_value, str):
            try:
                return datetime.fromisoformat(date_value.replace("Z", "+00:00"))
            except ValueError:
                return datetime.now() - timedelta(days=365)  # Very old if unparseable
        return datetime.now() - timedelta(days=365)

    def _get_default_mood_features(self) -> Dict[str, float]:
        """Get default mood features when no data available."""
        features = {}
        for feat in self.MOOD_FEATURES:
            features[f"latest_{feat}"] = 5.0
            features[f"avg_{feat}"] = 5.0
            features[f"std_{feat}"] = 0.0
            features[f"delta_{feat}"] = 0.0
        features["log_frequency"] = 0.0
        return features

    def _get_default_biometric_features(self) -> Dict[str, float]:
        """Get default biometric features when no data available."""
        features = {}
        for feat in self.BIOMETRIC_FEATURES:
            features[f"latest_{feat}"] = 0.0
            features[f"avg_{feat}"] = 0.0
        features["hrv_trend"] = 0.0
        return features

    def _get_default_chat_features(self) -> Dict[str, float]:
        """Get default chat features when no data available."""
        return {
            "avg_chat_sentiment": 0.0,
            "topic_anxiety_freq": 0.0,
            "topic_confidence_freq": 0.0,
            "topic_motivation_freq": 0.0,
            "topic_stress_freq": 0.0,
            "topic_sleep_freq": 0.0,
            "topic_injury_freq": 0.0,
            "chat_frequency": 0.0,
            "avg_session_length": 0.0,
        }

    def _get_default_performance_features(self) -> Dict[str, float]:
        """Get default performance features when no data available."""
        return {
            "baseline_performance": 5.0,
            "performance_std": 0.0,
            "best_recent_performance": 5.0,
            "performance_trend": 0.0,
        }


# Convenience functions
def extract_athlete_features(
    mood_logs: List[Dict[str, Any]],
    biometrics: Optional[List[Dict[str, Any]]] = None,
    chat_sessions: Optional[List[Dict[str, Any]]] = None,
    performance_data: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, float]:
    """
    Extract all features for an athlete.

    Convenience wrapper around FeatureExtractor.
    """
    extractor = FeatureExtractor()
    return extractor.extract_features(
        mood_logs=mood_logs,
        biometrics=biometrics,
        chat_sessions=chat_sessions,
        performance_data=performance_data,
    )


def extract_temporal_features(date: datetime) -> Dict[str, float]:
    """Extract temporal features for a date."""
    extractor = FeatureExtractor()
    return extractor._extract_temporal_features(date)
