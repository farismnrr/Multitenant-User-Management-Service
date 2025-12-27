# ============================================================================
# Multi-stage Dockerfile for User Auth Plugin
# Builds both Rust backend and Vue frontend in a single container
# ============================================================================

# ============================================================================
# Stage 1: Build Rust Backend
# ============================================================================
FROM rust:slim-bookworm AS rust-builder

# Install build dependencies for RocksDB
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    libclang-dev \
    clang \
    cmake \
    make \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy Cargo files first for dependency caching
COPY Cargo.toml Cargo.lock ./
COPY migration/Cargo.toml migration/

# Create dummy source files for dependency caching
RUN mkdir -p src && echo "fn main() {}" > src/main.rs && \
    echo "pub fn lib() {}" > src/lib.rs && \
    mkdir -p migration/src && echo "fn main() {}" > migration/src/main.rs && \
    echo "pub fn lib() {}" > migration/src/lib.rs

# Build dependencies (cached layer)
RUN cargo build --release 2>/dev/null || true

# Remove dummy files and copy real source code
RUN rm -rf src migration/src

COPY src src/
COPY migration/src migration/src/

# Build the actual application
RUN touch src/main.rs src/lib.rs migration/src/main.rs migration/src/lib.rs && \
    cargo build --release --workspace && \
    ls -la target/release

# ============================================================================
# Stage 2: Build Vue Frontend
# ============================================================================
FROM node:22-slim AS frontend-builder

WORKDIR /app/web

# Copy package files for dependency caching
COPY web/package.json web/package-lock.json ./

# Install dependencies
RUN npm ci

# Copy frontend source code
COPY web/ ./

# Build frontend for production
RUN npm run build

# ============================================================================
# Stage 3: Runtime Image
# ============================================================================
FROM debian:bookworm-slim AS runtime

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create app user for security
RUN groupadd -r appgroup && useradd -r -g appgroup -u 1000 appuser

WORKDIR /app

# Copy backend binary
COPY --from=rust-builder /app/target/release/user-auth-plugin ./user-auth-plugin
COPY --from=rust-builder /app/target/release/migration ./migration

# Copy frontend build output
COPY --from=frontend-builder /app/web/dist ./web/dist

# Copy entrypoint script
COPY docker-entrypoint.sh ./

# Create necessary directories
RUN mkdir -p /app/logs /app/assets /app/rocksdb_cache && \
    chown -R appuser:appgroup /app

# Make entrypoint executable
RUN chmod +x /app/docker-entrypoint.sh

# Switch to non-root user
USER appuser

# Expose backend port
EXPOSE 5500

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:5500/health || exit 1

# Set entrypoint
ENTRYPOINT ["/app/docker-entrypoint.sh"]
