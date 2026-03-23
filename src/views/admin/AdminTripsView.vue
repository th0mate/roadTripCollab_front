<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import AdminLayout from '../../components/admin/AdminLayout.vue'
import AppModal from '../../components/AppModal.vue'
import { getTrips, updateTrip, deleteTrip } from '../../services/adminService'
import type { AdminTrip, PaginatedResponse } from '../../types/admin'

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

const statusColors: Record<string, string> = {
  planning: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  completed: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  cancelled: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
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
    <div class="animate-fade-in">
      
      <div class="mb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 class="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Voyages</h1>
          <p class="text-slate-600 dark:text-slate-400">Gestion de tous les voyages de la plateforme.</p>
        </div>
        
        <div class="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div class="relative flex-grow sm:w-64">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <i class="fi fi-rr-search"></i>
            </div>
            <input 
              v-model="search" 
              type="text" 
              placeholder="Rechercher par titre..." 
              class="block w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 shadow-sm transition-all"
            />
          </div>
          <select v-model="statusFilter" class="block w-full sm:w-48 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 shadow-sm transition-all outline-none">
            <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
      </div>

      <div v-if="loading && !data" class="flex flex-col items-center justify-center py-20">
        <div class="w-12 h-12 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin mb-4"></div>
        <p class="text-slate-500">Chargement des voyages...</p>
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
                  <th class="px-6 py-4 font-semibold">Titre</th>
                  <th class="px-6 py-4 font-semibold">Créateur</th>
                  <th class="px-6 py-4 font-semibold">Statut</th>
                  <th class="px-6 py-4 font-semibold">Dates</th>
                  <th class="px-6 py-4 font-semibold">Budget</th>
                  <th class="px-6 py-4 font-semibold text-center">Étapes</th>
                  <th class="px-6 py-4 font-semibold text-center">Membres</th>
                  <th class="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
                <tr v-for="trip in data?.data" :key="trip.id" class="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td class="px-6 py-4">
                    <p class="text-sm font-bold text-slate-900 dark:text-white">{{ trip.title }}</p>
                    <p class="text-xs text-slate-500">ID: #{{ trip.id }}</p>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                      <div class="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {{ trip.creator?.fullName?.substring(0,2).toUpperCase() || '?' }}
                      </div>
                      <span class="text-sm text-slate-700 dark:text-slate-300">{{ trip.creator?.fullName ?? '—' }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <span class="px-2.5 py-1 text-xs font-bold rounded-lg" :class="statusColors[trip.status] || 'bg-slate-100 text-slate-700'">
                      {{ statusLabel[trip.status] ?? trip.status }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {{ formatDate(trip.startDate) }}<br/>
                    <span class="text-slate-400">→</span> {{ formatDate(trip.endDate) }}
                  </td>
                  <td class="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                    {{ trip.budget ? formatAmount(trip.budget) : '—' }}
                  </td>
                  <td class="px-6 py-4 text-center">
                    <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm font-bold">
                      {{ trip.stopsCount ?? 0 }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-center">
                    <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-bold">
                      {{ trip.participantsCount ?? 0 }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-2">
                      <button 
                        @click="changeStatus(trip)" 
                        class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors flex items-center gap-1.5"
                        title="Changer le statut"
                      >
                        <i class="fi fi-rr-refresh"></i>
                        <span class="hidden xl:inline">Statut</span>
                      </button>
                      <button 
                        @click="handleDelete(trip)" 
                        class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center gap-1.5"
                      >
                        <i class="fi fi-rr-trash"></i>
                        <span class="hidden xl:inline">Supprimer</span>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="!data?.data?.length">
                  <td colspan="8" class="px-6 py-12 text-center text-slate-500">
                    <i class="fi fi-rr-road text-3xl mb-3 block text-slate-300"></i>
                    Aucun voyage trouvé.
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
