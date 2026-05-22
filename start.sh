#!/usr/bin/env bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}  AI Video Editor Pro - Local Launcher      ${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""

# Check Python
if command -v python3.11 &> /dev/null; then
    PYTHON=python3.11
elif command -v python3 &> /dev/null; then
    PYTHON=python3
elif command -v python &> /dev/null; then
    PYTHON=python
else
    echo -e "${RED}Error: Python is not installed.${NC}"
    echo -e "Please install Python 3.9-3.11"
    exit 1
fi

PYTHON_VERSION=$($PYTHON --version)
echo -e "${GREEN}${PYTHON_VERSION} detected${NC}"

# Check FFmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo -e "${YELLOW}Warning: FFmpeg is not installed. Video processing will not work.${NC}"
    echo -e "${YELLOW}Install with: brew install ffmpeg (Mac) or sudo apt install ffmpeg (Linux)${NC}"
fi

# Set up virtual environment
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    $PYTHON -m venv venv
fi

echo -e "${GREEN}Activating virtual environment...${NC}"
source venv/bin/activate

# Install dependencies
if [ ! -f "venv/.deps_installed" ] || [ "requirements.txt" -nt "venv/.deps_installed" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    pip install --upgrade pip -q
    pip install -r requirements.txt -q
    touch venv/.deps_installed
    echo ""
fi

# Create required directories
mkdir -p uploads outputs audio transcripts previews data

# Set up .env from .env.example if it doesn't exist
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    echo -e "${YELLOW}Creating .env from .env.example...${NC}"
    echo -e "${YELLOW}Please update .env with your actual API keys.${NC}"
    cp .env.example .env
    echo ""
fi

# Start the app
echo -e "${GREEN}Starting AI Video Editor...${NC}"
echo -e "${CYAN}--------------------------------------------${NC}"
echo -e "  URL: ${GREEN}http://localhost:5555/${NC}"
echo -e "${CYAN}--------------------------------------------${NC}"
echo ""

exec $PYTHON app.py
