const axios = require("axios");
const { BASE_URL, API_KEY } = require("../config");

describe("5b: POST /mqtt/check", () => {
    const testUser = {
        username: `check_user_${Date.now()}`,
        password: "CheckPass123!",
        is_superuser: false,
    };

    const adminUser = {
        username: `check_admin_${Date.now()}`,
        password: "CheckAdmin123!",
        is_superuser: true,
    };

    // Setup: Create users before checking
    beforeAll(async () => {
        try {
            await axios.post(`${BASE_URL}/mqtt/create`, testUser, {
                headers: { "X-API-Key": API_KEY }
            });
            await axios.post(`${BASE_URL}/mqtt/create`, adminUser, {
                headers: { "X-API-Key": API_KEY }
            });
        } catch (e) {
            console.error("Setup 5b failed:", e.message);
        }
    });

    test("1. Successful Login (Allow)", async () => {
        const res = await axios.post(`${BASE_URL}/mqtt/check`, {
            username: testUser.username,
            password: testUser.password
        }, {
            headers: { "X-API-Key": API_KEY }
        });

        expect(res.status).toBe(200);
        expect(res.data.status).toBe(true);
        expect(res.data.message).toBe("Authentication successful");
        expect(res.data.result).toBe("allow");
        expect(res.data.data.is_superuser).toBe(false);
        // Ensure details is NOT present for 200
        expect(res.data.details).toBeUndefined();
    });

    test("2. Invalid Password (Deny)", async () => {
        const res = await axios.post(`${BASE_URL}/mqtt/check`, {
            username: testUser.username,
            password: "WrongPassword"
        }, {
            headers: { "X-API-Key": API_KEY }
        });

        expect(res.status).toBe(200);
        expect(res.data.status).toBe(true);
        expect(res.data.result).toBe("deny");
        expect(res.data.message).toBe("Invalid information"); // Matching contract
    });

    test("3. User Not Found (Ignore)", async () => {
        const res = await axios.post(`${BASE_URL}/mqtt/check`, {
            username: "non_existent_user_check",
            password: "any"
        }, {
            headers: { "X-API-Key": API_KEY }
        });

        expect(res.status).toBe(200);
        expect(res.data.status).toBe(true);
        expect(res.data.result).toBe("ignore");
        expect(res.data.message).toBe("User not found");
    });

    test("4. Superuser Login (Allow + Flag)", async () => {
        const res = await axios.post(`${BASE_URL}/mqtt/check`, {
            username: adminUser.username,
            password: adminUser.password
        }, {
            headers: { "X-API-Key": API_KEY }
        });

        expect(res.status).toBe(200);
        expect(res.data.status).toBe(true);
        expect(res.data.result).toBe("allow");
        expect(res.data.data.is_superuser).toBe(true);
    });

    test("5. Validation Error (Missing Password)", async () => {
        try {
            await axios.post(`${BASE_URL}/mqtt/check`, {
                username: testUser.username
                // missing password
            }, {
                headers: { "X-API-Key": API_KEY }
            });
            throw new Error("Should have failed with 422");
        } catch (error) {
            expect(error.response.status).toBe(422);
            expect(error.response.data.status).toBe(false);
            expect(error.response.data.message).toBe("Validation error");
            expect(error.response.data.details).toBeDefined();
            expect(error.response.data.result).toBe("ignore");
        }
    });
});
