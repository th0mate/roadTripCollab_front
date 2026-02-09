<template>
  <div class="my-trips">
    <div class="my-trips__hero">
      <div class="my-trips__hero-content">
        <div class="my-trips__hero-text">
          <h1 class="my-trips__title">
            <i class="fi fi-rr-road"></i>
            Mes Voyages
          </h1>
          <p class="my-trips__subtitle">Gérez et explorez vos aventures</p>
        </div>
        <RouterLink to="/create-trip" class="my-trips__btn-create">
          <i class="fi fi-rr-plus"></i>
          <span>Nouveau Voyage</span>
        </RouterLink>
      </div>
    </div>

    <div class="my-trips__container">
      
      <div class="my-trips__filters">
        <div class="my-trips__search">
          <i class="fi fi-rr-search"></i>
          <input type="text" v-model="filters.search" placeholder="Rechercher un voyage..." />
        </div>
        
        <div class="my-trips__filter-group">
          <select v-model="filters.status" class="my-trips__select">
            <option value="">Tous les statuts</option>
            <option value="planning">En planification</option>
            <option value="active">En cours</option>
            <option value="completed">Terminé</option>
            <option value="cancelled">Annulé</option>
          </select>

          <div class="my-trips__date-group">
            <input type="date" v-model="filters.startDate" class="my-trips__date-input" placeholder="Date début" />
            <span>à</span>
            <input type="date" v-model="filters.endDate" class="my-trips__date-input" placeholder="Date fin" />
          </div>
          
          <button v-if="hasActiveFilters" @click="resetFilters" class="my-trips__reset-btn">
             <i class="fi fi-rr-cross-circle"></i>
             Effacer
          </button>
        </div>
      </div>

      <div v-if="loading" class="my-trips__loading">
        <i class="fi fi-rr-spinner"></i>
        <span>Chargement de vos voyages...</span>
      </div>

      <div v-else class="my-trips__content">
        <section class="my-trips__section">
          <div class="my-trips__section-header">
            <h2 class="my-trips__section-title">
              <i class="fi fi-rr-crown"></i>
              Voyages organisés
            </h2>
            <span class="my-trips__count">{{ filteredCreatedTrips.length }}</span>
          </div>

          <div v-if="filteredCreatedTrips.length === 0" class="my-trips__empty">
            <div class="my-trips__empty-icon">
              <i class="fi fi-rr-map"></i>
            </div>
            <h3 class="my-trips__empty-title">Aucun voyage organisé trouvé</h3>
            <p class="my-trips__empty-text">{{ hasActiveFilters ? 'Essayez de modifier vos filtres.' : "Créez votre premier voyage et commencez l'aventure !" }}</p>
            <RouterLink v-if="!hasActiveFilters" to="/create-trip" class="my-trips__empty-btn">
              <i class="fi fi-rr-plus"></i>
              Créer un voyage
            </RouterLink>
          </div>

          <div v-else class="my-trips__grid">
            <div
              v-for="trip in filteredCreatedTrips"
              :key="trip.id"
              class="my-trips__card"
              @click="goToTrip(trip.id)"
            >
              <div class="my-trips__card-image">
                <img
                  v-if="trip.coverImage"
                  :src="`${backendUrl}/uploads/${trip.coverImage}`"
                  :alt="trip.title"
                  class="my-trips__card-img"
                  style="width: 100%; height: 100%; object-fit: cover;"
                />
                <div v-else class="my-trips__card-image-placeholder" style="width: 100%; height: 100%; background: linear-gradient(135deg, #1e4d3d 0%, #4ade80 100%);"></div>
                <span class="my-trips__status" :class="`my-trips__status--${trip.status}`">
                  <i :class="getStatusIcon(trip.status)"></i>
                  {{ formatStatus(trip.status) }}
                </span>
                <button
                  class="my-trips__card-delete"
                  @click.stop="openDeleteModal(trip)"
                  title="Supprimer le voyage"
                >
                  <i class="fi fi-rr-trash"></i>
                </button>
              </div>

              <div class="my-trips__card-content">
                <div class="my-trips__card-header">
                  <h3 class="my-trips__card-title">{{ trip.title }}</h3>
                  <span class="my-trips__role my-trips__role--creator">
                    <i class="fi fi-rr-crown"></i>
                    Organisateur
                  </span>
                </div>

                <div class="my-trips__card-info">
                  <div class="my-trips__card-dates">
                    <i class="fi fi-rr-calendar"></i>
                    <span>{{ formatDate(trip.startDate) }} - {{ formatDate(trip.endDate) }}</span>
                  </div>

                  <p class="my-trips__card-description" v-if="trip.description">
                    {{ truncate(trip.description, 100) }}
                  </p>

                  <div class="my-trips__card-footer">
                    <div class="my-trips__card-stats">
                      <div class="my-trips__stat">
                        <i class="fi fi-rr-users"></i>
                        <span>{{ trip.participants?.length || 1 }}</span>
                      </div>
                      <div class="my-trips__stat" v-if="trip.budget">
                        <i class="fi fi-rr-wallet"></i>
                        <span>{{ trip.budget }} €</span>
                      </div>
                    </div>
                    <div class="my-trips__card-arrow">
                      <i class="fi fi-rr-arrow-right"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="my-trips__section">
          <div class="my-trips__section-header">
            <h2 class="my-trips__section-title">
              <i class="fi fi-rr-users-alt"></i>
              Voyages partagés
            </h2>
            <span class="my-trips__count">{{ filteredParticipatingTrips.length }}</span>
          </div>

          <div v-if="filteredParticipatingTrips.length === 0" class="my-trips__empty">
            <div class="my-trips__empty-icon">
              <i class="fi fi-rr-users"></i>
            </div>
            <h3 class="my-trips__empty-title">Aucun voyage partagé trouvé</h3>
            <p class="my-trips__empty-text">{{ hasActiveFilters ? 'Essayez de modifier vos filtres.' : "Vous serez invité à rejoindre des voyages par d'autres organisateurs." }}</p>
          </div>

          <div v-else class="my-trips__grid">
            <div
              v-for="trip in filteredParticipatingTrips"
              :key="trip.id"
              class="my-trips__card"
              @click="goToTrip(trip.id)"
            >
              <div class="my-trips__card-image">
                <img
                  v-if="trip.coverImage"
                  :src="`${backendUrl}/uploads/${trip.coverImage}`"
                  :alt="trip.title"
                  class="my-trips__card-img"
                  style="width: 100%; height: 100%; object-fit: cover;"
                />
                <div v-else class="my-trips__card-image-placeholder" style="width: 100%; height: 100%; background: linear-gradient(135deg, #1e4d3d 0%, #4ade80 100%);"></div>
                <span class="my-trips__status" :class="`my-trips__status--${trip.status}`">
                  <i :class="getStatusIcon(trip.status)"></i>
                  {{ formatStatus(trip.status) }}
                </span>
                <span v-if="trip.invitationStatus === 'pending'" class="my-trips__status my-trips__status--pending-invite" style="top: 50px; background: #f59e0b;">
                  <i class="fi fi-rr-envelope"></i>
                  Invitation reçue
                </span>
              </div>

              <div class="my-trips__card-content">
                <div class="my-trips__card-header">
                  <h3 class="my-trips__card-title">{{ trip.title }}</h3>
                  <span class="my-trips__role my-trips__role--participant">
                    <i class="fi fi-rr-user"></i>
                    Participant
                  </span>
                </div>

                <div class="my-trips__card-info">
                  <div class="my-trips__card-dates">
                    <i class="fi fi-rr-calendar"></i>
                    <span>{{ formatDate(trip.startDate) }} - {{ formatDate(trip.endDate) }}</span>
                  </div>

                  <p class="my-trips__card-description" v-if="trip.description">
                    {{ truncate(trip.description, 100) }}
                  </p>

                  <div class="my-trips__card-footer">
                    <div class="my-trips__card-stats">
                      <div class="my-trips__stat">
                        <i class="fi fi-rr-users"></i>
                        <span>{{ trip.participants?.length || 1 }}</span>
                      </div>
                      <div class="my-trips__stat" v-if="trip.budget">
                        <i class="fi fi-rr-wallet"></i>
                        <span>{{ trip.budget }} €</span>
                      </div>
                    </div>
                    <div class="my-trips__card-arrow">
                      <i class="fi fi-rr-arrow-right"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>

    <AppModal
      v-model="showDeleteModal"
      type="danger"
      title="Supprimer le voyage"
      :message="`Êtes-vous sûr de vouloir supprimer le voyage '${tripToDelete?.title}' ? Cette action est irréversible.`"
      confirm-text="Supprimer"
      cancel-text="Annuler"
      @confirm="confirmDeleteTrip"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';
import AppModal from '../components/AppModal.vue';

const router = useRouter();
const loading = ref(true);
const createdTrips = ref<any[]>([]);
const participatingTrips = ref<any[]>([]);
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3333';

const filters = ref({
  search: '',
  status: '',
  startDate: '',
  endDate: ''
});

const hasActiveFilters = computed(() => {
  return filters.value.search || filters.value.status || filters.value.startDate || filters.value.endDate;
});

const resetFilters = () => {
  filters.value = {
    search: '',
    status: '',
    startDate: '',
    endDate: ''
  };
};

const filterTrips = (trips: any[]) => {
  return trips.filter(trip => {
    // Search
    if (filters.value.search && !trip.title.toLowerCase().includes(filters.value.search.toLowerCase())) {
      return false;
    }
    // Status
    if (filters.value.status && trip.status !== filters.value.status) {
      return false;
    }
    // Date Range
    if (filters.value.startDate && new Date(trip.startDate) < new Date(filters.value.startDate)) {
      return false;
    }
    if (filters.value.endDate && new Date(trip.endDate) > new Date(filters.value.endDate)) {
      return false;
    }
    return true;
  });
};

const filteredCreatedTrips = computed(() => filterTrips(createdTrips.value));
const filteredParticipatingTrips = computed(() => filterTrips(participatingTrips.value));

const showDeleteModal = ref(false);
const tripToDelete = ref<any>(null);

const fetchTrips = async () => {
  try {
    const response = await api.get('/trips');
    createdTrips.value = response.data.createdTrips;
    participatingTrips.value = response.data.participatingTrips;
  } catch (error) {
    console.error('Error fetching trips:', error);
  } finally {
    loading.value = false;
  }
};

const goToTrip = (id: number) => {
  router.push(`/trips/${id}`);
};

const openDeleteModal = (trip: any) => {
  tripToDelete.value = trip;
  showDeleteModal.value = true;
};

const confirmDeleteTrip = async () => {
  if (!tripToDelete.value) return;

  try {
    await api.delete(`/trips/${tripToDelete.value.id}`);

    createdTrips.value = createdTrips.value.filter(t => t.id !== tripToDelete.value.id);

    showDeleteModal.value = false;
    tripToDelete.value = null;
  } catch (error) {
    console.error('Error deleting trip:', error);
    alert('Impossible de supprimer le voyage.');
  }
};

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const formatStatus = (status: string) => {
  const map: Record<string, string> = {
    'planning': 'En planification',
    'active': 'En cours',
    'completed': 'Terminé',
    'cancelled': 'Annulé'
  };
  return map[status] || status;
};

const getStatusIcon = (status: string) => {
  const map: Record<string, string> = {
    'planning': 'fi fi-rr-edit',
    'active': 'fi fi-rr-play',
    'completed': 'fi fi-rr-check',
    'cancelled': 'fi fi-rr-cross'
  };
  return map[status] || 'fi fi-rr-info';
};

const truncate = (text: string, length: number) => {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
};

onMounted(() => {
  fetchTrips();
});
</script>

<style>
@import "@/assets/styles/myTripsView.css";
</style>
