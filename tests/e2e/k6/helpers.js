import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5500';
const API_KEY = __ENV.API_KEY || 'your-api-key-for-endpoint-protection';

// Use a fixed test tenant ID for all tests
// This tenant should be created manually or via setup script
const TEST_TENANT_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Returns the test tenant ID
 * @returns {string} Tenant ID
 */
export function getTestTenantId() {
    return TEST_TENANT_ID;
}

/**
 * Creates a test tenant (requires JWT auth)
 * @param {string} accessToken - JWT access token
 * @param {string} tenantName - Name of the tenant
 * @returns {string} Tenant ID
 */
export function createTestTenantWithAuth(accessToken, tenantName) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
    };

    const payload = {
        name: tenantName || `test-tenant-${Date.now()}`,
        description: 'Test tenant for E2E tests',
    };

    const response = http.post(
        `${BASE_URL}/api/tenants`,
        JSON.stringify(payload),
        { headers }
    );

    check(response, {
        'tenant created': (r) => r.status === 201 || r.status === 200,
    });

    if (response.status === 201 || response.status === 200) {
        const body = JSON.parse(response.body);
        return body.data.id;
    }

    throw new Error(`Failed to create tenant: ${response.status} - ${response.body}`);
}

/**
 * Registers a test user and returns auth data
 * @param {string} tenantId - Tenant ID
 * @param {string} role - User role (default: 'user')
 * @returns {object} { userId, accessToken, email, password, username }
 */
export function registerTestUser(tenantId, role = 'user') {
    const headers = {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
    };

    const timestamp = Date.now();
    const username = `testuser_${timestamp}`;
    const email = `test_${timestamp}@example.com`;
    const password = `SecurePass123!_${timestamp}`;

    const payload = {
        username,
        email,
        password,
        tenant_id: tenantId,
        role,
    };

    const response = http.post(
        `${BASE_URL}/api/auth/register`,
        JSON.stringify(payload),
        { headers }
    );

    check(response, {
        'user registered': (r) => r.status === 201,
    });

    if (response.status === 201) {
        const body = JSON.parse(response.body);
        return {
            userId: body.data.id,
            accessToken: body.data.access_token,
            email,
            password,
            username,
        };
    }

    throw new Error(`Failed to register user: ${response.status} - ${response.body}`);
}

export { BASE_URL, API_KEY, TEST_TENANT_ID };
