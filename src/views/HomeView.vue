<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api'
import { isAuthenticated } from '../services/authService'
import TripDetailsModal from '@/components/TripDetailsModal.vue'

const router = useRouter()
const depart = ref('Montpellier')
const arrivee = ref('Hamburg')
const dateDepart = ref('18 octobre 2026')
const voyageurs = ref(2)
const isLoading = ref(true)

// Modal state
const isModalOpen = ref(false)
const selectedTrip = ref<any>(null)

const categories = [
  { label: 'Tout', icon: '', active: true },
  { label: 'Tendances', icon: '🔥', active: false },
  { label: 'Montagnes', icon: '🏔️', active: false },
  { label: 'Plage', icon: '🏖️', active: false },
  { label: 'Ville', icon: '🏙️', active: false },
  { label: 'Forêt', icon: '🌲', active: false },
  { label: 'Désert', icon: '🏜️', active: false },
  { label: 'Croisière', icon: '🛳️', active: false },
]

const destinations = ref<any[]>([])
const currentPage = ref(1)
const hasMore = ref(true)
const isLoadMoreLoading = ref(false)
const backendUrl = import.meta.env.VITE_BACKEND_URL

const fetchFinishedTrips = async (page = 1) => {
  if (page === 1) isLoading.value = true
  else isLoadMoreLoading.value = true

  try {
    const response = await api.get(`/trips/finished?page=${page}&limit=6`)
    const newTrips = response.data.data.map((trip: any) => ({
      ...trip,
      location: trip.stops && trip.stops.length > 0 ? trip.stops[0].title : trip.title,
      displayPrice: trip.budget ? trip.budget + ' €' : 'Budget non défini',
      imageUrl: trip.coverImage ? `${backendUrl}/uploads/${trip.coverImage}` : null
    }))

    if (page === 1) {
      destinations.value = newTrips
    } else {
      destinations.value.push(...newTrips)
    }

    // Vérifier s'il reste d'autres pages
    const meta = response.data.meta
    hasMore.value = meta.currentPage < meta.lastPage
    currentPage.value = meta.currentPage
  } catch (error) {
    console.error('Erreur lors de la récupération des voyages terminés', error)
  } finally {
    isLoading.value = false
    isLoadMoreLoading.value = false
  }
}

const loadMore = () => {
  if (hasMore.value && !isLoadMoreLoading.value) {
    fetchFinishedTrips(currentPage.value + 1)
  }
}

const selectCategory = (index: number) => {
  categories.forEach((cat, i) => {
    cat.active = i === index
  })
}

const openTripModal = (trip: any) => {
  if (isAuthenticated()) {
    selectedTrip.value = trip
    isModalOpen.value = true
  } else {
    // Optionnel : rediriger vers login ou afficher une alerte
    // Pour l'instant, on ne fait rien ou on redirige
     router.push('/login')
  }
}

onMounted(() => {
  fetchFinishedTrips()
})
</script>

<template>
  <section class="home">
    <div class="hero">
      <h1 class="hero-title">PARTEZ À L'AVENTURE</h1>

      <!-- Search Form (unchanged) -->
      <div class="search-form">
        <div class="search-field">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
          </svg>
          <div class="search-content">
            <label class="search-label">Départ</label>
            <input type="text" v-model="depart" class="search-input" placeholder="Ville de départ" />
          </div>
        </div>

        <div class="search-separator"></div>

        <div class="search-field">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6h-5.6z" fill="currentColor"/>
          </svg>
          <div class="search-content">
            <label class="search-label">Arrivée</label>
            <input type="text" v-model="arrivee" class="search-input" placeholder="Destination" />
          </div>
        </div>

        <div class="search-separator"></div>

        <div class="search-field">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" fill="currentColor"/>
            <circle cx="12" cy="14" r="2" fill="currentColor"/>
          </svg>
          <div class="search-content">
            <label class="search-label">Date de départ</label>
            <input type="text" v-model="dateDepart" class="search-input" placeholder="Sélectionner une date" />
          </div>
        </div>

        <div class="search-separator"></div>

        <div class="search-field">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="currentColor"/>
          </svg>
          <div class="search-content">
            <label class="search-label">Voyageurs</label>
            <input type="text" :value="voyageurs + ' personnes'" class="search-input" placeholder="Nombre de personnes" />
          </div>
        </div>

        <button class="search-button">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="categories">
      <button
        v-for="(category, index) in categories"
        :key="index"
        :class="['category-btn', { active: category.active }]"
        @click="selectCategory(index)"
      >
        <span v-if="category.icon" class="category-icon">{{ category.icon }}</span>
        {{ category.label }}
      </button>
    </div>

    <div class="destinations">
      <div v-if="isLoading" class="loading-message">Chargement des voyages terminés...</div>

      <div v-else-if="destinations.length === 0" class="empty-message">
        Aucun voyage terminé pour le moment.
      </div>

      <div
        v-else
        v-for="(destination, index) in destinations"
        :key="index"
        class="destination-card"
        @click="openTripModal(destination)"
      >
        <div class="destination-image-wrapper">
          <img
            v-if="destination.coverImage"
            :src="destination.imageUrl"
            alt="Image de la destination"
            class="destination-image"
            style="width: 100%; height: 100%; object-fit: cover;"
          />
          <div v-else class="destination-image-placeholder" style="background: linear-gradient(135deg, #1e4d3d 0%, #4ade80 100%); width: 100%; height: 100%;"></div>
          <button class="destination-favorite">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/>
            </svg>
          </button>
          <span class="destination-price">{{ destination.displayPrice }}</span>
        </div>
        <div class="destination-info">
          <h3 class="destination-title">{{ destination.title }}</h3>
          <p class="destination-location" style="color: #666; font-size: 0.9rem;">
            {{ destination.location }}
          </p>
        </div>
      </div>
    </div>

    <div v-if="hasMore" class="view-more-wrapper">
      <button
        class="view-more-btn"
        @click="loadMore"
        :disabled="isLoadMoreLoading"
      >
        {{ isLoadMoreLoading ? 'Chargement...' : 'Voir plus' }}
      </button>
    </div>

    <!-- Modal pour afficher les détails du voyage -->
    <TripDetailsModal
      v-if="selectedTrip"
      :isOpen="isModalOpen"
      :trip="selectedTrip"
      @close="isModalOpen = false"
    />
  </section>
</template>

<style>
@import "@/assets/styles/homeView.css";
</style>
