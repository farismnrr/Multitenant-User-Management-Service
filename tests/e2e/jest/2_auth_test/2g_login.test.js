const axios = require("axios");
const { BASE_URL, API_KEY } = require("../config");

describe("Internal State Check - Verify Access Token", () => {
  test("Scenario 1: Verify Access Token Exists", async () => {
    // Pre-conditions: 2b_login must have passed.
    // In isolated Jest test, we must simulate login to get token.
    
    // Add delay to avoid rate limiting when running full test suite
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const testUser = {
      username: `statecheck_${Date.now()}`,
      email: `statecheck_${Date.now()}@example.com`,
      password: "StrongPassword123!",
      role: "user",
    };

    try {
      await axios.post(`${BASE_URL}/auth/register`, testUser, {
        headers: { "X-API-Key": API_KEY },
      });
      
      // Small delay between register and login
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const loginRes = await axios.post(
        `${BASE_URL}/auth/login`,
        {
          email_or_username: testUser.email,
          password: testUser.password,
        },
        { headers: { "X-API-Key": API_KEY } },
      );

      // Strict contract compliance: access_token is in data object
      const token = loginRes.data.data?.access_token;
      expect(token).toBeDefined();
      expect(token).not.toBeNull();
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
    } catch (e) {
      throw new Error("Login failed, so Access Token does not exist: " + e.message);
    }
  });
});
