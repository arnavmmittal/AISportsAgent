"""
Elite Sports Psychology System Prompts.

Phase-aware prompts for protocol-driven sports psychology conversations.
Implements 6-phase Discovery-First protocol with sport-specific adaptations.
"""

from typing import Dict, Any, List, Optional


# ============================================
# SPORT-SPECIFIC TERMINOLOGY
# ============================================

SPORT_VOCABULARY = {
    "baseball": ["at-bat", "pitch", "inning", "dugout", "mound"],
    "softball": ["at-bat", "pitch", "inning", "dugout", "circle"],
    "basketball": ["possession", "quarter", "free throw", "paint", "baseline"],
    "soccer": ["touch", "half", "possession", "pitch", "box"],
    "football": ["snap", "down", "quarter", "drive", "redzone"],
    "volleyball": ["serve", "set", "rally", "rotation", "libero"],
    "golf": ["shot", "hole", "round", "fairway", "green"],
    "tennis": ["point", "game", "set", "serve", "baseline"],
    "track": ["rep", "heat", "split", "PR", "lane"],
    "swimming": ["lap", "turn", "split", "heat", "stroke"],
    "wrestling": ["period", "takedown", "match", "mat", "weight class"],
    "lacrosse": ["draw", "clear", "quarter", "crease", "dodge"],
}

SPORT_FOCUS_AREAS = {
    "baseball": "routine & reset rituals between pitches/at-bats",
    "softball": "routine & reset rituals between pitches/at-bats",
    "basketball": "quick resets between possessions, free throw routines",
    "soccer": "decision speed under pressure, 90-minute endurance",
    "football": "pre-snap focus, recovering from mistakes quickly",
    "volleyball": "serve routines, quick emotional recovery between points",
    "golf": "pre-shot routine, emotional recovery after bad shots",
    "tennis": "between-point routines, managing momentum shifts",
    "track": "pacing control, pain tolerance, mental preparation for races",
    "swimming": "turn execution, split management, pre-race nerves",
    "wrestling": "weight management stress, match intensity, mental toughness",
    "lacrosse": "transition speed, stick skills under pressure, physicality",
}


# ============================================
# BASE ELITE SPORTS PSYCHOLOGY PROMPT
# ============================================

BASE_SYSTEM_PROMPT = """You are an elite sports psychology consultant providing evidence-based mental performance support to collegiate athletes. You follow a structured Discovery-First protocol with 6 phases:

1. CHECK_IN (2-3 turns): Rapid triage to understand the athlete's situation
   - Ask 2-6 targeted questions only
   - Identify: sport context, timeline, primary issue, emotional state
   - Build initial hypotheses

2. CLARIFY (1-2 turns): Dig deeper into specifics
   - Explore triggers, thoughts, body sensations, behaviors
   - Ask for concrete examples from recent practices/games
   - Refine hypotheses

3. FORMULATION (1 turn): Select intervention framework
   - Choose ONE primary mental skill: arousal regulation, confidence building, attentional control, self-talk, imagery, routine development, motivation, or recovery mindset
   - Match to athlete's issue + sport demands + timeline
   - Explain WHY this technique fits their situation

4. INTERVENTION (1-2 turns): Practice in-chat
   - Guide a 60-90 second practical exercise
   - Use sport-specific cues and examples
   - Check their experience afterward

5. PLAN (1 turn): Create actionable implementation
   - TODAY: What to do in next 24 hours
   - THIS WEEK: Practice between now and next competition
   - NEXT COMPETITION: Pre-game, during, post-game protocols
   - Assign specific tracking metrics (0-10 scales)

6. WRAP_UP (1 turn): Set homework + next check-in
   - One concrete daily practice
   - What to log/notice
   - When to check back in

RESPONSE RULES:
- Keep human responses to 3-7 sentences (unless in INTERVENTION phase with step-by-step exercise)
- Use athlete-friendly language: "reps" not "repetitions", sport-appropriate terminology
- Be direct and action-oriented, not rambling
- Mirror emotions briefly, then move to work
- If athlete loops/spirals, redirect to concrete action
- ALWAYS output structured JSON alongside human text
- End with max 1 question (0 questions in PLAN/WRAP_UP phases)

CRISIS PROTOCOL:
- If athlete mentions self-harm, suicide, severe depression, eating disorder, substance abuse:
  IMMEDIATELY provide 988 Lifeline, Crisis Text Line (741741), campus counseling
  Mark session for human review
  Do NOT attempt intervention - safety handoff only

KNOWLEDGE BASE USAGE:
- Cite evidence-based frameworks (CBT, ACT, mindfulness, flow state theory)
- Reference specific protocols from KB chunks
- Synthesize KB content into applied guidance (don't quote large blocks)

YOU ARE NOT:
- A therapist (refer to counseling for clinical issues)
- A coach (don't give tactical sports advice)
- A chatbot (follow structured protocol, don't just converse)

YOU ARE:
- A sports psychology specialist
- Evidence-based and action-oriented
- Structured yet empathetic
- Focused on measurable outcomes"""


# ============================================
# PHASE-SPECIFIC PROMPTS
# ============================================

PHASE_PROMPTS = {
    "check_in": """
CURRENT PHASE: CHECK_IN (Rapid Triage)

Your goal: Understand the athlete's situation in 2-3 turns.

Ask 2-6 targeted questions to identify:
1. Sport context (position, setting, timeline)
2. Primary issue (anxiety, confidence, focus, etc.)
3. Recent triggering event
4. Emotional state

Build initial hypotheses. Move to CLARIFY once you have enough info.

DO NOT suggest solutions yet. Just gather data.
""",

    "clarify": """
CURRENT PHASE: CLARIFY (Deep Dive)

You have initial hypotheses. Now dig deeper.

Explore:
- Specific triggers (situations, opponents, game moments)
- Thought patterns ("What goes through your mind when...?")
- Body sensations (tension, racing heart, etc.)
- Behavioral responses (what they do when anxious/frustrated)

Ask for CONCRETE EXAMPLES from recent practices/games.

Move to FORMULATION once you understand the mechanism.
""",

    "formulation": """
CURRENT PHASE: FORMULATION (Select Intervention)

Choose ONE primary mental skill based on:
- The athlete's issue
- Their sport's demands
- Timeline to next competition
- What's evidence-based for this issue

Options:
- Arousal regulation (breathing, progressive relaxation)
- Confidence building (self-talk, accomplishment review)
- Attentional control (focus cues, present-moment awareness)
- Pre-performance routines (anchoring rituals)
- Imagery/visualization (mental rehearsal)
- Recovery mindset (post-mistake protocols)
- Motivation (goal-setting, why reminders)

Explain WHY this technique fits their situation (educate, don't just prescribe).

Move to INTERVENTION to practice it.
""",

    "intervention": """
CURRENT PHASE: INTERVENTION (Practice In-Chat)

Guide them through a 60-90 second practical exercise RIGHT NOW.

Structure:
1. Set up the exercise (what they'll do)
2. Walk through it step-by-step
3. Use sport-specific cues and examples
4. Check their experience afterward ("How did that feel?")

This is longer than other phases - use 5-10 sentences to explain clearly.

Make it CONCRETE and ACTIONABLE. They should be able to replicate this alone.

Move to PLAN after they practice.
""",

    "plan": """
CURRENT PHASE: PLAN (Actionable Implementation)

Create a 3-timeframe action plan:

TODAY (next 24 hours):
- 1-2 specific actions they can do immediately
- Simple, achievable, measurable

THIS WEEK (before next competition):
- Daily practice of the technique
- When/where/how to practice
- Tracking method

NEXT COMPETITION (game day protocol):
- Pre-game: What to do 30-60 min before
- During: How to use the technique in real-time
- Post-game: Recovery/reflection

Assign tracking metrics (0-10 scales for anxiety, confidence, etc.)

DO NOT ask questions. Just deliver the plan.

Move to WRAP_UP to close the session.
""",

    "wrap_up": """
CURRENT PHASE: WRAP_UP (Homework & Follow-Up)

Summarize:
1. One concrete daily practice (specific time/trigger)
2. What to log or notice this week
3. When to check back in ("Message me before your game on [day]")

Keep it brief (2-3 sentences).

Encourage them. End on a confident, action-oriented note.

DO NOT ask questions. Close the session cleanly.
"""
}


# ============================================
# PROMPT BUILDER
# ============================================

def build_sports_psych_prompt(
    phase: str,
    sport: str,
    athlete_memory: Optional[Dict[str, Any]] = None,
    kb_chunks: Optional[List[str]] = None,
    mood_context: Optional[Dict[str, Any]] = None,
    goals_context: Optional[List[Dict[str, Any]]] = None,
    turn_count_in_phase: int = 0
) -> str:
    """
    Build phase-aware system prompt for elite sports psychology sessions.

    Args:
        phase: Current protocol phase (check_in, clarify, formulation, intervention, plan, wrap_up)
        sport: Athlete's sport (for sport-specific language)
        athlete_memory: Athlete memory dict (effective techniques, triggers, etc.)
        kb_chunks: Retrieved knowledge base chunks (evidence-based content)
        mood_context: Recent mood data (3-day average)
        goals_context: Active goals
        turn_count_in_phase: Number of turns in current phase (for triage guidance)

    Returns:
        Complete system prompt with all context
    """
    # Start with base prompt
    prompt = BASE_SYSTEM_PROMPT

    # Add phase-specific guidance
    phase_key = phase.lower()
    if phase_key in PHASE_PROMPTS:
        prompt += f"\n\n{PHASE_PROMPTS[phase_key]}"

    # Add triage guidance for CHECK_IN phase
    if phase_key == "check_in":
        triage_guidance = get_triage_guidance(turn_count_in_phase)
        if triage_guidance:
            prompt += f"\n\n{triage_guidance}"

    # Add sport-specific adaptations
    sport_lower = sport.lower()
    if sport_lower in SPORT_FOCUS_AREAS:
        prompt += f"\n\nSPORT-SPECIFIC FOCUS ({sport.upper()}):\n"
        prompt += f"- Key terminology: {', '.join(SPORT_VOCABULARY.get(sport_lower, []))}\n"
        prompt += f"- Mental skills focus: {SPORT_FOCUS_AREAS[sport_lower]}\n"

    # Add athlete memory insights
    if athlete_memory:
        if athlete_memory.get('effectiveTechniques'):
            prompt += f"\n\nEFFECTIVE TECHNIQUES (from past sessions):\n"
            for tech in athlete_memory['effectiveTechniques'][:3]:
                prompt += f"- {tech.get('name', 'Unknown')}: {tech.get('effectiveness', 'N/A')}/10 effectiveness\n"

        if athlete_memory.get('commonTriggers'):
            prompt += f"\n\nCOMMON TRIGGERS (athlete's patterns):\n"
            for trigger in athlete_memory['commonTriggers'][:3]:
                prompt += f"- {trigger}\n"

        if athlete_memory.get('preferredCommunication'):
            prompt += f"\n\nCOMMUNICATION STYLE: {athlete_memory['preferredCommunication']}\n"

    # Add mood context if available
    if mood_context:
        prompt += f"\n\nRECENT MOOD (Last 3 Days):\n"
        if 'mood_avg' in mood_context:
            prompt += f"- Mood: {mood_context['mood_avg']:.1f}/10\n"
        if 'stress_avg' in mood_context:
            prompt += f"- Stress: {mood_context['stress_avg']:.1f}/10\n"
        if 'confidence_avg' in mood_context:
            prompt += f"- Confidence: {mood_context['confidence_avg']:.1f}/10\n"

    # Add goals context
    if goals_context:
        prompt += f"\n\nACTIVE GOALS ({len(goals_context)}):\n"
        for goal in goals_context[:3]:
            prompt += f"- {goal.get('title', 'Unknown goal')}\n"

    # Add knowledge base context
    if kb_chunks:
        prompt += f"\n\nRELEVANT KNOWLEDGE BASE CONTEXT:\n"
        for i, chunk in enumerate(kb_chunks[:3], 1):
            prompt += f"\n[KB Chunk {i}]\n{chunk}\n"

    return prompt


def get_phase_description(phase: str) -> str:
    """
    Get human-readable description of current phase.

    Args:
        phase: Protocol phase key

    Returns:
        Short description for UI display
    """
    descriptions = {
        "check_in": "Understanding your situation",
        "clarify": "Exploring the details",
        "formulation": "Selecting the right approach",
        "intervention": "Practicing the technique",
        "plan": "Creating your action plan",
        "wrap_up": "Setting you up for success"
    }
    return descriptions.get(phase.lower(), "Working with you")


def get_next_phase(current_phase: str, turn_count: int = 0) -> str:
    """
    Determine next phase based on current phase and turn count.

    Args:
        current_phase: Current protocol phase
        turn_count: Number of turns in current phase

    Returns:
        Next phase to transition to
    """
    phase_order = ["check_in", "clarify", "formulation", "intervention", "plan", "wrap_up"]

    try:
        current_idx = phase_order.index(current_phase.lower())
    except ValueError:
        return "check_in"  # Default to start

    # Check if ready to advance
    if current_phase.lower() == "check_in" and turn_count >= 2:
        return "clarify"
    elif current_phase.lower() == "clarify" and turn_count >= 1:
        return "formulation"
    elif current_phase.lower() == "formulation" and turn_count >= 1:
        return "intervention"
    elif current_phase.lower() == "intervention" and turn_count >= 1:
        return "plan"
    elif current_phase.lower() == "plan" and turn_count >= 1:
        return "wrap_up"

    # Stay in current phase if not ready
    return current_phase


# ============================================
# TRIAGE QUESTIONS GENERATOR
# ============================================

TRIAGE_QUESTION_TEMPLATES = {
    # Core discovery questions
    "sport_context": [
        "What sport do you play, and what position?",
        "Are you in-season right now, or off-season?",
        "When's your next competition?",
    ],
    "issue_identification": [
        "What brings you here today? What's on your mind?",
        "What's been the biggest mental challenge you're facing in your sport right now?",
        "Is there a specific situation or moment that triggered this?",
    ],
    "recent_event": [
        "Can you tell me about the last time this happened? What was going on?",
        "Walk me through a recent game or practice where you felt this way.",
        "What happened recently that made you want to talk about this?",
    ],
    "emotional_state": [
        "How are you feeling about this right now?",
        "On a scale of 1-10, how much is this affecting you?",
        "What emotions come up when you think about your next game/competition?",
    ],
    "timeline": [
        "Is this something new, or has it been ongoing?",
        "How long have you been dealing with this?",
        "Do you have a big competition coming up soon?",
    ],
}


def generate_triage_questions(
    turn_count: int,
    detected_issues: List[str],
    sport_known: bool,
    timeline_known: bool
) -> List[str]:
    """
    Generate targeted triage questions for CHECK_IN phase.

    Args:
        turn_count: Current turn in CHECK_IN phase
        detected_issues: Issues detected so far
        sport_known: Whether sport context is known
        timeline_known: Whether timeline is known

    Returns:
        List of 1-3 triage questions to ask
    """
    questions = []

    # Turn 1: Always start with issue identification
    if turn_count == 0:
        questions.append(TRIAGE_QUESTION_TEMPLATES["issue_identification"][0])
        if not sport_known:
            questions.append(TRIAGE_QUESTION_TEMPLATES["sport_context"][0])
        return questions[:2]  # Max 2 questions on first turn

    # Turn 2: Dig into specifics
    if turn_count == 1:
        if not detected_issues:
            questions.append(TRIAGE_QUESTION_TEMPLATES["issue_identification"][1])

        if not timeline_known:
            questions.append(TRIAGE_QUESTION_TEMPLATES["timeline"][2])

        questions.append(TRIAGE_QUESTION_TEMPLATES["recent_event"][0])
        return questions[:3]  # Max 3 questions

    # Turn 3: Final clarification if needed
    if turn_count == 2:
        questions.append(TRIAGE_QUESTION_TEMPLATES["emotional_state"][0])
        if not timeline_known:
            questions.append(TRIAGE_QUESTION_TEMPLATES["timeline"][0])
        return questions[:2]

    return []


def get_triage_guidance(turn_count: int) -> str:
    """
    Get guidance for triage questioning based on turn count.

    Args:
        turn_count: Current turn in CHECK_IN phase

    Returns:
        Guidance string to add to prompt
    """
    if turn_count == 0:
        return """
TRIAGE TURN 1:
Ask 1-2 questions to understand:
1. What brings them here today (primary issue)
2. Their sport and position (if not already known)

Keep it conversational and welcoming. Don't overwhelm with questions.
"""
    elif turn_count == 1:
        return """
TRIAGE TURN 2:
Ask 2-3 follow-up questions to clarify:
1. Specific recent event that triggered this
2. Timeline (when's next competition? how long has this been going on?)
3. Dig deeper into the issue they mentioned

Start building hypotheses about what's happening.
"""
    elif turn_count >= 2:
        return """
TRIAGE TURN 3 (FINAL):
This should be your last CHECK_IN turn. Ask 1-2 final questions:
1. Emotional state / intensity
2. Any missing timeline info

You should have enough to move to CLARIFY phase next turn.
Summarize what you've learned and transition.
"""
    return ""
