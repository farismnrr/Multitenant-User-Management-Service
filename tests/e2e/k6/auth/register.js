/**
 * =============================================================================
 * ENDPOINT: POST /auth/register
 * =============================================================================
 * 
 * Description: Register a new user account
 * 
 * URL: http://localhost:5500/auth/register
 * Method: POST
 * 
 * Headers:
 *   - Content-Type: application/json
 *   - X-API-Key: <api-key>
 * 
 * Request Body:
 *   {
 *     "username": "string",
 *     "email": "string",
 *     "password": "string",
 *     "role": "string"
 *   }
 * 
 * Success Response (201):
 *   {
 *     "success": true,
 *     "message": "User registered successfully",
 *     "data": {
 *       "id": "uuid",
 *       "access_token": "string"
 *     }
 *   }
 * 
 * Error Responses:
 *   - 400 Bad Request: Invalid email format, missing fields, weak password
 *   - 401 Unauthorized: Missing or invalid API key
 *   - 409 Conflict: Duplicate email or username
 * 
 * Test Scenarios:
 *   1. Successful registration
 *   2. Duplicate email
 *   3. Duplicate username
 *   4. Invalid email format
 *   5. Missing required fields
 *   6. Weak password (too short)
 *   7. Missing API key
 * 
 * =============================================================================
 */

import http from 'k6/http';
import { sleep } from 'k6';
import { options } from '../config.js';
import { BASE_URL, API_KEY } from '../config.js';
import { getTestTenantId } from '../utils.js';
import {
    randomEmail,
    randomUsername,
    randomPassword,
    checkSuccess,
    checkError,
    shortSleep
} from '../utils.js';

const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
};

export { options };

export default function () {
    const baseUrl = `${BASE_URL}/api/auth/register`;

    // Create test tenant
    const tenantId = getTestTenantId();

    const validPayload = {
        username: randomUsername(),
        email: randomEmail(),
        password: randomPassword(),
        tenant_id: tenantId,
        role: "user"
    };

    const duplicateEmailPayload = {
        username: randomUsername(),
        email: validPayload.email,
        password: randomPassword(),
        tenant_id: tenantId,
        role: "user"
    };

    const duplicateUsernamePayload = {
        username: validPayload.username,
        email: randomEmail(),
        password: randomPassword(),
        tenant_id: tenantId,
        role: "user"
    };

    const invalidEmailPayload = {
        username: randomUsername(),
        email: "invalid-email",
        password: randomPassword(),
        tenant_id: tenantId,
        role: "user"
    };

    const missingFieldPayload = {
        username: randomUsername(),
        // email missing
        password: randomPassword(),
        tenant_id: tenantId,
        role: "user"
    };

    const weakPasswordPayload = {
        username: randomUsername(),
        email: randomEmail(),
        password: "123",
        tenant_id: tenantId,
        role: "user"
    };

    const noApiKeyHeaders = {
        'Content-Type': 'application/json',
    };

    /**
     * Test Case: Successful registration
     * URL: {apiUrl}/api/auth/register
     * Body: { username, email, password, tenant_id, role }
     * Auth: X-API-Key
     * Expected: {
     *   "success": true,
     *   "message": "User registered successfully",
     *   "data": { "id": "...", "access_token": "..." }
     * }
     */
    let response = http.post(baseUrl, JSON.stringify(validPayload), { headers });
    checkSuccess(response, 201, 'registered successfully', 'Test 1: Successful registration');
    sleep(shortSleep());

    /**
     * Test Case: Duplicate email
     * URL: {apiUrl}/api/auth/register
     * Body: { username: <random>, email: <existing-email>, password, role }
     * Auth: X-API-Key
     * Expected (409): {
     *   "success": false,
     *   "message": "Email already exists"
     * }
     */
    response = http.post(baseUrl, JSON.stringify(duplicateEmailPayload), { headers });
    checkError(response, 409, 'already registered', 'Test 2: Duplicate email');
    sleep(shortSleep());

    /**
     * Test Case: Duplicate username
     * URL: {apiUrl}/api/auth/register
     * Body: { username: <existing-username>, email: <random>, password, role }
     * Auth: X-API-Key
     * Expected (409): {
     *   "success": false,
     *   "message": "Username already exists"
     * }
     */
    response = http.post(baseUrl, JSON.stringify(duplicateUsernamePayload), { headers });
    checkError(response, 409, 'username', 'Test 3: Duplicate username');
    sleep(shortSleep());

    /**
     * Test Case: Invalid email format
     * URL: {apiUrl}/api/auth/register
     * Body: { email: 'invalid-email', ... }
     * Auth: X-API-Key
     * Expected (422): {
     *   "success": false,
     *   "message": "Invalid email format"
     * }
     */
    response = http.post(baseUrl, JSON.stringify(invalidEmailPayload), { headers });
    checkError(response, 422, null, 'Test 4: Invalid email format');
    sleep(shortSleep());

    /**
     * Test Case: Missing required fields
     * URL: {apiUrl}/api/auth/register
     * Body: { ... } (missing email)
     * Auth: X-API-Key
     * Expected (400): {
     *   "success": false,
     *   "message": "Missing required fields"
     * }
     */
    response = http.post(baseUrl, JSON.stringify(missingFieldPayload), { headers });
    checkError(response, 400, null, 'Test 5: Missing required fields (no email)');
    sleep(shortSleep());

    /**
     * Test Case: Weak password
     * URL: {apiUrl}/api/auth/register
     * Body: { password: '123', ... }
     * Auth: X-API-Key
     * Expected (422): {
     *   "success": false,
     *   "message": "Password too short"
     * }
     */
    response = http.post(baseUrl, JSON.stringify(weakPasswordPayload), { headers });
    checkError(response, 422, null, 'Test 6: Weak password');
    sleep(shortSleep());

    /**
     * Test Case: Missing API key
     * URL: {apiUrl}/api/auth/register
     * Body: { ... } (valid payload)
     * Auth: None (Headers missing X-API-Key)
     * Expected (401): {
     *   "success": false,
     *   "message": "Missing API Key"
     * }
     */
    response = http.post(baseUrl, JSON.stringify(validPayload), { headers: noApiKeyHeaders });
    checkError(response, 401, null, 'Test 7: Missing API key');
    sleep(shortSleep());
}
