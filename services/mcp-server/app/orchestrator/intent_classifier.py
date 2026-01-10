"""
Intent Classifier for Agent Routing

Classifies user messages into intents to determine appropriate agent routing.
Uses a combination of keyword matching and LLM classification.
"""

from enum import Enum
from typing import Dict, Any, Optional, List, Tuple
from dataclasses import dataclass
from openai import AsyncOpenAI
from app.core.config import settings
from app.core.logging import setup_logging

logger = setup_logging()


class Intent(str, Enum):
    """Classified intents for routing."""
    # Athlete support intents
    EMOTIONAL_SUPPORT = "emotional_support"  # Anxiety, stress, feeling down
    CONFIDENCE_BUILDING = "confidence_building"  # Self-doubt, pre-game nerves
    PERFORMANCE_DISCUSSION = "performance_discussion"  # Game analysis, practice
    GOAL_SETTING = "goal_setting"  # Setting or reviewing goals
    TECHNIQUE_QUESTION = "technique_question"  # Mental techniques, exercises

    # Information intents
    KNOWLEDGE_QUERY = "knowledge_query"  # Sports psychology questions
    FRAMEWORK_REQUEST = "framework_request"  # Request specific intervention

    # Coach intents
    TEAM_ANALYTICS = "team_analytics"  # Team-level insights (coach only)
    ATHLETE_STATUS = "athlete_status"  # Status of specific athlete (coach)

    # System intents
    CRISIS = "crisis"  # Mental health crisis detected
    GREETING = "greeting"  # Simple greeting
    CLARIFICATION = "clarification"  # Unclear, needs clarification
    OFF_TOPIC = "off_topic"  # Not related to sports psychology

    # Scheduling/Routine
    ROUTINE_BUILDING = "routine_building"  # Building pre-game routines
    SCHEDULING = "scheduling"  # Schedule-related questions


# Intent descriptions for LLM classification
INTENT_DESCRIPTIONS = {
    Intent.EMOTIONAL_SUPPORT: "User is expressing emotional distress, anxiety, stress, frustration, or seeking emotional support",
    Intent.CONFIDENCE_BUILDING: "User is experiencing self-doubt, imposter syndrome, pre-game nerves, or needs confidence building",
    Intent.PERFORMANCE_DISCUSSION: "User wants to discuss a game, practice, or performance (past or upcoming)",
    Intent.GOAL_SETTING: "User wants to set, review, or modify their goals",
    Intent.TECHNIQUE_QUESTION: "User is asking about mental techniques, exercises, or strategies",
    Intent.KNOWLEDGE_QUERY: "User is asking a factual question about sports psychology",
    Intent.FRAMEWORK_REQUEST: "User is explicitly requesting a specific intervention (breathing, visualization, etc.)",
    Intent.TEAM_ANALYTICS: "Coach asking for team-level analytics or aggregate insights",
    Intent.ATHLETE_STATUS: "Coach asking about a specific athlete's status",
    Intent.CRISIS: "User is expressing suicidal thoughts, self-harm, or severe mental health crisis",
    Intent.GREETING: "Simple greeting or conversation opener",
    Intent.CLARIFICATION: "Message is unclear or ambiguous",
    Intent.OFF_TOPIC: "Message is not related to sports, mental performance, or psychology",
    Intent.ROUTINE_BUILDING: "User wants help building or refining a routine",
    Intent.SCHEDULING: "User is asking about schedules, timing, or planning",
}


@dataclass
class ClassificationResult:
    """Result of intent classification."""
    primary_intent: Intent
    confidence: float
    secondary_intents: List[Tuple[Intent, float]]
    requires_crisis_check: bool
    context_hints: Dict[str, Any]


class IntentClassifier:
    """
    Classifies user messages into intents for agent routing.

    Uses a two-stage approach:
    1. Fast keyword-based classification for common patterns
    2. LLM-based classification for ambiguous cases
    """

    # Keyword patterns for fast classification
    KEYWORD_PATTERNS = {
        Intent.CRISIS: [
            "suicide", "kill myself", "end it all", "want to die",
            "self-harm", "hurt myself", "no point living", "worthless",
        ],
        Intent.GREETING: [
            "hi", "hello", "hey", "good morning", "good afternoon",
            "what's up", "how are you", "howdy",
        ],
        Intent.EMOTIONAL_SUPPORT: [
            "anxious", "stressed", "worried", "scared", "nervous",
            "overwhelmed", "frustrated", "angry", "sad", "depressed",
            "can't sleep", "panic", "afraid",
        ],
        Intent.CONFIDENCE_BUILDING: [
            "not good enough", "doubt myself", "imposter", "nervous about",
            "scared to fail", "what if i mess up", "don't believe",
            "lost my confidence", "second guessing",
        ],
        Intent.TECHNIQUE_QUESTION: [
            "breathing exercise", "visualization", "how do i",
            "technique for", "what should i do when", "meditation",
            "mental exercise", "routine", "strategy for",
        ],
        Intent.FRAMEWORK_REQUEST: [
            "do the breathing", "let's do visualization", "start meditation",
            "guide me through", "walk me through", "help me with",
        ],
        Intent.GOAL_SETTING: [
            "my goal", "set a goal", "want to achieve", "working towards",
            "milestone", "target", "objective",
        ],
        Intent.PERFORMANCE_DISCUSSION: [
            "the game", "my performance", "practice today", "competition",
            "tournament", "match", "played well", "played badly",
            "upcoming game", "last game",
        ],
    }

    CLASSIFICATION_PROMPT = """You are a sports psychology intent classifier. Classify the user's message into exactly one primary intent.

Available intents:
{intent_descriptions}

User message: "{message}"

Context: {context}

Respond with JSON only:
{{
    "primary_intent": "<intent_name>",
    "confidence": <0.0-1.0>,
    "secondary_intent": "<intent_name or null>",
    "requires_crisis_check": <true/false>,
    "context_hints": {{"emotion": "<detected_emotion>", "topic": "<topic>"}}
}}"""

    def __init__(self, use_llm_fallback: bool = True):
        """
        Initialize classifier.

        Args:
            use_llm_fallback: Whether to use LLM for ambiguous cases
        """
        self.use_llm_fallback = use_llm_fallback
        self._client: Optional[AsyncOpenAI] = None

    def _get_client(self) -> AsyncOpenAI:
        """Get or create OpenAI client."""
        if self._client is None:
            self._client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        return self._client

    async def classify(
        self,
        message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        user_role: str = "ATHLETE",
    ) -> ClassificationResult:
        """
        Classify message intent.

        Args:
            message: User message to classify
            conversation_history: Previous messages for context
            user_role: User's role (ATHLETE, COACH, ADMIN)

        Returns:
            ClassificationResult with primary intent and metadata
        """
        message_lower = message.lower().strip()

        # Stage 1: Crisis check (always first)
        if self._check_crisis_keywords(message_lower):
            return ClassificationResult(
                primary_intent=Intent.CRISIS,
                confidence=0.95,
                secondary_intents=[],
                requires_crisis_check=True,
                context_hints={"urgency": "high"},
            )

        # Stage 2: Fast keyword classification
        keyword_result = self._classify_by_keywords(message_lower)
        if keyword_result and keyword_result[1] > 0.7:
            return ClassificationResult(
                primary_intent=keyword_result[0],
                confidence=keyword_result[1],
                secondary_intents=[],
                requires_crisis_check=keyword_result[0] == Intent.EMOTIONAL_SUPPORT,
                context_hints={},
            )

        # Stage 3: LLM classification for ambiguous cases
        if self.use_llm_fallback:
            try:
                return await self._classify_with_llm(
                    message, conversation_history, user_role
                )
            except Exception as e:
                logger.warning(f"LLM classification failed: {e}")

        # Fallback to keyword result or default
        if keyword_result:
            return ClassificationResult(
                primary_intent=keyword_result[0],
                confidence=keyword_result[1],
                secondary_intents=[],
                requires_crisis_check=False,
                context_hints={},
            )

        return ClassificationResult(
            primary_intent=Intent.CLARIFICATION,
            confidence=0.5,
            secondary_intents=[],
            requires_crisis_check=False,
            context_hints={},
        )

    def _check_crisis_keywords(self, message: str) -> bool:
        """Check for crisis-related keywords."""
        crisis_patterns = self.KEYWORD_PATTERNS[Intent.CRISIS]
        return any(pattern in message for pattern in crisis_patterns)

    def _classify_by_keywords(
        self,
        message: str,
    ) -> Optional[Tuple[Intent, float]]:
        """
        Classify using keyword patterns.

        Returns (intent, confidence) or None if no match.
        """
        scores = {}

        for intent, patterns in self.KEYWORD_PATTERNS.items():
            match_count = sum(1 for p in patterns if p in message)
            if match_count > 0:
                # More matches = higher confidence
                confidence = min(0.5 + (match_count * 0.15), 0.9)
                scores[intent] = confidence

        if not scores:
            return None

        # Return highest scoring intent
        best_intent = max(scores, key=scores.get)
        return (best_intent, scores[best_intent])

    async def _classify_with_llm(
        self,
        message: str,
        conversation_history: Optional[List[Dict[str, str]]],
        user_role: str,
    ) -> ClassificationResult:
        """Classify using LLM for complex cases."""
        client = self._get_client()

        # Build context string
        context = f"User role: {user_role}"
        if conversation_history:
            recent = conversation_history[-3:]  # Last 3 messages
            context += f"\nRecent conversation: {recent}"

        # Build intent descriptions
        intent_desc = "\n".join(
            f"- {intent.value}: {desc}"
            for intent, desc in INTENT_DESCRIPTIONS.items()
        )

        prompt = self.CLASSIFICATION_PROMPT.format(
            intent_descriptions=intent_desc,
            message=message,
            context=context,
        )

        response = await client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200,
            temperature=0,
            response_format={"type": "json_object"},
        )

        import json
        result = json.loads(response.choices[0].message.content)

        primary_intent = Intent(result["primary_intent"])
        secondary = []
        if result.get("secondary_intent"):
            try:
                secondary = [(Intent(result["secondary_intent"]), 0.5)]
            except ValueError:
                pass

        return ClassificationResult(
            primary_intent=primary_intent,
            confidence=result.get("confidence", 0.8),
            secondary_intents=secondary,
            requires_crisis_check=result.get("requires_crisis_check", False),
            context_hints=result.get("context_hints", {}),
        )


# Convenience function
async def classify_intent(
    message: str,
    conversation_history: Optional[List[Dict[str, str]]] = None,
    user_role: str = "ATHLETE",
) -> ClassificationResult:
    """
    Classify a message's intent.

    Convenience wrapper around IntentClassifier.
    """
    classifier = IntentClassifier()
    return await classifier.classify(message, conversation_history, user_role)
