// Use runtime config if available, otherwise fallback
// Only public values are loaded - no secrets/API keys in client
const config = window.config || { ENDPOINT: '', ALLOWED_ORIGINS: '' }

export const API_URL = config.ENDPOINT || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5500')
export const ALLOWED_ORIGINS_CONFIG = config.ALLOWED_ORIGINS || ''
