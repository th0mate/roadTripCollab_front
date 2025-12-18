<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { resetPassword } from '@/services/authService';

const password = ref('');
const confirmPassword = ref('');
const router = useRouter();
const route = useRoute();
const successMessage = ref('');
const errorMessage = ref('');

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
  if (confirmPassword.value !== password.value) {
    confirmPasswordError.value = 'Les mots de passe ne correspondent pas.';
    return false;
  }
  confirmPasswordError.value = '';
  return true;
});

const handleResetPassword = async () => {
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

  try {
    await resetPassword({ token: token.value, password: password.value });
    successMessage.value = 'Mot de passe réinitialisé avec succès ! Redirection...';
    
    setTimeout(() => {
      router.push('/login');
    }, 2000);

  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'Échec de la réinitialisation. Le lien a peut-être expiré.';
    console.error(error);
  }
};
</script>

<template>
  <div class="auth-container">
    <div class="auth-form-wrapper">
      <div class="auth-form">
        <h1 class="auth-title">Nouveau mot de passe</h1>
        <p class="auth-subtitle">Définissez votre nouveau mot de passe sécurisé</p>

        <form @submit.prevent="handleResetPassword" v-if="token">
          <div class="form-group">
            <label for="password">Nouveau mot de passe</label>
            <div class="input-wrapper">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                 <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" fill="currentColor"/>
              </svg>
              <input type="password" id="password" v-model="password" placeholder="••••••••" required />
            </div>
            <p v-if="passwordError" class="validation-error">{{ passwordError }}</p>
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirmer le mot de passe</label>
             <div class="input-wrapper">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                 <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" fill="currentColor"/>
              </svg>
              <input type="password" id="confirmPassword" v-model="confirmPassword" placeholder="••••••••" required />
            </div>
            <p v-if="confirmPasswordError" class="validation-error">{{ confirmPasswordError }}</p>
          </div>

          <button type="submit" class="auth-button">Réinitialiser</button>

          <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
          <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
        </form>
        <div v-else class="error-message">
             {{ errorMessage }}
        </div>

        <div class="auth-footer">
          <p><RouterLink to="/login" class="signup-link">Se connecter</RouterLink></p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import "@/assets/styles/registerView.css";
</style>
