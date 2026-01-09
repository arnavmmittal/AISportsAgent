# Multi-stage build for AI Sports Agent MCP Server
# Optimized for production deployment with security best practices

# ============================================
# Builder Stage
# ============================================
FROM python:3.11-slim AS builder

# Install system dependencies needed for building Python packages
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements file
COPY services/mcp-server/requirements.txt .

# Install Python dependencies to user directory (no root needed)
RUN pip install --no-cache-dir --user -r requirements.txt

# ============================================
# Production Stage
# ============================================
FROM python:3.11-slim

# Install runtime dependencies only (smaller image)
RUN apt-get update && apt-get install -y \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy Python dependencies from builder stage
COPY --from=builder /root/.local /root/.local

# Ensure Python binaries are in PATH
ENV PATH=/root/.local/bin:$PATH

# Set working directory
WORKDIR /app

# Copy application code
COPY services/mcp-server/app ./app
COPY services/mcp-server/alembic ./alembic
COPY services/mcp-server/alembic.ini .

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run with Gunicorn for production (better than uvicorn alone)
# - 4 workers for parallelism
# - Uvicorn worker class for async support
# - 60 second timeout for long-running requests
# - Log to stdout/stderr for container logging
CMD ["gunicorn", "app.main:app", \
     "--workers", "4", \
     "--worker-class", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:8000", \
     "--timeout", "60", \
     "--access-logfile", "-", \
     "--error-logfile", "-", \
     "--log-level", "info"]
