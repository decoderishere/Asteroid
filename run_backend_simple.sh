#!/bin/bash

echo "🚀 Starting BESS Permitting Backend Server..."

# Navigate to backend directory
cd .backend || {
    echo "❌ Error: Backend directory not found!"
    echo "Please make sure you're in the BESSChile root directory"
    exit 1
}

# Activate virtual environment (use existing .venv)
if [ -d ".venv" ]; then
    echo "🔧 Activating virtual environment..."
    source .venv/bin/activate
else
    echo "📦 Creating Python virtual environment..."
    python -m venv .venv
    source .venv/bin/activate
fi

# Install dependencies (quietly)
echo "📚 Installing Python dependencies..."
pip install -q -r requirements.txt

# Create necessary directories
mkdir -p uploads documents

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "📋 The backend will use default settings"
    echo "ℹ️  For OpenRouter integration, create .env with API key"
fi

# Start the FastAPI server
echo "🎯 Starting FastAPI server on http://localhost:8000"
echo "📱 Press Ctrl+C to stop the server"
echo ""
python main.py