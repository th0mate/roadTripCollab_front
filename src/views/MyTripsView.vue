<template>
  <div class="my-trips-container">
    <div class="header">
      <h1>Mes Voyages</h1>
      <RouterLink to="/create-trip" class="btn-primary">
        + Nouveau Voyage
      </RouterLink>
    </div>

    <div v-if="loading" class="loading">
      Chargement...
    </div>

    <div v-else class="trips-content">
      <section class="trips-section">
        <h2>Voyages organisés</h2>

        <div v-if="createdTrips.length === 0" class="empty-state">
          <p>Vous n'avez pas encore organisé de voyage.</p>
        </div>

        <div v-else class="trips-grid">
          <div
            v-for="trip in createdTrips"
            :key="trip.id"
            class="trip-card"
            @click="goToTrip(trip.id)"
          >
            <div class="trip-card-header">
              <span class="status-badge" :class="trip.status">{{ formatStatus(trip.status) }}</span>
              <button class="btn-delete" @click.stop="openDeleteModal(trip)" title="Supprimer le voyage">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
              </button>
            </div>
            <div class="trip-card-body">
              <h3>{{ trip.title }}</h3>
              <p class="dates">
                {{ formatDate(trip.startDate) }} - {{ formatDate(trip.endDate) }}
              </p>
              <p class="description" v-if="trip.description">
                {{ truncate(trip.description, 80) }}
              </p>
            </div>
            <div class="trip-card-footer">
              <span class="role-badge creator">Organisateur</span>
            </div>
          </div>
        </div>
      </section>

      <section class="trips-section">
        <h2>Voyages partagés</h2>

        <div v-if="participatingTrips.length === 0" class="empty-state">
          <p>Vous ne participez à aucun voyage partagé.</p>
        </div>

        <div v-else class="trips-grid">
          <div
            v-for="trip in participatingTrips"
            :key="trip.id"
            class="trip-card"
            @click="goToTrip(trip.id)"
          >
            <div class="trip-card-header">
              <span class="status-badge" :class="trip.status">{{ formatStatus(trip.status) }}</span>
            </div>
            <div class="trip-card-body">
              <h3>{{ trip.title }}</h3>
              <p class="dates">
                {{ formatDate(trip.startDate) }} - {{ formatDate(trip.endDate) }}
              </p>
            </div>
            <div class="trip-card-footer">
              <span class="role-badge participant">Participant</span>
            </div>
          </div>
        </div>
      </section>
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
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';
import AppModal from '../components/AppModal.vue';

const router = useRouter();
const loading = ref(true);
const createdTrips = ref<any[]>([]);
const participatingTrips = ref<any[]>([]);

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

const truncate = (text: string, length: number) => {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
};

onMounted(() => {
  fetchTrips();
});
</script>

<style scoped>
.my-trips-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  min-height: 80vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
}

h1 {
  font-size: 2rem;
  color: #2c3e50;
  margin: 0;
}

.btn-primary {
  background: #3498db;
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  transition: background 0.3s;
}

.btn-primary:hover {
  background: #2980b9;
}

.trips-section {
  margin-bottom: 50px;
}

h2 {
  font-size: 1.5rem;
  color: #34495e;
  margin-bottom: 20px;
  border-bottom: 2px solid #ecf0f1;
  padding-bottom: 10px;
}

.trips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 25px;
}

.trip-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid #eee;
  display: flex;
  flex-direction: column;
}

.trip-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
}

.trip-card-header {
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f8f9fa;
}

.btn-delete {
  background: none;
  border: none;
  color: #95a5a6;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-delete:hover {
  color: #e74c3c;
  background: #fceceb;
}

.status-badge {
  font-size: 0.75rem;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.planning { background: #e3f2fd; color: #1976d2; }
.status-badge.active { background: #e8f5e9; color: #2e7d32; }
.status-badge.completed { background: #f5f5f5; color: #616161; }
.status-badge.cancelled { background: #ffebee; color: #c62828; }

.trip-card-body {
  padding: 20px;
  flex: 1;
}

.trip-card-body h3 {
  margin: 0 0 10px 0;
  color: #2c3e50;
  font-size: 1.25rem;
}

.dates {
  color: #7f8c8d;
  font-size: 0.9rem;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
}

.dates::before {
  content: '📅';
  margin-right: 8px;
}

.description {
  color: #666;
  font-size: 0.95rem;
  line-height: 1.5;
}

.trip-card-footer {
  padding: 15px 20px;
  border-top: 1px solid #eee;
  background: #fcfcfc;
}

.role-badge {
  font-size: 0.8rem;
  padding: 4px 8px;
  border-radius: 4px;
}

.role-badge.creator {
  background: #fff3e0;
  color: #f57c00;
}

.role-badge.participant {
  background: #f3e5f5;
  color: #7b1fa2;
}

.empty-state {
  text-align: center;
  padding: 40px;
  background: #f9f9f9;
  border-radius: 8px;
  color: #7f8c8d;
}

.loading {
  text-align: center;
  padding: 60px;
  color: #7f8c8d;
  font-size: 1.2rem;
}

@media (max-width: 600px) {
  .header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
}
</style>
