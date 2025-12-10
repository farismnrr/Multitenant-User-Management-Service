# Build Stage
FROM rust:1.83-slim-bookworm AS builder

WORKDIR /usr/src/app

# Install build dependencies
RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

# Create a new empty shell project
RUN cargo new --bin user_auth_plugin
WORKDIR /usr/src/app/user_auth_plugin

# Copy manifests
COPY ./Cargo.lock ./Cargo.lock
COPY ./Cargo.toml ./Cargo.toml

# Copy migration crate
COPY ./migration ./migration

# Create dummy lib.rs to satisfy Cargo.toml
RUN touch src/lib.rs

# Build dependencies - this is the caching layer!
RUN cargo build --release
RUN rm src/*.rs

# Copy source code
COPY ./src ./src


# Build for release (ensure migration is built too)
RUN rm ./target/release/deps/user_auth_plugin*
RUN cargo build --release -p user-auth-plugin
RUN cargo build --release -p migration

# Runtime Stage
FROM debian:bookworm-slim

WORKDIR /app

# Install runtime dependencies (including netcat for entrypoint check, curl for healthcheck, and postgresql-client for database creation)
RUN apt-get update && apt-get install -y ca-certificates libssl-dev netcat-openbsd curl postgresql-client && rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/src/app/user_auth_plugin/target/release/user-auth-plugin .
COPY --from=builder /usr/src/app/user_auth_plugin/target/release/migration ./migration_tool
COPY ./entrypoint.sh .

EXPOSE 5500

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl --fail http://localhost:5500/ || exit 1

ENTRYPOINT ["./entrypoint.sh"]
