// Allowed origins whitelist - read from env or use defaults
// For Vite: set VITE_ALLOWED_ORIGINS in .env (should match backend ALLOWED_ORIGINS)
const envOrigins = import.meta.env.VITE_ALLOWED_ORIGINS

const DEFAULT_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500'
]

export const ALLOWED_ORIGINS = envOrigins
    ? envOrigins.split(',').map(o => o.trim())
    : DEFAULT_ORIGINS

/**
 * Validates if a redirect_uri is in the allowed origins whitelist.
 * Extracts the origin (protocol + host) and performs exact match.
 * @param {string} redirectUri - The redirect URI to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidRedirectUri = (redirectUri) => {
    if (!redirectUri) return true // No redirect_uri is okay (non-SSO flow)

    try {
        const url = new URL(redirectUri)
        const origin = `${url.protocol}//${url.host}`
        return ALLOWED_ORIGINS.some(allowed => allowed === origin)
    } catch {
        // Invalid URL format
        return false
    }
}
