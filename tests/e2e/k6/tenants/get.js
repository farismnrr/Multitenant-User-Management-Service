/**
 * =============================================================================
 * ENDPOINT: GET /tenants & GET /tenants/:id
 * =============================================================================
 * 
 * Description: Retrieve tenant information
 * 
 * URL: http://localhost:5500/tenants (get all)
 *      http://localhost:5500/tenants/:id (get by ID)
 * Method: GET
 * 
 * Headers:
 *   - Content-Type: application/json
 *   - Authorization: Bearer <access_token>
 * 
 * Request Body: None
 * 
 * Success Response (200) - Get All:
 *   {
 *     "success": true,
 *     "message": "Tenants retrieved successfully",
 *     "data": [
 *       {
 *         "id": "uuid",
 *         "name": "string",
 *         "description": "string" | null,
 *         "is_active": true,
 *         "created_at": "datetime",
 *         "updated_at": "datetime"
 *       },
 *       ...
 *     ]
 *   }
 * 
 * Success Response (200) - Get by ID:
 *   {
 *     "success": true,
 *     "message": "Tenant retrieved successfully",
 *     "data": {
 *       "id": "uuid",
 *       "name": "string",
 *       "description": "string" | null,
 *       "is_active": true,
 *       "created_at": "datetime",
 *       "updated_at": "datetime"
 *     }
 *   }
 * 
 * Error Responses:
 *   - 401 Unauthorized: Missing or invalid JWT
 *   - 404 Not Found: Tenant with specified ID not found
 * 
 * Notes:
 *   - Requires valid JWT Bearer token
 *   - GET /tenants returns only active tenants (is_active = true)
 *   - GET /tenants/:id returns specific tenant by UUID
 * 
 * Test Scenarios:
 *   1. Get all tenants with valid JWT (200 OK)
 *   2. Get tenant by ID with valid JWT (200 OK)
 *   3. Get tenants without JWT (401 Unauthorized)
 *   4. Get non-existent tenant (404 Not Found)
 * 
 * =============================================================================
 */

import http from 'k6/http';
import { sleep } from 'k6';
import { BASE_URL, options, headers } from '../config.js';
import { getTestTenantId } from '../utils.js';
import {
    randomString,
    extractAccessToken,
    checkSuccess,
    checkError,
    shortSleep,
    registerTestUser
} from '../utils.js';

export { options };

export default function () {
    const loginUrl = `${BASE_URL}/api/auth/login`;
    const tenantsUrl = `${BASE_URL}/api/tenants`;

    // Setup: Create and login a test user
    // We need a logged-in user with JWT to access tenant endpoints
    const tenantId = getTestTenantId();
    const testUser = registerTestUser(tenantId, 'user');

    const loginPayload = {
        email_or_username: testUser.email,
        password: testUser.password,
        tenant_id: tenantId,
    };

    const loginResponse = http.post(loginUrl, JSON.stringify(loginPayload), { headers });
    const accessToken = extractAccessToken(loginResponse);
    sleep(shortSleep());

    const authHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
    };

    // Create a test tenant first
    // This tenant will be used for GET operations testing
    const tenantName = `Tenant_${randomString(8)}`;
    const createPayload = {
        name: tenantName,
        description: 'Test tenant for get operations',
    };

    const createResponse = http.post(tenantsUrl, JSON.stringify(createPayload), { headers: authHeaders });
    const createdTenant = JSON.parse(createResponse.body).data;
    const createdTenantId = createdTenant.id;
    sleep(shortSleep());

    /**
     * Test Case: Get all tenants
     * URL: {apiUrl}/tenants
     * Body: None
     * Auth: Bearer <valid_jwt>
     * Expected (200): {
     *   "success": true,
     *   "message": "Tenants retrieved successfully",
     *   "data": [ {...}, {...}, ... ]
     * }
     */
    let response = http.get(tenantsUrl, { headers: authHeaders });
    checkSuccess(response, 200, 'Tenants retrieved successfully', 'Test 1: Get all tenants with valid JWT');

    const allTenants = JSON.parse(response.body).data;
    console.log(`Number of tenants: ${allTenants.length}`);
    sleep(shortSleep());

    /**
     * Test Case: Get tenant by ID
     * URL: {apiUrl}/tenants/:id
     * Body: None
     * Auth: Bearer <valid_jwt>
     * Expected (200): {
     *   "success": true,
     *   "message": "Tenant retrieved successfully",
     *   "data": { "id": "...", "name": "...", ... }
     * }
     */
    const getTenantUrl = `${tenantsUrl}/${createdTenantId}`;
    response = http.get(getTenantUrl, { headers: authHeaders });
    checkSuccess(response, 200, 'Tenant retrieved successfully', 'Test 2: Get tenant by ID with valid JWT');

    const tenant = JSON.parse(response.body).data;
    console.log(`Tenant name matches: ${tenant.name === tenantName ? 'Yes' : 'No'}`);
    sleep(shortSleep());

    /**
     * Test Case: Get tenant without JWT
     * URL: {apiUrl}/tenants
     * Body: None
     * Auth: None
     * Expected (401): {
     *   "success": false,
     *   "message": "Missing authentication token"
     * }
     */
    const noAuthHeaders = {
        'Content-Type': 'application/json',
    };
    response = http.get(tenantsUrl, { headers: noAuthHeaders });
    checkError(response, 401, null, 'Test 3: Get tenants without JWT');
    sleep(shortSleep());

    /**
     * Test Case: Get non-existent tenant
     * URL: {apiUrl}/tenants/:id
     * Body: None
     * Auth: Bearer <valid_jwt>
     * Expected (404): {
     *   "success": false,
     *   "message": "Tenant not found"
     * }
     */
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const fakeUrl = `${tenantsUrl}/${fakeId}`;
    response = http.get(fakeUrl, { headers: authHeaders });
    checkError(response, 404, 'not found', 'Test 4: Get non-existent tenant');
    sleep(shortSleep());
}
