"""
Knowledge Agent for RAG-based sports psychology knowledge base.

Handles PDF ingestion, vector storage, and semantic search with filtering.
"""

import uuid
from typing import List, Dict, Any, Optional
from pathlib import Path

import chromadb
from chromadb.config import Settings as ChromaSettings
from openai import OpenAI

from app.core.config import settings
from app.core.logging import setup_logging
from app.utils.pdf_processor import PDFProcessor

logger = setup_logging()


class KnowledgeAgent:
    """
    Agent for managing the sports psychology knowledge base.

    Provides:
    - PDF ingestion with automatic metadata tagging
    - Vector storage in ChromaDB
    - Semantic search with sport/framework/phase/protocol filtering
    - Context retrieval for RAG
    """

    def __init__(self):
        """Initialize the Knowledge Agent."""
        logger.info("Initializing KnowledgeAgent")

        # Initialize OpenAI client
        self.openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)

        # Initialize ChromaDB client
        if settings.CHROMA_HOST:
            # Remote ChromaDB
            self.chroma_client = chromadb.HttpClient(
                host=settings.CHROMA_HOST,
                port=settings.CHROMA_PORT
            )
        else:
            # Local ChromaDB with persistence
            self.chroma_client = chromadb.PersistentClient(
                path=settings.CHROMA_PERSIST_DIRECTORY,
                settings=ChromaSettings(
                    anonymized_telemetry=False,
                    allow_reset=True
                )
            )

        # Get or create collection
        self.collection = self.chroma_client.get_or_create_collection(
            name=settings.CHROMA_COLLECTION_NAME,
            metadata={"description": "Sports psychology knowledge base"}
        )

        # Initialize PDF processor
        self.pdf_processor = PDFProcessor(
            chunk_size=settings.KB_CHUNK_SIZE,
            chunk_overlap=settings.KB_CHUNK_OVERLAP
        )

        logger.info(f"KnowledgeAgent initialized with collection: {settings.CHROMA_COLLECTION_NAME}")

    def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for text using OpenAI.

        Args:
            text: Text to embed

        Returns:
            Embedding vector
        """
        response = self.openai_client.embeddings.create(
            model=settings.OPENAI_EMBEDDING_MODEL,
            input=text
        )
        return response.data[0].embedding

    def ingest_pdf(
        self,
        pdf_path: str,
        source: str = None,
        category: str = None
    ) -> Dict[str, Any]:
        """
        Ingest PDF into knowledge base.

        Processes PDF, generates embeddings, and stores in ChromaDB with metadata.

        Args:
            pdf_path: Path to PDF file
            source: Source identifier (e.g., "Discovery-First Framework")
            category: Knowledge category (e.g., "ANXIETY", "CONFIDENCE")

        Returns:
            Ingestion results with chunk count and IDs
        """
        logger.info(f"Ingesting PDF: {pdf_path}")

        # Process PDF into chunks with metadata
        chunks = self.pdf_processor.process_pdf(pdf_path, source)

        # Prepare data for ChromaDB
        ids = []
        documents = []
        embeddings = []
        metadatas = []

        for chunk in chunks:
            # Generate unique ID
            chunk_id = str(uuid.uuid4())
            ids.append(chunk_id)

            # Get content
            documents.append(chunk["content"])

            # Generate embedding
            embedding = self.generate_embedding(chunk["content"])
            embeddings.append(embedding)

            # Prepare metadata (ChromaDB requires flat dict with string/int/float values)
            metadata = {
                "source": chunk["metadata"]["source"],
                "chunk_index": chunk["metadata"]["chunk_index"],
                "total_chunks": chunk["metadata"]["total_chunks"],
                # Convert lists to comma-separated strings for ChromaDB
                "sports": ",".join(chunk["metadata"]["sports"]),
                "frameworks": ",".join(chunk["metadata"]["frameworks"]),
                "phases": ",".join(chunk["metadata"]["phases"]),
                "protocol_steps": ",".join(chunk["metadata"]["protocol_steps"]),
                "tags": ",".join(chunk["metadata"]["tags"]),
            }

            # Add category if provided
            if category:
                metadata["category"] = category

            metadatas.append(metadata)

            logger.debug(f"Processed chunk {chunk_id}: {len(chunk['content'])} chars")

        # Add to ChromaDB collection
        self.collection.add(
            ids=ids,
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas
        )

        logger.info(f"Ingested {len(chunks)} chunks from {pdf_path}")

        return {
            "success": True,
            "pdf_path": pdf_path,
            "chunks_ingested": len(chunks),
            "chunk_ids": ids,
            "source": source or Path(pdf_path).stem
        }

    def query(
        self,
        query: str,
        n_results: int = 5,
        sport: Optional[str] = None,
        framework: Optional[str] = None,
        phase: Optional[str] = None,
        protocol_step: Optional[str] = None,
        category: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Query knowledge base with semantic search and filtering.

        Args:
            query: Search query
            n_results: Number of results to return
            sport: Filter by sport (e.g., "basketball")
            framework: Filter by framework (e.g., "cbt")
            phase: Filter by phase (e.g., "pre-competition")
            protocol_step: Filter by protocol step (e.g., "explore")
            category: Filter by category (e.g., "ANXIETY")

        Returns:
            List of results with content, metadata, and distance
        """
        logger.info(f"Querying knowledge base: {query}")

        # Generate embedding for query
        query_embedding = self.generate_embedding(query)

        # Build where clause for filtering
        # Note: ChromaDB has limited metadata filtering. We'll do post-filtering for complex queries
        where = None
        if category:
            where = {"category": category}

        # Query ChromaDB - get more results for post-filtering
        query_n_results = n_results * 3 if (sport or framework or phase or protocol_step) else n_results

        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=query_n_results,
            where=where
        )

        # Format results
        formatted_results = []
        if results["documents"] and results["documents"][0]:
            for i in range(len(results["documents"][0])):
                result = {
                    "content": results["documents"][0][i],
                    "metadata": results["metadatas"][0][i],
                    "distance": results["distances"][0][i] if results["distances"] else None,
                    "id": results["ids"][0][i]
                }

                # Convert comma-separated strings back to lists
                for key in ["sports", "frameworks", "phases", "protocol_steps", "tags"]:
                    if key in result["metadata"] and result["metadata"][key]:
                        result["metadata"][key] = result["metadata"][key].split(",")
                    else:
                        result["metadata"][key] = []

                # Post-filter by sport, framework, phase, protocol_step
                if sport and sport not in result["metadata"].get("sports", []):
                    continue
                if framework and framework not in result["metadata"].get("frameworks", []):
                    continue
                if phase and phase not in result["metadata"].get("phases", []):
                    continue
                if protocol_step and protocol_step not in result["metadata"].get("protocol_steps", []):
                    continue

                formatted_results.append(result)

                # Stop if we have enough results
                if len(formatted_results) >= n_results:
                    break

        logger.info(f"Found {len(formatted_results)} results")
        return formatted_results

    async def retrieve_context(
        self,
        query: str,
        athlete_sport: str = "general",
        max_chunks: int = 3
    ) -> str:
        """
        Async wrapper for retrieving context (used by voice chat).

        Args:
            query: Search query
            athlete_sport: Athlete's sport (default: "general")
            max_chunks: Maximum chunks to include

        Returns:
            Formatted context string for RAG
        """
        return self.get_context_for_athlete(query, athlete_sport, max_chunks)

    def get_context_for_athlete(
        self,
        query: str,
        athlete_sport: str,
        max_chunks: int = 3
    ) -> str:
        """
        Get relevant context for athlete query.

        Combines general and sport-specific knowledge.

        Args:
            query: Athlete's question or topic
            athlete_sport: Athlete's sport
            max_chunks: Maximum chunks to include

        Returns:
            Formatted context string for RAG
        """
        # Query with sport filter
        sport_results = self.query(
            query=query,
            n_results=max_chunks,
            sport=athlete_sport
        )

        # Query general knowledge
        general_results = self.query(
            query=query,
            n_results=max_chunks,
            sport="general"
        )

        # Combine and deduplicate
        all_results = sport_results + general_results
        seen_ids = set()
        unique_results = []

        for result in all_results:
            if result["id"] not in seen_ids:
                seen_ids.add(result["id"])
                unique_results.append(result)

        # Limit to max_chunks
        unique_results = unique_results[:max_chunks]

        # Format context
        context_parts = []
        for i, result in enumerate(unique_results, 1):
            context_parts.append(
                f"[Source {i}]\n{result['content']}\n"
                f"(Sport: {', '.join(result['metadata']['sports'])}, "
                f"Frameworks: {', '.join(result['metadata']['frameworks'])})"
            )

        context = "\n\n".join(context_parts)
        return context

    def get_collection_stats(self) -> Dict[str, Any]:
        """
        Get statistics about the knowledge base collection.

        Returns:
            Collection statistics
        """
        count = self.collection.count()

        return {
            "collection_name": settings.CHROMA_COLLECTION_NAME,
            "total_chunks": count,
            "embedding_model": settings.OPENAI_EMBEDDING_MODEL
        }

    def reset_collection(self) -> None:
        """
        Reset the knowledge base collection.

        WARNING: Deletes all data in the collection.
        """
        logger.warning(f"Resetting collection: {settings.CHROMA_COLLECTION_NAME}")
        self.chroma_client.delete_collection(settings.CHROMA_COLLECTION_NAME)
        self.collection = self.chroma_client.create_collection(
            name=settings.CHROMA_COLLECTION_NAME,
            metadata={"description": "Sports psychology knowledge base"}
        )
        logger.info("Collection reset complete")
