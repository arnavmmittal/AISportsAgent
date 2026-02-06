"""
Script to query the sports psychology knowledge base.

Usage:
    python scripts/query_knowledge_base.py --query "How to handle pre-game anxiety?" --sport basketball
"""

import argparse
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.agents.knowledge_agent import KnowledgeAgent
from app.core.logging import setup_logging

logger = setup_logging()


def main():
    """Main query function."""
    parser = argparse.ArgumentParser(
        description="Query sports psychology knowledge base"
    )
    parser.add_argument(
        "--query",
        type=str,
        required=True,
        help="Search query"
    )
    parser.add_argument(
        "--sport",
        type=str,
        default=None,
        help="Filter by sport (e.g., basketball, football)"
    )
    parser.add_argument(
        "--framework",
        type=str,
        default=None,
        help="Filter by framework (e.g., cbt, mindfulness)"
    )
    parser.add_argument(
        "--phase",
        type=str,
        default=None,
        help="Filter by phase (e.g., pre-competition, in-competition)"
    )
    parser.add_argument(
        "--protocol",
        type=str,
        default=None,
        help="Filter by protocol step (e.g., explore, clarify)"
    )
    parser.add_argument(
        "--n",
        type=int,
        default=3,
        help="Number of results to return (default: 3)"
    )
    parser.add_argument(
        "--stats",
        action="store_true",
        help="Show collection statistics"
    )

    args = parser.parse_args()

    # Initialize Knowledge Agent
    logger.info("Initializing Knowledge Agent...")
    agent = KnowledgeAgent()

    # Show stats if requested
    if args.stats:
        stats = agent.get_collection_stats()
        print("\n" + "="*60)
        print("COLLECTION STATISTICS")
        print("="*60)
        print(f"Collection Name: {stats['collection_name']}")
        print(f"Total Chunks: {stats['total_chunks']}")
        print(f"Embedding Model: {stats['embedding_model']}")
        print("="*60 + "\n")

    # Query knowledge base
    logger.info(f"Querying: {args.query}")
    results = agent.query(
        query=args.query,
        n_results=args.n,
        sport=args.sport,
        framework=args.framework,
        phase=args.phase,
        protocol_step=args.protocol
    )

    # Print results
    print("\n" + "="*60)
    print(f"QUERY: {args.query}")
    if args.sport:
        print(f"Sport Filter: {args.sport}")
    if args.framework:
        print(f"Framework Filter: {args.framework}")
    if args.phase:
        print(f"Phase Filter: {args.phase}")
    if args.protocol:
        print(f"Protocol Filter: {args.protocol}")
    print("="*60)

    if not results:
        print("\nNo results found.")
    else:
        print(f"\nFound {len(results)} results:\n")

        for i, result in enumerate(results, 1):
            print(f"\n--- Result {i} ---")
            print(f"Distance: {result['distance']:.4f}" if result['distance'] else "Distance: N/A")
            print(f"Source: {result['metadata'].get('source', 'Unknown')}")
            print(f"Sports: {', '.join(result['metadata'].get('sports', []))}")
            print(f"Frameworks: {', '.join(result['metadata'].get('frameworks', []))}")
            print(f"Phases: {', '.join(result['metadata'].get('phases', []))}")
            print(f"Protocol Steps: {', '.join(result['metadata'].get('protocol_steps', []))}")
            print(f"\nContent:\n{result['content'][:300]}..." if len(result['content']) > 300 else f"\nContent:\n{result['content']}")

    print("\n" + "="*60 + "\n")

    # Test get_context_for_athlete if sport is provided
    if args.sport:
        print("\n" + "="*60)
        print("FORMATTED CONTEXT FOR ATHLETE")
        print("="*60)
        context = agent.get_context_for_athlete(
            query=args.query,
            athlete_sport=args.sport,
            max_chunks=args.n
        )
        print(context)
        print("="*60 + "\n")


if __name__ == "__main__":
    main()
