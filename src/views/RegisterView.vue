<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { register } from '@/services/authService';
import '@/assets/styles/registerView.css';

const fullName = ref('');
const email = ref('');
const password = ref('');
const router = useRouter();
const errorMessage = ref('');

// Validation states
const emailError = ref('');
const passwordError = ref('');

// Computed property for email validation
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

// Computed property for password validation
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
  errorMessage.value = ''; // Clear previous errors

  // Trigger computed properties to update error messages
  const emailCheck = isEmailValid.value;
  const passwordCheck = isPasswordValid.value;

  if (!emailCheck || !passwordCheck || !fullName.value) {
    errorMessage.value = 'Veuillez corriger les erreurs dans le formulaire.';
    return;
  }

  try {
    const response = await register({ fullName: fullName.value, email: email.value, password: password.value });
    // Stocke le token pour connecter automatiquement l'utilisateur
    localStorage.setItem('authToken', response.data.token);
    await router.push('/'); // Redirige vers la page d'accueil après l'inscription
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || 'Échec de l\'inscription. Veuillez réessayer.';
    console.error(error);
  }
};
</script>

<template>
  <div class="register-view">
    <h1>Créer un compte</h1>
    <form @submit.prevent="handleRegister">
      <div class="form-group">
        <label for="fullName">Nom complet</label>
        <input type="text" id="fullName" v-model="fullName" required />
      </div>
      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" v-model="email" @input="isEmailValid" required />
        <p v-if="emailError" class="error-message">{{ emailError }}</p>
      </div>
      <div class="form-group">
        <label for="password">Mot de passe</label>
        <input type="password" id="password" v-model="password" @input="isPasswordValid" required />
        <p v-if="passwordError" class="error-message">{{ passwordError }}</p>
      </div>
      <button type="submit">S'inscrire</button>
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    </form>
  </div>
</template>
