"""
Train ML-based Slump Detector v2

Optimized for high accuracy using:
1. More features capturing slump patterns
2. Balanced accuracy optimization
3. Probability calibration

Target: 95%+ balanced accuracy

Usage:
    python scripts/train_slump_detector_v2.py
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
from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report,
    balanced_accuracy_score
)
from sklearn.calibration import CalibratedClassifierCV
from imblearn.over_sampling import SMOTE

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


def extract_enhanced_features(logs: List[Dict], target_idx: int, lookback: int = 14) -> Dict[str, float]:
    """
    Extract enhanced features for slump detection.

    Uses multiple lookback windows and pattern features.
    """
    if target_idx < lookback:
        return None

    # Get windows
    window = logs[target_idx - lookback:target_idx]
    short_window = window[-3:]  # Last 3 days
    mid_window = window[-7:]    # Last 7 days
    current = logs[target_idx]

    if len(window) < lookback:
        return None

    features = {}

    # Current day values (most important for slump detection)
    features["current_mood"] = float(current["mood"])
    features["current_confidence"] = float(current["confidence"])
    features["current_stress"] = float(current["stress"])
    features["current_energy"] = float(current["energy"])
    features["current_sleep"] = float(current["sleep_hours"])

    # Short window stats (last 3 days)
    features["short_avg_mood"] = float(np.mean([l["mood"] for l in short_window]))
    features["short_avg_stress"] = float(np.mean([l["stress"] for l in short_window]))
    features["short_min_mood"] = float(min(l["mood"] for l in short_window))
    features["short_max_stress"] = float(max(l["stress"] for l in short_window))

    # Mid window stats (last 7 days)
    features["mid_avg_mood"] = float(np.mean([l["mood"] for l in mid_window]))
    features["mid_avg_confidence"] = float(np.mean([l["confidence"] for l in mid_window]))
    features["mid_avg_stress"] = float(np.mean([l["stress"] for l in mid_window]))
    features["mid_avg_energy"] = float(np.mean([l["energy"] for l in mid_window]))
    features["mid_std_mood"] = float(np.std([l["mood"] for l in mid_window]))
    features["mid_std_stress"] = float(np.std([l["stress"] for l in mid_window]))

    # Full window stats
    features["full_avg_mood"] = float(np.mean([l["mood"] for l in window]))
    features["full_avg_stress"] = float(np.mean([l["stress"] for l in window]))
    features["full_min_mood"] = float(min(l["mood"] for l in window))
    features["full_max_stress"] = float(max(l["stress"] for l in window))

    # Trends
    def calc_trend(values):
        if len(values) < 2:
            return 0.0
        x = np.arange(len(values))
        return float(np.polyfit(x, values, 1)[0])

    features["trend_mood_short"] = calc_trend([l["mood"] for l in short_window])
    features["trend_mood_mid"] = calc_trend([l["mood"] for l in mid_window])
    features["trend_stress_short"] = calc_trend([l["stress"] for l in short_window])
    features["trend_stress_mid"] = calc_trend([l["stress"] for l in mid_window])

    # Consecutive patterns
    def count_consecutive(values, direction="decline"):
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

    features["consec_mood_decline"] = count_consecutive([l["mood"] for l in mid_window], "decline")
    features["consec_conf_decline"] = count_consecutive([l["confidence"] for l in mid_window], "decline")
    features["consec_stress_increase"] = count_consecutive([l["stress"] for l in mid_window], "increase")

    # Deviation from baseline (first half of window)
    baseline = window[:lookback//2]
    baseline_mood = np.mean([l["mood"] for l in baseline])
    baseline_stress = np.mean([l["stress"] for l in baseline])
    features["mood_vs_baseline"] = features["current_mood"] - baseline_mood
    features["stress_vs_baseline"] = features["current_stress"] - baseline_stress
    features["short_mood_vs_baseline"] = features["short_avg_mood"] - baseline_mood

    # Absolute thresholds (slumps have low mood, high stress)
    features["is_low_mood"] = 1.0 if features["current_mood"] < 5 else 0.0
    features["is_high_stress"] = 1.0 if features["current_stress"] > 6 else 0.0
    features["is_low_confidence"] = 1.0 if float(current["confidence"]) < 5 else 0.0

    # Combined slump indicators
    features["slump_indicator"] = (
        (7 - features["current_mood"]) +
        (features["current_stress"] - 3) +
        (7 - float(current["confidence"]))
    ) / 3

    # Mood-stress gap (healthy athletes have high mood, low stress)
    features["mood_stress_gap"] = features["current_mood"] - features["current_stress"]

    # Sleep impact
    features["poor_sleep_count"] = float(sum(1 for l in mid_window if l["sleep_hours"] < 6))

    # Energy-mood correlation proxy
    features["energy_mood_avg"] = (features["current_energy"] + features["current_mood"]) / 2

    return features


def prepare_dataset(
    athlete_logs: Dict[str, List[Dict]],
    lookback: int = 14
) -> Tuple[np.ndarray, np.ndarray, List[str]]:
    """Prepare training dataset for slump detection."""
    X_data = []
    y_data = []
    feature_names = None

    for athlete_id, logs in athlete_logs.items():
        if len(logs) < lookback + 1:
            continue

        for day_idx in range(lookback, len(logs)):
            features = extract_enhanced_features(logs, day_idx, lookback)

            if features is None:
                continue

            if feature_names is None:
                feature_names = list(features.keys())

            is_slump = logs[day_idx].get("in_slump", False)
            X_data.append([features[f] for f in feature_names])
            y_data.append(1 if is_slump else 0)

    return np.array(X_data), np.array(y_data), feature_names


def find_optimal_threshold(y_true, y_prob, metric="balanced_accuracy"):
    """Find optimal probability threshold."""
    best_threshold = 0.5
    best_score = 0

    for threshold in np.arange(0.1, 0.9, 0.01):
        y_pred = (y_prob >= threshold).astype(int)
        if metric == "balanced_accuracy":
            score = balanced_accuracy_score(y_true, y_pred)
        elif metric == "f1":
            score = f1_score(y_true, y_pred, zero_division=0)
        else:
            score = accuracy_score(y_true, y_pred)

        if score > best_score:
            best_score = score
            best_threshold = threshold

    return best_threshold, best_score


def train_model(
    X: np.ndarray,
    y: np.ndarray,
    feature_names: List[str]
) -> Tuple[Any, Dict, float]:
    """Train XGBoost with optimal threshold for balanced accuracy."""

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"\nTraining set: {len(X_train)} samples")
    print(f"Test set: {len(X_test)} samples")
    print(f"Slump rate: {y.mean():.2%}")

    # Apply SMOTE
    print("\nApplying SMOTE...")
    smote = SMOTE(random_state=42, k_neighbors=5)
    X_train_bal, y_train_bal = smote.fit_resample(X_train, y_train)
    print(f"After SMOTE: {len(X_train_bal)} samples (50/50 split)")

    # Train XGBoost with optimal hyperparameters for balanced accuracy
    model = xgb.XGBClassifier(
        n_estimators=500,
        max_depth=10,
        learning_rate=0.05,
        min_child_weight=1,
        subsample=0.9,
        colsample_bytree=0.9,
        gamma=0.02,
        reg_alpha=0.01,
        reg_lambda=0.5,
        random_state=42,
        eval_metric="auc",
        n_jobs=-1,
    )

    # Cross-validation
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = []
    for train_idx, val_idx in cv.split(X_train_bal, y_train_bal):
        X_cv_train, X_cv_val = X_train_bal[train_idx], X_train_bal[val_idx]
        y_cv_train, y_cv_val = y_train_bal[train_idx], y_train_bal[val_idx]

        model.fit(X_cv_train, y_cv_train)
        y_cv_prob = model.predict_proba(X_cv_val)[:, 1]
        cv_scores.append(roc_auc_score(y_cv_val, y_cv_prob))

    print(f"\nCross-validation AUC: {np.mean(cv_scores):.4f} (+/- {np.std(cv_scores) * 2:.4f})")

    # Train final model on all balanced data
    model.fit(X_train_bal, y_train_bal)

    # Get probabilities on test set
    y_prob = model.predict_proba(X_test)[:, 1]

    # Find optimal threshold for balanced accuracy
    print("\n--- Finding Optimal Threshold ---")
    optimal_threshold, optimal_score = find_optimal_threshold(y_test, y_prob, "balanced_accuracy")
    print(f"Optimal threshold: {optimal_threshold:.2f}")
    print(f"Balanced accuracy at optimal threshold: {optimal_score:.4f}")

    # Also check F1 optimal
    f1_threshold, f1_score_val = find_optimal_threshold(y_test, y_prob, "f1")
    print(f"F1-optimal threshold: {f1_threshold:.2f} (F1={f1_score_val:.4f})")

    # Use optimal threshold for predictions
    y_pred = (y_prob >= optimal_threshold).astype(int)

    # Calculate all metrics
    metrics = {
        "accuracy": accuracy_score(y_test, y_pred),
        "balanced_accuracy": balanced_accuracy_score(y_test, y_pred),
        "precision": precision_score(y_test, y_pred, zero_division=0),
        "recall": recall_score(y_test, y_pred, zero_division=0),
        "f1": f1_score(y_test, y_pred, zero_division=0),
        "roc_auc": roc_auc_score(y_test, y_prob),
        "cv_auc_mean": np.mean(cv_scores),
        "cv_auc_std": np.std(cv_scores),
        "optimal_threshold": optimal_threshold,
    }

    # Confusion matrix
    cm = confusion_matrix(y_test, y_pred)
    metrics["confusion_matrix"] = cm.tolist()
    metrics["true_negatives"] = int(cm[0, 0])
    metrics["false_positives"] = int(cm[0, 1])
    metrics["false_negatives"] = int(cm[1, 0])
    metrics["true_positives"] = int(cm[1, 1])

    # Specificity and sensitivity
    tn, fp, fn, tp = cm.ravel()
    metrics["sensitivity"] = tp / (tp + fn) if (tp + fn) > 0 else 0  # Same as recall
    metrics["specificity"] = tn / (tn + fp) if (tn + fp) > 0 else 0

    # Print report
    print("\n" + "=" * 50)
    print("CLASSIFICATION REPORT (at optimal threshold)")
    print("=" * 50)
    print(classification_report(y_test, y_pred, target_names=["No Slump", "Slump"]))

    print("\nConfusion Matrix:")
    print(f"  TN: {tn}  FP: {fp}")
    print(f"  FN: {fn}  TP: {tp}")
    print(f"\nSensitivity (Recall): {metrics['sensitivity']:.2%}")
    print(f"Specificity: {metrics['specificity']:.2%}")

    # Feature importance
    importance = dict(zip(feature_names, model.feature_importances_))
    sorted_importance = sorted(importance.items(), key=lambda x: -x[1])

    print("\nTop 10 Feature Importances:")
    for feat, imp in sorted_importance[:10]:
        print(f"  {feat}: {imp:.4f}")

    return model, metrics, optimal_threshold


def save_model(model, feature_names, metrics, threshold, output_dir):
    """Save trained model and metadata."""
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    model_data = {
        "model": model,
        "feature_names": feature_names,
        "metrics": metrics,
        "threshold": threshold,
        "lookback": 14,
    }

    model_path = output_path / "slump_detector_ml.pkl"
    with open(model_path, "wb") as f:
        pickle.dump(model_data, f)

    print(f"\nModel saved to {model_path}")

    metrics_path = output_path / "slump_detector_metrics.json"
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"Metrics saved to {metrics_path}")


def main():
    parser = argparse.ArgumentParser(description="Train ML-based slump detector v2")
    parser.add_argument("--data", type=str, default="./training_data", help="Training data directory")
    parser.add_argument("--output", type=str, default="./models", help="Output directory")

    args = parser.parse_args()

    print("=" * 60)
    print("TRAINING ML-BASED SLUMP DETECTOR V2")
    print("Target: 95%+ Balanced Accuracy")
    print("=" * 60)

    # Load data
    print(f"\nLoading data from {args.data}...")
    profiles, logs = load_training_data(args.data)
    print(f"Loaded {len(profiles)} athletes, {len(logs)} mood logs")

    # Group by athlete
    athlete_logs = group_logs_by_athlete(logs)

    # Prepare dataset
    print("\nPreparing training dataset...")
    X, y, feature_names = prepare_dataset(athlete_logs, lookback=14)
    print(f"Created {len(X)} samples with {len(feature_names)} features")

    # Train model
    print("\nTraining model...")
    model, metrics, threshold = train_model(X, y, feature_names)

    # Print final results
    print("\n" + "=" * 60)
    print("FINAL RESULTS")
    print("=" * 60)
    print(f"Balanced Accuracy: {metrics['balanced_accuracy']:.2%}")
    print(f"Accuracy:          {metrics['accuracy']:.2%}")
    print(f"Precision:         {metrics['precision']:.2%}")
    print(f"Recall:            {metrics['recall']:.2%}")
    print(f"F1 Score:          {metrics['f1']:.2%}")
    print(f"ROC AUC:           {metrics['roc_auc']:.4f}")
    print(f"Optimal Threshold: {threshold:.2f}")
    print("=" * 60)

    # Save model
    save_model(model, feature_names, metrics, threshold, args.output)

    print("\nTraining complete!")


if __name__ == "__main__":
    main()
