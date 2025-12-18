<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { login } from '@/services/authService';

const email = ref('');
const password = ref('');
const router = useRouter();
const errorMessage = ref('');
const isLoading = ref(false);

const handleLogin = async () => {
  if (isLoading.value) return;
  
  isLoading.value = true;
  errorMessage.value = '';
  
  try {
    const response = await login({ email: email.value, password: password.value });
    localStorage.setItem('authToken', response.data.token);
    await router.push('/');
  } catch (error: any) {
    errorMessage.value = 'Échec de la connexion. Vérifiez vos identifiants.';
    console.error(error);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="login-view">
    <div class="login-view__background"></div>
    
    <div class="login-view__container">
      <div class="login-view__card">
        <div class="login-view__header">
          <div class="login-view__icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/>
            </svg>
          </div>
          <h1 class="login-view__title">Bienvenue</h1>
          <p class="login-view__subtitle">Connectez-vous à votre compte</p>
        </div>

        <form @submit.prevent="handleLogin" class="login-view__form">
          <div class="login-view__form-group">
            <label for="email" class="login-view__label">Email</label>
            <div class="login-view__input-wrapper">
              <svg class="login-view__input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="currentColor"/>
              </svg>
              <input 
                type="email" 
                id="email" 
                v-model="email" 
                class="login-view__input"
                placeholder="votre@email.com" 
                required 
                :disabled="isLoading"
              />
            </div>
          </div>

          <div class="login-view__form-group">
            <label for="password" class="login-view__label">Mot de passe</label>
            <div class="login-view__input-wrapper">
              <svg class="login-view__input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" fill="currentColor"/>
              </svg>
              <input 
                type="password" 
                id="password" 
                v-model="password" 
                class="login-view__input"
                placeholder="••••••••" 
                required 
                :disabled="isLoading"
              />
            </div>
          </div>

          <div class="login-view__forgot-wrapper">
            <RouterLink to="/forgot-password" class="login-view__forgot-link">Mot de passe oublié ?</RouterLink>
          </div>

          <button type="submit" class="login-view__btn" :disabled="isLoading">
            <span v-if="isLoading" class="login-view__btn-spinner"></span>
            <span v-else>Se connecter</span>
          </button>

          <div v-if="errorMessage" class="login-view__error">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
            </svg>
            <span>{{ errorMessage }}</span>
          </div>
        </form>

        <div class="login-view__footer">
          <p>Pas encore de compte ? <RouterLink to="/register" class="login-view__link">S'inscrire</RouterLink></p>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
@import "@/assets/styles/loginView.css";
</style>
