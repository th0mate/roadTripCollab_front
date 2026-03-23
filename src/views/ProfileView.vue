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
  catch (err: any) { error.value = err.response?.data?.message || 'Erreur.' }
}

const handleFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.[0]) return
  const file = input.files[0]
  if (file.size > 5 * 1024 * 1024) { error.value = 'Max 5 Mo.'; return }
  
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
  if (file.size > 5 * 1024 * 1024) { formError.value = 'Max 5 Mo.'; return }
  
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
  clearAllErrors()
  isEditing.value = true
}

const cancelEditing = () => { 
  isEditing.value = false
  newProfilePicture.value = null
  newProfilePictureFile.value = null
  removeAvatarFlag.value = false
  clearAllErrors() 
}

const validateForm = (): boolean => {
  let ok = true; clearAllErrors()
  if (!editableUser.value.fullName?.trim()) { fieldErrors.fullName = 'Requis.'; ok = false }
  if (!editableUser.value.email?.trim()) { fieldErrors.email = 'Requis.'; ok = false }
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editableUser.value.email)) { fieldErrors.email = 'Email invalide.'; ok = false }
  if (passwordForm.value.newPassword) {
    if (!passwordForm.value.currentPassword) { fieldErrors.currentPassword = 'Requis pour changer le mot de passe.'; ok = false }
    if (passwordForm.value.newPassword.length < 8) { fieldErrors.newPassword = 'Min. 8 caractères.'; ok = false }
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
  <div class="page-wrapper nav-safe-zone">
    <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      <div class="mb-8">
        <h1 class="text-2xl font-bold text-zinc-900 dark:text-white mb-1">Mon Profil</h1>
        <p class="text-sm text-zinc-500 dark:text-zinc-400">Gérez vos informations personnelles.</p>
      </div>

      <div v-if="error && !isEditing" class="mb-6 flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400">
        <i class="fi fi-rr-exclamation text-sm leading-none"></i>
        <span class="text-sm">{{ error }}</span>
      </div>

      <div v-if="!user && !error" class="flex justify-center py-20">
        <div class="spinner w-8 h-8 text-primary-500 border-2"></div>
      </div>

      <div v-else-if="user" class="space-y-5">

        <template v-if="!isEditing">
          <div class="paper-card overflow-hidden">
            <div class="h-24 bg-gradient-to-r from-primary-400 to-primary-600"></div>
            <div class="px-6 pb-6">
              <div class="relative -mt-12 mb-4 w-fit">
                <div class="w-20 h-20 rounded-2xl border-4 border-white dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-700 overflow-hidden group cursor-pointer shadow-sm" @click="fileInputRef?.click()">
                  <img v-if="displayProfilePicture" :src="displayProfilePicture" :alt="user.fullName" class="w-full h-full object-cover" />
                  <span v-else class="w-full h-full flex items-center justify-center text-2xl font-bold text-zinc-400">{{ userInitials }}</span>
                  <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                    <i class="fi fi-rr-camera text-white text-lg leading-none"></i>
                  </div>
                </div>
                <input ref="fileInputRef" type="file" accept="image/*" class="hidden" @change="handleFileChange" />
              </div>

              <div class="flex items-start justify-between gap-4">
                <div>
                  <h2 class="text-lg font-bold text-zinc-900 dark:text-white">{{ user.fullName }}</h2>
                  <p class="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 mt-0.5">
                    <i class="fi fi-rr-envelope text-xs leading-none"></i>
                    {{ user.email }}
                  </p>
                </div>
                <button @click="startEditing" class="btn-secondary text-sm shrink-0">
                  <i class="fi fi-rr-edit text-sm leading-none"></i>
                  Modifier
                </button>
              </div>
            </div>
          </div>

          <div class="paper-card p-6 border-rose-200 dark:border-rose-500/30">
            <h3 class="font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2 mb-2 text-sm">
              <i class="fi fi-rr-triangle-warning leading-none"></i>
              Zone dangereuse
            </h3>
            <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-4">La suppression de votre compte est irréversible.</p>
            <button @click="showDeleteModal = true" class="btn-danger text-sm">
              <i class="fi fi-rr-trash leading-none"></i>
              Supprimer mon compte
            </button>
          </div>
        </template>

        <template v-else>
          <form @submit.prevent="saveChanges" class="paper-card overflow-hidden">
            <div class="px-6 py-4 border-b border-zinc-100 dark:border-zinc-700 flex items-center justify-between">
              <h2 class="font-semibold text-zinc-900 dark:text-white text-sm">Modifier le profil</h2>
              <button type="button" @click="cancelEditing" class="btn-ghost w-7 h-7 !px-0 rounded-lg">
                <i class="fi fi-rr-cross-small text-sm leading-none"></i>
              </button>
            </div>

            <div class="p-6 space-y-6">
              <div v-if="formError" class="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400">
                <i class="fi fi-rr-exclamation text-sm leading-none"></i>
                <span class="text-sm">{{ formError }}</span>
              </div>

              <div>
                <p class="form-label">Photo de profil</p>
                <div class="flex items-center gap-4">
                  <div class="w-16 h-16 rounded-xl bg-zinc-100 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 overflow-hidden flex items-center justify-center shrink-0">
                    <img v-if="previewProfilePicture" :src="previewProfilePicture" alt="Aperçu" class="w-full h-full object-cover" />
                    <span v-else class="text-xl font-bold text-zinc-400">{{ userInitials }}</span>
                  </div>
                  <div class="space-y-2">
                    <div class="flex gap-2">
                      <button type="button" @click="editFileInputRef?.click()" class="btn-secondary text-xs py-1.5 px-3">
                        <i class="fi fi-rr-picture leading-none"></i> Choisir
                      </button>
                      <button v-if="previewProfilePicture" type="button" @click="removeProfilePicture" class="btn-danger text-xs py-1.5 px-3">
                        <i class="fi fi-rr-trash leading-none"></i>
                      </button>
                    </div>
                    <p class="text-xs text-zinc-400">JPG, PNG. Max 5 Mo.</p>
                  </div>
                  <input ref="editFileInputRef" type="file" accept="image/*" class="hidden" @change="handleEditFileChange" />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label for="fullName" class="form-label">Nom complet</label>
                  <input type="text" id="fullName" v-model="editableUser.fullName" @input="clearFieldError('fullName')" class="input-field" :class="{ 'input-error': fieldErrors.fullName }" />
                  <p v-if="fieldErrors.fullName" class="mt-1 text-xs text-rose-500">{{ fieldErrors.fullName }}</p>
                </div>
                <div>
                  <label for="email" class="form-label">Adresse email</label>
                  <input type="email" id="email" v-model="editableUser.email" @input="clearFieldError('email')" class="input-field" :class="{ 'input-error': fieldErrors.email }" />
                  <p v-if="fieldErrors.email" class="mt-1 text-xs text-rose-500">{{ fieldErrors.email }}</p>
                </div>
              </div>

              <div class="divider"></div>

              <div>
                <p class="font-semibold text-zinc-900 dark:text-white text-sm mb-1">Changer de mot de passe</p>
                <p class="text-xs text-zinc-400 mb-4">Laissez vide si vous ne souhaitez pas modifier votre mot de passe.</p>
                <div class="space-y-4">
                  <div>
                    <label for="currentPassword" class="form-label">Mot de passe actuel</label>
                    <input type="password" id="currentPassword" v-model="passwordForm.currentPassword" @input="clearFieldError('currentPassword')" class="input-field" :class="{ 'input-error': fieldErrors.currentPassword }" placeholder="Requis pour changer" />
                    <p v-if="fieldErrors.currentPassword" class="mt-1 text-xs text-rose-500">{{ fieldErrors.currentPassword }}</p>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label for="newPassword" class="form-label">Nouveau</label>
                      <input type="password" id="newPassword" v-model="passwordForm.newPassword" @input="clearFieldError('newPassword')" class="input-field" :class="{ 'input-error': fieldErrors.newPassword }" placeholder="••••••••" />
                      <p v-if="fieldErrors.newPassword" class="mt-1 text-xs text-rose-500">{{ fieldErrors.newPassword }}</p>
                    </div>
                    <div>
                      <label for="confirmPassword" class="form-label">Confirmer</label>
                      <input type="password" id="confirmPassword" v-model="passwordForm.confirmPassword" @input="clearFieldError('confirmPassword')" class="input-field" :class="{ 'input-error': fieldErrors.confirmPassword }" placeholder="••••••••" />
                      <p v-if="fieldErrors.confirmPassword" class="mt-1 text-xs text-rose-500">{{ fieldErrors.confirmPassword }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="px-6 py-4 border-t border-zinc-100 dark:border-zinc-700 flex justify-end gap-3">
              <button type="button" @click="cancelEditing" class="btn-ghost text-sm">Annuler</button>
              <button type="submit" class="btn-primary text-sm">
                <i class="fi fi-rr-disk leading-none"></i>
                Enregistrer
              </button>
            </div>
          </form>
        </template>
      </div>

      <AppModal
        v-model="showDeleteModal"
        type="danger"
        title="Supprimer le compte"
        message="Cette action est irréversible. Toutes vos données seront effacées."
        confirm-text="Supprimer définitivement"
        cancel-text="Annuler"
        @confirm="confirmDeleteAccount"
      />
    </div>
  </div>
</template>
