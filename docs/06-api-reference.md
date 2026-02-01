# API Reference

This document lists all available API endpoints for authentication and user management.

---

## Authentication Methods

| Method | Header | Used For |
|--------|--------|----------|
| **Tenant Secret** | `X-Tenant-Secret-Key: {key}` | Tenant creation only |
| **API Key** | `X-API-Key: {key}` | Auth endpoints (`/auth/*`) |
| **JWT Token** | `Authorization: Bearer {token}` | Protected endpoints |

---

## Route Structure

The API is organized into three main scopes:

```
/api/*          → API Key or Tenant Secret protected
  /api/tenants  → Tenant management (Tenant Secret)
  /api/users    → User management (JWT)

/auth/*         → Authentication endpoints (API Key)
  /auth/login   → Login
  /auth/register → Registration
  /auth/logout  → Logout (JWT required)
  /auth/verify  → Token verification (JWT required)
  /auth/refresh → Refresh access token (API Key required)

/mqtt/*         → MQTT user management (API Key)
  /mqtt/create  → Create MQTT user
  /mqtt/check   → Verify MQTT credentials
  /mqtt/acl     → Check access permissions
  /mqtt         → List all MQTT users
  /mqtt/{username} → Delete MQTT user
```

---

## SSO Web Endpoints

These endpoints serve the SSO web interface (for browser redirects):

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/login` | SSO login page |
| GET | `/register` | SSO registration page |

### Query Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `tenant_id` | Yes | Tenant UUID |
| `redirect_uri` | Yes | Callback URL (URL-encoded) |

> **Note**: `state`, `nonce`, `response_type`, and `scope` are automatically added by the SSO login page. Do not include them in your redirect URL.

---

## Tenant Endpoints

### Create Tenant (Bootstrapping)

```http
POST /api/tenants
X-Tenant-Secret-Key: your-tenant-secret-key
Content-Type: application/json

{
    "name": "My Application",
    "description": "Optional description"
}
```

**Response (201 Created):**

```json
{
    "status": true,
    "message": "Tenant created successfully",
    "data": {
        "tenant_id": "uuid-here",
        "api_key": "your-tenant-api-key"
    }
}
```

**Duplicate tenant returns existing ID (200 OK - Idempotent):**

```json
{
    "status": true,
    "message": "Tenant already exists",
    "data": {
        "tenant_id": "existing-uuid"
    }
}
```

### List Tenants

```http
GET /api/tenants
Authorization: Bearer {token}
```

### Get Tenant by ID

```http
GET /api/tenants/{tenant_id}
Authorization: Bearer {token}
```

### Update Tenant

```http
PUT /api/tenants/{tenant_id}
Authorization: Bearer {token}
Content-Type: application/json

{
    "name": "Updated Name",
    "description": "Updated description"
}
```

### Delete Tenant

```http
DELETE /api/tenants/{tenant_id}
Authorization: Bearer {token}
```

---

## Authentication Endpoints

All auth endpoints require `X-API-Key` header.

### Register

```http
POST /auth/register
X-API-Key: your-api-key
Content-Type: application/json

{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "StrongPassword123!",
    "role": "user"
}
```

**Multi-Tenant & Multi-Role Behavior**:
- **New User**: Creates new account and links to tenant.
- **Existing User (Same Tenant)**:
  - If requested role already exists: Performs **Signup as Login** (returns tokens).
  - If requested role is NEW: Adds the new role to the user's profile in the tenant (requires valid invitation code for non-`user` roles).
- **Existing User (Different Tenant)**: Links the account to the new tenant (Global SSO).
- **Security**: Account linking and role addition always require the correct password.

**Response (201 Created):**

```json
{
    "status": true,
    "message": "User registered successfully",
    "data": {
        "user_id": "uuid-here",
        "access_token": "..." 
    }
}
```

### Login

```http
POST /auth/login
X-API-Key: your-api-key
Content-Type: application/json

{
    "email_or_username": "john@example.com",
    "password": "StrongPassword123!",
    "role": "user" // Optional: Selects a specific role. Returns 404 if user doesn't have it.
}
```

**Role Selection Logic**:
- If `role` is provided: Validates that the user has that specific role in the tenant.
- If `role` is omitted:
  - Defaults to `user` role if available.
  - Otherwise, picks the first assigned role for the tenant.
```

**Response (200 OK):**

```json
{
    "status": true,
    "message": "Login successful",
    "data": {
        "access_token": "eyJhbGciOiJIUzI1NiIs..."
    }
}
```

**Note:** A refresh token is also set as an `HTTP-only`, `Secure`, `SameSite=None` cookie.
If `COOKIE_DOMAIN` is configured, it will be scoped to that domain (e.g., `.example.com`), allowing access from subdomains.

### Refresh Token

```http
POST /auth/refresh
X-API-Key: your-api-key
```

The refresh token is read from cookies automatically.

**Response (200 OK):**

```json
{
    "status": true,
    "data": {
        "access_token": "eyJhbGciOiJIUzI1NiIs..."
    }
}
```

### Verify Token

```http
GET /auth/verify
X-API-Key: your-api-key
Authorization: Bearer {access_token}
```

**Response (200 OK):**

```json
{
    "status": true,
    "data": {
        "user": {
            "id": "uuid-here",
            "username": "johndoe",
            "email": "john@example.com",
            "role": "admin", // Dynamic role based on tenant context
            "tenant_id": "tenant-uuid"
        }
    }
}
```

### Logout

```http
POST /auth/logout
X-API-Key: your-api-key
Authorization: Bearer {access_token}
```

**Response (200 OK):**

```json
{
    "status": true,
    "message": "Logged out successfully"
}
```

### SSO Logout (Browser)

For browser-based logout with cookie clearing:

```http
GET /auth/sso/logout
```

This endpoint clears the refresh token cookie and can redirect users.

### Reset Password

```http
PUT /auth/reset
X-API-Key: your-api-key
Authorization: Bearer {access_token}
Content-Type: application/json

{
    "current_password": "OldPassword123!",
    "new_password": "NewPassword456!"
}
```

**Response (200 OK):**

```json
{
    "status": true,
    "message": "Password changed successfully"
}
```

---

## User Endpoints

All user endpoints require JWT authentication.

### Get Current User

```http
GET /api/users/me
Authorization: Bearer {access_token}
```

### List Users

```http
GET /api/users
Authorization: Bearer {access_token}
```

### Get User by ID

```http
GET /api/users/{user_id}
Authorization: Bearer {access_token}
```

### Update User

```http
PUT /api/users/{user_id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
    "username": "newusername",
    "email": "newemail@example.com"
}
```

### Delete User (Soft Delete)

```http
DELETE /api/users/{user_id}
Authorization: Bearer {access_token}
```

---

## MQTT Endpoints

All MQTT endpoints require `X-API-Key` header for authentication and are used to manage MQTT user credentials and permissions.

### Create MQTT User

```http
POST /mqtt/create
X-API-Key: your-api-key
Content-Type: application/json

{
    "username": "mqtt_user",
    "password": "secure_password",
    "is_superuser": false
}
```

**Response (201 Created):**

```json
{
    "status": true,
    "message": "MQTT user created successfully",
    "data": {
        "username": "mqtt_user",
        "is_superuser": false
    }
}
```

### Check MQTT Credentials

```http
POST /mqtt/check
X-API-Key: your-api-key
Content-Type: application/json

{
    "username": "mqtt_user",
    "password": "secure_password"
}
```

**Response (200 OK - Success):**

```json
{
    "status": true,
    "message": "Credentials verified",
    "result": "allow"
}
```

**Response (401 Unauthorized - Invalid credentials):**

```json
{
    "status": false,
    "message": "Authentication failed",
    "result": "deny"
}
```

### Check MQTT ACL (Access Control List)

```http
POST /mqtt/acl
X-API-Key: your-api-key
Content-Type: application/json

{
    "username": "mqtt_user",
    "topic": "users/data/sensor",
    "access": 1
}
```

**Access Types:**
- `1` = Subscribe
- `2` = Publish
- `3` = Subscribe + Publish

**Response (200 OK - Authorized):**

```json
{
    "status": true,
    "message": "Access allowed",
    "result": "allow"
}
```

**Response (403 Forbidden - Not authorized):**

```json
{
    "status": false,
    "message": "Access denied",
    "result": "deny"
}
```

### List MQTT Users

```http
GET /mqtt
X-API-Key: your-api-key
```

**Response (200 OK):**

```json
{
    "status": true,
    "message": "MQTT users retrieved successfully",
    "data": [
        {
            "username": "mqtt_user1",
            "is_superuser": false,
            "created_at": "2024-01-15T10:30:00Z"
        },
        {
            "username": "mqtt_user2",
            "is_superuser": true,
            "created_at": "2024-01-16T14:22:00Z"
        }
    ]
}
```

### Delete MQTT User

```http
DELETE /mqtt/{username}
X-API-Key: your-api-key
```

**Response (200 OK):**

```json
{
    "status": true,
    "message": "MQTT user deleted successfully"
}
```

**Response (404 Not Found):**

```json
{
    "status": false,
    "message": "MQTT user not found"
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
    "status": false,
    "message": "Description of the error"
}
```

### With Validation Details

```json
{
    "status": false,
    "message": "Validation Error",
    "details": [
        {
            "field": "email",
            "message": "Invalid email format"
        }
    ]
}
```

### Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request (malformed JSON) |
| `401` | Unauthorized (missing/invalid credentials) |
| `403` | Forbidden (account banned or insufficient permissions) |
| `404` | Not Found |
| `409` | Conflict (duplicate email/username) |
| `415` | Unsupported Media Type (missing Content-Type) |
| `422` | Validation Error |
| `429` | Too Many Requests (rate limited) |
| `500` | Internal Server Error |

---

## Rate Limiting

The API implements rate limiting to prevent abuse:

| Setting | Default Value |
|---------|---------------|
| Max Requests | 5 per window |
| Window Duration | 15 minutes |
| Block Duration | 30 minutes |

When rate limited:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 1800

{
    "status": false,
    "message": "Too Many Requests"
}
```

---

## Next Steps

→ [Troubleshooting](./07-troubleshooting.md) - Common issues and solutions
