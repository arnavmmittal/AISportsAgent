"""
AI Sports Agent - FastAPI Backend
Main application entry point with MCP agent orchestration
"""

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
from loguru import logger

from app.core.config import settings
from app.core.logging import setup_logging
from app.db.database import engine, Base
from app.api import chat, knowledge, reports, auth, experiments

# Import agents for initialization
from app.agents.athlete_agent import AthleteAgent
from app.agents.coach_agent import CoachAgent
from app.agents.governance_agent import GovernanceAgent
from app.agents.knowledge_agent import KnowledgeAgent


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager
    Handles startup and shutdown events
    """
    # Startup
    logger.info("=€ Starting AI Sports Agent API")

    # Initialize database
    logger.info("Initializing database...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Initialize MCP Agents
    logger.info("Initializing MCP Agents...")
    app.state.athlete_agent = AthleteAgent()
    app.state.coach_agent = CoachAgent()
    app.state.governance_agent = GovernanceAgent()
    app.state.knowledge_agent = KnowledgeAgent()

    logger.info(" All agents initialized")

    yield

    # Shutdown
    logger.info("=Ñ Shutting down AI Sports Agent API")
    await engine.dispose()


# Initialize FastAPI app
app = FastAPI(
    title="AI Sports Agent API",
    description="MCP-based sports psychology platform for collegiate athletes",
    version=settings.API_VERSION,
    lifespan=lifespan,
    docs_url=f"/{settings.API_VERSION}/docs",
    redoc_url=f"/{settings.API_VERSION}/redoc",
)

# Setup logging
setup_logging()

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Trusted Host Middleware (security)
if not settings.DEBUG:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.ALLOWED_HOSTS
    )


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Internal server error",
            "error": str(exc) if settings.DEBUG else "An error occurred"
        }
    )


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "version": settings.API_VERSION,
        "environment": settings.ENVIRONMENT
    }


# API Routes
app.include_router(
    auth.router,
    prefix=f"/{settings.API_VERSION}/auth",
    tags=["Authentication"]
)

app.include_router(
    chat.router,
    prefix=f"/{settings.API_VERSION}/chat",
    tags=["Chat & MCP Agents"]
)

app.include_router(
    knowledge.router,
    prefix=f"/{settings.API_VERSION}/kb",
    tags=["Knowledge Base"]
)

app.include_router(
    reports.router,
    prefix=f"/{settings.API_VERSION}/report",
    tags=["Coach Reports"]
)

app.include_router(
    experiments.router,
    prefix=f"/{settings.API_VERSION}/experiments",
    tags=["Experiments & Logs"]
)


# Root endpoint
@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "message": "AI Sports Agent API",
        "version": settings.API_VERSION,
        "docs": f"/{settings.API_VERSION}/docs",
        "health": "/health"
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )
