# ENDPOINT: PUT /api/users/details

## Description
Update current user's extended details.

## Test Scenarios

### 1. Update without JWT
- **URL**: `http://localhost:5500/api/users/details`
- **Method**: `PUT`
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

### 2. Security: Stored XSS in Profile Fields
- **URL**: `http://localhost:5500/api/users/details`
- **Method**: `PUT`
- **Pre-conditions**: Valid JWT.
- **Request Body**:
  ```json
  {
    "first_name": "<img src=x onerror=alert(1)>",
    "last_name": "Smith",
    "address": "javascript:alert(1)"
  }
  ```
- **Expected Response**:
  - 422 Validation Error (Preferred)
  - OR 200 OK with sanitized/escaped output.
- **Side Effects**: None or sanitized.

### 3. Security: SQL Injection in Fields
- **URL**: `http://localhost:5500/api/users/details`
- **Method**: `PUT`
- **Pre-conditions**: Valid JWT.
- **Request Body**:
  ```json
  {
    "last_name": "O'Connor'; DROP TABLE users; --"
  }
  ```
- **Expected Response**:
  - 200 OK (Data treated as literal string)
  - OR 422 Validation Error.
  - **Critical**: Must NOT execute SQL.
- **Side Effects**: None.

### 4. Input Length Validation (Buffer Overflow / DoS)
- **URL**: `http://localhost:5500/api/users/details`
- **Method**: `PUT`
- **Pre-conditions**: Valid JWT.
- **Request Body**:
  ```json
  { "address": "<10MB_of_text>" }
  ```
- **Expected Response**:
  - 413 Payload Too Large or 422 Validation Error.
- **Side Effects**: None.

### 5. Update with invalid phone format
- **URL**: `http://localhost:5500/api/users/details`
- **Method**: `PUT`
- **Pre-conditions**: Valid JWT.
- **Request Body**:
  ```json
  { "phone": "invalid-phone" }
  ```
- **Expected Response**:
  ```json
  {
    "status": false,
    "message": "Validation Error"
  }
  ```
  *(Status: 400 or 422 - if validation exists)*
- **Side Effects**: None.

### 6. Update user details
- **URL**: `http://localhost:5500/api/users/details`
- **Method**: `PUT`
- **Pre-conditions**:
  - Valid JWT.
- **Request Body**:
  ```json
  {
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890",
    "address": "123 Main St"
  }
  ```
- **Expected Response**:
  ```json
  {
    "status": true,
    "message": "User details updated successfully",
    "data": { "id": "uuid" }
  }
  ```
  *(Status: 200)*
- **Side Effects**:
  - User details row updated/inserted.
