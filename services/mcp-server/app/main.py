"""
AI Sports Agent - FastAPI Backend
Main application entry point
"""

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.logging import setup_logging
from app.api.routes import chat, coach, voice, athlete, analytics, usage
from app.middleware.cost_control import CostControlMiddleware
from app.middleware.security import SecurityMiddleware, RateLimitMiddleware

# Optional imports for full deployment (require ML dependencies)
try:
    from app.api.routes import predictions, knowledge, orchestrator
    FULL_DEPLOYMENT = True
except ImportError:
    FULL_DEPLOYMENT = False
    predictions = None
    knowledge = None
    orchestrator = None

logger = setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager
    Handles startup and shutdown events
    """
    # Startup
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Debug mode: {settings.DEBUG}")

    yield

    # Shutdown
    logger.info(f"Shutting down {settings.APP_NAME}")


# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered sports psychology platform for collegiate athletes",
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Setup logging
setup_logging()

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security Middleware Stack (order matters - first added = last executed)
# 1. Cost Control (innermost - runs closest to route handlers)
app.add_middleware(CostControlMiddleware)

# 2-3. Security middleware (always enabled - no ML deps required)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(SecurityMiddleware)


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
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "mode": "full" if FULL_DEPLOYMENT else "minimal",
        "features": {
            "chat": True,
            "voice": True,
            "coach": True,
            "security": True,
            "rate_limiting": True,
            "predictions": FULL_DEPLOYMENT,
            "knowledge": FULL_DEPLOYMENT,
            "orchestrator": FULL_DEPLOYMENT,
        }
    }


# API Routes
app.include_router(
    chat.router,
    prefix="/api",
    tags=["Chat & Athlete Agent"]
)

app.include_router(
    coach.router,
    prefix="/api",
    tags=["Coach Analytics"]
)

app.include_router(
    voice.router,
    prefix="/api",
    tags=["Voice & Speech"]
)

app.include_router(
    athlete.router,
    prefix="/api",
    tags=["Athlete Dashboard"]
)

app.include_router(
    analytics.router,
    tags=["Performance Analytics"]
)

app.include_router(
    usage.router,
    prefix="/api",
    tags=["Usage & Billing"]
)

# ML/AI routes (only in full deployment)
if FULL_DEPLOYMENT:
    app.include_router(
        predictions.router,
        prefix="/api",
        tags=["ML Predictions"]
    )

    app.include_router(
        knowledge.router,
        prefix="/api",
        tags=["Knowledge Base"]
    )

    app.include_router(
        orchestrator.router,
        prefix="/api",
        tags=["Agent Orchestrator"]
    )


# Root endpoint
@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
        "health": "/health"
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.RELOAD,
        log_level=settings.LOG_LEVEL.lower()
    )
