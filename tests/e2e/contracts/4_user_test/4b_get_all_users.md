# ENDPOINT: GET /api/users/all

## Description
Retrieve all users (Admin/Manager role).

## Test Scenarios

### 1. Get all users without JWT
- **URL**: `http://localhost:5500/api/users/all`
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

### 2. Security: Unauthorized Role Access (RBAC)
- **URL**: `http://localhost:5500/api/users/all`
- **Method**: `GET`
- **Pre-conditions**:
  - Valid JWT with `user` role (not admin).
- **Request Body**: None.
- **Expected Response**:
  ```json
  {
    "status": false,
    "message": "Forbidden / Insufficient permissions"
  }
  ```
  *(Status: 403 Forbidden)*
- **Side Effects**: None.

### 3. Pagination Check (DoS Protection)
- **URL**: `http://localhost:5500/api/users/all?limit=1000000`
- **Method**: `GET`
- **Pre-conditions**: Valid JWT.
- **Request Body**: None.
- **Expected Response**:
  - API should either cap the limit (e.g., return max 50 or 100) or return an error.
  - Status: 200 (with capped results) or 400.
- **Side Effects**: None.

### 4. Get all users (Admin/Authorized Role)
- **URL**: `http://localhost:5500/api/users/all`
- **Method**: `GET`
- **Pre-conditions**:
  - Valid JWT with `admin` or appropriate role.
- **Request Body**: None.
- **Expected Response**:
  ```json
  {
    "status": true,
    "message": "Users retrieved successfully",
    "data": [
      {
        "id": "uuid",
        "username": "string",
        "email": "string"
        // Password/Sensitive fields MUST be missing
      }
    ]
  }
  ```
  *(Status: 200)*
- **Side Effects**: None.
