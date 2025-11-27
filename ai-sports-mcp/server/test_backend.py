"""
Quick backend test script - tests the knowledge base without needing database
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.agents.knowledge_agent import KnowledgeAgent
from app.core.logging import setup_logging

logger = setup_logging()


def test_knowledge_base():
    """Test the knowledge base retrieval."""
    print("\n" + "="*60)
    print("TESTING KNOWLEDGE BASE")
    print("="*60 + "\n")

    try:
        # Initialize Knowledge Agent
        print("Initializing Knowledge Agent...")
        agent = KnowledgeAgent()

        # Get stats
        stats = agent.get_collection_stats()
        print(f"\n✅ Knowledge Base Stats:")
        print(f"   - Collection: {stats['collection_name']}")
        print(f"   - Total Chunks: {stats['total_chunks']}")
        print(f"   - Embedding Model: {stats['embedding_model']}")

        if stats['total_chunks'] == 0:
            print("\n⚠️  Knowledge base is empty!")
            print("   Run: python scripts/ingest_knowledge_base.py --pdf /path/to/pdf.pdf")
            return

        # Test query
        print("\n" + "="*60)
        print("TESTING QUERY: 'How to handle pre-game anxiety?'")
        print("="*60 + "\n")

        results = agent.query(
            query="How to handle pre-game anxiety?",
            sport="basketball",
            n_results=2
        )

        print(f"✅ Found {len(results)} relevant chunks:\n")

        for i, result in enumerate(results, 1):
            print(f"--- Result {i} ---")
            print(f"Distance: {result['distance']:.4f}")
            print(f"Sports: {', '.join(result['metadata'].get('sports', []))}")
            print(f"Frameworks: {', '.join(result['metadata'].get('frameworks', []))}")
            print(f"Content Preview: {result['content'][:200]}...")
            print()

        print("="*60)
        print("✅ BACKEND TEST SUCCESSFUL!")
        print("="*60)
        print("\nNext steps:")
        print("1. Start the backend: python -m app.main")
        print("2. Visit http://localhost:8000/docs")
        print("3. Test the API endpoints")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    test_knowledge_base()
