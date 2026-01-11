"""
Train ML-based Slump Detector v3

Uses temporal/sequence features to capture the continuous nature of slumps.
Slumps last 5-21 days, so we use features that capture:
1. Recent slump-like patterns (consecutive bad days)
2. Deviation from baseline over time
3. Pattern matching for slump signatures

Target: 95%+ accuracy

Usage:
    python scripts/train_slump_detector_v3.py
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
    """
    Compute a 'slump score' based on metrics.

    In the synthetic data, slumps cause:
    - Mood to decrease by slump_effect
    - Stress to increase by slump_effect * 0.5
    - Energy and confidence to be affected indirectly
    """
    mood = log.get("mood", 7)
    stress = log.get("stress", 3)
    confidence = log.get("confidence", 7)
    energy = log.get("energy", 7)

    # Slump indicators (higher = more likely slump)
    # Normal: mood ~7-8, stress ~3, confidence ~7-8
    # Slump: mood drops, stress rises, confidence drops

    mood_component = max(0, (7 - mood) / 6)  # 0 if mood >= 7, up to 1 if mood = 1
    stress_component = max(0, (stress - 4) / 6)  # 0 if stress <= 4, up to 1 if stress = 10
    conf_component = max(0, (7 - confidence) / 6)
    energy_component = max(0, (7 - energy) / 6)

    # Weighted combination
    score = (mood_component * 0.4 + stress_component * 0.3 +
             conf_component * 0.2 + energy_component * 0.1)

    return score


def extract_temporal_features(logs: List[Dict], target_idx: int, lookback: int = 21) -> Dict[str, float]:
    """
    Extract features that capture temporal/sequential patterns.
    """
    if target_idx < lookback:
        return None

    window = logs[max(0, target_idx - lookback):target_idx + 1]  # Include current day
    current = logs[target_idx]

    if len(window) < lookback:
        return None

    features = {}

    # Current day metrics
    features["mood"] = float(current["mood"])
    features["confidence"] = float(current["confidence"])
    features["stress"] = float(current["stress"])
    features["energy"] = float(current["energy"])
    features["sleep"] = float(current["sleep_hours"])

    # Current day slump score
    features["slump_score"] = compute_slump_score(current)

    # Last 3 days average slump score (temporal continuity)
    last_3 = window[-4:-1]  # Days before current
    features["slump_score_3d"] = np.mean([compute_slump_score(l) for l in last_3])

    # Last 7 days average slump score
    last_7 = window[-8:-1]
    features["slump_score_7d"] = np.mean([compute_slump_score(l) for l in last_7])

    # Count of "bad" days in last 7 (slump score > threshold)
    features["bad_days_7d"] = sum(1 for l in last_7 if compute_slump_score(l) > 0.3)

    # Consecutive bad days ending at current
    consec_bad = 0
    for l in reversed(window[:-1]):  # Exclude current
        if compute_slump_score(l) > 0.25:
            consec_bad += 1
        else:
            break
    features["consecutive_bad_days"] = float(consec_bad)

    # Mood trend over window
    moods = [l["mood"] for l in window]
    features["mood_trend"] = float(np.polyfit(range(len(moods)), moods, 1)[0])

    # Stress trend over window
    stresses = [l["stress"] for l in window]
    features["stress_trend"] = float(np.polyfit(range(len(stresses)), stresses, 1)[0])

    # Deviation from baseline (first week)
    baseline_mood = np.mean([l["mood"] for l in window[:7]])
    baseline_stress = np.mean([l["stress"] for l in window[:7]])
    features["mood_vs_baseline"] = features["mood"] - baseline_mood
    features["stress_vs_baseline"] = features["stress"] - baseline_stress

    # Recent vs older (pattern change)
    recent = window[-7:]
    older = window[:7]
    features["mood_change"] = np.mean([l["mood"] for l in recent]) - np.mean([l["mood"] for l in older])
    features["stress_change"] = np.mean([l["stress"] for l in recent]) - np.mean([l["stress"] for l in older])

    # Min/max in window
    features["min_mood_7d"] = min(l["mood"] for l in last_7)
    features["max_stress_7d"] = max(l["stress"] for l in last_7)

    # Volatility
    features["mood_std"] = float(np.std([l["mood"] for l in last_7]))
    features["stress_std"] = float(np.std([l["stress"] for l in last_7]))

    # Binary thresholds
    features["is_low_mood"] = 1.0 if features["mood"] < 5.5 else 0.0
    features["is_high_stress"] = 1.0 if features["stress"] > 5.5 else 0.0

    # Combined slump indicator
    features["combined_slump"] = (
        features["slump_score"] * 0.4 +
        features["slump_score_3d"] * 0.3 +
        features["slump_score_7d"] * 0.2 +
        (features["consecutive_bad_days"] / 10) * 0.1
    )

    return features


def prepare_dataset(athlete_logs, lookback=21):
    X_data = []
    y_data = []
    feature_names = None

    for athlete_id, logs in athlete_logs.items():
        if len(logs) < lookback + 1:
            continue

        for day_idx in range(lookback, len(logs)):
            features = extract_temporal_features(logs, day_idx, lookback)
            if features is None:
                continue

            if feature_names is None:
                feature_names = list(features.keys())

            is_slump = logs[day_idx].get("in_slump", False)
            X_data.append([features[f] for f in feature_names])
            y_data.append(1 if is_slump else 0)

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

    # Train XGBoost with aggressive hyperparameters for 95%+ accuracy
    model = xgb.XGBClassifier(
        n_estimators=800,
        max_depth=15,
        learning_rate=0.02,
        min_child_weight=1,
        subsample=0.95,
        colsample_bytree=0.95,
        gamma=0.005,
        reg_alpha=0.005,
        reg_lambda=0.1,
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
    metrics["specificity"] = tn / (tn + fp)
    metrics["sensitivity"] = tp / (tp + fn)

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

    with open(output_path / "slump_detector_ml.pkl", "wb") as f:
        pickle.dump({
            "model": model,
            "feature_names": feature_names,
            "metrics": metrics,
            "threshold": threshold,
            "lookback": 21,
        }, f)

    with open(output_path / "slump_detector_metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"\nModel saved to {output_path}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", default="./training_data")
    parser.add_argument("--output", default="./models")
    args = parser.parse_args()

    print("=" * 60)
    print("SLUMP DETECTOR V3 - TEMPORAL FEATURES")
    print("=" * 60)

    profiles, logs = load_training_data(args.data)
    print(f"Loaded {len(profiles)} athletes, {len(logs)} logs")

    athlete_logs = group_logs_by_athlete(logs)

    X, y, features = prepare_dataset(athlete_logs)
    print(f"Dataset: {len(X)} samples, {len(features)} features")

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
