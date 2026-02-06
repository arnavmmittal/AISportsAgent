"""
Validate ML Models with Synthetic Training Data

Tests all ML components against the generated synthetic data:
- SlumpDetector: Accuracy of slump detection
- PerformancePredictor: Risk prediction accuracy
- InterventionRecommender: Recommendation relevance

Usage:
    python scripts/validate_ml_models.py
    python scripts/validate_ml_models.py --data ./training_data --verbose
"""

import argparse
import json
import sys
from pathlib import Path
from typing import List, Dict, Any
from datetime import datetime
from collections import defaultdict

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.logging import setup_logging

logger = setup_logging()


def load_training_data(data_dir: str) -> Dict[str, Any]:
    """Load synthetic training data."""
    data_path = Path(data_dir)

    with open(data_path / "athlete_profiles.json") as f:
        profiles = json.load(f)

    with open(data_path / "mood_logs.json") as f:
        logs = json.load(f)

    with open(data_path / "statistics.json") as f:
        stats = json.load(f)

    return {
        "profiles": profiles,
        "logs": logs,
        "statistics": stats,
    }


def group_logs_by_athlete(logs: List[Dict]) -> Dict[str, List[Dict]]:
    """Group mood logs by athlete ID."""
    grouped = defaultdict(list)
    for log in logs:
        grouped[log["athlete_id"]].append(log)

    # Sort each athlete's logs by day index
    for athlete_id in grouped:
        grouped[athlete_id].sort(key=lambda x: x["day_index"])

    return dict(grouped)


def test_slump_detector(athlete_logs: Dict[str, List[Dict]], verbose: bool = False) -> Dict[str, Any]:
    """Test slump detector accuracy."""
    from app.ml import SlumpDetector

    detector = SlumpDetector()

    results = {
        "total_athletes": len(athlete_logs),
        "athletes_with_slumps": 0,
        "true_positives": 0,
        "false_positives": 0,
        "true_negatives": 0,
        "false_negatives": 0,
        "detection_details": [],
    }

    for athlete_id, logs in athlete_logs.items():
        # Get ground truth - any slump in data
        has_actual_slump = any(log.get("in_slump", False) for log in logs)
        if has_actual_slump:
            results["athletes_with_slumps"] += 1

        # Get slump days for more granular analysis
        slump_days = [log["day_index"] for log in logs if log.get("in_slump", False)]

        # Run detector on last 30 days of data
        recent_logs = logs[-30:]

        # Convert to format expected by detector
        mood_logs = [
            {
                "date": log["date"],
                "mood": log["mood"],
                "confidence": log["confidence"],
                "stress": log["stress"],
                "energy": log["energy"],
                "sleep_hours": log["sleep_hours"],
            }
            for log in recent_logs
        ]

        try:
            detection = detector.detect(mood_logs)
            detected_slump = detection.get("slump_detected", False)
            probability = detection.get("slump_probability", 0)

            # Check if recent window contains slump (last 30 days)
            recent_has_slump = any(log.get("in_slump", False) for log in recent_logs)

            if detected_slump and recent_has_slump:
                results["true_positives"] += 1
            elif detected_slump and not recent_has_slump:
                results["false_positives"] += 1
            elif not detected_slump and not recent_has_slump:
                results["true_negatives"] += 1
            else:
                results["false_negatives"] += 1

            if verbose and (detected_slump or recent_has_slump):
                results["detection_details"].append({
                    "athlete_id": athlete_id,
                    "actual_slump": recent_has_slump,
                    "detected": detected_slump,
                    "probability": probability,
                    "slump_type": detection.get("slump_type"),
                })

        except Exception as e:
            logger.warning(f"Slump detection failed for {athlete_id}: {e}")

    # Calculate metrics
    tp, fp, tn, fn = (
        results["true_positives"],
        results["false_positives"],
        results["true_negatives"],
        results["false_negatives"],
    )

    results["accuracy"] = (tp + tn) / (tp + tn + fp + fn) if (tp + tn + fp + fn) > 0 else 0
    results["precision"] = tp / (tp + fp) if (tp + fp) > 0 else 0
    results["recall"] = tp / (tp + fn) if (tp + fn) > 0 else 0
    results["f1_score"] = (
        2 * results["precision"] * results["recall"] / (results["precision"] + results["recall"])
        if (results["precision"] + results["recall"]) > 0
        else 0
    )

    return results


def test_predictor(athlete_logs: Dict[str, List[Dict]], verbose: bool = False) -> Dict[str, Any]:
    """Test performance predictor."""
    from app.ml import PerformancePredictor
    # Use same feature extraction as training
    from scripts.train_predictor import extract_features as training_extract_features

    predictor = PerformancePredictor()

    results = {
        "total_predictions": 0,
        "high_risk_predictions": 0,
        "predictions_before_slump": 0,
        "correct_high_risk": 0,
        "prediction_samples": [],
    }

    for athlete_id, logs in athlete_logs.items():
        # Skip athletes with fewer than 21 days
        if len(logs) < 21:
            continue

        # Predict risk at day 14 based on first 14 days
        # Then check if slump occurs in days 14-21
        training_logs = logs[:14]
        future_logs = logs[14:21]

        try:
            # Extract features using same function as training
            features = training_extract_features(training_logs)

            if features is None:
                continue

            # Predict directly with model (bypass PerformancePredictor wrapper)
            import numpy as np
            feature_vector = np.array([[features[f] for f in predictor.feature_names]])
            prob = predictor.model.predict_proba(feature_vector)[0][1]
            risk_score = prob * 100

            # Map to risk level
            if risk_score >= 70:
                risk_level = "critical"
            elif risk_score >= 50:
                risk_level = "high"
            elif risk_score >= 30:
                risk_level = "medium"
            else:
                risk_level = "low"

            prediction = {"risk_score": risk_score, "risk_level": risk_level}
            risk_score = prediction.get("risk_score", 0)
            risk_level = prediction.get("risk_level", "unknown")

            results["total_predictions"] += 1

            # Check if slump actually occurred
            future_had_slump = any(log.get("in_slump", False) for log in future_logs)

            if risk_level in ["high", "critical"]:
                results["high_risk_predictions"] += 1
                if future_had_slump:
                    results["correct_high_risk"] += 1

            if future_had_slump:
                results["predictions_before_slump"] += 1

            if verbose and (risk_level in ["high", "critical"] or future_had_slump):
                results["prediction_samples"].append({
                    "athlete_id": athlete_id,
                    "risk_score": risk_score,
                    "risk_level": risk_level,
                    "future_slump": future_had_slump,
                })

        except Exception as e:
            logger.warning(f"Prediction failed for {athlete_id}: {e}")

    # Calculate precision for high-risk predictions
    if results["high_risk_predictions"] > 0:
        results["high_risk_precision"] = (
            results["correct_high_risk"] / results["high_risk_predictions"]
        )
    else:
        results["high_risk_precision"] = 0

    return results


def test_intervention_recommender(athlete_logs: Dict[str, List[Dict]], verbose: bool = False) -> Dict[str, Any]:
    """Test intervention recommender."""
    from app.ml import InterventionRecommender

    recommender = InterventionRecommender()

    results = {
        "total_recommendations": 0,
        "intervention_types": defaultdict(int),
        "sample_recommendations": [],
    }

    for athlete_id, logs in list(athlete_logs.items())[:10]:  # Test first 10 athletes
        recent_logs = logs[-7:]  # Last week

        # Build athlete state
        avg_mood = sum(l["mood"] for l in recent_logs) / len(recent_logs)
        avg_stress = sum(l["stress"] for l in recent_logs) / len(recent_logs)
        avg_confidence = sum(l["confidence"] for l in recent_logs) / len(recent_logs)
        avg_sleep = sum(l["sleep_hours"] for l in recent_logs) / len(recent_logs)

        athlete_state = {
            "mood": avg_mood,
            "stress": avg_stress,
            "confidence": avg_confidence,
            "energy": sum(l["energy"] for l in recent_logs) / len(recent_logs),
            "sleep_hours": avg_sleep,
        }

        # Build risk factors from athlete state
        risk_factors = []
        if avg_stress > 6:
            risk_factors.append({"type": "high_stress", "value": avg_stress, "severity": "moderate"})
        if avg_mood < 5:
            risk_factors.append({"type": "low_mood", "value": avg_mood, "severity": "moderate"})
        if avg_confidence < 5:
            risk_factors.append({"type": "low_confidence", "value": avg_confidence, "severity": "moderate"})
        if avg_sleep < 6:
            risk_factors.append({"type": "poor_sleep", "value": avg_sleep, "severity": "low"})

        # If no risk factors, add a general one
        if not risk_factors:
            risk_factors.append({"type": "maintenance", "value": 0, "severity": "low"})

        try:
            result = recommender.recommend(
                risk_factors=risk_factors,
                context="TRAINING",  # Default context
            )

            recommendations = result.get("recommendations", [])
            results["total_recommendations"] += len(recommendations)

            for rec in recommendations:
                # Get intervention details
                int_id = rec.get("intervention_id", "")
                int_info = recommender.INTERVENTIONS.get(int_id, {})
                int_type = int_info.get("type", "unknown")
                results["intervention_types"][int_type] += 1

            if verbose and recommendations:
                results["sample_recommendations"].append({
                    "athlete_id": athlete_id,
                    "state": athlete_state,
                    "risk_factors": [r["type"] for r in risk_factors],
                    "recommendations": [
                        {
                            "id": r.get("intervention_id"),
                            "score": r.get("score"),
                        }
                        for r in recommendations[:3]
                    ],
                })

        except Exception as e:
            logger.warning(f"Recommendation failed for {athlete_id}: {e}")

    results["intervention_types"] = dict(results["intervention_types"])
    return results


def print_results(results: Dict[str, Dict], verbose: bool = False):
    """Print validation results."""
    print("\n" + "=" * 70)
    print("ML MODEL VALIDATION RESULTS")
    print("=" * 70)

    # Slump Detector Results
    slump = results["slump_detector"]
    print("\n--- SLUMP DETECTOR ---")
    print(f"Total Athletes Tested: {slump['total_athletes']}")
    print(f"Athletes with Slumps: {slump['athletes_with_slumps']}")
    print(f"\nConfusion Matrix:")
    print(f"  True Positives:  {slump['true_positives']}")
    print(f"  False Positives: {slump['false_positives']}")
    print(f"  True Negatives:  {slump['true_negatives']}")
    print(f"  False Negatives: {slump['false_negatives']}")
    print(f"\nMetrics:")
    print(f"  Accuracy:  {slump['accuracy']:.2%}")
    print(f"  Precision: {slump['precision']:.2%}")
    print(f"  Recall:    {slump['recall']:.2%}")
    print(f"  F1 Score:  {slump['f1_score']:.2%}")

    if verbose and slump.get("detection_details"):
        print(f"\nSample Detections:")
        for d in slump["detection_details"][:5]:
            status = "TP" if d["actual_slump"] and d["detected"] else \
                     "FP" if d["detected"] else \
                     "FN" if d["actual_slump"] else "TN"
            print(f"  [{status}] {d['athlete_id']}: prob={d['probability']:.0f}%, type={d.get('slump_type', 'N/A')}")

    # Predictor Results
    pred = results["predictor"]
    print("\n--- PERFORMANCE PREDICTOR ---")
    print(f"Total Predictions: {pred['total_predictions']}")
    print(f"High Risk Predictions: {pred['high_risk_predictions']}")
    print(f"Predictions Before Actual Slump: {pred['predictions_before_slump']}")
    print(f"Correct High Risk: {pred['correct_high_risk']}")
    print(f"High Risk Precision: {pred['high_risk_precision']:.2%}")

    if verbose and pred.get("prediction_samples"):
        print(f"\nSample Predictions:")
        for p in pred["prediction_samples"][:5]:
            marker = "!" if p["future_slump"] else " "
            print(f"  {marker} {p['athlete_id']}: risk={p['risk_score']:.1f}, level={p['risk_level']}, slump={p['future_slump']}")

    # Recommender Results
    rec = results["recommender"]
    print("\n--- INTERVENTION RECOMMENDER ---")
    print(f"Total Recommendations: {rec['total_recommendations']}")
    print(f"Intervention Types:")
    for int_type, count in sorted(rec["intervention_types"].items(), key=lambda x: -x[1]):
        print(f"  {int_type}: {count}")

    if verbose and rec.get("sample_recommendations"):
        print(f"\nSample Recommendations:")
        for s in rec["sample_recommendations"][:3]:
            print(f"  Athlete {s['athlete_id']} (mood={s['state']['mood']:.1f}, stress={s['state']['stress']:.1f}):")
            print(f"    Risk factors: {s.get('risk_factors', [])}")
            for r in s["recommendations"]:
                print(f"    - {r.get('id', 'unknown')} (score={r.get('score', 0):.2f})")

    print("\n" + "=" * 70)

    # Overall Assessment
    print("\nOVERALL ASSESSMENT:")

    issues = []
    if slump["accuracy"] < 0.6:
        issues.append("Slump detector accuracy below 60%")
    if slump["recall"] < 0.5:
        issues.append("Slump detector recall below 50% (missing slumps)")
    if pred["high_risk_precision"] < 0.3:
        issues.append("Predictor high-risk precision below 30%")
    if rec["total_recommendations"] == 0:
        issues.append("No interventions recommended")

    if issues:
        print("ISSUES TO ADDRESS:")
        for issue in issues:
            print(f"  - {issue}")
    else:
        print("All models performing within acceptable ranges.")
        print("Ready for staging deployment testing.")

    print("=" * 70 + "\n")


def main():
    parser = argparse.ArgumentParser(
        description="Validate ML models with synthetic training data"
    )
    parser.add_argument(
        "--data",
        type=str,
        default="./training_data",
        help="Path to training data directory"
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Show detailed output"
    )

    args = parser.parse_args()

    # Load data
    print(f"Loading training data from {args.data}...")
    data = load_training_data(args.data)
    print(f"Loaded {len(data['profiles'])} athletes, {len(data['logs'])} mood logs")

    # Group logs by athlete
    athlete_logs = group_logs_by_athlete(data["logs"])

    # Run validations
    print("\nRunning ML model validations...")

    results = {}

    print("  Testing Slump Detector...")
    results["slump_detector"] = test_slump_detector(athlete_logs, verbose=args.verbose)

    print("  Testing Performance Predictor...")
    results["predictor"] = test_predictor(athlete_logs, verbose=args.verbose)

    print("  Testing Intervention Recommender...")
    results["recommender"] = test_intervention_recommender(athlete_logs, verbose=args.verbose)

    # Print results
    print_results(results, verbose=args.verbose)

    # Save results
    output_path = Path(args.data) / "validation_results.json"
    with open(output_path, "w") as f:
        # Convert defaultdict to dict for JSON serialization
        json.dump(results, f, indent=2, default=str)
    print(f"Results saved to {output_path}")


if __name__ == "__main__":
    main()
