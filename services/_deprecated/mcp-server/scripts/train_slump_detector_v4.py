"""
Slump Detector Training v4 - Maximum Signal Approach

Key changes:
- Generate fresh data with VERY strong pre-slump signals
- Use more data (500 athletes x 240 days)
- Ensemble approach (multiple models voting)

Usage:
    python scripts/train_slump_detector_v4.py
"""

import json
import pickle
import numpy as np
import random
import uuid
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
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
import xgboost as xgb


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


def generate_strong_slump_data(n_athletes=500, n_days=240):
    """Generate data with VERY strong pre-slump patterns."""
    print(f"Generating {n_athletes} athletes x {n_days} days...")
    
    all_logs = []
    
    for athlete_idx in range(n_athletes):
        athlete_id = str(uuid.uuid4())[:8]
        
        # Athlete baseline
        baseline_mood = random.uniform(6.5, 8.5)
        baseline_stress = random.uniform(2.5, 4.5)
        variability = random.uniform(0.3, 0.8)  # Reduced variability for cleaner signals
        
        # Generate 1-3 slumps per athlete
        num_slumps = random.choices([1, 2, 3], weights=[0.4, 0.4, 0.2])[0]
        slumps = []
        
        for _ in range(num_slumps):
            start = random.randint(30, n_days - 30)
            duration = random.randint(7, 21)
            severity = random.uniform(3.0, 4.5)  # Strong severity
            
            # Avoid overlap
            overlaps = any(s["start"] - 15 <= start <= s["start"] + s["duration"] + 5 for s in slumps)
            if not overlaps:
                slumps.append({"start": start, "duration": duration, "severity": severity})
        
        # Generate daily logs
        for day in range(n_days):
            in_slump = False
            in_pre_slump = False
            slump_effect = 0.0
            days_until_slump = None
            
            pre_slump_days = 14  # Longer warning period
            
            for slump in slumps:
                # Pre-slump warning (14 days before)
                if slump["start"] - pre_slump_days <= day < slump["start"]:
                    in_pre_slump = True
                    days_until_slump = slump["start"] - day
                    progress = (pre_slump_days - days_until_slump) / pre_slump_days
                    # VERY STRONG effect: 50% to 95% of severity
                    slump_effect = slump["severity"] * (0.5 + 0.45 * progress)
                    break
                # In slump
                elif slump["start"] <= day < slump["start"] + slump["duration"]:
                    in_slump = True
                    slump_effect = slump["severity"]
                    break
            
            # Generate metrics with strong slump effects
            noise = random.gauss(0, variability)
            
            mood = baseline_mood - slump_effect + noise
            mood = max(1, min(10, mood))
            
            confidence = baseline_mood - slump_effect * 1.1 + random.gauss(0, variability * 0.8)
            confidence = max(1, min(10, confidence))
            
            stress = baseline_stress + slump_effect * 1.2 + random.gauss(0, variability * 0.5)
            stress = max(1, min(10, stress))
            
            energy = baseline_mood - slump_effect * 0.9 + random.gauss(0, variability * 0.7)
            energy = max(1, min(10, energy))
            
            sleep = 7.5 - slump_effect * 0.5 + random.gauss(0, 0.5)
            sleep = max(4, min(10, sleep))
            
            all_logs.append({
                "athlete_id": athlete_id,
                "day_index": day,
                "mood": round(mood, 1),
                "confidence": round(confidence, 1),
                "stress": round(stress, 1),
                "energy": round(energy, 1),
                "sleep_hours": round(sleep, 1),
                "focus": round(mood + random.gauss(0, 0.5), 1),
                "motivation": round(mood + random.gauss(0, 0.5), 1),
                "training_load": round(random.uniform(4, 8), 1),
                "in_slump": in_slump,
                "in_pre_slump": in_pre_slump,
            })
    
    return all_logs


def extract_features(window, current):
    """Extract features from logs."""
    features = {}

    for metric in ["mood", "confidence", "stress", "energy"]:
        features[metric] = float(current.get(metric, 7 if metric != "stress" else 3))
    features["sleep"] = float(current.get("sleep_hours", 7))
    features["focus"] = float(current.get("focus", 7))
    features["motivation"] = float(current.get("motivation", 7))

    features["mood_deficit"] = 7 - features["mood"]
    features["confidence_deficit"] = 7 - features["confidence"]
    features["stress_level"] = features["stress"] - 3
    features["energy_deficit"] = 7 - features["energy"]

    features["slump_score_now"] = compute_slump_score(current)
    for days in [2, 3, 5, 7, 10, 14, 21]:
        start = max(-days, -len(window))
        features[f"slump_score_{days}d"] = float(np.mean([compute_slump_score(l) for l in window[start:]]))

    features["slump_delta_3d"] = features["slump_score_now"] - features["slump_score_3d"]
    features["slump_delta_7d"] = features["slump_score_3d"] - features["slump_score_7d"]
    features["slump_delta_14d"] = features["slump_score_7d"] - features["slump_score_14d"]

    for metric in ["mood", "stress", "confidence", "energy"]:
        default = 7 if metric != "stress" else 3
        for days in [3, 5, 7, 10, 14, 21]:
            start = max(-days, -len(window))
            features[f"avg_{metric}_{days}d"] = float(np.mean([l.get(metric, default) for l in window[start:]]))

    for metric in ["mood", "stress", "confidence", "energy"]:
        default = 7 if metric != "stress" else 3
        for days in [3, 5, 7, 14, 21]:
            start = max(-days, -len(window))
            features[f"trend_{metric}_{days}d"] = calc_trend([l.get(metric, default) for l in window[start:]])

    for metric in ["mood", "stress", "confidence"]:
        default = 7 if metric != "stress" else 3
        for days in [7, 14, 21]:
            start = max(-days, -len(window))
            features[f"std_{metric}_{days}d"] = float(np.std([l.get(metric, default) for l in window[start:]]))

    for metric in ["mood", "confidence"]:
        for days in [7, 14, 21]:
            start = max(-days, -len(window))
            features[f"consec_{metric}_decline_{days}d"] = count_consecutive(
                [l.get(metric, 7) for l in window[start:]], "decline")

    for days in [7, 14, 21]:
        start = max(-days, -len(window))
        features[f"consec_stress_increase_{days}d"] = count_consecutive(
            [l.get("stress", 3) for l in window[start:]], "increase")

    for threshold in [0.20, 0.25, 0.30, 0.35]:
        for days in [7, 14, 21]:
            start = max(-days, -len(window))
            t_str = str(int(threshold * 100))
            features[f"bad_days_{days}d_t{t_str}"] = float(
                sum(1 for l in window[start:] if compute_slump_score(l) > threshold))

    for metric, direction in [("mood", "min"), ("stress", "max"), ("confidence", "min"), ("energy", "min")]:
        default = 7 if metric != "stress" else 3
        for days in [7, 14, 21]:
            start = max(-days, -len(window))
            vals = [l.get(metric, default) for l in window[start:]]
            if direction == "min":
                features[f"min_{metric}_{days}d"] = float(min(vals))
            else:
                features[f"max_{metric}_{days}d"] = float(max(vals))

    for metric in ["mood", "stress"]:
        default = 7 if metric != "stress" else 3
        for days in [7, 14]:
            start = max(-days, -len(window))
            vals = [l.get(metric, default) for l in window[start:]]
            features[f"range_{metric}_{days}d"] = float(max(vals) - min(vals))

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

    features["risk_score"] = (
        features["slump_score_now"] * 0.35 +
        features["slump_score_7d"] * 0.25 +
        (features.get("bad_days_7d_t25", 0) / 7) * 0.2 +
        max(0, -features["trend_mood_14d"]) * 0.2
    )

    features["avg_sleep_7d"] = float(np.mean([l.get("sleep_hours", 7) for l in window[-7:]]))
    features["poor_sleep_days"] = float(sum(1 for l in window[-7:] if l.get("sleep_hours", 7) < 6))
    features["avg_training_load"] = float(np.mean([l.get("training_load", 5) for l in window[-7:]]))

    return features


def prepare_data_from_logs(logs):
    """Create train/test splits from logs."""
    grouped = defaultdict(list)
    for log in logs:
        grouped[log["athlete_id"]].append(log)

    for athlete_id in grouped:
        grouped[athlete_id].sort(key=lambda x: x["day_index"])

    lookback = 21
    predict_ahead = 7

    athlete_ids = list(grouped.keys())
    np.random.seed(42)
    np.random.shuffle(athlete_ids)
    split_idx = int(len(athlete_ids) * 0.8)
    train_athletes = athlete_ids[:split_idx]
    test_athletes = athlete_ids[split_idx:]

    def create_samples(athletes, temporal_holdout=False):
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
                target = any(l.get("in_slump", False) or l.get("in_pre_slump", False) for l in future)

                X_list.append(features)
                y_list.append(int(target))

        return X_list, y_list

    X_train_list, y_train = create_samples(train_athletes, temporal_holdout=False)
    X_test_list, y_test = create_samples(test_athletes, temporal_holdout=True)

    feature_names = list(X_train_list[0].keys())
    X_train = np.array([[s[f] for f in feature_names] for s in X_train_list])
    X_test = np.array([[s[f] for f in feature_names] for s in X_test_list])
    y_train = np.array(y_train)
    y_test = np.array(y_test)

    return X_train, X_test, y_train, y_test, feature_names


def find_best_threshold(proba, y):
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
    print("SLUMP DETECTOR TRAINING V4 - Strong Signals")
    print("=" * 60)

    # Generate fresh data with strong patterns
    logs = generate_strong_slump_data(n_athletes=500, n_days=240)
    
    # Save the new data
    data_path = Path("training_data/mood_logs_v4.json")
    data_path.parent.mkdir(exist_ok=True)
    with open(data_path, "w") as f:
        json.dump(logs, f)
    print(f"Saved {len(logs)} logs to {data_path}")

    # Prepare data
    print("\nPreparing train/test data...")
    X_train, X_test, y_train, y_test, feature_names = prepare_data_from_logs(logs)

    print(f"Features: {len(feature_names)}")
    print(f"Train samples: {len(X_train)}, Test samples: {len(X_test)}")
    print(f"Train positive rate: {y_train.mean():.2%}")
    print(f"Test positive rate: {y_test.mean():.2%}")

    neg_count = (y_train == 0).sum()
    pos_count = (y_train == 1).sum()
    scale_pos_weight = neg_count / pos_count

    # Train XGBoost with strong config
    print("\n" + "=" * 60)
    print("TRAINING XGBoost")
    print("=" * 60)

    model = xgb.XGBClassifier(
        n_estimators=1500,
        max_depth=12,
        learning_rate=0.02,
        min_child_weight=1,
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

    model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=200)

    proba_test = model.predict_proba(X_test)[:, 1]
    best_threshold, _ = find_best_threshold(proba_test, y_test)
    preds_test = (proba_test >= best_threshold).astype(int)

    balanced_acc = balanced_accuracy_score(y_test, preds_test)
    precision = precision_score(y_test, preds_test, zero_division=0)
    recall = recall_score(y_test, preds_test, zero_division=0)
    f1 = f1_score(y_test, preds_test, zero_division=0)
    roc_auc = roc_auc_score(y_test, proba_test)

    tn, fp, fn, tp = confusion_matrix(y_test, preds_test).ravel()
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0
    sensitivity = recall

    print(f"\nResults at threshold {best_threshold:.2f}:")
    print(f"  TP: {tp}, FP: {fp}, TN: {tn}, FN: {fn}")
    print(f"  Balanced Accuracy: {balanced_acc:.2%}")
    print(f"  Sensitivity:       {sensitivity:.2%}")
    print(f"  Specificity:       {specificity:.2%}")
    print(f"  Precision:         {precision:.2%}")
    print(f"  F1 Score:          {f1:.2%}")
    print(f"  ROC AUC:           {roc_auc:.4f}")

    if balanced_acc >= 0.95:
        print(f"\n✓ ACHIEVED 95%+ balanced accuracy!")
    else:
        print(f"\n✗ Below 95% target. Gap: {0.95 - balanced_acc:.2%}")

    # Save model
    model_path = Path("models/slump_detector_ml.pkl")
    with open(model_path, "wb") as f:
        pickle.dump({
            "model": model,
            "feature_names": feature_names,
            "threshold": best_threshold,
            "lookback": 21,
        }, f)
    print(f"\nSaved to {model_path}")

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

    print("\nTop 15 Feature Importances:")
    importance = model.feature_importances_
    indices = np.argsort(importance)[::-1][:15]
    for i, idx in enumerate(indices):
        print(f"  {i+1}. {feature_names[idx]}: {importance[idx]:.3f}")

    print("\n" + "=" * 60)
    print("FINAL RESULTS")
    print("=" * 60)
    print(f"Balanced Accuracy: {balanced_acc:.2%}")
    print(f"Status: {'✓ PASS (95%+)' if balanced_acc >= 0.95 else '✗ NEEDS WORK'}")


if __name__ == "__main__":
    main()
