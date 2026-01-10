"""
Knowledge Retriever with Reranking

End-to-end retrieval pipeline:
1. Query rewriting/expansion
2. Vector similarity search
3. Cross-encoder reranking
4. Context assembly
"""

import asyncio
from typing import List, Dict, Any, Optional
from openai import AsyncOpenAI
from app.core.config import settings
from app.core.logging import setup_logging

logger = setup_logging()


class KnowledgeRetriever:
    """
    Full retrieval pipeline for sports psychology knowledge base.

    Pipeline:
    1. Rewrite/expand query for better matching
    2. Retrieve candidates via vector similarity
    3. Rerank using cross-encoder or LLM
    4. Assemble final context
    """

    RERANK_PROMPT = """You are evaluating search results for relevance to a query.

Query: {query}

For each document, rate its relevance from 0-10:
- 10: Directly answers the query with specific, actionable information
- 7-9: Highly relevant, contains useful information
- 4-6: Somewhat relevant, tangentially related
- 1-3: Minimally relevant
- 0: Not relevant at all

Documents:
{documents}

Return only the scores as a comma-separated list (e.g., "8, 5, 9, 3, 7"):"""

    def __init__(
        self,
        top_k: int = 5,
        rerank_top_k: int = 3,
        use_reranking: bool = True,
        use_query_rewriting: bool = True,
    ):
        """
        Initialize retriever.

        Args:
            top_k: Number of candidates to retrieve
            rerank_top_k: Number of results after reranking
            use_reranking: Whether to apply reranking
            use_query_rewriting: Whether to rewrite queries
        """
        self.top_k = top_k
        self.rerank_top_k = rerank_top_k
        self.use_reranking = use_reranking
        self.use_query_rewriting = use_query_rewriting

    async def retrieve(
        self,
        query: str,
        filter_metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Retrieve relevant context for a query.

        Args:
            query: User query
            filter_metadata: Optional metadata filter

        Returns:
            Dict with context, sources, and retrieval metadata
        """
        from .vectorstore import get_vectorstore
        from .query_rewriter import QueryRewriter

        # Step 1: Query rewriting
        search_queries = [query]
        if self.use_query_rewriting:
            try:
                rewriter = QueryRewriter()
                rewrite_result = await rewriter.hybrid_rewrite(query, expand=True)
                search_queries = [rewrite_result["rewritten"]]
                if rewrite_result["expanded"]:
                    search_queries.extend(rewrite_result["expanded"][:2])
            except Exception as e:
                logger.warning(f"Query rewriting failed: {e}")

        # Step 2: Vector search with multiple queries
        all_candidates = []
        seen_ids = set()
        vectorstore = get_vectorstore()

        for search_query in search_queries:
            results = vectorstore.similarity_search(
                query=search_query,
                n_results=self.top_k,
                where=filter_metadata,
            )

            for result in results:
                result_id = result.get("id")
                if result_id not in seen_ids:
                    seen_ids.add(result_id)
                    all_candidates.append(result)

        if not all_candidates:
            return {
                "context": "",
                "sources": [],
                "query": query,
                "message": "No relevant documents found",
            }

        # Step 3: Reranking
        if self.use_reranking and len(all_candidates) > self.rerank_top_k:
            try:
                reranked = await self._rerank(query, all_candidates)
                final_results = reranked[:self.rerank_top_k]
            except Exception as e:
                logger.warning(f"Reranking failed: {e}")
                # Fall back to top results by distance
                all_candidates.sort(key=lambda x: x.get("distance", 1))
                final_results = all_candidates[:self.rerank_top_k]
        else:
            all_candidates.sort(key=lambda x: x.get("distance", 1))
            final_results = all_candidates[:self.rerank_top_k]

        # Step 4: Assemble context
        context = self._assemble_context(final_results)
        sources = self._extract_sources(final_results)

        return {
            "context": context,
            "sources": sources,
            "query": query,
            "num_candidates": len(all_candidates),
            "num_results": len(final_results),
        }

    async def _rerank(
        self,
        query: str,
        candidates: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """
        Rerank candidates using LLM scoring.

        Args:
            query: Original query
            candidates: List of candidate documents

        Returns:
            Reranked list of candidates
        """
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

        # Format documents for scoring
        doc_texts = []
        for i, cand in enumerate(candidates):
            content = cand.get("content", "")[:500]  # Truncate for efficiency
            doc_texts.append(f"[{i+1}] {content}")

        documents_text = "\n\n".join(doc_texts)

        try:
            response = await client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {
                        "role": "user",
                        "content": self.RERANK_PROMPT.format(
                            query=query,
                            documents=documents_text,
                        ),
                    }
                ],
                max_tokens=50,
                temperature=0,
            )

            # Parse scores
            scores_text = response.choices[0].message.content.strip()
            scores = [float(s.strip()) for s in scores_text.split(",")]

            # Combine with candidates
            for i, score in enumerate(scores):
                if i < len(candidates):
                    candidates[i]["rerank_score"] = score

            # Sort by rerank score
            candidates.sort(key=lambda x: x.get("rerank_score", 0), reverse=True)

            logger.info(f"Reranked {len(candidates)} candidates")
            return candidates

        except Exception as e:
            logger.error(f"Reranking failed: {e}")
            raise

    def _assemble_context(
        self,
        results: List[Dict[str, Any]],
    ) -> str:
        """
        Assemble results into a single context string.

        Args:
            results: List of retrieval results

        Returns:
            Formatted context string
        """
        if not results:
            return ""

        context_parts = []
        for i, result in enumerate(results):
            content = result.get("content", "")
            metadata = result.get("metadata", {})

            # Format with source info if available
            source_info = ""
            if metadata.get("source"):
                source_info = f" (Source: {metadata['source']})"
            if metadata.get("framework"):
                source_info += f" [Framework: {metadata['framework']}]"

            context_parts.append(f"---\n{content}{source_info}\n")

        return "\n".join(context_parts)

    def _extract_sources(
        self,
        results: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """
        Extract source information from results.

        Args:
            results: List of retrieval results

        Returns:
            List of source dictionaries
        """
        sources = []
        for result in results:
            metadata = result.get("metadata", {})
            source = {
                "id": result.get("id"),
                "title": metadata.get("title", "Unknown"),
                "source": metadata.get("source", "Knowledge Base"),
                "framework": metadata.get("framework"),
                "relevance_score": result.get("rerank_score", 1 - result.get("distance", 0)),
            }
            sources.append(source)
        return sources


# Convenience functions
async def retrieve_context(
    query: str,
    top_k: int = 3,
    filter_metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Retrieve context for a query.

    Convenience function using default retriever settings.
    """
    retriever = KnowledgeRetriever(
        top_k=top_k * 2,
        rerank_top_k=top_k,
    )
    return await retriever.retrieve(query, filter_metadata)


async def retrieve_with_rerank(
    query: str,
    top_k: int = 3,
) -> Dict[str, Any]:
    """
    Retrieve context with full reranking pipeline.

    For best quality retrieval.
    """
    retriever = KnowledgeRetriever(
        top_k=10,
        rerank_top_k=top_k,
        use_reranking=True,
        use_query_rewriting=True,
    )
    return await retriever.retrieve(query)
