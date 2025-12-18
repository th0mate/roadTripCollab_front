<template>
  <div class="create-trip-container">
    <div class="create-trip-card">
      <h1>Créer un nouveau voyage</h1>

      <div class="steps-indicator">
        <div :class="{ active: currentStep === 1, completed: currentStep > 1 }">1. Informations</div>
        <div :class="{ active: currentStep === 2, completed: currentStep > 2 }">2. Participants</div>
        <div :class="{ active: currentStep === 3, completed: currentStep > 3 }">3. Itinéraire</div>
      </div>

      <div v-if="currentStep === 1" class="step-content">
        <div class="form-group">
          <label for="title">Titre du voyage</label>
          <input type="text" id="title" v-model="trip.title" placeholder="Ex: Roadtrip en Italie" required />
        </div>
        <div class="form-group">
          <label for="description">Description</label>
          <textarea id="description" v-model="trip.description" placeholder="Description du voyage..."></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="startDate">Date de début</label>
            <input type="date" id="startDate" v-model="trip.startDate" required />
          </div>
          <div class="form-group">
            <label for="endDate">Date de fin</label>
            <input type="date" id="endDate" v-model="trip.endDate" required />
          </div>
        </div>
        <div class="form-group">
          <label for="budget">Cagnotte (Budget initial)</label>
          <input type="number" id="budget" v-model="trip.budget" placeholder="0" min="0" />
        </div>
        <button class="btn-primary" @click="nextStep" :disabled="!isStep1Valid">Suivant</button>
      </div>

      <div v-if="currentStep === 2" class="step-content">
        <div class="form-group">
          <label for="inviteEmail">Inviter des amis (Email)</label>
          <div class="invite-row">
            <input
              type="email"
              id="inviteEmail"
              v-model="newParticipantEmail"
              placeholder="ami@exemple.com"
              @keyup.enter="addParticipant"
            />
            <button class="btn-secondary" @click="addParticipant">Ajouter</button>
          </div>
          <p v-if="participantError" class="error-text">{{ participantError }}</p>
        </div>

        <div class="participants-list">
          <div v-for="(email, index) in participants" :key="index" class="participant-item">
            <span>{{ email }}</span>
            <button class="btn-icon" @click="removeParticipant(index)">×</button>
          </div>
          <div v-if="participants.length === 0" class="empty-state">
            Aucun participant ajouté pour le moment.
          </div>
        </div>

        <div class="actions">
          <button class="btn-secondary" @click="prevStep">Précédent</button>
          <button class="btn-primary" @click="nextStep">Suivant</button>
        </div>
      </div>

      <div v-if="currentStep === 3" class="step-content">
        <div class="itinerary-intro">
          <h3>Planifiez votre parcours</h3>
          <p>Indiquez la ville étape pour chaque jour de votre voyage. Vous pourrez ajouter des activités plus tard.</p>
        </div>

        <div class="days-list">
          <div v-for="(day, index) in tripDays" :key="index" class="day-row">
            <div class="day-label">
              <strong>Jour {{ index + 1 }}</strong>
              <small>{{ formatDate(day.date) }}</small>
            </div>

            <div class="day-input">
              <div class="search-input-wrapper">
                <input
                  type="text"
                  v-model="day.searchTerm"
                  @input="searchCity(index)"
                  placeholder="Rechercher une ville..."
                  :class="{ 'filled': day.city }"
                />
                <ul v-if="activeSearchIndex === index && searchResults.length > 0" class="search-results">
                  <li v-for="result in searchResults" :key="result.place_id" @click="selectCity(index, result)">
                    {{ result.display_name }}
                  </li>
                </ul>
              </div>
              <button class="btn-icon-small" v-if="index > 0" @click="copyPreviousCity(index)" title="Même ville qu'hier">
                📋
              </button>
            </div>
          </div>
        </div>

        <div class="actions">
          <button class="btn-secondary" @click="prevStep">Précédent</button>
          <button class="btn-success" @click="createTrip" :disabled="isLoading || !areAllDaysFilled">
            {{ isLoading ? 'Création...' : 'Créer le voyage' }}
          </button>
        </div>
        <p v-if="apiError" class="error-text global-error">{{ apiError }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';

const router = useRouter();

const currentStep = ref(1);
const isLoading = ref(false);
const apiError = ref('');

const trip = ref({
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  budget: 0,
});

const newParticipantEmail = ref('');
const participants = ref<string[]>([]);
const participantError = ref('');

interface TripDay {
  date: string;
  searchTerm: string;
  city: any | null;
}

const tripDays = ref<TripDay[]>([]);
const activeSearchIndex = ref<number | null>(null);
const searchResults = ref<any[]>([]);
let searchTimeout: any = null;

const isStep1Valid = computed(() => {
  return trip.value.title && trip.value.startDate && trip.value.endDate;
});

const areAllDaysFilled = computed(() => {
  return tripDays.value.every(day => day.city !== null);
});

watch([() => trip.value.startDate, () => trip.value.endDate], () => {
  if (trip.value.startDate && trip.value.endDate) {
    generateDays();
  }
});

const nextStep = () => {
  if (currentStep.value === 1) {
    generateDays();
  }
  if (currentStep.value < 3) {
    currentStep.value++;
  }
};

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

const generateDays = () => {
  const start = new Date(trip.value.startDate);
  const end = new Date(trip.value.endDate);
  const days: TripDay[] = [];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push({
      date: new Date(d).toISOString().split('T')[0],
      searchTerm: '',
      city: null
    });
  }

  tripDays.value = days;
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
};

const addParticipant = () => {
  const email = newParticipantEmail.value.trim();
  if (!email) return;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    participantError.value = "Email invalide";
    return;
  }
  if (participants.value.includes(email)) {
    participantError.value = "Cet email est déjà ajouté";
    return;
  }
  participants.value.push(email);
  newParticipantEmail.value = '';
  participantError.value = '';
};

const removeParticipant = (index: number) => {
  participants.value.splice(index, 1);
};

const searchCity = (index: number) => {
  activeSearchIndex.value = index;
  const query = tripDays.value[index].searchTerm;

  if (searchTimeout) clearTimeout(searchTimeout);

  if (query.length < 3) {
    searchResults.value = [];
    return;
  }

  searchTimeout = setTimeout(async () => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&featuretype=city`);
      searchResults.value = await response.json();
    } catch (e) {
      console.error("Geocoding error", e);
    }
  }, 500);
};

const selectCity = (index: number, result: any) => {
  const shortName = result.display_name.split(',')[0];
  tripDays.value[index].city = result;
  tripDays.value[index].searchTerm = shortName;
  activeSearchIndex.value = null;
  searchResults.value = [];
};

const copyPreviousCity = (index: number) => {
  if (index > 0) {
    const prevDay = tripDays.value[index - 1];
    if (prevDay.city) {
      tripDays.value[index].city = prevDay.city;
      tripDays.value[index].searchTerm = prevDay.searchTerm;
    }
  }
};

const createTrip = async () => {
  isLoading.value = true;
  apiError.value = '';

  try {
    const tripResponse = await api.post('/trips', {
      title: trip.value.title,
      description: trip.value.description,
      startDate: trip.value.startDate,
      endDate: trip.value.endDate,
      budget: trip.value.budget,
      status: 'planning'
    });

    const tripId = tripResponse.data.id;

    for (let i = 0; i < tripDays.value.length; i++) {
      const day = tripDays.value[i];
      if (!day.city) continue;

      await api.post(`/trips/${tripId}/stops`, {
        title: day.searchTerm,
        description: `Ville étape - Jour ${i + 1}`,
        type: 'city',
        latitude: parseFloat(day.city.lat),
        longitude: parseFloat(day.city.lon),
        address: day.city.display_name,
        arrivalDate: day.date,
        departureDate: day.date,
        order: i + 1,
        isLocked: true
      });
    }

    const invitePromises = participants.value.map(email =>
      api.post(`/trips/${tripId}/participants`, { email })
        .catch(err => console.error(`Failed to invite ${email}`, err))
    );
    await Promise.all(invitePromises);

    alert('Voyage créé avec succès !');
    router.push('/my-trips');

  } catch (error: any) {
    console.error('Error creating trip:', error);
    apiError.value = error.response?.data?.message || 'Une erreur est survenue lors de la création du voyage.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.create-trip-container {
  display: flex;
  justify-content: center;
  padding: 40px 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.create-trip-card {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 800px;
}

h1 {
  text-align: center;
  margin-bottom: 30px;
  color: #2c3e50;
}

.steps-indicator {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30px;
  position: relative;
}

.steps-indicator::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 2px;
  background: #e0e0e0;
  z-index: 1;
  transform: translateY(-50%);
}

.steps-indicator div {
  background: white;
  z-index: 2;
  padding: 5px 15px;
  border-radius: 20px;
  border: 2px solid #e0e0e0;
  color: #7f8c8d;
  font-weight: 500;
  font-size: 0.9rem;
}

.steps-indicator div.active {
  border-color: #3498db;
  color: #3498db;
}

.steps-indicator div.completed {
  border-color: #2ecc71;
  color: #2ecc71;
}

.step-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.form-group {
  margin-bottom: 20px;
}

.form-row {
  display: flex;
  gap: 20px;
}

.form-row .form-group {
  flex: 1;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #34495e;
}

input, textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

input:focus, textarea:focus {
  border-color: #3498db;
  outline: none;
}

textarea {
  resize: vertical;
  min-height: 100px;
}

.invite-row {
  display: flex;
  gap: 10px;
}

.participants-list {
  margin: 20px 0;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.participant-item {
  background: #f0f2f5;
  padding: 8px 12px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}

.days-list {
  margin-bottom: 30px;
}

.day-row {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
  background: #f9f9f9;
  padding: 15px;
  border-radius: 8px;
}

.day-label {
  display: flex;
  flex-direction: column;
  width: 100px;
  flex-shrink: 0;
}

.day-label strong {
  color: #2c3e50;
}

.day-label small {
  color: #7f8c8d;
}

.day-input {
  flex: 1;
  display: flex;
  gap: 10px;
  align-items: center;
}

.day-input input {
  margin-bottom: 0;
}

.day-input input.filled {
  border-color: #2ecc71;
  background-color: #f0fff4;
}

.btn-icon-small {
  background: white;
  border: 1px solid #ddd;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-icon-small:hover {
  background: #f0f0f0;
}

.search-input-wrapper {
  position: relative;
  flex: 1;
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 0 0 6px 6px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  list-style: none;
  padding: 0;
  margin: 0;
}

.search-results li {
  padding: 10px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
}

.search-results li:hover {
  background: #f8f9fa;
}

.actions {
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.btn-primary, .btn-secondary, .btn-success {
  padding: 10px 25px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 1rem;
  transition: background 0.3s;
}

.btn-primary {
  background: #3498db;
  color: white;
  margin-left: auto;
}

.btn-primary:hover {
  background: #2980b9;
}

.btn-primary:disabled, .btn-success:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.btn-secondary {
  background: #ecf0f1;
  color: #2c3e50;
}

.btn-secondary:hover {
  background: #bdc3c7;
}

.btn-success {
  background: #2ecc71;
  color: white;
}

.btn-success:hover {
  background: #27ae60;
}

.btn-icon {
  background: none;
  border: none;
  color: #e74c3c;
  font-size: 1.2rem;
  cursor: pointer;
}

.empty-state {
  text-align: center;
  color: #95a5a6;
  font-style: italic;
  padding: 20px;
}

.error-text {
  color: #e74c3c;
  font-size: 0.9rem;
  margin-top: 5px;
}

.global-error {
  text-align: center;
  margin-top: 15px;
  font-weight: 500;
}
</style>
