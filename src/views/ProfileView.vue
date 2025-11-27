<template>
  <div class="profile-container">
    <h1>Mon Profil</h1>
    <div v-if="user" class="user-info">
      <p><strong>Nom complet:</strong> {{ user.fullName }}</p>
      <p><strong>Email:</strong> {{ user.email }}</p>
      <!-- Ajoutez d'autres informations de l'utilisateur ici si nécessaire -->
    </div>
    <div v-else-if="error" class="error-message">
      <p>Erreur lors de la récupération des informations de l'utilisateur : {{ error }}</p>
    </div>
    <div v-else>
      <p>Chargement des informations...</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'
import { getMe } from '@/services/authService'
import type { User } from '@/types/user'

export default defineComponent({
  name: 'ProfileView',
  setup() {
    const user = ref<User | null>(null)
    const error = ref<string | null>(null)

    onMounted(async () => {
      try {
        user.value = await getMe()
      } catch (err: any) {
        error.value = err.response?.data?.message || err.message || 'Une erreur est survenue.'
        console.error(err)
      }
    })

    return {
      user,
      error,
    }
  },
})
</script>

<style scoped>
.profile-container {
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  background-color: #fff;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 2rem;
}

.user-info p {
  font-size: 1.1rem;
  line-height: 1.6;
  color: #555;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
  margin-bottom: 10px;
}

.user-info p:last-child {
  border-bottom: none;
}

.user-info strong {
  color: #333;
}

.error-message {
  color: #d9534f;
  text-align: center;
}

</style>
