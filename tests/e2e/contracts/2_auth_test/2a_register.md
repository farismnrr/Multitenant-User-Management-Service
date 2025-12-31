# ENDPOINT: POST /auth/register

## Description
Register a new user account.

## Test Scenarios

### 1. Missing API key
- **URL**: `http://localhost:5500/auth/register`
- **Method**: `POST`
- **Pre-conditions**: None.
- **Request Body**:
  ```json
  { "username": "...", "email": "...", "password": "...", "role": "user" }
  ```
- **Expected Response**:
  ```json
  {
    "status": false,
    "message": "Unauthorized"
  }
  ```
  *(Status: 401)*
- **Side Effects**: None.

### 2. Invalid email format
- **URL**: `http://localhost:5500/auth/register`
- **Method**: `POST`
- **Pre-conditions**: None.
- **Request Body**:
  ```json
  {
    "username": "<unique_username>",
    "email": "not-an-email",
    "password": "StrongPassword123!",
    "role": "user"
  }
  ```
- **Expected Response**:
  ```json
  {
    "status": false,
    "message": "Validation Error / Bad Request"
  }
  ```
  *(Status: 422 Unprocessable Entity)*
- **Side Effects**: None.

### 3. Missing required fields
- **URL**: `http://localhost:5500/auth/register`
- **Method**: `POST`
- **Pre-conditions**: None.
- **Request Body**:
  ```json
  {
    "username": "user",
    "email": "user@mail.com"
    // Missing password
  }
  ```
- **Expected Response**:
  ```json
  {
    "status": false,
    "message": "Missing required fields"
  }
  ```
  *(Status: 400 Bad Request)*
- **Side Effects**: None.

### 4. Weak password
- **URL**: `http://localhost:5500/auth/register`
- **Method**: `POST`
- **Pre-conditions**: None.
- **Request Body**:
  ```json
  {
    "username": "<unique_username>",
    "email": "<unique_email>",
    "password": "123",
    "role": "user"
  }
  ```
- **Expected Response**:
  ```json
  {
    "status": false,
    "message": "Validation Error (Password too weak)"
  }
  ```
  *(Status: 400 or 422)*
- **Side Effects**: None.

### 5. Validation: Username with invalid chars
- **URL**: `http://localhost:5500/auth/register`
- **Method**: `POST`
- **Pre-conditions**: None.
- **Request Body**:
  ```json
  {
    "username": "User Name",
    "email": "<unique_email>",
    "password": "StrongPassword123!",
    "role": "user"
  }
  ```
- **Expected Response**:
  ```json
  {
    "status": false,
    "message": "Validation Error"
  }
  ```
  *(Status: 422)*
- **Side Effects**: None.

### 6. Validation: Username using reserved words
- **URL**: `http://localhost:5500/auth/register`
- **Method**: `POST`
- **Pre-conditions**: None.
- **Request Body**:
  ```json
  {
    "username": "admin",
    "email": "<unique_email>",
    "password": "StrongPassword123!",
    "role": "user"
  }
  ```
- **Expected Response**:
  ```json
  {
    "status": false,
    "message": "Validation Error / Reserved Username"
  }
  ```
  *(Status: 400 or 409)*
- **Side Effects**: None.

### 7. Validation: Invalid Role
- **URL**: `http://localhost:5500/auth/register`
- **Method**: `POST`
- **Pre-conditions**: None.
- **Request Body**:
  ```json
  {
    "username": "<unique_username>",
    "email": "<unique_email>",
    "password": "StrongPassword123!",
    "role": "GOD_MODE"
  }
  ```
- **Expected Response**:
  ```json
  {
    "status": false,
    "message": "Bad Request"
  }
  ```
  *(Status: 400)*
- **Side Effects**: None.

### 8. Validation: Password too long
- **URL**: `http://localhost:5500/auth/register`
- **Method**: `POST`
- **Pre-conditions**: None.
- **Request Body**:
  ```json
  {
    "username": "<unique_username>",
    "email": "<unique_email>",
    "password": "<100+ chars>",
    "role": "user"
  }
  ```
- **Expected Response**:
  ```json
  {
    "status": false,
    "message": "Validation Error",
    "details": [
      {
        "field": "password",
        "message": "Password too long"
      }
    ]
  }
  ```
  *(Status: 422)*
- **Side Effects**: None.

### 9. Successful registration
- **URL**: `http://localhost:5500/auth/register`
- **Method**: `POST`
- **Pre-conditions**:
  - Tenant must exist (`X-API-Key`).
- **Request Body**:
  ```json
  {
    "username": "<unique_username>",
    "email": "<unique_email>",
    "password": "StrongPassword123!",
    "role": "user"
  }
  ```
- **Expected Response**:
  ```json
  {
    "status": true,
    "message": "User registered successfully",
    "data": { "user_id": "<uuid>" }
  }
  ```
- **Side Effects**:
  - User record created.
  - Password hashed.

### 10. Duplicate email
- **URL**: `http://localhost:5500/auth/register`
- **Method**: `POST`
- **Pre-conditions**:
  - User with same email exists.
- **Request Body**:
  ```json
  {
    "username": "<unique_username>",
    "email": "<existing_email>",
    "password": "StrongPassword123!",
    "role": "user"
  }
  ```
- **Expected Response**:
  ```json
  {
    "status": false,
    "message": "Email already exists"
  }
  ```
  *(Status: 409 Conflict)*
- **Side Effects**: None.

### 11. Duplicate username
- **URL**: `http://localhost:5500/auth/register`
- **Method**: `POST`
- **Pre-conditions**:
  - User with same username exists.
- **Request Body**:
  ```json
  {
    "username": "<existing_username>",
    "email": "<unique_email>",
    "password": "StrongPassword123!",
    "role": "user"
  }
  ```
- **Expected Response**:
  ```json
  {
    "status": false,
    "message": "Username already exists"
  }
  ```
  *(Status: 409 Conflict)*
- **Side Effects**: None.

### 12. Edge Case: Email case sensitivity
- **URL**: `http://localhost:5500/auth/register`
- **Method**: `POST`
- **Pre-conditions**: `user@email.com` exists.
- **Request Body**:
  ```json
  {
    "username": "<unique>",
    "email": "User@Email.Com",
    "password": "...",
    "role": "user"
  }
  ```
- **Expected Response**:
  ```json
  {
    "status": false,
    "message": "Email already exists"
  }
  ```
  *(Status: 409)*
- **Side Effects**: None.

### 13. Validation: Invalid SSO State (Special Chars)
- **URL**: `http://localhost:5500/auth/register`
- **Method**: `POST`
- **Pre-conditions**: None.
- **Request Body**:
  ```json
  {
    "username": "<unique_username>",
    "email": "<unique_email>",
    "password": "StrongPassword123!",
    "role": "user",
    "state": "invalid_state!"
  }
  ```
- **Expected Response**:
  ```json
  {
    "status": false,
    "message": "Validation Error"
  }
  ```
  *(Status: 422)*
- **Side Effects**: None.

### 14. Validation: SSO Nonce Too Long
- **URL**: `http://localhost:5500/auth/register`
- **Method**: `POST`
- **Pre-conditions**: None.
- **Request Body**:
  ```json
  {
    "username": "<unique_username>",
    "email": "<unique_email>",
    "password": "StrongPassword123!",
    "role": "user",
    "nonce": "<129 chars>"
  }
  ```
- **Expected Response**:
  ```json
  {
    "status": false,
    "message": "Validation Error"
  }
  ```
  *(Status: 422)*
- **Side Effects**: None.

### 15. Validation: Invalid Redirect URI (Injection)
- **URL**: `http://localhost:5500/auth/register`
- **Method**: `POST`
- **Pre-conditions**: None.
- **Request Body**:
  ```json
  {
    "username": "<unique_username>",
    "email": "<unique_email>",
    "password": "StrongPassword123!",
    "role": "user",
    "redirect_uri": "https://example.com/<script>"
  }
  ```
- **Expected Response**:
  ```json
  {
    "status": false,
    "message": "Validation Error"
  }
  ```
  *(Status: 422)*
- **Side Effects**: None.

### 16. Validation: Redirect URI not in allowed origins
- **URL**: `http://localhost:5500/auth/register`
- **Method**: `POST`
- **Pre-conditions**: None.
- **Request Body**:
  ```json
  {
    "username": "<unique_username>",
    "email": "<unique_email>",
    "password": "StrongPassword123!",
    "role": "user",
    "redirect_uri": "https://evil-site.com/callback"
  }
  ```
- **Expected Response**:
  ```json
  {
    "status": false,
    "message": "Forbidden / not in allowed origins"
  }
  ```
  *(Status: 403)*
- **Side Effects**: None.

### 17. Strict User Uniqueness (Cross-Tenant)
- **Description**: Role 'user' MUST be unique globally across all tenants.
- **Pre-conditions**: User exists in Tenant A.
- **Request Body** (Tenant B):
  ```json
  {
    "username": "<existing_username>",
    "email": "<existing_email>",
    "password": "StrongPassword123!",
    "role": "user"
  }
  ```
- **Expected Response**:
  ```json
  {
    "status": false,
    "message": "Email/Username already exists"
  }
  ```
  *(Status: 409 Conflict)*

### 18. Linked Admin Registration (Cross-Tenant - Success)
- **Description**: Role 'admin' (or non-user) can register in new tenant if password matches existing account.
- **Pre-conditions**: Admin exists in Tenant A. Correct password provided.
- **Request Body** (Tenant B):
  ```json
  {
    "username": "<existing_admin>",
    "email": "<existing_email>",
    "password": "<CORRECT_PASSWORD>",
    "role": "admin"
  }
  ```
- **Expected Response**:
  ```json
  {
    "status": true,
    "message": "User registered successfully",
    "data": { "user_id": "<EXISTING_UUID>" }
  }
  ```
  *(Status: 201 Created)*
- **Side Effects**: User added to Tenant B with 'admin' role. Shared identity.

### 19. Linked Admin Registration (Cross-Tenant - Password Mismatch)
- **Description**: Role 'admin' registration fails if password does not match existing account.
- **Pre-conditions**: Admin exists in Tenant A. Wrong password provided.
- **Request Body** (Tenant B):
  ```json
  {
    "username": "<existing_admin>",
    "email": "<existing_email>",
    "password": "<WRONG_PASSWORD>",
    "role": "admin"
  }
  ```
- **Expected Response**:
  ```json
  {
    "status": false,
    "message": "Email/Username already exists"
  }
  ```
  *(Status: 409 Conflict)*
