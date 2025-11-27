<template>
  <div class="profile-container">
    <h1>Mon Profil</h1>
    <div v-if="user" class="user-info">
      <div v-if="!isEditing">
        <p><strong>Nom complet:</strong> {{ user.fullName }}</p>
        <p><strong>Email:</strong> {{ user.email }}</p>
        <button @click="startEditing" class="btn-edit">Modifier</button>
      </div>
      <div v-else>
        <form @submit.prevent="saveChanges">
          <div class="form-group">
            <label for="fullName">Nom complet</label>
            <input type="text" id="fullName" v-model="editableUser.fullName" />
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" v-model="editableUser.email" />
          </div>
          <div class="btn-group">
            <button type="submit" class="btn-save">Enregistrer</button>
            <button type="button" @click="cancelEditing" class="btn-cancel">Annuler</button>
          </div>
        </form>
      </div>
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
import { getMe, updateMe } from '@/services/authService'
import type { User } from '@/types/user'

export default defineComponent({
  name: 'ProfileView',
  setup() {
    const user = ref<User | null>(null)
    const editableUser = ref<Partial<User>>({})
    const error = ref<string | null>(null)
    const isEditing = ref(false)

    const fetchUser = async () => {
      try {
        user.value = await getMe()
      } catch (err: any) {
        error.value = err.response?.data?.message || err.message || 'Une erreur est survenue.'
        console.error(err)
      }
    }

    const startEditing = () => {
      editableUser.value = { ...user.value }
      isEditing.value = true
    }

    const cancelEditing = () => {
      isEditing.value = false
    }

    const saveChanges = async () => {
      if (!editableUser.value) return
      try {
        const updatedUser = await updateMe(editableUser.value)
        user.value = updatedUser
        isEditing.value = false
      } catch (err: any) {
        error.value = err.response?.data?.message || err.message || 'Une erreur est survenue.'
        console.error(err)
      }
    }

    onMounted(fetchUser)

    return {
      user,
      error,
      isEditing,
      editableUser,
      startEditing,
      cancelEditing,
      saveChanges,
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

.btn-edit, .btn-save, .btn-cancel {
  display: inline-block;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  color: #fff;
  cursor: pointer;
  margin-top: 20px;
  font-size: 1rem;
}

.btn-edit {
  background-color: #007bff;
}

.btn-save {
  background-color: #28a745;
  margin-right: 10px;
}

.btn-cancel {
  background-color: #dc3545;
}

.btn-group {
  margin-top: 20px;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 1rem;
}
</style>
