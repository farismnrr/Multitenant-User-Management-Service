import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Home from '../views/Home.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: Home,
            meta: { requiresAuth: true, title: 'Dashboard' }
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
        }
    ]
})

router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()

    // Wait for auth initialization if first load
    // If we are doing "refreshToken on App mount", we might need to wait here or let the App component handle the initial check.
    // However, navigation guards run *before* the component mounts. 
    // We can trigger the refresh here if not initialized.
    if (to.meta.title) {
        document.title = `${to.meta.title} - IoTNet`
    }

    if (!authStore.isInitialized) {
        await authStore.refreshToken()
    }

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        next({ name: 'login' })
    } else if (to.meta.guestOnly && authStore.isAuthenticated) {
        next({ name: 'home' })
    } else {
        next()
    }
})

export default router
