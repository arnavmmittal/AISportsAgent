#!/bin/bash
# Simple script to switch between testing scenarios
# No git knowledge required - just run the commands below

case "$1" in
  "main")
    echo "🔄 Switching to MAIN branch (baseline - no chat summaries)..."
    git checkout main
    echo "✅ On main branch. Run: pnpm dev:web"
    ;;
  "summaries")
    echo "🔄 Switching to CHAT SUMMARIES branch (with weekly summaries feature)..."
    git checkout feature/coach-weekly-chat-summaries
    echo "✅ On chat summaries branch. Run: pnpm dev:web"
    ;;
  "status")
    echo "📍 Current branch:"
    git branch --show-current
    echo ""
    echo "📝 Status:"
    git status -s
    ;;
  *)
    echo "Usage:"
    echo "  ./test-switch.sh main       - Test baseline (current production)"
    echo "  ./test-switch.sh summaries  - Test weekly chat summaries feature"
    echo "  ./test-switch.sh status     - See current branch"
    echo ""
    echo "Current branch: $(git branch --show-current)"
    ;;
esac
