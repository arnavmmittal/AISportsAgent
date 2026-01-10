"""
Vector Store with ChromaDB

Manages the knowledge base vector store for semantic search.
"""

import os
from typing import List, Dict, Any, Optional
from pathlib import Path
from app.core.config import settings
from app.core.logging import setup_logging

logger = setup_logging()

# Try to import ChromaDB
try:
    import chromadb
    from chromadb.config import Settings as ChromaSettings
    CHROMADB_AVAILABLE = True
except ImportError:
    CHROMADB_AVAILABLE = False
    logger.warning("ChromaDB not available. Knowledge base features disabled.")


class VectorStore:
    """
    ChromaDB vector store wrapper.

    Provides:
    - Persistent storage of document embeddings
    - Semantic similarity search
    - Metadata filtering
    - Collection management
    """

    def __init__(
        self,
        collection_name: Optional[str] = None,
        persist_directory: Optional[str] = None,
    ):
        """
        Initialize vector store.

        Args:
            collection_name: Name of the collection
            persist_directory: Directory for persistent storage
        """
        self.collection_name = collection_name or settings.CHROMA_COLLECTION_NAME
        self.persist_directory = persist_directory or settings.CHROMA_PERSIST_DIRECTORY

        self._client = None
        self._collection = None

        if CHROMADB_AVAILABLE:
            self._init_client()

    def _init_client(self):
        """Initialize ChromaDB client."""
        try:
            # Ensure persist directory exists
            Path(self.persist_directory).mkdir(parents=True, exist_ok=True)

            # Check if remote or local
            if settings.is_chroma_remote:
                self._client = chromadb.HttpClient(
                    host=settings.CHROMA_HOST,
                    port=settings.CHROMA_PORT,
                )
            else:
                self._client = chromadb.PersistentClient(
                    path=self.persist_directory,
                    settings=ChromaSettings(
                        anonymized_telemetry=False,
                    ),
                )

            logger.info(f"ChromaDB client initialized at {self.persist_directory}")

        except Exception as e:
            logger.error(f"Failed to initialize ChromaDB: {e}")
            self._client = None

    def _get_collection(self):
        """Get or create collection."""
        if self._collection is not None:
            return self._collection

        if self._client is None:
            raise RuntimeError("ChromaDB client not initialized")

        try:
            from .embeddings import OpenAIEmbeddings

            self._collection = self._client.get_or_create_collection(
                name=self.collection_name,
                embedding_function=OpenAIEmbeddings(),
                metadata={"hnsw:space": "cosine"},
            )

            logger.info(f"Using collection: {self.collection_name}")
            return self._collection

        except Exception as e:
            logger.error(f"Failed to get/create collection: {e}")
            raise

    def add_documents(
        self,
        documents: List[str],
        metadatas: Optional[List[Dict[str, Any]]] = None,
        ids: Optional[List[str]] = None,
    ) -> List[str]:
        """
        Add documents to the vector store.

        Args:
            documents: List of text documents
            metadatas: Optional metadata for each document
            ids: Optional IDs for each document

        Returns:
            List of document IDs
        """
        if not CHROMADB_AVAILABLE:
            raise RuntimeError("ChromaDB not available")

        collection = self._get_collection()

        # Generate IDs if not provided
        if ids is None:
            import uuid
            ids = [str(uuid.uuid4()) for _ in documents]

        # Ensure metadata is provided
        if metadatas is None:
            metadatas = [{}] * len(documents)

        try:
            collection.add(
                documents=documents,
                metadatas=metadatas,
                ids=ids,
            )

            logger.info(f"Added {len(documents)} documents to collection")
            return ids

        except Exception as e:
            logger.error(f"Failed to add documents: {e}")
            raise

    def similarity_search(
        self,
        query: str,
        n_results: int = 5,
        where: Optional[Dict[str, Any]] = None,
        where_document: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Search for similar documents.

        Args:
            query: Search query
            n_results: Number of results to return
            where: Metadata filter
            where_document: Document content filter

        Returns:
            List of results with document, metadata, and distance
        """
        if not CHROMADB_AVAILABLE:
            return []

        collection = self._get_collection()

        try:
            results = collection.query(
                query_texts=[query],
                n_results=n_results,
                where=where,
                where_document=where_document,
                include=["documents", "metadatas", "distances"],
            )

            # Format results
            formatted = []
            if results["documents"] and results["documents"][0]:
                for i, doc in enumerate(results["documents"][0]):
                    formatted.append({
                        "content": doc,
                        "metadata": results["metadatas"][0][i] if results["metadatas"] else {},
                        "distance": results["distances"][0][i] if results["distances"] else 0,
                        "id": results["ids"][0][i] if results["ids"] else None,
                    })

            return formatted

        except Exception as e:
            logger.error(f"Similarity search failed: {e}")
            return []

    def get_collection_stats(self) -> Dict[str, Any]:
        """Get collection statistics."""
        if not CHROMADB_AVAILABLE or self._client is None:
            return {"available": False}

        try:
            collection = self._get_collection()
            return {
                "available": True,
                "name": self.collection_name,
                "count": collection.count(),
                "persist_directory": self.persist_directory,
            }
        except Exception as e:
            return {"available": False, "error": str(e)}

    def delete_collection(self):
        """Delete the collection."""
        if self._client is None:
            return

        try:
            self._client.delete_collection(self.collection_name)
            self._collection = None
            logger.info(f"Deleted collection: {self.collection_name}")
        except Exception as e:
            logger.error(f"Failed to delete collection: {e}")

    def reset(self):
        """Reset the collection (delete all documents)."""
        self.delete_collection()
        self._collection = None


# Singleton instance
_vectorstore: Optional[VectorStore] = None


def get_vectorstore() -> VectorStore:
    """Get the global vector store instance."""
    global _vectorstore
    if _vectorstore is None:
        _vectorstore = VectorStore()
    return _vectorstore


def similarity_search(
    query: str,
    n_results: int = 5,
    where: Optional[Dict[str, Any]] = None,
) -> List[Dict[str, Any]]:
    """
    Search for similar documents in the knowledge base.

    Convenience function using global vector store.
    """
    store = get_vectorstore()
    return store.similarity_search(query, n_results, where)


def add_documents(
    documents: List[str],
    metadatas: Optional[List[Dict[str, Any]]] = None,
) -> List[str]:
    """
    Add documents to the knowledge base.

    Convenience function using global vector store.
    """
    store = get_vectorstore()
    return store.add_documents(documents, metadatas)
