<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink } from 'vue-router';
import { forgotPassword } from '@/services/authService';

const email = ref('');
const successMessage = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

const handleForgotPassword = async () => {
  if (isLoading.value) return;
  
  errorMessage.value = '';
  successMessage.value = '';
  
  if (!email.value) {
    errorMessage.value = 'Veuillez entrer votre adresse email.';
    return;
  }

  isLoading.value = true;

  try {
    await forgotPassword({ email: email.value });
    successMessage.value = 'Si un compte est associé à cet email, un lien de réinitialisation a été envoyé.';
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
       errorMessage.value = "Aucun compte n'est associé à cet email.";
    } else {
       errorMessage.value = "Une erreur est survenue. Veuillez réessayer plus tard.";
    }
    console.error(error);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="forgot-password-view">
    <div class="forgot-password-view__background"></div>
    
    <div class="forgot-password-view__container">
      <div class="forgot-password-view__card">
        <div class="forgot-password-view__header">
          <div class="forgot-password-view__icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" fill="currentColor"/>
            </svg>
          </div>
          <h1 class="forgot-password-view__title">Mot de passe oublié</h1>
          <p class="forgot-password-view__subtitle">Entrez votre email pour recevoir un lien de réinitialisation</p>
        </div>

        <form @submit.prevent="handleForgotPassword" class="forgot-password-view__form">
          <div class="forgot-password-view__form-group">
            <label for="email" class="forgot-password-view__label">Email</label>
            <div class="forgot-password-view__input-wrapper">
              <svg class="forgot-password-view__input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="currentColor"/>
              </svg>
              <input 
                type="email" 
                id="email" 
                v-model="email" 
                class="forgot-password-view__input"
                placeholder="votre@email.com" 
                required 
                :disabled="isLoading"
              />
            </div>
          </div>

          <button type="submit" class="forgot-password-view__btn" :disabled="isLoading">
            <span v-if="isLoading" class="forgot-password-view__btn-spinner"></span>
            <span v-else>Envoyer le lien</span>
          </button>

          <div v-if="successMessage" class="forgot-password-view__success">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
            </svg>
            <span>{{ successMessage }}</span>
          </div>

          <div v-if="errorMessage" class="forgot-password-view__error">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
            </svg>
            <span>{{ errorMessage }}</span>
          </div>
        </form>

        <div class="forgot-password-view__footer">
          <RouterLink to="/login" class="forgot-password-view__back-link">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="currentColor"/>
            </svg>
            Retour à la connexion
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
@import "@/assets/styles/forgotPasswordView.css";
</style>
