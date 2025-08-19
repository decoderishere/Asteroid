#!/bin/bash

echo "🚀 Starting BESS Permitting Backend Server..."

# Navigate to backend directory
cd .backend

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python -m venv .venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source .venv/bin/activate

# Install dependencies
echo "📚 Installing Python dependencies..."
pip install -r requirements.txt

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p uploads
mkdir -p documents

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "📋 Please copy .env.example to .env and configure your OpenRouter API key"
    echo "Example: cp ../.env.example .env"
    exit 1
fi

# Start the FastAPI server
echo "🎯 Starting FastAPI server on http://localhost:8000"
python main.py