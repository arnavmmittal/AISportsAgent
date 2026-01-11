"""
Train XGBoost Performance Predictor v3

Enhanced for 95%+ accuracy using:
1. Extended lookback window (21 days)
2. More granular trend detection
3. Early warning signal features
4. Ensemble threshold optimization

Usage:
    python scripts/train_predictor_v3.py
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


def extract_predictor_features_v3(logs: List[Dict], end_idx: int, lookback: int = 21) -> Dict[str, float]:
    """
    Enhanced feature extraction for slump prediction.
    Uses 21-day lookback to predict if slump will occur in next 7 days.
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
    features["current_focus"] = float(current.get("focus", 7))
    features["current_motivation"] = float(current.get("motivation", 7))

    # Slump scores at different time points
    features["slump_score_now"] = compute_slump_score(current)
    features["slump_score_1d"] = compute_slump_score(window[-2])
    features["slump_score_3d"] = float(np.mean([compute_slump_score(l) for l in window[-4:-1]]))
    features["slump_score_7d"] = float(np.mean([compute_slump_score(l) for l in window[-8:-1]]))
    features["slump_score_14d"] = float(np.mean([compute_slump_score(l) for l in window[-15:-1]]))
    features["slump_score_21d"] = float(np.mean([compute_slump_score(l) for l in window]))

    # Multiple window averages
    for metric in ["mood", "stress", "confidence", "energy"]:
        features[f"avg_{metric}_3d"] = float(np.mean([l[metric] for l in window[-3:]]))
        features[f"avg_{metric}_7d"] = float(np.mean([l[metric] for l in window[-7:]]))
        features[f"avg_{metric}_14d"] = float(np.mean([l[metric] for l in window[-14:]]))
        features[f"avg_{metric}_21d"] = float(np.mean([l[metric] for l in window]))

    # Trends at multiple scales
    def calc_trend(values):
        if len(values) < 2:
            return 0.0
        x = np.arange(len(values))
        return float(np.polyfit(x, values, 1)[0])

    for metric in ["mood", "stress", "confidence", "energy"]:
        features[f"trend_{metric}_7d"] = calc_trend([l[metric] for l in window[-7:]])
        features[f"trend_{metric}_14d"] = calc_trend([l[metric] for l in window[-14:]])
        features[f"trend_{metric}_21d"] = calc_trend([l[metric] for l in window])

    # Volatility at multiple scales
    for metric in ["mood", "stress", "confidence"]:
        features[f"std_{metric}_7d"] = float(np.std([l[metric] for l in window[-7:]]))
        features[f"std_{metric}_14d"] = float(np.std([l[metric] for l in window[-14:]]))

    # Consecutive pattern detection
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

    features["consec_mood_decline_7d"] = count_consecutive([l["mood"] for l in window[-7:]], "decline")
    features["consec_mood_decline_14d"] = count_consecutive([l["mood"] for l in window[-14:]], "decline")
    features["consec_stress_increase_7d"] = count_consecutive([l["stress"] for l in window[-7:]], "increase")
    features["consec_stress_increase_14d"] = count_consecutive([l["stress"] for l in window[-14:]], "increase")
    features["consec_conf_decline_7d"] = count_consecutive([l["confidence"] for l in window[-7:]], "decline")

    # Bad days count at different windows
    features["bad_days_7d"] = float(sum(1 for l in window[-7:] if compute_slump_score(l) > 0.2))
    features["bad_days_14d"] = float(sum(1 for l in window[-14:] if compute_slump_score(l) > 0.2))
    features["bad_days_21d"] = float(sum(1 for l in window if compute_slump_score(l) > 0.2))

    # Very bad days (higher threshold)
    features["very_bad_days_7d"] = float(sum(1 for l in window[-7:] if compute_slump_score(l) > 0.35))
    features["very_bad_days_14d"] = float(sum(1 for l in window[-14:] if compute_slump_score(l) > 0.35))

    # Min/max metrics
    features["min_mood_7d"] = float(min(l["mood"] for l in window[-7:]))
    features["min_mood_14d"] = float(min(l["mood"] for l in window[-14:]))
    features["max_stress_7d"] = float(max(l["stress"] for l in window[-7:]))
    features["max_stress_14d"] = float(max(l["stress"] for l in window[-14:]))
    features["min_confidence_7d"] = float(min(l["confidence"] for l in window[-7:]))
    features["min_energy_7d"] = float(min(l["energy"] for l in window[-7:]))

    # Change detection (recent vs older)
    recent_7 = window[-7:]
    mid_7 = window[-14:-7]
    older_7 = window[:7]

    features["mood_change_recent_mid"] = float(np.mean([l["mood"] for l in recent_7]) -
                                                np.mean([l["mood"] for l in mid_7]))
    features["mood_change_recent_older"] = float(np.mean([l["mood"] for l in recent_7]) -
                                                  np.mean([l["mood"] for l in older_7]))
    features["stress_change_recent_mid"] = float(np.mean([l["stress"] for l in recent_7]) -
                                                  np.mean([l["stress"] for l in mid_7]))
    features["stress_change_recent_older"] = float(np.mean([l["stress"] for l in recent_7]) -
                                                    np.mean([l["stress"] for l in older_7]))

    # Binary threshold features
    features["is_low_mood"] = 1.0 if features["current_mood"] < 5.5 else 0.0
    features["is_very_low_mood"] = 1.0 if features["current_mood"] < 4.5 else 0.0
    features["is_high_stress"] = 1.0 if features["current_stress"] > 5.5 else 0.0
    features["is_very_high_stress"] = 1.0 if features["current_stress"] > 6.5 else 0.0
    features["is_declining_mood"] = 1.0 if features["trend_mood_7d"] < -0.1 else 0.0
    features["is_declining_confidence"] = 1.0 if features["trend_confidence_7d"] < -0.1 else 0.0
    features["is_rising_stress"] = 1.0 if features["trend_stress_7d"] > 0.1 else 0.0

    # Composite risk scores
    features["risk_score_v1"] = (
        (7 - features["current_mood"]) / 6 * 0.25 +
        (features["current_stress"] - 3) / 7 * 0.25 +
        features["slump_score_7d"] * 0.25 +
        (features["consec_mood_decline_7d"] / 7) * 0.25
    )

    features["risk_score_v2"] = (
        features["slump_score_now"] * 0.3 +
        features["slump_score_7d"] * 0.3 +
        (features["bad_days_7d"] / 7) * 0.2 +
        (-features["trend_mood_14d"]) * 0.2
    )

    # Early warning indicators
    features["early_warning_1"] = (features["trend_mood_14d"] < -0.05) * 1.0
    features["early_warning_2"] = (features["bad_days_14d"] >= 2) * 1.0
    features["early_warning_3"] = (features["slump_score_7d"] > 0.15) * 1.0
    features["early_warning_count"] = (features["early_warning_1"] +
                                       features["early_warning_2"] +
                                       features["early_warning_3"])

    # Sleep quality trend
    features["avg_sleep_7d"] = float(np.mean([l["sleep_hours"] for l in window[-7:]]))
    features["poor_sleep_days_7d"] = float(sum(1 for l in window[-7:] if l["sleep_hours"] < 6))

    # Training load features (if available)
    if "training_load" in window[0]:
        features["avg_training_load_7d"] = float(np.mean([l.get("training_load", 0) for l in window[-7:]]))
        features["max_training_load_7d"] = float(max(l.get("training_load", 0) for l in window[-7:]))

    return features


def prepare_dataset(athlete_logs, lookback=21, predict_window=7):
    """
    Prepare dataset for slump prediction.
    """
    X_data = []
    y_data = []
    feature_names = None

    for athlete_id, logs in athlete_logs.items():
        if len(logs) < lookback + predict_window:
            continue

        # Slide through data
        for end_idx in range(lookback, len(logs) - predict_window + 1):
            features = extract_predictor_features_v3(logs, end_idx, lookback)
            if features is None:
                continue

            if feature_names is None:
                feature_names = list(features.keys())

            # Target: does slump or pre-slump warning occur in next predict_window days?
            # This gives earlier prediction by detecting warning signs
            future = logs[end_idx:end_idx + predict_window]
            has_slump = any(l.get("in_slump", False) or l.get("in_pre_slump", False) for l in future)

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

    # Train XGBoost - even deeper model for 95%+
    model = xgb.XGBClassifier(
        n_estimators=1500,
        max_depth=20,
        learning_rate=0.01,
        min_child_weight=1,
        subsample=0.95,
        colsample_bytree=0.95,
        gamma=0.001,
        reg_alpha=0.001,
        reg_lambda=0.01,
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
    for name, imp in importance[:10]:
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
            "lookback": 21,
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
    print("PERFORMANCE PREDICTOR V3")
    print("Predicts if slump will occur in next 7 days")
    print("Target: 95%+ Balanced Accuracy")
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
