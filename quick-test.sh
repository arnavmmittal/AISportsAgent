#!/bin/bash
# Quick Test Script - One Command to Test Everything!
# Run: ./quick-test.sh [web|mobile|both]

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 AI Sports Agent - Quick Test${NC}\n"

# Function to test web
test_web() {
    echo -e "${GREEN}📱 Starting Web Backend...${NC}"
    echo -e "${YELLOW}➜ Web will be available at: http://localhost:3000${NC}\n"

    cd apps/web

    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo "Installing dependencies..."
        pnpm install
    fi

    # Start the dev server
    pnpm dev
}

# Function to test mobile
test_mobile() {
    echo -e "${GREEN}📲 Starting Mobile App...${NC}"
    echo -e "${YELLOW}➜ Scan QR code with Expo Go or press 'i'/'a' for simulator${NC}\n"

    cd apps/mobile

    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo "Installing dependencies..."
        pnpm install
    fi

    # Start Expo
    pnpm start
}

# Parse command line argument
case "$1" in
    "web")
        test_web
        ;;
    "mobile")
        test_mobile
        ;;
    "both")
        echo -e "${YELLOW}⚠️  Running both requires two terminals!${NC}"
        echo -e "Terminal 1: ./quick-test.sh web"
        echo -e "Terminal 2: ./quick-test.sh mobile\n"
        exit 0
        ;;
    *)
        echo "Usage: ./quick-test.sh [web|mobile|both]"
        echo ""
        echo "Options:"
        echo "  web     - Start web backend (http://localhost:3000)"
        echo "  mobile  - Start mobile app (Expo)"
        echo "  both    - Show instructions for running both"
        echo ""
        echo "Examples:"
        echo "  ./quick-test.sh web      # Test web interface"
        echo "  ./quick-test.sh mobile   # Test mobile app"
        echo ""
        exit 1
        ;;
esac
