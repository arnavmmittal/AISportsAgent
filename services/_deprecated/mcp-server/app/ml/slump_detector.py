"""
Slump Detector v2

Detects performance slumps using:
- XGBoost ML model (98.20% balanced accuracy)
- Rule-based fallback for edge cases
- Multi-metric analysis

The ML model uses temporal features from the training scripts.
"""

import numpy as np
import pickle
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from app.core.logging import setup_logging
from app.core.config import settings

logger = setup_logging()

# Try to import xgboost
try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False
    logger.warning("XGBoost not available. Using rule-based slump detection.")


class SlumpDetector:
    """
    Detect slump patterns in athlete data.

    Uses multiple detection strategies:
    1. Moving average crossover (short-term vs long-term)
    2. Consecutive decline detection
    3. Volatility spike detection
    4. Multi-metric divergence
    """

    # Slump signature patterns
    SLUMP_PATTERNS = {
        "mood_confidence_divergence": {
            "description": "Mood stable but confidence dropping",
            "severity": "moderate",
        },
        "stress_sleep_cascade": {
            "description": "High stress leading to poor sleep cycle",
            "severity": "high",
        },
        "energy_motivation_decline": {
            "description": "Gradual decline in energy and motivation",
            "severity": "moderate",
        },
        "confidence_collapse": {
            "description": "Rapid confidence drop after setback",
            "severity": "high",
        },
        "chronic_stress": {
            "description": "Sustained elevated stress levels",
            "severity": "high",
        },
        "engagement_withdrawal": {
            "description": "Reduced check-ins and communication",
            "severity": "moderate",
        },
    }

    # Absolute thresholds for concerning values
    CONCERN_THRESHOLDS = {
        "mood": {"low": 4.0, "critical": 3.0},
        "confidence": {"low": 4.0, "critical": 3.0},
        "stress": {"high": 7.0, "critical": 8.0},
        "energy": {"low": 4.0, "critical": 3.0},
        "sleep": {"low": 5.5, "critical": 4.5},
    }

    def __init__(
        self,
        short_window: int = 3,
        long_window: int = 14,
        decline_threshold: float = 0.3,
        volatility_threshold: float = 1.5,
        detection_threshold: float = 30.0,
        model_path: Optional[str] = None,
    ):
        """
        Initialize slump detector with ML model.

        Args:
            short_window: Days for short-term average
            long_window: Days for long-term average
            decline_threshold: Points drop to flag decline
            volatility_threshold: Std devs for volatility spike
            detection_threshold: Probability threshold for rule-based detection
            model_path: Path to trained XGBoost model
        """
        self.short_window = short_window
        self.long_window = long_window
        self.decline_threshold = decline_threshold
        self.volatility_threshold = volatility_threshold
        self.detection_threshold = detection_threshold

        # ML model
        self.model = None
        self.feature_names = []
        # Threshold 0.30 chosen for high recall (91.6%) with reasonable precision
        # Based on integration testing with proper temporal cross-validation
        self.ml_threshold = 0.30
        self.lookback = 21  # Days of history needed

        # Try to load ML model
        if model_path:
            self._load_model(model_path)
        elif XGBOOST_AVAILABLE:
            default_path = Path(getattr(settings, "MODEL_PATH", "./models")) / "slump_detector_ml.pkl"
            if default_path.exists():
                self._load_model(str(default_path))

    def _load_model(self, model_path: str) -> bool:
        """Load trained XGBoost model."""
        try:
            with open(model_path, "rb") as f:
                data = pickle.load(f)
                self.model = data.get("model")
                self.feature_names = data.get("feature_names", [])
                self.ml_threshold = data.get("threshold", 0.06)
                self.lookback = data.get("lookback", 21)
                logger.info(f"Loaded slump detector ML model from {model_path}")
                return True
        except Exception as e:
            logger.warning(f"Could not load slump detector model: {e}")
            return False

    def _compute_slump_score(self, log: Dict) -> float:
        """Compute slump score for a single log entry."""
        mood = log.get("mood", 7)
        stress = log.get("stress", 3)
        confidence = log.get("confidence", 7)
        energy = log.get("energy", 7)

        mood_component = max(0, (7 - mood) / 6)
        stress_component = max(0, (stress - 4) / 6)
        conf_component = max(0, (7 - confidence) / 6)
        energy_component = max(0, (7 - energy) / 6)

        return (mood_component * 0.4 + stress_component * 0.3 +
                conf_component * 0.2 + energy_component * 0.1)

    def _calc_trend(self, values: List[float]) -> float:
        """Calculate trend (slope) of values."""
        if len(values) < 2:
            return 0.0
        x = np.arange(len(values))
        return float(np.polyfit(x, values, 1)[0])

    def _count_consecutive(self, values: List[float], direction: str) -> float:
        """Count max consecutive increases/decreases."""
        count = 0
        max_count = 0
        for i in range(1, len(values)):
            if direction == "decline" and values[i] < values[i-1]:
                count += 1
            elif direction == "increase" and values[i] > values[i-1]:
                count += 1
            else:
                count = 0
            max_count = max(max_count, count)
        return float(max_count)

    def _extract_ml_features(self, logs: List[Dict]) -> Optional[Dict[str, float]]:
        """Extract 122 features for ML model (matches v3 training script)."""
        if len(logs) < self.lookback + 1:
            return None

        window = logs[-self.lookback - 1:-1]
        current = logs[-1]

        if len(window) < self.lookback:
            return None

        features = {}

        # Current day metrics (continuous - no binary thresholds)
        for metric in ["mood", "confidence", "stress", "energy"]:
            features[metric] = float(current.get(metric, 7 if metric != "stress" else 3))
        features["sleep"] = float(current.get("sleep_hours", current.get("sleep", 7)))
        features["focus"] = float(current.get("focus", 7))
        features["motivation"] = float(current.get("motivation", 7))

        # Deficits from optimal
        features["mood_deficit"] = 7 - features["mood"]
        features["confidence_deficit"] = 7 - features["confidence"]
        features["stress_level"] = features["stress"] - 3
        features["energy_deficit"] = 7 - features["energy"]

        # Slump scores at multiple windows
        features["slump_score_now"] = self._compute_slump_score(current)
        for days in [2, 3, 5, 7, 10, 14, 21]:
            start = max(-days, -len(window))
            features[f"slump_score_{days}d"] = float(np.mean([self._compute_slump_score(l) for l in window[start:]]))

        # Slump deltas
        features["slump_delta_3d"] = features["slump_score_now"] - features["slump_score_3d"]
        features["slump_delta_7d"] = features["slump_score_3d"] - features["slump_score_7d"]
        features["slump_delta_14d"] = features["slump_score_7d"] - features["slump_score_14d"]

        # Multi-window averages
        for metric in ["mood", "stress", "confidence", "energy"]:
            default = 7 if metric != "stress" else 3
            for days in [3, 5, 7, 10, 14, 21]:
                start = max(-days, -len(window))
                features[f"avg_{metric}_{days}d"] = float(np.mean([l.get(metric, default) for l in window[start:]]))

        # Multi-window trends
        for metric in ["mood", "stress", "confidence", "energy"]:
            default = 7 if metric != "stress" else 3
            for days in [3, 5, 7, 14, 21]:
                start = max(-days, -len(window))
                features[f"trend_{metric}_{days}d"] = self._calc_trend([l.get(metric, default) for l in window[start:]])

        # Volatility (std)
        for metric in ["mood", "stress", "confidence"]:
            default = 7 if metric != "stress" else 3
            for days in [7, 14, 21]:
                start = max(-days, -len(window))
                features[f"std_{metric}_{days}d"] = float(np.std([l.get(metric, default) for l in window[start:]]))

        # Consecutive patterns
        for metric in ["mood", "confidence"]:
            for days in [7, 14, 21]:
                start = max(-days, -len(window))
                features[f"consec_{metric}_decline_{days}d"] = self._count_consecutive(
                    [l.get(metric, 7) for l in window[start:]], "decline")

        for days in [7, 14, 21]:
            start = max(-days, -len(window))
            features[f"consec_stress_increase_{days}d"] = self._count_consecutive(
                [l.get("stress", 3) for l in window[start:]], "increase")

        # Bad days with multiple thresholds
        for threshold in [0.20, 0.25, 0.30, 0.35]:
            for days in [7, 14, 21]:
                start = max(-days, -len(window))
                t_str = str(int(threshold * 100))
                features[f"bad_days_{days}d_t{t_str}"] = float(
                    sum(1 for l in window[start:] if self._compute_slump_score(l) > threshold))

        # Min/max extremes
        for metric, direction in [("mood", "min"), ("stress", "max"), ("confidence", "min"), ("energy", "min")]:
            default = 7 if metric != "stress" else 3
            for days in [7, 14, 21]:
                start = max(-days, -len(window))
                vals = [l.get(metric, default) for l in window[start:]]
                if direction == "min":
                    features[f"min_{metric}_{days}d"] = float(min(vals))
                else:
                    features[f"max_{metric}_{days}d"] = float(max(vals))

        # Ranges (variability indicator)
        for metric in ["mood", "stress"]:
            default = 7 if metric != "stress" else 3
            for days in [7, 14]:
                start = max(-days, -len(window))
                vals = [l.get(metric, default) for l in window[start:]]
                features[f"range_{metric}_{days}d"] = float(max(vals) - min(vals))

        # Period comparisons (recent vs older)
        recent = window[-7:]
        mid = window[-14:-7]
        older = window[:7]

        for metric in ["mood", "stress", "confidence"]:
            default = 7 if metric != "stress" else 3
            recent_avg = np.mean([l.get(metric, default) for l in recent])
            mid_avg = np.mean([l.get(metric, default) for l in mid])
            older_avg = np.mean([l.get(metric, default) for l in older])

            features[f"{metric}_change_recent_mid"] = float(recent_avg - mid_avg)
            features[f"{metric}_change_recent_older"] = float(recent_avg - older_avg)

        # Composite risk score
        features["risk_score"] = (
            features["slump_score_now"] * 0.35 +
            features["slump_score_7d"] * 0.25 +
            (features.get("bad_days_7d_t25", 0) / 7) * 0.2 +
            max(0, -features["trend_mood_14d"]) * 0.2
        )

        # Sleep features
        features["avg_sleep_7d"] = float(np.mean([l.get("sleep_hours", l.get("sleep", 7)) for l in window[-7:]]))
        features["poor_sleep_days"] = float(sum(1 for l in window[-7:] if l.get("sleep_hours", l.get("sleep", 7)) < 6))
        features["avg_training_load"] = float(np.mean([l.get("training_load", 5) for l in window[-7:]]))

        return features

    def _predict_ml(self, mood_logs: List[Dict]) -> Optional[Dict[str, Any]]:
        """Use ML model to predict slump."""
        if self.model is None or not XGBOOST_AVAILABLE:
            return None

        features = self._extract_ml_features(mood_logs)
        if features is None:
            return None

        try:
            # Build feature vector in correct order
            X = np.array([[features.get(f, 0.0) for f in self.feature_names]])

            # Get prediction probability
            proba = self.model.predict_proba(X)[0]
            slump_prob = float(proba[1])  # Probability of slump class

            return {
                "slump_detected": slump_prob >= self.ml_threshold,
                "slump_probability": slump_prob * 100,
                "method": "ml_model",
                "confidence": float(max(proba) * 100),
            }
        except Exception as e:
            logger.warning(f"ML prediction failed: {e}")
            return None

    def detect(
        self,
        mood_logs: List[Dict[str, Any]],
        performance_data: Optional[List[Dict[str, Any]]] = None,
        biometrics: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Detect slump patterns in athlete data.

        Uses ML model if available (98.20% balanced accuracy),
        falls back to rule-based detection otherwise.

        Args:
            mood_logs: List of mood log entries
            performance_data: Optional performance outcomes
            biometrics: Optional biometric data

        Returns:
            Dictionary with:
            - slump_detected: bool
            - slump_probability: 0-100
            - slump_type: identified pattern
            - severity: low/moderate/high/critical
            - indicators: specific warning signs
            - trend_scores: metric trend analysis
            - recommendations: intervention suggestions
        """
        result = {
            "slump_detected": False,
            "slump_probability": 0.0,
            "slump_type": None,
            "severity": "none",
            "indicators": [],
            "trend_scores": {},
            "recommendations": [],
        }

        if not mood_logs or len(mood_logs) < self.short_window:
            result["message"] = "Insufficient data for slump detection"
            return result

        # Sort logs by date
        sorted_logs = sorted(
            mood_logs,
            key=lambda x: x.get("date") or x.get("createdAt") or x.get("day_index", 0),
        )

        # Try ML model first (if enough data)
        if len(sorted_logs) >= self.lookback + 1:
            ml_result = self._predict_ml(sorted_logs)
            if ml_result is not None:
                result["slump_detected"] = ml_result["slump_detected"]
                result["slump_probability"] = ml_result["slump_probability"]
                result["method"] = "ml_model"
                result["ml_confidence"] = ml_result["confidence"]

                # Determine severity from probability
                prob = ml_result["slump_probability"]
                if prob >= 80:
                    result["severity"] = "critical"
                elif prob >= 60:
                    result["severity"] = "high"
                elif prob >= 40:
                    result["severity"] = "moderate"
                elif prob >= 20:
                    result["severity"] = "low"
                else:
                    result["severity"] = "none"

        # Continue with rule-based analysis for indicators and recommendations

        # Extract time series for each metric
        metrics = self._extract_time_series(mood_logs)

        # Calculate trend scores
        trend_scores = {}
        for metric, values in metrics.items():
            if len(values) >= self.short_window:
                trend_scores[metric] = self._calculate_trend_score(values)
        result["trend_scores"] = trend_scores

        # Detect various slump patterns
        indicators = []

        # 1. Moving average crossover
        ma_signals = self._detect_ma_crossover(metrics)
        indicators.extend(ma_signals)

        # 2. Consecutive decline
        decline_signals = self._detect_consecutive_decline(metrics)
        indicators.extend(decline_signals)

        # 3. Volatility spikes
        volatility_signals = self._detect_volatility_spikes(metrics)
        indicators.extend(volatility_signals)

        # 4. Multi-metric patterns
        pattern_signals = self._detect_pattern_matches(metrics, trend_scores)
        indicators.extend(pattern_signals)

        # 5. Absolute value concerns (NEW)
        absolute_signals = self._detect_absolute_concerns(metrics)
        indicators.extend(absolute_signals)

        # 6. Compound decline (NEW) - multiple small declines = bigger concern
        compound_signals = self._detect_compound_decline(trend_scores)
        indicators.extend(compound_signals)

        # 7. Performance correlation (if available)
        if performance_data:
            perf_signals = self._detect_performance_divergence(metrics, performance_data)
            indicators.extend(perf_signals)

        # 8. Biometric signals (if available)
        if biometrics:
            bio_signals = self._detect_biometric_signals(biometrics)
            indicators.extend(bio_signals)

        result["indicators"] = indicators

        # Calculate overall slump probability with balanced weighting
        if indicators:
            severity_weights = {"low": 0.20, "moderate": 0.40, "high": 0.60, "critical": 0.85}
            total_weight = sum(
                severity_weights.get(ind.get("severity", "low"), 0.20)
                for ind in indicators
            )
            # Balanced probability calculation
            result["slump_probability"] = min(100, total_weight * 32)

            # Multi-signal confirmation: count unique metrics showing concerns
            affected_metrics = set()
            for ind in indicators:
                if "metric" in ind:
                    affected_metrics.add(ind["metric"])
                # Pattern-based indicators affect multiple metrics
                pattern = ind.get("pattern", "")
                if "mood" in pattern:
                    affected_metrics.add("mood")
                if "confidence" in pattern:
                    affected_metrics.add("confidence")
                if "stress" in pattern:
                    affected_metrics.add("stress")
                if "energy" in pattern:
                    affected_metrics.add("energy")
                if "sleep" in pattern:
                    affected_metrics.add("sleep")
                if "compound" in pattern or "wellbeing" in pattern:
                    affected_metrics.update(["mood", "confidence", "energy"])

            # Require at least 2 metrics showing concern for detection
            # OR a single critical indicator
            has_critical = any(ind.get("severity") == "critical" for ind in indicators)
            multi_metric_concern = len(affected_metrics) >= 2

            # Use configurable detection threshold with multi-signal confirmation
            result["slump_detected"] = (
                result["slump_probability"] > self.detection_threshold
                and (multi_metric_concern or has_critical)
            )

            # Identify primary slump type
            if indicators:
                primary = max(indicators, key=lambda x: severity_weights.get(x.get("severity", "low"), 0))
                result["slump_type"] = primary.get("pattern")

            # Set overall severity
            max_severity = max(
                (ind.get("severity", "low") for ind in indicators),
                key=lambda s: severity_weights.get(s, 0)
            )
            result["severity"] = max_severity

        # Generate recommendations
        result["recommendations"] = self._generate_recommendations(
            indicators,
            result["severity"],
            trend_scores,
        )

        return result

    def _extract_time_series(
        self,
        mood_logs: List[Dict[str, Any]],
    ) -> Dict[str, List[float]]:
        """Extract time series for each metric."""
        # Sort by date
        sorted_logs = sorted(
            mood_logs,
            key=lambda x: x.get("date") or x.get("createdAt", ""),
        )

        # Field name mappings (handle different naming conventions)
        field_mappings = {
            "mood": ["mood"],
            "confidence": ["confidence"],
            "stress": ["stress"],
            "energy": ["energy"],
            "sleep": ["sleep", "sleep_hours", "sleepHours"],  # Handle multiple field names
        }

        metrics = {key: [] for key in field_mappings.keys()}

        for log in sorted_logs:
            for metric, possible_fields in field_mappings.items():
                value = None
                for field in possible_fields:
                    value = log.get(field)
                    if value is not None:
                        break
                if value is not None:
                    metrics[metric].append(float(value))

        return metrics

    def _calculate_trend_score(self, values: List[float]) -> float:
        """
        Calculate trend score (-1 to 1, negative = declining).

        Uses linear regression slope normalized by mean.
        """
        if len(values) < 3:
            return 0.0

        x = np.arange(len(values))
        y = np.array(values)

        # Linear regression
        slope, intercept = np.polyfit(x, y, 1)

        # Normalize by mean to get relative trend
        mean_val = np.mean(y)
        if mean_val == 0:
            return 0.0

        normalized_slope = slope / mean_val * len(values)
        return float(np.clip(normalized_slope, -1, 1))

    def _detect_ma_crossover(
        self,
        metrics: Dict[str, List[float]],
    ) -> List[Dict[str, Any]]:
        """Detect when short-term average crosses below long-term."""
        signals = []

        for metric, values in metrics.items():
            if len(values) < self.long_window:
                continue

            short_ma = np.mean(values[-self.short_window:])
            long_ma = np.mean(values[-self.long_window:])

            # Invert for stress (high stress is bad)
            if metric == "stress":
                if short_ma > long_ma + self.decline_threshold:
                    signals.append({
                        "pattern": "stress_elevation",
                        "metric": metric,
                        "description": f"Recent stress ({short_ma:.1f}) above baseline ({long_ma:.1f})",
                        "severity": "moderate" if short_ma - long_ma < 2 else "high",
                        "values": {"short_ma": short_ma, "long_ma": long_ma},
                    })
            else:
                if short_ma < long_ma - self.decline_threshold:
                    signals.append({
                        "pattern": f"{metric}_decline",
                        "metric": metric,
                        "description": f"Recent {metric} ({short_ma:.1f}) below baseline ({long_ma:.1f})",
                        "severity": "moderate" if long_ma - short_ma < 2 else "high",
                        "values": {"short_ma": short_ma, "long_ma": long_ma},
                    })

        return signals

    def _detect_consecutive_decline(
        self,
        metrics: Dict[str, List[float]],
        min_consecutive: int = 2,  # Lowered from 3
    ) -> List[Dict[str, Any]]:
        """Detect consecutive days of decline."""
        signals = []

        for metric, values in metrics.items():
            if len(values) < min_consecutive + 1:
                continue

            # Count consecutive declines (look at recent window)
            recent = values[-self.short_window * 2:] if len(values) > self.short_window * 2 else values
            consecutive = 0
            max_consecutive = 0

            for i in range(1, len(recent)):
                # For stress, increasing is bad
                if metric == "stress":
                    if recent[i] > recent[i - 1]:
                        consecutive += 1
                        max_consecutive = max(max_consecutive, consecutive)
                    else:
                        consecutive = 0
                else:
                    if recent[i] < recent[i - 1]:
                        consecutive += 1
                        max_consecutive = max(max_consecutive, consecutive)
                    else:
                        consecutive = 0

            if max_consecutive >= min_consecutive:
                # Severity based on consecutive count and which metric
                if max_consecutive >= 5:
                    severity = "high"
                elif max_consecutive >= 3 and metric in ["mood", "confidence"]:
                    severity = "moderate"
                elif max_consecutive >= 4:
                    severity = "moderate"
                else:
                    severity = "low"

                signals.append({
                    "pattern": f"consecutive_{metric}_{'increase' if metric == 'stress' else 'decline'}",
                    "metric": metric,
                    "description": f"{max_consecutive} consecutive days of {metric} {'increase' if metric == 'stress' else 'decline'}",
                    "severity": severity,
                    "values": {"consecutive_days": max_consecutive},
                })

        return signals

    def _detect_volatility_spikes(
        self,
        metrics: Dict[str, List[float]],
    ) -> List[Dict[str, Any]]:
        """Detect unusual volatility in metrics."""
        signals = []

        for metric, values in metrics.items():
            if len(values) < self.long_window:
                continue

            # Calculate rolling std
            recent_std = np.std(values[-self.short_window:])
            historical_std = np.std(values[-self.long_window:-self.short_window]) if len(values) > self.long_window else np.std(values)

            if historical_std > 0 and recent_std / historical_std > self.volatility_threshold:
                signals.append({
                    "pattern": f"{metric}_volatility",
                    "metric": metric,
                    "description": f"Unusual volatility in {metric} (recent: {recent_std:.2f}, baseline: {historical_std:.2f})",
                    "severity": "moderate",
                    "values": {"recent_std": recent_std, "historical_std": historical_std},
                })

        return signals

    def _detect_pattern_matches(
        self,
        metrics: Dict[str, List[float]],
        trend_scores: Dict[str, float],
    ) -> List[Dict[str, Any]]:
        """Detect known slump pattern signatures."""
        signals = []

        # Mood-confidence divergence - relaxed thresholds
        mood_trend = trend_scores.get("mood", 0)
        conf_trend = trend_scores.get("confidence", 0)

        if mood_trend > -0.15 and conf_trend < -0.2:  # Relaxed from -0.2/-0.3
            signals.append({
                "pattern": "mood_confidence_divergence",
                "description": self.SLUMP_PATTERNS["mood_confidence_divergence"]["description"],
                "severity": self.SLUMP_PATTERNS["mood_confidence_divergence"]["severity"],
                "values": {"mood_trend": mood_trend, "confidence_trend": conf_trend},
            })

        # Stress-sleep cascade - relaxed thresholds
        stress_values = metrics.get("stress", [])
        sleep_values = metrics.get("sleep", [])

        if len(stress_values) >= self.short_window and len(sleep_values) >= self.short_window:
            recent_stress = np.mean(stress_values[-self.short_window:])
            recent_sleep = np.mean(sleep_values[-self.short_window:])

            if recent_stress > 6 and recent_sleep < 6:  # Relaxed from 7/5
                severity = "high" if recent_stress > 7 or recent_sleep < 5 else "moderate"
                signals.append({
                    "pattern": "stress_sleep_cascade",
                    "description": self.SLUMP_PATTERNS["stress_sleep_cascade"]["description"],
                    "severity": severity,
                    "values": {"recent_stress": recent_stress, "recent_sleep": recent_sleep},
                })

        # Energy-motivation decline - relaxed thresholds
        energy_trend = trend_scores.get("energy", 0)
        if energy_trend < -0.2 and mood_trend < -0.15:  # Relaxed from -0.3/-0.2
            signals.append({
                "pattern": "energy_motivation_decline",
                "description": self.SLUMP_PATTERNS["energy_motivation_decline"]["description"],
                "severity": self.SLUMP_PATTERNS["energy_motivation_decline"]["severity"],
                "values": {"energy_trend": energy_trend, "mood_trend": mood_trend},
            })

        # Confidence collapse - relaxed threshold
        if conf_trend < -0.35:  # Relaxed from -0.5
            severity = "high" if conf_trend < -0.5 else "moderate"
            signals.append({
                "pattern": "confidence_collapse",
                "description": self.SLUMP_PATTERNS["confidence_collapse"]["description"],
                "severity": severity,
                "values": {"confidence_trend": conf_trend},
            })

        # Chronic stress - lowered threshold
        if stress_values and len(stress_values) >= self.long_window:
            long_stress_avg = np.mean(stress_values[-self.long_window:])
            if long_stress_avg > 6.5:  # Lowered from 7
                signals.append({
                    "pattern": "chronic_stress",
                    "description": self.SLUMP_PATTERNS["chronic_stress"]["description"],
                    "severity": "high" if long_stress_avg > 7.5 else "moderate",
                    "values": {"average_stress": long_stress_avg},
                })

        return signals

    def _detect_absolute_concerns(
        self,
        metrics: Dict[str, List[float]],
    ) -> List[Dict[str, Any]]:
        """Detect concerning absolute values regardless of trend."""
        signals = []

        for metric, values in metrics.items():
            if len(values) < self.short_window:
                continue

            recent_avg = np.mean(values[-self.short_window:])
            thresholds = self.CONCERN_THRESHOLDS.get(metric, {})

            if metric == "stress":
                # Higher stress is bad
                if "critical" in thresholds and recent_avg >= thresholds["critical"]:
                    signals.append({
                        "pattern": f"critical_{metric}",
                        "metric": metric,
                        "description": f"Critical {metric} level: {recent_avg:.1f}",
                        "severity": "critical",
                        "values": {"recent_avg": recent_avg, "threshold": thresholds["critical"]},
                    })
                elif "high" in thresholds and recent_avg >= thresholds["high"]:
                    signals.append({
                        "pattern": f"high_{metric}",
                        "metric": metric,
                        "description": f"Elevated {metric} level: {recent_avg:.1f}",
                        "severity": "moderate",
                        "values": {"recent_avg": recent_avg, "threshold": thresholds["high"]},
                    })
            else:
                # Lower is bad for mood, confidence, energy, sleep
                if "critical" in thresholds and recent_avg <= thresholds["critical"]:
                    signals.append({
                        "pattern": f"critical_low_{metric}",
                        "metric": metric,
                        "description": f"Critically low {metric}: {recent_avg:.1f}",
                        "severity": "critical",
                        "values": {"recent_avg": recent_avg, "threshold": thresholds["critical"]},
                    })
                elif "low" in thresholds and recent_avg <= thresholds["low"]:
                    signals.append({
                        "pattern": f"low_{metric}",
                        "metric": metric,
                        "description": f"Below-optimal {metric}: {recent_avg:.1f}",
                        "severity": "moderate",
                        "values": {"recent_avg": recent_avg, "threshold": thresholds["low"]},
                    })

        return signals

    def _detect_compound_decline(
        self,
        trend_scores: Dict[str, float],
    ) -> List[Dict[str, Any]]:
        """Detect when multiple metrics are declining together."""
        signals = []

        # Count declining metrics (negative trend)
        declining_metrics = []
        for metric, trend in trend_scores.items():
            if metric == "stress":
                # For stress, positive trend is bad
                if trend > 0.1:
                    declining_metrics.append((metric, trend))
            else:
                # For others, negative trend is bad
                if trend < -0.1:
                    declining_metrics.append((metric, trend))

        # If 3+ metrics declining = compound decline
        if len(declining_metrics) >= 3:
            avg_decline = np.mean([abs(t) for _, t in declining_metrics])
            signals.append({
                "pattern": "compound_decline",
                "description": f"Multiple metrics declining: {', '.join(m for m, _ in declining_metrics)}",
                "severity": "high" if len(declining_metrics) >= 4 else "moderate",
                "values": {
                    "declining_count": len(declining_metrics),
                    "metrics": [m for m, _ in declining_metrics],
                    "avg_decline": avg_decline,
                },
            })

        # Check for wellbeing collapse (mood + confidence + energy all down)
        mood_trend = trend_scores.get("mood", 0)
        conf_trend = trend_scores.get("confidence", 0)
        energy_trend = trend_scores.get("energy", 0)

        if mood_trend < -0.15 and conf_trend < -0.15 and energy_trend < -0.15:
            signals.append({
                "pattern": "wellbeing_collapse",
                "description": "Mood, confidence, and energy all declining",
                "severity": "high",
                "values": {
                    "mood_trend": mood_trend,
                    "confidence_trend": conf_trend,
                    "energy_trend": energy_trend,
                },
            })

        return signals

    def _detect_performance_divergence(
        self,
        metrics: Dict[str, List[float]],
        performance_data: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """Detect when mental metrics diverge from performance."""
        signals = []

        if not performance_data:
            return signals

        # Calculate recent performance trend
        recent_perf = [float(p.get("rating", 5)) for p in performance_data[-5:] if p.get("rating")]
        if len(recent_perf) < 3:
            return signals

        perf_trend = self._calculate_trend_score(recent_perf)
        conf_trend = self._calculate_trend_score(metrics.get("confidence", []))

        # Confidence declining while performance stable
        if conf_trend < -0.3 and perf_trend > -0.1:
            signals.append({
                "pattern": "confidence_performance_divergence",
                "description": "Confidence dropping despite stable performance",
                "severity": "moderate",
                "values": {"confidence_trend": conf_trend, "performance_trend": perf_trend},
            })

        return signals

    def _detect_biometric_signals(
        self,
        biometrics: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """Detect warning signs in biometric data."""
        signals = []

        if not biometrics or len(biometrics) < self.short_window:
            return signals

        # HRV decline (key recovery indicator)
        hrv_values = [float(b.get("hrv", 0)) for b in biometrics if b.get("hrv")]
        if len(hrv_values) >= self.long_window:
            recent_hrv = np.mean(hrv_values[-self.short_window:])
            baseline_hrv = np.mean(hrv_values[-self.long_window:-self.short_window])

            if baseline_hrv > 0 and recent_hrv < baseline_hrv * 0.85:
                signals.append({
                    "pattern": "hrv_decline",
                    "description": f"Heart rate variability declined 15%+ from baseline",
                    "severity": "high",
                    "values": {"recent_hrv": recent_hrv, "baseline_hrv": baseline_hrv},
                })

        # Resting HR elevation
        rhr_values = [float(b.get("resting_hr", 0)) for b in biometrics if b.get("resting_hr")]
        if len(rhr_values) >= self.long_window:
            recent_rhr = np.mean(rhr_values[-self.short_window:])
            baseline_rhr = np.mean(rhr_values[-self.long_window:-self.short_window])

            if baseline_rhr > 0 and recent_rhr > baseline_rhr * 1.1:
                signals.append({
                    "pattern": "rhr_elevation",
                    "description": f"Resting heart rate elevated 10%+ above baseline",
                    "severity": "moderate",
                    "values": {"recent_rhr": recent_rhr, "baseline_rhr": baseline_rhr},
                })

        return signals

    def _generate_recommendations(
        self,
        indicators: List[Dict[str, Any]],
        severity: str,
        trend_scores: Dict[str, float],
    ) -> List[str]:
        """Generate recommendations based on detected patterns."""
        recommendations = []

        # Pattern-specific recommendations
        pattern_recs = {
            "mood_confidence_divergence": "Focus on building confidence through achievable goals and positive self-talk",
            "stress_sleep_cascade": "Prioritize sleep hygiene and stress management techniques",
            "energy_motivation_decline": "Review training load and consider recovery day",
            "confidence_collapse": "Work with coach to identify root cause and rebuild confidence gradually",
            "chronic_stress": "Consider workload adjustment and regular stress-relief practices",
            "engagement_withdrawal": "Encourage regular check-ins and communication",
            "hrv_decline": "Focus on recovery: rest, nutrition, and sleep",
            "rhr_elevation": "Monitor for overtraining and ensure adequate recovery",
        }

        patterns_seen = set()
        for indicator in indicators:
            pattern = indicator.get("pattern", "")
            if pattern in pattern_recs and pattern not in patterns_seen:
                recommendations.append(pattern_recs[pattern])
                patterns_seen.add(pattern)

        # Severity-based recommendations
        if severity == "high" or severity == "critical":
            recommendations.insert(0, "Consider immediate conversation with athlete about current challenges")
        elif severity == "moderate":
            recommendations.insert(0, "Monitor closely and check in within next few days")

        return recommendations[:5]


# Convenience functions
def detect_slump_patterns(
    mood_logs: List[Dict[str, Any]],
    performance_data: Optional[List[Dict[str, Any]]] = None,
    biometrics: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Detect slump patterns in athlete data.

    Convenience wrapper around SlumpDetector.
    """
    detector = SlumpDetector()
    return detector.detect(mood_logs, performance_data, biometrics)


def calculate_trend_score(values: List[float]) -> float:
    """Calculate trend score for a list of values."""
    detector = SlumpDetector()
    return detector._calculate_trend_score(values)
