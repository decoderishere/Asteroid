#!/bin/bash

echo "🚀 Starting BESS Permitting Multi-Agent System..."

# Check if directories exist
if [ ! -d "backend" ]; then
    echo "❌ Backend directory not found!"
    exit 1
fi

if [ ! -d "frontend" ]; then
    echo "❌ Frontend directory not found!" 
    exit 1
fi

echo "📦 Installing backend dependencies..."
cd backend
pip install -r requirements.txt

echo "🔧 Starting backend server..."
python main.py &
BACKEND_PID=$!

echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

echo "🎨 Building frontend..."
npm run build

echo "🌐 Starting frontend server..."
npm start &
FRONTEND_PID=$!

echo ""
echo "✅ System started successfully!"
echo "🔧 Backend API: http://localhost:8000"
echo "🌐 Frontend App: http://localhost:3000"
echo ""
echo "📋 Available features:"
echo "   • Bilingual support (Spanish/English)"
echo "   • Guided project setup"
echo "   • Document upload with origin labeling"
echo "   • AI-powered document generation"
echo "   • Real-time project chat assistance"
echo "   • Document organization by type"
echo "   • No-assumptions AI policy"
echo ""
echo "Press Ctrl+C to stop both servers..."

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID