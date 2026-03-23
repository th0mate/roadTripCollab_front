<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import AdminLayout from '../../components/admin/AdminLayout.vue'
import AppModal from '../../components/AppModal.vue'
import { getUsers, updateUser, deleteUser } from '../../services/adminService'
import type { AdminUser, PaginatedResponse } from '../../types/admin'

const data = ref<PaginatedResponse<AdminUser> | null>(null)
const loading = ref(true)
const search = ref('')
const currentPage = ref(1)

const confirmModal = ref(false)
const confirmMessage = ref('')
const confirmAction = ref<(() => Promise<void>) | null>(null)

let searchTimeout: ReturnType<typeof setTimeout>

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })

const getUserInitials = (name: string) => name?.substring(0, 2).toUpperCase() ?? '??'

const load = async () => {
  loading.value = true
  try {
    data.value = await getUsers(currentPage.value, search.value)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(load)

watch(search, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    load()
  }, 400)
})

const goToPage = (p: number) => {
  currentPage.value = p
  load()
}

const toggleAdmin = async (user: AdminUser) => {
  const action = user.isAdmin ? 'retirer les droits admin de' : 'accorder les droits admin à'
  confirmMessage.value = `Voulez-vous ${action} ${user.fullName} ?`
  confirmAction.value = async () => {
    await updateUser(user.id, { isAdmin: !user.isAdmin })
    await load()
  }
  confirmModal.value = true
}

const handleDelete = (user: AdminUser) => {
  confirmMessage.value = `Supprimer définitivement l'utilisateur "${user.fullName}" ? Cette action est irréversible.`
  confirmAction.value = async () => {
    await deleteUser(user.id)
    await load()
  }
  confirmModal.value = true
}

const onConfirm = async () => {
  if (confirmAction.value) {
    await confirmAction.value()
  }
  confirmModal.value = false
  confirmAction.value = null
}

const onCancel = () => {
  confirmModal.value = false
  confirmAction.value = null
}
</script>

<template>
  <AdminLayout>
    <div class="animate-fade-in">
      
      <div class="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 class="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Utilisateurs</h1>
          <p class="text-slate-600 dark:text-slate-400">Gérez les membres de la plateforme et leurs permissions.</p>
        </div>
        
        <div class="relative w-full md:w-80">
          <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <i class="fi fi-rr-search"></i>
          </div>
          <input 
            v-model="search" 
            type="text" 
            placeholder="Rechercher (nom, email)..." 
            class="block w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 shadow-sm transition-all"
          />
        </div>
      </div>

      <div v-if="loading && !data" class="flex flex-col items-center justify-center py-20">
        <div class="w-12 h-12 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin mb-4"></div>
        <p class="text-slate-500">Recherche en cours...</p>
      </div>

      <template v-else>
        <div class="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden relative">
          
          <div v-if="loading && data" class="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
             <div class="w-8 h-8 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin"></div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="text-xs uppercase text-slate-500 bg-slate-50 dark:bg-slate-900/30">
                  <th class="px-6 py-4 font-semibold">Utilisateur</th>
                  <th class="px-6 py-4 font-semibold">Statut</th>
                  <th class="px-6 py-4 font-semibold">Rôle</th>
                  <th class="px-6 py-4 font-semibold">Inscription</th>
                  <th class="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
                <tr v-for="user in data?.data" :key="user.id" class="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 flex items-center justify-center text-sm font-bold shrink-0">
                        {{ getUserInitials(user.fullName) }}
                      </div>
                      <div>
                        <p class="text-sm font-bold text-slate-900 dark:text-white">{{ user.fullName }}</p>
                        <p class="text-xs text-slate-500">{{ user.email }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <span class="px-2.5 py-1 text-xs font-bold rounded-lg" :class="user.isVerified ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'">
                      {{ user.isVerified ? 'Vérifié' : 'Non vérifié' }}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <span v-if="user.isAdmin" class="px-2.5 py-1 text-xs font-bold rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                      <i class="fi fi-rr-crown"></i> Admin
                    </span>
                    <span v-else class="text-slate-400">—</span>
                  </td>
                  <td class="px-6 py-4 text-xs text-slate-600 dark:text-slate-400">
                    {{ formatDate(user.createdAt) }}
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-2">
                      <button 
                        @click="toggleAdmin(user)" 
                        class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                        :class="user.isAdmin ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'"
                      >
                        <i :class="user.isAdmin ? 'fi-rr-user-minus' : 'fi-rr-crown'"></i>
                        <span class="hidden xl:inline">{{ user.isAdmin ? 'Révoquer' : 'Admin' }}</span>
                      </button>
                      <button 
                        @click="handleDelete(user)" 
                        class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center gap-1.5"
                      >
                        <i class="fi fi-rr-trash"></i>
                        <span class="hidden xl:inline">Supprimer</span>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="!data?.data?.length">
                  <td colspan="5" class="px-6 py-12 text-center text-slate-500">
                    <i class="fi fi-rr-search text-3xl mb-3 block text-slate-300"></i>
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div v-if="data?.meta && data.meta.lastPage > 1" class="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
            <button 
              @click="goToPage(currentPage - 1)" 
              :disabled="currentPage === 1"
              class="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
            >
              <i class="fi fi-rr-angle-left"></i>
            </button>
            <span class="text-sm font-semibold text-slate-600 dark:text-slate-400">
              Page {{ currentPage }} sur {{ data.meta.lastPage }}
            </span>
            <button 
              @click="goToPage(currentPage + 1)" 
              :disabled="currentPage === data.meta.lastPage"
              class="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
            >
              <i class="fi fi-rr-angle-right"></i>
            </button>
          </div>

        </div>
      </template>
    </div>

    <AppModal
      v-model="confirmModal"
      type="danger"
      title="Confirmation"
      :message="confirmMessage"
      confirm-text="Confirmer"
      cancel-text="Annuler"
      @confirm="onConfirm"
      @cancel="onCancel"
    />
  </AdminLayout>
</template>
