/**
 * Main E2E Test Suite
 * 
 * Runs all E2E tests and generates HTML report
 */

import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

// Import all test scenarios
import authRegisterTest from './auth/register.js';
import authLoginTest from './auth/login.js';
import authLogoutTest from './auth/logout.js';
import authRefreshTest from './auth/refresh.js';
import authVerifyTest from './auth/verify.js';

import usersGetTest from './users/get.js';
import usersGetAllTest from './users/get_all.js';
import usersUpdateTest from './users/update.js';
import usersSoftDeleteTest from './users/soft_delete.js';

import userDetailsUpdateTest from './user_details/update.js';
import userDetailsUploadTest from './user_details/upload.js';
import userDetailsSoftDeleteTest from './user_details/soft_delete.js';

import tenantsCreateWithSecretTest from './tenants/create_with_secret.js';
import tenantsCreateTest from './tenants/create.js';
import tenantsGetTest from './tenants/get.js';
import tenantsUpdateTest from './tenants/update.js';
import tenantsSoftDeleteTest from './tenants/soft_delete.js';

import { sleep } from 'k6';

export const options = {
    // Run sequentially in a single VU to share state (tenant ID)
    iterations: 1,
    vus: 1,
    thresholds: {
        http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2s
    },
};

export default function () {
    // 1. Tenant Creation (REQUIRED FIRST)
    try {
        tenantsCreateWithSecretTest();
    } catch (e) {
        console.error(`\x1b[31mTest: tenantsCreateWithSecretTest (CRASHED)\nError: ${e}\x1b[0m\n--------------------------------------------------`);
    }
    sleep(1);
    // 2. Auth Tests
    try { authRegisterTest(); } catch (e) { console.error(`\x1b[31mTest: authRegisterTest (CRASHED)\nError: ${e}\x1b[0m\n--------------------------------------------------`); }

    try { authLoginTest(); } catch (e) { console.error(`\x1b[31mTest: authLoginTest (CRASHED)\nError: ${e}\x1b[0m\n--------------------------------------------------`); } // Logs in and sets global access token
    try { authVerifyTest(); } catch (e) { console.error(`\x1b[31mTest: authVerifyTest (CRASHED)\nError: ${e}\x1b[0m\n--------------------------------------------------`); }
    try { authRefreshTest(); } catch (e) { console.error(`\x1b[31mTest: authRefreshTest (CRASHED)\nError: ${e}\x1b[0m\n--------------------------------------------------`); }
    try { authLogoutTest(); } catch (e) { console.error(`\x1b[31mTest: authLogoutTest (CRASHED)\nError: ${e}\x1b[0m\n--------------------------------------------------`); }
    try { authLoginTest(); } catch (e) { console.error(`\x1b[31mTest: authLoginTest (Re-login) (CRASHED)\nError: ${e}\x1b[0m\n--------------------------------------------------`); }
    sleep(1);

    // 3. User Tests
    try { usersGetAllTest(); } catch (e) { console.error(`\x1b[31mTest: usersGetAllTest (CRASHED)\nError: ${e}\x1b[0m\n--------------------------------------------------`); }
    try { usersGetTest(); } catch (e) { console.error(`\x1b[31mTest: usersGetTest (CRASHED)\nError: ${e}\x1b[0m\n--------------------------------------------------`); }
    try { usersUpdateTest(); } catch (e) { console.error(`\x1b[31mTest: usersUpdateTest (CRASHED)\nError: ${e}\x1b[0m\n--------------------------------------------------`); }

    // 4. User Details Tests
    try { userDetailsUpdateTest(); } catch (e) { console.error(`\x1b[31mTest: userDetailsUpdateTest (CRASHED)\nError: ${e}\x1b[0m\n--------------------------------------------------`); }
    try { userDetailsUploadTest(); } catch (e) { console.error(`\x1b[31mTest: userDetailsUploadTest (CRASHED)\nError: ${e}\x1b[0m\n--------------------------------------------------`); }

    // 5. Tenant Tests (JWT based)
    try { tenantsCreateTest(); } catch (e) { console.error(`\x1b[31mTest: tenantsCreateTest (CRASHED)\nError: ${e}\x1b[0m\n--------------------------------------------------`); }
    try { tenantsGetTest(); } catch (e) { console.error(`\x1b[31mTest: tenantsGetTest (CRASHED)\nError: ${e}\x1b[0m\n--------------------------------------------------`); }
    try { tenantsUpdateTest(); } catch (e) { console.error(`\x1b[31mTest: tenantsUpdateTest (CRASHED)\nError: ${e}\x1b[0m\n--------------------------------------------------`); }

    // 6. Soft Delete Tests (Destructive, run last)
    try { userDetailsSoftDeleteTest(); } catch (e) { console.error(`\x1b[31mTest: userDetailsSoftDeleteTest (CRASHED)\nError: ${e}\x1b[0m\n--------------------------------------------------`); }
    try { usersSoftDeleteTest(); } catch (e) { console.error(`\x1b[31mTest: usersSoftDeleteTest (CRASHED)\nError: ${e}\x1b[0m\n--------------------------------------------------`); }
    try { tenantsSoftDeleteTest(); } catch (e) { console.error(`\x1b[31mTest: tenantsSoftDeleteTest (CRASHED)\nError: ${e}\x1b[0m\n--------------------------------------------------`); }
}

export function handleSummary(data) {
    return {
        "coverage/test-e2e.html": htmlReport(data),
        stdout: textSummary(data, { indent: " ", enableColors: true }),
    };
}
