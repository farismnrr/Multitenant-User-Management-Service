# ENDPOINT: POST /mqtt/check

## Description
Authenticates MQTT client credentials.
**Unique Response Structure:** Includes `result` field (`allow`, `deny`, `ignore`) alongside standard API fields.
**Note:** `details` field is ONLY present in 422 (Unprocessable Entity) responses.

## Test Scenarios

### 1. Successful Login (Allow)
- **URL**: `http://localhost:5500/mqtt/check`
- **Method**: `POST`
- **Pre-conditions**: Valid user and password.
- **Request Body**:
  ```json
  {
    "username": "valid_user",
    "password": "CorrectPassword123!"
  }
  ```
- **Expected Response**:
  ```json
  {
    "status": true,
    "message": "Authentication successful",
    "data": {
      "is_superuser": false
    },
    "result": "allow"
  }
  ```
  *(Status: 200)*

### 2. Invalid Password (Deny)
- **URL**: `http://localhost:5500/mqtt/check`
- **Method**: `POST`
- **Pre-conditions**: Valid user, wrong password.
- **Request Body**:
  ```json
  {
    "username": "valid_user",
    "password": "WrongPassword"
  }
  ```
- **Expected Response**:
  ```json
  {
    "status": true,
    "message": "Invalid information",
    "result": "deny"
  }
  ```
  *(Status: 200)*

### 3. User Not Found (Ignore)
- **URL**: `http://localhost:5500/mqtt/check`
- **Method**: `POST`
- **Pre-conditions**: User does not exist.
- **Request Body**:
  ```json
  {
    "username": "unknown_user",
    "password": "any"
  }
  ```
- **Expected Response**:
  ```json
  {
    "status": true,
    "message": "User not found",
    "result": "ignore"
  }
  ```
  *(Status: 200)*

### 4. Superuser Login (Allow + Flag)
- **URL**: `http://localhost:5500/mqtt/check`
- **Method**: `POST`
- **Pre-conditions**: User is superuser.
- **Request Body**:
  ```json
  {
    "username": "admin_user",
    "password": "AdminPassword123!"
  }
  ```
- **Expected Response**:
  ```json
  {
    "status": true,
    "message": "Authentication successful",
    "data": {
      "is_superuser": true
    },
    "result": "allow"
  }
  ```
  *(Status: 200)*

### 5. Validation Error (Missing Password)
- **URL**: `http://localhost:5500/mqtt/check`
- **Method**: `POST`
- **Pre-conditions**: None.
- **Request Body**:
  ```json
  {
    "username": "valid_user"
    // missing password
  }
  ```
- **Expected Response**:
  ```json
  {
    "status": false,
    "message": "Validation error",
    "details": [
      {
        "field": "password",
        "message": "Password is required"
      }
    ],
    "result": "ignore"
  }
  ```
  *(Status: 422)*
