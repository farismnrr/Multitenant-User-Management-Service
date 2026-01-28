const axios = require("axios");
const { BASE_URL, API_KEY } = require("../config");

describe("5d: GET /mqtt", () => {
    const listUser = {
        username: `list_user_${Date.now()}`,
        password: "StrongPass1!",
        is_superuser: false
    };

    beforeAll(async () => {
        try {
            await axios.post(`${BASE_URL}/mqtt/create`, listUser, { headers: { "X-API-Key": API_KEY } });
        } catch (e) {
            console.error("Setup 5d failed:", e.message);
        }
    });

    test("1. Missing API Key", async () => {
        try {
            await axios.get(`${BASE_URL}/mqtt`);
            throw new Error("Should have failed with 401");
        } catch (error) {
            expect(error.response.status).toBe(401);
            expect(error.response.data.status).toBe(false);
        }
    });

    test("3. Retrieve List (Populated)", async () => {
        // We skip "Empty" scenario because other tests are running in parallel or sequentially filling the DB.
        // We focus on finding OUR created user.
        const res = await axios.get(`${BASE_URL}/mqtt`, {
            headers: { "X-API-Key": API_KEY }
        });

        expect(res.status).toBe(200);
        expect(res.data.status).toBe(true);
        expect(res.data.message).toBe("User MQTT list retrieved successfully");

        // Ensure key is 'mqtt'
        expect(Array.isArray(res.data.data.mqtt)).toBe(true);

        const found = res.data.data.mqtt.find(u => u.username === listUser.username);
        expect(found).toBeDefined();
        expect(found.is_superuser).toBe(false);
        expect(found.is_deleted).toBe(false);
    });
});
