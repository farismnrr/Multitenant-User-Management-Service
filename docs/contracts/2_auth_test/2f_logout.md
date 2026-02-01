# ENDPOINT: DELETE /auth/logout

## Description
Clear refresh token cookie (logout).

## Test Scenarios

### 1. Logout without JWT token
- **URL**: `http://localhost:5500/auth/logout`
- **Method**: `DELETE`
- **Pre-conditions**: None.
- **Request Body**: None.
- **Expected Response**:
  ```json
  {
    "status": false,
    "message": "Unauthorized"
  }
  ```
  *(Status: 401 - if strict mode)*
- **Side Effects**: None.

### 2. Logout with invalid JWT token
- **URL**: `http://localhost:5500/auth/logout`
- **Method**: `DELETE`
- **Pre-conditions**: Invalid JWT.
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

### 3. Successful logout
- **URL**: `http://localhost:5500/auth/logout`
- **Method**: `DELETE`
- **Pre-conditions**:
  - User logged in (cookie present).
  - Valid JWT (optional but good practice).
- **Request Body**: None.
- **Expected Response**:
  ```json
  {
    "status": true,
    "message": "Logged out successfully"
  }
  ```
  *(Status: 200)*
- **Side Effects**:
  - Cookie cleared (Max-Age=0).
  - Token blacklisted/removed from DB.

### 4. Idempotency: Double Logout
- **URL**: `http://localhost:5500/auth/logout`
- **Method**: `DELETE`
- **Pre-conditions**: Token already invalidated.
- **Request Body**: None.
- **Expected Response**:
  Status: 200 OK or 401 Unauthorized. One of these, but NO 500 error.
- **Side Effects**: None.

### 5. Security: Logout invalidates refresh token
- **URL**: `http://localhost:5500/auth/refresh` (Verification Call)
- **Method**: `GET`
- **Pre-conditions**: Logout performed. Use old cookie.
- **Request Body**: None.
- **Expected Response**: 401 Unauthorized.
- **Side Effects**: None.
