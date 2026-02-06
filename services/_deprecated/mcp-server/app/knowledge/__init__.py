"""
Knowledge Base RAG Module

Retrieval-Augmented Generation for sports psychology knowledge base.

Components:
1. VectorStore - ChromaDB integration for vector storage
2. Embeddings - OpenAI embedding generation
3. QueryRewriter - Query expansion and reformulation
4. Reranker - Cross-encoder reranking for precision
5. Ingestion - Document processing and chunking

The knowledge base contains:
- Sports psychology research papers
- Mental performance frameworks (CBT, mindfulness, visualization)
- Sport-specific interventions
- Crisis protocols
"""

from .vectorstore import (
    VectorStore,
    get_vectorstore,
    similarity_search,
    add_documents,
)

from .embeddings import (
    get_embedding,
    get_embeddings_batch,
)

from .query_rewriter import (
    QueryRewriter,
    rewrite_query,
    expand_query,
)

from .retriever import (
    KnowledgeRetriever,
    retrieve_context,
    retrieve_with_rerank,
)

__all__ = [
    # Vector store
    "VectorStore",
    "get_vectorstore",
    "similarity_search",
    "add_documents",
    # Embeddings
    "get_embedding",
    "get_embeddings_batch",
    # Query rewriting
    "QueryRewriter",
    "rewrite_query",
    "expand_query",
    # Retrieval
    "KnowledgeRetriever",
    "retrieve_context",
    "retrieve_with_rerank",
]
