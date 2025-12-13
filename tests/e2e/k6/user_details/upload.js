/**
 * =============================================================================
 * ENDPOINT: PATCH /users/uploads
 * =============================================================================
 * 
 * Description: Upload profile picture for current user (from JWT)
 * 
 * URL: http://localhost:5500/users/uploads
 * Method: PATCH
 * 
 * Headers:
 *   - Content-Type: multipart/form-data
 *   - Authorization: Bearer <access_token>
 * 
 * Request Body (multipart/form-data):
 *   - file: <image_file> (field name: "file")
 * 
 * Success Response (200):
 *   {
 *     "success": true,
 *     "message": "Profile picture uploaded successfully",
 *     "data": {
 *       "id": "uuid"
 *     }
 *   }
 * 
 * Error Responses:
 *   - 400 Bad Request: Invalid file type, missing file
 *   - 401 Unauthorized: Missing JWT, invalid JWT
 *   - 413 Payload Too Large: File size exceeds limit
 * 
 * Notes:
 *   - Requires valid JWT Bearer token
 *   - Accepts image files (jpg, jpeg, png, gif, etc.)
 *   - Returns user ID
 *   - File size limit may apply (check server config)
 *   - Does NOT require API key
 * 
 * Test Scenarios:
 *   1. Successful profile picture upload
 *   2. Upload without JWT
 *   3. Upload invalid file type (text file)
 *   4. Upload without file
 *   5. Upload oversized file (simulated with large data)
 * 
 * =============================================================================
 */

import http from 'k6/http';
import { sleep } from 'k6';
import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js';
import { BASE_URL, options, headers } from '../config.js';
import { getTestTenantId } from '../utils.js';
import {
    extractAccessToken,
    extractUserId,
    checkSuccess,
    checkError,
    shortSleep,
    registerTestUser
} from '../utils.js';

export { options };

const pngData = open('../../../assets/normal.png', 'b');
const largeData = open('../../../assets/large.jpeg', 'b');

export default function () {
    const loginUrl = `${BASE_URL}/api/auth/login`;
    const uploadUrl = `${BASE_URL}/users/uploads`;

    // Setup: Create a test user
    const tenantId = getTestTenantId();
    const testUser = registerTestUser(tenantId, 'user');
    sleep(shortSleep());

    // Login
    const loginPayload = {
        email_or_username: testUser.email,
        password: testUser.password,
    };

    const loginResponse = http.post(loginUrl, JSON.stringify(loginPayload), { headers });
    const accessToken = extractAccessToken(loginResponse);
    sleep(shortSleep());

    /**
    * Test Case: Successful profile picture upload
    * URL: {apiUrl}/users/uploads
    * Body: FormData { file: <png_image> }
    * Auth: Bearer <valid_jwt>
    * Expected: {
    *   "success": true,
    *   "message": "Profile picture uploaded successfully",
    *   "data": { "id": "uuid" }
    * }
    */

    const formData = new FormData();

    // Load image from assets
    // Path is relative to the script location
    // pngData loaded in init context

    formData.append('file', http.file(pngData, 'normal.png', 'image/png'));

    let response = http.patch(uploadUrl, formData.body(), {
        headers: {
            'Content-Type': 'multipart/form-data; boundary=' + formData.boundary,
            'Authorization': `Bearer ${accessToken}`,
        },
    });

    checkSuccess(response, 200, 'uploaded successfully', 'Test 1: Successful profile picture upload');

    const userId = extractUserId(response);
    console.log(`User ID returned: ${userId ? 'Yes' : 'No'}`);
    sleep(shortSleep());

    /**
    * Test Case: Upload without JWT
        * URL: { apiUrl } /users/uploads
            * Body: FormData {
                file: <png_image> }
                    * Auth: None
                    * Expected (401): {
* "success": false,
                    *   "message": "Missing authentication token"
* }
                    */

    const formData2 = new FormData();
    formData2.append('file', http.file(pngData, 'normal.png', 'image/png'));

    response = http.patch(uploadUrl, formData2.body(), {
        headers: {
            'Content-Type': 'multipart/form-data; boundary=' + formData2.boundary,
        },
    });

    checkError(response, 401, null, 'Test 2: Upload without JWT');
    sleep(shortSleep());

    /**
    * Test Case: Upload invalid file type
    * URL: {apiUrl}/users/uploads
                        * Body: FormData {file: <text_file> }
                            * Auth: Bearer <valid_jwt>
                                * Expected (400): {
    * "success": false,
                                *   "message": "Invalid file type"
    * }
                                */

    const formData3 = new FormData();
    const textData = 'This is a text file, not an image';
    formData3.append('file', http.file(textData, 'test.txt', 'text/plain'));

    response = http.patch(uploadUrl, formData3.body(), {
        headers: {
            'Content-Type': 'multipart/form-data; boundary=' + formData3.boundary,
            'Authorization': `Bearer ${accessToken}`,
        },
    });

    checkError(response, 400, null, 'Test 3: Upload invalid file type');
    sleep(shortSleep());

    /**
    * Test Case: Upload without file
    * URL: {apiUrl}/users/uploads
                                * Body: FormData { } (empty)
                                * Auth: Bearer <valid_jwt>
                                    * Expected (400): {
    * "success": false,
                                    *   "message": "Missing file"
    * }
                                    */

    const formData4 = new FormData();
    // Don't append any file

    response = http.patch(uploadUrl, formData4.body(), {
        headers: {
            'Content-Type': 'multipart/form-data; boundary=' + formData4.boundary,
            'Authorization': `Bearer ${accessToken}`,
        },
    });

    checkError(response, 400, null, 'Test 4: Upload without file');
    sleep(shortSleep());

    /**
    * Test Case: Upload oversized file
    * URL: {apiUrl}/users/uploads
                                    * Body: FormData {file: <large_image> }
                                        * Auth: Bearer <valid_jwt>
                                            * Expected (413/400): {
    * "success": false,
                                            *   "message": "File too large"
    * }
                                            */

    const formData5 = new FormData();
    // largeData loaded in init context
    formData5.append('file', http.file(largeData, 'large.jpeg', 'image/jpeg'));

    response = http.patch(uploadUrl, formData5.body(), {
        headers: {
            'Content-Type': 'multipart/form-data; boundary=' + formData5.boundary,
            'Authorization': `Bearer ${accessToken}`,
        },
    });

    // This might be 413 Payload Too Large or 400 Bad Request depending on server config
    // We'll assume checkError usage if this was a failing test, but here it seems valid to just log or check if validation is enabled
    // The instructions say "Expected (413/400)"
    // So let's add a checkError assuming 413 or 400.
    // If status is 413, checkError(response, 413) would work. If 400...

    if (response.status === 413) {
        checkError(response, 413, null, 'Test 5: Upload oversized file');
    } else {
        checkError(response, 400, null, 'Test 5: Upload oversized file');
    }
    sleep(shortSleep());
}
