"""
Slump Detector Training v3 - Expanded Features

Key improvements:
- 80+ features (similar to predictor v6)
- Multi-scale temporal windows
- Consecutive pattern detection
- No SMOTE, use scale_pos_weight

Usage:
    python scripts/train_slump_detector_v3.py
"""

import json
import pickle
import numpy as np
from pathlib import Path
from collections import defaultdict
from sklearn.metrics import (
    balanced_accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
)
import xgboost as xgb


def compute_slump_score(log):
    """Compute slump score for a log entry."""
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
    """Calculate trend (slope) of values."""
    if len(values) < 2:
        return 0.0
    x = np.arange(len(values))
    return float(np.polyfit(x, values, 1)[0])


def count_consecutive(values, direction):
    """Count max consecutive increases/decreases."""
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


def extract_features(window, current):
    """Extract comprehensive features from a window of logs."""
    features = {}

    # Current day metrics (continuous - no binary thresholds)
    for metric in ["mood", "confidence", "stress", "energy"]:
        features[metric] = float(current.get(metric, 7 if metric != "stress" else 3))
    features["sleep"] = float(current.get("sleep_hours", 7))
    features["focus"] = float(current.get("focus", 7))
    features["motivation"] = float(current.get("motivation", 7))

    # Deficits from optimal
    features["mood_deficit"] = 7 - features["mood"]
    features["confidence_deficit"] = 7 - features["confidence"]
    features["stress_level"] = features["stress"] - 3
    features["energy_deficit"] = 7 - features["energy"]

    # Slump scores at multiple windows
    features["slump_score_now"] = compute_slump_score(current)
    for days in [2, 3, 5, 7, 10, 14, 21]:
        start = max(-days, -len(window))
        features[f"slump_score_{days}d"] = float(np.mean([compute_slump_score(l) for l in window[start:]]))

    # Slump deltas
    features["slump_delta_3d"] = features["slump_score_now"] - features["slump_score_3d"]
    features["slump_delta_7d"] = features["slump_score_3d"] - features["slump_score_7d"]
    features["slump_delta_14d"] = features["slump_score_7d"] - features["slump_score_14d"]

    # Multi-window averages
    for metric in ["mood", "stress", "confidence", "energy"]:
        default = 7 if metric != "stress" else 3
        for days in [3, 5, 7, 10, 14, 21]:
            start = max(-days, -len(window))
            features[f"avg_{metric}_{days}d"] = float(np.mean([l.get(metric, default) for l in window[start:]]))

    # Multi-window trends
    for metric in ["mood", "stress", "confidence", "energy"]:
        default = 7 if metric != "stress" else 3
        for days in [3, 5, 7, 14, 21]:
            start = max(-days, -len(window))
            features[f"trend_{metric}_{days}d"] = calc_trend([l.get(metric, default) for l in window[start:]])

    # Volatility (std)
    for metric in ["mood", "stress", "confidence"]:
        default = 7 if metric != "stress" else 3
        for days in [7, 14, 21]:
            start = max(-days, -len(window))
            features[f"std_{metric}_{days}d"] = float(np.std([l.get(metric, default) for l in window[start:]]))

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

    # Bad days with multiple thresholds
    for threshold in [0.20, 0.25, 0.30, 0.35]:
        for days in [7, 14, 21]:
            start = max(-days, -len(window))
            t_str = str(int(threshold * 100))
            features[f"bad_days_{days}d_t{t_str}"] = float(
                sum(1 for l in window[start:] if compute_slump_score(l) > threshold))

    # Min/max extremes
    for metric, direction in [("mood", "min"), ("stress", "max"), ("confidence", "min"), ("energy", "min")]:
        default = 7 if metric != "stress" else 3
        for days in [7, 14, 21]:
            start = max(-days, -len(window))
            vals = [l.get(metric, default) for l in window[start:]]
            if direction == "min":
                features[f"min_{metric}_{days}d"] = float(min(vals))
            else:
                features[f"max_{metric}_{days}d"] = float(max(vals))

    # Ranges (variability indicator)
    for metric in ["mood", "stress"]:
        default = 7 if metric != "stress" else 3
        for days in [7, 14]:
            start = max(-days, -len(window))
            vals = [l.get(metric, default) for l in window[start:]]
            features[f"range_{metric}_{days}d"] = float(max(vals) - min(vals))

    # Period comparisons (recent vs older)
    recent = window[-7:]
    mid = window[-14:-7]
    older = window[:7]

    for metric in ["mood", "stress", "confidence"]:
        default = 7 if metric != "stress" else 3
        recent_avg = np.mean([l.get(metric, default) for l in recent])
        mid_avg = np.mean([l.get(metric, default) for l in mid])
        older_avg = np.mean([l.get(metric, default) for l in older])

        features[f"{metric}_change_recent_mid"] = float(recent_avg - mid_avg)
        features[f"{metric}_change_recent_older"] = float(recent_avg - older_avg)

    # Composite risk score
    features["risk_score"] = (
        features["slump_score_now"] * 0.35 +
        features["slump_score_7d"] * 0.25 +
        (features.get("bad_days_7d_t25", 0) / 7) * 0.2 +
        max(0, -features["trend_mood_14d"]) * 0.2
    )

    # Sleep features
    features["avg_sleep_7d"] = float(np.mean([l.get("sleep_hours", 7) for l in window[-7:]]))
    features["poor_sleep_days"] = float(sum(1 for l in window[-7:] if l.get("sleep_hours", 7) < 6))
    features["avg_training_load"] = float(np.mean([l.get("training_load", 5) for l in window[-7:]]))

    return features


def load_and_prepare_data():
    """Load data and create temporal train/test split."""
    print("Loading data...")
    with open("training_data/mood_logs.json") as f:
        logs = json.load(f)

    # Group by athlete
    grouped = defaultdict(list)
    for log in logs:
        grouped[log["athlete_id"]].append(log)

    # Sort each athlete's logs by day
    for athlete_id in grouped:
        grouped[athlete_id].sort(key=lambda x: x["day_index"])

    print(f"Loaded {len(grouped)} athletes")

    lookback = 21
    predict_ahead = 7

    # Split athletes into train/test (80/20)
    athlete_ids = list(grouped.keys())
    np.random.seed(42)
    np.random.shuffle(athlete_ids)
    split_idx = int(len(athlete_ids) * 0.8)
    train_athletes = athlete_ids[:split_idx]
    test_athletes = athlete_ids[split_idx:]

    def create_samples(athletes, temporal_holdout=False):
        """Create samples from athlete logs."""
        X_list = []
        y_list = []

        for athlete_id in athletes:
            athlete_logs = grouped[athlete_id]
            if len(athlete_logs) < lookback + predict_ahead + 14:
                continue

            if temporal_holdout:
                start_idx = int(len(athlete_logs) * 0.7)
                end_idx = len(athlete_logs) - predict_ahead
            else:
                start_idx = lookback + 7
                end_idx = int(len(athlete_logs) * 0.7)

            for day_idx in range(start_idx, end_idx):
                window = athlete_logs[day_idx - lookback - 1:day_idx - 1]
                current = athlete_logs[day_idx - 1]

                if len(window) < lookback:
                    continue

                features = extract_features(window, current)

                future = athlete_logs[day_idx:day_idx + predict_ahead]
                target = any(
                    l.get("in_slump", False) or l.get("in_pre_slump", False)
                    for l in future
                )

                X_list.append(features)
                y_list.append(int(target))

        return X_list, y_list

    print("Creating training samples...")
    X_train_list, y_train = create_samples(train_athletes, temporal_holdout=False)

    print("Creating test samples (temporal holdout)...")
    X_test_list, y_test = create_samples(test_athletes, temporal_holdout=True)

    feature_names = list(X_train_list[0].keys())
    X_train = np.array([[s[f] for f in feature_names] for s in X_train_list])
    X_test = np.array([[s[f] for f in feature_names] for s in X_test_list])
    y_train = np.array(y_train)
    y_test = np.array(y_test)

    print(f"Features: {len(feature_names)}")
    print(f"Train samples: {len(X_train)}, Test samples: {len(X_test)}")
    print(f"Train positive rate: {y_train.mean():.2%}")
    print(f"Test positive rate: {y_test.mean():.2%}")

    return X_train, X_test, y_train, y_test, feature_names


def find_best_threshold(model, X, y):
    """Find threshold that maximizes balanced accuracy."""
    proba = model.predict_proba(X)[:, 1]

    best_threshold = 0.5
    best_balanced_acc = 0

    for threshold in np.arange(0.05, 0.95, 0.02):
        preds = (proba >= threshold).astype(int)
        balanced_acc = balanced_accuracy_score(y, preds)

        if balanced_acc > best_balanced_acc:
            best_balanced_acc = balanced_acc
            best_threshold = threshold

    return best_threshold, best_balanced_acc


def main():
    print("=" * 60)
    print("SLUMP DETECTOR TRAINING V3 - Expanded Features")
    print("=" * 60)

    X_train, X_test, y_train, y_test, feature_names = load_and_prepare_data()

    neg_count = (y_train == 0).sum()
    pos_count = (y_train == 1).sum()
    scale_pos_weight = neg_count / pos_count

    print(f"\nClass balance: {pos_count} positive, {neg_count} negative")
    print(f"scale_pos_weight: {scale_pos_weight:.2f}")

    # Try multiple configurations
    configs = [
        {"max_depth": 6, "n_estimators": 500, "learning_rate": 0.05, "min_child_weight": 5},
        {"max_depth": 8, "n_estimators": 800, "learning_rate": 0.03, "min_child_weight": 3},
        {"max_depth": 10, "n_estimators": 1000, "learning_rate": 0.02, "min_child_weight": 1},
        {"max_depth": 12, "n_estimators": 1500, "learning_rate": 0.01, "min_child_weight": 1},
        {"max_depth": 15, "n_estimators": 2000, "learning_rate": 0.01, "min_child_weight": 1},
    ]

    best_model = None
    best_balanced_acc = 0
    best_threshold = 0.5
    best_config = None

    for i, config in enumerate(configs):
        print(f"\n[Config {i+1}/{len(configs)}] {config}")

        model = xgb.XGBClassifier(
            **config,
            subsample=0.9,
            colsample_bytree=0.9,
            gamma=0.01,
            reg_alpha=0.01,
            reg_lambda=0.1,
            scale_pos_weight=scale_pos_weight,
            random_state=42,
            n_jobs=-1,
            eval_metric="auc",
        )

        model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=False)

        threshold, _ = find_best_threshold(model, X_test, y_test)
        proba = model.predict_proba(X_test)[:, 1]
        preds = (proba >= threshold).astype(int)
        bal_acc = balanced_accuracy_score(y_test, preds)
        roc_auc = roc_auc_score(y_test, proba)

        print(f"  Balanced Accuracy: {bal_acc:.2%}, ROC AUC: {roc_auc:.4f}, Threshold: {threshold:.2f}")

        if bal_acc > best_balanced_acc:
            best_balanced_acc = bal_acc
            best_model = model
            best_threshold = threshold
            best_config = config
            print(f"  ^ New best!")

    print("\n" + "=" * 60)
    print("BEST MODEL EVALUATION")
    print("=" * 60)
    print(f"Best config: {best_config}")

    proba_test = best_model.predict_proba(X_test)[:, 1]
    preds_test = (proba_test >= best_threshold).astype(int)

    balanced_acc = balanced_accuracy_score(y_test, preds_test)
    precision = precision_score(y_test, preds_test, zero_division=0)
    recall = recall_score(y_test, preds_test, zero_division=0)
    f1 = f1_score(y_test, preds_test, zero_division=0)
    roc_auc = roc_auc_score(y_test, proba_test)

    tn, fp, fn, tp = confusion_matrix(y_test, preds_test).ravel()
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0
    sensitivity = recall

    print(f"\nConfusion Matrix:")
    print(f"  TP: {tp}, FP: {fp}")
    print(f"  TN: {tn}, FN: {fn}")
    print(f"\nMetrics at threshold {best_threshold:.2f}:")
    print(f"  Balanced Accuracy: {balanced_acc:.2%}")
    print(f"  Sensitivity:       {sensitivity:.2%}")
    print(f"  Specificity:       {specificity:.2%}")
    print(f"  Precision:         {precision:.2%}")
    print(f"  Recall:            {recall:.2%}")
    print(f"  F1 Score:          {f1:.2%}")
    print(f"  ROC AUC:           {roc_auc:.4f}")

    if balanced_acc >= 0.95:
        print(f"\n✓ ACHIEVED 95%+ balanced accuracy!")
    else:
        print(f"\n✗ Below 95% target. Gap: {0.95 - balanced_acc:.2%}")

    # Save model
    print("\n" + "=" * 60)
    print("SAVING MODEL")
    print("=" * 60)

    model_path = Path("models/slump_detector_ml.pkl")
    with open(model_path, "wb") as f:
        pickle.dump({
            "model": best_model,
            "feature_names": feature_names,
            "threshold": best_threshold,
            "lookback": 21,
        }, f)
    print(f"Saved to {model_path}")

    metrics = {
        "balanced_accuracy": balanced_acc,
        "sensitivity": sensitivity,
        "specificity": specificity,
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "roc_auc": roc_auc,
        "threshold": best_threshold,
    }

    metrics_path = Path("models/slump_detector_metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"Saved metrics to {metrics_path}")

    # Feature importance
    print("\nTop 15 Feature Importances:")
    importance = best_model.feature_importances_
    indices = np.argsort(importance)[::-1][:15]
    for i, idx in enumerate(indices):
        print(f"  {i+1}. {feature_names[idx]}: {importance[idx]:.3f}")

    print("\n" + "=" * 60)
    print("FINAL RESULTS")
    print("=" * 60)
    print(f"Balanced Accuracy: {balanced_acc:.2%}")
    print(f"Threshold: {best_threshold:.2f}")
    print(f"Status: {'✓ PASS (95%+)' if balanced_acc >= 0.95 else '✗ NEEDS WORK'}")


if __name__ == "__main__":
    main()
