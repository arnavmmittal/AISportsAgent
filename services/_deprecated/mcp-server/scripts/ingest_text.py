"""
Script to ingest text/markdown files into the sports psychology knowledge base.

Usage:
    python scripts/ingest_text.py --file /path/to/file.txt --source "Source Name" --category ANXIETY
    python scripts/ingest_text.py --file /path/to/file.md --source "UW Sports Psych KB"
"""

import argparse
import sys
import uuid
from pathlib import Path
from typing import List, Dict, Any

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.config import settings
from app.core.logging import setup_logging

logger = setup_logging()


class TextProcessor:
    """Process text files for knowledge base ingestion."""

    # Sports keywords for auto-tagging
    SPORTS = [
        "football", "basketball", "soccer", "baseball", "softball",
        "swimming", "track", "field", "volleyball", "tennis",
        "golf", "wrestling", "lacrosse", "hockey", "cross country",
        "rowing", "gymnastics", "diving", "water polo", "rugby"
    ]

    # Framework keywords for auto-tagging
    FRAMEWORKS = [
        "cbt", "cognitive behavioral therapy", "mindfulness", "meditation",
        "goal setting", "smart goals", "visualization", "imagery",
        "self-talk", "positive self-talk", "breathing", "relaxation",
        "flow state", "peak performance", "growth mindset", "pettlep",
        "atomic habits", "brian tracy", "zinsser", "performance psychology"
    ]

    # Phase keywords for auto-tagging
    PHASES = {
        "pre-competition": ["pre-game", "pregame", "before competition", "preparation", "warm-up", "pre-performance"],
        "in-competition": ["during game", "in-game", "competition", "performance", "game time", "mid-performance"],
        "post-competition": ["post-game", "postgame", "after competition", "recovery", "debrief", "post-performance"],
        "training": ["practice", "training", "preparation", "skill development", "rehearsal"]
    }

    # Discovery-First protocol steps
    PROTOCOL_STEPS = {
        "explore": ["explore", "discovery", "assessment", "understand", "check-in"],
        "clarify": ["clarify", "define", "identify", "specify", "formulation"],
        "collaborate": ["collaborate", "partnership", "together", "co-create", "intervention"],
        "experiment": ["experiment", "try", "practice", "apply", "action"],
        "iterate": ["iterate", "adjust", "refine", "reflect", "feedback", "follow-up"]
    }

    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        """Initialize text processor."""
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

        try:
            import tiktoken
            from langchain_text_splitters import RecursiveCharacterTextSplitter
            self.encoding = tiktoken.encoding_for_model("gpt-4")
            self.text_splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
                model_name="gpt-4",
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
                separators=["\n\n\n", "\n\n", "\n", ". ", " ", ""]
            )
        except ImportError:
            # Fallback to simple character-based splitting
            self.encoding = None
            self.text_splitter = None
            logger.warning("tiktoken/langchain not available, using simple chunking")

    def chunk_text(self, text: str) -> List[str]:
        """Chunk text into smaller pieces."""
        if self.text_splitter:
            chunks = self.text_splitter.split_text(text)
        else:
            # Simple fallback chunking
            chunks = []
            words = text.split()
            current_chunk = []
            current_length = 0

            for word in words:
                current_chunk.append(word)
                current_length += len(word) + 1

                if current_length >= self.chunk_size * 4:  # Approximate chars
                    chunks.append(" ".join(current_chunk))
                    # Keep overlap
                    overlap_words = current_chunk[-50:]
                    current_chunk = overlap_words
                    current_length = sum(len(w) + 1 for w in current_chunk)

            if current_chunk:
                chunks.append(" ".join(current_chunk))

        logger.info(f"Split text into {len(chunks)} chunks")
        return chunks

    def extract_metadata(self, chunk: str) -> Dict[str, Any]:
        """Extract metadata from chunk content via keyword matching."""
        chunk_lower = chunk.lower()
        metadata = {
            "sports": [],
            "frameworks": [],
            "phases": [],
            "protocol_steps": [],
            "tags": []
        }

        # Detect sports
        for sport in self.SPORTS:
            if sport in chunk_lower:
                metadata["sports"].append(sport)
                metadata["tags"].append(sport)

        # Detect frameworks
        for framework in self.FRAMEWORKS:
            if framework in chunk_lower:
                metadata["frameworks"].append(framework)
                metadata["tags"].append(framework)

        # Detect phases
        for phase, keywords in self.PHASES.items():
            if any(keyword in chunk_lower for keyword in keywords):
                metadata["phases"].append(phase)
                metadata["tags"].append(phase)

        # Detect protocol steps
        for step, keywords in self.PROTOCOL_STEPS.items():
            if any(keyword in chunk_lower for keyword in keywords):
                metadata["protocol_steps"].append(step)
                metadata["tags"].append(step)

        # If no specific sport detected, mark as general
        if not metadata["sports"]:
            metadata["sports"].append("general")
            metadata["tags"].append("general")

        return metadata

    def process_text(self, text: str, source: str) -> List[Dict[str, Any]]:
        """Process text into chunks with metadata."""
        chunks = self.chunk_text(text)

        processed_chunks = []
        for i, chunk in enumerate(chunks):
            metadata = self.extract_metadata(chunk)
            metadata["source"] = source
            metadata["chunk_index"] = i
            metadata["total_chunks"] = len(chunks)

            processed_chunks.append({
                "content": chunk,
                "metadata": metadata
            })

        logger.info(f"Processed {len(processed_chunks)} chunks")
        return processed_chunks


def main():
    """Main ingestion function."""
    parser = argparse.ArgumentParser(
        description="Ingest text/markdown file into sports psychology knowledge base"
    )
    parser.add_argument(
        "--file",
        type=str,
        required=True,
        help="Path to text or markdown file"
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
        default="MENTAL_PERFORMANCE",
        help="Knowledge category (e.g., ANXIETY, CONFIDENCE, FOCUS, MENTAL_PERFORMANCE)"
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Reset collection before ingesting (deletes all existing data)"
    )
    parser.add_argument(
        "--chunk-size",
        type=int,
        default=1000,
        help="Chunk size in tokens (default: 1000)"
    )
    parser.add_argument(
        "--chunk-overlap",
        type=int,
        default=200,
        help="Chunk overlap in tokens (default: 200)"
    )

    args = parser.parse_args()

    # Validate file path
    file_path = Path(args.file)
    if not file_path.exists():
        logger.error(f"File not found: {args.file}")
        sys.exit(1)

    # Read file content
    logger.info(f"Reading file: {args.file}")
    with open(file_path, "r", encoding="utf-8") as f:
        text = f.read()

    logger.info(f"Read {len(text)} characters from {file_path.name}")

    # Initialize text processor
    processor = TextProcessor(
        chunk_size=args.chunk_size,
        chunk_overlap=args.chunk_overlap
    )

    # Process text into chunks
    source = args.source or file_path.stem
    chunks = processor.process_text(text, source)

    # Try to use KnowledgeAgent for ChromaDB storage
    try:
        import chromadb
        from chromadb.config import Settings as ChromaSettings
        from openai import OpenAI

        logger.info("Initializing ChromaDB and OpenAI...")

        # Initialize OpenAI client
        openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)

        # Initialize ChromaDB client
        if settings.CHROMA_HOST:
            chroma_client = chromadb.HttpClient(
                host=settings.CHROMA_HOST,
                port=settings.CHROMA_PORT
            )
        else:
            chroma_client = chromadb.PersistentClient(
                path=settings.CHROMA_PERSIST_DIRECTORY,
                settings=ChromaSettings(
                    anonymized_telemetry=False,
                    allow_reset=True
                )
            )

        # Reset collection if requested
        if args.reset:
            logger.warning(f"Resetting collection: {settings.CHROMA_COLLECTION_NAME}")
            try:
                chroma_client.delete_collection(settings.CHROMA_COLLECTION_NAME)
            except Exception:
                pass  # Collection might not exist

        # Get or create collection
        collection = chroma_client.get_or_create_collection(
            name=settings.CHROMA_COLLECTION_NAME,
            metadata={"description": "Sports psychology knowledge base"}
        )

        # Get initial stats
        initial_count = collection.count()
        logger.info(f"Initial collection count: {initial_count}")

        # Prepare data for ChromaDB
        ids = []
        documents = []
        embeddings = []
        metadatas = []

        logger.info("Generating embeddings and preparing chunks...")
        for i, chunk in enumerate(chunks):
            # Generate unique ID
            chunk_id = str(uuid.uuid4())
            ids.append(chunk_id)

            # Get content
            documents.append(chunk["content"])

            # Generate embedding
            response = openai_client.embeddings.create(
                model=settings.OPENAI_EMBEDDING_MODEL,
                input=chunk["content"]
            )
            embedding = response.data[0].embedding
            embeddings.append(embedding)

            # Prepare metadata (ChromaDB requires flat dict with string/int/float values)
            metadata = {
                "source": chunk["metadata"]["source"],
                "chunk_index": chunk["metadata"]["chunk_index"],
                "total_chunks": chunk["metadata"]["total_chunks"],
                "sports": ",".join(chunk["metadata"]["sports"]),
                "frameworks": ",".join(chunk["metadata"]["frameworks"]),
                "phases": ",".join(chunk["metadata"]["phases"]),
                "protocol_steps": ",".join(chunk["metadata"]["protocol_steps"]),
                "tags": ",".join(chunk["metadata"]["tags"]),
                "category": args.category
            }
            metadatas.append(metadata)

            if (i + 1) % 10 == 0:
                logger.info(f"Processed {i + 1}/{len(chunks)} chunks...")

        # Add to ChromaDB collection
        logger.info("Adding to ChromaDB...")
        collection.add(
            ids=ids,
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas
        )

        # Get final stats
        final_count = collection.count()

        # Print results
        print("\n" + "=" * 60)
        print("INGESTION COMPLETE")
        print("=" * 60)
        print(f"File: {args.file}")
        print(f"Source: {source}")
        print(f"Category: {args.category}")
        print(f"Chunks Ingested: {len(chunks)}")
        print(f"Total Chunks in Collection: {final_count}")
        print("=" * 60 + "\n")

        # Print sample metadata
        print("Sample chunk metadata (first chunk):")
        if metadatas:
            for key, value in metadatas[0].items():
                print(f"  {key}: {value}")

    except ImportError as e:
        logger.error(f"Missing dependency for vector storage: {e}")
        logger.info("Chunks processed but not stored. Install chromadb and openai for full functionality.")

        # Print results anyway
        print("\n" + "=" * 60)
        print("TEXT PROCESSING COMPLETE (no storage)")
        print("=" * 60)
        print(f"File: {args.file}")
        print(f"Source: {source}")
        print(f"Chunks Processed: {len(chunks)}")
        print("=" * 60 + "\n")

        # Print sample
        print("Sample chunks:")
        for i, chunk in enumerate(chunks[:3]):
            print(f"\n--- Chunk {i+1} ---")
            print(f"Content preview: {chunk['content'][:200]}...")
            print(f"Sports: {chunk['metadata']['sports']}")
            print(f"Frameworks: {chunk['metadata']['frameworks']}")


if __name__ == "__main__":
    main()
