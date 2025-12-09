# Journify - User Authentication Service

A production-ready user authentication service built with Rust and Actix-web, featuring JWT-based authentication, rate limiting, and comprehensive API endpoints.

## Features

- **JWT Authentication**: Secure access and refresh token management
- **User Management**: Complete CRUD operations for users
- **Role-Based Access**: Flexible role system for authorization
- **Rate Limiting**: IP-based rate limiting with automatic blocking
- **Database Migrations**: SeaORM-based schema management
- **Health Monitoring**: Automatic database health checks with graceful shutdown
- **API Key Protection**: Middleware-based API key authentication
- **Comprehensive Logging**: Colored, structured logging with multiple levels

## Quick Start

### Prerequisites

- Rust 1.70+ (install from [rustup.rs](https://rustup.rs/))
- PostgreSQL 12+ (running and accessible)
- Environment variables configured (see [Configuration](#configuration))

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd journify
   ```

2. Set up environment variables:
   ```bash
   cp .env .env.local  # Create your local config
   # Edit .env.local with your configuration
   ```

3. Run database migrations:
   ```bash
   make migrate-up
   ```

4. Start the development server:
   ```bash
   make dev
   ```

The server will start on `http://0.0.0.0:5500`

## Configuration

### Environment Variables

Create a `.env` file in the project root with the following variables:

#### Database Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `CORE_DB_HOST` | PostgreSQL host address | `127.0.0.1` | No |
| `CORE_DB_PORT` | PostgreSQL port | `5432` | No |
| `CORE_DB_USER` | Database username | `postgres` | No |
| `CORE_DB_PASS` | Database password | `postgres` | No |
| `CORE_DB_NAME` | Database name | `user_auth_plugin_dev` | No |

#### Application Security

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SECRET_KEY` | Application secret key for signing | `""` | Yes (production) |
| `API_KEY` | API key for endpoint protection | `""` | Yes (production) |

#### JWT Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `JWT_SECRET` | Secret key for JWT signing | N/A | Yes |
| `JWT_ACCESS_TOKEN_EXPIRY` | Access token lifetime (seconds) | `900` (15 min) | No |
| `JWT_REFRESH_TOKEN_EXPIRY` | Refresh token lifetime (seconds) | `604800` (7 days) | No |

#### Rate Limiting

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `5` | No |
| `RATE_LIMIT_WINDOW_SECS` | Time window (seconds) | `900` (15 min) | No |
| `RATE_LIMIT_BLOCK_DURATION_SECS` | Block duration (seconds) | `1800` (30 min) | No |

#### Logging

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `LOG_LEVEL` | Logging level (trace, debug, info, warn, error) | `info` | No |

#### Server Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `GRACE_PERIOD_SECS` | Graceful shutdown period (seconds) | `5` | No |

### Example Configuration

```env
# Database
CORE_DB_HOST=127.0.0.1
CORE_DB_PORT=5432
CORE_DB_USER=postgres
CORE_DB_PASS=your_secure_password
CORE_DB_NAME=journify_production

# Security
SECRET_KEY=your-super-secret-application-key-change-in-production
API_KEY=your-api-key-for-endpoint-protection

# JWT
JWT_SECRET=your-jwt-signing-secret-key-must-be-strong
JWT_ACCESS_TOKEN_EXPIRY=900
JWT_REFRESH_TOKEN_EXPIRY=604800

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_SECS=60
RATE_LIMIT_BLOCK_DURATION_SECS=300

# Logging
LOG_LEVEL=info

# Server
GRACE_PERIOD_SECS=5
```

## Project Structure

```
journify/
├── src/
│   ├── main.rs                 # Application entry point
│   ├── lib.rs                  # Library exports for testing
│   ├── server.rs               # Server configuration and initialization
│   ├── controllers/            # HTTP request handlers
│   │   ├── auth_controller.rs  # Authentication endpoints
│   │   └── user_controller.rs  # User CRUD endpoints
│   ├── dtos/                   # Data transfer objects
│   │   ├── auth_dto.rs         # Authentication DTOs
│   │   ├── user_dto.rs         # User DTOs
│   │   └── response_dto.rs     # Standard response formats
│   ├── entities/               # SeaORM database models
│   │   └── user.rs             # User entity
│   ├── repositories/           # Data access layer
│   │   └── user_repository.rs  # User database operations
│   ├── usecases/               # Business logic layer
│   │   ├── auth_usecase.rs     # Authentication logic
│   │   └── user_usecase.rs     # User management logic
│   ├── routes/                 # Route configuration
│   │   ├── auth_routes.rs      # Authentication routes
│   │   └── user_routes.rs      # User routes
│   ├── middlewares/            # HTTP middlewares
│   │   ├── api_key.rs          # API key authentication
│   │   ├── logger_request.rs   # Request logging
│   │   ├── powered_by.rs       # Custom headers
│   │   └── rate_limiter.rs     # Rate limiting
│   ├── utils/                  # Utility functions
│   │   ├── jwt.rs              # JWT token management
│   │   └── password.rs         # Password hashing
│   ├── validators/             # Input validation
│   │   └── user_validator.rs  # User input validation
│   ├── errors/                 # Error handling
│   │   └── mod.rs              # Application error types
│   └── infrastructures/        # External services
│       └── postgres_connection.rs  # Database connection
├── migration/                  # Database migrations
│   ├── src/
│   │   ├── lib.rs              # Migration manager
│   │   ├── main.rs             # Migration CLI
│   │   └── m*.rs               # Migration files
│   └── Cargo.toml
├── tests/                      # Integration tests
├── Makefile                    # Development automation
├── Cargo.toml                  # Project dependencies
└── README.md                   # This file
```

## API Endpoints

All API endpoints require the `Authorization` header with your API key:
```
Authorization: Bearer your-api-key
```

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword123",
  "role": "USER"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

Response includes access token in body and refresh token as HTTP-only cookie.

#### Logout
```http
POST /api/auth/logout
```

### User Management

#### Get All Users
```http
GET /api/users
```

#### Get User by ID
```http
GET /api/users/{id}
```

#### Update User
```http
PUT /api/users/{id}
Content-Type: application/json

{
  "username": "newusername",
  "email": "newemail@example.com",
  "role": "ADMIN"
}
```

All fields are optional.

#### Delete User
```http
DELETE /api/users/{id}
```

### Health Check

#### Root Health Check
```http
GET /
```

#### API Ping
```http
GET /api/ping
```

## Development

### Available Commands

```bash
# Development
make dev                 # Run with hot reload
make dev-no-reload       # Run without hot reload
make install-watch       # Install cargo-watch
make check               # Check code without building
make fmt                 # Format code
make lint                # Run clippy linter

# Database
make migrate-up          # Run pending migrations
make migrate-down        # Rollback last migration
make migrate-fresh       # Drop all tables and re-run migrations
make migrate-status      # Check migration status
make db-reset            # Reset database completely

# Testing
make test                # Run all tests
make test-user           # Run user API tests only

# Build
make build               # Build release binary
make clean               # Clean build artifacts
```

### Running Tests

```bash
# Run all tests
make test

# Run specific test file
cargo test --test user_api_test

# Run with output
cargo test -- --nocapture

# Run with specific log level
RUST_LOG=debug cargo test
```

### Creating Migrations

```bash
cd migration
sea-orm-cli migrate generate migration_name
```

Edit the generated file in `migration/src/`, then run:
```bash
make migrate-up
```

### Code Quality

Before committing:
```bash
make fmt     # Format code
make lint    # Check for issues
make test    # Run tests
```

## Architecture

### Clean Architecture Layers

1. **Controllers**: Handle HTTP requests and responses
2. **Use Cases**: Implement business logic
3. **Repositories**: Abstract database operations
4. **Entities**: Define data models
5. **DTOs**: Transfer data between layers

### Middleware Stack

1. **PoweredByMiddleware**: Adds custom headers
2. **RequestLoggerMiddleware**: Logs all requests
3. **Compress**: Gzip compression
4. **ApiKeyMiddleware**: API key authentication (on /api routes)
5. **RateLimiterMiddleware**: IP-based rate limiting

### Security Features

- **Password Hashing**: Argon2 with secure defaults
- **JWT Tokens**: Separate access and refresh tokens
- **HTTP-Only Cookies**: Refresh tokens stored securely
- **Rate Limiting**: Prevents brute force attacks
- **API Key Protection**: Protects all API endpoints
- **Input Validation**: Comprehensive validation for all inputs

## Deployment

### Production Checklist

- [ ] Set strong `SECRET_KEY` and `JWT_SECRET`
- [ ] Configure production database credentials
- [ ] Set `secure: true` for cookies (requires HTTPS)
- [ ] Adjust rate limiting for production traffic
- [ ] Set appropriate `LOG_LEVEL` (info or warn)
- [ ] Configure firewall rules
- [ ] Set up SSL/TLS certificates
- [ ] Configure backup strategy
- [ ] Set up monitoring and alerting

### Building for Production

```bash
make build
```

Binary will be in `target/release/journify`

### Running in Production

```bash
# Set environment variables
export CORE_DB_HOST=production-db-host
export JWT_SECRET=your-production-jwt-secret
# ... other variables

# Run the binary
./target/release/journify
```

## Troubleshooting

### Database Connection Issues

If you see "Failed to connect to Postgres":
1. Ensure PostgreSQL is running
2. Check database credentials in `.env`
3. Verify network connectivity
4. Check PostgreSQL logs

### Migration Failures

If migrations fail:
```bash
make migrate-status  # Check current state
make migrate-down    # Rollback if needed
make migrate-up      # Try again
```

### Rate Limiting Issues

If getting rate limited during development:
- Increase `RATE_LIMIT_MAX_REQUESTS`
- Decrease `RATE_LIMIT_WINDOW_SECS`
- Or temporarily disable rate limiting in code

## Documentation

Generate and view API documentation:
```bash
cargo doc --no-deps --open
```

## License

[Add your license here]

## Contributing

[Add contributing guidelines here]

## Support

[Add support information here]
