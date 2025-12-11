# K6 E2E Tests

Comprehensive blackbox E2E tests for all API endpoints using k6.

## Prerequisites

- k6 installed on your system
- Server running on `http://localhost:5500` (or set `BASE_URL` env var)
- Valid API key configured (or set `API_KEY` env var)

## Test Structure

```
tests/e2e/k6/
├── config.js              # Shared configuration
├── test-e2e.js            # Main entry point
├── helpers.js             # Shared helpers (API Key, Tenants)
├── utils.js               # Utility functions
├── auth/                  # Auth endpoint tests
│   ├── change_password.js # POST /auth/change-password
│   ├── login.js           # POST /api/auth/login
│   ├── logout.js          # POST /auth/logout
│   ├── refresh.js         # POST /api/auth/refresh
│   ├── register.js        # POST /api/auth/register
│   └── verify.js          # POST /auth/verify
├── users/                 # User endpoint tests
│   ├── delete.js          # DELETE /users (Hard delete)
│   ├── get.js             # GET /users
│   ├── get_all.js         # GET /users/all
│   ├── update.js          # PUT /users
│   └── soft_delete.js     # DELETE /users (Soft delete check)
├── user_details/          # User details endpoint tests
│   ├── get.js             # GET /users/details
│   ├── update.js          # PUT /users/details
│   ├── upload.js          # PATCH /users/uploads
│   └── soft_delete.js     # Soft delete cascading properties
└── tenants/               # Tenant endpoint tests
    ├── create.js          # POST /tenants
    ├── get.js             # GET /tenants
    ├── update.js          # PUT /tenants
    └── soft_delete.js     # DELETE /tenants
```

## Running Tests

### Run All Tests
```bash
make test-e2e
```
*Generates HTML report at `coverage/test-e2e.html`*

### Run Specific Test Suites
```bash
# Auth tests only
make test-e2e-auth

# User tests only
make test-e2e-users

# User details tests only
make test-e2e-details

# Tenant tests only
make test-e2e-tenants

# Soft-delete flow tests only
make test-e2e-soft-delete
```

### Run Individual Test
```bash
k6 run tests/e2e/k6/auth/register.js
```

### With Custom Configuration
```bash
BASE_URL=http://localhost:3000 API_KEY=your-key k6 run tests/e2e/k6/auth/login.js
```

## Test Coverage

Each test file covers all user behavior permutations:

### Auth Tests (6 files)
- **change_password.js**: Valid password change, wrong old password, mismatch new password
- **register.js**: Valid registration, duplicate email/username, invalid email, missing fields, weak password, **Multi-tenant linking**.
- **login.js**: Login with email/username, wrong password, non-existent user, missing credentials
- **logout.js**: Successful logout, logout without being logged in (JWT check)
- **refresh.js**: Valid refresh, invalid token, missing token, expired token
- **verify.js**: Valid JWT, invalid JWT, expired JWT, missing auth, deleted user

### User Tests (5 files)
- **delete.js**: Successful hard deletion, without JWT
- **get.js**: Get with valid JWT, without JWT, with invalid JWT
- **get_all.js**: Get all with valid JWT, without JWT, array validation
- **update.js**: Valid update, partial update, duplicate email/username, invalid data
- **soft_delete.js**: Verify user is marked deleted but record persists

### User Details Tests (4 files)
- **get.js**: Get details with valid JWT, without JWT, not found
- **update.js**: Valid update, partial update, null values, invalid data types, invalid date
- **upload.js**: Valid upload, without JWT, invalid file type, missing file, oversized file
- **soft_delete.js**: Verify details are inaccessible after user soft delete

### Tenant Tests (4 files)
- **create.js**: Create tenant, duplicate name check
- **get.js**: Get tenant info, not found check
- **update.js**: Update name/description, duplicate check
- **soft_delete.js**: Soft delete tenant, verify cascading effects (users/sessions)

## Documentation

Each test file includes comprehensive documentation at the top:
- Endpoint URL and HTTP method (distinguishing `/api` paths vs root paths)
- Required headers (`X-API-Key` vs `Authorization`)
- Request body format
- Success response format
- Error responses
- Cookies (if applicable)
- Additional notes

## Notes

- Tests create test users in the database
- Consider running `make db-reset` between test runs for clean state
- All tests run with 1 VU (virtual user) and 1 iteration by default
- Response time threshold: 95% of requests < 2s
- Error rate threshold: < 1%
