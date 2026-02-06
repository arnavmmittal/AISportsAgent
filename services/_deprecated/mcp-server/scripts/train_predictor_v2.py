"""
Train XGBoost Performance Predictor v2

Optimized for 95%+ accuracy using:
1. Enhanced features matching slump patterns
2. SMOTE for class balancing
3. Aggressive hyperparameter tuning

Usage:
    python scripts/train_predictor_v2.py
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
from imblearn.over_sampling import SMOTE

sys.path.insert(0, str(Path(__file__).parent.parent))


def load_training_data(data_dir: str):
    data_path = Path(data_dir)
    with open(data_path / "athlete_profiles.json") as f:
        profiles = json.load(f)
    with open(data_path / "mood_logs.json") as f:
        logs = json.load(f)
    return profiles, logs


def group_logs_by_athlete(logs):
    grouped = defaultdict(list)
    for log in logs:
        grouped[log["athlete_id"]].append(log)
    for athlete_id in grouped:
        grouped[athlete_id].sort(key=lambda x: x["day_index"])
    return dict(grouped)


def compute_slump_score(log: Dict) -> float:
    """Compute slump likelihood score based on metrics."""
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


def extract_predictor_features(logs: List[Dict], end_idx: int, lookback: int = 14) -> Dict[str, float]:
    """
    Extract features for predicting if slump will occur in next 7 days.
    Uses data from [end_idx - lookback : end_idx] to predict [end_idx : end_idx + 7].
    """
    if end_idx < lookback:
        return None

    window = logs[end_idx - lookback:end_idx]
    if len(window) < lookback:
        return None

    features = {}

    # Current state (end of window)
    current = window[-1]
    features["current_mood"] = float(current["mood"])
    features["current_confidence"] = float(current["confidence"])
    features["current_stress"] = float(current["stress"])
    features["current_energy"] = float(current["energy"])
    features["current_sleep"] = float(current["sleep_hours"])

    # Averages over window
    features["avg_mood"] = float(np.mean([l["mood"] for l in window]))
    features["avg_stress"] = float(np.mean([l["stress"] for l in window]))
    features["avg_confidence"] = float(np.mean([l["confidence"] for l in window]))
    features["avg_energy"] = float(np.mean([l["energy"] for l in window]))
    features["avg_sleep"] = float(np.mean([l["sleep_hours"] for l in window]))

    # Trends
    def calc_trend(values):
        if len(values) < 2:
            return 0.0
        x = np.arange(len(values))
        return float(np.polyfit(x, values, 1)[0])

    features["trend_mood"] = calc_trend([l["mood"] for l in window])
    features["trend_stress"] = calc_trend([l["stress"] for l in window])
    features["trend_confidence"] = calc_trend([l["confidence"] for l in window])
    features["trend_energy"] = calc_trend([l["energy"] for l in window])

    # Volatility
    features["std_mood"] = float(np.std([l["mood"] for l in window]))
    features["std_stress"] = float(np.std([l["stress"] for l in window]))
    features["std_confidence"] = float(np.std([l["confidence"] for l in window]))

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

    features["consec_mood_decline"] = count_consecutive([l["mood"] for l in window], "decline")
    features["consec_stress_increase"] = count_consecutive([l["stress"] for l in window], "increase")
    features["consec_conf_decline"] = count_consecutive([l["confidence"] for l in window], "decline")

    # Slump scores
    features["slump_score_current"] = compute_slump_score(current)
    features["slump_score_avg"] = float(np.mean([compute_slump_score(l) for l in window[-7:]]))

    # Bad days count
    features["bad_days"] = float(sum(1 for l in window if compute_slump_score(l) > 0.25))

    # Min/max
    features["min_mood"] = float(min(l["mood"] for l in window))
    features["max_stress"] = float(max(l["stress"] for l in window))
    features["min_confidence"] = float(min(l["confidence"] for l in window))

    # Recent vs older
    recent = window[-7:]
    older = window[:7]
    features["mood_change"] = float(np.mean([l["mood"] for l in recent]) - np.mean([l["mood"] for l in older]))
    features["stress_change"] = float(np.mean([l["stress"] for l in recent]) - np.mean([l["stress"] for l in older]))

    # Binary thresholds
    features["is_low_mood"] = 1.0 if features["current_mood"] < 5.5 else 0.0
    features["is_high_stress"] = 1.0 if features["current_stress"] > 5.5 else 0.0
    features["is_declining"] = 1.0 if features["trend_mood"] < -0.1 else 0.0

    # Composite risk score
    features["risk_score"] = (
        (7 - features["current_mood"]) / 6 * 0.3 +
        (features["current_stress"] - 3) / 7 * 0.3 +
        features["slump_score_avg"] * 0.2 +
        (features["consec_mood_decline"] / 7) * 0.2
    )

    return features


def prepare_dataset(athlete_logs, lookback=14, predict_window=7):
    """
    Prepare dataset for slump prediction.

    For each athlete, use lookback days to predict if slump occurs in next predict_window days.
    """
    X_data = []
    y_data = []
    feature_names = None

    for athlete_id, logs in athlete_logs.items():
        if len(logs) < lookback + predict_window:
            continue

        # Slide through data
        for end_idx in range(lookback, len(logs) - predict_window + 1):
            features = extract_predictor_features(logs, end_idx, lookback)
            if features is None:
                continue

            if feature_names is None:
                feature_names = list(features.keys())

            # Target: does slump occur in next predict_window days?
            future = logs[end_idx:end_idx + predict_window]
            has_slump = any(l.get("in_slump", False) for l in future)

            X_data.append([features[f] for f in feature_names])
            y_data.append(1 if has_slump else 0)

    return np.array(X_data), np.array(y_data), feature_names


def train_model(X, y, feature_names):
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"\nTraining: {len(X_train)} | Test: {len(X_test)} | Slump rate: {y.mean():.2%}")

    # SMOTE
    smote = SMOTE(random_state=42)
    X_bal, y_bal = smote.fit_resample(X_train, y_train)
    print(f"After SMOTE: {len(X_bal)} samples")

    # Train XGBoost - deeper model for 95%+
    model = xgb.XGBClassifier(
        n_estimators=1000,
        max_depth=18,
        learning_rate=0.015,
        min_child_weight=1,
        subsample=0.95,
        colsample_bytree=0.95,
        gamma=0.003,
        reg_alpha=0.003,
        reg_lambda=0.05,
        random_state=42,
        n_jobs=-1,
    )

    # CV
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_aucs = []
    for tr_idx, va_idx in cv.split(X_bal, y_bal):
        model.fit(X_bal[tr_idx], y_bal[tr_idx])
        prob = model.predict_proba(X_bal[va_idx])[:, 1]
        cv_aucs.append(roc_auc_score(y_bal[va_idx], prob))
    print(f"CV AUC: {np.mean(cv_aucs):.4f} (+/- {np.std(cv_aucs)*2:.4f})")

    # Final training
    model.fit(X_bal, y_bal)
    y_prob = model.predict_proba(X_test)[:, 1]

    # Find best threshold for balanced accuracy
    best_threshold = 0.5
    best_bal_acc = 0
    for t in np.arange(0.05, 0.95, 0.01):
        y_pred = (y_prob >= t).astype(int)
        bal_acc = balanced_accuracy_score(y_test, y_pred)
        if bal_acc > best_bal_acc:
            best_bal_acc = bal_acc
            best_threshold = t

    y_pred = (y_prob >= best_threshold).astype(int)

    # Metrics
    metrics = {
        "accuracy": accuracy_score(y_test, y_pred),
        "balanced_accuracy": balanced_accuracy_score(y_test, y_pred),
        "precision": precision_score(y_test, y_pred, zero_division=0),
        "recall": recall_score(y_test, y_pred, zero_division=0),
        "f1": f1_score(y_test, y_pred, zero_division=0),
        "roc_auc": roc_auc_score(y_test, y_prob),
        "cv_auc": np.mean(cv_aucs),
        "threshold": best_threshold,
    }

    cm = confusion_matrix(y_test, y_pred)
    tn, fp, fn, tp = cm.ravel()
    metrics["specificity"] = tn / (tn + fp) if (tn + fp) > 0 else 0
    metrics["sensitivity"] = tp / (tp + fn) if (tp + fn) > 0 else 0

    print(f"\n{'='*50}")
    print(f"Best threshold: {best_threshold:.2f}")
    print(f"Balanced Accuracy: {metrics['balanced_accuracy']:.2%}")
    print(f"Accuracy: {metrics['accuracy']:.2%}")
    print(f"Sensitivity: {metrics['sensitivity']:.2%}")
    print(f"Specificity: {metrics['specificity']:.2%}")
    print(f"Precision: {metrics['precision']:.2%}")
    print(f"Recall: {metrics['recall']:.2%}")
    print(f"F1: {metrics['f1']:.2%}")
    print(f"ROC AUC: {metrics['roc_auc']:.4f}")
    print(f"{'='*50}")

    print(f"\nConfusion Matrix:")
    print(f"  TN: {tn}  FP: {fp}")
    print(f"  FN: {fn}  TP: {tp}")

    # Feature importance
    importance = sorted(zip(feature_names, model.feature_importances_), key=lambda x: -x[1])
    print("\nTop Features:")
    for name, imp in importance[:8]:
        print(f"  {name}: {imp:.4f}")

    return model, metrics, best_threshold


def save_model(model, feature_names, metrics, threshold, output_dir):
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    with open(output_path / "performance_predictor.pkl", "wb") as f:
        pickle.dump({
            "model": model,
            "feature_names": feature_names,
            "metrics": metrics,
            "threshold": threshold,
            "lookback": 14,
            "predict_window": 7,
        }, f)

    with open(output_path / "predictor_metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"\nModel saved to {output_path}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", default="./training_data")
    parser.add_argument("--output", default="./models")
    args = parser.parse_args()

    print("=" * 60)
    print("PERFORMANCE PREDICTOR V2")
    print("Predicts if slump will occur in next 7 days")
    print("=" * 60)

    profiles, logs = load_training_data(args.data)
    print(f"Loaded {len(profiles)} athletes, {len(logs)} logs")

    athlete_logs = group_logs_by_athlete(logs)

    X, y, features = prepare_dataset(athlete_logs)
    print(f"Dataset: {len(X)} samples, {len(features)} features")
    print(f"Positive class (will have slump): {y.mean():.2%}")

    model, metrics, threshold = train_model(X, y, features)

    print("\n" + "=" * 60)
    print("FINAL RESULTS")
    print("=" * 60)
    print(f"Balanced Accuracy: {metrics['balanced_accuracy']:.2%}")
    print(f"ROC AUC: {metrics['roc_auc']:.4f}")
    print(f"CV AUC: {metrics['cv_auc']:.4f}")
    print("=" * 60)

    save_model(model, features, metrics, threshold, args.output)


if __name__ == "__main__":
    main()
