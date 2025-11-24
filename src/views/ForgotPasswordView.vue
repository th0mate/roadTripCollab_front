<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import '@/assets/styles/forgotPasswordView.css';

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
    // Ici, vous appelleriez votre service pour envoyer la demande de réinitialisation
    // await authService.forgotPassword({ email: email.value });
    
    // Pour la démo, nous allons juste afficher un message de succès
    successMessage.value = 'Si un compte est associé à cet email, un lien de réinitialisation a été envoyé.';
    
    // Optionnel : rediriger après un certain temps
    // setTimeout(() => router.push('/login'), 5000);

  } catch (error: any) {
    // Même en cas d'erreur, pour des raisons de sécurité, il est souvent préférable
    // de montrer le même message de succès pour ne pas révéler quels emails existent dans la base de données.
    successMessage.value = 'Si un compte est associé à cet email, un lien de réinitialisation a été envoyé.';
    console.error(error);
  }
};
</script>

<template>
  <div class="forgot-password-view">
    <h1>Mot de passe oublié</h1>
    <p>Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.</p>
    <form @submit.prevent="handleForgotPassword">
      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" v-model="email" required />
      </div>
      <button type="submit">Envoyer</button>
      <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    </form>
  </div>
</template>
