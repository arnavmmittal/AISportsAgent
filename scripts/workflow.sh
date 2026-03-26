#!/bin/bash
# =============================================================================
# FLOW SPORTS COACH - ENHANCED WORKFLOW AUTOMATION
# =============================================================================
# Usage: ./scripts/workflow.sh <command>
#
# Commands:
#   start           - Prepare for new work (checkout staging, pull)
#   feature <name>  - Create new feature branch
#   pre-commit      - Run all pre-commit checks
#   security        - Run security audit
#   deploy-staging  - Deploy to staging
#   deploy-prod     - Deploy to production (with confirmations)
#   lesson          - Add a new lesson learned
#   status          - Show project status
#   env-check       - Verify environment setup
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_DIR="$PROJECT_ROOT/apps/web"

# Functions
print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if in project root
check_project_root() {
    if [ ! -f "$PROJECT_ROOT/CLAUDE.md" ]; then
        print_error "Not in project root. Run from FlowSportsCoach directory."
        exit 1
    fi
}

# Commands
cmd_start() {
    print_header "STARTING NEW WORK SESSION"

    cd "$PROJECT_ROOT"

    echo "Current branch: $(git branch --show-current)"
    echo ""

    if [ "$(git branch --show-current)" != "staging" ]; then
        echo "Switching to staging..."
        git checkout staging
    fi

    echo "Pulling latest changes..."
    git pull origin staging

    print_success "Ready! Create feature branch with: ./scripts/workflow.sh feature <name>"
}

cmd_feature() {
    if [ -z "$1" ]; then
        print_error "Usage: ./scripts/workflow.sh feature <feature-name>"
        exit 1
    fi

    print_header "CREATING FEATURE BRANCH"

    cd "$PROJECT_ROOT"

    BRANCH="feature/$1"

    # Ensure on staging first
    if [ "$(git branch --show-current)" != "staging" ]; then
        echo "Switching to staging first..."
        git checkout staging
        git pull origin staging
    fi

    echo "Creating branch: $BRANCH"
    git checkout -b "$BRANCH"

    print_success "Branch created! Start coding."
}

cmd_pre_commit() {
    print_header "PRE-COMMIT CHECKS"

    cd "$WEB_DIR"

    FAILED=0

    # Type check
    echo "Running type check..."
    if pnpm type-check > /dev/null 2>&1; then
        print_success "Type check passed"
    else
        print_error "Type check failed"
        FAILED=1
    fi

    # Lint
    echo "Running lint..."
    if pnpm lint > /dev/null 2>&1; then
        print_success "Lint passed"
    else
        print_warning "Lint has warnings (check manually)"
    fi

    # Security audit
    echo "Running security audit..."
    if node scripts/security-audit.js 2>&1 | grep -q "AUDIT PASSED"; then
        print_success "Security audit passed"
    else
        print_error "Security audit failed - check output"
        node scripts/security-audit.js 2>&1 | tail -20
        FAILED=1
    fi

    # Check for secrets in staged files
    echo "Checking for secrets in staged files..."
    cd "$PROJECT_ROOT"
    if git diff --cached --name-only | xargs grep -l "sk-proj-\|sk_\|eyJhbGci" 2>/dev/null; then
        print_error "SECRETS DETECTED in staged files!"
        FAILED=1
    else
        print_success "No secrets in staged files"
    fi

    echo ""
    if [ $FAILED -eq 1 ]; then
        print_error "PRE-COMMIT CHECKS FAILED"
        exit 1
    else
        print_success "ALL CHECKS PASSED - Ready to commit"
    fi
}

cmd_security() {
    print_header "SECURITY AUDIT"

    cd "$WEB_DIR"
    node scripts/security-audit.js
}

cmd_deploy_staging() {
    print_header "DEPLOYING TO STAGING"

    cd "$PROJECT_ROOT"

    # Run pre-commit checks first
    cmd_pre_commit

    # Check if on staging or feature branch
    BRANCH=$(git branch --show-current)

    if [ "$BRANCH" = "main" ]; then
        print_error "Cannot deploy to staging from main branch"
        exit 1
    fi

    if [ "$BRANCH" != "staging" ]; then
        echo "Merging $BRANCH to staging..."
        git checkout staging
        git pull origin staging
        git merge "$BRANCH"
    fi

    echo "Pushing to staging..."
    git push origin staging

    print_success "Deployed to staging! Vercel will auto-deploy."
    echo ""
    echo "Monitor deployment at: https://vercel.com/dashboard"
}

cmd_deploy_prod() {
    print_header "DEPLOYING TO PRODUCTION"

    cd "$PROJECT_ROOT"

    print_warning "⚠️  PRODUCTION DEPLOYMENT ⚠️"
    echo ""
    echo "This will deploy to LIVE USERS."
    echo ""
    read -p "Have you tested on staging? (yes/no): " TESTED

    if [ "$TESTED" != "yes" ]; then
        print_error "Test on staging first!"
        exit 1
    fi

    # Run security audit
    cd "$WEB_DIR"
    if ! node scripts/security-audit.js 2>&1 | grep -q "AUDIT PASSED"; then
        print_error "Security audit failed - cannot deploy to production"
        exit 1
    fi

    cd "$PROJECT_ROOT"

    read -p "Type 'DEPLOY' to confirm production deployment: " CONFIRM

    if [ "$CONFIRM" != "DEPLOY" ]; then
        print_error "Deployment cancelled"
        exit 1
    fi

    git checkout main
    git pull origin main
    git merge staging
    git push origin main

    print_success "Deployed to production!"
    echo ""
    echo "IMPORTANT: Monitor for errors in Sentry and Vercel logs"
}

cmd_lesson() {
    print_header "ADD LESSON LEARNED"

    DATE=$(date +%Y-%m-%d)

    echo "Categories: Security, Database, Deployment, Code Patterns, Architecture, Performance, Testing, Operational"
    read -p "Category: " CATEGORY
    read -p "Title: " TITLE
    read -p "Severity (CRITICAL/HIGH/MEDIUM/LOW): " SEVERITY
    read -p "What happened: " DISCOVERY
    read -p "How it was fixed: " FIX
    read -p "How to prevent: " PREVENTION

    cat >> "$PROJECT_ROOT/LESSONS.md" << EOF

### $DATE: $TITLE
**Severity:** $SEVERITY
**Discovery:** $DISCOVERY
**Fix:** $FIX
**Prevention:** $PREVENTION

---
EOF

    print_success "Lesson added to LESSONS.md"

    # Update last modified date
    sed -i '' "s/\*Last updated:.*/\*Last updated: $DATE\*/" "$PROJECT_ROOT/LESSONS.md" 2>/dev/null || true
}

cmd_status() {
    print_header "PROJECT STATUS"

    cd "$PROJECT_ROOT"

    echo "Git Branch: $(git branch --show-current)"
    echo "Last Commit: $(git log -1 --oneline)"
    echo ""

    echo "Uncommitted Changes:"
    git status -s
    echo ""

    cd "$WEB_DIR"
    echo "Security Status:"
    if node scripts/security-audit.js 2>&1 | grep -q "AUDIT PASSED"; then
        print_success "Security audit passing"
    else
        print_warning "Security audit has issues"
    fi

    echo ""
    echo "Recent Lessons (last 3):"
    grep -E "^### [0-9]{4}" "$PROJECT_ROOT/LESSONS.md" | tail -3
}

cmd_env_check() {
    print_header "ENVIRONMENT CHECK"

    cd "$WEB_DIR"

    if [ -f ".env.local" ]; then
        print_success ".env.local exists"

        # Check required vars
        REQUIRED_VARS=("DATABASE_URL" "OPENAI_API_KEY" "NEXTAUTH_SECRET")
        for VAR in "${REQUIRED_VARS[@]}"; do
            if grep -q "^$VAR=" .env.local; then
                print_success "$VAR is set"
            else
                print_error "$VAR is missing"
            fi
        done
    else
        print_error ".env.local not found"
        echo "Create with: cp ../../config/environments/.env.development .env.local"
    fi

    echo ""
    echo "Vercel Environment (Preview):"
    npx vercel env ls 2>&1 | grep -E "OPENAI|DATABASE|NEXTAUTH" | head -5
}

cmd_help() {
    echo "Flow Sports Coach - Workflow Automation"
    echo ""
    echo "Usage: ./scripts/workflow.sh <command>"
    echo ""
    echo "Commands:"
    echo "  start           Prepare for new work (checkout staging, pull)"
    echo "  feature <name>  Create new feature branch"
    echo "  pre-commit      Run all pre-commit checks"
    echo "  security        Run security audit"
    echo "  deploy-staging  Deploy to staging"
    echo "  deploy-prod     Deploy to production (with confirmations)"
    echo "  lesson          Add a new lesson learned"
    echo "  status          Show project status"
    echo "  env-check       Verify environment setup"
    echo ""
}

# Main
check_project_root

case "$1" in
    start)
        cmd_start
        ;;
    feature)
        cmd_feature "$2"
        ;;
    pre-commit)
        cmd_pre_commit
        ;;
    security)
        cmd_security
        ;;
    deploy-staging)
        cmd_deploy_staging
        ;;
    deploy-prod)
        cmd_deploy_prod
        ;;
    lesson)
        cmd_lesson
        ;;
    status)
        cmd_status
        ;;
    env-check)
        cmd_env_check
        ;;
    help|--help|-h|"")
        cmd_help
        ;;
    *)
        print_error "Unknown command: $1"
        cmd_help
        exit 1
        ;;
esac
