"""
Train XGBoost Performance Predictor

Trains the performance prediction model using synthetic or real data.
Saves trained model with SHAP explainer for production use.

Usage:
    python scripts/train_predictor.py
    python scripts/train_predictor.py --data ./training_data --output ./models
"""

import argparse
import json
import pickle
import sys
from pathlib import Path
from typing import List, Dict, Any, Tuple
from collections import defaultdict

import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
import shap

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.logging import setup_logging

logger = setup_logging()


def load_training_data(data_dir: str) -> Tuple[List[Dict], List[Dict]]:
    """Load training data from generated files."""
    data_path = Path(data_dir)

    with open(data_path / "athlete_profiles.json") as f:
        profiles = json.load(f)

    with open(data_path / "mood_logs.json") as f:
        logs = json.load(f)

    return profiles, logs


def group_logs_by_athlete(logs: List[Dict]) -> Dict[str, List[Dict]]:
    """Group mood logs by athlete ID."""
    grouped = defaultdict(list)
    for log in logs:
        grouped[log["athlete_id"]].append(log)

    for athlete_id in grouped:
        grouped[athlete_id].sort(key=lambda x: x["day_index"])

    return dict(grouped)


def extract_features(logs: List[Dict], lookback: int = 14) -> Dict[str, float]:
    """
    Extract features from mood logs for prediction.

    Uses only features we have data for (mood, confidence, stress, energy, sleep).
    These match what we'll have from real athlete mood logs.
    """
    if len(logs) < 3:
        return None

    # Take last `lookback` days
    recent = logs[-lookback:] if len(logs) >= lookback else logs

    features = {}

    # Latest values
    latest = recent[-1]
    features["latest_mood"] = float(latest["mood"])
    features["latest_confidence"] = float(latest["confidence"])
    features["latest_stress"] = float(latest["stress"])
    features["latest_energy"] = float(latest["energy"])
    features["latest_sleep"] = float(latest["sleep_hours"])

    # Averages
    features["avg_mood"] = float(np.mean([l["mood"] for l in recent]))
    features["avg_confidence"] = float(np.mean([l["confidence"] for l in recent]))
    features["avg_stress"] = float(np.mean([l["stress"] for l in recent]))
    features["avg_energy"] = float(np.mean([l["energy"] for l in recent]))
    features["avg_sleep"] = float(np.mean([l["sleep_hours"] for l in recent]))

    # Standard deviations (volatility)
    features["std_mood"] = float(np.std([l["mood"] for l in recent]))
    features["std_confidence"] = float(np.std([l["confidence"] for l in recent]))
    features["std_stress"] = float(np.std([l["stress"] for l in recent]))
    features["std_energy"] = float(np.std([l["energy"] for l in recent]))
    features["std_sleep"] = float(np.std([l["sleep_hours"] for l in recent]))

    # Trends (linear regression slope)
    def calc_trend(values):
        if len(values) < 2:
            return 0.0
        x = np.arange(len(values))
        return float(np.polyfit(x, values, 1)[0])

    features["trend_mood"] = calc_trend([l["mood"] for l in recent])
    features["trend_confidence"] = calc_trend([l["confidence"] for l in recent])
    features["trend_stress"] = calc_trend([l["stress"] for l in recent])
    features["trend_energy"] = calc_trend([l["energy"] for l in recent])

    # Min/max in window
    features["min_mood"] = float(min(l["mood"] for l in recent))
    features["max_mood"] = float(max(l["mood"] for l in recent))
    features["min_confidence"] = float(min(l["confidence"] for l in recent))
    features["max_stress"] = float(max(l["stress"] for l in recent))
    features["min_energy"] = float(min(l["energy"] for l in recent))

    # Days since best/worst
    best_mood_idx = max(range(len(recent)), key=lambda i: recent[i]["mood"])
    features["days_since_best_mood"] = float(len(recent) - 1 - best_mood_idx)

    worst_mood_idx = min(range(len(recent)), key=lambda i: recent[i]["mood"])
    features["days_since_worst_mood"] = float(len(recent) - 1 - worst_mood_idx)

    # Consecutive patterns
    def count_consecutive(values, direction="decline"):
        count = 0
        for i in range(len(values) - 1, 0, -1):
            if direction == "decline" and values[i] < values[i - 1]:
                count += 1
            elif direction == "improve" and values[i] > values[i - 1]:
                count += 1
            else:
                break
        return float(count)

    features["consecutive_mood_decline"] = count_consecutive([l["mood"] for l in recent], "decline")
    features["consecutive_confidence_decline"] = count_consecutive([l["confidence"] for l in recent], "decline")
    features["consecutive_stress_increase"] = count_consecutive([l["stress"] for l in recent], "improve")

    # Sleep quality indicators
    features["poor_sleep_days"] = float(sum(1 for l in recent if l["sleep_hours"] < 6))
    features["good_sleep_days"] = float(sum(1 for l in recent if l["sleep_hours"] >= 7))

    # Composite scores
    features["wellbeing_score"] = (features["avg_mood"] + features["avg_confidence"] +
                                    features["avg_energy"] + (10 - features["avg_stress"])) / 4

    # Mood-stress relationship
    features["mood_stress_gap"] = features["avg_mood"] - features["avg_stress"]

    # Recent vs historical
    if len(recent) >= 7:
        recent_7 = recent[-7:]
        older = recent[:-7] if len(recent) > 7 else recent[:len(recent)//2]
        features["mood_recent_vs_old"] = float(np.mean([l["mood"] for l in recent_7]) -
                                               np.mean([l["mood"] for l in older]))
    else:
        features["mood_recent_vs_old"] = 0.0

    return features


def prepare_dataset(athlete_logs: Dict[str, List[Dict]], prediction_window: int = 7) -> Tuple[np.ndarray, np.ndarray, List[str]]:
    """
    Prepare training dataset.

    For each athlete, use days 1-14 to predict if slump occurs in days 15-21.
    """
    X_data = []
    y_data = []
    feature_names = None

    for athlete_id, logs in athlete_logs.items():
        # Need at least 21 days
        if len(logs) < 21:
            continue

        # Slide through data with overlapping windows
        for start in range(0, len(logs) - 20, 7):
            training_logs = logs[start:start + 14]
            future_logs = logs[start + 14:start + 14 + prediction_window]

            if len(training_logs) < 14 or len(future_logs) < prediction_window:
                continue

            # Extract features
            features = extract_features(training_logs)
            if features is None:
                continue

            if feature_names is None:
                feature_names = list(features.keys())

            # Target: did slump occur in future window?
            future_had_slump = any(log.get("in_slump", False) for log in future_logs)

            X_data.append([features[f] for f in feature_names])
            y_data.append(1 if future_had_slump else 0)

    return np.array(X_data), np.array(y_data), feature_names


def train_model(X: np.ndarray, y: np.ndarray, feature_names: List[str]) -> Tuple[Any, Any, Dict]:
    """Train XGBoost model with cross-validation."""

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"\nTraining set: {len(X_train)} samples")
    print(f"Test set: {len(X_test)} samples")
    print(f"Positive class ratio: {y.mean():.2%}")

    # Handle class imbalance
    scale_pos_weight = (y == 0).sum() / (y == 1).sum()

    # Train XGBoost with tuned parameters
    model = xgb.XGBClassifier(
        n_estimators=200,
        max_depth=3,  # Shallower to prevent overfitting
        learning_rate=0.05,  # Slower learning
        scale_pos_weight=scale_pos_weight,
        min_child_weight=3,  # More regularization
        subsample=0.8,  # Reduce overfitting
        colsample_bytree=0.8,
        random_state=42,
        eval_metric="logloss",
    )

    # Cross-validation
    cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring="roc_auc")
    print(f"\nCross-validation AUC: {cv_scores.mean():.3f} (+/- {cv_scores.std() * 2:.3f})")

    # Train final model
    model.fit(X_train, y_train)

    # Evaluate on test set
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    metrics = {
        "accuracy": accuracy_score(y_test, y_pred),
        "precision": precision_score(y_test, y_pred, zero_division=0),
        "recall": recall_score(y_test, y_pred, zero_division=0),
        "f1": f1_score(y_test, y_pred, zero_division=0),
        "roc_auc": roc_auc_score(y_test, y_prob),
        "cv_auc_mean": cv_scores.mean(),
        "cv_auc_std": cv_scores.std(),
    }

    # Create SHAP explainer
    explainer = shap.TreeExplainer(model)

    # Get feature importance
    importance = dict(zip(feature_names, model.feature_importances_))
    sorted_importance = sorted(importance.items(), key=lambda x: -x[1])

    print("\nTop 10 Feature Importances:")
    for feat, imp in sorted_importance[:10]:
        print(f"  {feat}: {imp:.4f}")

    return model, explainer, metrics


def save_model(model, explainer, feature_names: List[str], metrics: Dict, output_dir: str):
    """Save trained model and metadata."""
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    # Save model
    model_data = {
        "model": model,
        "feature_names": feature_names,
        "metrics": metrics,
    }

    model_path = output_path / "performance_predictor.pkl"
    with open(model_path, "wb") as f:
        pickle.dump(model_data, f)

    print(f"\nModel saved to {model_path}")

    # Save metrics as JSON for reference
    metrics_path = output_path / "predictor_metrics.json"
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"Metrics saved to {metrics_path}")


def main():
    parser = argparse.ArgumentParser(description="Train XGBoost performance predictor")
    parser.add_argument("--data", type=str, default="./training_data", help="Training data directory")
    parser.add_argument("--output", type=str, default="./models", help="Output directory for model")

    args = parser.parse_args()

    print("=" * 60)
    print("TRAINING XGBOOST PERFORMANCE PREDICTOR")
    print("=" * 60)

    # Load data
    print(f"\nLoading data from {args.data}...")
    profiles, logs = load_training_data(args.data)
    print(f"Loaded {len(profiles)} athletes, {len(logs)} mood logs")

    # Group by athlete
    athlete_logs = group_logs_by_athlete(logs)

    # Prepare dataset
    print("\nPreparing training dataset...")
    X, y, feature_names = prepare_dataset(athlete_logs)
    print(f"Created {len(X)} training samples with {len(feature_names)} features")

    if len(X) < 50:
        print("WARNING: Very small dataset. Results may not be reliable.")

    # Train model
    print("\nTraining XGBoost model...")
    model, explainer, metrics = train_model(X, y, feature_names)

    # Print results
    print("\n" + "=" * 60)
    print("TRAINING RESULTS")
    print("=" * 60)
    print(f"Accuracy:  {metrics['accuracy']:.2%}")
    print(f"Precision: {metrics['precision']:.2%}")
    print(f"Recall:    {metrics['recall']:.2%}")
    print(f"F1 Score:  {metrics['f1']:.2%}")
    print(f"ROC AUC:   {metrics['roc_auc']:.3f}")
    print("=" * 60)

    # Save model
    save_model(model, explainer, feature_names, metrics, args.output)

    print("\nTraining complete!")


if __name__ == "__main__":
    main()
