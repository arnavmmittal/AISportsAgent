#!/bin/bash

# Setup Environment Variables Script
# This helps you set up .env files for both backend and frontend

echo "================================================"
echo "AI Sports Agent - Environment Setup"
echo "================================================"
echo ""

# Generate NextAuth secret
echo "Generating NextAuth secret..."
NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo "✅ Generated: $NEXTAUTH_SECRET"
echo ""

# Ask for database URL
echo "================================================"
echo "DATABASE SETUP"
echo "================================================"
echo ""
echo "Option 1: Supabase (Recommended - Free)"
echo "  1. Go to https://supabase.com"
echo "  2. Create account and new project"
echo "  3. Copy connection string from Settings > Database"
echo ""
echo "Option 2: Local PostgreSQL"
echo "  Format: postgresql://username:password@localhost:5432/database"
echo ""
read -p "Enter your DATABASE_URL: " DATABASE_URL

if [ -z "$DATABASE_URL" ]; then
    echo "❌ No database URL provided. Using example URL."
    DATABASE_URL="postgresql://user:password@localhost:5432/sportsagent"
fi

echo ""
echo "================================================"
echo "UPDATING BACKEND .env"
echo "================================================"

# Update backend .env
BACKEND_ENV="ai-sports-mcp/server/.env"

if [ ! -f "$BACKEND_ENV" ]; then
    echo "❌ Backend .env not found at $BACKEND_ENV"
    echo "   Creating from .env.example..."
    cp "ai-sports-mcp/server/.env.example" "$BACKEND_ENV"
fi

# Update DATABASE_URL in backend .env
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|DATABASE_URL=.*|DATABASE_URL=$DATABASE_URL|" "$BACKEND_ENV"
else
    # Linux
    sed -i "s|DATABASE_URL=.*|DATABASE_URL=$DATABASE_URL|" "$BACKEND_ENV"
fi

echo "✅ Updated $BACKEND_ENV"

echo ""
echo "================================================"
echo "CREATING FRONTEND .env.local"
echo "================================================"

# Create frontend .env.local
FRONTEND_ENV="ai-sports-agent/.env.local"

cat > "$FRONTEND_ENV" << EOF
# Database
DATABASE_URL=$DATABASE_URL

# NextAuth
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
NEXTAUTH_URL=http://localhost:3000

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000

# OpenAI (optional for frontend direct usage)
# OPENAI_API_KEY=your-key-here
EOF

echo "✅ Created $FRONTEND_ENV"

echo ""
echo "================================================"
echo "✅ SETUP COMPLETE!"
echo "================================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Backend setup:"
echo "   cd ai-sports-mcp/server"
echo "   source venv/bin/activate"
echo "   python -m app.main"
echo ""
echo "2. Frontend setup (in new terminal):"
echo "   cd ai-sports-agent"
echo "   npm install"
echo "   npx prisma generate"
echo "   npx prisma db push"
echo "   npm run dev"
echo ""
echo "3. Visit:"
echo "   Backend: http://localhost:8000/docs"
echo "   Frontend: http://localhost:3000"
echo ""
