"""
RAG Enhancement for Elite Sports Psychology System.

Advanced query rewriting and chunk reranking for better knowledge retrieval.
"""

from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import re


@dataclass
class KBChunk:
    """Knowledge base chunk with metadata."""
    id: str
    content: str
    source: str
    metadata: Dict[str, Any]
    similarity_score: float = 0.0
    rerank_score: float = 0.0


# ============================================
# QUERY REWRITING
# ============================================

class RAGQueryRewriter:
    """
    Rewrites athlete queries into multiple effective KB search queries.

    Implements multi-query generation based on:
    - Session phase
    - Detected issues
    - Sport context
    - Athlete memory (effective techniques from past)
    """

    def __init__(self):
        """Initialize query rewriter."""
        pass

    def generate_queries(
        self,
        user_message: str,
        session_phase: str,
        detected_issues: List[str],
        sport: str,
        athlete_memory: Optional[Dict[str, Any]] = None
    ) -> List[str]:
        """
        Generate 3-5 query variants for knowledge base retrieval.

        Args:
            user_message: User's original message
            session_phase: Current protocol phase
            detected_issues: Detected issue tags
            sport: Athlete's sport
            athlete_memory: Athlete memory with effective techniques

        Returns:
            List of 3-5 query variants
        """
        queries = []

        # 1. Base query: clean user message
        cleaned_message = self._clean_query(user_message)
        queries.append(cleaned_message)

        # 2. Issue-specific queries
        if detected_issues:
            primary_issue = detected_issues[0]
            queries.append(f"{sport} {primary_issue} intervention")
            queries.append(f"{primary_issue} mental skills training evidence-based")

        # 3. Phase-specific queries
        if session_phase == "formulation":
            # Looking for intervention frameworks
            if detected_issues:
                queries.append(f"{detected_issues[0]} CBT mindfulness ACT frameworks")
        elif session_phase == "intervention":
            # Looking for practical exercises
            if detected_issues:
                queries.append(f"{detected_issues[0]} practical exercise protocol steps")
                queries.append(f"{sport} mental training {detected_issues[0]}")
        elif session_phase == "clarify":
            # Looking for diagnostic information
            if detected_issues:
                queries.append(f"{detected_issues[0]} symptoms triggers patterns")

        # 4. Sport-specific context
        queries.append(f"{sport} sports psychology best practices")

        # 5. Memory-informed queries (use what worked before)
        if athlete_memory and athlete_memory.get('effectiveTechniques'):
            top_technique = athlete_memory['effectiveTechniques'][0]
            technique_name = top_technique.get('name', '')
            if technique_name:
                queries.append(f"{sport} {technique_name} application")

        # Return unique queries, max 5
        unique_queries = list(dict.fromkeys(queries))  # Remove duplicates
        return unique_queries[:5]

    def _clean_query(self, query: str) -> str:
        """
        Clean and normalize query text.

        Args:
            query: Raw query string

        Returns:
            Cleaned query
        """
        # Remove excess whitespace
        query = ' '.join(query.split())

        # Remove filler words
        filler_words = ['um', 'uh', 'like', 'you know', 'i mean']
        for filler in filler_words:
            query = re.sub(r'\b' + filler + r'\b', '', query, flags=re.IGNORECASE)

        # Remove excess whitespace again
        query = ' '.join(query.split())

        return query.strip()


# ============================================
# CHUNK RERANKING
# ============================================

class KBChunkReranker:
    """
    Reranks retrieved KB chunks using multi-factor scoring.

    Scoring formula:
    score = (0.4 * semantic_similarity) +
            (0.3 * sport_relevance) +
            (0.2 * evidence_quality) +
            (0.1 * phase_alignment)
    """

    def __init__(self):
        """Initialize reranker."""
        # Sport-specific keywords for boosting
        self.sport_keywords = {
            "basketball": ["court", "shot", "defense", "offense", "free throw", "rebound"],
            "soccer": ["pitch", "goal", "penalty", "possession", "striker", "defender"],
            "baseball": ["bat", "pitch", "inning", "mound", "plate", "dugout"],
            "softball": ["bat", "pitch", "inning", "circle", "plate", "dugout"],
            "football": ["field", "touchdown", "quarterback", "tackle", "drive"],
            "volleyball": ["serve", "spike", "block", "rotation", "libero"],
            "golf": ["swing", "putt", "drive", "green", "fairway", "course"],
            "tennis": ["serve", "rally", "volley", "baseline", "deuce"],
            "track": ["sprint", "distance", "relay", "hurdle", "lane"],
            "swimming": ["stroke", "lap", "turn", "freestyle", "butterfly"],
        }

        # Evidence-based framework keywords
        self.evidence_keywords = [
            "research", "study", "evidence", "proven", "effective",
            "CBT", "cognitive behavioral", "mindfulness", "ACT",
            "meta-analysis", "randomized", "clinical trial"
        ]

    def rerank_chunks(
        self,
        chunks: List[KBChunk],
        sport: str,
        session_phase: str,
        detected_issues: List[str]
    ) -> List[KBChunk]:
        """
        Rerank KB chunks using multi-factor scoring.

        Args:
            chunks: List of KB chunks with similarity scores
            sport: Athlete's sport
            session_phase: Current protocol phase
            detected_issues: Detected issue tags

        Returns:
            Reranked list of chunks (highest score first)
        """
        for chunk in chunks:
            # Calculate composite score
            semantic = chunk.similarity_score
            sport_rel = self._calculate_sport_relevance(chunk, sport)
            evidence = self._calculate_evidence_quality(chunk)
            phase_align = self._calculate_phase_alignment(chunk, session_phase)

            # Weighted composite score
            chunk.rerank_score = (
                0.4 * semantic +
                0.3 * sport_rel +
                0.2 * evidence +
                0.1 * phase_align
            )

        # Sort by rerank score (descending)
        ranked_chunks = sorted(chunks, key=lambda c: c.rerank_score, reverse=True)

        return ranked_chunks

    def _calculate_sport_relevance(self, chunk: KBChunk, sport: str) -> float:
        """
        Calculate sport relevance score (0-1).

        Args:
            chunk: KB chunk
            sport: Athlete's sport

        Returns:
            Relevance score 0-1
        """
        sport_lower = sport.lower()
        content_lower = chunk.content.lower()

        # Check metadata for exact sport match
        chunk_sports = chunk.metadata.get('sports', [])
        if sport_lower in [s.lower() for s in chunk_sports]:
            return 1.0  # Exact match

        # Check if "general" sport (applies to all)
        if 'general' in chunk_sports or 'all sports' in chunk_sports:
            return 0.7  # Good match

        # Check for sport keywords in content
        if sport_lower in self.sport_keywords:
            keywords = self.sport_keywords[sport_lower]
            keyword_count = sum(1 for kw in keywords if kw in content_lower)
            if keyword_count > 0:
                return min(0.6 + (keyword_count * 0.1), 1.0)

        # Check if sport is mentioned in content
        if sport_lower in content_lower:
            return 0.5

        return 0.0  # No sport relevance

    def _calculate_evidence_quality(self, chunk: KBChunk) -> float:
        """
        Calculate evidence quality score (0-1).

        Args:
            chunk: KB chunk

        Returns:
            Evidence quality score 0-1
        """
        content_lower = chunk.content.lower()

        # Count evidence-based keywords
        keyword_count = sum(1 for kw in self.evidence_keywords if kw in content_lower)

        # Check metadata for framework tags
        frameworks = chunk.metadata.get('frameworks', [])
        if any(fw in ['CBT', 'ACT', 'mindfulness', 'research'] for fw in frameworks):
            keyword_count += 2

        # Score based on keyword count
        if keyword_count >= 3:
            return 1.0
        elif keyword_count == 2:
            return 0.7
        elif keyword_count == 1:
            return 0.4
        else:
            return 0.0

    def _calculate_phase_alignment(self, chunk: KBChunk, session_phase: str) -> float:
        """
        Calculate phase alignment score (0-1).

        Args:
            chunk: KB chunk
            session_phase: Current protocol phase

        Returns:
            Phase alignment score 0-1
        """
        # Check if chunk is tagged for this phase
        chunk_phases = chunk.metadata.get('phases', [])
        if session_phase in chunk_phases:
            return 1.0

        # Phase-specific content matching
        content_lower = chunk.content.lower()

        if session_phase == "intervention":
            # Look for practical exercise content
            if any(word in content_lower for word in ['exercise', 'practice', 'step', 'technique', 'protocol']):
                return 0.7
        elif session_phase == "formulation":
            # Look for framework content
            if any(word in content_lower for word in ['framework', 'model', 'theory', 'approach']):
                return 0.7
        elif session_phase == "clarify":
            # Look for diagnostic content
            if any(word in content_lower for word in ['symptom', 'cause', 'trigger', 'pattern']):
                return 0.7

        return 0.0  # No phase alignment


# ============================================
# KB CITATION TRACKING
# ============================================

class CitationTracker:
    """
    Tracks which KB chunks are used in responses for audit trail.
    """

    def __init__(self, db_session):
        """
        Initialize citation tracker.

        Args:
            db_session: Database session for logging
        """
        self.db = db_session

    def track_citation(
        self,
        session_id: str,
        chunk_id: str,
        chunk_source: str,
        relevance_score: float,
        framework: Optional[str] = None
    ) -> None:
        """
        Log KB chunk usage for citation tracking.

        Args:
            session_id: Chat session ID
            chunk_id: KB chunk identifier
            chunk_source: Source document name
            relevance_score: Relevance score (0-1)
            framework: Framework tag (CBT, mindfulness, etc.)
        """
        # This would log to a KBUsageLog table in production
        # For now, just log it
        from app.core.logging import setup_logging
        logger = setup_logging()

        logger.info(
            f"KB Citation: session={session_id}, chunk={chunk_id}, "
            f"source={chunk_source}, score={relevance_score:.2f}, framework={framework}"
        )


# ============================================
# HELPER FUNCTIONS
# ============================================

def enhance_rag_retrieval(
    user_message: str,
    session_phase: str,
    detected_issues: List[str],
    sport: str,
    athlete_memory: Optional[Dict[str, Any]],
    raw_chunks: List[KBChunk]
) -> tuple[List[str], List[KBChunk]]:
    """
    Enhanced RAG retrieval with query rewriting and reranking.

    Args:
        user_message: User's message
        session_phase: Current phase
        detected_issues: Detected issues
        sport: Athlete's sport
        athlete_memory: Athlete memory
        raw_chunks: Raw retrieved chunks

    Returns:
        Tuple of (generated_queries, reranked_chunks)
    """
    # Generate multiple queries
    rewriter = RAGQueryRewriter()
    queries = rewriter.generate_queries(
        user_message=user_message,
        session_phase=session_phase,
        detected_issues=detected_issues,
        sport=sport,
        athlete_memory=athlete_memory
    )

    # Rerank chunks
    reranker = KBChunkReranker()
    ranked_chunks = reranker.rerank_chunks(
        chunks=raw_chunks,
        sport=sport,
        session_phase=session_phase,
        detected_issues=detected_issues
    )

    return queries, ranked_chunks
