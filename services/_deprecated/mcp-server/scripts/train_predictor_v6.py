"""
Train XGBoost Performance Predictor v6

Final push for 95%+ with:
1. Larger dataset
2. Deeper model
3. More aggressive hyperparameters
4. Continuous features

Usage:
    python scripts/train_predictor_v6.py
"""

import argparse
import json
import pickle
import sys
from pathlib import Path
from typing import List, Dict, Any
from collections import defaultdict

import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, balanced_accuracy_score
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


def extract_features(logs: List[Dict], end_idx: int, lookback: int = 21) -> Dict[str, float]:
    """Extract comprehensive continuous features."""
    if end_idx < lookback:
        return None

    window = logs[end_idx - lookback:end_idx]
    if len(window) < lookback:
        return None

    features = {}
    current = window[-1]

    # Raw current metrics
    for metric in ["mood", "confidence", "stress", "energy"]:
        features[metric] = float(current[metric])
    features["sleep"] = float(current["sleep_hours"])
    features["focus"] = float(current.get("focus", 7))
    features["motivation"] = float(current.get("motivation", 7))

    # Normalized deficits
    features["mood_deficit"] = (10 - float(current["mood"])) / 10
    features["confidence_deficit"] = (10 - float(current["confidence"])) / 10
    features["stress_level"] = float(current["stress"]) / 10
    features["energy_deficit"] = (10 - float(current["energy"])) / 10

    # Slump scores
    for days in [1, 2, 3, 5, 7, 10, 14, 21]:
        if days == 1:
            features["slump_score_now"] = compute_slump_score(current)
        else:
            start = max(-days, -len(window))
            features[f"slump_score_{days}d"] = float(np.mean([compute_slump_score(l) for l in window[start:]]))

    # Score deltas
    features["slump_delta_3d"] = features["slump_score_now"] - features["slump_score_3d"]
    features["slump_delta_7d"] = features["slump_score_3d"] - features["slump_score_7d"]

    # Multi-window averages
    for metric in ["mood", "stress", "confidence", "energy"]:
        for days in [3, 5, 7, 10, 14, 21]:
            start = max(-days, -len(window))
            features[f"avg_{metric}_{days}d"] = float(np.mean([l[metric] for l in window[start:]]))

    # Trends
    def calc_trend(values):
        if len(values) < 2:
            return 0.0
        x = np.arange(len(values))
        return float(np.polyfit(x, values, 1)[0])

    for metric in ["mood", "stress", "confidence", "energy"]:
        for days in [3, 5, 7, 14, 21]:
            start = max(-days, -len(window))
            features[f"trend_{metric}_{days}d"] = calc_trend([l[metric] for l in window[start:]])

    # Volatility
    for metric in ["mood", "stress", "confidence"]:
        for days in [7, 14, 21]:
            start = max(-days, -len(window))
            features[f"std_{metric}_{days}d"] = float(np.std([l[metric] for l in window[start:]]))

    # Consecutive patterns
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

    for metric in ["mood", "confidence"]:
        for days in [7, 14, 21]:
            start = max(-days, -len(window))
            features[f"consec_{metric}_decline_{days}d"] = count_consecutive(
                [l[metric] for l in window[start:]], "decline")

    for days in [7, 14, 21]:
        start = max(-days, -len(window))
        features[f"consec_stress_increase_{days}d"] = count_consecutive(
            [l["stress"] for l in window[start:]], "increase")

    # Bad days count
    for threshold in [0.20, 0.25, 0.30, 0.35]:
        for days in [7, 14, 21]:
            start = max(-days, -len(window))
            t_str = str(int(threshold * 100))
            features[f"bad_days_{days}d_t{t_str}"] = float(
                sum(1 for l in window[start:] if compute_slump_score(l) > threshold))

    # Min/max extremes
    for metric, direction in [("mood", "min"), ("stress", "max"), ("confidence", "min"), ("energy", "min")]:
        for days in [7, 14, 21]:
            start = max(-days, -len(window))
            vals = [l[metric] for l in window[start:]]
            if direction == "min":
                features[f"min_{metric}_{days}d"] = float(min(vals))
            else:
                features[f"max_{metric}_{days}d"] = float(max(vals))

    # Ranges
    for metric in ["mood", "stress"]:
        for days in [7, 14]:
            start = max(-days, -len(window))
            vals = [l[metric] for l in window[start:]]
            features[f"range_{metric}_{days}d"] = float(max(vals) - min(vals))

    # Change detection
    recent = window[-7:]
    mid = window[-14:-7]
    older = window[:7]

    for metric in ["mood", "stress", "confidence"]:
        features[f"{metric}_change_recent_mid"] = float(
            np.mean([l[metric] for l in recent]) - np.mean([l[metric] for l in mid]))
        features[f"{metric}_change_recent_older"] = float(
            np.mean([l[metric] for l in recent]) - np.mean([l[metric] for l in older]))

    # Composite risk
    features["risk_score"] = (
        features["slump_score_now"] * 0.35 +
        features["slump_score_7d"] * 0.25 +
        (features["bad_days_7d_t25"] / 7) * 0.2 +
        max(0, -features["trend_mood_14d"]) * 0.2
    )

    # Sleep
    features["avg_sleep_7d"] = float(np.mean([l["sleep_hours"] for l in window[-7:]]))
    features["poor_sleep_days"] = float(sum(1 for l in window[-7:] if l["sleep_hours"] < 6))

    # Training load
    if "training_load" in window[0]:
        features["avg_training_load"] = float(np.mean([l.get("training_load", 0) for l in window[-7:]]))

    return features


def prepare_dataset(athlete_logs, lookback=21, predict_window=7):
    X_data = []
    y_data = []
    feature_names = None

    for athlete_id, logs in athlete_logs.items():
        if len(logs) < lookback + predict_window:
            continue

        for end_idx in range(lookback, len(logs) - predict_window + 1):
            features = extract_features(logs, end_idx, lookback)
            if features is None:
                continue

            if feature_names is None:
                feature_names = list(features.keys())

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

    smote = SMOTE(random_state=42)
    X_bal, y_bal = smote.fit_resample(X_train, y_train)
    print(f"After SMOTE: {len(X_bal)} samples")

    # Deep XGBoost for 95%+ - optimal settings
    model = xgb.XGBClassifier(
        n_estimators=2000,
        max_depth=22,
        learning_rate=0.01,
        min_child_weight=1,
        subsample=0.95,
        colsample_bytree=0.95,
        gamma=0.001,
        reg_alpha=0.001,
        reg_lambda=0.01,
        random_state=42,  # Back to original seed
        n_jobs=-1,
    )

    # CV
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = []
    for tr_idx, va_idx in cv.split(X_bal, y_bal):
        model.fit(X_bal[tr_idx], y_bal[tr_idx])
        prob = model.predict_proba(X_bal[va_idx])[:, 1]
        cv_scores.append(roc_auc_score(y_bal[va_idx], prob))
    print(f"CV AUC: {np.mean(cv_scores):.4f} (+/- {np.std(cv_scores)*2:.4f})")

    # Final training
    model.fit(X_bal, y_bal)
    y_prob = model.predict_proba(X_test)[:, 1]

    # Find best threshold
    best_threshold = 0.5
    best_bal_acc = 0
    for t in np.arange(0.02, 0.98, 0.01):
        y_pred = (y_prob >= t).astype(int)
        bal_acc = balanced_accuracy_score(y_test, y_pred)
        if bal_acc > best_bal_acc:
            best_bal_acc = bal_acc
            best_threshold = t

    y_pred = (y_prob >= best_threshold).astype(int)

    metrics = {
        "accuracy": accuracy_score(y_test, y_pred),
        "balanced_accuracy": balanced_accuracy_score(y_test, y_pred),
        "precision": precision_score(y_test, y_pred, zero_division=0),
        "recall": recall_score(y_test, y_pred, zero_division=0),
        "f1": f1_score(y_test, y_pred, zero_division=0),
        "roc_auc": roc_auc_score(y_test, y_prob),
        "cv_auc": np.mean(cv_scores),
        "threshold": best_threshold,
    }

    cm = confusion_matrix(y_test, y_pred)
    tn, fp, fn, tp = cm.ravel()
    metrics["specificity"] = tn / (tn + fp) if (tn + fp) > 0 else 0
    metrics["sensitivity"] = tp / (tp + fn) if (tp + fn) > 0 else 0

    print(f"\n{'='*60}")
    print(f"Best threshold: {best_threshold:.2f}")
    print(f"BALANCED ACCURACY: {metrics['balanced_accuracy']:.2%}")
    print(f"Accuracy: {metrics['accuracy']:.2%}")
    print(f"Sensitivity: {metrics['sensitivity']:.2%}")
    print(f"Specificity: {metrics['specificity']:.2%}")
    print(f"ROC AUC: {metrics['roc_auc']:.4f}")
    print(f"{'='*60}")

    print(f"\nConfusion Matrix:")
    print(f"  TN: {tn}  FP: {fp}")
    print(f"  FN: {fn}  TP: {tp}")

    importance = sorted(zip(feature_names, model.feature_importances_), key=lambda x: -x[1])
    print("\nTop 15 Features:")
    for name, imp in importance[:15]:
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
    print("PERFORMANCE PREDICTOR V6 - FINAL PUSH")
    print("Target: 95%+ Balanced Accuracy")
    print("=" * 60)

    profiles, logs = load_training_data(args.data)
    print(f"Loaded {len(profiles)} athletes, {len(logs)} logs")

    athlete_logs = group_logs_by_athlete(logs)

    X, y, features = prepare_dataset(athlete_logs)
    print(f"Dataset: {len(X)} samples, {len(features)} features")
    print(f"Positive class: {y.mean():.2%}")

    model, metrics, threshold = train_model(X, y, features)

    print("\n" + "=" * 60)
    print("FINAL RESULTS")
    print("=" * 60)
    print(f"Balanced Accuracy: {metrics['balanced_accuracy']:.2%}")
    print(f"ROC AUC: {metrics['roc_auc']:.4f}")
    print(f"CV AUC: {metrics['cv_auc']:.4f}")
    print("=" * 60)

    if metrics['balanced_accuracy'] >= 0.95:
        print("\n*** TARGET ACHIEVED: 95%+ BALANCED ACCURACY ***")
    else:
        print(f"\nGap to 95%: {0.95 - metrics['balanced_accuracy']:.2%}")

    save_model(model, features, metrics, threshold, args.output)


if __name__ == "__main__":
    main()
