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
from app.api.routes import chat, coach, voice, athlete, analytics, usage, predictions, knowledge, orchestrator
from app.middleware.cost_control import CostControlMiddleware

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

# Cost Control Middleware (Token tracking, rate limiting, budget enforcement)
app.add_middleware(CostControlMiddleware)


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
        "environment": settings.ENVIRONMENT
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
