"""
Practice Integration for Elite Sports Psychology System.

Converts mental skills into sport-specific practice drills that integrate
mental training with physical repetitions.

Phase 5.1 of Elite Sports Psychology System implementation.
"""

from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from enum import Enum


class PracticeSetting(str, Enum):
    """Practice environment settings."""
    INDIVIDUAL = "individual"
    PARTNER = "partner"
    TEAM = "team"
    GAME_SIMULATION = "game_simulation"


@dataclass
class PracticeDrill:
    """
    Sport-specific practice drill integrating mental skill training.

    Attributes:
        name: Drill name (e.g., "Between-Rep Breathing Protocol")
        mental_skill: Mental skill being trained (e.g., "arousal_regulation")
        sport: Sport (e.g., "softball", "basketball")
        setup: Equipment and setup instructions
        mental_component: Mental skill integrated into drill
        physical_component: Physical actions/reps
        progression: Weekly progression plan (3-4 weeks)
        success_metrics: What to measure
        duration_minutes: Estimated drill duration
        coaching_notes: Tips for implementation
    """
    name: str
    mental_skill: str
    sport: str
    setup: str
    mental_component: str
    physical_component: str
    progression: List[str]
    success_metrics: List[str]
    duration_minutes: int
    coaching_notes: str


class PracticeDrillGenerator:
    """
    Generates sport-specific practice drills that integrate mental skills.

    Maps mental skills → practice protocols by sport:
    - Arousal regulation → breathing between reps
    - Focus/attention → cue word drills
    - Confidence → positive self-talk integration
    - Imagery → visualization before execution
    - Routine development → systematic pre-action protocols
    """

    def __init__(self):
        """Initialize drill generator with sport-specific templates."""
        # Mental skill categories
        self.mental_skills = {
            "arousal_regulation": "Anxiety/stress management through breathing, relaxation",
            "attentional_control": "Focus and concentration under pressure",
            "confidence_building": "Self-efficacy and positive mindset",
            "self_talk": "Internal dialogue and cognitive restructuring",
            "imagery": "Mental rehearsal and visualization",
            "routine_development": "Pre-performance consistency protocols",
            "motivation": "Goal-setting and intrinsic drive",
            "recovery_mindset": "Post-error and post-competition resilience"
        }

    def generate_drill(
        self,
        mental_skill: str,
        sport: str,
        position: Optional[str] = None,
        practice_setting: PracticeSetting = PracticeSetting.TEAM,
        athlete_level: str = "collegiate",
        detected_issue: Optional[str] = None
    ) -> PracticeDrill:
        """
        Generate practice drill integrating mental skill into physical training.

        Args:
            mental_skill: Mental skill to train (e.g., "arousal_regulation")
            sport: Athlete's sport
            position: Position (optional, for position-specific drills)
            practice_setting: Practice environment
            athlete_level: Skill level (affects complexity)
            detected_issue: Specific issue being addressed

        Returns:
            PracticeDrill with sport-specific integration
        """
        # Route to sport-specific generator
        if sport.lower() in ["softball", "baseball"]:
            return self._generate_baseball_softball_drill(
                mental_skill, sport, position, practice_setting, detected_issue
            )
        elif sport.lower() == "basketball":
            return self._generate_basketball_drill(
                mental_skill, sport, position, practice_setting, detected_issue
            )
        elif sport.lower() == "soccer":
            return self._generate_soccer_drill(
                mental_skill, sport, position, practice_setting, detected_issue
            )
        elif sport.lower() == "volleyball":
            return self._generate_volleyball_drill(
                mental_skill, sport, position, practice_setting, detected_issue
            )
        elif sport.lower() == "golf":
            return self._generate_golf_drill(
                mental_skill, sport, position, practice_setting, detected_issue
            )
        elif sport.lower() == "tennis":
            return self._generate_tennis_drill(
                mental_skill, sport, position, practice_setting, detected_issue
            )
        else:
            # Generic drill for other sports
            return self._generate_generic_drill(
                mental_skill, sport, position, practice_setting, detected_issue
            )

    def _generate_baseball_softball_drill(
        self,
        mental_skill: str,
        sport: str,
        position: Optional[str],
        practice_setting: PracticeSetting,
        detected_issue: Optional[str]
    ) -> PracticeDrill:
        """Generate baseball/softball-specific drill."""

        if mental_skill == "arousal_regulation":
            # Between-pitch breathing for pitchers, between-rep for fielders
            if position and "pitch" in position.lower():
                return PracticeDrill(
                    name="Between-Pitch Breathing Protocol",
                    mental_skill="arousal_regulation",
                    sport=sport,
                    setup="Bullpen or mound with catcher. 20-30 pitches planned.",
                    mental_component="After each pitch: step off rubber, take 1 deep breath (4-count in, 6-count out), say cue word 'SMOOTH' while exhaling, visualize next pitch location.",
                    physical_component="Throw 20-30 pitches at 75% intensity. Focus on control, not velocity. Mix fastballs and off-speed.",
                    progression=[
                        "Week 1: Practice only (no batter). Focus on breathing rhythm.",
                        "Week 2: Add simulated batter (teammate standing in box).",
                        "Week 3: Live batting practice with breathing protocol.",
                        "Week 4: Scrimmage/game with protocol (log adherence per inning)."
                    ],
                    success_metrics=[
                        "Breathing adherence: % of pitches with full protocol",
                        "Strike %: Compare to baseline without breathing",
                        "Perceived anxiety: 0-10 before/after drill",
                        "Velocity consistency: Track variation across pitches"
                    ],
                    duration_minutes=20,
                    coaching_notes="Watch for rushed breathing (athletes skipping exhale). Emphasize quality over speed. If athlete struggles, reduce to every OTHER pitch initially."
                )
            else:
                # Fielding drill with breathing
                return PracticeDrill(
                    name="Between-Rep Fielding Reset",
                    mental_skill="arousal_regulation",
                    sport=sport,
                    setup="Infield or outfield with coach hitting ground balls or fly balls. 15-20 reps.",
                    mental_component="After each fielding rep: step back 2 steps, take 1 box breath (4-4-4-4 pattern), tap glove twice on thigh, say 'NEXT' internally.",
                    physical_component="Field 15-20 ground balls or fly balls. Focus on soft hands and clean transfers.",
                    progression=[
                        "Week 1: Slow-pace drill, breathing between every rep.",
                        "Week 2: Increase pace, breathing after errors or tough plays only.",
                        "Week 3: Game-simulation with runners (pressure), breathing protocol mandatory.",
                        "Week 4: Scrimmage with self-monitoring (log when protocol used)."
                    ],
                    success_metrics=[
                        "Error rate: Compare to baseline without breathing",
                        "Breathing adherence: % of reps with protocol",
                        "Recovery time: Seconds from error to next clean play",
                        "Perceived tension: 0-10 grip tightness rating"
                    ],
                    duration_minutes=15,
                    coaching_notes="First base players: focus on soft hands during breathing. Pitchers transitioning to fielding: use same cue word for consistency."
                )

        elif mental_skill == "attentional_control":
            # Focus drill for batters
            return PracticeDrill(
                name="Focused At-Bat Drill",
                mental_skill="attentional_control",
                sport=sport,
                setup="Batting practice with pitcher or machine. 15-20 swings.",
                mental_component="Before each pitch: identify ONE focus cue (e.g., 'see ball early', 'load hands', 'drive through'). Block out all distractions. After swing, verbally say your cue word.",
                physical_component="Take 15-20 swings. Mix pitch types if possible. Focus on contact quality, not power.",
                progression=[
                    "Week 1: Soft toss with single focus cue ('see ball').",
                    "Week 2: Batting practice with 2 alternating cues ('see'/'drive').",
                    "Week 3: Live pitching with pressure (count situations).",
                    "Week 4: Scrimmage at-bats with pre-pitch cue selection."
                ],
                success_metrics=[
                    "Contact rate: % of swings making solid contact",
                    "Focus adherence: % of pitches with pre-pitch cue",
                    "Distraction resistance: Rate ability to block crowd/noise (0-10)",
                    "Swing decision: % of good pitches swung at vs. chased"
                ],
                duration_minutes=20,
                coaching_notes="Cue words should be short (1-2 syllables). If athlete struggles, reduce to 10 swings with water break mid-drill."
            )

        elif mental_skill == "confidence_building":
            # Success-focused fielding drill
            return PracticeDrill(
                name="Success Streak Fielding",
                mental_skill="confidence_building",
                sport=sport,
                setup="Infield with coach hitting ground balls. Start easy, progress to harder.",
                mental_component="After each successful play: verbally say 'GOT IT' or fist pump. Track consecutive successes. After error: reset count but say 'NEXT ONE' (forward focus).",
                physical_component="Field ground balls in sets of 5. Start with easy rolls, progress to hard hits. Goal: 10 consecutive clean plays.",
                progression=[
                    "Week 1: Easy grounders, goal 10 consecutive.",
                    "Week 2: Medium difficulty, goal 8 consecutive.",
                    "Week 3: Hard grounders mixed with easy (unpredictable), goal 10 total.",
                    "Week 4: Game-simulation with runners, track clean plays per inning."
                ],
                success_metrics=[
                    "Longest success streak per session",
                    "Positive self-talk adherence: % of successes with 'GOT IT'",
                    "Error recovery: Time to next clean play after error",
                    "Confidence rating: 0-10 self-rating before/after drill"
                ],
                duration_minutes=15,
                coaching_notes="CRITICAL: Celebrate small wins. If athlete gets frustrated, drop difficulty immediately. Goal is confidence, not perfection."
            )

        else:
            # Generic baseball/softball drill
            return self._generate_generic_drill(mental_skill, sport, position, practice_setting, detected_issue)

    def _generate_basketball_drill(
        self,
        mental_skill: str,
        sport: str,
        position: Optional[str],
        practice_setting: PracticeSetting,
        detected_issue: Optional[str]
    ) -> PracticeDrill:
        """Generate basketball-specific drill."""

        if mental_skill == "arousal_regulation":
            # Free throw breathing drill
            return PracticeDrill(
                name="Free Throw Line Reset Protocol",
                mental_skill="arousal_regulation",
                sport=sport,
                setup="Free throw line with basketball. 20-30 shots.",
                mental_component="Before each shot: dribble ball 3x, take 1 deep breath during dribbles (inhale 4, exhale 6), say cue word 'SMOOTH', visualize swish.",
                physical_component="Shoot 20-30 free throws. Track makes/misses. Focus on routine consistency, not result.",
                progression=[
                    "Week 1: Practice with no pressure. Log breathing adherence.",
                    "Week 2: Add simulated pressure (teammates watching, count consequences).",
                    "Week 3: End-of-practice free throws when fatigued.",
                    "Week 4: Scrimmage/game free throws with protocol."
                ],
                success_metrics=[
                    "Free throw %: Compare to baseline without breathing",
                    "Routine consistency: % of shots with full protocol",
                    "Perceived pressure: 0-10 rating before drill",
                    "Heart rate: Track if possible (should decrease during routine)"
                ],
                duration_minutes=15,
                coaching_notes="Common issue: rushing the dribble-breath sequence. Slow it down. Cue word can be personalized ('NET', 'SWISH', 'CALM')."
            )

        elif mental_skill == "attentional_control":
            # Defensive focus drill
            return PracticeDrill(
                name="Defensive Lock-In Drill",
                mental_skill="attentional_control",
                sport=sport,
                setup="Half-court with offensive player. 1-on-1 or 2-on-2 for 5-minute segments.",
                mental_component="Before each defensive possession: identify ONE focus (e.g., 'ball pressure', 'deny baseline', 'stay low'). After possession, rate focus adherence 1-5.",
                physical_component="Play 1-on-1 defense for 5 possessions. Switch offense/defense. Repeat 3 sets.",
                progression=[
                    "Week 1: 1-on-1 half-court, single focus cue.",
                    "Week 2: 2-on-2, add help defense focus.",
                    "Week 3: Full-court live with focus protocol.",
                    "Week 4: Scrimmage with self-monitoring (log focus rating per possession)."
                ],
                success_metrics=[
                    "Defensive stops: % of possessions with no score",
                    "Focus adherence: Avg rating across possessions",
                    "Communication: # of verbal cues to teammates",
                    "Deflections/steals: Track positive defensive plays"
                ],
                duration_minutes=20,
                coaching_notes="If athlete loses focus mid-possession, call timeout and reset. Emphasize process (focus) over outcome (stop)."
            )

        else:
            return self._generate_generic_drill(mental_skill, sport, position, practice_setting, detected_issue)

    def _generate_soccer_drill(
        self,
        mental_skill: str,
        sport: str,
        position: Optional[str],
        practice_setting: PracticeSetting,
        detected_issue: Optional[str]
    ) -> PracticeDrill:
        """Generate soccer-specific drill."""

        if mental_skill == "arousal_regulation":
            # Penalty kick breathing
            return PracticeDrill(
                name="Penalty Kick Calm Protocol",
                mental_skill="arousal_regulation",
                sport=sport,
                setup="Penalty spot with goalkeeper (or empty net). 10-15 penalty kicks.",
                mental_component="Before each kick: step back from ball, take 2 deep breaths (4-count in, 6-count out), visualize ball placement, say cue word 'STRIKE', approach ball.",
                physical_component="Take 10-15 penalty kicks. Mix placement (corners, low, high). Focus on routine, not outcome.",
                progression=[
                    "Week 1: Empty net, focus on breathing rhythm.",
                    "Week 2: With goalkeeper, low pressure.",
                    "Week 3: High-pressure simulation (teammates watching, consequences).",
                    "Week 4: End-of-practice PKs when fatigued."
                ],
                success_metrics=[
                    "Conversion rate: % of PKs scored",
                    "Routine adherence: % of kicks with full breathing protocol",
                    "Perceived anxiety: 0-10 before each kick",
                    "Approach consistency: Video review of approach timing"
                ],
                duration_minutes=15,
                coaching_notes="GKs benefit too (use breathing while waiting). If athlete rushes, mandate 5-second minimum between breaths and kick."
            )

        elif mental_skill == "attentional_control":
            # Decision-making drill
            return PracticeDrill(
                name="Pressure Possession Focus Drill",
                mental_skill="attentional_control",
                sport=sport,
                setup="Small grid (20x20 yards), 4v4+1 or 5v5. 3-minute segments.",
                mental_component="Before each possession: identify ONE decision priority ('find space', 'quick release', 'protect ball'). During play, block distractions. After, rate decision quality 1-5.",
                physical_component="Play keep-away in tight space. Limited touches (2-touch max). High pressure, quick decisions.",
                progression=[
                    "Week 1: 4v4, single focus, unlimited touches.",
                    "Week 2: 5v5, 2-touch limit, add decision rating.",
                    "Week 3: Add defenders, increase pressure.",
                    "Week 4: Scrimmage with focus tracking per half."
                ],
                success_metrics=[
                    "Possession retention: % of touches leading to teammate",
                    "Decision quality: Avg rating per segment",
                    "Touches under pressure: # of successful tight-space controls",
                    "Turnovers: Track giveaways per segment"
                ],
                duration_minutes=20,
                coaching_notes="Midfielders especially benefit. If overwhelming, reduce to 3v3 or increase grid size."
            )

        else:
            return self._generate_generic_drill(mental_skill, sport, position, practice_setting, detected_issue)

    def _generate_volleyball_drill(
        self,
        mental_skill: str,
        sport: str,
        position: Optional[str],
        practice_setting: PracticeSetting,
        detected_issue: Optional[str]
    ) -> PracticeDrill:
        """Generate volleyball-specific drill."""

        if mental_skill == "arousal_regulation":
            # Serving routine
            return PracticeDrill(
                name="Serve Routine Breathing Protocol",
                mental_skill="arousal_regulation",
                sport=sport,
                setup="Serving line with ball cart. 20-30 serves.",
                mental_component="Before each serve: bounce ball 2x, take 1 deep breath during bounces (4-count in, 6-count out), visualize landing zone, say 'ACE' internally, serve.",
                physical_component="Serve 20-30 balls. Mix serve types (float, topspin, jump). Focus on routine, not aces.",
                progression=[
                    "Week 1: Practice with no pressure, track routine adherence.",
                    "Week 2: Add target zones, increase difficulty.",
                    "Week 3: Simulated game (score consequences for errors).",
                    "Week 4: Scrimmage serves with protocol."
                ],
                success_metrics=[
                    "Serve %: In vs. out",
                    "Routine adherence: % of serves with full protocol",
                    "Target accuracy: % hitting designated zones",
                    "Perceived pressure: 0-10 rating before drill"
                ],
                duration_minutes=15,
                coaching_notes="Liberos can use protocol for serve receive focus. Jump servers: add breath during approach visualization."
            )

        else:
            return self._generate_generic_drill(mental_skill, sport, position, practice_setting, detected_issue)

    def _generate_golf_drill(
        self,
        mental_skill: str,
        sport: str,
        position: Optional[str],
        practice_setting: PracticeSetting,
        detected_issue: Optional[str]
    ) -> PracticeDrill:
        """Generate golf-specific drill."""

        if mental_skill == "routine_development":
            # Pre-shot routine
            return PracticeDrill(
                name="Consistent Pre-Shot Routine",
                mental_skill="routine_development",
                sport=sport,
                setup="Driving range with 20-30 balls. Club of choice.",
                mental_component="Before EVERY shot: (1) Stand behind ball, visualize shot shape. (2) Take 1 practice swing. (3) Take 1 deep breath. (4) Step to ball, align, say 'COMMIT'. (5) Execute. Time: 20-25 seconds total.",
                physical_component="Hit 20-30 balls with FULL routine every time. Mix clubs/targets. Focus on process, not outcome.",
                progression=[
                    "Week 1: Range only, time each routine (goal: 20-25 sec consistency).",
                    "Week 2: Add pressure (track good shots, reset count on bad).",
                    "Week 3: Practice round with routine (log adherence per hole).",
                    "Week 4: Tournament/competition round with routine."
                ],
                success_metrics=[
                    "Routine adherence: % of shots with full 5-step protocol",
                    "Timing consistency: SD of routine duration",
                    "Shot quality: % of solid strikes",
                    "Pre-shot confidence: 0-10 rating after visualization"
                ],
                duration_minutes=30,
                coaching_notes="CRITICAL: Same routine for ALL clubs. If rushed, extend time limit. Use timer app for feedback."
            )

        elif mental_skill == "recovery_mindset":
            # Post-error reset
            return PracticeDrill(
                name="Bad Shot Reset Protocol",
                mental_skill="recovery_mindset",
                sport=sport,
                setup="Driving range with 20 balls. Intentionally hit some bad shots.",
                mental_component="After bad shot: (1) Turn away from target. (2) Take 1 deep breath. (3) Say 'NEXT SHOT' aloud. (4) Visualize ONE positive swing thought. (5) Execute next shot with renewed focus.",
                physical_component="Hit 20 balls. INTENTIONALLY hit 5 bad shots (topped, sliced, etc.). Practice reset protocol after each bad shot.",
                progression=[
                    "Week 1: Range with intentional bad shots, practice reset.",
                    "Week 2: Range without intentional errors, use reset on natural misses.",
                    "Week 3: Practice round, track reset usage and next-shot quality.",
                    "Week 4: Competition round with reset protocol."
                ],
                success_metrics=[
                    "Reset adherence: % of bad shots with protocol",
                    "Next-shot quality: % of good shots immediately after reset",
                    "Emotional recovery: Rate frustration 0-10 before/after reset",
                    "Snowball prevention: # of consecutive bad shots (goal: 0-1 max)"
                ],
                duration_minutes=25,
                coaching_notes="Make bad shots INTENTIONAL to practice reset without real frustration. Emphasize physical turn-away to break mental connection."
            )

        else:
            return self._generate_generic_drill(mental_skill, sport, position, practice_setting, detected_issue)

    def _generate_tennis_drill(
        self,
        mental_skill: str,
        sport: str,
        position: Optional[str],
        practice_setting: PracticeSetting,
        detected_issue: Optional[str]
    ) -> PracticeDrill:
        """Generate tennis-specific drill."""

        if mental_skill == "arousal_regulation":
            # Between-point routine
            return PracticeDrill(
                name="Between-Point Reset Routine",
                mental_skill="arousal_regulation",
                sport=sport,
                setup="Tennis court with practice partner or ball machine. Play points.",
                mental_component="After EVERY point (win or lose): turn away from opponent, walk to towel/baseline, take 2 deep breaths (4-count in, 6-count out), bounce ball 3x, say cue word 'FRESH', reset for next point. Total: 15-20 seconds.",
                physical_component="Play 20-30 practice points. Keep score but focus on routine, not winning.",
                progression=[
                    "Week 1: Cooperative rally with routine between points.",
                    "Week 2: Competitive points with routine (track adherence).",
                    "Week 3: Practice match with routine (log per game).",
                    "Week 4: Tournament match with routine."
                ],
                success_metrics=[
                    "Routine adherence: % of points with full protocol",
                    "Win % after bad points: Track resilience",
                    "Perceived anxiety: 0-10 rating mid-match",
                    "Service consistency: % of first serves in (should improve)"
                ],
                duration_minutes=30,
                coaching_notes="Servers especially benefit (control between-point tempo). If opponent rushes, take full time allowed (25 sec in college)."
            )

        else:
            return self._generate_generic_drill(mental_skill, sport, position, practice_setting, detected_issue)

    def _generate_generic_drill(
        self,
        mental_skill: str,
        sport: str,
        position: Optional[str],
        practice_setting: PracticeSetting,
        detected_issue: Optional[str]
    ) -> PracticeDrill:
        """Generate generic drill for any sport."""

        if mental_skill == "arousal_regulation":
            return PracticeDrill(
                name="Practice Breathing Integration",
                mental_skill="arousal_regulation",
                sport=sport,
                setup=f"Regular {sport} practice with equipment.",
                mental_component="Between reps or plays: take 1 deep breath (4-count in, 6-count out), say cue word (e.g., 'CALM', 'RESET'), visualize next action.",
                physical_component=f"Practice standard {sport} drills (15-20 reps) with breathing protocol between each rep.",
                progression=[
                    "Week 1: Low-pressure practice, breathing between every rep.",
                    "Week 2: Moderate pressure, breathing after difficult reps only.",
                    "Week 3: High-pressure simulation, breathing protocol mandatory.",
                    "Week 4: Scrimmage/competition with protocol."
                ],
                success_metrics=[
                    "Breathing adherence: % of reps with protocol",
                    "Performance quality: Compare to baseline without breathing",
                    "Perceived anxiety: 0-10 before/after",
                    "Recovery time: Seconds to reset after error"
                ],
                duration_minutes=20,
                coaching_notes="Adapt breathing timing to sport demands. Fast-paced sports: shorten to 1 breath. Slower sports: extend to 2-3 breaths."
            )

        elif mental_skill == "attentional_control":
            return PracticeDrill(
                name="Focus Cue Practice",
                mental_skill="attentional_control",
                sport=sport,
                setup=f"Regular {sport} practice with equipment.",
                mental_component="Before each rep: identify ONE focus cue relevant to the skill. Block distractions. After rep, rate focus 1-5.",
                physical_component=f"Practice standard {sport} drills (15-20 reps) with pre-action focus protocol.",
                progression=[
                    "Week 1: Single focus cue, quiet environment.",
                    "Week 2: Alternating cues, add distractions (music, talking).",
                    "Week 3: Complex drills with multiple focus points.",
                    "Week 4: Scrimmage with focus tracking."
                ],
                success_metrics=[
                    "Focus adherence: % of reps with pre-action cue",
                    "Focus rating: Average across reps",
                    "Distraction resistance: Performance with/without distractors",
                    "Execution quality: Compare focused vs unfocused reps"
                ],
                duration_minutes=20,
                coaching_notes="Keep cue words SHORT (1-2 syllables). Change cues weekly to prevent autopilot."
            )

        elif mental_skill == "confidence_building":
            return PracticeDrill(
                name="Success Streak Training",
                mental_skill="confidence_building",
                sport=sport,
                setup=f"Regular {sport} practice, starting with easier skills.",
                mental_component="After each successful rep: verbal affirmation ('YES', 'GOT IT') or fist pump. Track consecutive successes. After failure: 'NEXT ONE' (forward focus, no dwelling).",
                physical_component=f"Practice {sport} skills in sets of 5, progressing from easy to hard. Goal: 10 consecutive successes.",
                progression=[
                    "Week 1: Easy drills, goal 10 consecutive.",
                    "Week 2: Medium difficulty, goal 8 consecutive.",
                    "Week 3: Hard skills with unpredictable elements.",
                    "Week 4: Competition with confidence tracking."
                ],
                success_metrics=[
                    "Longest success streak per session",
                    "Positive self-talk adherence: % of successes celebrated",
                    "Confidence rating: 0-10 before/after drill",
                    "Transfer to competition: Compare practice vs game confidence"
                ],
                duration_minutes=20,
                coaching_notes="CELEBRATE small wins. If athlete gets frustrated, drop difficulty IMMEDIATELY. Goal is confidence, not perfection."
            )

        else:
            # Default drill structure for unmapped skills
            return PracticeDrill(
                name=f"{mental_skill.replace('_', ' ').title()} Practice Integration",
                mental_skill=mental_skill,
                sport=sport,
                setup=f"Regular {sport} practice environment.",
                mental_component=f"Integrate {mental_skill} techniques between reps or plays during practice.",
                physical_component=f"Standard {sport} drills with mental skill integration.",
                progression=[
                    f"Week 1: Practice {mental_skill} in low-pressure environment.",
                    f"Week 2: Add moderate pressure and complexity.",
                    f"Week 3: High-pressure simulation.",
                    f"Week 4: Competition application."
                ],
                success_metrics=[
                    f"{mental_skill} adherence: % of reps with technique",
                    "Performance quality: Compare to baseline",
                    "Perceived effectiveness: 0-10 rating",
                    "Transfer to competition: Game application success"
                ],
                duration_minutes=20,
                coaching_notes=f"Customize {mental_skill} integration to match sport-specific demands and athlete readiness."
            )


# ============================================
# HELPER FUNCTIONS
# ============================================

def get_mental_skill_from_protocol(protocol_name: str) -> str:
    """
    Map protocol/technique name to mental skill category.

    Args:
        protocol_name: Name of selected protocol (e.g., "Box Breathing for Arousal Control")

    Returns:
        Mental skill category
    """
    protocol_lower = protocol_name.lower()

    if any(term in protocol_lower for term in ["breath", "arousal", "relax", "calm"]):
        return "arousal_regulation"
    elif any(term in protocol_lower for term in ["focus", "attention", "concentration", "cue"]):
        return "attentional_control"
    elif any(term in protocol_lower for term in ["confidence", "self-efficacy", "belief"]):
        return "confidence_building"
    elif any(term in protocol_lower for term in ["self-talk", "cognitive", "reframing"]):
        return "self_talk"
    elif any(term in protocol_lower for term in ["imagery", "visualization", "mental rehearsal"]):
        return "imagery"
    elif any(term in protocol_lower for term in ["routine", "pre-performance", "ritual"]):
        return "routine_development"
    elif any(term in protocol_lower for term in ["motivation", "goal", "drive"]):
        return "motivation"
    elif any(term in protocol_lower for term in ["recovery", "resilience", "reset", "post-error"]):
        return "recovery_mindset"
    else:
        return "arousal_regulation"  # Default fallback
