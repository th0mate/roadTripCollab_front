<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { register } from '@/services/authService';

const fullName = ref('');
const email = ref('');
const password = ref('');
const router = useRouter();
const errorMessage = ref('');
const successMessage = ref('');
const isLoading = ref(false);

const emailError = ref('');
const passwordError = ref('');

const isEmailValid = computed(() => {
  if (!email.value) {
    emailError.value = '';
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.value)) {
    emailError.value = 'Veuillez entrer une adresse email valide.';
    return false;
  }
  emailError.value = '';
  return true;
});

const isPasswordValid = computed(() => {
  if (!password.value) {
    passwordError.value = '';
    return false;
  }
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password.value);
  const hasLowerCase = /[a-z]/.test(password.value);
  const hasDigit = /[0-9]/.test(password.value);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password.value);

  if (password.value.length < minLength) {
    passwordError.value = `Le mot de passe doit contenir au moins ${minLength} caractères.`;
    return false;
  }
  if (!hasUpperCase) {
    passwordError.value = 'Le mot de passe doit contenir au moins une majuscule.';
    return false;
  }
  if (!hasLowerCase) {
    passwordError.value = 'Le mot de passe doit contenir au moins une minuscule.';
    return false;
  }
  if (!hasDigit) {
    passwordError.value = 'Le mot de passe doit contenir au moins un chiffre.';
    return false;
  }
  if (!hasSpecialChar) {
    passwordError.value = 'Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*...).';
    return false;
  }
  passwordError.value = '';
  return true;
});

const handleRegister = async () => {
  if (isLoading.value) return;
  
  errorMessage.value = '';
  successMessage.value = '';

  const emailCheck = isEmailValid.value;
  const passwordCheck = isPasswordValid.value;

  if (!emailCheck || !passwordCheck || !fullName.value) {
    errorMessage.value = 'Veuillez corriger les erreurs dans le formulaire.';
    return;
  }

  isLoading.value = true;

  try {
    await register({ fullName: fullName.value, email: email.value, password: password.value });
    successMessage.value = "Inscription réussie ! Un email de vérification vous a été envoyé. Veuillez vérifier votre boîte de réception (et vos spams).";
    
    fullName.value = '';
    email.value = '';
    password.value = '';

  } catch (error: any) {
    if (error.response && error.response.data && error.response.data.errors) {
      const backendError = error.response.data.errors[0];
      if (backendError.field === 'email' && backendError.rule === 'database.unique') {
        errorMessage.value = 'Cette adresse email est déjà utilisée. Veuillez en choisir une autre.';
      } else {
        errorMessage.value = backendError.message;
      }
    } else {
      errorMessage.value = 'Échec de l\'inscription. Veuillez réessayer.';
    }
    console.error(error);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="register-view">
    <div class="register-view__background"></div>
    
    <div class="register-view__container">
      <div class="register-view__card">
        <div class="register-view__header">
          <div class="register-view__icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/>
            </svg>
          </div>
          <h1 class="register-view__title">Rejoignez-nous</h1>
          <p class="register-view__subtitle">Créez votre compte gratuitement</p>
        </div>

        <form @submit.prevent="handleRegister" class="register-view__form">
          <div class="register-view__form-group">
            <label for="fullName" class="register-view__label">Nom complet</label>
            <div class="register-view__input-wrapper">
              <svg class="register-view__input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/>
              </svg>
              <input 
                type="text" 
                id="fullName" 
                v-model="fullName" 
                class="register-view__input"
                placeholder="Jean Dupont" 
                required 
                :disabled="isLoading"
              />
            </div>
          </div>

          <div class="register-view__form-group" :class="{ 'register-view__form-group--error': emailError }">
            <label for="email" class="register-view__label">Email</label>
            <div class="register-view__input-wrapper">
              <svg class="register-view__input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="currentColor"/>
              </svg>
              <input 
                type="email" 
                id="email" 
                v-model="email" 
                class="register-view__input"
                :class="{ 'register-view__input--error': emailError }"
                placeholder="votre@email.com" 
                required 
                :disabled="isLoading"
              />
            </div>
            <p v-if="emailError" class="register-view__field-error">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
              </svg>
              {{ emailError }}
            </p>
          </div>

          <div class="register-view__form-group" :class="{ 'register-view__form-group--error': passwordError }">
            <label for="password" class="register-view__label">Mot de passe</label>
            <div class="register-view__input-wrapper">
              <svg class="register-view__input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" fill="currentColor"/>
              </svg>
              <input 
                type="password" 
                id="password" 
                v-model="password" 
                class="register-view__input"
                :class="{ 'register-view__input--error': passwordError }"
                placeholder="••••••••" 
                required 
                :disabled="isLoading"
              />
            </div>
            <p v-if="passwordError" class="register-view__field-error">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
              </svg>
              {{ passwordError }}
            </p>
          </div>

          <button type="submit" class="register-view__btn" :disabled="isLoading">
            <span v-if="isLoading" class="register-view__btn-spinner"></span>
            <span v-else>S'inscrire</span>
          </button>

          <div v-if="errorMessage" class="register-view__error">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
            </svg>
            <span>{{ errorMessage }}</span>
          </div>

          <div v-if="successMessage" class="register-view__success">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
            </svg>
            <span>{{ successMessage }}</span>
          </div>
        </form>

        <div class="register-view__footer">
          <p>Déjà un compte ? <RouterLink to="/login" class="register-view__link">Se connecter</RouterLink></p>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
@import "@/assets/styles/registerView.css";
</style>
