# ENDPOINT: GET /api/tenants/{id}

## Description
Retrieve a specific tenant by ID.

## Test Scenarios

### 1. Get tenant without JWT
- **URL**: `http://localhost:5500/api/tenants/<tenant_id>`
- **Method**: `GET`
- **Pre-conditions**: None.
- **Request Body**: None.
- **Expected Response**:
  ```json
  {
    "status": false,
    "message": "Unauthorized"
  }
  ```
  *(Status: 401)*
- **Side Effects**: None.

### 2. Get non-existent tenant
- **URL**: `http://localhost:5500/api/tenants/<fake_id>`
- **Method**: `GET`
- **Pre-conditions**: None.
- **Request Body**: None.
- **Expected Response**:
  ```json
  {
    "status": false,
    "message": "Tenant not found"
  }
  ```
  *(Status: 404)*
- **Side Effects**: None.

### 3. Get tenant with invalid ID format
- **URL**: `http://localhost:5500/api/tenants/not-a-uuid`
- **Method**: `GET`
- **Pre-conditions**: None.
- **Request Body**: None.
- **Expected Response**:
  ```json
  {
    "status": false,
    "message": "Bad Request / Validation Error" // UUID parse error
  }
  ```
  *(Status: 400 or 404)*
- **Side Effects**: None.

### 4. Get existing tenant
- **URL**: `http://localhost:5500/api/tenants/<tenant_id>`
- **Method**: `GET`
- **Pre-conditions**:
  - Tenant exists.
  - Valid JWT.
- **Request Body**: None.
- **Expected Response**:
  ```json
  {
    "status": true,
    "message": "Tenant retrieved successfully",
    "data": {
      "id": "<tenant_id>",
      "name": "string",
      "description": "string",
      "is_active": true
    }
  }
  ```
  *(Status: 200)*
- **Side Effects**: None.
