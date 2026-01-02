# ENDPOINT: GET /auth/verify

## Description
Verify JWT token and return user data.

## Test Scenarios

### 1. Missing Authorization header
- **URL**: `http://localhost:5500/auth/verify`
- **Method**: `GET`
- **Pre-conditions**: Header missing.
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

### 2. Malformed Authorization header
- **URL**: `http://localhost:5500/auth/verify`
- **Method**: `GET`
- **Pre-conditions**: Header value "InvalidTokenString" (Missing Bearer prefix).
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

### 3. Invalid JWT format
- **URL**: `http://localhost:5500/auth/verify`
- **Method**: `GET`
- **Pre-conditions**: Invalid JWT string.
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

### 4. Expired JWT
- **URL**: `http://localhost:5500/auth/verify`
- **Method**: `GET`
- **Pre-conditions**: Token has expired.
- **Request Body**: None.
- **Expected Response**:
  ```json
  {
    "status": false,
    "message": "Token expired"
  }
  ```
  *(Status: 401)*
- **Side Effects**: None.

### 5. Security: NBF (Not Before) Check
- **URL**: `http://localhost:5500/auth/verify`
- **Method**: `GET`
- **Pre-conditions**: Token nbf claim is in future.
- **Request Body**: None.
- **Expected Response**: Status 401.
- **Side Effects**: None.

### 6. Security: Cross-Tenant Check (Deprecated/Relaxed)
- **Note**: With API Key requirement removed for this endpoint, this check is no longer enforced by API Key Middleware. Token validity is the only requirement.
- **Expected Response**: Status 200 (if token is valid).

### 7. User deleted but token still valid
- **URL**: `http://localhost:5500/auth/verify`
- **Method**: `GET`
- **Pre-conditions**: User deleted from DB but JWT signature valid.
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

### 8. Successful verification
- **URL**: `http://localhost:5500/auth/verify`
- **Method**: `GET`
- **Pre-conditions**:
  - Valid JWT Access Token.
- **Request Body**: None.
- **Expected Response**:
  ```json
  {
    "status": true,
    "message": "Token is valid",
    "data": {
      "id": "uuid",
      "username": "...",
      "email": "...",
      "role": "...",
        ...
    }
  }
  ```
  *(Status: 200)*
- **Side Effects**: None.

### 9. Successful verification without API Key
- **URL**: `http://localhost:5500/auth/verify`
- **Method**: `GET`
- **Pre-conditions**: Valid JWT Access Token. No X-API-Key header.
- **Expected Response**: Status 200.
