<template>
  <div class="create-trip">
    <div class="create-trip__hero">
      <div class="create-trip__hero-content">
        <div class="create-trip__hero-icon">
          <i class="fi fi-rr-route"></i>
        </div>
        <div class="create-trip__hero-text">
          <h1 class="create-trip__title">Créer un nouveau voyage</h1>
          <p class="create-trip__subtitle">Organisez l'aventure parfaite en quelques étapes</p>
        </div>
      </div>
    </div>

    <div class="create-trip__container">
      <div class="create-trip__steps">
        <div
          v-for="step in 3"
          :key="step"
          class="create-trip__step"
          :class="{
            'create-trip__step--active': currentStep === step,
            'create-trip__step--completed': currentStep > step
          }"
        >
          <div class="create-trip__step-number">
            <i v-if="currentStep > step" class="fi fi-rr-check"></i>
            <span v-else>{{ step }}</span>
          </div>
          <div class="create-trip__step-text">
            <span class="create-trip__step-label">Étape {{ step }}</span>
            <span class="create-trip__step-title">{{ getStepTitle(step) }}</span>
          </div>
        </div>
      </div>

      <div class="create-trip__content">
        <div v-if="currentStep === 1" class="create-trip__step-content">
          <div class="create-trip__step-header">
            <i class="fi fi-rr-info"></i>
            <h2>Informations générales</h2>
          </div>

          <div class="create-trip__form">
            <div class="create-trip__form-group">
              <label for="title" class="create-trip__label">
                <i class="fi fi-rr-label"></i>
                Titre du voyage
              </label>
              <input
                type="text"
                id="title"
                v-model="trip.title"
                placeholder="Ex: Roadtrip en Italie du Sud"
                class="create-trip__input"
                required
              />
            </div>

            <div class="create-trip__form-group">
              <label for="description" class="create-trip__label">
                <i class="fi fi-rr-edit"></i>
                Description
              </label>
              <textarea
                id="description"
                v-model="trip.description"
                placeholder="Décrivez votre voyage, les activités prévues, l'ambiance..."
                class="create-trip__textarea"
              ></textarea>
            </div>

            <div class="create-trip__form-group">
              <label for="coverImage" class="create-trip__label">
                <i class="fi fi-rr-picture"></i>
                Photo de couverture
              </label>
              
              <div v-if="previewUrl" class="create-trip__preview">
                <img :src="previewUrl" alt="Aperçu" class="create-trip__preview-img" />
                <button @click="removeImage" type="button" class="create-trip__preview-remove">
                  <i class="fi fi-rr-cross-small"></i>
                </button>
              </div>

              <input
                v-if="!previewUrl"
                type="file"
                id="coverImage"
                @change="handleFileUpload"
                accept="image/*"
                class="create-trip__input"
                required
              />
            </div>

            <div class="create-trip__form-row">
              <div class="create-trip__form-group">
                <label for="startDate" class="create-trip__label">
                  <i class="fi fi-rr-calendar"></i>
                  Date de début
                </label>
                <input
                  type="date"
                  id="startDate"
                  v-model="trip.startDate"
                  :min="today"
                  class="create-trip__input"
                  required
                />
              </div>
              <div class="create-trip__form-group">
                <label for="endDate" class="create-trip__label">
                  <i class="fi fi-rr-calendar-check"></i>
                  Date de fin
                </label>
                <input
                  type="date"
                  id="endDate"
                  v-model="trip.endDate"
                  :min="trip.startDate"
                  :disabled="!trip.startDate"
                  class="create-trip__input"
                  required
                />
              </div>
            </div>

            <div class="create-trip__form-group">
              <label for="budget" class="create-trip__label">
                <i class="fi fi-rr-wallet"></i>
                Budget initial (€)
              </label>
              <input
                type="number"
                id="budget"
                v-model="trip.budget"
                placeholder="0"
                min="0"
                class="create-trip__input"
              />
              <p class="create-trip__hint">
                <i class="fi fi-rr-bulb"></i>
                Budget de départ de la cagnotte commune
              </p>
            </div>
          </div>

          <div class="create-trip__actions">
            <button
              class="create-trip__btn create-trip__btn--primary"
              @click="nextStep"
              :disabled="!isStep1Valid"
            >
              <span>Suivant</span>
              <i class="fi fi-rr-arrow-right"></i>
            </button>
          </div>
        </div>

        <div v-if="currentStep === 2" class="create-trip__step-content">
          <div class="create-trip__step-header">
            <i class="fi fi-rr-users-alt"></i>
            <h2>Inviter des participants</h2>
          </div>

          <div class="create-trip__form">
            <div class="create-trip__form-group">
              <label for="inviteEmail" class="create-trip__label">
                <i class="fi fi-rr-envelope"></i>
                Email des participants
              </label>
              <div class="create-trip__invite-row">
                <input
                  type="email"
                  id="inviteEmail"
                  v-model="newParticipantEmail"
                  placeholder="ami@exemple.com"
                  @keyup.enter="addParticipant"
                  class="create-trip__input"
                />
                <button
                  class="create-trip__btn create-trip__btn--secondary"
                  @click="addParticipant"
                  type="button"
                >
                  <i class="fi fi-rr-plus"></i>
                  <span>Ajouter</span>
                </button>
              </div>
              <p v-if="participantError" class="create-trip__error">
                <i class="fi fi-rr-exclamation"></i>
                {{ participantError }}
              </p>
            </div>

            <div class="create-trip__participants">
              <div class="create-trip__participants-header">
                <i class="fi fi-rr-users"></i>
                <span>Participants ({{ participants.length }})</span>
              </div>
              <div v-if="participants.length > 0" class="create-trip__participants-list">
                <div
                  v-for="(email, index) in participants"
                  :key="index"
                  class="create-trip__participant"
                >
                  <div class="create-trip__participant-avatar">
                    <i class="fi fi-rr-user"></i>
                  </div>
                  <span class="create-trip__participant-email">{{ email }}</span>
                  <button
                    class="create-trip__participant-remove"
                    @click="removeParticipant(index)"
                    type="button"
                  >
                    <i class="fi fi-rr-cross-small"></i>
                  </button>
                </div>
              </div>
              <div v-else class="create-trip__empty">
                <div class="create-trip__empty-icon">
                  <i class="fi fi-rr-user-add"></i>
                </div>
                <p class="create-trip__empty-text">
                  Aucun participant ajouté pour le moment.<br>
                  <small>Vous pouvez aussi inviter des personnes plus tard.</small>
                </p>
              </div>
            </div>
          </div>

          <div class="create-trip__actions">
            <button
              class="create-trip__btn create-trip__btn--secondary"
              @click="prevStep"
            >
              <i class="fi fi-rr-arrow-left"></i>
              <span>Précédent</span>
            </button>
            <button
              class="create-trip__btn create-trip__btn--primary"
              @click="nextStep"
            >
              <span>Suivant</span>
              <i class="fi fi-rr-arrow-right"></i>
            </button>
          </div>
        </div>

        <div v-if="currentStep === 3" class="create-trip__step-content">
          <div class="create-trip__step-header">
            <i class="fi fi-rr-map-marker"></i>
            <h2>Planifier l'itinéraire</h2>
          </div>

          <div class="create-trip__intro">
            <div class="create-trip__intro-icon">
              <i class="fi fi-rr-route-highway"></i>
            </div>
            <div class="create-trip__intro-text">
              <h3>Définissez vos étapes quotidiennes</h3>
              <p>Indiquez la ville où vous vous trouvez chaque jour. Les activités pourront être ajoutées ultérieurement dans le tableau de bord.</p>
            </div>
          </div>

          <div class="create-trip__days">
            <div
              v-for="(day, index) in tripDays"
              :key="index"
              class="create-trip__day"
              :class="{ 'create-trip__day--filled': day.city }"
            >
              <div class="create-trip__day-number">
                <i class="fi fi-rr-calendar-day"></i>
                <span>Jour {{ index + 1 }}</span>
              </div>
              <div class="create-trip__day-date">
                {{ formatDate(day.date) }}
              </div>
              <div class="create-trip__day-input">
                <div class="create-trip__search-wrapper">
                  <i class="fi fi-rr-search"></i>
                  <input
                    type="text"
                    v-model="day.searchTerm"
                    @input="searchCity(index)"
                    placeholder="Rechercher une ville..."
                    class="create-trip__input"
                  />
                  <i v-if="day.city" class="fi fi-rr-check-circle create-trip__check-icon"></i>
                  <ul
                    v-if="activeSearchIndex === index && searchResults.length > 0"
                    class="create-trip__search-results"
                  >
                    <li
                      v-for="result in searchResults"
                      :key="result.place_id"
                      @click="selectCity(index, result)"
                      class="create-trip__search-result"
                    >
                      <i class="fi fi-rr-marker"></i>
                      <span>{{ result.display_name }}</span>
                    </li>
                  </ul>
                </div>
                <button
                  v-if="index > 0"
                  class="create-trip__copy-btn"
                  @click="copyPreviousCity(index)"
                  title="Même ville qu'hier"
                  type="button"
                >
                  <i class="fi fi-rr-copy-alt"></i>
                </button>
              </div>
            </div>
          </div>

          <div class="create-trip__actions">
            <button
              class="create-trip__btn create-trip__btn--secondary"
              @click="prevStep"
            >
              <i class="fi fi-rr-arrow-left"></i>
              <span>Précédent</span>
            </button>
            <button
              class="create-trip__btn create-trip__btn--success"
              @click="createTrip"
              :disabled="isLoading || !areAllDaysFilled"
            >
              <i class="fi fi-rr-check"></i>
              <span>{{ isLoading ? 'Création...' : 'Créer le voyage' }}</span>
            </button>
          </div>
          <p v-if="apiError" class="create-trip__error create-trip__error--global">
            <i class="fi fi-rr-exclamation"></i>
            {{ apiError }}
          </p>
        </div>
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
const today = new Date().toISOString().split('T')[0];

const trip = ref({
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  budget: 0,
});

const selectedFile = ref<File | null>(null);
const previewUrl = ref<string | null>(null);

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    selectedFile.value = target.files[0];
    previewUrl.value = URL.createObjectURL(selectedFile.value);
  }
};

const removeImage = () => {
  selectedFile.value = null;
  previewUrl.value = null;
};

const newParticipantEmail = ref('');
const participants = ref<string[]>([]);
const participantError = ref('');

interface City {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
}

interface TripDay {
  date: string;
  searchTerm: string;
  city: City | null;
}

const tripDays = ref<TripDay[]>([]);
const activeSearchIndex = ref<number | null>(null);
const searchResults = ref<City[]>([]);
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

const isStep1Valid = computed(() => {
  return trip.value.title && trip.value.startDate && trip.value.endDate && selectedFile.value;
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
    const dateString = new Date(d).toISOString().split('T')[0];
    days.push({
      date: dateString || '',
      searchTerm: '',
      city: null
    });
  }

  tripDays.value = days;
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
};

const getStepTitle = (step: number) => {
  const titles = {
    1: 'Informations',
    2: 'Participants',
    3: 'Itinéraire'
  };
  return titles[step as keyof typeof titles] || '';
};

const addParticipant = async () => {
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

  // Vérifier si l'email existe dans la base de données
  try {
    await api.post('/participants/check', { email });
    // Si pas d'erreur, l'utilisateur existe
    participants.value.push(email);
    newParticipantEmail.value = '';
    participantError.value = '';
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      participantError.value = "Cet utilisateur n'existe pas dans l'application";
    } else {
      participantError.value = "Erreur lors de la vérification";
    }
  }
};

const removeParticipant = (index: number) => {
  participants.value.splice(index, 1);
};

const searchCity = (index: number) => {
  activeSearchIndex.value = index;
  const day = tripDays.value[index];
  if (!day) return;

  const query = day.searchTerm;

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

const selectCity = (index: number, result: City) => {
  const day = tripDays.value[index];
  if (!day) return;

  const shortName = result.display_name.split(',')[0];
  day.city = result;
  day.searchTerm = shortName;
  activeSearchIndex.value = null;
  searchResults.value = [];
};

const copyPreviousCity = (index: number) => {
  if (index > 0) {
    const prevDay = tripDays.value[index - 1];
    const currentDay = tripDays.value[index];
    if (prevDay && currentDay && prevDay.city) {
      currentDay.city = prevDay.city;
      currentDay.searchTerm = prevDay.searchTerm;
    }
  }
};

const createTrip = async () => {
  isLoading.value = true;
  apiError.value = '';

  try {
    const formData = new FormData();
    formData.append('title', trip.value.title);
    if (trip.value.description) formData.append('description', trip.value.description);
    formData.append('startDate', trip.value.startDate);
    formData.append('endDate', trip.value.endDate);
    if (trip.value.budget) formData.append('budget', trip.value.budget.toString());
    formData.append('status', 'planning');
    
    if (selectedFile.value) {
      formData.append('cover_image', selectedFile.value);
    }

    const tripResponse = await api.post('/trips', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    const tripId = tripResponse.data.id;

    for (let i = 0; i < tripDays.value.length; i++) {
      const day = tripDays.value[i];
      if (!day || !day.city) continue;

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

  } catch (error: unknown) {
    console.error('Error creating trip:', error);
    if (error && typeof error === 'object' && 'response' in error) {
      const err = error as { response?: { data?: { message?: string } } };
      apiError.value = err.response?.data?.message || 'Une erreur est survenue lors de la création du voyage.';
    } else {
      apiError.value = 'Une erreur est survenue lors de la création du voyage.';
    }
  } finally {
    isLoading.value = false;
  }
};
</script>

<style>
@import "../assets/styles/createTripView.css";
</style>
