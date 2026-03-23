<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { verifyChangeEmail } from '../services/authService'

const route = useRoute()
const loading = ref(true)
const success = ref(false)
const message = ref('')
const error = ref('')

onMounted(async () => {
  const token = route.query.token as string
  if (!token) { error.value = "Aucun token fourni."; loading.value = false; return; }
  try {
    const response = await verifyChangeEmail(token)
    success.value = true; message.value = response.message
  } catch (err: any) {
    success.value = false; error.value = err.response?.data?.message || "La vérification a échoué."
  } finally { loading.value = false; }
})
</script>

<template>
  <div class="page-wrapper flex items-center justify-center px-4">
    <div class="w-full max-w-sm">
      <div class="paper-card p-8 text-center">
        <div v-if="loading" class="flex flex-col items-center gap-4 py-4">
          <div class="spinner w-10 h-10 text-primary-500 border-[3px]"></div>
          <p class="text-sm font-medium text-zinc-500">Validation en cours…</p>
        </div>
        <div v-else-if="success" class="flex flex-col items-center gap-4 py-4">
          <div class="w-16 h-16 bg-primary-50 dark:bg-primary-500/10 rounded-2xl flex items-center justify-center">
            <i class="fi fi-rr-check-circle text-primary-500 text-3xl leading-none"></i>
          </div>
          <div>
            <h1 class="text-xl font-bold text-zinc-900 dark:text-white mb-1">Email mis à jour !</h1>
            <p class="text-sm text-zinc-500 dark:text-zinc-400">{{ message }}</p>
          </div>
          <RouterLink to="/profile" class="btn-primary w-full justify-center py-2.5">Retour au profil</RouterLink>
        </div>
        <div v-else class="flex flex-col items-center gap-4 py-4">
          <div class="w-16 h-16 bg-rose-50 dark:bg-rose-500/10 rounded-2xl flex items-center justify-center">
            <i class="fi fi-rr-cross-circle text-rose-500 text-3xl leading-none"></i>
          </div>
          <div>
            <h1 class="text-xl font-bold text-zinc-900 dark:text-white mb-1">Erreur</h1>
            <p class="text-sm text-rose-600 dark:text-rose-400">{{ error }}</p>
          </div>
          <RouterLink to="/profile" class="btn-secondary w-full justify-center py-2.5">Retour au profil</RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>
