<template>
  <div class="verify-container">
    <div v-if="loading" class="loading">
      Validation de votre email en cours...
    </div>
    <div v-else-if="success" class="success">
      <h1>Email vérifié !</h1>
      <p>{{ message }}</p>
      <router-link to="/login" class="btn-login">Se connecter</router-link>
    </div>
    <div v-else class="error">
      <h1>Erreur</h1>
      <p>{{ error }}</p>
      <router-link to="/login" class="btn-back">Retour à la connexion</router-link>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import apiClient from '@/services/api'

export default defineComponent({
  name: 'VerifyEmailView',
  setup() {
    const route = useRoute()
    const loading = ref(true)
    const success = ref(false)
    const message = ref('')
    const error = ref('')

    onMounted(async () => {
      const token = route.query.token as string
      
      if (!token) {
        error.value = "Aucun token de vérification fourni."
        loading.value = false
        return
      }

      try {
        const response = await apiClient.post('/auth/verify-email', { token })
        success.value = true
        message.value = response.data.message
      } catch (err: any) {
        success.value = false
        error.value = err.response?.data?.message || "La vérification a échoué."
      } finally {
        loading.value = false
      }
    })

    return {
      loading,
      success,
      message,
      error
    }
  }
})
</script>

<style scoped>
.verify-container {
  max-width: 500px;
  margin: 4rem auto;
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

.success h1 { color: #28a745; }
.error h1 { color: #dc3545; }

.btn-login, .btn-back {
  display: inline-block;
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 5px;
}

.btn-back {
  background-color: #6c757d;
}
</style>
