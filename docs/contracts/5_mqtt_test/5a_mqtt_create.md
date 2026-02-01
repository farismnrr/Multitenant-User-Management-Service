# ENDPOINT: POST /mqtt/create

## Description
Creates a new MQTT user in the system.

## Test Scenarios

### 1. Missing API Key
- **URL**: `http://localhost:5500/mqtt/create`
- **Method**: `POST`
- **Pre-conditions**: None.
- **Request Body**:
  ```json
  {
    "username": "new_user",
    "password": "password123",
    "is_superuser": false
  }
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

### 2. Successful Creation
- **URL**: `http://localhost:5500/mqtt/create`
- **Method**: `POST`
- **Pre-conditions**: api key valid.
- **Request Body**:
  ```json
  {
    "username": "new_mqtt_user",
    "password": "SecurePassword123!",
    "is_superuser": false
  }
  ```
- **Expected Response**:
  ```json
  {
    "status": true,
    "message": "MQTT User created successfully",
    "data": {
      "username": "new_mqtt_user",
      "is_superuser": false
    }
  }
  ```
  *(Status: 201)*
- **Side Effects**: User is stored in the SSO database.

### 3. Missing Required Fields
- **URL**: `http://localhost:5500/mqtt/create`
- **Method**: `POST`
- **Pre-conditions**: None.
- **Request Body**:
  ```json
  {
    "username": "user_missing_pw"
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
    ]
  }
  ```
  *(Status: 400)*
- **Side Effects**: None.

### 4. Invalid Username Format (Special Characters)
- **URL**: `http://localhost:5500/mqtt/create`
- **Method**: `POST`
- **Pre-conditions**: None.
- **Request Body**:
  ```json
  {
    "username": "invalid/user name",
    "password": "SecurePassword123!",
    "is_superuser": false
  }
  ```
- **Expected Response**:
  ```json
  {
    "status": false,
    "message": "Validation error",
    "details": [
      {
        "field": "username",
        "message": "Username contains invalid characters"
      }
    ]
  }
  ```
  *(Status: 422)*
- **Side Effects**: None.

### 5. Weak Password
- **URL**: `http://localhost:5500/mqtt/create`
- **Method**: `POST`
- **Pre-conditions**: None.
- **Request Body**:
  ```json
  {
    "username": "weak_pw_user",
    "password": "123",
    "is_superuser": false
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
        "message": "Password is too weak"
      }
    ]
  }
  ```
  *(Status: 422)*
- **Side Effects**: None.

### 6. Invalid is_superuser Type
- **URL**: `http://localhost:5500/mqtt/create`
- **Method**: `POST`
- **Pre-conditions**: None.
- **Request Body**:
  ```json
  {
    "username": "bad_type_user",
    "password": "SecurePassword123!",
    "is_superuser": "not_a_bool"
  }
  ```
- **Expected Response**:
  ```json
  {
    "status": false,
    "message": "Validation error",
    "details": [
      {
        "field": "is_superuser",
        "message": "Invalid type"
      }
    ]
  }
  ```
  *(Status: 400)*
- **Side Effects**: None.

### 7. Duplicate Username
- **URL**: `http://localhost:5500/mqtt/create`
- **Method**: `POST`
- **Pre-conditions**: User with same username already exists.
- **Request Body**:
  ```json
  {
    "username": "existing_user",
    "password": "SecurePassword123!",
    "is_superuser": false
  }
  ```
- **Expected Response**:
  ```json
  {
    "status": false,
    "message": "Username already exists"
  }
  ```
  *(Status: 409)*
- **Side Effects**: None.

### 8. Create Superuser (Successful)
- **URL**: `http://localhost:5500/mqtt/create`
- **Method**: `POST`
- **Pre-conditions**: Valid API key.
- **Request Body**:
  ```json
  {
    "username": "admin_mqtt",
    "password": "SecureAdmin123!",
    "is_superuser": true
  }
  ```
- **Expected Response**:
  ```json
  {
    "status": true,
    "message": "MQTT User created successfully",
    "data": {
      "username": "admin_mqtt",
      "is_superuser": true
    }
  }
  ```
  *(Status: 201)*
- **Side Effects**: User stored with superuser privileges.
