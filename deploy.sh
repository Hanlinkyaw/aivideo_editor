#!/bin/bash

# AWS Deployment Script for Video Editor
# Run this on your AWS instance to set up the environment

set -e

echo "🚀 Setting up Video Editor on AWS..."

# Update system
echo "📦 Updating system packages..."
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
fi

# Install Docker Compose
echo "🔧 Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /opt/video-editor
sudo chown $USER:$USER /opt/video-editor
cd /opt/video-editor

# Clone repository (if not already cloned)
if [ ! -d ".git" ]; then
    echo "📥 Cloning repository..."
    git clone https://github.com/Hanlinkyaw/aivideo_editor.git .
fi

# Create necessary directories
echo "📂 Creating directories..."
mkdir -p uploads outputs audio transcripts previews

# Set up environment file
echo "⚙️ Setting up environment..."
if [ ! -f ".env" ]; then
    cat > .env << EOF
# Production Environment Variables
FLASK_ENV=production
SECRET_KEY=$(openssl rand -hex 32)
BASE_URL=http://localhost
PORT=5555
EOF
fi

# Build and start services
echo "🏗️ Building and starting services..."
docker-compose down || true
docker-compose build
docker-compose up -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 30

# Check status
echo "🔍 Checking service status..."
docker-compose ps

# Show logs
echo "📋 Showing recent logs..."
docker-compose logs video-editor-app --tail=20

echo "✅ Deployment complete!"
echo "🌐 Your Video Editor should be available at:"
echo "   http://$(curl -s ifconfig.me)"
echo "   http://$(curl -s ifconfig.me):5555"
echo ""
echo "🔧 Useful commands:"
echo "   View logs: docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Restart services: docker-compose restart"
echo "   Update: git pull && docker-compose up -d --build"
