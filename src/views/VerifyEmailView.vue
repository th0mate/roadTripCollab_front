<template>
  <div class="verify-email-view">
    <div class="verify-email-view__background"></div>

    <div class="verify-email-view__container">
      <div class="verify-email-view__card">
        <div v-if="loading" class="verify-email-view__loading">
          <div class="verify-email-view__loading-icon">
            <div class="verify-email-view__spinner"></div>
          </div>
          <h1 class="verify-email-view__title">Vérification en cours</h1>
          <p class="verify-email-view__subtitle">Validation de votre email...</p>
        </div>

        <div v-else-if="success" class="verify-email-view__content">
          <div class="verify-email-view__icon verify-email-view__icon--success">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/>
            </svg>
          </div>
          <h1 class="verify-email-view__title">Email vérifié !</h1>
          <p class="verify-email-view__subtitle">{{ message }}</p>

          <div class="verify-email-view__success-message">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
            </svg>
            <span>Votre compte est maintenant actif</span>
          </div>

          <router-link to="/login" class="verify-email-view__btn">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 7L9.6 8.4l2.6 2.6H2v2h10.2l-2.6 2.6L11 17l5-5-5-5zm9 12h-8v2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-8v2h8v14z" fill="currentColor"/>
            </svg>
            Se connecter
          </router-link>
        </div>

        <div v-else class="verify-email-view__content">
          <div class="verify-email-view__icon verify-email-view__icon--error">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
            </svg>
          </div>
          <h1 class="verify-email-view__title verify-email-view__title--error">Erreur de vérification</h1>
          <p class="verify-email-view__subtitle">{{ error }}</p>

          <div class="verify-email-view__error-message">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
            </svg>
            <span>Le lien a peut-être expiré ou est invalide</span>
          </div>

          <router-link to="/login" class="verify-email-view__btn verify-email-view__btn--secondary">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="currentColor"/>
            </svg>
            Retour à la connexion
          </router-link>
        </div>
      </div>
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

<style>
@import "@/assets/styles/verifyEmailView.css";
</style>
