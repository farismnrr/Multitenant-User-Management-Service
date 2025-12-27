#!/bin/bash
set -e

echo "🚀 Starting User Auth Plugin..."

# ============================================================================
# Auto Migration
# ============================================================================
echo "📦 Running database migrations..."

# Construct DATABASE_URL based on CORE_DB_TYPE
if [ "$CORE_DB_TYPE" = "sqlite" ]; then
    DB_NAME="${CORE_DB_NAME:-user_auth_plugin.sqlite}"
    # Ensure .sqlite extension
    case "$DB_NAME" in
        *.sqlite|*.db) ;;
        *) DB_NAME="${DB_NAME}.sqlite";;
    esac
    export DATABASE_URL="sqlite:///app/${DB_NAME}?mode=rwc"
    echo "📦 Using SQLite database: ${DATABASE_URL}"
else
    DB_HOST="${CORE_DB_HOST:-127.0.0.1}"
    DB_PORT="${CORE_DB_PORT:-5432}"
    DB_USER="${CORE_DB_USER:-postgres}"
    DB_PASS="${CORE_DB_PASS:-postgres}"
    DB_NAME="${CORE_DB_NAME:-user_auth_plugin}"
    export DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
    echo "📦 Using PostgreSQL database at ${DB_HOST}:${DB_PORT}/${DB_NAME}"
fi

# Run migrations
if [ -f "/app/migration" ]; then
    echo "⬆️  Running migrations..."
    /app/migration up && echo "✅ Migrations completed successfully" || echo "⚠️  Migration warning (may already be up-to-date)"
else
    echo "⚠️  Migration binary not found, skipping migrations"
fi

# ============================================================================
# Start Application
# ============================================================================
echo "🚀 Starting backend server..."
exec /app/user-auth-plugin
