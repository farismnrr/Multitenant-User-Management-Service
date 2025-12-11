#!/bin/bash
# Setup script to create the test tenant in database

# This tenant ID must match TEST_TENANT_ID in helpers.js
TEST_TENANT_ID="00000000-0000-0000-0000-000000000001"

echo "Creating test tenant with ID: $TEST_TENANT_ID"

# Insert tenant directly into database
docker exec postgres-sql psql -U postgres -d postgres -c "
INSERT INTO tenants (id, name, description, created_at, updated_at, deleted_at)
VALUES (
    '$TEST_TENANT_ID',
    'Test Tenant',
    'Default tenant for E2E tests',
    NOW(),
    NOW(),
    NULL
)
ON CONFLICT (id) DO NOTHING;
"

echo "✅ Test tenant created/verified"
