"""
Quick script to check knowledge base statistics.

Usage:
    python scripts/check_kb_stats.py
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.agents.knowledge_agent import KnowledgeAgent
from app.core.logging import setup_logging

logger = setup_logging()


def main():
    """Check knowledge base stats."""
    try:
        logger.info("Initializing Knowledge Agent...")
        agent = KnowledgeAgent()

        stats = agent.get_collection_stats()

        print("\n" + "="*60)
        print("KNOWLEDGE BASE STATISTICS")
        print("="*60)
        print(f"Total Chunks: {stats['total_chunks']}")
        print(f"Collection: {stats.get('collection_name', 'sports_psychology')}")
        print("="*60)

        # Target check
        target = 300
        if stats['total_chunks'] < target:
            print(f"\n⚠️  Need {target - stats['total_chunks']} more chunks to reach target ({target})")
            print(f"   Current: {stats['total_chunks']} | Target: {target}")
        else:
            print(f"\n✅ Target reached! ({stats['total_chunks']}/{target} chunks)")

        print("\n")

    except Exception as e:
        logger.error(f"Error checking stats: {e}")
        print(f"\n❌ Error: {e}\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
