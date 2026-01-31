#!/bin/bash
#
# Generate Production Secrets
# Run this once to generate all the secrets you need
#
# Usage: ./scripts/generate-secrets.sh
#

echo ""
echo "🔐 Generating Production Secrets"
echo "================================="
echo ""
echo "Copy these to your Vercel Environment Variables:"
echo ""

echo "# Authentication"
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"
echo ""

echo "# Cron Job Security"
echo "CRON_SECRET=$(openssl rand -base64 32)"
echo ""

echo "# Data Encryption"
echo "SUMMARY_ENCRYPTION_KEY=$(openssl rand -hex 32)"
echo ""

echo "# Voice Service (internal)"
echo "VOICE_SERVICE_KEY=$(openssl rand -base64 32)"
echo ""

echo "================================="
echo ""
echo "📋 Next Steps:"
echo "1. Copy these values to Vercel → Settings → Environment Variables"
echo "2. Add your API keys (OpenAI, SendGrid, etc.)"
echo "3. Deploy!"
echo ""
echo "See DEPLOYMENT_GUIDE.md for full instructions."
echo ""
