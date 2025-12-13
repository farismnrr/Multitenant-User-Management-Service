/**
 * =============================================================================
 * ENDPOINT: POST /auth/refresh
 * =============================================================================
 * 
 * Description: Refresh access token using refresh token from cookie
 * 
 * URL: http://localhost:5500/auth/refresh
 * Method: POST
 * 
 * Headers:
 *   - Content-Type: application/json
 *   - Cookie: refresh_token=<token>
 * 
 * Request Body: None
 * 
 * Success Response (200):
 *   {
 *     "success": true,
 *     "message": "Token refreshed successfully",
 *     "data": {
 *       "access_token": "string"
 *     }
 *   }
 * 
 * Error Responses:
 *   - 401 Unauthorized: Invalid token, expired token, missing token
 * 
 * Notes:
 *   - Does NOT require API key
 *   - Requires valid refresh token in cookie
 *   - Returns new access token
 * 
 * Test Scenarios:
 *   1. Successful token refresh with valid refresh token
 *   2. Refresh with invalid token
 *   3. Refresh without token cookie
 *   4. Refresh with expired token (simulated with malformed token)
 * 
 * =============================================================================
 */

import http from 'k6/http';
import { sleep } from 'k6';
import { options } from '../config.js';
import { BASE_URL, API_KEY } from '../config.js';
import { getTestTenantId } from '../utils.js';
import {
    extractAccessToken,
    extractRefreshToken,
    checkSuccess,
    checkError,
    shortSleep,
    registerTestUser
} from '../utils.js';

const headers = { 'Content-Type': 'application/json', 'X-API-Key': API_KEY };

export { options };

export default function () {
    const loginUrl = `${BASE_URL}/api/auth/login`;
    const refreshUrl = `${BASE_URL}/api/auth/refresh`;

    // Setup: Create tenant and user
    const tenantId = getTestTenantId();
    const testUser = registerTestUser(tenantId, 'user');

    const loginPayload = {
        email_or_username: testUser.email,
        password: testUser.password,
        tenant_id: tenantId,
    };

    const loginResponse = http.post(loginUrl, JSON.stringify(loginPayload), { headers });
    checkSuccess(loginResponse, 200, 'Login successful');
    const refreshToken = extractRefreshToken(loginResponse);
    console.log(`Setup: Login status ${loginResponse.status}, Refresh token found: ${refreshToken ? 'Yes' : 'No'}`);
    sleep(shortSleep());

    /**
    * Test Case: Successful token refresh
    * URL: {apiUrl}/api/auth/refresh
    * Body: null
    * Auth: Cookie: refresh_token=<valid_token>
    * Expected: {
    *   "success": true,
    *   "message": "Token refreshed successfully",
    *   "data": { "access_token": "..." }
    * }
    */
    let response = http.post(refreshUrl, null, { headers: refreshHeaders });
    checkSuccess(response, 200, 'Token refreshed successfully', 'Test 1: Successful token refresh');

    const newAccessToken = extractAccessToken(response);
    console.log(`New access token received: ${newAccessToken ? 'Yes' : 'No'}`);
    sleep(shortSleep());

    /**
     * Test Case: Refresh with invalid token
     * URL: {apiUrl}/api/auth/refresh
     * Body: null
     * Auth: Cookie: refresh_token=invalid_token_here
     * Expected (401): {
     *   "success": false,
     *   "message": "Invalid refresh token"
     * }
     */
    response = http.post(refreshUrl, null, { headers: invalidTokenHeaders });
    checkError(response, 401, null, 'Test 2: Refresh with invalid token');
    sleep(shortSleep());

    /**
     * Test Case: Refresh without token cookie
     * URL: {apiUrl}/api/auth/refresh
     * Body: null
     * Auth: None (Missing cookie)
     * Expected (401): {
     *   "success": false,
     *   "message": "Missing refresh token"
     * }
     */
    response = http.post(refreshUrl, null, { headers: noTokenHeaders });
    checkError(response, 401, null, 'Test 3: Refresh without token cookie');
    sleep(shortSleep());

    /**
     * Test Case: Refresh with malformed/expired token
     * URL: {apiUrl}/api/auth/refresh
     * Body: null
     * Auth: Cookie: refresh_token=<expired_token>
     * Expected (401): {
     *   "success": false,
     *   "message": "Invalid refresh token"
     * }
     */
    response = http.post(refreshUrl, null, { headers: expiredTokenHeaders });
    checkError(response, 401, null, 'Test 4: Refresh with malformed/expired token');
    sleep(shortSleep());
}
