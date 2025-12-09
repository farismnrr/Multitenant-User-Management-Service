# User Auth Plugin - Makefile for Development Automation

.PHONY: help dev build test clean migrate-up migrate-down migrate-fresh db-reset

# Default target
help:
	@echo "User Auth Plugin - Available Commands:"
	@echo ""
	@echo "  make dev              - Run development server with hot reload"
	@echo "  make start    - Run development server without hot reload"
	@echo "  make install-watch    - Install cargo-watch for hot reload"
	@echo "  make build            - Build release binary"
	@echo "  make test             - Run all tests"
	@echo "  make test-integration - Run integration tests (whitebox)"
	@echo "  make test-e2e         - Run E2E tests (blackbox)"
	@echo "  make migrate-up       - Run database migrations"
	@echo "  make migrate-down     - Rollback last migration"
	@echo "  make migrate-fresh    - Drop all tables and re-run migrations"
	@echo "  make db-reset         - Reset database (fresh + seed if available)"
	@echo "  make clean            - Clean build artifacts"
	@echo ""

# Run development server with hot reload (requires cargo-watch)
dev:
	@echo "🚀 Starting development server with hot reload..."
	@echo "💡 Tip: Install cargo-watch with 'make install-watch' if not installed"
	@cargo watch -x run || (echo "❌ cargo-watch not found. Installing..." && cargo install cargo-watch && cargo watch -x run)

# Run development server without hot reload
start:
	@echo "🚀 Starting development server (no hot reload)..."
	cargo run

# Install cargo-watch for hot reload
install-watch:
	@echo "📦 Installing cargo-watch..."
	cargo install cargo-watch
	@echo "✅ cargo-watch installed successfully"

# Build release binary
build:
	@echo "🔨 Building release binary..."
	cargo build --release

# Run all tests
test:
	@echo "🧪 Running all tests..."
	cargo test -- --test-threads=1

# Run integration tests only (whitebox)
test-integration:
	@echo "🧪 Running integration tests (whitebox)..."
	cargo test --test integration_tests -- --test-threads=1

# Run E2E tests only (blackbox)
test-e2e:
	@echo "🧪 Running E2E tests (blackbox)..."
	cargo test --test e2e_tests -- --test-threads=1

# Run database migrations (up)
migrate-up:
	@echo "⬆️  Running database migrations..."
	cd migration && cargo run -- up
	@echo "✅ Migrations completed"

# Rollback last migration
migrate-down:
	@echo "⬇️  Rolling back last migration..."
	cd migration && cargo run -- down
	@echo "✅ Rollback completed"

# Fresh migration (drop all and re-run)
migrate-fresh:
	@echo "🔄 Running fresh migrations..."
	cd migration && cargo run -- fresh
	@echo "✅ Fresh migrations completed"

# Reset database (fresh migrations)
db-reset: migrate-fresh
	@echo "🗑️  Database reset completed"

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	cargo clean
	@echo "✅ Clean completed"

# Check code without building
check:
	@echo "🔍 Checking code..."
	cargo check

# Format code
fmt:
	@echo "✨ Formatting code..."
	cargo fmt

# Run clippy linter
lint:
	@echo "🔎 Running clippy..."
	cargo clippy -- -D warnings

# Watch and auto-reload (requires cargo-watch)
watch:
	@echo "👀 Watching for changes..."
	cargo watch -x run

# Database status
migrate-status:
	@echo "📊 Checking migration status..."
	cd migration && cargo run -- status
