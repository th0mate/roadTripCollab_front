<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { forgotPassword } from '@/services/authService';

const email = ref('');
const router = useRouter();
const successMessage = ref('');
const errorMessage = ref('');

const handleForgotPassword = async () => {
  errorMessage.value = '';
  successMessage.value = '';
  if (!email.value) {
    errorMessage.value = 'Veuillez entrer votre adresse email.';
    return;
  }

  try {
    await forgotPassword({ email: email.value });
    successMessage.value = 'Si un compte est associé à cet email, un lien de réinitialisation a été envoyé.';
  } catch (error: any) {
    // Si le backend renvoie 404 (non trouvé) comme nous l'avons codé
    if (error.response && error.response.status === 404) {
       errorMessage.value = "Aucun compte n'est associé à cet email.";
    } else {
       errorMessage.value = "Une erreur est survenue. Veuillez réessayer plus tard.";
    }
    console.error(error);
  }
};
</script>

<template>
  <div class="auth-container">
    <div class="auth-form-wrapper">
      <div class="auth-form">
        <h1 class="auth-title">Mot de passe oublié</h1>
        <p class="auth-subtitle">Entrez votre email pour recevoir un lien de réinitialisation</p>

        <form @submit.prevent="handleForgotPassword">
          <div class="form-group">
            <label for="email">Email</label>
            <div class="input-wrapper">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="currentColor"/>
              </svg>
              <input type="email" id="email" v-model="email" placeholder="votre@email.com" required />
            </div>
          </div>

          <button type="submit" class="auth-button">Envoyer le lien</button>

          <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
          <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
        </form>

        <div class="auth-footer">
          <p><RouterLink to="/login" class="signup-link">← Retour à la connexion</RouterLink></p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import "@/assets/styles/forgotPasswordView.css";
</style>
