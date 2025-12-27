<template>
  <div class="home-container">
    <div class="glass-card">
      <header class="home-header">
        <div class="logo-section">
          <img src="/logo.svg" alt="IoTNet Logo" class="logo" />
          <h1>IoTNet Dashboard</h1>
        </div>
        <button @click="handleLogout" class="logout-btn">
          <span>Logout</span>
        </button>
      </header>

      <main class="home-main">
        <div class="welcome-section">
          <h2>Welcome to IoTNet</h2>
          <p>Your multi-tenant user management system is ready.</p>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">👤</div>
            <div class="stat-content">
              <h3>Users</h3>
              <p>Manage your users</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🏢</div>
            <div class="stat-content">
              <h3>Tenants</h3>
              <p>Manage tenants</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🔐</div>
            <div class="stat-content">
              <h3>Security</h3>
              <p>Secure authentication</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <h3>Analytics</h3>
              <p>View activity logs</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const handleLogout = async () => {
  await authStore.logout()
  router.push({ name: 'login' })
}
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.glass-card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 2.5rem;
  width: 100%;
  max-width: 900px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.home-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo {
  width: 48px;
  height: 48px;
}

.logo-section h1 {
  font-size: 1.75rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.logout-btn {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.logout-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(239, 68, 68, 0.4);
}

.welcome-section {
  text-align: center;
  margin-bottom: 2rem;
}

.welcome-section h2 {
  font-size: 2rem;
  font-weight: 700;
  color: #f8fafc;
  margin-bottom: 0.5rem;
}

.welcome-section p {
  color: #94a3b8;
  font-size: 1.1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;
}

.stat-card:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-4px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
}

.stat-icon {
  font-size: 2.5rem;
}

.stat-content h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #f8fafc;
  margin-bottom: 0.25rem;
}

.stat-content p {
  font-size: 0.875rem;
  color: #94a3b8;
}
</style>
