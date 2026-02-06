"""
Routine Builder for Elite Sports Psychology System.

Generates customizable pre-performance routines with timer-based cue sequences.
Athletes can practice and iterate on routines based on feedback.

Phase 5.1 of Elite Sports Psychology System implementation.
"""

from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from enum import Enum
from datetime import timedelta


class RoutinePhase(str, Enum):
    """Phases of a pre-performance routine."""
    PRE_GAME = "pre_game"          # 60-120 min before competition
    WARMUP = "warmup"              # 30-60 min before
    FINAL_PREP = "final_prep"      # 5-15 min before
    IMMEDIATE = "immediate"        # 0-5 min before (on deck, in tunnel, etc.)
    BETWEEN_PLAY = "between_play"  # During competition (between points, innings, etc.)


class CueType(str, Enum):
    """Types of cues in a routine."""
    PHYSICAL = "physical"          # Physical action (stretch, breathe, tap glove)
    MENTAL = "mental"              # Mental action (visualize, self-talk, focus cue)
    ENVIRONMENTAL = "environmental" # Environmental action (check equipment, survey field)
    SOCIAL = "social"              # Social action (fist bump, team huddle, coach check-in)


@dataclass
class RoutineCue:
    """
    Single cue in a pre-performance routine.

    Attributes:
        type: Type of cue (physical, mental, environmental, social)
        description: What to do (e.g., "Take 3 deep breaths")
        duration_seconds: How long this cue takes
        audio_prompt: Optional audio cue text for voice guidance
        why_included: Brief explanation of purpose
    """
    type: CueType
    description: str
    duration_seconds: int
    audio_prompt: Optional[str] = None
    why_included: Optional[str] = None


@dataclass
class PrePerformanceRoutine:
    """
    Complete pre-performance routine with timer-based cues.

    Attributes:
        name: Routine name (e.g., "Pre-Game Softball Routine")
        sport: Sport (e.g., "softball", "basketball")
        phase: When routine is used (pre_game, warmup, final_prep, etc.)
        total_duration_seconds: Total routine duration
        cues: List of sequential cues
        customization_notes: How athlete can personalize
        effectiveness_tracking: What to track to measure routine effectiveness
    """
    name: str
    sport: str
    phase: RoutinePhase
    total_duration_seconds: int
    cues: List[RoutineCue]
    customization_notes: str
    effectiveness_tracking: List[str]


class RoutineBuilder:
    """
    Generates customizable pre-performance routines for athletes.

    Features:
    - Sport-specific routine templates
    - Timer-based cue sequences
    - Customization based on athlete preferences
    - Iteration based on feedback
    """

    def __init__(self):
        """Initialize routine builder."""
        pass

    def build_routine(
        self,
        sport: str,
        position: Optional[str],
        phase: RoutinePhase,
        detected_issues: Optional[List[str]] = None,
        athlete_preferences: Optional[Dict[str, Any]] = None,
        effective_techniques: Optional[List[Dict[str, Any]]] = None
    ) -> PrePerformanceRoutine:
        """
        Build pre-performance routine tailored to athlete.

        Args:
            sport: Athlete's sport
            position: Position (optional, for position-specific routines)
            phase: Routine phase (pre_game, warmup, final_prep, etc.)
            detected_issues: Issues to address (anxiety, focus, confidence)
            athlete_preferences: Preferences from memory (e.g., "likes breathing", "visual learner")
            effective_techniques: Past effective techniques from memory

        Returns:
            PrePerformanceRoutine with sequential cues
        """
        # Route to sport-specific builder
        if sport.lower() in ["softball", "baseball"]:
            return self._build_baseball_softball_routine(
                sport, position, phase, detected_issues, athlete_preferences, effective_techniques
            )
        elif sport.lower() == "basketball":
            return self._build_basketball_routine(
                sport, position, phase, detected_issues, athlete_preferences, effective_techniques
            )
        elif sport.lower() == "soccer":
            return self._build_soccer_routine(
                sport, position, phase, detected_issues, athlete_preferences, effective_techniques
            )
        elif sport.lower() == "volleyball":
            return self._build_volleyball_routine(
                sport, position, phase, detected_issues, athlete_preferences, effective_techniques
            )
        elif sport.lower() == "golf":
            return self._build_golf_routine(
                sport, position, phase, detected_issues, athlete_preferences, effective_techniques
            )
        elif sport.lower() == "tennis":
            return self._build_tennis_routine(
                sport, position, phase, detected_issues, athlete_preferences, effective_techniques
            )
        else:
            return self._build_generic_routine(
                sport, position, phase, detected_issues, athlete_preferences, effective_techniques
            )

    def _build_baseball_softball_routine(
        self,
        sport: str,
        position: Optional[str],
        phase: RoutinePhase,
        detected_issues: Optional[List[str]],
        athlete_preferences: Optional[Dict[str, Any]],
        effective_techniques: Optional[List[Dict[str, Any]]]
    ) -> PrePerformanceRoutine:
        """Build baseball/softball-specific routine."""

        if phase == RoutinePhase.PRE_GAME:
            # 60-90 min before first pitch
            cues = [
                RoutineCue(
                    type=CueType.PHYSICAL,
                    description="Arrive at field, put on uniform",
                    duration_seconds=300,  # 5 min
                    audio_prompt="Arriving at the field. Take your time getting ready.",
                    why_included="Physical transition into competition mode"
                ),
                RoutineCue(
                    type=CueType.MENTAL,
                    description="Sit in dugout, visualize 3 successful at-bats or defensive plays",
                    duration_seconds=180,  # 3 min
                    audio_prompt="Close your eyes. Visualize three successful moments in today's game.",
                    why_included="Mental rehearsal builds confidence and focus"
                ),
                RoutineCue(
                    type=CueType.PHYSICAL,
                    description="Dynamic warmup with team (jogging, arm circles, leg swings)",
                    duration_seconds=600,  # 10 min
                    audio_prompt="Join team warmup. Focus on feeling loose and ready.",
                    why_included="Physical activation, team cohesion"
                ),
                RoutineCue(
                    type=CueType.MENTAL,
                    description="Set 1-2 process goals for game (e.g., 'stay aggressive', 'quick tempo')",
                    duration_seconds=120,  # 2 min
                    audio_prompt="What are your one or two focus points for today?",
                    why_included="Goal-setting directs attention"
                ),
                RoutineCue(
                    type=CueType.PHYSICAL,
                    description="Position-specific warmup (catch, batting practice, infield)",
                    duration_seconds=1200,  # 20 min
                    audio_prompt="Time for your position drills. Lock in your routine.",
                    why_included="Skill activation, rhythm building"
                ),
                RoutineCue(
                    type=CueType.MENTAL,
                    description="Box breathing: 4 rounds of 4-4-4-4 (inhale-hold-exhale-hold)",
                    duration_seconds=90,  # 1.5 min
                    audio_prompt="Let's do four rounds of box breathing. Inhale for 4... hold for 4... exhale for 4... hold for 4.",
                    why_included="Arousal regulation, calming nerves"
                ),
                RoutineCue(
                    type=CueType.SOCIAL,
                    description="Team huddle: connect with teammates, positive energy",
                    duration_seconds=180,  # 3 min
                    audio_prompt="Gather with your team. Bring positive energy.",
                    why_included="Social connection, team confidence"
                ),
            ]

            return PrePerformanceRoutine(
                name=f"Pre-Game {sport.title()} Routine",
                sport=sport,
                phase=phase,
                total_duration_seconds=sum(c.duration_seconds for c in cues),
                cues=cues,
                customization_notes="Adjust warmup duration based on weather (cold = longer). Add music if helpful. Move breathing earlier if high anxiety.",
                effectiveness_tracking=[
                    "Pre-game anxiety: 0-10 rating before and after routine",
                    "First at-bat/defensive play quality: Rate confidence 1-5",
                    "Routine adherence: Did you complete all cues? Y/N",
                    "Energy level: Rate readiness 0-10 at end of routine"
                ]
            )

        elif phase == RoutinePhase.FINAL_PREP:
            # 5-10 min before taking field/stepping in box
            if position and "pitch" in position.lower():
                # Pitcher final prep
                cues = [
                    RoutineCue(
                        type=CueType.PHYSICAL,
                        description="Last warmup tosses (10-15 pitches at 75% effort)",
                        duration_seconds=240,  # 4 min
                        audio_prompt="Final warmup tosses. Feel your release point.",
                        why_included="Physical activation, command check"
                    ),
                    RoutineCue(
                        type=CueType.MENTAL,
                        description="Visualize first batter: pitch sequence and location",
                        duration_seconds=60,  # 1 min
                        audio_prompt="See your first pitch. Where is it going?",
                        why_included="Mental preparation, game planning"
                    ),
                    RoutineCue(
                        type=CueType.PHYSICAL,
                        description="Three deep breaths with cue word 'SMOOTH'",
                        duration_seconds=30,
                        audio_prompt="Three deep breaths. On each exhale, say SMOOTH.",
                        why_included="Arousal regulation before mound"
                    ),
                    RoutineCue(
                        type=CueType.MENTAL,
                        description="One-word focus cue for inning 1 (e.g., 'ATTACK', 'TEMPO')",
                        duration_seconds=15,
                        audio_prompt="Pick your word for this inning.",
                        why_included="Attentional anchor"
                    ),
                ]
            else:
                # Fielder/batter final prep
                cues = [
                    RoutineCue(
                        type=CueType.PHYSICAL,
                        description="Last practice swings (5-8 swings) or fielding reps",
                        duration_seconds=120,  # 2 min
                        audio_prompt="Final swings. Feel the rhythm.",
                        why_included="Muscle memory activation"
                    ),
                    RoutineCue(
                        type=CueType.MENTAL,
                        description="Visualize one perfect swing or defensive play",
                        duration_seconds=45,
                        audio_prompt="See yourself making a great play. Feel it.",
                        why_included="Mental rehearsal, confidence"
                    ),
                    RoutineCue(
                        type=CueType.PHYSICAL,
                        description="Three deep breaths with cue word 'READY'",
                        duration_seconds=30,
                        audio_prompt="Three breaths. On each exhale: READY.",
                        why_included="Arousal regulation"
                    ),
                    RoutineCue(
                        type=CueType.ENVIRONMENTAL,
                        description="Quick equipment check (glove, bat, cleats)",
                        duration_seconds=30,
                        audio_prompt="Check your gear. Everything set?",
                        why_included="Reduces distraction during game"
                    ),
                ]

            return PrePerformanceRoutine(
                name=f"Final Prep {sport.title()} Routine",
                sport=sport,
                phase=phase,
                total_duration_seconds=sum(c.duration_seconds for c in cues),
                cues=cues,
                customization_notes="Personalize cue word to what resonates. Add team fist bump if desired.",
                effectiveness_tracking=[
                    "Routine completion: Y/N before each game",
                    "First play confidence: 0-10 rating",
                    "Focus clarity: 0-10 rating",
                ]
            )

        elif phase == RoutinePhase.BETWEEN_PLAY:
            # Between innings, at-bats, pitches
            if position and "pitch" in position.lower():
                # Between-pitch routine
                cues = [
                    RoutineCue(
                        type=CueType.PHYSICAL,
                        description="Step off rubber, turn away from batter",
                        duration_seconds=2,
                        audio_prompt=None,
                        why_included="Physical reset, break pressure"
                    ),
                    RoutineCue(
                        type=CueType.PHYSICAL,
                        description="One deep breath (4-count in, 6-count out)",
                        duration_seconds=5,
                        audio_prompt=None,
                        why_included="Arousal regulation"
                    ),
                    RoutineCue(
                        type=CueType.MENTAL,
                        description="Say cue word 'SMOOTH' internally while exhaling",
                        duration_seconds=1,
                        audio_prompt=None,
                        why_included="Mental anchor, focus"
                    ),
                    RoutineCue(
                        type=CueType.MENTAL,
                        description="Visualize next pitch location",
                        duration_seconds=3,
                        audio_prompt=None,
                        why_included="Mental rehearsal"
                    ),
                    RoutineCue(
                        type=CueType.PHYSICAL,
                        description="Step back on rubber, set, deliver",
                        duration_seconds=4,
                        audio_prompt=None,
                        why_included="Execution"
                    ),
                ]
            else:
                # Between-rep fielding routine
                cues = [
                    RoutineCue(
                        type=CueType.PHYSICAL,
                        description="Step back 2 steps from position",
                        duration_seconds=2,
                        audio_prompt=None,
                        why_included="Physical reset"
                    ),
                    RoutineCue(
                        type=CueType.PHYSICAL,
                        description="One box breath (4-4-4-4)",
                        duration_seconds=6,
                        audio_prompt=None,
                        why_included="Arousal regulation"
                    ),
                    RoutineCue(
                        type=CueType.PHYSICAL,
                        description="Tap glove twice on thigh",
                        duration_seconds=1,
                        audio_prompt=None,
                        why_included="Physical anchor"
                    ),
                    RoutineCue(
                        type=CueType.MENTAL,
                        description="Say 'NEXT' internally",
                        duration_seconds=1,
                        audio_prompt=None,
                        why_included="Forward focus"
                    ),
                    RoutineCue(
                        type=CueType.PHYSICAL,
                        description="Step back to position, ready stance",
                        duration_seconds=2,
                        audio_prompt=None,
                        why_included="Execution readiness"
                    ),
                ]

            return PrePerformanceRoutine(
                name=f"Between-Play {sport.title()} Reset",
                sport=sport,
                phase=phase,
                total_duration_seconds=sum(c.duration_seconds for c in cues),
                cues=cues,
                customization_notes="Keep to 10-15 seconds max. Customize cue word. Can skip after easy plays.",
                effectiveness_tracking=[
                    "Routine adherence: % of plays with full routine",
                    "Error recovery: Quality of next play after error (0-10)",
                    "Tension level: Grip tightness 0-10 during game"
                ]
            )

        else:
            # Default warmup routine
            return self._build_generic_routine(sport, position, phase, detected_issues, athlete_preferences, effective_techniques)

    def _build_basketball_routine(
        self,
        sport: str,
        position: Optional[str],
        phase: RoutinePhase,
        detected_issues: Optional[List[str]],
        athlete_preferences: Optional[Dict[str, Any]],
        effective_techniques: Optional[List[Dict[str, Any]]]
    ) -> PrePerformanceRoutine:
        """Build basketball-specific routine."""

        if phase == RoutinePhase.PRE_GAME:
            cues = [
                RoutineCue(
                    type=CueType.PHYSICAL,
                    description="Arrive, change into uniform, stretch",
                    duration_seconds=600,  # 10 min
                    audio_prompt="Getting ready. Take your time.",
                    why_included="Physical transition"
                ),
                RoutineCue(
                    type=CueType.MENTAL,
                    description="Visualize 3 key plays (defensive stop, made shot, assist)",
                    duration_seconds=180,  # 3 min
                    audio_prompt="See three successful plays in your mind.",
                    why_included="Mental rehearsal"
                ),
                RoutineCue(
                    type=CueType.PHYSICAL,
                    description="Dynamic warmup: jog, high knees, defensive slides",
                    duration_seconds=600,  # 10 min
                    audio_prompt="Team warmup. Get loose and ready.",
                    why_included="Physical activation"
                ),
                RoutineCue(
                    type=CueType.PHYSICAL,
                    description="Shooting warmup: form shots, free throws, game spots",
                    duration_seconds=900,  # 15 min
                    audio_prompt="Find your shooting rhythm.",
                    why_included="Skill activation"
                ),
                RoutineCue(
                    type=CueType.MENTAL,
                    description="Set 1-2 focus goals (e.g., 'talk on defense', 'attack the rim')",
                    duration_seconds=120,  # 2 min
                    audio_prompt="What's your focus for tonight?",
                    why_included="Goal-setting"
                ),
                RoutineCue(
                    type=CueType.PHYSICAL,
                    description="Box breathing: 3 rounds of 4-4-4-4",
                    duration_seconds=60,
                    audio_prompt="Three rounds of box breathing. Calm and focused.",
                    why_included="Arousal regulation"
                ),
                RoutineCue(
                    type=CueType.SOCIAL,
                    description="Team huddle: energy, connection, confidence",
                    duration_seconds=180,  # 3 min
                    audio_prompt="Circle up with your team.",
                    why_included="Team cohesion"
                ),
            ]

            return PrePerformanceRoutine(
                name="Pre-Game Basketball Routine",
                sport=sport,
                phase=phase,
                total_duration_seconds=sum(c.duration_seconds for c in cues),
                cues=cues,
                customization_notes="Add music during warmup if helpful. Adjust breathing if too calm (may need activation instead).",
                effectiveness_tracking=[
                    "Pre-game anxiety: 0-10 before/after routine",
                    "First quarter energy: 0-10 rating",
                    "Routine adherence: Y/N",
                    "Focus clarity: 0-10"
                ]
            )

        elif phase == RoutinePhase.BETWEEN_PLAY:
            # Free throw routine
            cues = [
                RoutineCue(
                    type=CueType.PHYSICAL,
                    description="Receive ball from ref, dribble 3 times",
                    duration_seconds=3,
                    audio_prompt=None,
                    why_included="Physical rhythm"
                ),
                RoutineCue(
                    type=CueType.PHYSICAL,
                    description="One deep breath during dribbles (4-count in, 6-count out)",
                    duration_seconds=4,
                    audio_prompt=None,
                    why_included="Arousal regulation"
                ),
                RoutineCue(
                    type=CueType.MENTAL,
                    description="Say cue word 'SMOOTH' or 'NET' while exhaling",
                    duration_seconds=1,
                    audio_prompt=None,
                    why_included="Mental anchor"
                ),
                RoutineCue(
                    type=CueType.MENTAL,
                    description="Visualize ball going through net",
                    duration_seconds=2,
                    audio_prompt=None,
                    why_included="Mental rehearsal"
                ),
                RoutineCue(
                    type=CueType.PHYSICAL,
                    description="Shoot with smooth follow-through",
                    duration_seconds=2,
                    audio_prompt=None,
                    why_included="Execution"
                ),
            ]

            return PrePerformanceRoutine(
                name="Free Throw Routine",
                sport=sport,
                phase=phase,
                total_duration_seconds=sum(c.duration_seconds for c in cues),
                cues=cues,
                customization_notes="Dribble count is flexible (2-4 dribbles). Keep total under 10 seconds. Personalize cue word.",
                effectiveness_tracking=[
                    "Free throw %: Track in games with routine",
                    "Routine adherence: % of FTs with full protocol",
                    "Pressure FT %: Late-game/tied situations",
                ]
            )

        else:
            return self._build_generic_routine(sport, position, phase, detected_issues, athlete_preferences, effective_techniques)

    def _build_soccer_routine(
        self,
        sport: str,
        position: Optional[str],
        phase: RoutinePhase,
        detected_issues: Optional[List[str]],
        athlete_preferences: Optional[Dict[str, Any]],
        effective_techniques: Optional[List[Dict[str, Any]]]
    ) -> PrePerformanceRoutine:
        """Build soccer-specific routine."""

        if phase == RoutinePhase.BETWEEN_PLAY:
            # Penalty kick routine
            cues = [
                RoutineCue(
                    type=CueType.PHYSICAL,
                    description="Place ball on penalty spot, step back 3 paces",
                    duration_seconds=5,
                    audio_prompt=None,
                    why_included="Physical setup"
                ),
                RoutineCue(
                    type=CueType.PHYSICAL,
                    description="Two deep breaths (4-count in, 6-count out each)",
                    duration_seconds=10,
                    audio_prompt=None,
                    why_included="Arousal regulation"
                ),
                RoutineCue(
                    type=CueType.MENTAL,
                    description="Visualize ball placement (pick your spot)",
                    duration_seconds=3,
                    audio_prompt=None,
                    why_included="Mental rehearsal"
                ),
                RoutineCue(
                    type=CueType.MENTAL,
                    description="Say cue word 'STRIKE' or 'BURY' internally",
                    duration_seconds=1,
                    audio_prompt=None,
                    why_included="Mental anchor, confidence"
                ),
                RoutineCue(
                    type=CueType.PHYSICAL,
                    description="Approach ball with consistent tempo, strike",
                    duration_seconds=3,
                    audio_prompt=None,
                    why_included="Execution"
                ),
            ]

            return PrePerformanceRoutine(
                name="Penalty Kick Routine",
                sport=sport,
                phase=phase,
                total_duration_seconds=sum(c.duration_seconds for c in cues),
                cues=cues,
                customization_notes="Can reduce to 1 breath if rushed. Consistent approach tempo is KEY. Block out goalkeeper movement.",
                effectiveness_tracking=[
                    "PK conversion rate: % scored",
                    "Routine adherence: Y/N for each PK",
                    "Perceived pressure: 0-10 before PK",
                ]
            )

        else:
            return self._build_generic_routine(sport, position, phase, detected_issues, athlete_preferences, effective_techniques)

    def _build_volleyball_routine(
        self,
        sport: str,
        position: Optional[str],
        phase: RoutinePhase,
        detected_issues: Optional[List[str]],
        athlete_preferences: Optional[Dict[str, Any]],
        effective_techniques: Optional[List[Dict[str, Any]]]
    ) -> PrePerformanceRoutine:
        """Build volleyball-specific routine."""

        if phase == RoutinePhase.BETWEEN_PLAY:
            # Serving routine
            cues = [
                RoutineCue(
                    type=CueType.PHYSICAL,
                    description="Receive ball from ref, bounce twice",
                    duration_seconds=3,
                    audio_prompt=None,
                    why_included="Physical rhythm"
                ),
                RoutineCue(
                    type=CueType.PHYSICAL,
                    description="One deep breath during bounces (4-count in, 6-count out)",
                    duration_seconds=5,
                    audio_prompt=None,
                    why_included="Arousal regulation"
                ),
                RoutineCue(
                    type=CueType.MENTAL,
                    description="Visualize ball landing zone (pick target)",
                    duration_seconds=2,
                    audio_prompt=None,
                    why_included="Mental rehearsal"
                ),
                RoutineCue(
                    type=CueType.MENTAL,
                    description="Say cue word 'ACE' or 'PLACE' internally",
                    duration_seconds=1,
                    audio_prompt=None,
                    why_included="Mental anchor"
                ),
                RoutineCue(
                    type=CueType.PHYSICAL,
                    description="Toss and serve with smooth motion",
                    duration_seconds=3,
                    audio_prompt=None,
                    why_included="Execution"
                ),
            ]

            return PrePerformanceRoutine(
                name="Serve Routine",
                sport=sport,
                phase=phase,
                total_duration_seconds=sum(c.duration_seconds for c in cues),
                cues=cues,
                customization_notes="Bounce count can vary (1-3). Jump servers: add approach visualization. Total should stay under 15 seconds.",
                effectiveness_tracking=[
                    "Serve %: In vs. out",
                    "Routine adherence: % of serves with protocol",
                    "Target accuracy: % hitting designated zones",
                ]
            )

        else:
            return self._build_generic_routine(sport, position, phase, detected_issues, athlete_preferences, effective_techniques)

    def _build_golf_routine(
        self,
        sport: str,
        position: Optional[str],
        phase: RoutinePhase,
        detected_issues: Optional[List[str]],
        athlete_preferences: Optional[Dict[str, Any]],
        effective_techniques: Optional[List[Dict[str, Any]]]
    ) -> PrePerformanceRoutine:
        """Build golf-specific routine."""

        if phase == RoutinePhase.BETWEEN_PLAY:
            # Pre-shot routine
            cues = [
                RoutineCue(
                    type=CueType.ENVIRONMENTAL,
                    description="Stand behind ball, assess lie, wind, target",
                    duration_seconds=10,
                    audio_prompt=None,
                    why_included="Environmental assessment"
                ),
                RoutineCue(
                    type=CueType.MENTAL,
                    description="Visualize shot shape and ball flight",
                    duration_seconds=5,
                    audio_prompt=None,
                    why_included="Mental rehearsal"
                ),
                RoutineCue(
                    type=CueType.PHYSICAL,
                    description="Take one practice swing with feel",
                    duration_seconds=5,
                    audio_prompt=None,
                    why_included="Muscle activation"
                ),
                RoutineCue(
                    type=CueType.PHYSICAL,
                    description="One deep breath (4-count in, 6-count out)",
                    duration_seconds=5,
                    audio_prompt=None,
                    why_included="Arousal regulation"
                ),
                RoutineCue(
                    type=CueType.PHYSICAL,
                    description="Step to ball, align clubface and body",
                    duration_seconds=5,
                    audio_prompt=None,
                    why_included="Physical setup"
                ),
                RoutineCue(
                    type=CueType.MENTAL,
                    description="Say cue word 'COMMIT' or 'TRUST' internally",
                    duration_seconds=2,
                    audio_prompt=None,
                    why_included="Mental anchor, commitment"
                ),
                RoutineCue(
                    type=CueType.PHYSICAL,
                    description="Execute swing with smooth tempo",
                    duration_seconds=3,
                    audio_prompt=None,
                    why_included="Execution"
                ),
            ]

            return PrePerformanceRoutine(
                name="Pre-Shot Routine",
                sport=sport,
                phase=phase,
                total_duration_seconds=sum(c.duration_seconds for c in cues),
                cues=cues,
                customization_notes="MUST be same for ALL clubs. Timing should be 20-35 seconds consistently. Adjust practice swings (0-2) to preference.",
                effectiveness_tracking=[
                    "Routine adherence: % of shots with full protocol",
                    "Timing consistency: SD of routine duration",
                    "Shot quality: % of solid strikes",
                    "Pre-shot confidence: 0-10 after visualization"
                ]
            )

        else:
            return self._build_generic_routine(sport, position, phase, detected_issues, athlete_preferences, effective_techniques)

    def _build_tennis_routine(
        self,
        sport: str,
        position: Optional[str],
        phase: RoutinePhase,
        detected_issues: Optional[List[str]],
        athlete_preferences: Optional[Dict[str, Any]],
        effective_techniques: Optional[List[Dict[str, Any]]]
    ) -> PrePerformanceRoutine:
        """Build tennis-specific routine."""

        if phase == RoutinePhase.BETWEEN_PLAY:
            # Between-point routine
            cues = [
                RoutineCue(
                    type=CueType.PHYSICAL,
                    description="Turn away from opponent, walk to towel or baseline",
                    duration_seconds=5,
                    audio_prompt=None,
                    why_included="Physical reset, break eye contact"
                ),
                RoutineCue(
                    type=CueType.PHYSICAL,
                    description="Two deep breaths (4-count in, 6-count out each)",
                    duration_seconds=10,
                    audio_prompt=None,
                    why_included="Arousal regulation"
                ),
                RoutineCue(
                    type=CueType.PHYSICAL,
                    description="Bounce ball 3 times if serving",
                    duration_seconds=3,
                    audio_prompt=None,
                    why_included="Physical rhythm"
                ),
                RoutineCue(
                    type=CueType.MENTAL,
                    description="Say cue word 'FRESH' or 'NEXT' internally",
                    duration_seconds=1,
                    audio_prompt=None,
                    why_included="Mental reset, forward focus"
                ),
                RoutineCue(
                    type=CueType.PHYSICAL,
                    description="Return to baseline/service line, ready position",
                    duration_seconds=3,
                    audio_prompt=None,
                    why_included="Execution readiness"
                ),
            ]

            return PrePerformanceRoutine(
                name="Between-Point Reset Routine",
                sport=sport,
                phase=phase,
                total_duration_seconds=sum(c.duration_seconds for c in cues),
                cues=cues,
                customization_notes="Use full 25-second clock in college. Adjust breathing count if rushed. Can use towel as physical anchor.",
                effectiveness_tracking=[
                    "Routine adherence: % of points with protocol",
                    "Win % after bad points: Resilience metric",
                    "Service %: First serve in",
                    "Perceived pressure: 0-10 mid-match"
                ]
            )

        else:
            return self._build_generic_routine(sport, position, phase, detected_issues, athlete_preferences, effective_techniques)

    def _build_generic_routine(
        self,
        sport: str,
        position: Optional[str],
        phase: RoutinePhase,
        detected_issues: Optional[List[str]],
        athlete_preferences: Optional[Dict[str, Any]],
        effective_techniques: Optional[List[Dict[str, Any]]]
    ) -> PrePerformanceRoutine:
        """Build generic routine for any sport."""

        if phase == RoutinePhase.PRE_GAME:
            cues = [
                RoutineCue(
                    type=CueType.PHYSICAL,
                    description="Arrive, change, stretch",
                    duration_seconds=600,
                    audio_prompt="Getting ready for competition.",
                    why_included="Physical transition"
                ),
                RoutineCue(
                    type=CueType.MENTAL,
                    description="Visualize 3 successful moments",
                    duration_seconds=180,
                    audio_prompt="See yourself succeeding today.",
                    why_included="Mental rehearsal"
                ),
                RoutineCue(
                    type=CueType.PHYSICAL,
                    description="Dynamic warmup",
                    duration_seconds=900,
                    audio_prompt="Team warmup time.",
                    why_included="Physical activation"
                ),
                RoutineCue(
                    type=CueType.MENTAL,
                    description="Set 1-2 process goals",
                    duration_seconds=120,
                    audio_prompt="What's your focus?",
                    why_included="Goal-setting"
                ),
                RoutineCue(
                    type=CueType.PHYSICAL,
                    description="Box breathing: 3 rounds",
                    duration_seconds=60,
                    audio_prompt="Breathe and center yourself.",
                    why_included="Arousal regulation"
                ),
            ]

            return PrePerformanceRoutine(
                name=f"Pre-Game {sport.title()} Routine",
                sport=sport,
                phase=phase,
                total_duration_seconds=sum(c.duration_seconds for c in cues),
                cues=cues,
                customization_notes="Customize warmup and breathing to your sport demands. Add music or social cues as desired.",
                effectiveness_tracking=[
                    "Pre-game anxiety: 0-10 before/after routine",
                    "Routine adherence: Y/N",
                    "Readiness: 0-10 rating"
                ]
            )

        else:
            # Minimal between-play routine
            cues = [
                RoutineCue(
                    type=CueType.PHYSICAL,
                    description="Brief reset (breath, physical cue)",
                    duration_seconds=5,
                    audio_prompt=None,
                    why_included="Quick reset between plays"
                ),
                RoutineCue(
                    type=CueType.MENTAL,
                    description="Say cue word internally",
                    duration_seconds=1,
                    audio_prompt=None,
                    why_included="Mental anchor"
                ),
            ]

            return PrePerformanceRoutine(
                name=f"{sport.title()} Between-Play Reset",
                sport=sport,
                phase=phase,
                total_duration_seconds=sum(c.duration_seconds for c in cues),
                cues=cues,
                customization_notes="Keep very brief. Customize to sport timing constraints.",
                effectiveness_tracking=["Routine adherence: Y/N"]
            )


# ============================================
# ROUTINE ITERATION HELPER
# ============================================

def iterate_routine_based_on_feedback(
    original_routine: PrePerformanceRoutine,
    athlete_feedback: Dict[str, Any]
) -> PrePerformanceRoutine:
    """
    Modify routine based on athlete feedback.

    Args:
        original_routine: Current routine
        athlete_feedback: Feedback dict with keys:
            - "too_long": bool
            - "too_short": bool
            - "missing_elements": List[str] (e.g., ["music", "team connection"])
            - "ineffective_cues": List[str] (cue descriptions to remove)
            - "helpful_cues": List[str] (cue descriptions to keep/emphasize)
            - "anxiety_change": int (-10 to +10, negative = reduced anxiety)

    Returns:
        Modified PrePerformanceRoutine
    """
    import copy
    new_routine = copy.deepcopy(original_routine)

    # If too long, reduce duration of cues or remove less essential ones
    if athlete_feedback.get("too_long"):
        # Reduce physical warmup time by 20%
        for cue in new_routine.cues:
            if cue.type == CueType.PHYSICAL and cue.duration_seconds > 120:
                cue.duration_seconds = int(cue.duration_seconds * 0.8)

    # If too short, add more cues or extend duration
    if athlete_feedback.get("too_short"):
        # Add social connection cue if missing
        has_social = any(c.type == CueType.SOCIAL for c in new_routine.cues)
        if not has_social:
            new_routine.cues.insert(
                -1,  # Before last cue
                RoutineCue(
                    type=CueType.SOCIAL,
                    description="Connect with teammates (fist bump, quick chat)",
                    duration_seconds=60,
                    audio_prompt="Quick connection with your team.",
                    why_included="Social support, team energy"
                )
            )

    # Remove ineffective cues
    if athlete_feedback.get("ineffective_cues"):
        new_routine.cues = [
            c for c in new_routine.cues
            if c.description not in athlete_feedback["ineffective_cues"]
        ]

    # Add missing elements
    if athlete_feedback.get("missing_elements"):
        for element in athlete_feedback["missing_elements"]:
            if element == "music" and not any("music" in c.description.lower() for c in new_routine.cues):
                new_routine.cues.insert(
                    1,  # Early in routine
                    RoutineCue(
                        type=CueType.ENVIRONMENTAL,
                        description="Listen to hype playlist (2-3 songs)",
                        duration_seconds=360,
                        audio_prompt="Put on your music.",
                        why_included="Emotional activation, focus"
                    )
                )

    # Recalculate total duration
    new_routine.total_duration_seconds = sum(c.duration_seconds for c in new_routine.cues)

    # Update customization notes with iteration info
    new_routine.customization_notes += f" [Iteration: Adjusted based on athlete feedback - {', '.join(athlete_feedback.keys())}]"

    return new_routine
