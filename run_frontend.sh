#!/bin/bash

echo "🌐 Starting BESS Permitting Frontend..."

# Navigate to frontend directory
cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi

# Check if backend is running
echo "🔍 Checking if backend is running on port 8000..."
if ! nc -z localhost 8000 2>/dev/null; then
    echo "⚠️  Warning: Backend server is not running on http://localhost:8000"
    echo "🚀 Please start the backend server first by running: ./run_backend.sh"
    echo "📄 Or follow the instructions in README.md"
    exit 1
fi

echo "✅ Backend detected. Starting Next.js development server..."
echo "🎯 Frontend will be available at http://localhost:3000"
npm run dev