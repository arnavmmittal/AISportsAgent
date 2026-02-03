#!/bin/bash
# Development startup script for MCP server

set -e  # Exit on error

echo "🚀 Starting AI Sports Agent MCP Server..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
  echo "⚠️  Virtual environment not found. Creating..."
  python3 -m venv venv
  echo "✅ Virtual environment created"
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Check if dependencies are installed
if ! python -c "import fastapi" 2>/dev/null; then
  echo "📦 Installing dependencies..."
  pip install -r requirements.txt
  echo "✅ Dependencies installed"
fi

# Check if .env exists
if [ ! -f ".env" ]; then
  echo "⚠️  .env file not found!"
  echo "Please create .env file with required variables:"
  echo "  - OPENAI_API_KEY"
  echo "  - DATABASE_URL"
  echo "  - CORS_ORIGINS"
  echo ""
  echo "See MCP_INTEGRATION_GUIDE.md for full configuration"
  exit 1
fi

# Start the server
echo "🌐 Starting FastAPI server on http://0.0.0.0:8000"
echo "📚 API docs available at http://localhost:8000/docs"
echo ""
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
