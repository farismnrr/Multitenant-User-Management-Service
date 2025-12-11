// Simple script to batch update test files
// This adds tenant_id and role to all register calls

const fs = require('fs');
const path = require('path');

const testFiles = [
    'auth/logout.js',
    'auth/refresh.js',
    'auth/verify.js',
    'auth/change_password.js',
    'users/get.js',
    'users/get_all.js',
    'users/update.js',
    'users/soft_delete.js',
    'user_details/get.js',
    'user_details/update.js',
    'user_details/upload.js',
    'user_details/soft_delete.js',
    'tenants/create.js',
    'tenants/get.js',
    'tenants/update.js',
    'tenants/soft_delete.js',
];

// Pattern to add tenant creation and use registerTestUser helper
const updates = {
    // Add import
    addImport: `import { getTestTenantId, registerTestUser } from '../helpers.js';`,
    // Replace user creation with helper
    replaceUserCreation: (content) => {
        // Replace manual register with helper
        return content.replace(
            /http\.post\(registerUrl.*?\);[\s\n]*sleep\(shortSleep\(\)\);/gs,
            'const tenantId = getTestTenantId();\n    const testUser = registerTestUser(tenantId, \'user\');'
        );
    }
};

console.log('Batch update script created. Run manually if needed.');
