# Asteroid Energy BESS Platform Makefile

.PHONY: help setup dev test build clean lint type-check pdf-test install-deps

# Default target
help:
	@echo "Asteroid Energy BESS Platform"
	@echo ""
	@echo "Available targets:"
	@echo "  setup      - Initial project setup"
	@echo "  dev        - Start development servers"
	@echo "  test       - Run all tests"
	@echo "  build      - Build for production"
	@echo "  clean      - Clean build artifacts"
	@echo "  lint       - Run linting"
	@echo "  type-check - Run type checking"
	@echo "  pdf-test   - Test PDF generation"
	@echo ""
	@echo "Quick start: make setup && make dev"

# Setup project
setup:
	@echo "🚀 Setting up Asteroid Energy BESS Platform..."
	@chmod +x scripts/*.sh
	@./scripts/setup.sh

# Start development servers
dev:
	@echo "🚀 Starting development servers..."
	@pnpm dev

# Run all tests
test:
	@echo "🧪 Running tests..."
	@chmod +x scripts/test.sh
	@./scripts/test.sh

# Build for production
build:
	@echo "🏗️ Building for production..."
	@chmod +x scripts/build.sh
	@./scripts/build.sh

# Clean artifacts
clean:
	@echo "🧹 Cleaning artifacts..."
	@pnpm run clean
	@rm -rf build/ artifacts/*.pdf

# Lint all code
lint:
	@echo "🔍 Linting code..."
	@pnpm run lint
	@cd apps/api && uv run ruff check . && uv run black --check .
	@cd apps/pdf && uv run ruff check . && uv run black --check .

# Type checking
type-check:
	@echo "📝 Type checking..."
	@cd apps/web && pnpm type-check
	@cd apps/api && uv run mypy app/ --ignore-missing-imports || true

# Test PDF generation
pdf-test:
	@echo "📄 Testing PDF generation..."
	@pnpm run pdf:hello

# Install dependencies only
install-deps:
	@echo "📦 Installing dependencies..."
	@pnpm install
	@cd apps/api && uv sync
	@cd apps/pdf && uv sync
	@cd ../../packages/geo && uv sync
	@cd ../schemas && uv sync

# Development shortcuts
api:
	@echo "🐍 Starting API only..."
	@cd apps/api && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

frontend:
	@echo "🌐 Starting frontend only..."
	@cd apps/web && pnpm dev

# Docker shortcuts (if needed later)
docker-build:
	@echo "🐳 Building Docker images..."
	@docker build -t asteroid-api -f docker/Dockerfile.api .
	@docker build -t asteroid-web -f docker/Dockerfile.web .

docker-dev:
	@echo "🐳 Starting Docker development..."
	@docker-compose -f docker/docker-compose.dev.yml up