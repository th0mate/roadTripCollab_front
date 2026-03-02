<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import AppModal from '@/components/AppModal.vue'
import { getStops, deleteStop, getPhotos, deletePhoto, getAllTrips } from '@/services/adminService'
import type { AdminStop, AdminPhoto, AdminTrip, PaginatedResponse } from '@/types/admin'

const activeTab = ref<'stops' | 'photos'>('stops')

// Stops
const stopsData = ref<PaginatedResponse<AdminStop> | null>(null)
const stopsLoading = ref(true)
const stopsPage = ref(1)
const tripFilter = ref('')
const trips = ref<AdminTrip[]>([])

// Photos
const photosData = ref<PaginatedResponse<AdminPhoto> | null>(null)
const photosLoading = ref(true)
const photosPage = ref(1)

// Modal confirmation
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
    <div class="admin-page-header">
      <h1>Étapes &amp; Photos</h1>
      <p>Gestion des étapes et des photos de la plateforme</p>
    </div>

    <!-- Onglets -->
    <div class="admin-tabs">
      <button
        class="admin-tab"
        :class="{ 'admin-tab--active': activeTab === 'stops' }"
        @click="switchTab('stops')"
      >
        Étapes
      </button>
      <button
        class="admin-tab"
        :class="{ 'admin-tab--active': activeTab === 'photos' }"
        @click="switchTab('photos')"
      >
        Photos
      </button>
    </div>

    <!-- Onglet Étapes -->
    <template v-if="activeTab === 'stops'">
      <!-- Filtre par voyage -->
      <div class="admin-toolbar">
        <div class="admin-search" style="flex: 0 0 auto; min-width: 280px;">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
          </svg>
          <select v-model="tripFilter" style="padding-left: 32px; width: 100%; border: none; background: transparent; outline: none; font-size: 0.875rem; font-family: inherit; color: var(--rtc-text); cursor: pointer;">
            <option value="">Tous les voyages</option>
            <option v-for="trip in trips" :key="trip.id" :value="String(trip.id)">
              {{ trip.title }}
            </option>
          </select>
        </div>

        <span v-if="tripFilter" style="font-size: 0.8rem; color: var(--rtc-text-muted);">
          {{ stopsData?.meta?.total ?? 0 }} étape(s) dans ce voyage
        </span>

        <button
          v-if="tripFilter"
          class="admin-btn admin-btn--secondary admin-btn--sm"
          @click="tripFilter = ''"
        >
          Réinitialiser
        </button>
      </div>

      <div v-if="stopsLoading" class="admin-loading">Chargement des étapes…</div>
      <template v-else>
        <div class="admin-table-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Titre</th>
                <th>Type</th>
                <th>Adresse</th>
                <th>Voyage</th>
                <th>Créé le</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="stop in stopsData?.data" :key="stop.id">
                <td style="color: var(--rtc-text-muted); font-size: 0.75rem;">{{ stop.id }}</td>
                <td><strong>{{ stop.title }}</strong></td>
                <td>
                  <span class="admin-badge admin-badge--planning" style="text-transform: capitalize;">
                    {{ stop.type }}
                  </span>
                </td>
                <td style="font-size: 0.75rem; color: var(--rtc-text-muted); max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  {{ stop.address ?? '—' }}
                </td>
                <td>
                  <button
                    v-if="stop.trip"
                    class="admin-btn admin-btn--secondary admin-btn--sm"
                    :class="{ 'admin-btn--primary': tripFilter === String(stop.tripId) }"
                    @click="tripFilter = tripFilter === String(stop.tripId) ? '' : String(stop.tripId)"
                    :title="tripFilter === String(stop.tripId) ? 'Voir tous les voyages' : `Filtrer par : ${stop.trip.title}`"
                  >
                    {{ stop.trip.title }}
                  </button>
                  <span v-else style="color: var(--rtc-text-muted); font-size: 0.75rem;">—</span>
                </td>
                <td style="font-size: 0.75rem; color: var(--rtc-text-muted);">{{ formatDate(stop.createdAt) }}</td>
                <td>
                  <div class="admin-actions">
                    <button class="admin-btn admin-btn--sm admin-btn--danger" @click="handleDeleteStop(stop)">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <polyline points="3 6 5 6 21 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M19 6l-1 14H6L5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="!stopsData?.data?.length">
                <td colspan="7">
                  <div class="admin-empty">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 11l3 3L22 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Aucune étape trouvée
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div v-if="stopsData?.meta && stopsData.meta.lastPage > 1" class="admin-pagination">
            <button class="admin-btn admin-btn--secondary admin-btn--sm" :disabled="stopsPage === 1" @click="goToStopsPage(stopsPage - 1)">←</button>
            <span class="admin-pagination__info">Page {{ stopsPage }} / {{ stopsData.meta.lastPage }}</span>
            <button class="admin-btn admin-btn--secondary admin-btn--sm" :disabled="stopsPage === stopsData.meta.lastPage" @click="goToStopsPage(stopsPage + 1)">→</button>
          </div>
        </div>
      </template>
    </template>

    <!-- Onglet Photos -->
    <template v-if="activeTab === 'photos'">
      <div v-if="photosLoading" class="admin-loading">Chargement des photos…</div>
      <template v-else>
        <div v-if="!photosData?.data?.length" class="admin-empty" style="background: #fff; border: 1px solid var(--rtc-border); border-radius: 12px; padding: 60px;">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2l1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Aucune photo trouvée
        </div>

        <div v-else>
          <div class="admin-photos-grid">
            <div v-for="photo in photosData.data" :key="photo.id" class="admin-photo-card">
              <img
                :src="getPhotoUrl(photo.filePath)"
                :alt="`Photo ${photo.id}`"
                class="admin-photo-card__img"
                loading="lazy"
                @error="($event.target as HTMLImageElement).style.display = 'none'"
              />
              <div class="admin-photo-card__body">
                <div class="admin-photo-card__meta">
                  <strong>{{ photo.stop?.title ?? '—' }}</strong><br>
                  par {{ photo.user?.fullName ?? '—' }}<br>
                  {{ formatDate(photo.createdAt) }}
                </div>
                <button class="admin-btn admin-btn--sm admin-btn--danger" style="width: 100%;" @click="handleDeletePhoto(photo)">
                  Supprimer
                </button>
              </div>
            </div>
          </div>

          <div v-if="photosData.meta.lastPage > 1" class="admin-pagination" style="margin-top: 20px;">
            <button class="admin-btn admin-btn--secondary admin-btn--sm" :disabled="photosPage === 1" @click="goToPhotosPage(photosPage - 1)">←</button>
            <span class="admin-pagination__info">Page {{ photosPage }} / {{ photosData.meta.lastPage }}</span>
            <button class="admin-btn admin-btn--secondary admin-btn--sm" :disabled="photosPage === photosData.meta.lastPage" @click="goToPhotosPage(photosPage + 1)">→</button>
          </div>
        </div>
      </template>
    </template>

    <!-- Modal confirmation -->
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

.admin-search select {
  appearance: none;
  -webkit-appearance: none;
}
</style>
