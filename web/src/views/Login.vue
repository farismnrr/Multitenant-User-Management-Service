<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useQuotes } from '../composables/useQuotes'
import { usePasswordToggle } from '../composables/usePasswordToggle'
import NetworkBackground from '../components/NetworkBackground.vue'

const authStore = useAuthStore()
const username = ref('')
const password = ref('')
const { showPassword, togglePassword } = usePasswordToggle()

// Use shared quotes composable
const { currentQuote } = useQuotes()

const handleLogin = async () => {
    await authStore.login(username.value, password.value)
}
</script>

<template>
  <div class="split-screen">
    <!-- Left Side: Brand/Visuals -->
    <div class="panel-visual">
       <!-- Animation Component -->
       <NetworkBackground />
       
      <div class="visual-content">
        <div class="brand-container">
            <img src="/logo.svg" alt="IoTNet Logo" class="brand-logo-large" />
            <!-- Optional: Keep text if needed, or remove. User said "posisi iotnetnya kurang bagus", using logo is safer -->
        </div>
        <div class="quote-container">
            <transition name="fade" mode="out-in">
              <p class="brand-quote" :key="currentQuote.text">"{{ currentQuote.text }}"</p>
            </transition>
            <span class="brand-author">— {{ currentQuote.author }}</span>
        </div>
      </div>
      <div class="overlay-gradient"></div>
    </div>

    <!-- Right Side: Login Form -->
    <div class="panel-form">
      <div class="form-container">
        <div class="form-header">
          <img src="/logo.svg" alt="IoTNet Logo" class="brand-logo-mobile" />
          <h1>Welcome Back</h1>
          <p>Please enter your credentials to access your dashboard.</p>
        </div>

        <form @submit.prevent="handleLogin" class="auth-form">
          <div class="input-group">
            <label for="username">Email or Username</label>
            <div class="input-wrapper">
                <input 
                type="text" 
                id="username" 
                v-model="username" 
                placeholder="Ex: johndoe" 
                required
                autofocus
                />
            </div>
          </div>

          <div class="input-group">
            <label for="password">Password</label>
            <div class="input-wrapper">
                <input 
                :type="showPassword ? 'text' : 'password'" 
                id="password" 
                v-model="password" 
                placeholder="Enter your password" 
                required
                />
                <button type="button" class="toggle-password" @click="togglePassword">
                    <!-- Eye Icon (Show) -->
                    <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    <!-- Eye Off Icon (Hide) -->
                    <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                </button>
            </div>
          </div>

          <div v-if="authStore.error" class="error-alert">
            <p>{{ authStore.error }}</p>
          </div>

          <button type="submit" :disabled="authStore.loading" class="btn-primary">
            <span v-if="authStore.loading">Signing in...</span>
            <span v-else>Sign In</span>
          </button>
        </form>

        <div class="form-footer">
          <p>New to IoTNet? <RouterLink to="/register">Create an account</RouterLink></p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.split-screen {
  display: flex;
  min-height: 100vh;
  width: 100%;
}

/* Visual Panel (Left) */
.panel-visual {
  flex: 1;
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); /* Deep Navy to Indigo */
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 4rem;
  position: relative;
  overflow: hidden;
  color: white;
}

@media (min-width: 1024px) {
  .panel-visual {
    display: flex;
  }
}

.overlay-gradient {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(to bottom, rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.5));
  z-index: 1;
}

.visual-content {
  position: relative;
  z-index: 10;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.brand-container {
    margin-top: 1rem;
}

.brand-logo-large {
    height: 48px; /* Adjust as needed */
    width: auto;
}

.brand-logo-mobile {
  display: block;
  height: 40px;
  width: auto;
  margin: 0 auto 1.5rem auto;
}

@media (min-width: 1024px) {
  .brand-logo-mobile {
    display: none;
  }
}

@media (min-width: 1024px) {
  .panel-visual {
    display: flex;
  }
}

.overlay-gradient {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(to bottom, rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.4));
  z-index: 1;
}

.visual-content {
  position: relative;
  z-index: 10;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.brand-title {
  font-size: 2.5rem; /* Larger font */
  font-weight: 800;
  letter-spacing: -0.02em;
  color: white;
}

.quote-container {
    max-width: 480px;
}

.brand-quote {
  font-size: 1.75rem; /* Larger quote */
  font-weight: 600;
  line-height: 1.3;
  color: white;
  margin-bottom: 1.5rem;
}

.brand-author {
    font-size: 1rem;
    color: #94a3b8;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

/* Form Panel (Right) */
.panel-form {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  padding: 2rem;
}

.form-container {
  width: 100%;
  max-width: 420px; /* Slightly wider */
}

.form-header {
  text-align: center;
  margin-bottom: 3rem;
}

.form-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text-main);
  margin-bottom: 0.75rem;
  letter-spacing: -0.01em;
}

.form-header p {
  color: var(--color-text-muted);
  font-size: 1rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-group label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-main);
}

.input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.input-wrapper input {
    width: 100%;
    padding-right: 2.5rem; /* Space for icon */
}

/* Password Toggle Config */
.toggle-password {
    position: absolute;
    right: 0.75rem;
    background: none;
    border: none;
    padding: 0;
    color: #94a3b8;
    cursor: pointer;
    display: flex;
    align-items: center;
    transition: color 0.2s;
}

.toggle-password:hover {
    color: var(--color-primary);
}

.error-alert {
  padding: 0.75rem;
  background-color: #fef2f2;
  border: 1px solid #fee2e2;
  border-radius: var(--radius-md);
  color: var(--color-error);
  font-size: 0.875rem;
  text-align: center;
}

.form-footer {
  margin-top: 2.5rem;
  text-align: center;
  font-size: 0.95rem;
  color: var(--color-text-muted);
}

/* Fade Transition for Quotes */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
