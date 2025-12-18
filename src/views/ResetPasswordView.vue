<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute, RouterLink } from 'vue-router';
import { resetPassword } from '@/services/authService';

const password = ref('');
const confirmPassword = ref('');
const router = useRouter();
const route = useRoute();
const successMessage = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

const passwordError = ref('');
const confirmPasswordError = ref('');

const token = ref('');

onMounted(() => {
  token.value = route.query.token as string;
  if (!token.value) {
    errorMessage.value = "Lien de réinitialisation invalide ou manquant.";
  }
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

const isConfirmPasswordValid = computed(() => {
  if (!confirmPassword.value) {
    confirmPasswordError.value = '';
    return false;
  }
  if (confirmPassword.value !== password.value) {
    confirmPasswordError.value = 'Les mots de passe ne correspondent pas.';
    return false;
  }
  confirmPasswordError.value = '';
  return true;
});

const handleResetPassword = async () => {
  if (isLoading.value) return;
  
  errorMessage.value = '';
  successMessage.value = '';

  if (!token.value) {
     errorMessage.value = "Token manquant.";
     return;
  }

  const passwordCheck = isPasswordValid.value;
  const confirmCheck = isConfirmPasswordValid.value;

  if (!passwordCheck || !confirmCheck) {
    errorMessage.value = 'Veuillez corriger les erreurs dans le formulaire.';
    return;
  }

  isLoading.value = true;

  try {
    await resetPassword({ token: token.value, password: password.value });
    successMessage.value = 'Mot de passe réinitialisé avec succès ! Redirection...';
    
    setTimeout(() => {
      router.push('/login');
    }, 2000);

  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'Échec de la réinitialisation. Le lien a peut-être expiré.';
    console.error(error);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="reset-password-view">
    <div class="reset-password-view__background"></div>
    
    <div class="reset-password-view__container">
      <div class="reset-password-view__card">
        <div class="reset-password-view__header">
          <div class="reset-password-view__icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" fill="currentColor"/>
            </svg>
          </div>
          <h1 class="reset-password-view__title">Nouveau mot de passe</h1>
          <p class="reset-password-view__subtitle">Définissez votre nouveau mot de passe sécurisé</p>
        </div>

        <form v-if="token" @submit.prevent="handleResetPassword" class="reset-password-view__form">
          <div class="reset-password-view__form-group" :class="{ 'reset-password-view__form-group--error': passwordError }">
            <label for="password" class="reset-password-view__label">Nouveau mot de passe</label>
            <div class="reset-password-view__input-wrapper">
              <svg class="reset-password-view__input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" fill="currentColor"/>
              </svg>
              <input 
                type="password" 
                id="password" 
                v-model="password" 
                class="reset-password-view__input"
                :class="{ 'reset-password-view__input--error': passwordError }"
                placeholder="••••••••" 
                required 
                :disabled="isLoading"
              />
            </div>
            <p v-if="passwordError" class="reset-password-view__field-error">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
              </svg>
              {{ passwordError }}
            </p>
          </div>

          <div class="reset-password-view__form-group" :class="{ 'reset-password-view__form-group--error': confirmPasswordError }">
            <label for="confirmPassword" class="reset-password-view__label">Confirmer le mot de passe</label>
            <div class="reset-password-view__input-wrapper">
              <svg class="reset-password-view__input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/>
              </svg>
              <input 
                type="password" 
                id="confirmPassword" 
                v-model="confirmPassword" 
                class="reset-password-view__input"
                :class="{ 'reset-password-view__input--error': confirmPasswordError }"
                placeholder="••••••••" 
                required 
                :disabled="isLoading"
              />
            </div>
            <p v-if="confirmPasswordError" class="reset-password-view__field-error">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
              </svg>
              {{ confirmPasswordError }}
            </p>
          </div>

          <button type="submit" class="reset-password-view__btn" :disabled="isLoading">
            <span v-if="isLoading" class="reset-password-view__btn-spinner"></span>
            <span v-else>Réinitialiser</span>
          </button>

          <div v-if="successMessage" class="reset-password-view__success">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
            </svg>
            <span>{{ successMessage }}</span>
          </div>

          <div v-if="errorMessage" class="reset-password-view__error">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
            </svg>
            <span>{{ errorMessage }}</span>
          </div>
        </form>

        <div v-else class="reset-password-view__invalid">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
          </svg>
          <span>{{ errorMessage }}</span>
        </div>

        <div class="reset-password-view__footer">
          <RouterLink to="/login" class="reset-password-view__link">Se connecter</RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
@import "@/assets/styles/resetPasswordView.css";
</style>
