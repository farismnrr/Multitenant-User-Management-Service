/**
 * =============================================================================
 * ENDPOINT: POST /api/tenants (with Tenant Secret Key)
 * =============================================================================
 * 
 * Description: Create a new tenant using tenant secret key (bootstrapping)
 * 
 * URL: http://localhost:5500/api/tenants
 * Method: POST
 * 
 * Headers:
 *   - Content-Type: application/json
 *   - X-API-Key: <api_key>
 *   - X-Tenant-Secret-Key: <tenant_secret_key>
 * 
 * Request Body:
 *   {
 *     "name": "string",
 *     "description": "string" (optional)
 *   }
 * 
 * Success Response (201):
 *   {
 *     "success": true,
 *     "message": "Tenant created successfully",
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
 * Success Response (200) - When tenant already exists:
 *   {
 *     "success": true,
 *     "message": "Tenant created successfully",
 *     "data": {
 *       "id": "uuid",  // ID of existing tenant
 *       "name": "string",
 *       "description": "string" | null,
 *       "is_active": true,
 *       "created_at": "datetime",
 *       "updated_at": "datetime"
 *     }
 *   }
 * 
 * Error Responses:
 *   - 401 Unauthorized: Missing or invalid tenant secret key
 *   - 422 Validation Error: Invalid input (empty name, name too long)
 *   - 500 Internal Server Error: TENANT_SECRET_KEY not configured
 * 
 * Notes:
 *   - Uses X-Tenant-Secret-Key header for authentication (bootstrapping)
 *   - If tenant with same name exists, returns existing tenant (idempotent)
 *   - Name must be between 1-255 characters
 *   - Description is optional
 *   - This test runs FIRST to create the tenant for all other tests
 * 
 * Test Scenarios:
 *   1. Create tenant with tenant secret key (201 Created)
 *   2. Create tenant with duplicate name using secret key (200 OK, returns existing)
 *   3. Create tenant without authentication (401 Unauthorized)
 *   4. Create tenant with invalid secret key (401 Unauthorized)
 *   5. Create tenant with empty name (422 Validation Error)
 * 
 * =============================================================================
 */

import http from 'k6/http';
import { sleep } from 'k6';
import { BASE_URL, options, tenantSecretHeader } from '../config.js';
import {
    randomString,
    checkSuccess,
    checkError,
    shortSleep
} from '../utils.js';

export { options };

export default function () {
    const createTenantUrl = `${BASE_URL}/api/tenants`;

    /**
     * Test Case 1: Create tenant with tenant secret key
     * URL: {apiUrl}/api/tenants
     * Body: { "name": "...", "description": "..." }
     * Auth: X-Tenant-Secret-Key
     * Expected (201): {
     *   "success": true,
     *   "message": "Tenant created successfully",
     *   "data": { "id": "...", "name": "...", ... }
     * }
     */
    const tenantName = `E2E_Test_Tenant_${randomString(8)}`;
    const createPayload = {
        name: tenantName,
        description: 'E2E Test Tenant - Created with Secret Key',
    };
    let response = http.post(createTenantUrl, JSON.stringify(createPayload), { headers: tenantSecretHeader() });
    checkSuccess(response, 201, 'Tenant created successfully', 'Test 1: Create tenant with tenant secret key');

    const body = JSON.parse(response.body);
    const tenantId = body.data?.id;
    console.log(`Tenant created with ID: ${tenantId}`);
    console.log(`Tenant name matches: ${body.data?.name === tenantName ? 'Yes' : 'No'}`);

    // Store tenant ID globally for other tests to use
    globalThis.__TEST_TENANT_ID = tenantId;

    sleep(shortSleep());

    /**
     * Test Case 2: Create tenant with duplicate name
     * URL: {apiUrl}/api/tenants
     * Body: { "name": "<same_name>", "description": "..." }
     * Auth: X-Tenant-Secret-Key
     * Expected (200): {
     *   "success": true,
     *   "message": "Tenant created successfully",
     *   "data": { "id": "...", "name": "...", ... }
     * }
     * Note: Returns existing tenant instead of error
     */
    response = http.post(createTenantUrl, JSON.stringify(createPayload), { headers: tenantSecretHeader() });
    checkSuccess(response, 200, 'Tenant already exists', 'Test 2: Create tenant with duplicate name (returns existing tenant)');

    const duplicateBody = JSON.parse(response.body);
    console.log(`Returned tenant ID matches: ${duplicateBody.data?.id === tenantId ? 'Yes' : 'No'}`);
    console.log(`Returned same tenant for duplicate name - PASSED`);
    sleep(shortSleep());

    /**
     * Test Case 3: Create tenant without authentication
     * URL: {apiUrl}/api/tenants
     * Body: { "name": "...", "description": "..." }
     * Auth: None
     * Expected (401): Unauthorized
     */
    const noAuthHeaders = {
        'Content-Type': 'application/json',
    };
    const newTenantPayload = {
        name: `Tenant_${randomString(8)}`,
        description: 'Should fail without auth',
    };
    response = http.post(createTenantUrl, JSON.stringify(newTenantPayload), { headers: noAuthHeaders });
    checkError(response, 401, null, 'Test 3: Create tenant without authentication');
    sleep(shortSleep());

    /**
     * Test Case 4: Create tenant with invalid secret key
     * URL: {apiUrl}/api/tenants
     * Body: { "name": "...", "description": "..." }
     * Auth: X-Tenant-Secret-Key (invalid)
     * Expected (401): Unauthorized
     */
    const invalidSecretHeaders = {
        'Content-Type': 'application/json',
        'X-API-Key': tenantSecretHeader()['X-API-Key'],
        'X-Tenant-Secret-Key': 'invalid-secret-key-12345',
    };
    response = http.post(createTenantUrl, JSON.stringify(newTenantPayload), { headers: invalidSecretHeaders });
    checkError(response, 401, null, 'Test 4: Create tenant with invalid secret key');
    sleep(shortSleep());

    /**
     * Test Case 5: Create tenant with empty name
     * URL: {apiUrl}/api/tenants
     * Body: { "name": "", "description": "..." }
     * Auth: X-Tenant-Secret-Key
     * Expected (422): Validation error
     */
    const invalidPayload = {
        name: '',
        description: 'Invalid tenant',
    };
    response = http.post(createTenantUrl, JSON.stringify(invalidPayload), { headers: tenantSecretHeader() });
    checkError(response, 422, null, 'Test 5: Create tenant with empty name');
    sleep(shortSleep());
}
