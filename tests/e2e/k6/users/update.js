/**
 * =============================================================================
 * ENDPOINT: PUT /users
 * =============================================================================
 * 
 * Description: Update current user information (from JWT)
 * 
 * URL: http://localhost:5500/users
 * Method: PUT
 * 
 * Headers:
 *   - Content-Type: application/json
 *   - Authorization: Bearer <access_token>
 * 
 * Request Body (all fields optional):
 *   {
 *     "username": "string" | null,
 *     "email": "string" | null,
 *     "password": "string" | null,
 *     "role": "string" | null
 *   }
 * 
 * Success Response (200):
 *   {
 *     "success": true,
 *     "message": "User updated successfully",
 *     "data": {
 *       "id": "uuid"
 *     }
 *   }
 * 
 * Error Responses:
 *   - 400 Bad Request: Invalid email format, invalid data types
 *   - 401 Unauthorized: Missing JWT, invalid JWT
 *   - 409 Conflict: Duplicate email or username
 * 
 * Notes:
 *   - Requires valid JWT Bearer token
 *   - All fields are optional (partial update)
 *   - Returns only user ID
 *   - Does NOT require API key
 * 
 * Test Scenarios:
 *   1. Successful update with valid data
 *   2. Partial update (only some fields)
 *   3. Update with duplicate email
 *   4. Update with duplicate username
 *   5. Update without JWT
 *   6. Update with invalid email format
 *   7. Update with invalid data types
 * 
 * =============================================================================
 */

import http from 'k6/http';
import { sleep } from 'k6';
import { BASE_URL, options, headers } from '../config.js';
import { getTestTenantId } from '../utils.js';
import {
    randomEmail,
    randomUsername,
    extractAccessToken,
    extractUserId,
    checkSuccess,
    checkError,
    shortSleep,
    registerTestUser
} from '../utils.js';

export { options };

export default function () {
    const loginUrl = `${BASE_URL}/api/auth/login`;
    const updateUserUrl = `${BASE_URL}/users`;

    // Setup: Create two test users
    const tenantId = getTestTenantId();
    const testUser1 = registerTestUser(tenantId, 'user');
    sleep(shortSleep());
    const testUser2 = registerTestUser(tenantId, 'user');
    sleep(shortSleep());

    // Login with first user
    const loginPayload = {
        email_or_username: testUser1.email,
        password: testUser1.password,
    };

    const loginResponse = http.post(loginUrl, JSON.stringify(loginPayload), { headers });
    const accessToken = extractAccessToken(loginResponse);
    sleep(shortSleep());

    const validHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
    };

    /**
     * Test Case: Successful update with valid data
     * URL: {apiUrl}/users
     * Body: { username, email }
     * Auth: Bearer <valid_jwt>
     * Expected: {
     *   "success": true,
     *   "message": "User updated successfully",
     *   "data": { "id": "uuid" }
     * }
     */
    const updatePayload = {
        username: randomUsername(),
        tenant_id: tenantId,
        role: "user",
        email: randomEmail(),
    };
    let response = http.put(updateUserUrl, JSON.stringify(updatePayload), { headers: validHeaders });
    checkSuccess(response, 200, 'updated successfully', 'Test 1: Successful update with valid data');

    const userId = extractUserId(response);
    console.log(`User ID returned: ${userId ? 'Yes' : 'No'}`);
    sleep(shortSleep());

    /**
     * Test Case: Partial update
     * URL: {apiUrl}/users
     * Body: { username }
     * Auth: Bearer <valid_jwt>
     * Expected: {
     *   "success": true,
     *   "message": "User updated successfully",
     *   "data": { "id": "uuid" }
     * }
     */
    const partialUpdate = {
        username: randomUsername(),
        tenant_id: tenantId,
        role: "user",
    };
    response = http.put(updateUserUrl, JSON.stringify(partialUpdate), { headers: validHeaders });
    checkSuccess(response, 200, null, 'Test 2: Partial update (only username)');
    sleep(shortSleep());

    /**
     * Test Case: Update with duplicate email
     * URL: {apiUrl}/users
     * Body: { email: <existing_email> }
     * Auth: Bearer <valid_jwt>
     * Expected (409): {
     *   "success": false,
     *   "message": "Email already exists"
     * }
     */
    const duplicateEmailUpdate = {
        email: testUser2.email, // Email from second user
    };
    response = http.put(updateUserUrl, JSON.stringify(duplicateEmailUpdate), { headers: validHeaders });
    checkError(response, 409, 'email', 'Test 3: Update with duplicate email');
    sleep(shortSleep());

    /**
     * Test Case: Update with duplicate username
     * URL: {apiUrl}/users
     * Body: { username: <existing_username> }
     * Auth: Bearer <valid_jwt>
     * Expected (409): {
     *   "success": false,
     *   "message": "Username already exists"
     * }
     */
    const duplicateUsernameUpdate = {
        username: testUser2.username, // Username from second user
    };
    response = http.put(updateUserUrl, JSON.stringify(duplicateUsernameUpdate), { headers: validHeaders });
    checkError(response, 409, 'username', 'Test 4: Update with duplicate username');
    sleep(shortSleep());

    /**
     * Test Case: Update without JWT
     * URL: {apiUrl}/users
     * Body: { username, email }
     * Auth: None
     * Expected (401): {
     *   "success": false,
     *   "message": "Missing authentication token"
     * }
     */
    const noAuthHeaders = {
        'Content-Type': 'application/json',
    };
    response = http.put(updateUserUrl, JSON.stringify(updatePayload), { headers: noAuthHeaders });
    checkError(response, 401, null, 'Test 5: Update without JWT');
    sleep(shortSleep());

    /**
     * Test Case: Update with invalid email format
     * URL: {apiUrl}/users
     * Body: { email: 'invalid-email-format' }
     * Auth: Bearer <valid_jwt>
     * Expected (422): {
     *   "success": false,
     *   "message": "Invalid email format"
     * }
     */
    const invalidEmailUpdate = {
        email: 'invalid-email-format',
    };
    response = http.put(updateUserUrl, JSON.stringify(invalidEmailUpdate), { headers: validHeaders });
    checkError(response, 422, null, 'Test 6: Update with invalid email format');
    sleep(shortSleep());

    /**
     * Test Case: Update with invalid data types
     * URL: {apiUrl}/users
     * Body: { username: <integer> } (should be string)
     * Auth: Bearer <valid_jwt>
     * Expected (422): {
     *   "success": false,
     *   "message": "Invalid data type"
     * }
     */
    const invalidDataUpdate = {
        username: 12345, // Should be string
    };
    response = http.put(updateUserUrl, JSON.stringify(invalidDataUpdate), { headers: validHeaders });
    checkError(response, 400, null, 'Test 7: Update with invalid data types'); // Json deserialize error is 400
    sleep(shortSleep());
}
