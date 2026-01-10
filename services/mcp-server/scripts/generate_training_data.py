"""
Generate synthetic training data for ML model calibration.

This creates realistic athlete mood/performance trajectories that can be used
to calibrate and test the ML models before real pilot data is available.

Usage:
    python scripts/generate_training_data.py --athletes 50 --days 90 --output ./training_data
"""

import argparse
import json
import random
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Any
import csv

# Sports with their typical stress patterns
SPORTS = [
    {"name": "basketball", "season_stress": 0.7, "practice_days": 5},
    {"name": "soccer", "season_stress": 0.6, "practice_days": 5},
    {"name": "swimming", "season_stress": 0.8, "practice_days": 6},
    {"name": "track", "season_stress": 0.5, "practice_days": 5},
    {"name": "volleyball", "season_stress": 0.6, "practice_days": 5},
    {"name": "football", "season_stress": 0.8, "practice_days": 5},
    {"name": "tennis", "season_stress": 0.5, "practice_days": 4},
    {"name": "golf", "season_stress": 0.4, "practice_days": 4},
    {"name": "gymnastics", "season_stress": 0.9, "practice_days": 6},
    {"name": "wrestling", "season_stress": 0.8, "practice_days": 5},
]

# Personality archetypes that affect baseline and variability
ARCHETYPES = [
    {"name": "steady", "baseline_mood": 7.5, "variability": 0.5, "resilience": 0.8},
    {"name": "anxious", "baseline_mood": 6.0, "variability": 1.2, "resilience": 0.5},
    {"name": "confident", "baseline_mood": 8.0, "variability": 0.6, "resilience": 0.9},
    {"name": "volatile", "baseline_mood": 7.0, "variability": 1.5, "resilience": 0.6},
    {"name": "perfectionist", "baseline_mood": 6.5, "variability": 1.0, "resilience": 0.4},
]


def generate_athlete_profile() -> Dict[str, Any]:
    """Generate a random athlete profile."""
    sport = random.choice(SPORTS)
    archetype = random.choice(ARCHETYPES)

    return {
        "athlete_id": str(uuid.uuid4())[:8],
        "sport": sport["name"],
        "year": random.choice(["freshman", "sophomore", "junior", "senior"]),
        "archetype": archetype["name"],
        "baseline_mood": archetype["baseline_mood"] + random.uniform(-0.5, 0.5),
        "variability": archetype["variability"],
        "resilience": archetype["resilience"],
        "season_stress": sport["season_stress"],
        "practice_days": sport["practice_days"],
    }


def generate_slump_event(day: int, duration: int) -> Dict[str, Any]:
    """Generate a slump event."""
    triggers = [
        "injury_concern",
        "academic_stress",
        "relationship_issue",
        "playing_time_anxiety",
        "performance_pressure",
        "team_conflict",
        "homesickness",
        "sleep_issues",
        "overtraining",
    ]

    return {
        "start_day": day,
        "duration": duration,
        "trigger": random.choice(triggers),
        "severity": random.uniform(0.5, 1.5),  # How much it affects mood
    }


def generate_competition_event(day: int) -> Dict[str, Any]:
    """Generate a competition event."""
    outcomes = ["win", "loss", "draw", "personal_best", "underperformed"]
    weights = [0.35, 0.30, 0.10, 0.10, 0.15]

    return {
        "day": day,
        "outcome": random.choices(outcomes, weights=weights)[0],
        "importance": random.choice(["regular", "conference", "championship"]),
    }


def generate_trajectory(profile: Dict[str, Any], days: int) -> List[Dict[str, Any]]:
    """Generate a mood/performance trajectory for an athlete."""
    trajectory = []

    # Plan slumps (0-3 per trajectory)
    slumps = []
    num_slumps = random.choices([0, 1, 2, 3], weights=[0.3, 0.4, 0.2, 0.1])[0]
    for _ in range(num_slumps):
        start = random.randint(7, days - 14)
        duration = random.randint(5, 21)
        # Check for overlap
        overlaps = any(s["start_day"] <= start <= s["start_day"] + s["duration"] for s in slumps)
        if not overlaps:
            slumps.append(generate_slump_event(start, duration))

    # Plan competitions (roughly weekly)
    competitions = []
    for week in range(days // 7):
        if random.random() < 0.6:  # 60% chance of competition each week
            comp_day = week * 7 + random.randint(4, 6)  # Usually end of week
            if comp_day < days:
                competitions.append(generate_competition_event(comp_day))

    # Track state
    current_mood = profile["baseline_mood"]
    consecutive_poor_sleep = 0
    last_competition_effect = 0

    for day in range(days):
        date = datetime.now() - timedelta(days=days - day)

        # Check if in slump
        in_slump = False
        slump_effect = 0
        slump_info = None
        for slump in slumps:
            if slump["start_day"] <= day < slump["start_day"] + slump["duration"]:
                in_slump = True
                # Slump effect peaks in middle
                days_into_slump = day - slump["start_day"]
                progress = days_into_slump / slump["duration"]
                # Bell curve effect
                slump_effect = slump["severity"] * (1 - abs(progress - 0.5) * 2)
                slump_info = slump
                break

        # Check for competition
        competition = None
        for comp in competitions:
            if comp["day"] == day:
                competition = comp
                break

        # Competition effects
        if competition:
            if competition["outcome"] in ["win", "personal_best"]:
                last_competition_effect = random.uniform(0.5, 1.5)
            elif competition["outcome"] in ["loss", "underperformed"]:
                last_competition_effect = random.uniform(-1.5, -0.5) * (1 - profile["resilience"])
            else:
                last_competition_effect = random.uniform(-0.3, 0.3)
        else:
            # Decay competition effect
            last_competition_effect *= 0.7

        # Generate daily metrics
        noise = random.gauss(0, profile["variability"])

        # Mood calculation
        mood = profile["baseline_mood"] + noise - slump_effect + last_competition_effect
        mood = max(1, min(10, mood))

        # Confidence (correlated with mood)
        confidence = mood + random.gauss(0, 0.5)
        confidence = max(1, min(10, confidence))

        # Stress (inversely correlated with mood, affected by slump)
        base_stress = 10 - mood + profile["season_stress"]
        stress = base_stress + random.gauss(0, 0.5) + (slump_effect * 0.5)
        stress = max(1, min(10, stress))

        # Energy (affected by sleep and stress)
        energy = 7 + random.gauss(0, 1) - (stress * 0.2) - (consecutive_poor_sleep * 0.3)
        energy = max(1, min(10, energy))

        # Sleep hours (affected by stress and mood)
        base_sleep = 7.5
        sleep_hours = base_sleep + random.gauss(0, 1) - (stress * 0.15)
        sleep_hours = max(3, min(10, sleep_hours))

        if sleep_hours < 6:
            consecutive_poor_sleep += 1
        else:
            consecutive_poor_sleep = max(0, consecutive_poor_sleep - 1)

        # Sleep quality (1-5)
        sleep_quality = min(5, max(1, int(3 + (sleep_hours - 6) * 0.5 + random.gauss(0, 0.5))))

        # Training load (RPE * minutes)
        is_practice_day = day % 7 < profile["practice_days"]
        if is_practice_day:
            rpe = random.randint(5, 9) + (1 if in_slump else 0)  # Higher perceived exertion in slump
            duration = random.randint(60, 120)
            training_load = rpe * duration
        else:
            training_load = random.randint(0, 200)  # Light activity or rest

        # Focus (affected by sleep and stress)
        focus = 7 + random.gauss(0, 1) - (stress * 0.15) - (consecutive_poor_sleep * 0.2)
        focus = max(1, min(10, focus))

        # Motivation
        motivation = mood * 0.5 + energy * 0.3 + random.gauss(0, 0.5)
        motivation = max(1, min(10, motivation))

        # Create record
        record = {
            "athlete_id": profile["athlete_id"],
            "date": date.strftime("%Y-%m-%d"),
            "day_index": day,
            "mood": round(mood, 1),
            "confidence": round(confidence, 1),
            "stress": round(stress, 1),
            "energy": round(energy, 1),
            "focus": round(focus, 1),
            "motivation": round(motivation, 1),
            "sleep_hours": round(sleep_hours, 1),
            "sleep_quality": sleep_quality,
            "training_load": training_load,
            "in_slump": in_slump,
            "slump_trigger": slump_info["trigger"] if slump_info else None,
            "competition_day": competition is not None,
            "competition_outcome": competition["outcome"] if competition else None,
        }

        trajectory.append(record)

    return trajectory


def generate_dataset(num_athletes: int, days: int) -> Dict[str, Any]:
    """Generate complete training dataset."""
    print(f"Generating data for {num_athletes} athletes over {days} days...")

    profiles = []
    all_records = []

    for i in range(num_athletes):
        profile = generate_athlete_profile()
        profiles.append(profile)

        trajectory = generate_trajectory(profile, days)
        all_records.extend(trajectory)

        if (i + 1) % 10 == 0:
            print(f"  Generated {i + 1}/{num_athletes} athletes...")

    # Calculate statistics
    slump_days = sum(1 for r in all_records if r["in_slump"])
    total_days = len(all_records)
    slump_rate = slump_days / total_days * 100

    avg_mood = sum(r["mood"] for r in all_records) / total_days
    avg_stress = sum(r["stress"] for r in all_records) / total_days

    stats = {
        "num_athletes": num_athletes,
        "days_per_athlete": days,
        "total_records": total_days,
        "slump_days": slump_days,
        "slump_rate_percent": round(slump_rate, 2),
        "avg_mood": round(avg_mood, 2),
        "avg_stress": round(avg_stress, 2),
    }

    return {
        "profiles": profiles,
        "records": all_records,
        "statistics": stats,
    }


def save_dataset(dataset: Dict[str, Any], output_dir: str):
    """Save dataset to files."""
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    # Save profiles as JSON
    with open(output_path / "athlete_profiles.json", "w") as f:
        json.dump(dataset["profiles"], f, indent=2)

    # Save records as CSV (for easy analysis)
    with open(output_path / "mood_logs.csv", "w", newline="") as f:
        if dataset["records"]:
            writer = csv.DictWriter(f, fieldnames=dataset["records"][0].keys())
            writer.writeheader()
            writer.writerows(dataset["records"])

    # Save records as JSON too
    with open(output_path / "mood_logs.json", "w") as f:
        json.dump(dataset["records"], f, indent=2)

    # Save statistics
    with open(output_path / "statistics.json", "w") as f:
        json.dump(dataset["statistics"], f, indent=2)

    print(f"\nDataset saved to {output_path}/")
    print(f"  - athlete_profiles.json ({len(dataset['profiles'])} athletes)")
    print(f"  - mood_logs.csv ({len(dataset['records'])} records)")
    print(f"  - mood_logs.json")
    print(f"  - statistics.json")


def main():
    parser = argparse.ArgumentParser(
        description="Generate synthetic training data for ML models"
    )
    parser.add_argument(
        "--athletes",
        type=int,
        default=50,
        help="Number of athletes to generate (default: 50)"
    )
    parser.add_argument(
        "--days",
        type=int,
        default=90,
        help="Days of data per athlete (default: 90)"
    )
    parser.add_argument(
        "--output",
        type=str,
        default="./training_data",
        help="Output directory (default: ./training_data)"
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=None,
        help="Random seed for reproducibility"
    )

    args = parser.parse_args()

    if args.seed:
        random.seed(args.seed)
        print(f"Using random seed: {args.seed}")

    # Generate dataset
    dataset = generate_dataset(args.athletes, args.days)

    # Print statistics
    stats = dataset["statistics"]
    print(f"\n{'='*50}")
    print("DATASET STATISTICS")
    print('='*50)
    print(f"Athletes: {stats['num_athletes']}")
    print(f"Days per athlete: {stats['days_per_athlete']}")
    print(f"Total records: {stats['total_records']}")
    print(f"Slump days: {stats['slump_days']} ({stats['slump_rate_percent']}%)")
    print(f"Average mood: {stats['avg_mood']}")
    print(f"Average stress: {stats['avg_stress']}")
    print('='*50)

    # Save dataset
    save_dataset(dataset, args.output)


if __name__ == "__main__":
    main()
