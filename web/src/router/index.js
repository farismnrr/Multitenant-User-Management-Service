import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { isValidRedirectUri } from '../utils/ssoValidation'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            redirect: '/login'
        },
        {
            path: '/login',
            name: 'login',
            component: () => import('../views/Login.vue'),
            meta: { guestOnly: true, title: 'Sign In' }
        },
        {
            path: '/register',
            name: 'register',
            component: () => import('../views/Register.vue'),
            meta: { guestOnly: true, title: 'Create Account' }
        },
        {
            path: '/forbidden',
            name: 'forbidden',
            component: () => import('../views/Forbidden.vue'),
            meta: { title: 'Access Forbidden' }
        }
    ]
})

// SSO: Store redirect params in sessionStorage when navigating to login/register
router.beforeEach(async (to, _from, next) => {
    const authStore = useAuthStore()

    // Parse SSO params from URL for login/register pages
    // Store redirect_uri and tenant_id in sessionStorage
    // state and nonce will be generated fresh in the component
    if (to.name === 'login' || to.name === 'register') {
        const redirectUri = to.query.redirect_uri
        const tenantId = to.query.tenant_id

        // Validate redirect_uri against whitelist
        if (redirectUri && !isValidRedirectUri(redirectUri)) {
            // Invalid redirect_uri - redirect to forbidden page

            return next({ name: 'forbidden' })
        }

        if (redirectUri) {
            sessionStorage.setItem('sso_redirect_uri', redirectUri)
            if (tenantId) sessionStorage.setItem('sso_tenant_id', tenantId)
        }
    }

    if (to.meta.title) {
        document.title = `${to.meta.title} - IoTNet`
    }

    if (!authStore.isInitialized) {
        await authStore.refreshToken()
    }

    // Only login and register routes exist, both are guest-only
    if (to.meta.guestOnly && authStore.isAuthenticated) {
        const redirectUri = sessionStorage.getItem('sso_redirect_uri')
        if (redirectUri) {
            // Helper to extract role from JWT
            const getRoleFromToken = (token) => {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]))
                    return payload.role
                } catch {
                    return null
                }
            }

            const requestedRole = sessionStorage.getItem('sso_role')
            const currentRole = getRoleFromToken(authStore.accessToken)

            // If a specific role is requested and it doesn't match the current session's role,
            // don't auto-redirect. This allows the user to re-authenticate with the correct role.
            if (requestedRole && requestedRole !== currentRole) {
                return next()
            }

            const state = authStore.ssoState || ''
            sessionStorage.removeItem('sso_redirect_uri')
            sessionStorage.removeItem('sso_tenant_id')
            sessionStorage.removeItem('sso_role') // Also clear role!
            authStore.ssoState = null
            authStore.ssoNonce = null

            try {
                const url = new URL(redirectUri)
                const safeToken = encodeURIComponent(authStore.accessToken)
                const safeState = encodeURIComponent(state)
                url.hash = `access_token=${safeToken}&state=${safeState}`
                window.location.href = url.toString()
                return
            } catch {
                // Silently handle redirection errors
                next({ name: 'forbidden' })
            }
        }
    } else {
        next()
    }
})

// Clear errors globally after each navigation
router.afterEach(() => {
    const authStore = useAuthStore()
    if (authStore.error) {
        authStore.error = null
    }
})

export default router
