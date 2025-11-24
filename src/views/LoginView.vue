<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { login } from '@/services/authService';

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

<style scoped>
.login-view {
  max-width: 400px;
  margin: 50px auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
}
.form-group {
  margin-bottom: 15px;
}
label {
  display: block;
  margin-bottom: 5px;
}
input {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
}
button {
  width: 100%;
  padding: 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
button:hover {
  background-color: #0056b3;
}
.error-message {
  color: red;
  margin-top: 10px;
}
</style>
