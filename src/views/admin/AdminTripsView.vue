<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import AppModal from '@/components/AppModal.vue'
import { getTrips, updateTrip, deleteTrip } from '@/services/adminService'
import type { AdminTrip, PaginatedResponse } from '@/types/admin'

const data = ref<PaginatedResponse<AdminTrip> | null>(null)
const loading = ref(true)
const search = ref('')
const statusFilter = ref('')
const currentPage = ref(1)

const confirmModal = ref(false)
const confirmMessage = ref('')
const confirmAction = ref<(() => Promise<void>) | null>(null)

let searchTimeout: ReturnType<typeof setTimeout>

const statusOptions = [
  { value: '', label: 'Tous les statuts' },
  { value: 'planning', label: 'Planification' },
  { value: 'active', label: 'En cours' },
  { value: 'completed', label: 'Terminé' },
  { value: 'cancelled', label: 'Annulé' },
]

const statusLabel: Record<string, string> = {
  planning: 'Planification',
  active: 'En cours',
  completed: 'Terminé',
  cancelled: 'Annulé',
}

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const formatAmount = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)

const load = async () => {
  loading.value = true
  try {
    data.value = await getTrips(currentPage.value, search.value, statusFilter.value)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(load)

watch(statusFilter, () => {
  currentPage.value = 1
  load()
})

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

const changeStatus = (trip: AdminTrip) => {
  const nextStatus = trip.status === 'planning' ? 'active'
    : trip.status === 'active' ? 'completed'
    : trip.status === 'completed' ? 'cancelled'
    : 'planning'

  confirmMessage.value = `Changer le statut du voyage "${trip.title}" de "${statusLabel[trip.status]}" à "${statusLabel[nextStatus]}" ?`
  confirmAction.value = async () => {
    await updateTrip(trip.id, { status: nextStatus })
    await load()
  }
  confirmModal.value = true
}

const handleDelete = (trip: AdminTrip) => {
  confirmMessage.value = `Supprimer définitivement le voyage "${trip.title}" et toutes ses données ? Cette action est irréversible.`
  confirmAction.value = async () => {
    await deleteTrip(trip.id)
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
      <h1>Voyages</h1>
      <p>Gestion de tous les voyages de la plateforme</p>
    </div>

    <div class="admin-toolbar">
      <div class="admin-search">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <input v-model="search" type="text" placeholder="Rechercher par titre…" />
      </div>
      <select v-model="statusFilter" class="admin-filter-select">
        <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </div>

    <div v-if="loading" class="admin-loading">Chargement…</div>

    <template v-else>
      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Titre</th>
              <th>Créateur</th>
              <th>Statut</th>
              <th>Dates</th>
              <th>Budget</th>
              <th>Stops</th>
              <th>Participants</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="trip in data?.data" :key="trip.id">
              <td><strong>{{ trip.title }}</strong></td>
              <td>{{ trip.creator?.fullName ?? '—' }}</td>
              <td>
                <span class="admin-badge" :class="`admin-badge--${trip.status}`">
                  {{ statusLabel[trip.status] ?? trip.status }}
                </span>
              </td>
              <td style="font-size: 0.75rem; color: var(--rtc-text-muted); white-space: nowrap;">
                {{ formatDate(trip.startDate) }}<br>→ {{ formatDate(trip.endDate) }}
              </td>
              <td>{{ trip.budget ? formatAmount(trip.budget) : '—' }}</td>
              <td style="text-align: center;">{{ trip.stopsCount ?? 0 }}</td>
              <td style="text-align: center;">{{ trip.participantsCount ?? 0 }}</td>
              <td>
                <div class="admin-actions">
                  <button
                    class="admin-btn admin-btn--sm admin-btn--warning"
                    @click="changeStatus(trip)"
                    title="Changer le statut"
                  >
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Statut
                  </button>
                  <button
                    class="admin-btn admin-btn--sm admin-btn--danger"
                    @click="handleDelete(trip)"
                  >
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <polyline points="3 6 5 6 21 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M19 6l-1 14H6L5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Supprimer
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!data?.data?.length">
              <td colspan="8">
                <div class="admin-empty">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="currentColor"/>
                  </svg>
                  Aucun voyage trouvé
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="data?.meta && data.meta.lastPage > 1" class="admin-pagination">
          <button class="admin-btn admin-btn--secondary admin-btn--sm" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">←</button>
          <span class="admin-pagination__info">Page {{ currentPage }} / {{ data.meta.lastPage }}</span>
          <button class="admin-btn admin-btn--secondary admin-btn--sm" :disabled="currentPage === data.meta.lastPage" @click="goToPage(currentPage + 1)">→</button>
        </div>
      </div>
    </template>

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
