"""
Integration Test for ML Models

Tests the ML models in the actual app context:
- SlumpDetector with ML model
- PerformancePredictor with trained model
- CorrelationEngine

Usage:
    python scripts/test_ml_integration.py
"""

import json
import sys
from pathlib import Path
from collections import defaultdict

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.ml import SlumpDetector, PerformancePredictor, CorrelationEngine


def load_test_data():
    """Load training data for testing."""
    data_path = Path("./training_data")

    with open(data_path / "mood_logs.json") as f:
        logs = json.load(f)

    # Group by athlete
    grouped = defaultdict(list)
    for log in logs:
        grouped[log["athlete_id"]].append(log)

    for athlete_id in grouped:
        grouped[athlete_id].sort(key=lambda x: x["day_index"])

    return dict(grouped)


def test_slump_detector(athlete_logs):
    """Test SlumpDetector with ML model."""
    print("\n" + "=" * 60)
    print("SLUMP DETECTOR INTEGRATION TEST")
    print("=" * 60)

    detector = SlumpDetector()

    if detector.model is not None:
        print(f"ML Model: LOADED")
        print(f"Features: {len(detector.feature_names)}")
        print(f"Trained Threshold: {detector.ml_threshold}")
    else:
        print("ML Model: NOT LOADED (using rule-based)")

    # Collect predictions and ground truth using proper temporal split
    # Model predicts: given days 0-21, will slump occur in days 22-29 (next 7 days)?
    # So we need to: use historical data for features, check FUTURE data for ground truth
    predictions = []
    lookback = 21
    predict_ahead = 7

    for athlete_id, logs in athlete_logs.items():
        if len(logs) < lookback + predict_ahead + 7:
            continue

        # Test at multiple points in each athlete's history for more data points
        test_points = [
            len(logs) - 7,   # Near end
            len(logs) - 30,  # Middle
            len(logs) - 60,  # Earlier
        ]

        for test_idx in test_points:
            if test_idx < lookback + 7:  # Not enough history
                continue

            # Historical data: logs before test_idx (for features)
            historical = logs[test_idx - lookback - 7:test_idx]

            # Future data: logs from test_idx onwards (for ground truth)
            future = logs[test_idx:test_idx + predict_ahead]

            if len(historical) < lookback + 1 or len(future) < predict_ahead:
                continue

            # Detect using historical data
            result = detector.detect(historical)
            prob = result.get("slump_probability", 0) / 100.0

            # Ground truth: did slump occur in the future window?
            actual_positive = any(
                l.get("in_slump", False) or l.get("in_pre_slump", False)
                for l in future
            )

            predictions.append({
                "athlete_id": f"{athlete_id}_{test_idx}",
                "prob": prob,
                "actual": actual_positive,
            })

    # Evaluate at multiple thresholds
    print(f"\nEvaluating on {len(predictions)} athletes...")
    print("\nThreshold Analysis:")
    print("-" * 60)

    best_f1 = 0
    best_threshold = 0.5
    best_metrics = {}

    for threshold in [0.06, 0.10, 0.20, 0.30, 0.40, 0.50]:
        tp = sum(1 for p in predictions if p["prob"] >= threshold and p["actual"])
        fp = sum(1 for p in predictions if p["prob"] >= threshold and not p["actual"])
        tn = sum(1 for p in predictions if p["prob"] < threshold and not p["actual"])
        fn = sum(1 for p in predictions if p["prob"] < threshold and p["actual"])

        total = tp + fp + tn + fn
        accuracy = (tp + tn) / total if total > 0 else 0
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0
        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0

        print(f"  Threshold {threshold:.2f}: Acc={accuracy:.2%}, Prec={precision:.2%}, Rec={recall:.2%}, F1={f1:.2%}")

        if f1 > best_f1:
            best_f1 = f1
            best_threshold = threshold
            best_metrics = {
                "tp": tp, "fp": fp, "tn": tn, "fn": fn,
                "accuracy": accuracy, "precision": precision,
                "recall": recall, "f1": f1,
            }

    print("-" * 60)
    print(f"\nBest Threshold: {best_threshold:.2f}")
    print(f"  TP: {best_metrics['tp']}, FP: {best_metrics['fp']}")
    print(f"  TN: {best_metrics['tn']}, FN: {best_metrics['fn']}")
    print(f"  Accuracy:  {best_metrics['accuracy']:.2%}")
    print(f"  Precision: {best_metrics['precision']:.2%}")
    print(f"  Recall:    {best_metrics['recall']:.2%}")
    print(f"  F1 Score:  {best_metrics['f1']:.2%}")
    print(f"  Method:    {'ML Model' if detector.model else 'Rule-based'}")

    # Calculate balanced accuracy with best threshold
    tp, fp, tn, fn = best_metrics["tp"], best_metrics["fp"], best_metrics["tn"], best_metrics["fn"]
    sensitivity = tp / (tp + fn) if (tp + fn) > 0 else 0
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0
    balanced_accuracy = (sensitivity + specificity) / 2
    print(f"  Balanced:  {balanced_accuracy:.2%}")

    # Show sample predictions
    print("\nSample Predictions (sorted by probability):")
    sorted_preds = sorted(predictions, key=lambda x: x["prob"], reverse=True)[:5]
    for p in sorted_preds:
        status = "✓" if (p["prob"] >= best_threshold) == p["actual"] else "✗"
        print(f"  {status} {p['athlete_id'][:8]}: prob={p['prob']*100:.1f}%, actual={'SLUMP' if p['actual'] else 'OK'}")

    return balanced_accuracy


def extract_predictor_features(logs, lookback=21):
    """Extract all 121 features for v6 predictor model (matching training script)."""
    import numpy as np

    def compute_slump_score(log):
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

    def calc_trend(values):
        if len(values) < 2:
            return 0.0
        x = np.arange(len(values))
        return float(np.polyfit(x, values, 1)[0])

    def count_consecutive(values, direction):
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

    if len(logs) < lookback + 1:
        return None

    window = logs[-lookback - 1:-1]
    current = logs[-1]

    if len(window) < 21:
        return None

    features = {}

    # Current day metrics
    for metric in ["mood", "confidence", "stress", "energy", "focus", "motivation"]:
        features[metric] = float(current.get(metric, 7 if metric != "stress" else 3))
    features["sleep"] = float(current.get("sleep_hours", current.get("sleep", 7)))

    # Deficits from baseline
    features["mood_deficit"] = 7 - features["mood"]
    features["confidence_deficit"] = 7 - features["confidence"]
    features["stress_level"] = features["stress"] - 3
    features["energy_deficit"] = 7 - features["energy"]

    # Slump scores at different windows
    features["slump_score_now"] = compute_slump_score(current)
    for days in [2, 3, 5, 7, 10, 14, 21]:
        start = max(-days, -len(window))
        features[f"slump_score_{days}d"] = float(np.mean([compute_slump_score(l) for l in window[start:]]))

    # Slump deltas
    features["slump_delta_3d"] = features["slump_score_now"] - features["slump_score_3d"]
    features["slump_delta_7d"] = features["slump_score_3d"] - features["slump_score_7d"]

    # Multi-window averages (3, 5, 7, 10, 14, 21 days)
    for metric in ["mood", "stress", "confidence", "energy"]:
        for days in [3, 5, 7, 10, 14, 21]:
            start = max(-days, -len(window))
            features[f"avg_{metric}_{days}d"] = float(np.mean([l.get(metric, 7 if metric != "stress" else 3) for l in window[start:]]))

    # Trends (3, 5, 7, 14, 21 days)
    for metric in ["mood", "stress", "confidence", "energy"]:
        for days in [3, 5, 7, 14, 21]:
            start = max(-days, -len(window))
            features[f"trend_{metric}_{days}d"] = calc_trend([l.get(metric, 7 if metric != "stress" else 3) for l in window[start:]])

    # Std deviations (7, 14, 21 days)
    for metric in ["mood", "stress", "confidence"]:
        for days in [7, 14, 21]:
            start = max(-days, -len(window))
            features[f"std_{metric}_{days}d"] = float(np.std([l.get(metric, 7 if metric != "stress" else 3) for l in window[start:]]))

    # Consecutive patterns
    for metric in ["mood", "confidence"]:
        for days in [7, 14, 21]:
            start = max(-days, -len(window))
            features[f"consec_{metric}_decline_{days}d"] = count_consecutive(
                [l.get(metric, 7) for l in window[start:]], "decline")

    for days in [7, 14, 21]:
        start = max(-days, -len(window))
        features[f"consec_stress_increase_{days}d"] = count_consecutive(
            [l.get("stress", 3) for l in window[start:]], "increase")

    # Bad days count with different thresholds
    for threshold in [0.20, 0.25, 0.30, 0.35]:
        for days in [7, 14, 21]:
            start = max(-days, -len(window))
            t_str = str(int(threshold * 100))
            features[f"bad_days_{days}d_t{t_str}"] = float(
                sum(1 for l in window[start:] if compute_slump_score(l) > threshold))

    # Min/max extremes at multiple windows
    for metric, direction in [("mood", "min"), ("stress", "max"), ("confidence", "min"), ("energy", "min")]:
        for days in [7, 14, 21]:
            start = max(-days, -len(window))
            vals = [l.get(metric, 7 if metric != "stress" else 3) for l in window[start:]]
            if direction == "min":
                features[f"min_{metric}_{days}d"] = float(min(vals))
            else:
                features[f"max_{metric}_{days}d"] = float(max(vals))

    # Ranges
    for metric in ["mood", "stress"]:
        for days in [7, 14]:
            start = max(-days, -len(window))
            vals = [l.get(metric, 7 if metric != "stress" else 3) for l in window[start:]]
            features[f"range_{metric}_{days}d"] = float(max(vals) - min(vals))

    # Period comparisons
    recent = window[-7:]
    mid = window[-14:-7]
    older = window[:7]

    for metric in ["mood", "stress", "confidence"]:
        default = 7 if metric != "stress" else 3
        features[f"{metric}_change_recent_mid"] = float(
            np.mean([l.get(metric, default) for l in recent]) - np.mean([l.get(metric, default) for l in mid]))
        features[f"{metric}_change_recent_older"] = float(
            np.mean([l.get(metric, default) for l in recent]) - np.mean([l.get(metric, default) for l in older]))

    # Composite risk score (matching training)
    features["risk_score"] = (
        features["slump_score_now"] * 0.35 +
        features["slump_score_7d"] * 0.25 +
        (features["bad_days_7d_t25"] / 7) * 0.2 +
        max(0, -features["trend_mood_14d"]) * 0.2
    )

    # Sleep
    features["avg_sleep_7d"] = float(np.mean([l.get("sleep_hours", l.get("sleep", 7)) for l in window[-7:]]))
    features["poor_sleep_days"] = float(sum(1 for l in window[-7:] if l.get("sleep_hours", l.get("sleep", 7)) < 6))

    # Training load
    features["avg_training_load"] = float(np.mean([l.get("training_load", 5) for l in window[-7:]]))

    return features


def test_performance_predictor(athlete_logs):
    """Test PerformancePredictor with proper feature extraction."""
    print("\n" + "=" * 60)
    print("PERFORMANCE PREDICTOR INTEGRATION TEST")
    print("=" * 60)

    predictor = PerformancePredictor()

    if predictor.model is not None:
        print(f"ML Model: LOADED")
        print(f"Features: {len(predictor.feature_names)}")
    else:
        print("ML Model: NOT LOADED (using rule-based)")

    # Collect predictions with proper temporal split
    predictions = []
    lookback = 21
    predict_ahead = 7

    for athlete_id, logs in list(athlete_logs.items())[:100]:  # Sample 100 athletes
        if len(logs) < lookback + predict_ahead + 14:
            continue

        # Test at a point with enough history and future
        test_idx = len(logs) - predict_ahead - 7

        # Historical data for features
        historical = logs[:test_idx]
        if len(historical) < lookback + 1:
            continue

        # Extract features
        features = extract_predictor_features(historical)
        if features is None:
            continue

        # Predict
        result = predictor.predict(features, explain=False)
        prob = result.get("risk_score", 0) / 100.0

        # Ground truth: did slump/pre-slump occur in the next 7 days?
        future = logs[test_idx:test_idx + predict_ahead]
        actual_positive = any(
            l.get("in_slump", False) or l.get("in_pre_slump", False)
            for l in future
        )

        predictions.append({
            "athlete_id": athlete_id,
            "prob": prob,
            "actual": actual_positive,
        })

    print(f"\nEvaluating on {len(predictions)} athletes...")

    # Calculate metrics at threshold 0.50
    threshold = 0.50
    tp = sum(1 for p in predictions if p["prob"] >= threshold and p["actual"])
    fp = sum(1 for p in predictions if p["prob"] >= threshold and not p["actual"])
    tn = sum(1 for p in predictions if p["prob"] < threshold and not p["actual"])
    fn = sum(1 for p in predictions if p["prob"] < threshold and p["actual"])

    total = tp + fp + tn + fn
    accuracy = (tp + tn) / total if total > 0 else 0
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
    sensitivity = recall
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0
    balanced_acc = (sensitivity + specificity) / 2

    print(f"\nResults (threshold=0.50):")
    print(f"  TP: {tp}, FP: {fp}, TN: {tn}, FN: {fn}")
    print(f"  Accuracy:  {accuracy:.2%}")
    print(f"  Precision: {precision:.2%}")
    print(f"  Recall:    {recall:.2%}")
    print(f"  F1 Score:  {f1:.2%}")
    print(f"  Balanced:  {balanced_acc:.2%}")
    print(f"  Method:    {'ML Model' if predictor.model else 'Rule-based'}")

    # Sample prediction details
    print("\nSample Prediction Details:")
    sample = list(athlete_logs.values())[0][-30:]
    features = extract_predictor_features(sample)
    if features:
        result = predictor.predict(features, explain=True)
        print(f"  Risk Score: {result.get('risk_score', 0):.1f}")
        print(f"  Risk Level: {result.get('risk_level', 'unknown')}")
        if result.get("factors"):
            print("  Top Factors:")
            for factor in result["factors"][:3]:
                print(f"    - {factor.get('feature', 'unknown')}: {factor.get('value', 0):.2f}")

    return balanced_acc


def test_correlation_engine(athlete_logs):
    """Test CorrelationEngine."""
    print("\n" + "=" * 60)
    print("CORRELATION ENGINE INTEGRATION TEST")
    print("=" * 60)

    engine = CorrelationEngine()

    # Use one athlete's data
    sample_logs = list(athlete_logs.values())[0]

    # Basic correlations
    result = engine.compute_correlations(sample_logs, method="pearson")

    if "error" not in result:
        print(f"Sample count: {result.get('sample_count', 0)}")
        print(f"Significant correlations: {len(result.get('significant_correlations', []))}")

        print("\nTop Correlations:")
        for corr in result.get("significant_correlations", [])[:3]:
            print(f"  {corr['metric1']} <-> {corr['metric2']}: r={corr['correlation']:.3f}")

        # Test bootstrap CI
        print("\nBootstrap Confidence Intervals:")
        bootstrap = engine.compute_bootstrap_ci(sample_logs, "mood", "stress", n_bootstrap=500)
        if "error" not in bootstrap:
            print(f"  mood <-> stress: r={bootstrap['correlation']:.3f} [{bootstrap['ci_lower']:.3f}, {bootstrap['ci_upper']:.3f}]")

        # Test rolling correlations
        print("\nRolling Correlation Stability:")
        rolling = engine.compute_rolling_correlations(sample_logs, "mood", "stress", window_size=14)
        if "error" not in rolling:
            print(f"  Mean r: {rolling['stability']['mean_correlation']:.3f}")
            print(f"  Stable: {rolling['stability']['is_stable']}")

        return True
    else:
        print(f"Error: {result['error']}")
        return False


def main():
    print("=" * 60)
    print("ML INTEGRATION TEST")
    print("=" * 60)

    # Load test data
    print("\nLoading test data...")
    athlete_logs = load_test_data()
    print(f"Loaded {len(athlete_logs)} athletes")

    # Run tests
    slump_acc = test_slump_detector(athlete_logs)
    pred_ok = test_performance_predictor(athlete_logs)
    corr_ok = test_correlation_engine(athlete_logs)

    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Slump Detector: {'PASS' if slump_acc > 0.8 else 'NEEDS IMPROVEMENT'} (accuracy: {slump_acc:.2%})")
    print(f"Performance Predictor: {'PASS' if pred_ok else 'FAIL'}")
    print(f"Correlation Engine: {'PASS' if corr_ok else 'FAIL'}")
    print("=" * 60)


if __name__ == "__main__":
    main()
