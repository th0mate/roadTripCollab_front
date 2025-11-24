<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { login } from '@/services/authService';

const email = ref('');
const password = ref('');
const router = useRouter();
const errorMessage = ref('');

const handleLogin = async () => {
  try {
    const response = await login({ email: email.value, password: password.value });
    // Stocke le token retourné par le backend
    localStorage.setItem('authToken', response.data.token);
    await router.push('/'); // Redirige vers la page d'accueil après la connexion
  } catch (error: any) {
    errorMessage.value = 'Échec de la connexion. Vérifiez vos identifiants.';
    console.error(error);
  }
};
</script>

<template>
  <div class="auth-container">
    <div class="auth-form-wrapper">
      <div class="auth-form">
        <h1 class="auth-title">Bienvenue</h1>
        <p class="auth-subtitle">Connectez-vous à votre compte</p>

        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label for="email">Email</label>
            <div class="input-wrapper">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="currentColor"/>
              </svg>
              <input type="email" id="email" v-model="email" placeholder="votre@email.com" required />
            </div>
          </div>

          <div class="form-group">
            <label for="password">Mot de passe</label>
            <div class="input-wrapper">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" fill="currentColor"/>
              </svg>
              <input type="password" id="password" v-model="password" placeholder="••••••••" required />
            </div>
          </div>

          <div class="forgot-link-wrapper">
            <RouterLink to="/forgot-password" class="forgot-link">Mot de passe oublié ?</RouterLink>
          </div>

          <button type="submit" class="auth-button">Se connecter</button>

          <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
        </form>

        <div class="auth-footer">
          <p>Pas encore de compte ? <RouterLink to="/register" class="signup-link">S'inscrire</RouterLink></p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import "@/assets/styles/loginView.css";
</style>
