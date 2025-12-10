#!/bin/bash
set -e

# Ensure binary is executable
chmod +x ./user-auth-plugin 2>/dev/null || true


# Default values if not set
DB_HOST="${CORE_DB_HOST:-localhost}"
DB_PORT="${CORE_DB_PORT:-5432}"
DB_USER="${CORE_DB_USER:-postgres}"
DB_PASS="${CORE_DB_PASS:-postgres}"
DB_NAME="${CORE_DB_NAME:-user_auth_plugin_dev}"

# Construct DATABASE_URL if not set
if [ -z "$DATABASE_URL" ]; then
    export DATABASE_URL="postgres://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
fi

echo "🚀 Docker Entrypoint: checking Postgres at $DB_HOST:$DB_PORT..."

# Wait for Postgres (timeout 10 seconds)
if nc -z -v -w 10 "$DB_HOST" "$DB_PORT"; then
    echo "✅ Postgres is up!"
    
    # Create database if it doesn't exist
    echo "🔧 Ensuring database '$DB_NAME' exists..."
    PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
    PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "CREATE DATABASE $DB_NAME"
    
    echo "✅ Database ready! Running migrations..."
    if ./migration_tool up; then
        echo "✅ Migrations applied successfully."
        echo "🟢 Starting application..."
        exec ./user-auth-plugin
    else
        echo "❌ Migration failed!"
        exit 1
    fi
else
    echo "❌ Connect to Postgres at $DB_HOST:$DB_PORT failed!"
    echo "💀 Exiting..."
    exit 1
fi
