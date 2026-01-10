"""
Slump Detector

Detects performance slumps and mental decline patterns using:
- Moving average analysis
- Pattern matching for common slump signatures
- Temporal trend analysis
- Multi-metric correlation

Identifies early warning signs before significant performance drops.
"""

import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from app.core.logging import setup_logging

logger = setup_logging()


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

    def __init__(
        self,
        short_window: int = 3,
        long_window: int = 14,
        decline_threshold: float = 0.5,
        volatility_threshold: float = 2.0,
    ):
        """
        Initialize slump detector.

        Args:
            short_window: Days for short-term average
            long_window: Days for long-term average
            decline_threshold: Points drop to flag decline
            volatility_threshold: Std devs for volatility spike
        """
        self.short_window = short_window
        self.long_window = long_window
        self.decline_threshold = decline_threshold
        self.volatility_threshold = volatility_threshold

    def detect(
        self,
        mood_logs: List[Dict[str, Any]],
        performance_data: Optional[List[Dict[str, Any]]] = None,
        biometrics: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Detect slump patterns in athlete data.

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

        # 5. Performance correlation (if available)
        if performance_data:
            perf_signals = self._detect_performance_divergence(metrics, performance_data)
            indicators.extend(perf_signals)

        # 6. Biometric signals (if available)
        if biometrics:
            bio_signals = self._detect_biometric_signals(biometrics)
            indicators.extend(bio_signals)

        result["indicators"] = indicators

        # Calculate overall slump probability
        if indicators:
            severity_weights = {"low": 0.2, "moderate": 0.4, "high": 0.6, "critical": 0.8}
            total_weight = sum(
                severity_weights.get(ind.get("severity", "low"), 0.2)
                for ind in indicators
            )
            result["slump_probability"] = min(100, total_weight * 30)

            # Determine if slump detected
            result["slump_detected"] = result["slump_probability"] > 40

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

        metrics = {
            "mood": [],
            "confidence": [],
            "stress": [],
            "energy": [],
            "sleep": [],
        }

        for log in sorted_logs:
            for metric in metrics.keys():
                value = log.get(metric)
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
        min_consecutive: int = 3,
    ) -> List[Dict[str, Any]]:
        """Detect consecutive days of decline."""
        signals = []

        for metric, values in metrics.items():
            if len(values) < min_consecutive + 1:
                continue

            # Count consecutive declines
            consecutive = 0
            max_consecutive = 0

            for i in range(1, len(values)):
                # For stress, increasing is bad
                if metric == "stress":
                    if values[i] > values[i - 1]:
                        consecutive += 1
                        max_consecutive = max(max_consecutive, consecutive)
                    else:
                        consecutive = 0
                else:
                    if values[i] < values[i - 1]:
                        consecutive += 1
                        max_consecutive = max(max_consecutive, consecutive)
                    else:
                        consecutive = 0

            if max_consecutive >= min_consecutive:
                signals.append({
                    "pattern": f"consecutive_{metric}_{'increase' if metric == 'stress' else 'decline'}",
                    "metric": metric,
                    "description": f"{max_consecutive} consecutive days of {metric} {'increase' if metric == 'stress' else 'decline'}",
                    "severity": "moderate" if max_consecutive < 5 else "high",
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

        # Mood-confidence divergence
        mood_trend = trend_scores.get("mood", 0)
        conf_trend = trend_scores.get("confidence", 0)

        if mood_trend > -0.2 and conf_trend < -0.3:
            signals.append({
                "pattern": "mood_confidence_divergence",
                "description": self.SLUMP_PATTERNS["mood_confidence_divergence"]["description"],
                "severity": self.SLUMP_PATTERNS["mood_confidence_divergence"]["severity"],
                "values": {"mood_trend": mood_trend, "confidence_trend": conf_trend},
            })

        # Stress-sleep cascade
        stress_values = metrics.get("stress", [])
        sleep_values = metrics.get("sleep", [])

        if len(stress_values) >= self.short_window and len(sleep_values) >= self.short_window:
            recent_stress = np.mean(stress_values[-self.short_window:])
            recent_sleep = np.mean(sleep_values[-self.short_window:])

            if recent_stress > 7 and recent_sleep < 5:
                signals.append({
                    "pattern": "stress_sleep_cascade",
                    "description": self.SLUMP_PATTERNS["stress_sleep_cascade"]["description"],
                    "severity": self.SLUMP_PATTERNS["stress_sleep_cascade"]["severity"],
                    "values": {"recent_stress": recent_stress, "recent_sleep": recent_sleep},
                })

        # Energy-motivation decline
        energy_trend = trend_scores.get("energy", 0)
        if energy_trend < -0.3 and mood_trend < -0.2:
            signals.append({
                "pattern": "energy_motivation_decline",
                "description": self.SLUMP_PATTERNS["energy_motivation_decline"]["description"],
                "severity": self.SLUMP_PATTERNS["energy_motivation_decline"]["severity"],
                "values": {"energy_trend": energy_trend, "mood_trend": mood_trend},
            })

        # Confidence collapse (rapid drop)
        if conf_trend < -0.5:
            signals.append({
                "pattern": "confidence_collapse",
                "description": self.SLUMP_PATTERNS["confidence_collapse"]["description"],
                "severity": self.SLUMP_PATTERNS["confidence_collapse"]["severity"],
                "values": {"confidence_trend": conf_trend},
            })

        # Chronic stress
        if stress_values and len(stress_values) >= self.long_window:
            long_stress_avg = np.mean(stress_values[-self.long_window:])
            if long_stress_avg > 7:
                signals.append({
                    "pattern": "chronic_stress",
                    "description": self.SLUMP_PATTERNS["chronic_stress"]["description"],
                    "severity": self.SLUMP_PATTERNS["chronic_stress"]["severity"],
                    "values": {"average_stress": long_stress_avg},
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
