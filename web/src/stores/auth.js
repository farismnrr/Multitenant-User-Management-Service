import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import router from '../router'
import AuthService from '../services/auth.service'

export const useAuthStore = defineStore('auth', () => {
    // State
    const user = ref(null)
    const accessToken = ref(null)
    const loading = ref(false)
    const error = ref(null)
    const isInitialized = ref(false)

    // Getters
    const isAuthenticated = computed(() => !!accessToken.value)

    // Actions
    const login = async (emailOrUsername, password) => {
        loading.value = true
        error.value = null
        try {
            const data = await AuthService.login(emailOrUsername, password)
            if (data?.access_token) {
                accessToken.value = data.access_token
                user.value = data.user
                router.push('/')
            }
        } catch (err) {
            console.error(err)
            error.value = err.response?.data?.message || err.message || 'Login failed'
        } finally {
            loading.value = false
        }
    }

    const register = async (username, email, password, role) => {
        loading.value = true
        error.value = null
        try {
            await AuthService.register(username, email, password, role)
            alert("Registration successful. Please login.")
            router.push('/login')
        } catch (err) {
            console.error(err)
            error.value = err.response?.data?.message || err.message || 'Registration failed'
        } finally {
            loading.value = false
        }
    }

    const logout = async () => {
        try {
            if (accessToken.value) {
                await AuthService.logout(accessToken.value)
            }
        } catch (err) {
            console.error("Logout error", err)
        } finally {
            user.value = null
            accessToken.value = null
            router.push('/login')
        }
    }

    const refreshToken = async () => {
        if (loading.value) return

        loading.value = true
        try {
            const data = await AuthService.refresh()
            if (data?.access_token) {
                accessToken.value = data.access_token
                // Note: user info might need to be fetched if not in refresh response
            }
        } catch (err) {
            console.log("No valid session found or refresh failed.")
        } finally {
            loading.value = false
            isInitialized.value = true
        }
    }

    return {
        // State
        user,
        accessToken,
        loading,
        error,
        isInitialized,
        // Getters
        isAuthenticated,
        // Actions
        login,
        register,
        logout,
        refreshToken
    }
})
