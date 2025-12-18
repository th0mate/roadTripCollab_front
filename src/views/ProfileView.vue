<template>
  <div class="profile-view">
    <div class="profile-view__container">
      <div v-if="error && !isEditing" class="profile-view__error">
        <i class="fi fi-rr-exclamation"></i>
        <span>{{ error }}</span>
      </div>

      <div v-if="!user && !error" class="profile-view__loading">
        <div class="profile-view__loading-spinner"></div>
        <p>Chargement de votre profil...</p>
      </div>

      <template v-if="user">
        <div class="profile-view__header">
          <div class="profile-view__header-content">
            <div class="profile-view__avatar-wrapper">
              <div class="profile-view__avatar">
                <img
                  v-if="displayProfilePicture"
                  :src="displayProfilePicture"
                  :alt="user.fullName"
                  class="profile-view__avatar-img"
                />
                <span v-else>{{ userInitials }}</span>
              </div>
              <button class="profile-view__avatar-edit" @click="triggerFileInput" title="Modifier la photo">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
                </svg>
              </button>
              <input
                ref="fileInputRef"
                type="file"
                accept="image/*"
                class="profile-view__avatar-input"
                @change="handleFileChange"
              />
            </div>
            <div class="profile-view__header-info">
              <h1 class="profile-view__name">{{ user.fullName }}</h1>
              <p class="profile-view__email">{{ user.email }}</p>
            </div>
          </div>
        </div>

        <div class="profile-view__card">
          <template v-if="!isEditing">
            <h2 class="profile-view__section-title">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/>
              </svg>
              Informations personnelles
            </h2>

            <div class="profile-view__info-grid">
              <div class="profile-view__info-item">
                <span class="profile-view__info-label">Nom complet</span>
                <span class="profile-view__info-value">{{ user.fullName }}</span>
              </div>
              <div class="profile-view__info-item">
                <span class="profile-view__info-label">Adresse email</span>
                <span class="profile-view__info-value">{{ user.email }}</span>
              </div>
            </div>

            <div class="profile-view__actions">
              <button @click="startEditing" class="profile-view__btn profile-view__btn--primary">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
                </svg>
                Modifier mon profil
              </button>
              <button @click="handleDeleteAccount" class="profile-view__btn profile-view__btn--danger">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
                </svg>
                Supprimer mon compte
              </button>
            </div>
          </template>

          <template v-else>
            <h2 class="profile-view__section-title">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
              </svg>
              Modifier mes informations
            </h2>

            <form @submit.prevent="saveChanges" class="profile-view__form">
              <div class="profile-view__avatar-upload">
                <div class="profile-view__avatar-preview">
                  <img
                    v-if="previewProfilePicture"
                    :src="previewProfilePicture"
                    alt="Aperçu"
                    class="profile-view__avatar-preview-img"
                  />
                  <span v-else>{{ userInitials }}</span>
                </div>
                <div class="profile-view__avatar-upload-content">
                  <p class="profile-view__avatar-upload-title">Photo de profil</p>
                  <p class="profile-view__avatar-upload-hint">JPG, PNG ou GIF. 5 Mo max.</p>
                  <div class="profile-view__avatar-upload-actions">
                    <button type="button" @click="triggerEditFileInput" class="profile-view__avatar-upload-btn profile-view__avatar-upload-btn--choose">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 7v2.99s-1.99.01-2 0V7h-3s.01-1.99 0-2h3V2h2v3h3v2h-3zm-3 4V8h-3V5H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-8h-3zM5 19l3-4 2 3 3-4 4 5H5z" fill="currentColor"/>
                      </svg>
                      Choisir une photo
                    </button>
                    <button
                      v-if="previewProfilePicture"
                      type="button"
                      @click="removeProfilePicture"
                      class="profile-view__avatar-upload-btn profile-view__avatar-upload-btn--remove"
                    >
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
                      </svg>
                      Supprimer
                    </button>
                  </div>
                  <input
                    ref="editFileInputRef"
                    type="file"
                    accept="image/*"
                    class="profile-view__avatar-input"
                    @change="handleEditFileChange"
                  />
                </div>
              </div>

              <div class="profile-view__form-group" :class="{ 'profile-view__form-group--error': fieldErrors.fullName }">
                <label for="fullName" class="profile-view__label">Nom complet</label>
                <div class="profile-view__input-wrapper">
                  <svg class="profile-view__input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/>
                  </svg>
                  <input
                    type="text"
                    id="fullName"
                    v-model="editableUser.fullName"
                    class="profile-view__input"
                    :class="{ 'profile-view__input--error': fieldErrors.fullName }"
                    placeholder="Votre nom complet"
                    @input="clearFieldError('fullName')"
                  />
                </div>
                <p v-if="fieldErrors.fullName" class="profile-view__field-error">
                  <i class="fi fi-rr-exclamation"></i>
                  {{ fieldErrors.fullName }}
                </p>
              </div>

              <div class="profile-view__form-group" :class="{ 'profile-view__form-group--error': fieldErrors.email }">
                <label for="email" class="profile-view__label">Email</label>
                <div class="profile-view__input-wrapper">
                  <svg class="profile-view__input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="currentColor"/>
                  </svg>
                  <input
                    type="email"
                    id="email"
                    v-model="editableUser.email"
                    class="profile-view__input"
                    :class="{ 'profile-view__input--error': fieldErrors.email }"
                    placeholder="votre@email.com"
                    @input="clearFieldError('email')"
                  />
                </div>
                <p v-if="fieldErrors.email" class="profile-view__field-error">
                  <i class="fi fi-rr-exclamation"></i>
                  {{ fieldErrors.email }}
                </p>
              </div>

              <hr class="profile-view__separator" />

              <div class="profile-view__password-section">
                <h3 class="profile-view__password-title">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" fill="currentColor"/>
                  </svg>
                  Changer de mot de passe
                </h3>

                <div class="profile-view__form-group" :class="{ 'profile-view__form-group--error': fieldErrors.currentPassword }">
                  <label for="currentPassword" class="profile-view__label">Mot de passe actuel</label>
                  <div class="profile-view__input-wrapper">
                    <svg class="profile-view__input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" fill="currentColor"/>
                    </svg>
                    <input
                      type="password"
                      id="currentPassword"
                      v-model="passwordForm.currentPassword"
                      class="profile-view__input"
                      :class="{ 'profile-view__input--error': fieldErrors.currentPassword }"
                      placeholder="Requis pour changer de mot de passe"
                      @input="clearFieldError('currentPassword')"
                    />
                  </div>
                  <p v-if="fieldErrors.currentPassword" class="profile-view__field-error">
                    <i class="fi fi-rr-exclamation"></i>
                    {{ fieldErrors.currentPassword }}
                  </p>
                </div>

                <div class="profile-view__form-group" :class="{ 'profile-view__form-group--error': fieldErrors.newPassword }">
                  <label for="newPassword" class="profile-view__label">Nouveau mot de passe</label>
                  <div class="profile-view__input-wrapper">
                    <svg class="profile-view__input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" fill="currentColor"/>
                    </svg>
                    <input
                      type="password"
                      id="newPassword"
                      v-model="passwordForm.newPassword"
                      class="profile-view__input"
                      :class="{ 'profile-view__input--error': fieldErrors.newPassword }"
                      placeholder="Laisser vide pour conserver l'actuel"
                      @input="clearFieldError('newPassword')"
                    />
                  </div>
                  <p v-if="fieldErrors.newPassword" class="profile-view__field-error">
                    <i class="fi fi-rr-exclamation"></i>
                    {{ fieldErrors.newPassword }}
                  </p>
                </div>

                <div class="profile-view__form-group" :class="{ 'profile-view__form-group--error': fieldErrors.confirmPassword }">
                  <label for="confirmPassword" class="profile-view__label">Confirmer le nouveau mot de passe</label>
                  <div class="profile-view__input-wrapper">
                    <svg class="profile-view__input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/>
                    </svg>
                    <input
                      type="password"
                      id="confirmPassword"
                      v-model="passwordForm.confirmPassword"
                      class="profile-view__input"
                      :class="{ 'profile-view__input--error': fieldErrors.confirmPassword }"
                      placeholder="Confirmez votre nouveau mot de passe"
                      @input="clearFieldError('confirmPassword')"
                    />
                  </div>
                  <p v-if="fieldErrors.confirmPassword" class="profile-view__field-error">
                    <i class="fi fi-rr-exclamation"></i>
                    {{ fieldErrors.confirmPassword }}
                  </p>
                </div>
              </div>

              <div v-if="formError" class="profile-view__form-alert">
                <i class="fi fi-rr-triangle-warning"></i>
                <span>{{ formError }}</span>
              </div>

              <div class="profile-view__form-actions">
                <button type="submit" class="profile-view__btn profile-view__btn--primary">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/>
                  </svg>
                  Enregistrer les modifications
                </button>
                <button type="button" @click="cancelEditing" class="profile-view__btn profile-view__btn--secondary">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
                  </svg>
                  Annuler
                </button>
              </div>
            </form>
          </template>
        </div>
      </template>
    </div>

    <AppModal
      v-model="showDeleteModal"
      type="danger"
      title="Supprimer votre compte"
      message="Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible et toutes vos données seront définitivement effacées."
      confirm-text="Supprimer"
      cancel-text="Annuler"
      @confirm="confirmDeleteAccount"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed, onMounted } from 'vue'
import { getMe, updateMe, deleteAccount } from '@/services/authService'
import type { User } from '@/types/user'
import { useRouter } from 'vue-router'
import AppModal from '@/components/AppModal.vue'

export default defineComponent({
  name: 'ProfileView',
  components: {
    AppModal
  },
  setup() {
    const user = ref<User | null>(null)
    const editableUser = ref<Partial<User>>({})
    const passwordForm = ref({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
    const error = ref<string | null>(null)
    const formError = ref<string | null>(null)
    const fieldErrors = reactive<Record<string, string | null>>({
      fullName: null,
      email: null,
      currentPassword: null,
      newPassword: null,
      confirmPassword: null,
    })
    const isEditing = ref(false)
    const showDeleteModal = ref(false)
    const router = useRouter()

    const fileInputRef = ref<HTMLInputElement | null>(null)
    const editFileInputRef = ref<HTMLInputElement | null>(null)
    const newProfilePicture = ref<string | null>(null)
    const newProfilePictureFile = ref<File | null>(null)

    const apiBaseUrl = import.meta.env.VITE_API_URL || ''

    const userInitials = computed(() => {
      if (!user.value?.fullName) return '?'
      const parts = user.value.fullName.trim().split(' ')
      if (parts.length >= 2) {
        const firstInitial = parts[0]?.[0] || ''
        const lastInitial = parts[parts.length - 1]?.[0] || ''
        return (firstInitial + lastInitial).toUpperCase()
      }
      return parts[0]?.substring(0, 2).toUpperCase() || '?'
    })

    const displayProfilePicture = computed(() => {
      if (user.value?.profilePicture) {
        if (user.value.profilePicture.startsWith('http')) {
          return user.value.profilePicture
        }
        return `${apiBaseUrl}${user.value.profilePicture}`
      }
      return null
    })

    const previewProfilePicture = computed(() => {
      if (newProfilePicture.value) {
        return newProfilePicture.value
      }
      if (editableUser.value?.profilePicture) {
        if (editableUser.value.profilePicture.startsWith('http')) {
          return editableUser.value.profilePicture
        }
        return `${apiBaseUrl}${editableUser.value.profilePicture}`
      }
      return null
    })

    const clearFieldError = (field: string) => {
      fieldErrors[field] = null
      formError.value = null
    }

    const clearAllErrors = () => {
      Object.keys(fieldErrors).forEach(key => {
        fieldErrors[key] = null
      })
      formError.value = null
      error.value = null
    }

    const fetchUser = async () => {
      try {
        user.value = await getMe()
      } catch (err: any) {
        error.value = err.response?.data?.message || err.message || 'Une erreur est survenue.'
        console.error(err)
      }
    }

    const triggerFileInput = () => {
      fileInputRef.value?.click()
    }

    const triggerEditFileInput = () => {
      editFileInputRef.value?.click()
    }

    const handleFileChange = async (event: Event) => {
      const input = event.target as HTMLInputElement
      if (input.files && input.files[0]) {
        const file = input.files[0]
        if (file.size > 5 * 1024 * 1024) {
          error.value = 'La photo ne doit pas dépasser 5 Mo.'
          return
        }

        const reader = new FileReader()
        reader.onload = async (e) => {
          const base64 = e.target?.result as string
          try {
            const updatedUser = await updateMe({ profilePicture: base64 })
            user.value = updatedUser
          } catch (err: any) {
            error.value = err.response?.data?.message || err.message || 'Une erreur est survenue.'
            console.error(err)
          }
        }
        reader.readAsDataURL(file)
      }
      input.value = ''
    }

    const handleEditFileChange = (event: Event) => {
      const input = event.target as HTMLInputElement
      if (input.files && input.files[0]) {
        const file = input.files[0]
        if (file.size > 5 * 1024 * 1024) {
          formError.value = 'La photo ne doit pas dépasser 5 Mo.'
          return
        }

        newProfilePictureFile.value = file
        const reader = new FileReader()
        reader.onload = (e) => {
          newProfilePicture.value = e.target?.result as string
        }
        reader.readAsDataURL(file)
      }
      input.value = ''
    }

    const removeProfilePicture = () => {
      newProfilePicture.value = null
      newProfilePictureFile.value = null
      editableUser.value.profilePicture = undefined
    }

    const startEditing = () => {
      editableUser.value = { ...user.value }
      passwordForm.value = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }
      newProfilePicture.value = null
      newProfilePictureFile.value = null
      clearAllErrors()
      isEditing.value = true
    }

    const cancelEditing = () => {
      isEditing.value = false
      newProfilePicture.value = null
      newProfilePictureFile.value = null
      clearAllErrors()
    }

    const validateForm = (): boolean => {
      let isValid = true
      clearAllErrors()

      if (!editableUser.value.fullName?.trim()) {
        fieldErrors.fullName = 'Le nom complet est requis.'
        isValid = false
      }

      if (!editableUser.value.email?.trim()) {
        fieldErrors.email = 'L\'email est requis.'
        isValid = false
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editableUser.value.email)) {
        fieldErrors.email = 'L\'email n\'est pas valide.'
        isValid = false
      }

      if (passwordForm.value.newPassword) {
        if (!passwordForm.value.currentPassword) {
          fieldErrors.currentPassword = 'Le mot de passe actuel est requis pour changer de mot de passe.'
          isValid = false
        }
        if (passwordForm.value.newPassword.length < 6) {
          fieldErrors.newPassword = 'Le nouveau mot de passe doit contenir au moins 6 caractères.'
          isValid = false
        }
        if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
          fieldErrors.confirmPassword = 'Les mots de passe ne correspondent pas.'
          isValid = false
        }
      }

      return isValid
    }

    const saveChanges = async () => {
      if (!editableUser.value) return

      if (!validateForm()) {
        formError.value = 'Veuillez corriger les erreurs ci-dessus.'
        return
      }

      const dataToUpdate: any = { ...editableUser.value }
      delete dataToUpdate.password

      if (newProfilePicture.value) {
        dataToUpdate.profilePicture = newProfilePicture.value
      } else if (editableUser.value.profilePicture === undefined && user.value?.profilePicture) {
        dataToUpdate.profilePicture = null
      }

      if (passwordForm.value.newPassword) {
        dataToUpdate.password = passwordForm.value.newPassword
        dataToUpdate.currentPassword = passwordForm.value.currentPassword
      }

      try {
        const updatedUser = await updateMe(dataToUpdate)
        user.value = updatedUser
        isEditing.value = false
        newProfilePicture.value = null
        newProfilePictureFile.value = null
        clearAllErrors()
      } catch (err: any) {
        formError.value = err.response?.data?.message || err.message || 'Une erreur est survenue.'
        console.error(err)
      }
    }

    const handleDeleteAccount = () => {
      showDeleteModal.value = true
    }

    const confirmDeleteAccount = async () => {
      try {
        await deleteAccount()
        router.push('/')
      } catch (err: any) {
        error.value = err.response?.data?.message || err.message || 'Une erreur est survenue lors de la suppression.'
        console.error(err)
      }
    }

    onMounted(fetchUser)

    return {
      user,
      error,
      formError,
      fieldErrors,
      isEditing,
      editableUser,
      passwordForm,
      userInitials,
      displayProfilePicture,
      previewProfilePicture,
      fileInputRef,
      editFileInputRef,
      triggerFileInput,
      triggerEditFileInput,
      handleFileChange,
      handleEditFileChange,
      removeProfilePicture,
      clearFieldError,
      startEditing,
      cancelEditing,
      saveChanges,
      handleDeleteAccount,
      showDeleteModal,
      confirmDeleteAccount,
    }
  },
})
</script>

<style>
@import "@/assets/styles/profileView.css";
</style>
