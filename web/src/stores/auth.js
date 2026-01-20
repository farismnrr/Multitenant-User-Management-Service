import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useToast } from "../composables/useToast";
import router from "../router";
import AuthService from "../services/auth.service";
import { ERROR_TYPES, parseError } from "../utils/errorMessages";
import { isValidRedirectUri } from "../utils/ssoValidation";

export const useAuthStore = defineStore("auth", () => {
  const toast = useToast();

  // State
  const user = ref(null);
  const accessToken = ref(null);
  const loading = ref(false);
  const error = ref(null);
  const isInitialized = ref(false);

  // SSO state (in memory, not persisted)
  const ssoState = ref(null);
  const ssoNonce = ref(null);

  // Getters
  const isAuthenticated = computed(() => !!accessToken.value);

  // Helper for SSO redirection
  const performSSORedirect = (token) => {
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUri = urlParams.get("redirect_uri") || sessionStorage.getItem("sso_redirect_uri");
    const state = ssoState.value || "";

    if (redirectUri) {
      if (!isValidRedirectUri(redirectUri)) {
        sessionStorage.removeItem("sso_tenant_id");
        ssoState.value = null;
        ssoNonce.value = null;
        router.push({ name: "forbidden" });
        return true;
      }

      sessionStorage.removeItem("sso_redirect_uri");
      sessionStorage.removeItem("sso_tenant_id");
      ssoState.value = null;
      ssoNonce.value = null;

      try {
        const url = new URL(redirectUri);
        const safeToken = encodeURIComponent(token);
        const safeState = encodeURIComponent(state);
        url.hash = `access_token=${safeToken}&state=${safeState}`;
        window.location.href = url.toString();
        return true;
      } catch {
        router.push({ name: "forbidden" });
        return true;
      }
    }
    return false;
  };

  // Actions
  const login = async (emailOrUsername, password) => {
    loading.value = true;
    error.value = null;
    try {
      // Prepare SSO params
      const urlParams = new URLSearchParams(window.location.search);
      const redirectUri =
        urlParams.get("redirect_uri") || sessionStorage.getItem("sso_redirect_uri");
      const role = urlParams.get("role") || sessionStorage.getItem("sso_role");

      const ssoParams = {
        state: ssoState.value,
        nonce: ssoNonce.value,
        redirect_uri: redirectUri,
        role: role, // Include role if present
      };

      const response = await AuthService.login(emailOrUsername, password, ssoParams);

      if (response?.data?.access_token) {
        const { access_token } = response.data;
        accessToken.value = access_token;

        // Fetch user details immediately
        try {
          const verifyResponse = await AuthService.verify(access_token);
          if (verifyResponse?.data?.user) {
            user.value = verifyResponse.data.user;
          }
        } catch {
          /* ignore */
        }

        if (performSSORedirect(access_token)) return;

        toast.success("Login successful! You can close this window.");
      }
    } catch (err) {
      const { message, type } = parseError(err);
      if (type === ERROR_TYPES.CREDENTIAL) {
        error.value = message;
      } else {
        toast.error(message);
        error.value = null;
      }
    } finally {
      loading.value = false;
    }
  };

  const register = async (username, email, password, role, invitation_code) => {
    loading.value = true;
    error.value = null;
    try {
      const ssoParams = {
        state: ssoState.value,
        nonce: ssoNonce.value,
        redirect_uri: sessionStorage.getItem("sso_redirect_uri"),
      };

      const response = await AuthService.register(
        username,
        email,
        password,
        role,
        invitation_code,
        ssoParams,
      );

      // Registration successful! Always go to login as requested.
      toast.success("Registration successful! Please sign in to continue.");
      const redirectUri = sessionStorage.getItem("sso_redirect_uri");
      if (redirectUri) {
        const tenantId = sessionStorage.getItem("sso_tenant_id") || "";
        router.push({
          name: "login",
          query: { redirect_uri: redirectUri, tenant_id: tenantId },
        });
      } else {
        router.push("/login");
      }
    } catch (err) {
      const { message, type } = parseError(err);
      if (type === ERROR_TYPES.CREDENTIAL) {
        error.value = message;
      } else {
        toast.error(message);
        error.value = null;
      }
    } finally {
      loading.value = false;
    }
  };

  const logout = async () => {
    try {
      if (accessToken.value) {
        await AuthService.logout(accessToken.value);
      }
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      user.value = null;
      accessToken.value = null;
      router.push("/login");
    }
  };

  const refreshToken = async () => {
    if (loading.value) return;

    loading.value = true;
    try {
      const data = await AuthService.refresh();
      if (data?.access_token) {
        accessToken.value = data.access_token;
      }
    } catch {
      // Silence silent refresh errors
    } finally {
      loading.value = false;
      isInitialized.value = true;
    }
  };

  return {
    user,
    accessToken,
    loading,
    error,
    isInitialized,
    ssoState,
    ssoNonce,
    isAuthenticated,
    login,
    register,
    logout,
    refreshToken,
  };
});
