"""
Test knowledge base query to verify RAG is working.
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

import chromadb
from chromadb.config import Settings as ChromaSettings
from openai import OpenAI
from app.core.config import settings


def test_query(query: str, n_results: int = 3):
    """Test a query against the knowledge base."""
    print(f"\n{'='*60}")
    print(f"QUERY: {query}")
    print('='*60)

    # Initialize clients
    openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
    chroma_client = chromadb.PersistentClient(
        path=settings.CHROMA_PERSIST_DIRECTORY,
        settings=ChromaSettings(
            anonymized_telemetry=False,
            allow_reset=True
        )
    )

    # Get collection
    collection = chroma_client.get_collection(name=settings.CHROMA_COLLECTION_NAME)
    print(f"\nCollection: {settings.CHROMA_COLLECTION_NAME}")
    print(f"Total chunks: {collection.count()}")

    # Generate query embedding
    response = openai_client.embeddings.create(
        model=settings.OPENAI_EMBEDDING_MODEL,
        input=query
    )
    query_embedding = response.data[0].embedding

    # Query ChromaDB
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results
    )

    # Display results
    print(f"\nTop {n_results} Results:")
    print("-" * 40)

    for i in range(len(results["documents"][0])):
        doc = results["documents"][0][i]
        metadata = results["metadatas"][0][i]
        distance = results["distances"][0][i]

        print(f"\n[Result {i+1}] Distance: {distance:.4f}")
        print(f"Source: {metadata.get('source', 'Unknown')}")
        print(f"Sports: {metadata.get('sports', '')}")
        print(f"Frameworks: {metadata.get('frameworks', '')}")
        print(f"Content preview: {doc[:300]}...")

    return results


if __name__ == "__main__":
    # Test queries
    queries = [
        "How do I handle pre-game anxiety as a basketball player?",
        "What is the PETTLEP visualization technique?",
        "How can I build confidence before competition?"
    ]

    for query in queries:
        test_query(query)
