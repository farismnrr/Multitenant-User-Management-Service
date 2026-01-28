# ENDPOINT: POST /mqtt/acl

## Description
Checks MQTT authorization permissions.
**Unique Response Structure:** Includes `result` field (`allow`, `deny`, `ignore`) alongside standard API fields.
**Note:** `details` field is ONLY present in 422 (Unprocessable Entity) responses.

## Test Scenarios

### 1. Authorized Access (Allow)
- **URL**: `http://localhost:5500/mqtt/acl`
- **Method**: `POST`
- **Pre-conditions**:
  - User exists.
  - Access matches permission rules.
- **Request Body**:
  ```json
  {
    "username": "user1",
    "topic": "users/user1/data",
    "access": "publish"
  }
  ```
- **Expected Response**:
  ```json
  {
    "status": true,
    "message": "Authorization successful",
    "result": "allow"
  }
  ```
  *(Status: 200)*
- **Side Effects**: None.

### 2. Unauthorized Access (Deny)
- **URL**: `http://localhost:5500/mqtt/acl`
- **Method**: `POST`
- **Pre-conditions**:
  - User exists.
  - Access violates permission rules.
- **Request Body**:
  ```json
  {
    "username": "user1",
    "topic": "users/user2/data",
    "access": "publish"
  }
  ```
- **Expected Response**:
  ```json
  {
    "status": true,
    "message": "Permission denied",
    "result": "deny"
  }
  ```
  *(Status: 200)*
- **Side Effects**: None.

### 3. Superuser Access (Allow)
- **URL**: `http://localhost:5500/mqtt/acl`
- **Method**: `POST`
- **Pre-conditions**: User is superuser.
- **Request Body**:
  ```json
  {
    "username": "admin",
    "topic": "restricted/system/logs",
    "access": "subscribe"
  }
  ```
- **Expected Response**:
  ```json
  {
    "status": true,
    "message": "Superuser authorized",
    "result": "allow"
  }
  ```
  *(Status: 200)*
- **Side Effects**: None.

### 4. Validation Error (Missing Topic)
- **URL**: `http://localhost:5500/mqtt/acl`
- **Method**: `POST`
- **Pre-conditions**: None.
- **Request Body**:
  ```json
  {
    "username": "user1",
    "access": "publish"
    // missing topic
  }
  ```
- **Expected Response**:
  ```json
  {
    "status": false,
    "message": "Validation error",
    "details": [
      {
        "field": "topic",
        "message": "Topic is required"
      }
    ],
    "result": "ignore"
  }
  ```
  *(Status: 422)*
- **Side Effects**: None.
