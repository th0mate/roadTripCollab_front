<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { getMe, updateMe, deleteAccount } from '../services/authService'
import type { User } from '../types/user'
import { useRouter } from 'vue-router'
import AppModal from '../components/AppModal.vue'

const user = ref<User | null>(null)
const editableUser = ref<Partial<User>>({})
const passwordForm = ref({ currentPassword: '', newPassword: '', confirmPassword: '' })
const error = ref<string | null>(null)
const formError = ref<string | null>(null)
const fieldErrors = reactive<Record<string, string | null>>({ fullName: null, email: null, currentPassword: null, newPassword: null, confirmPassword: null })
const isEditing = ref(false)
const showDeleteModal = ref(false)
const showPasswordSection = ref(false)
const saveSuccess = ref(false)
const router = useRouter()
const fileInputRef = ref<HTMLInputElement | null>(null)
const editFileInputRef = ref<HTMLInputElement | null>(null)
const newProfilePicture = ref<string | null>(null)
const newProfilePictureFile = ref<File | null>(null)
const removeAvatarFlag = ref(false)
const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3333'

const userInitials = computed(() => {
  if (!user.value?.fullName) return '?'
  const parts = user.value.fullName.trim().split(' ')
  if (parts.length >= 2) return ((parts[0]?.[0] || '') + (parts[parts.length - 1]?.[0] || '')).toUpperCase()
  return parts[0]?.substring(0, 2).toUpperCase() || '?'
})
const displayProfilePicture = computed(() => {
  if (!user.value?.avatar) return null
  return user.value.avatar.startsWith('http') ? user.value.avatar : `${apiBaseUrl}${user.value.avatar}`
})
const previewProfilePicture = computed(() => {
  if (newProfilePicture.value) return newProfilePicture.value
  if (removeAvatarFlag.value) return null
  if (!editableUser.value?.avatar) return null
  return editableUser.value.avatar.startsWith('http') ? editableUser.value.avatar : `${apiBaseUrl}${editableUser.value.avatar}`
})

const clearFieldError = (field: string) => { fieldErrors[field] = null; formError.value = null }
const clearAllErrors = () => { Object.keys(fieldErrors).forEach(k => fieldErrors[k] = null); formError.value = null; error.value = null }

const fetchUser = async () => {
  try { user.value = await getMe() }
  catch (err: any) { error.value = err.response?.data?.message || 'Erreur lors du chargement.' }
}

const handleFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.[0]) return
  const file = input.files[0]
  if (file.size > 5 * 1024 * 1024) { error.value = 'Fichier trop volumineux (max 5 Mo).'; return }
  try {
    user.value = await updateMe({ avatar: file })
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Erreur lors de l\'upload.'
  }
  input.value = ''
}

const handleEditFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.[0]) return
  const file = input.files[0]
  if (file.size > 5 * 1024 * 1024) { formError.value = 'Fichier trop volumineux (max 5 Mo).'; return }
  newProfilePictureFile.value = file
  removeAvatarFlag.value = false
  const reader = new FileReader()
  reader.onload = (e) => { newProfilePicture.value = e.target?.result as string }
  reader.readAsDataURL(file)
  input.value = ''
}

const removeProfilePicture = () => {
  newProfilePicture.value = null
  newProfilePictureFile.value = null
  removeAvatarFlag.value = true
}

const startEditing = () => {
  editableUser.value = { ...user.value }
  passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
  newProfilePicture.value = null
  newProfilePictureFile.value = null
  removeAvatarFlag.value = false
  showPasswordSection.value = false
  clearAllErrors()
  isEditing.value = true
}

const cancelEditing = () => {
  isEditing.value = false
  showPasswordSection.value = false
  newProfilePicture.value = null
  newProfilePictureFile.value = null
  removeAvatarFlag.value = false
  clearAllErrors()
}

const validateForm = (): boolean => {
  let ok = true; clearAllErrors()
  if (!editableUser.value.fullName?.trim()) { fieldErrors.fullName = 'Ce champ est requis.'; ok = false }
  if (!editableUser.value.email?.trim()) { fieldErrors.email = 'Ce champ est requis.'; ok = false }
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editableUser.value.email)) { fieldErrors.email = 'Adresse email invalide.'; ok = false }
  if (passwordForm.value.newPassword) {
    if (!passwordForm.value.currentPassword) { fieldErrors.currentPassword = 'Requis pour changer le mot de passe.'; ok = false }
    if (passwordForm.value.newPassword.length < 8) { fieldErrors.newPassword = 'Minimum 8 caractères.'; ok = false }
    if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) { fieldErrors.confirmPassword = 'Les mots de passe ne correspondent pas.'; ok = false }
  }
  return ok
}

const saveChanges = async () => {
  if (!validateForm() || !editableUser.value) return
  try {
    const dataToUpdate: any = {
      fullName: editableUser.value.fullName,
      email: editableUser.value.email
    }
    if (newProfilePictureFile.value) {
      dataToUpdate.avatar = newProfilePictureFile.value
    } else if (removeAvatarFlag.value) {
      dataToUpdate.removeAvatar = 'true'
    }
    if (passwordForm.value.newPassword) {
      dataToUpdate.currentPassword = passwordForm.value.currentPassword
      dataToUpdate.password = passwordForm.value.newPassword
    }
    await updateMe(dataToUpdate)
    user.value = await getMe()
    isEditing.value = false
    showPasswordSection.value = false
    saveSuccess.value = true
    setTimeout(() => { saveSuccess.value = false }, 3000)
  } catch (err: any) {
    formError.value = err.response?.data?.message || 'Erreur lors de la sauvegarde.'
  }
}

const confirmDeleteAccount = async () => {
  try { await deleteAccount(); localStorage.removeItem('authToken'); router.push('/') }
  catch (err: any) { error.value = err.response?.data?.message || 'Erreur lors de la suppression.' }
}

onMounted(fetchUser)
</script>

<template>
  <div>
    <div class="page-wrapper nav-safe-zone">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">

        <div class="mb-10 fade-in-up">
          <span class="section-label">Mon espace</span>
          <h1 class="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-white">Profil</h1>
        </div>

        <div v-if="error && !user" class="mb-6 flex items-center gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm fade-in-up">
          <i class="fi fi-rr-exclamation leading-none shrink-0"></i>
          {{ error }}
        </div>

        <div v-if="!user && !error" class="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
          <div class="paper-card overflow-hidden">
            <div class="p-7 space-y-5">
              <div class="w-24 h-24 rounded-3xl skeleton-pulse"></div>
              <div class="space-y-2">
                <div class="h-7 w-40 rounded-xl skeleton-pulse"></div>
                <div class="h-4 w-52 rounded-lg skeleton-pulse"></div>
              </div>
              <div class="grid grid-cols-2 gap-3 pt-5 border-t border-zinc-100 dark:border-zinc-800">
                <div class="h-14 rounded-2xl skeleton-pulse"></div>
                <div class="h-14 rounded-2xl skeleton-pulse"></div>
              </div>
            </div>
            <div class="px-7 pb-7">
              <div class="h-11 rounded-full skeleton-pulse"></div>
            </div>
          </div>
          <div class="space-y-4">
            <div class="paper-card h-36 skeleton-pulse rounded-3xl"></div>
            <div class="paper-card h-24 skeleton-pulse rounded-3xl"></div>
            <div class="paper-card h-20 skeleton-pulse rounded-3xl"></div>
          </div>
        </div>

        <div v-if="user" class="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
          <div class="identity-card paper-card relative overflow-hidden fade-in-up" :class="{ 'ring-2 ring-primary-400/40': saveSuccess }">
            <div class="dot-grid absolute inset-0 pointer-events-none"></div>
            <div class="absolute left-0 inset-y-0 w-[3px] bg-primary-400 rounded-r-full"></div>

            <div class="relative p-7 pb-0">
              <div class="relative w-fit mb-6">
                <div
                  class="w-[88px] h-[88px] rounded-3xl overflow-hidden cursor-pointer group relative avatar-container"
                  @click="fileInputRef?.click()"
                >
                  <img v-if="displayProfilePicture" :src="displayProfilePicture" :alt="user.fullName" class="w-full h-full object-cover" />
                  <div v-else class="w-full h-full bg-gradient-to-br from-primary-400/25 to-primary-400/8 flex items-center justify-center">
                    <span class="text-3xl font-black text-primary-600 dark:text-primary-400 select-none">{{ userInitials }}</span>
                  </div>
                  <div class="absolute inset-0 bg-zinc-950/55 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <i class="fi fi-rr-camera text-white text-xl leading-none"></i>
                  </div>
                </div>
                <input ref="fileInputRef" type="file" accept="image/*" class="hidden" @change="handleFileChange" />
              </div>

              <div class="mb-6">
                <div v-if="saveSuccess" class="flex items-center gap-2 text-xs font-bold text-primary-600 dark:text-primary-400 mb-2 success-pop">
                  <i class="fi fi-rr-check-circle leading-none"></i>
                  Profil mis à jour
                </div>
                <h2 class="text-2xl font-black tracking-tight text-zinc-900 dark:text-white leading-tight">{{ user.fullName }}</h2>
                <p class="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                  <i class="fi fi-rr-envelope text-[11px] leading-none opacity-60"></i>
                  {{ user.email }}
                </p>
              </div>

              <div class="grid grid-cols-2 gap-3 py-5 border-t border-zinc-100 dark:border-zinc-800/80">
                <div class="stat-pill">
                  <span class="stat-num">—</span>
                  <span class="stat-lbl">Voyages</span>
                </div>
                <div class="stat-pill stat-pill--verified" :class="user.isVerified ? 'verified' : ''">
                  <i class="fi fi-rr-shield-check text-lg leading-none" :class="user.isVerified ? 'text-primary-400' : 'text-zinc-400'"></i>
                  <span class="stat-lbl">{{ user.isVerified ? 'Vérifié' : 'Non vérifié' }}</span>
                </div>
              </div>
            </div>

            <div class="relative px-7 pb-7">
              <button v-if="!isEditing" @click="startEditing" class="btn-primary w-full">
                <i class="fi fi-rr-pencil leading-none"></i>
                Modifier le profil
              </button>
              <button v-else @click="cancelEditing" class="btn-ghost w-full border border-zinc-200 dark:border-zinc-700">
                <i class="fi fi-rr-cross-small leading-none"></i>
                Annuler les modifications
              </button>
            </div>
          </div>

          <div class="space-y-4">

            <template v-if="!isEditing">
              <div class="paper-card overflow-hidden fade-in-up delay-1">
                <div class="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800/50">
                  <div class="flex items-center gap-3">
                    <div class="section-icon">
                      <i class="fi fi-rr-user text-sm text-zinc-600 dark:text-zinc-300 leading-none"></i>
                    </div>
                    <span class="text-sm font-bold text-zinc-900 dark:text-white">Informations personnelles</span>
                  </div>
                  <button @click="startEditing" class="edit-inline-btn">
                    <i class="fi fi-rr-pencil text-[10px] leading-none"></i>
                    Modifier
                  </button>
                </div>
                <div class="p-6 space-y-5">
                  <div class="info-row">
                    <span class="info-lbl">Nom complet</span>
                    <span class="info-val">{{ user.fullName }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-lbl">Adresse email</span>
                    <span class="info-val">{{ user.email }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-lbl">Identifiant</span>
                    <span class="info-val font-mono text-xs text-zinc-400">#{{ user.id }}</span>
                  </div>
                </div>
              </div>

              <div class="paper-card overflow-hidden fade-in-up delay-2">
                <div class="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800/50">
                  <div class="flex items-center gap-3">
                    <div class="section-icon">
                      <i class="fi fi-rr-lock text-sm text-zinc-600 dark:text-zinc-300 leading-none"></i>
                    </div>
                    <span class="text-sm font-bold text-zinc-900 dark:text-white">Sécurité</span>
                  </div>
                  <button @click="startEditing" class="edit-inline-btn">
                    <i class="fi fi-rr-pencil text-[10px] leading-none"></i>
                    Changer
                  </button>
                </div>
                <div class="px-6 py-5">
                  <div class="info-row">
                    <span class="info-lbl">Mot de passe</span>
                    <span class="info-val tracking-[0.25em] text-zinc-400 dark:text-zinc-600">••••••••••</span>
                  </div>
                </div>
              </div>

              <div class="paper-card overflow-hidden border-rose-200/60 dark:border-rose-500/20 fade-in-up delay-3">
                <div class="flex items-center gap-3 px-6 py-4 border-b border-rose-100/80 dark:border-rose-500/10">
                  <div class="section-icon bg-rose-50 dark:bg-rose-500/10">
                    <i class="fi fi-rr-triangle-warning text-sm text-rose-500 leading-none"></i>
                  </div>
                  <span class="text-sm font-bold text-rose-600 dark:text-rose-400">Zone dangereuse</span>
                </div>
                <div class="px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <p class="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    La suppression de votre compte est <span class="font-semibold text-zinc-700 dark:text-zinc-300">irréversible</span>. Toutes vos données seront effacées.
                  </p>
                  <button @click="showDeleteModal = true" class="btn-danger text-sm shrink-0">
                    <i class="fi fi-rr-trash leading-none"></i>
                    Supprimer mon compte
                  </button>
                </div>
              </div>
            </template>

            <template v-else>
              <form @submit.prevent="saveChanges" class="space-y-4">
                <Transition name="fade-down">
                  <div v-if="formError" class="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm">
                    <i class="fi fi-rr-exclamation leading-none shrink-0"></i>
                    {{ formError }}
                  </div>
                </Transition>

                <div class="paper-card overflow-hidden fade-in-up">
                  <div class="flex items-center gap-3 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800/50">
                    <div class="section-icon">
                      <i class="fi fi-rr-picture text-sm text-zinc-600 dark:text-zinc-300 leading-none"></i>
                    </div>
                    <span class="text-sm font-bold text-zinc-900 dark:text-white">Photo de profil</span>
                  </div>
                  <div class="p-6 flex items-center gap-5">
                    <div class="w-16 h-16 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                      <img v-if="previewProfilePicture" :src="previewProfilePicture" alt="Aperçu" class="w-full h-full object-cover" />
                      <span v-else class="text-xl font-black text-zinc-400">{{ userInitials }}</span>
                    </div>
                    <div class="flex-1">
                      <div class="flex flex-wrap gap-2 mb-2">
                        <button type="button" @click="editFileInputRef?.click()" class="btn-secondary text-xs py-2 px-4">
                          <i class="fi fi-rr-picture leading-none"></i>
                          Choisir une photo
                        </button>
                        <button v-if="previewProfilePicture" type="button" @click="removeProfilePicture" class="btn-danger text-xs py-2 px-3">
                          <i class="fi fi-rr-trash leading-none"></i>
                        </button>
                      </div>
                      <p class="text-xs text-zinc-400">JPG ou PNG — maximum 5 Mo</p>
                    </div>
                    <input ref="editFileInputRef" type="file" accept="image/*" class="hidden" @change="handleEditFileChange" />
                  </div>
                </div>

                <div class="paper-card overflow-hidden fade-in-up delay-1">
                  <div class="flex items-center gap-3 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800/50">
                    <div class="section-icon">
                      <i class="fi fi-rr-user text-sm text-zinc-600 dark:text-zinc-300 leading-none"></i>
                    </div>
                    <span class="text-sm font-bold text-zinc-900 dark:text-white">Informations personnelles</span>
                  </div>
                  <div class="p-6 space-y-5">
                    <div>
                      <label for="fullName" class="form-label">Nom complet</label>
                      <input
                        type="text" id="fullName"
                        v-model="editableUser.fullName"
                        @input="clearFieldError('fullName')"
                        class="input-field"
                        :class="{ 'input-error': fieldErrors.fullName }"
                        placeholder="Votre nom complet"
                      />
                      <p v-if="fieldErrors.fullName" class="mt-1.5 text-xs text-rose-500 font-medium">{{ fieldErrors.fullName }}</p>
                    </div>
                    <div>
                      <label for="email" class="form-label">Adresse email</label>
                      <input
                        type="email" id="email"
                        v-model="editableUser.email"
                        @input="clearFieldError('email')"
                        class="input-field"
                        :class="{ 'input-error': fieldErrors.email }"
                        placeholder="votre@email.com"
                      />
                      <p v-if="fieldErrors.email" class="mt-1.5 text-xs text-rose-500 font-medium">{{ fieldErrors.email }}</p>
                    </div>
                  </div>
                </div>

                <div class="paper-card overflow-hidden fade-in-up delay-2">
                  <button
                    type="button"
                    @click="showPasswordSection = !showPasswordSection"
                    class="w-full flex items-center justify-between px-6 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors text-left cursor-pointer"
                    :class="showPasswordSection ? 'border-b border-zinc-100 dark:border-zinc-800/50' : ''"
                  >
                    <div class="flex items-center gap-3">
                      <div class="section-icon">
                        <i class="fi fi-rr-lock text-sm text-zinc-600 dark:text-zinc-300 leading-none"></i>
                      </div>
                      <div>
                        <span class="text-sm font-bold text-zinc-900 dark:text-white block">Changer le mot de passe</span>
                        <span class="text-xs text-zinc-400 dark:text-zinc-500">Optionnel — laissez vide pour conserver</span>
                      </div>
                    </div>
                    <i
                      class="fi leading-none text-lg text-zinc-400 transition-transform duration-200"
                      :class="showPasswordSection ? 'fi-rr-angle-small-up' : 'fi-rr-angle-small-down'"
                    ></i>
                  </button>

                  <Transition name="slide-down">
                    <div v-if="showPasswordSection" class="p-6 space-y-5">
                      <div>
                        <label for="currentPassword" class="form-label">Mot de passe actuel</label>
                        <input
                          type="password" id="currentPassword"
                          v-model="passwordForm.currentPassword"
                          @input="clearFieldError('currentPassword')"
                          class="input-field"
                          :class="{ 'input-error': fieldErrors.currentPassword }"
                          placeholder="Votre mot de passe actuel"
                        />
                        <p v-if="fieldErrors.currentPassword" class="mt-1.5 text-xs text-rose-500 font-medium">{{ fieldErrors.currentPassword }}</p>
                      </div>
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label for="newPassword" class="form-label">Nouveau mot de passe</label>
                          <input
                            type="password" id="newPassword"
                            v-model="passwordForm.newPassword"
                            @input="clearFieldError('newPassword')"
                            class="input-field"
                            :class="{ 'input-error': fieldErrors.newPassword }"
                            placeholder="••••••••"
                          />
                          <p v-if="fieldErrors.newPassword" class="mt-1.5 text-xs text-rose-500 font-medium">{{ fieldErrors.newPassword }}</p>
                        </div>
                        <div>
                          <label for="confirmPassword" class="form-label">Confirmer</label>
                          <input
                            type="password" id="confirmPassword"
                            v-model="passwordForm.confirmPassword"
                            @input="clearFieldError('confirmPassword')"
                            class="input-field"
                            :class="{ 'input-error': fieldErrors.confirmPassword }"
                            placeholder="••••••••"
                          />
                          <p v-if="fieldErrors.confirmPassword" class="mt-1.5 text-xs text-rose-500 font-medium">{{ fieldErrors.confirmPassword }}</p>
                        </div>
                      </div>
                    </div>
                  </Transition>
                </div>

                <div class="flex justify-end gap-3 pb-2 fade-in-up delay-3">
                  <button type="button" @click="cancelEditing" class="btn-secondary">
                    Annuler
                  </button>
                  <button type="submit" class="btn-primary">
                    <i class="fi fi-rr-disk leading-none"></i>
                    Enregistrer
                  </button>
                </div>
              </form>
            </template>

          </div>
        </div>
      </div>
    </div>

    <AppModal
      v-model="showDeleteModal"
      type="danger"
      title="Supprimer le compte"
      message="Cette action est irréversible. Toutes vos données seront définitivement effacées."
      confirm-text="Supprimer définitivement"
      cancel-text="Annuler"
      @confirm="confirmDeleteAccount"
    />
  </div>
</template>

<style scoped>
@reference "../index.css";

.identity-card {
  transition: box-shadow 0.4s ease, ring 0.4s ease;
}

.dot-grid {
  background-image: radial-gradient(circle, rgba(159, 224, 0, 0.18) 1px, transparent 1px);
  background-size: 22px 22px;
}

:global(.dark) .dot-grid {
  background-image: radial-gradient(circle, rgba(204, 255, 0, 0.1) 1px, transparent 1px);
}

.avatar-container {
  box-shadow:
    0 0 0 3px rgba(159, 224, 0, 0.35),
    0 8px 28px rgba(0, 0, 0, 0.1);
}

:global(.dark) .avatar-container {
  box-shadow:
    0 0 0 3px rgba(204, 255, 0, 0.25),
    0 8px 28px rgba(0, 0, 0, 0.4);
}

.stat-pill {
  @apply flex flex-col items-start gap-1 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60;
}

.stat-num {
  @apply text-xl font-black text-zinc-900 dark:text-white leading-none;
}

.stat-lbl {
  @apply text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider;
}

.section-icon {
  @apply w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0;
}

.edit-inline-btn {
  @apply flex items-center gap-1.5 text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors cursor-pointer;
}

.info-row {
  @apply flex items-center justify-between gap-4 py-2.5 border-b border-zinc-50 dark:border-zinc-800/40 last:border-0 last:pb-0 first:pt-0;
}

.info-lbl {
  @apply text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider shrink-0;
}

.info-val {
  @apply text-sm font-semibold text-zinc-900 dark:text-white text-right;
}

.skeleton-pulse {
  @apply bg-zinc-100 dark:bg-zinc-800/80 animate-pulse;
}

.fade-in-up {
  animation: fadeInUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.delay-1 { animation-delay: 0.08s; }
.delay-2 { animation-delay: 0.16s; }
.delay-3 { animation-delay: 0.24s; }

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}

.success-pop {
  animation: successPop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
@keyframes successPop {
  from { opacity: 0; transform: scale(0.85); }
  to   { opacity: 1; transform: scale(1); }
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-8px);
}
.slide-down-enter-to,
.slide-down-leave-from {
  opacity: 1;
  max-height: 500px;
  transform: translateY(0);
}

.fade-down-enter-active,
.fade-down-leave-active {
  transition: all 0.25s ease;
}
.fade-down-enter-from,
.fade-down-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
