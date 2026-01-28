const axios = require("axios");
const { BASE_URL, API_KEY } = require("../config");

describe("5a: POST /mqtt/create", () => {
    // Unique user for this test file to avoid collisions
    const validUser = {
        username: `create_user_${Date.now()}`,
        password: "StrongPassword123!",
        is_superuser: false,
    };

    test("1. Missing API Key", async () => {
        try {
            await axios.post(`${BASE_URL}/mqtt/create`, validUser);
            throw new Error("Should have failed with 401");
        } catch (error) {
            expect(error.response.status).toBe(401);
            expect(error.response.data.message).toBe("Unauthorized");
        }
    });

    test("2. Successful Creation", async () => {
        const res = await axios.post(`${BASE_URL}/mqtt/create`, validUser, {
            headers: { "X-API-Key": API_KEY }
        });

        expect(res.status).toBe(201);
        expect(res.data.status).toBe(true);
        expect(res.data.message).toBe("MQTT User created successfully");
        expect(res.data.data.username).toBe(validUser.username);
        expect(res.data.data.is_superuser).toBe(false);
    });

    test("3. Missing Required Fields", async () => {
        try {
            await axios.post(`${BASE_URL}/mqtt/create`, {
                username: "incomplete_user"
                // password, is_superuser missing
            }, {
                headers: { "X-API-Key": API_KEY }
            });
            throw new Error("Should have failed with 400");
        } catch (error) {
            expect(error.response.status).toBe(400);
            expect(error.response.data.status).toBe(false);
            expect(error.response.data.message).toBe("Validation error");
            expect(error.response.data.details).toBeDefined();
        }
    });

    test("4. Invalid Username Format (Special Characters)", async () => {
        try {
            await axios.post(`${BASE_URL}/mqtt/create`, {
                username: "invalid/user name",
                password: "StrongPassword123!",
                is_superuser: false
            }, {
                headers: { "X-API-Key": API_KEY }
            });
            throw new Error("Should have failed with 422");
        } catch (error) {
            expect(error.response.status).toBe(422);
            expect(error.response.data.status).toBe(false);
            expect(error.response.data.message).toBe("Validation error");
            // Expect details about username
            const hasDetail = error.response.data.details.some(d => d.field === 'username');
            expect(hasDetail).toBe(true);
        }
    });

    test("5. Weak Password", async () => {
        try {
            await axios.post(`${BASE_URL}/mqtt/create`, {
                username: `weak_pw_${Date.now()}`,
                password: "123",
                is_superuser: false
            }, {
                headers: { "X-API-Key": API_KEY }
            });
            throw new Error("Should have failed with 422");
        } catch (error) {
            expect(error.response.status).toBe(422);
            expect(error.response.data.status).toBe(false);
            // Expect details about password
            const hasDetail = error.response.data.details.some(d => d.field === 'password');
            expect(hasDetail).toBe(true);
        }
    });

    test("6. Invalid is_superuser Type", async () => {
        try {
            await axios.post(`${BASE_URL}/mqtt/create`, {
                username: `bad_type_${Date.now()}`,
                password: "StrongPassword123!",
                is_superuser: "string_instead_of_bool"
            }, {
                headers: { "X-API-Key": API_KEY }
            });
            throw new Error("Should have failed with 400");
        } catch (error) {
            expect(error.response.status).toBe(400);
            expect(error.response.data.status).toBe(false);
            const hasDetail = error.response.data.details.some(d => d.field === 'is_superuser');
            expect(hasDetail).toBe(true);
        }
    });

    test("7. Duplicate Username", async () => {
        // reuse validUser created in test 2
        try {
            await axios.post(`${BASE_URL}/mqtt/create`, validUser, {
                headers: { "X-API-Key": API_KEY }
            });
            throw new Error("Should have failed with 409");
        } catch (error) {
            expect(error.response.status).toBe(409);
            expect(error.response.data.status).toBe(false);
            expect(error.response.data.message).toBe("Username already exists");
        }
    });

    test("8. Create Superuser (Successful)", async () => {
        const superUser = {
            username: `admin_mqtt_${Date.now()}`,
            password: "StrongAdminPass1!",
            is_superuser: true
        };

        const res = await axios.post(`${BASE_URL}/mqtt/create`, superUser, {
            headers: { "X-API-Key": API_KEY }
        });

        expect(res.status).toBe(201);
        expect(res.data.status).toBe(true);
        expect(res.data.data.username).toBe(superUser.username);
        expect(res.data.data.is_superuser).toBe(true);
    });
});
