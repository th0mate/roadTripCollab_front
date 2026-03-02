<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import AppModal from '@/components/AppModal.vue'
import { getUsers, updateUser, deleteUser } from '@/services/adminService'
import type { AdminUser, PaginatedResponse } from '@/types/admin'

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
    <div class="admin-page-header">
      <h1>Utilisateurs</h1>
      <p>Gestion de tous les utilisateurs de la plateforme</p>
    </div>

    <!-- Barre de recherche -->
    <div class="admin-toolbar">
      <div class="admin-search">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <input v-model="search" type="text" placeholder="Rechercher par nom ou email…" />
      </div>
    </div>

    <div v-if="loading" class="admin-loading">Chargement…</div>

    <template v-else>
      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Email</th>
              <th>Vérifié</th>
              <th>Admin</th>
              <th>Inscription</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in data?.data" :key="user.id">
              <td>
                <div class="admin-user-cell">
                  <div class="admin-avatar">{{ getUserInitials(user.fullName) }}</div>
                  <div>
                    <div class="admin-user-cell__name">{{ user.fullName }}</div>
                    <div class="admin-user-cell__email">#{{ user.id }}</div>
                  </div>
                </div>
              </td>
              <td>{{ user.email }}</td>
              <td>
                <span class="admin-badge" :class="user.isVerified ? 'admin-badge--verified' : 'admin-badge--unverified'">
                  {{ user.isVerified ? 'Vérifié' : 'Non vérifié' }}
                </span>
              </td>
              <td>
                <span v-if="user.isAdmin" class="admin-badge admin-badge--admin">Admin</span>
                <span v-else style="color: var(--rtc-text-muted); font-size: 0.75rem;">—</span>
              </td>
              <td style="font-size: 0.75rem; color: var(--rtc-text-muted);">{{ formatDate(user.createdAt) }}</td>
              <td>
                <div class="admin-actions">
                  <button
                    class="admin-btn admin-btn--sm admin-btn--warning"
                    @click="toggleAdmin(user)"
                    :title="user.isAdmin ? 'Retirer admin' : 'Accorder admin'"
                  >
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    {{ user.isAdmin ? 'Révoquer' : 'Admin' }}
                  </button>
                  <button
                    class="admin-btn admin-btn--sm admin-btn--danger"
                    @click="handleDelete(user)"
                  >
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <polyline points="3 6 5 6 21 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M19 6l-1 14H6L5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M10 11v6M14 11v6M9 6V4h6v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Supprimer
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!data?.data?.length">
              <td colspan="6">
                <div class="admin-empty">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  Aucun utilisateur trouvé
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div v-if="data?.meta && data.meta.lastPage > 1" class="admin-pagination">
          <button class="admin-btn admin-btn--secondary admin-btn--sm" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">
            ←
          </button>
          <span class="admin-pagination__info">Page {{ currentPage }} / {{ data.meta.lastPage }}</span>
          <button class="admin-btn admin-btn--secondary admin-btn--sm" :disabled="currentPage === data.meta.lastPage" @click="goToPage(currentPage + 1)">
            →
          </button>
        </div>
      </div>
    </template>

    <!-- Modal de confirmation -->
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

<style scoped>
@import '@/assets/styles/adminView.css';
</style>
