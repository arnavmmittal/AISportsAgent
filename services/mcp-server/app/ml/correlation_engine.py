"""
Correlation Engine

Statistical correlation analysis for multi-modal athlete data:
- Pearson correlation for linear relationships
- Spearman correlation for monotonic relationships
- Partial correlation controlling for confounders
- Lagged correlation for temporal patterns
- Statistical significance testing
"""

import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from app.core.logging import setup_logging

logger = setup_logging()

# Try to import scipy
try:
    from scipy import stats
    from scipy.stats import pearsonr, spearmanr, kendalltau
    SCIPY_AVAILABLE = True
except ImportError:
    SCIPY_AVAILABLE = False
    logger.warning("SciPy not available. Using basic correlation implementation.")


class CorrelationEngine:
    """
    Compute and analyze correlations in athlete data.

    Provides:
    - Pairwise correlations between all metrics
    - Statistical significance testing
    - Lagged correlation analysis
    - Correlation interpretation
    """

    # Metrics to correlate
    MOOD_METRICS = ["mood", "confidence", "stress", "energy", "sleep"]
    BIOMETRIC_METRICS = ["hrv", "resting_hr", "sleep_score", "recovery_score"]
    PERFORMANCE_METRICS = ["performance_rating", "practice_rating"]

    # Correlation interpretation thresholds
    CORRELATION_THRESHOLDS = {
        "very_weak": 0.2,
        "weak": 0.4,
        "moderate": 0.6,
        "strong": 0.8,
        "very_strong": 1.0,
    }

    def __init__(self, min_samples: int = 5, significance_level: float = 0.05):
        """
        Initialize correlation engine.

        Args:
            min_samples: Minimum samples required for correlation
            significance_level: P-value threshold for significance
        """
        self.min_samples = min_samples
        self.significance_level = significance_level

    def compute_correlations(
        self,
        mood_logs: List[Dict[str, Any]],
        biometrics: Optional[List[Dict[str, Any]]] = None,
        performance_data: Optional[List[Dict[str, Any]]] = None,
        method: str = "pearson",
    ) -> Dict[str, Any]:
        """
        Compute all pairwise correlations.

        Args:
            mood_logs: List of mood log entries
            biometrics: Optional biometric data
            performance_data: Optional performance outcomes
            method: Correlation method (pearson, spearman, kendall)

        Returns:
            Dictionary with:
            - correlation_matrix: Full pairwise correlations
            - significant_correlations: Only statistically significant
            - insights: Human-readable interpretations
            - strongest_correlations: Top positive and negative
        """
        # Align data by date
        aligned_data = self._align_data(mood_logs, biometrics, performance_data)

        if not aligned_data or len(aligned_data) < self.min_samples:
            return {
                "error": f"Insufficient data. Need at least {self.min_samples} aligned data points.",
                "sample_count": len(aligned_data) if aligned_data else 0,
            }

        # Extract metrics
        metrics_data = self._extract_metrics(aligned_data)

        # Compute correlation matrix
        correlation_matrix = {}
        significant_correlations = []
        all_correlations = []

        metric_names = list(metrics_data.keys())

        for i, m1 in enumerate(metric_names):
            correlation_matrix[m1] = {}
            for j, m2 in enumerate(metric_names):
                if i == j:
                    correlation_matrix[m1][m2] = {
                        "correlation": 1.0,
                        "p_value": 0.0,
                        "n": len(metrics_data[m1]),
                    }
                    continue

                if i < j:  # Only compute upper triangle
                    result = self._compute_correlation(
                        metrics_data[m1],
                        metrics_data[m2],
                        method,
                    )
                    correlation_matrix[m1][m2] = result

                    if result["p_value"] < self.significance_level:
                        significant_correlations.append({
                            "metric1": m1,
                            "metric2": m2,
                            **result,
                            "interpretation": self._interpret_correlation(
                                result["correlation"], m1, m2
                            ),
                        })

                    all_correlations.append({
                        "metric1": m1,
                        "metric2": m2,
                        **result,
                    })
                else:
                    # Copy from upper triangle
                    correlation_matrix[m1][m2] = correlation_matrix[m2][m1]

        # Sort correlations
        significant_correlations.sort(key=lambda x: abs(x["correlation"]), reverse=True)

        # Find strongest positive and negative
        positive_corrs = [c for c in all_correlations if c["correlation"] > 0]
        negative_corrs = [c for c in all_correlations if c["correlation"] < 0]

        positive_corrs.sort(key=lambda x: x["correlation"], reverse=True)
        negative_corrs.sort(key=lambda x: x["correlation"])

        # Generate insights
        insights = self._generate_insights(significant_correlations)

        return {
            "correlation_matrix": correlation_matrix,
            "significant_correlations": significant_correlations,
            "strongest_positive": positive_corrs[:5],
            "strongest_negative": negative_corrs[:5],
            "insights": insights,
            "sample_count": len(aligned_data),
            "method": method,
            "significance_level": self.significance_level,
        }

    def compute_lagged_correlations(
        self,
        mood_logs: List[Dict[str, Any]],
        target_metric: str,
        max_lag: int = 7,
    ) -> Dict[str, Any]:
        """
        Compute lagged correlations to find predictive relationships.

        Args:
            mood_logs: Time-ordered mood logs
            target_metric: The metric to predict
            max_lag: Maximum lag in days to test

        Returns:
            Dictionary with optimal lags for each predictor
        """
        # Sort by date
        sorted_logs = sorted(
            mood_logs,
            key=lambda x: x.get("date") or x.get("createdAt", ""),
        )

        if len(sorted_logs) < self.min_samples + max_lag:
            return {"error": "Insufficient data for lagged analysis"}

        # Extract target time series
        target_values = [
            float(log.get(target_metric, 5.0))
            for log in sorted_logs
            if log.get(target_metric) is not None
        ]

        results = {}

        for metric in self.MOOD_METRICS:
            if metric == target_metric:
                continue

            predictor_values = [
                float(log.get(metric, 5.0))
                for log in sorted_logs
                if log.get(metric) is not None
            ]

            if len(predictor_values) != len(target_values):
                continue

            lag_results = []
            for lag in range(1, max_lag + 1):
                if lag >= len(target_values):
                    break

                # Predictor at time t, target at time t+lag
                predictor_lagged = predictor_values[:-lag]
                target_lagged = target_values[lag:]

                if len(predictor_lagged) >= self.min_samples:
                    corr_result = self._compute_correlation(
                        predictor_lagged, target_lagged, "pearson"
                    )
                    lag_results.append({
                        "lag": lag,
                        **corr_result,
                    })

            if lag_results:
                # Find optimal lag
                best_lag = max(lag_results, key=lambda x: abs(x["correlation"]))
                results[metric] = {
                    "optimal_lag": best_lag["lag"],
                    "correlation": best_lag["correlation"],
                    "p_value": best_lag["p_value"],
                    "all_lags": lag_results,
                    "interpretation": f"{metric} at day T predicts {target_metric} at day T+{best_lag['lag']}",
                }

        return {
            "target_metric": target_metric,
            "lagged_correlations": results,
            "sample_count": len(sorted_logs),
        }

    def _align_data(
        self,
        mood_logs: List[Dict[str, Any]],
        biometrics: Optional[List[Dict[str, Any]]],
        performance_data: Optional[List[Dict[str, Any]]],
    ) -> List[Dict[str, Any]]:
        """Align data by date."""
        # Index mood logs by date
        mood_by_date = {}
        for log in mood_logs:
            date_str = self._extract_date_str(log.get("date") or log.get("createdAt"))
            if date_str:
                mood_by_date[date_str] = log

        # Add biometrics
        if biometrics:
            for bio in biometrics:
                date_str = self._extract_date_str(bio.get("date") or bio.get("createdAt"))
                if date_str and date_str in mood_by_date:
                    mood_by_date[date_str].update({
                        "hrv": bio.get("hrv"),
                        "resting_hr": bio.get("resting_hr") or bio.get("restingHr"),
                        "sleep_score": bio.get("sleep_score") or bio.get("sleepScore"),
                        "recovery_score": bio.get("recovery_score") or bio.get("recoveryScore"),
                    })

        # Add performance data
        if performance_data:
            for perf in performance_data:
                date_str = self._extract_date_str(perf.get("date") or perf.get("createdAt"))
                if date_str and date_str in mood_by_date:
                    mood_by_date[date_str].update({
                        "performance_rating": perf.get("rating") or perf.get("performance_rating"),
                        "practice_rating": perf.get("practice_rating"),
                    })

        return list(mood_by_date.values())

    def _extract_date_str(self, date_value: Any) -> Optional[str]:
        """Extract date string for alignment."""
        if isinstance(date_value, datetime):
            return date_value.strftime("%Y-%m-%d")
        if isinstance(date_value, str):
            try:
                dt = datetime.fromisoformat(date_value.replace("Z", "+00:00"))
                return dt.strftime("%Y-%m-%d")
            except ValueError:
                return None
        return None

    def _extract_metrics(
        self,
        aligned_data: List[Dict[str, Any]],
    ) -> Dict[str, List[float]]:
        """Extract metric arrays from aligned data."""
        all_metrics = (
            self.MOOD_METRICS +
            self.BIOMETRIC_METRICS +
            self.PERFORMANCE_METRICS
        )

        metrics_data = {}
        for metric in all_metrics:
            values = []
            for entry in aligned_data:
                value = entry.get(metric)
                if value is not None:
                    values.append(float(value))
                else:
                    values.append(np.nan)

            # Only include metrics with sufficient non-null values
            non_null_count = sum(1 for v in values if not np.isnan(v))
            if non_null_count >= self.min_samples:
                metrics_data[metric] = values

        return metrics_data

    def _compute_correlation(
        self,
        x: List[float],
        y: List[float],
        method: str = "pearson",
    ) -> Dict[str, Any]:
        """Compute correlation between two arrays."""
        # Handle missing values
        x_arr = np.array(x)
        y_arr = np.array(y)

        # Get indices where both are non-null
        valid_idx = ~(np.isnan(x_arr) | np.isnan(y_arr))
        x_valid = x_arr[valid_idx]
        y_valid = y_arr[valid_idx]

        if len(x_valid) < self.min_samples:
            return {
                "correlation": 0.0,
                "p_value": 1.0,
                "n": len(x_valid),
                "method": method,
            }

        try:
            if SCIPY_AVAILABLE:
                if method == "pearson":
                    corr, p_value = pearsonr(x_valid, y_valid)
                elif method == "spearman":
                    corr, p_value = spearmanr(x_valid, y_valid)
                elif method == "kendall":
                    corr, p_value = kendalltau(x_valid, y_valid)
                else:
                    corr, p_value = pearsonr(x_valid, y_valid)
            else:
                # Basic implementation without scipy
                corr = self._basic_pearson(x_valid, y_valid)
                # Approximate p-value
                n = len(x_valid)
                if abs(corr) == 1.0:
                    p_value = 0.0
                else:
                    t_stat = corr * np.sqrt((n - 2) / (1 - corr**2))
                    # Use normal approximation for p-value
                    p_value = 2 * (1 - 0.5 * (1 + np.tanh(abs(t_stat) / np.sqrt(2))))

            return {
                "correlation": float(corr),
                "p_value": float(p_value),
                "n": len(x_valid),
                "method": method,
            }

        except Exception as e:
            logger.warning(f"Correlation computation failed: {e}")
            return {
                "correlation": 0.0,
                "p_value": 1.0,
                "n": len(x_valid),
                "error": str(e),
            }

    def _basic_pearson(self, x: np.ndarray, y: np.ndarray) -> float:
        """Basic Pearson correlation without scipy."""
        n = len(x)
        mean_x = np.mean(x)
        mean_y = np.mean(y)

        numerator = np.sum((x - mean_x) * (y - mean_y))
        denominator = np.sqrt(np.sum((x - mean_x)**2) * np.sum((y - mean_y)**2))

        if denominator == 0:
            return 0.0

        return numerator / denominator

    def _interpret_correlation(
        self,
        correlation: float,
        metric1: str,
        metric2: str,
    ) -> str:
        """Generate human-readable interpretation."""
        abs_corr = abs(correlation)
        direction = "positive" if correlation > 0 else "negative"

        # Determine strength
        if abs_corr < self.CORRELATION_THRESHOLDS["very_weak"]:
            strength = "very weak"
        elif abs_corr < self.CORRELATION_THRESHOLDS["weak"]:
            strength = "weak"
        elif abs_corr < self.CORRELATION_THRESHOLDS["moderate"]:
            strength = "moderate"
        elif abs_corr < self.CORRELATION_THRESHOLDS["strong"]:
            strength = "strong"
        else:
            strength = "very strong"

        # Generate interpretation
        if direction == "positive":
            relationship = "increases with"
        else:
            relationship = "decreases as"

        return f"{strength.capitalize()} {direction} correlation: {metric1} {relationship} {metric2}"

    def _generate_insights(
        self,
        significant_correlations: List[Dict[str, Any]],
    ) -> List[str]:
        """Generate actionable insights from correlations."""
        insights = []

        # Known important relationships
        important_pairs = [
            (("sleep", "mood"), "Sleep quality strongly impacts mood"),
            (("stress", "sleep"), "High stress often disrupts sleep"),
            (("confidence", "performance_rating"), "Confidence correlates with performance"),
            (("hrv", "stress"), "HRV reflects stress levels"),
            (("energy", "mood"), "Energy levels influence mood"),
        ]

        for (m1, m2), insight_template in important_pairs:
            for corr in significant_correlations:
                if {corr["metric1"], corr["metric2"]} == {m1, m2}:
                    if abs(corr["correlation"]) > 0.4:
                        direction = "positively" if corr["correlation"] > 0 else "negatively"
                        insights.append(
                            f"{insight_template} ({direction} correlated, r={corr['correlation']:.2f})"
                        )
                    break

        # Add general insight about strongest correlation
        if significant_correlations:
            strongest = significant_correlations[0]
            insights.append(
                f"Strongest relationship: {strongest['interpretation']}"
            )

        return insights[:5]


# Convenience functions
def compute_correlations(
    mood_logs: List[Dict[str, Any]],
    biometrics: Optional[List[Dict[str, Any]]] = None,
    performance_data: Optional[List[Dict[str, Any]]] = None,
    method: str = "pearson",
) -> Dict[str, Any]:
    """
    Compute correlations for athlete data.

    Convenience wrapper around CorrelationEngine.
    """
    engine = CorrelationEngine()
    return engine.compute_correlations(mood_logs, biometrics, performance_data, method)


def find_significant_correlations(
    mood_logs: List[Dict[str, Any]],
    biometrics: Optional[List[Dict[str, Any]]] = None,
    significance_level: float = 0.05,
) -> List[Dict[str, Any]]:
    """
    Find statistically significant correlations.

    Returns only correlations with p-value below threshold.
    """
    engine = CorrelationEngine(significance_level=significance_level)
    results = engine.compute_correlations(mood_logs, biometrics)
    return results.get("significant_correlations", [])
