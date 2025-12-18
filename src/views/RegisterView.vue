<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { register } from '@/services/authService';

const fullName = ref('');
const email = ref('');
const password = ref('');
const router = useRouter();
const errorMessage = ref('');
const successMessage = ref('');

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
  errorMessage.value = '';
  successMessage.value = '';

  const emailCheck = isEmailValid.value;
  const passwordCheck = isPasswordValid.value;

  if (!emailCheck || !passwordCheck || !fullName.value) {
    errorMessage.value = 'Veuillez corriger les erreurs dans le formulaire.';
    return;
  }

  try {
    const response = await register({ fullName: fullName.value, email: email.value, password: password.value });
    successMessage.value = "Inscription réussie ! Un email de vérification vous a été envoyé. Veuillez vérifier votre boîte de réception (et vos spams).";
    
    // Vider le formulaire
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
  }
};
</script>

<template>
  <div class="auth-container">
    <div class="auth-form-wrapper">
      <div class="auth-form">
        <h1 class="auth-title">Rejoignez-nous</h1>
        <p class="auth-subtitle">Créez votre compte gratuitement</p>

        <form @submit.prevent="handleRegister">
          <div class="form-group">
            <label for="fullName">Nom complet</label>
            <div class="input-wrapper">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/>
              </svg>
              <input type="text" id="fullName" v-model="fullName" placeholder="Jean Dupont" required />
            </div>
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <div class="input-wrapper">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="currentColor"/>
              </svg>
              <input type="email" id="email" v-model="email" placeholder="votre@email.com" required />
            </div>
            <p v-if="emailError" class="validation-error">{{ emailError }}</p>
          </div>

          <div class="form-group">
            <label for="password">Mot de passe</label>
            <div class="input-wrapper">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" fill="currentColor"/>
              </svg>
              <input type="password" id="password" v-model="password" placeholder="••••••••" required />
            </div>
            <p v-if="passwordError" class="validation-error">{{ passwordError }}</p>
          </div>

          <button type="submit" class="auth-button">S'inscrire</button>

          <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
          <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
        </form>

        <div class="auth-footer">
          <p>Déjà un compte ? <RouterLink to="/login" class="signup-link">Se connecter</RouterLink></p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import "@/assets/styles/registerView.css";
</style>
