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
    "message": "Invalid email format"
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
    "message": "Password too weak"
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
    "message": "Invalid characters"
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
    "message": "Reserved Username"
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
    "message": "Password too long",
    "details": [
      {
        "field": "password",
        "message": "Password too long"      // User already in tenant. Instead of Conflict, allow "Signup as Login" 
            // since password was already verified in step 2.
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

### 10. Duplicate email (Correct Password - Signup as Login)
- **URL**: `http://localhost:5500/auth/register`
- **Method**: `POST`
- **Pre-conditions**:
  - User with same email exists in the same tenant.
  - Correct password provided.
- **Request Body**:
  ```json
  {
    "username": "<unique_username>",
    "email": "<existing_email>",
    "password": "<CORRECT_PASSWORD>",
    "role": "user"
  }
  ```
- **Expected Response**:
  ```json
  {
    "status": true,
    "message": "User registered successfully",
    "data": { "user_id": "<uuid>", "access_token": "..." }
  }
  ```
  *(Status: 200/201)*
- **Side Effects**: User authenticated and receives tokens.

### 10a. Duplicate email (Wrong Password)
- **URL**: `http://localhost:5500/auth/register`
- **Method**: `POST`
- **Pre-conditions**:
  - User with same email exists.
  - Wrong password provided.
- **Request Body**:
  ```json
  {
    "username": "<unique_username>",
    "email": "<existing_email>",
    "password": "<WRONG_PASSWORD>",
    "role": "user"
  }
  ```
- **Expected Response**:
  ```json
  {
    "status": false,
    "message": "Already registered in this tenant with role: user. Please sign in with your existing password."
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

### 12. Edge Case: Email case sensitivity (Signup as Login)
- **URL**: `http://localhost:5500/auth/register`
- **Method**: `POST`
- **Pre-conditions**: `user@email.com` exists.
- **Request Body**:
  ```json
  {
    "username": "<unique>",
    "email": "User@Email.Com",
    "password": "<CORRECT_PASSWORD>",
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
  *(Status: 201)*
- **Side Effects**: User authenticated.

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
    "message": "State parameter must be alphanumeric"
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
    "message": "Nonce parameter too long (max 128 chars)"
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
    "message": "Redirect URI contains invalid characters"
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
    "message": "Redirect URI not in allowed origins"
  }
  ```
  *(Status: 403)*
- **Side Effects**: None.

### 17. User Role Multi-Tenant SSO (Success)
- **Description**: Role 'user' can register in multiple tenants with same credentials (Global SSO).
- **Pre-conditions**: User with role 'user' exists in Tenant A.
- **Request Body** (Tenant B with different API key):
  ```json
  {
    "username": "<existing_user_username>",
    "email": "<existing_user_email>",
    "password": "<CORRECT_PASSWORD>",
    "role": "user"
  }
  ```
- **Expected Response**:
  ```json
  {
    "status": true,
    "message": "User registered successfully",
    "data": { "user_id": "<SAME_UUID_AS_TENANT_A>" }
  }
  ```
  *(Status: 201 Created)*
- **Side Effects**: User linked to Tenant B with 'user' role. Shared identity across tenants.
- **Verification**: Check `user_tenants` table has 2 entries for same user_id with different tenant_ids.

### 18. Multi-Tenant Role Linking with Password (Success)
- **Description**: User with existing account can register for different role in new tenant by providing correct password.
- **Pre-conditions**: User exists with role 'user' in Tenant A.
- **Request Body** (Tenant B with different API key):
  ```json
  {
    "username": "<existing_user_username>",
    "email": "<existing_user_email>",
    "password": "<CORRECT_PASSWORD>",
    "role": "admin",
    "invitation_code": "<VALID_CODE>"
  }
  ```
- **Expected Response**:
  ```json
  {
    "status": true,
    "message": "User registered successfully",
    "data": { "user_id": "<SAME_UUID>" }
  }
  ```
  *(Status: 201 Created)*
- **Side Effects**: User linked to Tenant B with 'admin' role. Same user_id, different role per tenant.
- **Verification**: Check `user_tenants` table has 2 entries for same user_id with different tenant_ids and roles.

### 19. Multi-Tenant Linking with Wrong Password (Conflict)
- **Description**: Registration with wrong password fails to prevent account hijacking.
- **Pre-conditions**: User exists in any tenant.
- **Request Body** (New tenant with different API key):
  ```json
  {
    "username": "<existing_username>",
    "email": "<existing_email>",
    "password": "<WRONG_PASSWORD>",
    "role": "admin",
    "invitation_code": "<VALID_CODE>"
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
- **Side Effects**: None. User NOT linked to new tenant.
- **Verification**: User tenants remain unchanged.
### 20. Multiple Role Registration (Success)
- **Description**: User already in a tenant can register for a different role in the SAME tenant by providing correct password and valid invitation code (if needed).
- **Pre-conditions**: User exists with role 'user' in Tenant A.
- **Request Body**:
  ```json
  {
    "username": "<existing_username>",
    "email": "<existing_email>",
    "password": "<CORRECT_PASSWORD>",
    "role": "admin",
    "invitation_code": "<VALID_CODE>",
    "tenant_id": "<TENANT_A_UUID>"
  }
  ```
- **Expected Response**:
  ```json
  {
    "status": true,
    "message": "User registered successfully",
    "data": { "user_id": "<uuid>", "access_token": "..." }
  }
  ```
  *(Status: 201 Created)*
- **Side Effects**: User now has both 'user' and 'admin' roles in Tenant A.
- **Verification**: Check `user_tenants` table has 2 entries for same user_id and same tenant_id but different roles.
