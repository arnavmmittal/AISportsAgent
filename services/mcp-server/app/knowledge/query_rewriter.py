"""
Query Rewriter for RAG Enhancement

Improves retrieval quality through:
- Query expansion (adding related terms)
- Query reformulation (rephrasing for better matching)
- Decomposition (breaking complex queries into sub-queries)
"""

from typing import List, Dict, Any, Optional
from openai import AsyncOpenAI
from app.core.config import settings
from app.core.logging import setup_logging

logger = setup_logging()

# OpenAI client singleton
_client: Optional[AsyncOpenAI] = None


def get_client() -> AsyncOpenAI:
    """Get or create OpenAI client."""
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    return _client


class QueryRewriter:
    """
    Rewrites queries to improve retrieval quality.

    Techniques:
    1. Expansion: Add synonyms and related terms
    2. Reformulation: Rephrase for better semantic matching
    3. Decomposition: Break into sub-queries for complex questions
    """

    # Sports psychology domain terms for expansion
    DOMAIN_SYNONYMS = {
        "anxiety": ["nervousness", "worry", "stress", "tension", "fear"],
        "confidence": ["self-belief", "self-efficacy", "assurance", "certainty"],
        "focus": ["concentration", "attention", "mindfulness", "present moment"],
        "motivation": ["drive", "determination", "ambition", "willpower"],
        "performance": ["execution", "output", "results", "achievement"],
        "recovery": ["rest", "recuperation", "restoration", "healing"],
        "stress": ["pressure", "tension", "anxiety", "strain"],
        "visualization": ["imagery", "mental rehearsal", "mental practice"],
        "breathing": ["respiration", "breath work", "breathing exercises"],
        "mindfulness": ["awareness", "presence", "meditation"],
        "slump": ["decline", "downturn", "plateau", "regression"],
        "pregame": ["pre-competition", "pre-match", "before game"],
    }

    REWRITE_PROMPT = """You are a sports psychology expert helping improve search queries for a knowledge base.

Given a user's question, rewrite it to be more effective for semantic search. The knowledge base contains sports psychology research, mental performance frameworks, and intervention protocols.

Guidelines:
- Keep the core intent
- Use technical sports psychology terminology where appropriate
- Make it specific enough for good retrieval
- Remove conversational language

User question: {query}

Rewritten query (just the query, no explanation):"""

    EXPANSION_PROMPT = """You are a sports psychology expert. Given a search query, provide 3-5 related search terms that would help find relevant information.

Query: {query}

Return only the terms, one per line, no numbers or bullets:"""

    DECOMPOSITION_PROMPT = """You are a sports psychology expert. Break down this complex question into 2-3 simpler sub-questions that together would answer the original question.

Complex question: {query}

Sub-questions (one per line, no numbers):"""

    def __init__(self, model: str = "gpt-4-turbo-preview"):
        """Initialize query rewriter."""
        self.model = model

    async def rewrite(self, query: str) -> str:
        """
        Rewrite query for better semantic matching.

        Args:
            query: Original user query

        Returns:
            Rewritten query
        """
        client = get_client()

        try:
            response = await client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "user", "content": self.REWRITE_PROMPT.format(query=query)}
                ],
                max_tokens=150,
                temperature=0.3,
            )

            rewritten = response.choices[0].message.content.strip()
            logger.info(f"Query rewritten: '{query}' -> '{rewritten}'")
            return rewritten

        except Exception as e:
            logger.warning(f"Query rewrite failed: {e}, using original")
            return query

    async def expand(self, query: str) -> List[str]:
        """
        Expand query with related terms.

        Args:
            query: Original query

        Returns:
            List of expanded query terms
        """
        expanded = [query]  # Always include original

        # Add domain synonyms
        query_lower = query.lower()
        for term, synonyms in self.DOMAIN_SYNONYMS.items():
            if term in query_lower:
                for syn in synonyms[:2]:  # Add top 2 synonyms
                    expanded_query = query_lower.replace(term, syn)
                    if expanded_query not in expanded:
                        expanded.append(expanded_query)

        # Use LLM for additional expansion
        try:
            client = get_client()
            response = await client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "user", "content": self.EXPANSION_PROMPT.format(query=query)}
                ],
                max_tokens=100,
                temperature=0.5,
            )

            llm_terms = response.choices[0].message.content.strip().split("\n")
            for term in llm_terms:
                term = term.strip()
                if term and term not in expanded:
                    expanded.append(term)

        except Exception as e:
            logger.warning(f"LLM expansion failed: {e}")

        logger.info(f"Query expanded: '{query}' -> {expanded}")
        return expanded[:5]  # Limit to 5 queries

    async def decompose(self, query: str) -> List[str]:
        """
        Decompose complex query into sub-queries.

        Args:
            query: Complex query

        Returns:
            List of simpler sub-queries
        """
        # Quick check if decomposition is needed
        if len(query.split()) < 10 and "and" not in query.lower():
            return [query]

        try:
            client = get_client()
            response = await client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "user", "content": self.DECOMPOSITION_PROMPT.format(query=query)}
                ],
                max_tokens=200,
                temperature=0.3,
            )

            sub_queries = response.choices[0].message.content.strip().split("\n")
            sub_queries = [q.strip() for q in sub_queries if q.strip()]

            logger.info(f"Query decomposed: '{query}' -> {sub_queries}")
            return sub_queries if sub_queries else [query]

        except Exception as e:
            logger.warning(f"Query decomposition failed: {e}")
            return [query]

    async def hybrid_rewrite(
        self,
        query: str,
        expand: bool = True,
        decompose: bool = False,
    ) -> Dict[str, Any]:
        """
        Apply multiple rewriting techniques.

        Args:
            query: Original query
            expand: Whether to expand query
            decompose: Whether to decompose complex queries

        Returns:
            Dict with rewritten, expanded, and decomposed queries
        """
        result = {
            "original": query,
            "rewritten": await self.rewrite(query),
            "expanded": [],
            "decomposed": [],
        }

        if expand:
            result["expanded"] = await self.expand(query)

        if decompose:
            result["decomposed"] = await self.decompose(query)

        return result


# Convenience functions
async def rewrite_query(query: str) -> str:
    """Rewrite a query for better retrieval."""
    rewriter = QueryRewriter()
    return await rewriter.rewrite(query)


async def expand_query(query: str) -> List[str]:
    """Expand a query with related terms."""
    rewriter = QueryRewriter()
    return await rewriter.expand(query)
