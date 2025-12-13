/**
 * =============================================================================
 * ENDPOINT: DELETE /tenants/:id (Soft Delete)
 * =============================================================================
 * 
 * Description: Soft delete a tenant (sets deleted_at timestamp)
 * 
 * URL: http://localhost:5500/tenants/:id
 * Method: DELETE
 * 
 * Headers:
 *   - Content-Type: application/json
 *   - Authorization: Bearer <access_token>
 * 
 * Request Body: None
 * 
 * Success Response (204 No Content):
 *   - No response body
 *   - Status code 204 indicates successful deletion
 * 
 * Error Responses:
 *   - 401 Unauthorized: Missing or invalid JWT
 *   - 404 Not Found: Tenant not found or already deleted
 * 
 * Notes:
 *   - Requires valid JWT Bearer token
 *   - This is a SOFT DELETE (sets deleted_at, doesn't remove record)
 *   - Deleted tenant doesn't appear in GET /tenants
 *   - Deleted tenant doesn't appear in GET /tenants/:id
 *   - When tenant is deleted, associated users' tenant_id remains unchanged
 *   - Deleting already deleted tenant returns 404
 * 
 * Test Scenarios:
 *   1. Delete tenant and verify soft delete (204 No Content)
 *   2. Verify deleted tenant not found by ID (404 Not Found)
 *   3. Verify deleted tenant not in listings
 *   4. Try to delete already deleted tenant (404 Not Found)
 * 
 * =============================================================================
 */

import http from 'k6/http';
import { sleep } from 'k6';
import { options } from '../config.js';
import { BASE_URL, API_KEY } from '../config.js';
import { getTestTenantId } from '../utils.js';
import {
    randomString,
    extractAccessToken,
    checkSuccess,
    checkError,
    shortSleep,
    registerTestUser
} from '../utils.js';

const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
};

export { options };

export default function () {
    const loginUrl = `${BASE_URL}/api/auth/login`;
    const tenantsUrl = `${BASE_URL}/api/tenants`;

    /**
     * Test Case: Create tenant, delete it, and verify soft delete behavior
     */
    console.log('Test 1: Create tenant and soft delete it');

    // Setup: Create and login a test user
    const tenantId = getTestTenantId();
    const testUser = registerTestUser(tenantId, 'user');

    const loginPayload = {
        email_or_username: testUser.email,
        password: testUser.password,
        tenant_id: tenantId,
    };

    let loginResponse = http.post(loginUrl, JSON.stringify(loginPayload), { headers });
    let accessToken = extractAccessToken(loginResponse);
    sleep(shortSleep());

    let authHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
    };

    // Create a tenant for deletion test
    const tenantName = `Tenant_${randomString(8)}`;
    const createPayload = {
        name: tenantName,
        description: 'Test tenant for soft delete',
    };

    let response = http.post(tenantsUrl, JSON.stringify(createPayload), { headers: authHeaders });
    checkSuccess(response, 201, 'Tenant created successfully');

    const createdTenant = JSON.parse(response.body).data;
    const deleteTenantId = createdTenant.id;
    console.log(`Created tenant with ID: ${deleteTenantId}`);
    sleep(shortSleep());

    // Verify tenant exists
    response = http.get(`${tenantsUrl}/${deleteTenantId}`, { headers: authHeaders });
    checkSuccess(response, 200, 'Tenant retrieved successfully');
    console.log('Tenant exists before deletion');
    sleep(shortSleep());

    /**
     * Test Case: Delete tenant (soft delete)
     * URL: {apiUrl}/tenants/:id
     * Body: None
     * Auth: Bearer <valid_jwt>
     * Expected (204): No Content
     * Note: Soft delete sets deleted_at timestamp
     */
    response = http.del(`${tenantsUrl}/${deleteTenantId}`, null, { headers: authHeaders });
    checkSuccess(response, 204, null, 'Test 1: Delete tenant (soft delete)');
    sleep(shortSleep());

    /**
     * Test Case: Verify deleted tenant doesn't appear in GET /tenants/:id
     * URL: {apiUrl}/tenants/:id
     * Body: None
     * Auth: Bearer <valid_jwt>
     * Expected (404): {
     *   "success": false,
     *   "message": "Tenant not found"
     * }
     */
    response = http.get(`${tenantsUrl}/${deleteTenantId}`, { headers: authHeaders });
    checkError(response, 404, 'not found', 'Test 2: Verify deleted tenant not found by ID');
    console.log('Deleted tenant NOT found by ID - PASSED');
    sleep(shortSleep());

    /**
     * Test Case: Verify deleted tenant doesn't appear in GET /tenants
     * URL: {apiUrl}/tenants
     * Body: None
     * Auth: Bearer <valid_jwt>
     * Expected (200): {
     *   "success": true,
     *   "message": "Tenants retrieved successfully",
     *   "data": [ ... ] // Should NOT include deleted tenant
     * }
     */
    response = http.get(tenantsUrl, { headers: authHeaders });
    checkSuccess(response, 200, 'Tenants retrieved successfully', 'Test 3: Verify deleted tenant not in listings');

    const allTenants = JSON.parse(response.body).data;
    const deletedTenantExists = allTenants.some(t => t.id === deleteTenantId);

    if (!deletedTenantExists) {
        console.log('Deleted tenant NOT in /tenants - PASSED');
    } else {
        console.log('[FAILED] Deleted tenant still appears in /tenants');
    }
    sleep(shortSleep());

    /**
     * Test Case: Try to delete already deleted tenant (idempotent)
     * URL: {apiUrl}/tenants/:id
     * Body: None
     * Auth: Bearer <valid_jwt>
     * Expected (404): {
     *   "success": false,
     *   "message": "Tenant not found"
     * }
     */
    response = http.del(`${tenantsUrl}/${deleteTenantId}`, null, { headers: authHeaders });
    checkError(response, 404, 'not found', 'Test 4: Delete already deleted tenant (should return 404)');
    console.log('Cannot delete already deleted tenant - PASSED');
    sleep(shortSleep());

    console.log('Tenant soft delete test completed');
    console.log('Note: Soft delete sets deleted_at timestamp instead of removing record');
}
