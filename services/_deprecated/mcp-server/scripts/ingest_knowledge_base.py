"""
Script to ingest the sports psychology PDF into the knowledge base.

Usage:
    python scripts/ingest_knowledge_base.py --pdf /path/to/pdf --source "Source Name" --category ANXIETY
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
    """Main ingestion function."""
    parser = argparse.ArgumentParser(
        description="Ingest PDF into sports psychology knowledge base"
    )
    parser.add_argument(
        "--pdf",
        type=str,
        required=True,
        help="Path to PDF file"
    )
    parser.add_argument(
        "--source",
        type=str,
        default=None,
        help="Source identifier (defaults to filename)"
    )
    parser.add_argument(
        "--category",
        type=str,
        default=None,
        help="Knowledge category (e.g., ANXIETY, CONFIDENCE, FOCUS)"
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Reset collection before ingesting (deletes all existing data)"
    )

    args = parser.parse_args()

    # Validate PDF path
    pdf_path = Path(args.pdf)
    if not pdf_path.exists():
        logger.error(f"PDF file not found: {args.pdf}")
        sys.exit(1)

    # Initialize Knowledge Agent
    logger.info("Initializing Knowledge Agent...")
    agent = KnowledgeAgent()

    # Reset collection if requested
    if args.reset:
        logger.warning("Resetting knowledge base collection...")
        agent.reset_collection()

    # Get initial stats
    initial_stats = agent.get_collection_stats()
    logger.info(f"Initial collection stats: {initial_stats}")

    # Ingest PDF
    logger.info(f"Starting ingestion of {args.pdf}...")
    result = agent.ingest_pdf(
        pdf_path=str(pdf_path),
        source=args.source,
        category=args.category
    )

    # Get final stats
    final_stats = agent.get_collection_stats()

    # Print results
    print("\n" + "="*60)
    print("INGESTION COMPLETE")
    print("="*60)
    print(f"PDF: {result['pdf_path']}")
    print(f"Source: {result['source']}")
    print(f"Chunks Ingested: {result['chunks_ingested']}")
    print(f"Total Chunks in Collection: {final_stats['total_chunks']}")
    print("="*60 + "\n")

    logger.info("Ingestion complete")


if __name__ == "__main__":
    main()
