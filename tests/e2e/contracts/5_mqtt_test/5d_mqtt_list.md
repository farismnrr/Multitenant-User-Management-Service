# ENDPOINT: GET /mqtt

## Description
Retrieves a list of all MQTT users.

## Test Scenarios

### 1. Missing API Key
- **URL**: `http://localhost:5500/mqtt`
- **Method**: `GET`
- **Pre-conditions**: None.
- **Expected Response**:
  ```json
  {
    "status": false,
    "message": "Unauthorized"
  }
  ```
  *(Status: 401)*
- **Side Effects**: None.

### 2. Retrieve List (Empty)
- **URL**: `http://localhost:5500/mqtt`
- **Method**: `GET`
- **Pre-conditions**: No MQTT users exist.
- **Expected Response**:
  ```json
  {
    "status": true,
    "message": "User MQTT list retrieved successfully",
    "data": {
      "mqtt": []
    }
  }
  ```
  *(Status: 200)*
- **Side Effects**: None.

### 3. Retrieve List (Populated)
- **URL**: `http://localhost:5500/mqtt`
- **Method**: `GET`
- **Pre-conditions**: Users exist.
- **Expected Response**:
  ```json
  {
    "status": true,
    "message": "User MQTT list retrieved successfully",
    "data": {
      "mqtt": [
        {
          "username": "user1",
          "is_superuser": false,
          "is_deleted": false
        },
        {
          "username": "admin",
          "is_superuser": true,
          "is_deleted": false
        }
      ]
    }
  }
  ```
  *(Status: 200)*
- **Side Effects**: None.
