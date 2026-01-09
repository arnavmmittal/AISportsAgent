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

# Expose port (Railway will set PORT dynamically)
EXPOSE 8000

# Run with Python directly (Pydantic reads PORT from env)
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
