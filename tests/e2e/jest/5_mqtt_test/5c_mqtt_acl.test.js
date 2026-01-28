const axios = require("axios");
const { BASE_URL, API_KEY } = require("../config");

describe("5c: POST /mqtt/acl", () => {
    const user1 = {
        username: `acl_user1_${Date.now()}`,
        password: "StrongPass1!",
        is_superuser: false
    };

    const adminUser = {
        username: `acl_admin_${Date.now()}`,
        password: "StrongAdmin1!",
        is_superuser: true
    };

    beforeAll(async () => {
        try {
            await axios.post(`${BASE_URL}/mqtt/create`, user1, { headers: { "X-API-Key": API_KEY } });
            await axios.post(`${BASE_URL}/mqtt/create`, adminUser, { headers: { "X-API-Key": API_KEY } });
        } catch (e) {
            console.error("Setup 5c failed:", e.message);
        }
    });

    test("1. Authorized Access (Allow)", async () => {
        const res = await axios.post(`${BASE_URL}/mqtt/acl`, {
            username: user1.username,
            topic: `users/${user1.username}/data`,
            access: "publish"
        }, {
            headers: { "X-API-Key": API_KEY }
        });

        expect(res.status).toBe(200);
        expect(res.data.status).toBe(true);
        expect(res.data.result).toBe("allow");
        expect(res.data.message).toBe("Authorization successful");
    });

    test("2. Unauthorized Access (Deny)", async () => {
        const res = await axios.post(`${BASE_URL}/mqtt/acl`, {
            username: user1.username,
            topic: `users/other_user/data`,
            access: "publish"
        }, {
            headers: { "X-API-Key": API_KEY }
        });

        expect(res.status).toBe(200);
        expect(res.data.status).toBe(true);
        expect(res.data.result).toBe("deny");
        expect(res.data.message).toBe("Permission denied");
    });

    test("3. Superuser Access (Allow)", async () => {
        const res = await axios.post(`${BASE_URL}/mqtt/acl`, {
            username: adminUser.username,
            topic: `restricted/system/logs`,
            access: "subscribe"
        }, {
            headers: { "X-API-Key": API_KEY }
        });

        expect(res.status).toBe(200);
        expect(res.data.status).toBe(true);
        expect(res.data.result).toBe("allow");
        expect(res.data.message).toBe("Superuser authorized");
    });

    test("4. Validation Error (Missing Topic)", async () => {
        try {
            await axios.post(`${BASE_URL}/mqtt/acl`, {
                username: user1.username,
                access: "publish"
                // missing topic
            }, {
                headers: { "X-API-Key": API_KEY }
            });
            throw new Error("Should have failed with 422");
        } catch (error) {
            expect(error.response.status).toBe(422);
            expect(error.response.data.status).toBe(false);
            expect(error.response.data.result).toBe("ignore");
            expect(error.response.data.details).toBeDefined();
        }
    });
});
