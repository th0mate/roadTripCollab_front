<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { login } from '@/services/authService';
import '@/assets/styles/loginView.css';

const email = ref('');
const password = ref('');
const router = useRouter();
const errorMessage = ref('');

const handleLogin = async () => {
  try {
    const data = await login({ email: email.value, password: password.value });
    // Supposons que le backend renvoie un token que vous stockez
    // localStorage.setItem('authToken', data.token);
    await router.push('/'); // Redirige vers la page d'accueil après la connexion
  } catch (error: any) {
    errorMessage.value = 'Échec de la connexion. Vérifiez vos identifiants.';
    console.error(error);
  }
};
</script>

<template>
  <div class="login-view">
    <h1>Connexion</h1>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" v-model="email" required />
      </div>
      <div class="form-group">
        <label for="password">Mot de passe</label>
        <input type="password" id="password" v-model="password" required />
      </div>
      <button type="submit">Se connecter</button>
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    </form>
  </div>
</template>
