<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { register } from '@/services/authService';

const fullName = ref('');
const email = ref('');
const password = ref('');
const router = useRouter();
const errorMessage = ref('');

const handleRegister = async () => {
  try {
    await register({ fullName: fullName.value, email: email.value, password: password.value });
    await router.push('/login'); // Redirige vers la page de connexion après l'inscription
  } catch (error: any) {
    errorMessage.value = 'Échec de l\'inscription. Veuillez réessayer.';
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
        <input type="email" id="email" v-model="email" required />
      </div>
      <div class="form-group">
        <label for="password">Mot de passe</label>
        <input type="password" id="password" v-model="password" required />
      </div>
      <button type="submit">S'inscrire</button>
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    </form>
  </div>
</template>

<style scoped>
.register-view {
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
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
button:hover {
  background-color: #218838;
}
.error-message {
  color: red;
  margin-top: 10px;
}
</style>
