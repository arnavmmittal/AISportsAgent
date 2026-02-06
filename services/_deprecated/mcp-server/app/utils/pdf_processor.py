"""
PDF processing utilities for knowledge base ingestion.

Handles PDF extraction, chunking, and metadata extraction for the
sports psychology knowledge base.
"""

import re
from typing import List, Dict, Any
from pathlib import Path

from langchain_text_splitters import RecursiveCharacterTextSplitter
from pypdf import PdfReader
import tiktoken

from app.core.logging import setup_logging

logger = setup_logging()


class PDFProcessor:
    """Process PDF files for knowledge base ingestion."""

    # Sports keywords for auto-tagging
    SPORTS = [
        "football", "basketball", "soccer", "baseball", "softball",
        "swimming", "track", "field", "volleyball", "tennis",
        "golf", "wrestling", "lacrosse", "hockey", "cross country"
    ]

    # Framework keywords for auto-tagging
    FRAMEWORKS = [
        "cbt", "cognitive behavioral therapy", "mindfulness", "meditation",
        "goal setting", "smart goals", "visualization", "imagery",
        "self-talk", "positive self-talk", "breathing", "relaxation",
        "flow state", "peak performance", "growth mindset"
    ]

    # Phase keywords for auto-tagging
    PHASES = {
        "pre-competition": ["pre-game", "pregame", "before competition", "preparation", "warm-up"],
        "in-competition": ["during game", "in-game", "competition", "performance", "game time"],
        "post-competition": ["post-game", "postgame", "after competition", "recovery", "debrief"],
        "training": ["practice", "training", "preparation", "skill development"]
    }

    # Discovery-First protocol steps
    PROTOCOL_STEPS = {
        "explore": ["explore", "discovery", "assessment", "understand"],
        "clarify": ["clarify", "define", "identify", "specify"],
        "collaborate": ["collaborate", "partnership", "together", "co-create"],
        "experiment": ["experiment", "try", "practice", "apply"],
        "iterate": ["iterate", "adjust", "refine", "reflect", "feedback"]
    }

    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        """
        Initialize PDF processor.

        Args:
            chunk_size: Target chunk size in tokens
            chunk_overlap: Overlap between chunks in tokens
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.encoding = tiktoken.encoding_for_model("gpt-4")

        # Initialize text splitter
        self.text_splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
            model_name="gpt-4",
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""]
        )

    def extract_text(self, pdf_path: str) -> str:
        """
        Extract text from PDF file.

        Args:
            pdf_path: Path to PDF file

        Returns:
            Extracted text content
        """
        logger.info(f"Extracting text from PDF: {pdf_path}")

        reader = PdfReader(pdf_path)
        text_parts = []

        for page_num, page in enumerate(reader.pages, 1):
            text = page.extract_text()
            if text:
                text_parts.append(text)

        full_text = "\n\n".join(text_parts)
        logger.info(f"Extracted {len(full_text)} characters from {len(reader.pages)} pages")

        return full_text

    def chunk_text(self, text: str) -> List[str]:
        """
        Chunk text into smaller pieces.

        Args:
            text: Full text to chunk

        Returns:
            List of text chunks
        """
        chunks = self.text_splitter.split_text(text)
        logger.info(f"Split text into {len(chunks)} chunks")
        return chunks

    def extract_metadata(self, chunk: str) -> Dict[str, Any]:
        """
        Extract metadata from chunk content.

        Auto-tags chunks with sport, framework, phase, and protocol step
        based on keyword matching.

        Args:
            chunk: Text chunk to analyze

        Returns:
            Metadata dictionary with tags
        """
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

    def process_pdf(self, pdf_path: str, source: str = None) -> List[Dict[str, Any]]:
        """
        Process PDF file into chunks with metadata.

        Args:
            pdf_path: Path to PDF file
            source: Source identifier (defaults to filename)

        Returns:
            List of dictionaries with 'content' and 'metadata' keys
        """
        # Extract text
        text = self.extract_text(pdf_path)

        # Chunk text
        chunks = self.chunk_text(text)

        # Prepare source
        if source is None:
            source = Path(pdf_path).stem

        # Process each chunk
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

        logger.info(f"Processed {len(processed_chunks)} chunks from {pdf_path}")
        return processed_chunks


def count_tokens(text: str) -> int:
    """
    Count tokens in text using GPT-4 tokenizer.

    Args:
        text: Text to count tokens for

    Returns:
        Number of tokens
    """
    encoding = tiktoken.encoding_for_model("gpt-4")
    return len(encoding.encode(text))
