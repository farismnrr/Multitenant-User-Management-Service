import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, API_KEY, TENANT_SECRET_KEY } from './config.js';

/**
 * Generate random string
 */
export function randomString(length = 10) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Generate random email
 */
export function randomEmail() {
    return `test_${randomString(8)}@example.com`;
}

/**
 * Generate random username
 */
export function randomUsername() {
    return `user_${randomString(8)}`;
}

/**
 * Generate random password
 */
export function randomPassword() {
    return `Pass${randomString(8)}123!`;
}

/**
 * Extract access token from response
 */
export function extractAccessToken(response) {
    if (response.status !== 200) {
        console.error(`ERROR: Login failed with status ${response.status}. Body: ${response.body}`);
        return null;
    }
    try {
        const body = JSON.parse(response.body);
        return body.data?.access_token || null;
    } catch (e) {
        console.error(`ERROR: Failed to parse access token. Body: ${response.body}. Error: ${e}`);
        return null;
    }
}

/**
 * Extract user ID from response
 */
export function extractUserId(response) {
    const body = JSON.parse(response.body);
    return body.data?.id || body.data?.user?.id || null;
}

/**
 * Extract refresh token from cookies
 */
export function extractRefreshToken(response) {
    const cookies = response.cookies;
    if (cookies && cookies.refresh_token && cookies.refresh_token.length > 0) {
        return cookies.refresh_token[0].value;
    }
    // Fallback: Check Set-Cookie header
    const setCookie = response.headers['Set-Cookie'];
    if (setCookie) {
        // Handle array or single string
        const cookiesList = Array.isArray(setCookie) ? setCookie : [setCookie];
        for (const c of cookiesList) {
            if (c.includes('refresh_token=')) {
                const match = c.match(/refresh_token=([^;]+)/);
                if (match) return match[1];
            }
        }
    }
    return null;
}

/**
 * Check if response is successful
 */
/**
 * Log test result in custom format
 */
export function logTestResult(name, isSuccess, response, expectedStatus, expectedMessage = null) {
    const GREEN = '\x1b[32m';
    const RED = '\x1b[31m';
    const RESET = '\x1b[0m';
    const color = isSuccess ? GREEN : RED;

    console.log(`${color}${name}  (${isSuccess ? 'SUCCESS' : 'FAILED'})${RESET}`);
    console.log(`URL: ${response.request.method} ${response.request.url}`);

    // Auth - Check common auth headers
    const headers = response.request.headers;
    let authInfo = 'None';
    if (headers) {
        if (headers['X-Api-Key'] || headers['x-api-key']) authInfo = `X-API-Key: ${headers['X-Api-Key'] || headers['x-api-key']}`;
        if (headers['Authorization'] || headers['authorization']) authInfo = `Authorization: ${headers['Authorization'] || headers['authorization']}`;
    }
    console.log(`Header / Auth: ${authInfo}`);

    // Request Body
    if (response.request.body) {
        try {
            const reqBody = JSON.parse(response.request.body);
            console.log(`Body: ${JSON.stringify(reqBody, null, 2)}`);
        } catch (e) {
            console.log(`Body: ${response.request.body}`);
        }
    } else {
        console.log(`Body: <empty>`);
    }

    // Expected Result
    const expected = {
        status: expectedStatus,
        message: expectedMessage || (isSuccess ? 'Any success' : 'Error')
    };
    console.log(`Expected Result: ${JSON.stringify(expected, null, 2)}`);

    // Result
    console.log(`Result Status: ${response.status}`);
    // Try to pretty print response body if JSON
    try {
        if (response.body) {
            const json = JSON.parse(response.body);
            console.log(`Result Body: ${JSON.stringify(json, null, 2)}`);
        } else {
            console.log(`Result Body: <empty>`);
        }
    } catch (e) {
        console.log(`Result Body: ${response.body}`);
    }
    console.log('-'.repeat(50));
}

/**
 * Check if response is successful
 */
export function checkSuccess(response, expectedStatus = 200, checkMessage = null, scenarioName = 'Test Scenario') {
    const checks = {
        [`status is ${expectedStatus}`]: (r) => r.status === expectedStatus,
        'response has body': (r) => r.body && r.body.length > 0,
    };

    let body = null;
    try {
        body = JSON.parse(response.body);
    } catch (e) {
        // Body might not be JSON (e.g. 404 HTML)
    }

    if (expectedStatus >= 200 && expectedStatus < 300) {
        checks['success is true'] = (r) => {
            return body && body.success === true;
        };
    }

    if (checkMessage) {
        checks[`message contains "${checkMessage}"`] = (r) => {
            return body && body.message && body.message.includes(checkMessage);
        };
    }

    const res = check(response, checks);

    logTestResult(scenarioName, res, response, expectedStatus, checkMessage);

    return res;
}

/**
 * Check if response is error
 */
export function checkError(response, expectedStatus, expectedMessageContains = null, scenarioName = 'Test Scenario') {
    const checks = {
        [`status is ${expectedStatus}`]: (r) => r.status === expectedStatus,
    };

    if (expectedStatus === 401) {
        // 401 from middleware might not have a body, which is acceptable
        checks['response has body'] = (r) => (r.body && r.body.length > 0) || r.status === 401;
    } else {
        checks['response has body'] = (r) => r.body && r.body.length > 0;
    }

    let body = null;
    try {
        body = JSON.parse(response.body);
    } catch (e) {
        // Body might not be JSON
    }

    if (expectedMessageContains && body) {
        checks[`message contains "${expectedMessageContains}"`] = (r) => {
            return body && body.message && body.message.toLowerCase().includes(expectedMessageContains.toLowerCase());
        };
    } else if (expectedMessageContains && !body) {
        // If we expect a message but have no body, this specific check will fail if status isn't 401 (or if we strictly require a message)
        // For 401 empty body, we skip message check if body is missing
        if (expectedStatus === 401 && (!response.body || response.body.length === 0)) {
            // Skip message check for empty 401
        } else {
            checks[`message contains "${expectedMessageContains}"`] = () => false;
        }
    }

    const res = check(response, checks);

    logTestResult(scenarioName, res, response, expectedStatus, expectedMessageContains);

    return res;
}

/**
 * Sleep for a short duration
 */
export function shortSleep() {
    // k6 sleep is imported from 'k6' module
    // This is just a helper for consistent sleep duration
    return 0.1; // 100ms
}

/**
 * Get test tenant ID from global storage
 * This ID is set by the tenant creation test that runs first
 */
export function getTestTenantId() {
    if (!globalThis.__TEST_TENANT_ID) {
        // Fallback: Create a tenant on the fly for standalone tests
        console.log('Setup: Creating fallback tenant for standalone test...');
        const createUrl = `${BASE_URL}/api/tenants`;
        const payload = JSON.stringify({
            name: `Test_Tenant_${randomString(8)}`,
            description: "Fallback Tenant for Standalone Test"
        });
        const headers = {
            'Content-Type': 'application/json',
            'X-API-Key': API_KEY,
            'X-Tenant-Secret-Key': TENANT_SECRET_KEY
        };

        const response = http.post(createUrl, payload, { headers: headers });
        if (response.status !== 201 && response.status !== 200) {
            throw new Error(`Failed to create fallback tenant: ${response.status} ${response.body}`);
        }

        const body = JSON.parse(response.body);
        globalThis.__TEST_TENANT_ID = body.data.id;
        console.log(`Setup: Fallback Tenant Created: ${globalThis.__TEST_TENANT_ID}`);
    }
    return globalThis.__TEST_TENANT_ID;
}

/**
 * Register a test user
 */
export function registerTestUser(tenantId, role = 'user') {
    const registerUrl = `${BASE_URL}/api/auth/register`;
    const user = {
        username: randomUsername(),
        email: randomEmail(),
        password: randomPassword(),
        tenant_id: tenantId,
        role: role
    };

    const payload = JSON.stringify(user);
    const headers = {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
    };

    const response = http.post(registerUrl, payload, { headers: headers });

    // We use checkSuccess but with a custom name to avoid polluting logs too much if needed
    // But here we want to ensure it works.
    const isSuccess = checkSuccess(response, 201, 'User registered successfully', 'Setup: Register Test User');

    if (!isSuccess) {
        throw new Error(`Failed to register test user: ${response.status} ${response.body}`);
    }

    return user;
}
