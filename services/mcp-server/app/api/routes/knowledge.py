"""
Knowledge Base API Routes

Endpoints for querying and managing the sports psychology knowledge base.
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from app.core.logging import setup_logging

logger = setup_logging()
router = APIRouter()


class QueryRequest(BaseModel):
    """Request for knowledge base query."""
    query: str
    top_k: int = 3
    filter_framework: Optional[str] = None
    filter_sport: Optional[str] = None
    use_reranking: bool = True


class AddDocumentRequest(BaseModel):
    """Request to add documents."""
    documents: List[str]
    metadatas: Optional[List[Dict[str, Any]]] = None


@router.post("/knowledge/query")
async def query_knowledge_base(request: QueryRequest):
    """
    Query the knowledge base for relevant information.

    Returns semantically similar documents with reranking.
    """
    try:
        from app.knowledge import retrieve_context, retrieve_with_rerank

        # Build metadata filter
        filter_metadata = {}
        if request.filter_framework:
            filter_metadata["framework"] = request.filter_framework
        if request.filter_sport:
            filter_metadata["sport"] = request.filter_sport

        if request.use_reranking:
            result = await retrieve_with_rerank(
                query=request.query,
                top_k=request.top_k,
            )
        else:
            result = await retrieve_context(
                query=request.query,
                top_k=request.top_k,
                filter_metadata=filter_metadata if filter_metadata else None,
            )

        return result

    except Exception as e:
        logger.error(f"Knowledge query error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/knowledge/add")
async def add_documents(request: AddDocumentRequest):
    """
    Add documents to the knowledge base.

    Documents will be embedded and stored in the vector database.
    """
    try:
        from app.knowledge import add_documents

        ids = add_documents(
            documents=request.documents,
            metadatas=request.metadatas,
        )

        return {
            "success": True,
            "documents_added": len(ids),
            "ids": ids,
        }

    except Exception as e:
        logger.error(f"Add documents error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/knowledge/status")
async def knowledge_base_status():
    """Get knowledge base status and statistics."""
    try:
        from app.knowledge import get_vectorstore

        store = get_vectorstore()
        stats = store.get_collection_stats()

        return {
            "status": "operational" if stats.get("available") else "unavailable",
            "collection": stats,
        }

    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
        }


@router.post("/knowledge/rewrite")
async def rewrite_query(query: str):
    """
    Test query rewriting for debugging.

    Shows how a query would be rewritten and expanded.
    """
    try:
        from app.knowledge import QueryRewriter

        rewriter = QueryRewriter()
        result = await rewriter.hybrid_rewrite(query, expand=True, decompose=True)

        return result

    except Exception as e:
        logger.error(f"Query rewrite error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/knowledge/frameworks")
async def list_frameworks():
    """
    List available sports psychology frameworks in the knowledge base.

    These can be used as filters when querying.
    """
    return {
        "frameworks": [
            {
                "id": "cbt",
                "name": "Cognitive Behavioral Therapy",
                "description": "Restructuring negative thought patterns",
            },
            {
                "id": "mindfulness",
                "name": "Mindfulness & Present Moment",
                "description": "Awareness practices for focus and calm",
            },
            {
                "id": "visualization",
                "name": "Visualization & Imagery",
                "description": "Mental rehearsal techniques",
            },
            {
                "id": "self_talk",
                "name": "Self-Talk & Affirmations",
                "description": "Positive internal dialogue",
            },
            {
                "id": "goal_setting",
                "name": "Goal Setting",
                "description": "SMART goals and process focus",
            },
            {
                "id": "arousal_regulation",
                "name": "Arousal Regulation",
                "description": "Managing energy and activation levels",
            },
            {
                "id": "pre_performance",
                "name": "Pre-Performance Routines",
                "description": "Consistent preparation rituals",
            },
            {
                "id": "recovery",
                "name": "Recovery & Rest",
                "description": "Mental and physical recovery strategies",
            },
        ],
    }
