# ENDPOINT: DELETE /mqtt/{username}

## Description
Soft deletes an MQTT user.

## Test Scenarios

### 1. Missing API Key
- **URL**: `http://localhost:5500/mqtt/user1`
- **Method**: `DELETE`
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

### 2. Successful Deletion
- **URL**: `http://localhost:5500/mqtt/user1`
- **Method**: `DELETE`
- **Pre-conditions**: User exists.
- **Expected Response**:
  ```json
  {
    "status": true,
    "message": "MQTT User deleted successfully"
  }
  ```
  *(Status: 200)*
- **Side Effects**: User is marked as deleted in the database.

### 3. User Not Found
- **URL**: `http://localhost:5500/mqtt/non_existent`
- **Method**: `DELETE`
- **Pre-conditions**: None.
- **Expected Response**:
  ```json
  {
    "status": false,
    "message": "MQTT User not found"
  }
  ```
  *(Status: 404)*
- **Side Effects**: None.

### 4. Delete Already Deleted User (Idempotency)
- **URL**: `http://localhost:5500/mqtt/user1`
- **Method**: `DELETE`
- **Pre-conditions**: User already soft-deleted.
- **Expected Response**:
  ```json
  {
    "status": false,
    "message": "MQTT User not found"
  }
  ```
  *(Status: 404)*
- **Side Effects**: None.
