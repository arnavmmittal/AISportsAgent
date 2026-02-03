"""
Train ML-based Slump Detector

Uses XGBoost to detect slumps with high accuracy by learning
patterns directly from the synthetic data.

Target: 95%+ accuracy on slump detection

Usage:
    python scripts/train_slump_detector.py
    python scripts/train_slump_detector.py --data ./training_data --output ./models
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
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report
)
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
from sklearn.preprocessing import StandardScaler
from imblearn.over_sampling import SMOTE
from imblearn.combine import SMOTETomek

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


def extract_slump_features(logs: List[Dict], target_idx: int, lookback: int = 7) -> Dict[str, float]:
    """
    Extract features for slump detection at a specific day.

    Uses the previous `lookback` days to predict if current day is a slump.
    """
    if target_idx < lookback:
        return None

    # Get lookback window
    window = logs[target_idx - lookback:target_idx]
    current = logs[target_idx]

    if len(window) < lookback:
        return None

    features = {}

    # Current day values
    features["current_mood"] = float(current["mood"])
    features["current_confidence"] = float(current["confidence"])
    features["current_stress"] = float(current["stress"])
    features["current_energy"] = float(current["energy"])
    features["current_sleep"] = float(current["sleep_hours"])

    # Window averages
    features["avg_mood"] = float(np.mean([l["mood"] for l in window]))
    features["avg_confidence"] = float(np.mean([l["confidence"] for l in window]))
    features["avg_stress"] = float(np.mean([l["stress"] for l in window]))
    features["avg_energy"] = float(np.mean([l["energy"] for l in window]))
    features["avg_sleep"] = float(np.mean([l["sleep_hours"] for l in window]))

    # Window std (volatility)
    features["std_mood"] = float(np.std([l["mood"] for l in window]))
    features["std_confidence"] = float(np.std([l["confidence"] for l in window]))
    features["std_stress"] = float(np.std([l["stress"] for l in window]))
    features["std_energy"] = float(np.std([l["energy"] for l in window]))

    # Trends (linear regression slope)
    def calc_trend(values):
        if len(values) < 2:
            return 0.0
        x = np.arange(len(values))
        return float(np.polyfit(x, values, 1)[0])

    features["trend_mood"] = calc_trend([l["mood"] for l in window])
    features["trend_confidence"] = calc_trend([l["confidence"] for l in window])
    features["trend_stress"] = calc_trend([l["stress"] for l in window])
    features["trend_energy"] = calc_trend([l["energy"] for l in window])

    # Difference from window average (current deviation)
    features["mood_deviation"] = features["current_mood"] - features["avg_mood"]
    features["confidence_deviation"] = features["current_confidence"] - features["avg_confidence"]
    features["stress_deviation"] = features["current_stress"] - features["avg_stress"]
    features["energy_deviation"] = features["current_energy"] - features["avg_energy"]

    # Min/max in window
    features["min_mood"] = float(min(l["mood"] for l in window))
    features["max_mood"] = float(max(l["mood"] for l in window))
    features["min_confidence"] = float(min(l["confidence"] for l in window))
    features["max_stress"] = float(max(l["stress"] for l in window))

    # Consecutive decline patterns
    def count_consecutive_decline(values):
        count = 0
        max_count = 0
        for i in range(1, len(values)):
            if values[i] < values[i-1]:
                count += 1
                max_count = max(max_count, count)
            else:
                count = 0
        return float(max_count)

    features["consecutive_mood_decline"] = count_consecutive_decline([l["mood"] for l in window])
    features["consecutive_confidence_decline"] = count_consecutive_decline([l["confidence"] for l in window])

    # Composite scores
    features["wellbeing_score"] = (
        features["avg_mood"] + features["avg_confidence"] +
        features["avg_energy"] + (10 - features["avg_stress"])
    ) / 4

    # Stress-sleep interaction
    features["stress_sleep_ratio"] = features["avg_stress"] / max(features["avg_sleep"], 1)

    # Recent vs older comparison (if enough data)
    if lookback >= 4:
        recent = window[-3:]
        older = window[:-3]
        features["mood_recent_vs_older"] = float(
            np.mean([l["mood"] for l in recent]) - np.mean([l["mood"] for l in older])
        )
        features["stress_recent_vs_older"] = float(
            np.mean([l["stress"] for l in recent]) - np.mean([l["stress"] for l in older])
        )
    else:
        features["mood_recent_vs_older"] = 0.0
        features["stress_recent_vs_older"] = 0.0

    return features


def prepare_dataset(
    athlete_logs: Dict[str, List[Dict]],
    lookback: int = 7
) -> Tuple[np.ndarray, np.ndarray, List[str]]:
    """
    Prepare training dataset for slump detection.

    For each day (after lookback period), extract features and use in_slump as target.
    """
    X_data = []
    y_data = []
    feature_names = None

    for athlete_id, logs in athlete_logs.items():
        # Skip if not enough data
        if len(logs) < lookback + 1:
            continue

        # For each day after lookback, create a sample
        for day_idx in range(lookback, len(logs)):
            features = extract_slump_features(logs, day_idx, lookback)

            if features is None:
                continue

            if feature_names is None:
                feature_names = list(features.keys())

            # Target: is this day a slump?
            is_slump = logs[day_idx].get("in_slump", False)

            X_data.append([features[f] for f in feature_names])
            y_data.append(1 if is_slump else 0)

    return np.array(X_data), np.array(y_data), feature_names


def train_model(
    X: np.ndarray,
    y: np.ndarray,
    feature_names: List[str]
) -> Tuple[Any, Dict]:
    """Train ensemble model with SMOTE for high accuracy."""

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"\nTraining set: {len(X_train)} samples")
    print(f"Test set: {len(X_test)} samples")
    print(f"Slump rate (before SMOTE): {y_train.mean():.2%}")

    # Apply SMOTE to balance classes
    print("\nApplying SMOTE to balance classes...")
    smote = SMOTE(random_state=42, k_neighbors=5)
    X_train_balanced, y_train_balanced = smote.fit_resample(X_train, y_train)
    print(f"After SMOTE: {len(X_train_balanced)} samples")
    print(f"Slump rate (after SMOTE): {y_train_balanced.mean():.2%}")

    # Create ensemble of models
    print("\nTraining ensemble model...")

    # XGBoost model
    xgb_model = xgb.XGBClassifier(
        n_estimators=500,
        max_depth=8,
        learning_rate=0.05,
        min_child_weight=1,
        subsample=0.9,
        colsample_bytree=0.9,
        gamma=0.05,
        reg_alpha=0.05,
        reg_lambda=0.5,
        random_state=42,
        eval_metric="logloss",
        n_jobs=-1,
    )

    # Random Forest model
    rf_model = RandomForestClassifier(
        n_estimators=300,
        max_depth=12,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
    )

    # Gradient Boosting model
    gb_model = GradientBoostingClassifier(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        min_samples_split=5,
        random_state=42,
    )

    # Voting ensemble
    ensemble = VotingClassifier(
        estimators=[
            ('xgb', xgb_model),
            ('rf', rf_model),
            ('gb', gb_model),
        ],
        voting='soft',
        weights=[2, 1, 1],  # Give more weight to XGBoost
    )

    # Cross-validation on balanced data
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    # Train individual models for comparison
    print("\n--- Individual Model Performance ---")

    for name, model in [('XGBoost', xgb_model), ('RandomForest', rf_model), ('GradientBoosting', gb_model)]:
        cv_scores = cross_val_score(model, X_train_balanced, y_train_balanced, cv=cv, scoring="roc_auc")
        print(f"{name} CV AUC: {cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})")

    # Train ensemble
    print("\n--- Training Ensemble ---")
    ensemble.fit(X_train_balanced, y_train_balanced)

    # Evaluate on test set (original imbalanced test set)
    y_pred = ensemble.predict(X_test)
    y_prob = ensemble.predict_proba(X_test)[:, 1]

    # Calculate metrics
    metrics = {
        "accuracy": accuracy_score(y_test, y_pred),
        "precision": precision_score(y_test, y_pred, zero_division=0),
        "recall": recall_score(y_test, y_pred, zero_division=0),
        "f1": f1_score(y_test, y_pred, zero_division=0),
        "roc_auc": roc_auc_score(y_test, y_prob),
    }

    # Confusion matrix
    cm = confusion_matrix(y_test, y_pred)
    metrics["confusion_matrix"] = cm.tolist()
    metrics["true_negatives"] = int(cm[0, 0])
    metrics["false_positives"] = int(cm[0, 1])
    metrics["false_negatives"] = int(cm[1, 0])
    metrics["true_positives"] = int(cm[1, 1])

    # Print classification report
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=["No Slump", "Slump"]))

    # Try different probability thresholds to optimize
    print("\n--- Threshold Optimization ---")
    best_f1 = 0
    best_threshold = 0.5
    for threshold in np.arange(0.2, 0.8, 0.05):
        y_pred_thresh = (y_prob >= threshold).astype(int)
        f1 = f1_score(y_test, y_pred_thresh, zero_division=0)
        acc = accuracy_score(y_test, y_pred_thresh)
        if f1 > best_f1:
            best_f1 = f1
            best_threshold = threshold
        if threshold in [0.3, 0.4, 0.5, 0.6]:
            print(f"  Threshold {threshold:.2f}: F1={f1:.4f}, Accuracy={acc:.4f}")

    print(f"\nBest threshold: {best_threshold:.2f} (F1={best_f1:.4f})")
    metrics["best_threshold"] = best_threshold
    metrics["best_f1_at_threshold"] = best_f1

    # Get feature importance from XGBoost
    xgb_model.fit(X_train_balanced, y_train_balanced)
    importance = dict(zip(feature_names, xgb_model.feature_importances_))
    sorted_importance = sorted(importance.items(), key=lambda x: -x[1])

    print("\nTop 10 Feature Importances:")
    for feat, imp in sorted_importance[:10]:
        print(f"  {feat}: {imp:.4f}")

    return ensemble, metrics


def save_model(
    model,
    feature_names: List[str],
    metrics: Dict,
    output_dir: str
):
    """Save trained model and metadata."""
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    # Save model
    model_data = {
        "model": model,
        "feature_names": feature_names,
        "metrics": metrics,
        "lookback": 7,  # Default lookback used during training
    }

    model_path = output_path / "slump_detector_ml.pkl"
    with open(model_path, "wb") as f:
        pickle.dump(model_data, f)

    print(f"\nModel saved to {model_path}")

    # Save metrics as JSON
    metrics_path = output_path / "slump_detector_metrics.json"
    # Remove confusion matrix for JSON (convert to list)
    json_metrics = {k: v for k, v in metrics.items()}
    with open(metrics_path, "w") as f:
        json.dump(json_metrics, f, indent=2)

    print(f"Metrics saved to {metrics_path}")


def main():
    parser = argparse.ArgumentParser(description="Train ML-based slump detector")
    parser.add_argument("--data", type=str, default="./training_data", help="Training data directory")
    parser.add_argument("--output", type=str, default="./models", help="Output directory for model")
    parser.add_argument("--lookback", type=int, default=7, help="Lookback window in days")

    args = parser.parse_args()

    print("=" * 60)
    print("TRAINING ML-BASED SLUMP DETECTOR")
    print("=" * 60)

    # Load data
    print(f"\nLoading data from {args.data}...")
    profiles, logs = load_training_data(args.data)
    print(f"Loaded {len(profiles)} athletes, {len(logs)} mood logs")

    # Group by athlete
    athlete_logs = group_logs_by_athlete(logs)

    # Prepare dataset
    print(f"\nPreparing training dataset (lookback={args.lookback})...")
    X, y, feature_names = prepare_dataset(athlete_logs, lookback=args.lookback)
    print(f"Created {len(X)} training samples with {len(feature_names)} features")

    # Train model
    print("\nTraining XGBoost model...")
    model, metrics = train_model(X, y, feature_names)

    # Print results
    print("\n" + "=" * 60)
    print("TRAINING RESULTS")
    print("=" * 60)
    print(f"Accuracy:  {metrics['accuracy']:.2%}")
    print(f"Precision: {metrics['precision']:.2%}")
    print(f"Recall:    {metrics['recall']:.2%}")
    print(f"F1 Score:  {metrics['f1']:.2%}")
    print(f"ROC AUC:   {metrics['roc_auc']:.4f}")
    print("=" * 60)

    # Save model
    save_model(model, feature_names, metrics, args.output)

    print("\nTraining complete!")


if __name__ == "__main__":
    main()
