const axios = require("axios");
const { BASE_URL, API_KEY } = require("../config");

describe("5e: DELETE /mqtt/{username}", () => {
    const deleteUser = {
        username: `delete_user_${Date.now()}`,
        password: "StrongPass1!",
        is_superuser: false
    };

    beforeAll(async () => {
        try {
            await axios.post(`${BASE_URL}/mqtt/create`, deleteUser, { headers: { "X-API-Key": API_KEY } });
        } catch (e) {
            console.error("Setup 5e failed:", e.message);
        }
    });

    test("1. Missing API Key", async () => {
        try {
            await axios.delete(`${BASE_URL}/mqtt/${deleteUser.username}`);
            throw new Error("Should have failed with 401");
        } catch (error) {
            expect(error.response.status).toBe(401);
            expect(error.response.data.status).toBe(false);
        }
    });

    test("2. Successful Deletion", async () => {
        const res = await axios.delete(`${BASE_URL}/mqtt/${deleteUser.username}`, {
            headers: { "X-API-Key": API_KEY }
        });

        expect(res.status).toBe(200);
        expect(res.data.status).toBe(true);
        expect(res.data.message).toBe("MQTT User deleted successfully");
        // Verify data field is ABSENT (or null/undefined depending on implementation, contract says removed from success response body visually)
        // If API returns null explicitely:
        // expect(res.data.data).toBeNull(); 
        // Or if it omits it:
        // expect(res.data.data).toBeUndefined();
        // Based on contract showing NO data field:
        expect(res.data.data).toBeUndefined();
    });

    test("3. User Not Found", async () => {
        try {
            await axios.delete(`${BASE_URL}/mqtt/non_existent_delete_user`, {
                headers: { "X-API-Key": API_KEY }
            });
            throw new Error("Should have failed with 404");
        } catch (error) {
            expect(error.response.status).toBe(404);
            expect(error.response.data.status).toBe(false);
            expect(error.response.data.message).toBe("MQTT User not found");
        }
    });

    test("4. Delete Already Deleted User (Idempotency)", async () => {
        // Try deleting the user from step 2 again
        try {
            await axios.delete(`${BASE_URL}/mqtt/${deleteUser.username}`, {
                headers: { "X-API-Key": API_KEY }
            });
            throw new Error("Should have failed with 404");
        } catch (error) {
            expect(error.response.status).toBe(404);
            expect(error.response.data.status).toBe(false);
            expect(error.response.data.message).toBe("MQTT User not found");
        }
    });
});
