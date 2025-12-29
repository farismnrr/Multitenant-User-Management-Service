import { onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

export function useSSO() {
    const route = useRoute()
    const authStore = useAuthStore()

    const generateSSOParams = () => {
        const redirectUri = sessionStorage.getItem('sso_redirect_uri')
        const tenantId = sessionStorage.getItem('sso_tenant_id')

        if (redirectUri && tenantId) {
            let state = authStore.ssoState
            let nonce = authStore.ssoNonce

            // Only generate new if not already in store (preserves across navigation)
            if (!state || !nonce) {
                state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
                nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

                // Store in Pinia
                authStore.ssoState = state
                authStore.ssoNonce = nonce
            }

            // Check if current URL already has these params to avoid redundant replaceState
            const currentParams = new URLSearchParams(window.location.search)
            if (currentParams.get('state') === state && currentParams.get('nonce') === nonce) {
                return
            }

            // Update URL with full params without redirecting
            const newUrl = `${window.location.pathname}?tenant_id=${tenantId}&redirect_uri=${redirectUri}&response_type=code&scope=openid&state=${state}&nonce=${nonce}`
            window.history.replaceState({}, '', newUrl)
        }
    }

    onMounted(() => {
        generateSSOParams()
    })

    // Watch route path changes to ensure params are re-applied if lost (though RouterLink fix helps)
    watch(() => route.path, () => {
        generateSSOParams()
    })

    return {
        generateSSOParams
    }
}
