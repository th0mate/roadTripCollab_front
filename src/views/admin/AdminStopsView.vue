<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import AdminLayout from '../../components/admin/AdminLayout.vue'
import AppModal from '../../components/AppModal.vue'
import { getStops, deleteStop, getPhotos, deletePhoto, getAllTrips } from '../../services/adminService'
import type { AdminStop, AdminPhoto, AdminTrip, PaginatedResponse } from '../../types/admin'

const activeTab = ref<'stops' | 'photos'>('stops')

const stopsData = ref<PaginatedResponse<AdminStop> | null>(null)
const stopsLoading = ref(true)
const stopsPage = ref(1)
const tripFilter = ref('')
const trips = ref<AdminTrip[]>([])

const photosData = ref<PaginatedResponse<AdminPhoto> | null>(null)
const photosLoading = ref(true)
const photosPage = ref(1)

const confirmModal = ref(false)
const confirmMessage = ref('')
const confirmAction = ref<(() => Promise<void>) | null>(null)

const apiBaseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || 'http://localhost:3333'

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })

const getPhotoUrl = (filePath: string) =>
  filePath.startsWith('http') ? filePath : `${apiBaseUrl}/uploads/${filePath}`

const loadStops = async () => {
  stopsLoading.value = true
  try {
    stopsData.value = await getStops(stopsPage.value, tripFilter.value)
  } catch (e) {
    console.error(e)
  } finally {
    stopsLoading.value = false
  }
}

const loadPhotos = async () => {
  photosLoading.value = true
  try {
    photosData.value = await getPhotos(photosPage.value)
  } catch (e) {
    console.error(e)
  } finally {
    photosLoading.value = false
  }
}

onMounted(async () => {
  trips.value = await getAllTrips()
  loadStops()
  loadPhotos()
})

watch(tripFilter, () => {
  stopsPage.value = 1
  loadStops()
})

const switchTab = (tab: 'stops' | 'photos') => {
  activeTab.value = tab
}

const goToStopsPage = (p: number) => {
  stopsPage.value = p
  loadStops()
}

const goToPhotosPage = (p: number) => {
  photosPage.value = p
  loadPhotos()
}

const handleDeleteStop = (stop: AdminStop) => {
  confirmMessage.value = `Supprimer définitivement l'étape "${stop.title}" et toutes ses photos ? Cette action est irréversible.`
  confirmAction.value = async () => {
    await deleteStop(stop.id)
    await loadStops()
  }
  confirmModal.value = true
}

const handleDeletePhoto = (photo: AdminPhoto) => {
  confirmMessage.value = `Supprimer définitivement cette photo ? Cette action est irréversible.`
  confirmAction.value = async () => {
    await deletePhoto(photo.id)
    await loadPhotos()
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
      
      <div class="mb-8">
        <h1 class="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Étapes & Photos</h1>
        <p class="text-slate-600 dark:text-slate-400 mb-6">Modérez le contenu publié par les utilisateurs sur leurs parcours.</p>
        
        <div class="flex items-center gap-2 p-1 bg-slate-200 dark:bg-slate-700/50 rounded-xl w-fit">
          <button 
            @click="switchTab('stops')" 
            class="px-5 py-2 rounded-lg text-sm font-bold transition-all"
            :class="activeTab === 'stops' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'"
          >
            <i class="fi fi-rr-map-marker mr-1.5"></i> Étapes
          </button>
          <button 
            @click="switchTab('photos')" 
            class="px-5 py-2 rounded-lg text-sm font-bold transition-all"
            :class="activeTab === 'photos' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'"
          >
            <i class="fi fi-rr-camera mr-1.5"></i> Photos
          </button>
        </div>
      </div>

      <div v-if="activeTab === 'stops'" class="space-y-6 animate-fade-in">
        <div class="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div class="relative w-full sm:w-80">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <i class="fi fi-rr-filter"></i>
            </div>
            <select v-model="tripFilter" class="block w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 transition-all outline-none appearance-none cursor-pointer">
              <option value="">Tous les voyages</option>
              <option v-for="trip in trips" :key="trip.id" :value="String(trip.id)">
                {{ trip.title }}
              </option>
            </select>
          </div>
          <p v-if="tripFilter" class="text-sm text-slate-500 flex-grow">
            {{ stopsData?.meta?.total ?? 0 }} étape(s) filtrée(s)
          </p>
          <button v-if="tripFilter" @click="tripFilter = ''" class="text-sm font-semibold text-red-600 hover:text-red-700 transition-colors w-full sm:w-auto text-center">
            Réinitialiser
          </button>
        </div>

        <div v-if="stopsLoading && !stopsData" class="flex justify-center py-12">
          <div class="w-10 h-10 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin"></div>
        </div>
        
        <div v-else class="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden relative">
          <div v-if="stopsLoading && stopsData" class="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
             <div class="w-8 h-8 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin"></div>
          </div>
          
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="text-xs uppercase text-slate-500 bg-slate-50 dark:bg-slate-900/30">
                  <th class="px-6 py-4 font-semibold">Titre</th>
                  <th class="px-6 py-4 font-semibold">Type</th>
                  <th class="px-6 py-4 font-semibold">Voyage associé</th>
                  <th class="px-6 py-4 font-semibold">Création</th>
                  <th class="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
                <tr v-for="stop in stopsData?.data" :key="stop.id" class="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td class="px-6 py-4">
                    <p class="text-sm font-bold text-slate-900 dark:text-white">{{ stop.title }}</p>
                    <p class="text-xs text-slate-500 truncate max-w-[200px]" :title="stop.address || ''">{{ stop.address || '—' }}</p>
                  </td>
                  <td class="px-6 py-4">
                    <span class="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 capitalize">
                      {{ stop.type }}
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <button v-if="stop.trip" @click="tripFilter = tripFilter === String(stop.tripId) ? '' : String(stop.tripId)" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors" :class="tripFilter === String(stop.tripId) ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'">
                      {{ stop.trip.title }}
                    </button>
                    <span v-else class="text-slate-400 text-sm">—</span>
                  </td>
                  <td class="px-6 py-4 text-xs text-slate-600 dark:text-slate-400">{{ formatDate(stop.createdAt) }}</td>
                  <td class="px-6 py-4 text-right">
                    <button @click="handleDeleteStop(stop)" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center gap-1.5 ml-auto">
                      <i class="fi fi-rr-trash"></i>
                      <span class="hidden xl:inline">Supprimer</span>
                    </button>
                  </td>
                </tr>
                <tr v-if="!stopsData?.data?.length">
                  <td colspan="5" class="px-6 py-12 text-center text-slate-500">Aucune étape trouvée.</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div v-if="stopsData?.meta && stopsData.meta.lastPage > 1" class="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
            <button @click="goToStopsPage(stopsPage - 1)" :disabled="stopsPage === 1" class="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"><i class="fi fi-rr-angle-left"></i></button>
            <span class="text-sm font-semibold text-slate-600 dark:text-slate-400">Page {{ stopsPage }} sur {{ stopsData.meta.lastPage }}</span>
            <button @click="goToStopsPage(stopsPage + 1)" :disabled="stopsPage === stopsData.meta.lastPage" class="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"><i class="fi fi-rr-angle-right"></i></button>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'photos'" class="animate-fade-in">
        
        <div v-if="photosLoading && !photosData" class="flex justify-center py-12">
          <div class="w-10 h-10 border-4 border-purple-100 border-t-purple-500 rounded-full animate-spin"></div>
        </div>

        <div v-else-if="!photosData?.data?.length" class="bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
          <div class="w-20 h-20 bg-slate-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl text-slate-400"><i class="fi fi-rr-picture"></i></div>
          <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">Aucune photo</h3>
          <p class="text-slate-500 dark:text-slate-400">La galerie de la plateforme est vide pour le moment.</p>
        </div>

        <div v-else>
          <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            <div v-for="photo in photosData.data" :key="photo.id" class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden group">
              <div class="aspect-square relative overflow-hidden bg-slate-100 dark:bg-slate-900">
                <img :src="getPhotoUrl(photo.filePath)" alt="Photo" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" @error="($event.target as HTMLImageElement).style.display = 'none'" />
                <div class="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <button @click="handleDeletePhoto(photo)" class="absolute top-3 right-3 w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all shadow-lg transform translate-y-2 group-hover:translate-y-0">
                  <i class="fi fi-rr-trash"></i>
                </button>
              </div>
              <div class="p-4">
                <p class="text-sm font-bold text-slate-900 dark:text-white truncate mb-1" :title="photo.stop?.title">{{ photo.stop?.title ?? '—' }}</p>
                <div class="flex items-center justify-between text-xs text-slate-500">
                  <span class="truncate">Par {{ photo.user?.fullName?.split(' ')[0] ?? '?' }}</span>
                  <span>{{ formatDate(photo.createdAt) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="photosData.meta.lastPage > 1" class="flex justify-center mt-10 gap-4">
            <button @click="goToPhotosPage(photosPage - 1)" :disabled="photosPage === 1" class="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors shadow-sm"><i class="fi fi-rr-angle-left"></i></button>
            <div class="flex items-center text-sm font-semibold text-slate-600 dark:text-slate-400">Page {{ photosPage }} / {{ photosData.meta.lastPage }}</div>
            <button @click="goToPhotosPage(photosPage + 1)" :disabled="photosPage === photosData.meta.lastPage" class="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors shadow-sm"><i class="fi fi-rr-angle-right"></i></button>
          </div>
        </div>

      </div>

    </div>

    <AppModal
      v-model="confirmModal"
      type="danger"
      title="Confirmation de suppression"
      :message="confirmMessage"
      confirm-text="Oui, supprimer"
      cancel-text="Annuler"
      @confirm="onConfirm"
      @cancel="onCancel"
    />
  </AdminLayout>
</template>
