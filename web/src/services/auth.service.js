import api from './api'

class AuthService {
    async login(email_or_username, password) {
        const response = await api.post('/auth/login', {
            email_or_username,
            password
        })
        return response.data
    }

    async register(username, email, password, role = 'user') {
        const response = await api.post('/auth/register', {
            username,
            email,
            password,
            role
        })
        return response.data
    }

    async logout(token) {
        return await api.delete('/auth/logout', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
    }

    async refresh() {
        const response = await api.get('/auth/refresh')
        return response.data
    }
}

export default new AuthService()
