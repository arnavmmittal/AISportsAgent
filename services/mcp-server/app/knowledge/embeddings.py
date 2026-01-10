"""
Embedding Generation for Knowledge Base

Generates embeddings using OpenAI's text-embedding-3-large model.
"""

import asyncio
from typing import List, Optional
from openai import AsyncOpenAI
from app.core.config import settings
from app.core.logging import setup_logging

logger = setup_logging()

# OpenAI client singleton
_client: Optional[AsyncOpenAI] = None


def get_client() -> AsyncOpenAI:
    """Get or create OpenAI client."""
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    return _client


async def get_embedding(
    text: str,
    model: Optional[str] = None,
) -> List[float]:
    """
    Get embedding for a single text.

    Args:
        text: Text to embed
        model: Embedding model (default: text-embedding-3-large)

    Returns:
        List of floats representing the embedding vector
    """
    client = get_client()
    model = model or settings.OPENAI_EMBEDDING_MODEL

    try:
        # Clean text
        text = text.replace("\n", " ").strip()
        if not text:
            raise ValueError("Empty text cannot be embedded")

        response = await client.embeddings.create(
            model=model,
            input=text,
        )

        return response.data[0].embedding

    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        raise


async def get_embeddings_batch(
    texts: List[str],
    model: Optional[str] = None,
    batch_size: int = 100,
) -> List[List[float]]:
    """
    Get embeddings for multiple texts.

    Args:
        texts: List of texts to embed
        model: Embedding model
        batch_size: Max texts per API call

    Returns:
        List of embedding vectors
    """
    client = get_client()
    model = model or settings.OPENAI_EMBEDDING_MODEL

    # Clean texts
    cleaned_texts = [t.replace("\n", " ").strip() for t in texts]
    cleaned_texts = [t if t else " " for t in cleaned_texts]  # Replace empty with space

    all_embeddings = []

    try:
        # Process in batches
        for i in range(0, len(cleaned_texts), batch_size):
            batch = cleaned_texts[i:i + batch_size]

            response = await client.embeddings.create(
                model=model,
                input=batch,
            )

            # Ensure embeddings are in correct order
            batch_embeddings = [None] * len(batch)
            for item in response.data:
                batch_embeddings[item.index] = item.embedding

            all_embeddings.extend(batch_embeddings)

            # Rate limiting
            if i + batch_size < len(cleaned_texts):
                await asyncio.sleep(0.1)

        return all_embeddings

    except Exception as e:
        logger.error(f"Batch embedding generation failed: {e}")
        raise


def get_embedding_sync(
    text: str,
    model: Optional[str] = None,
) -> List[float]:
    """
    Synchronous wrapper for get_embedding.

    For use in non-async contexts (e.g., ChromaDB custom embedding function).
    """
    return asyncio.run(get_embedding(text, model))


class OpenAIEmbeddings:
    """
    Embedding function compatible with ChromaDB.

    Implements the ChromaDB EmbeddingFunction protocol.
    """

    def __init__(self, model: Optional[str] = None):
        self.model = model or settings.OPENAI_EMBEDDING_MODEL

    def __call__(self, input: List[str]) -> List[List[float]]:
        """Generate embeddings for a list of texts."""
        return asyncio.run(get_embeddings_batch(input, self.model))
