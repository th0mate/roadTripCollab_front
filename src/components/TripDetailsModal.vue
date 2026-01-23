<template>
  <div v-if="isOpen" class="trip-modal-overlay" @click.self="close">
    <div class="trip-modal">
      <header class="trip-modal__header">
        <h2 class="trip-modal__title">{{ trip.title }}</h2>
        <button class="trip-modal__close" @click="close">
          <i class="fi fi-rr-cross"></i>
        </button>
      </header>

      <div class="trip-modal__content">
        <div class="trip-modal__image">
          <!-- Placeholder dynamique si pas d'image -->
          <div class="trip-modal__image-placeholder" style="width:100%; height:100%; background: linear-gradient(45deg, #1e4d3d, #4ade80);"></div>
        </div>

        <div class="trip-modal__details">
          <div class="trip-modal__detail-item">
            <div class="trip-modal__detail-icon">
              <i class="fi fi-rr-wallet"></i>
            </div>
            <div class="trip-modal__detail-text">
              <span class="trip-modal__detail-label">Budget estimé</span>
              <span class="trip-modal__detail-value">{{ trip.budget }} €</span>
            </div>
          </div>
          <div class="trip-modal__detail-item">
            <div class="trip-modal__detail-icon">
              <i class="fi fi-rr-map-marker"></i>
            </div>
            <div class="trip-modal__detail-text">
              <span class="trip-modal__detail-label">Étapes</span>
              <span class="trip-modal__detail-value">{{ trip.stops ? trip.stops.length : 0 }} lieux</span>
            </div>
          </div>
        </div>

        <div class="trip-modal__description" v-if="trip.description">
          <div class="trip-modal__section-title">
            <i class="fi fi-rr-info"></i>
            À propos
          </div>
          <p class="trip-modal__text">{{ trip.description }}</p>
        </div>

        <div class="trip-modal__itinerary" v-if="trip.stops && trip.stops.length > 0">
           <div class="trip-modal__section-title">
            <i class="fi fi-rr-route"></i>
            Itinéraire
          </div>
          <div class="trip-modal__stops">
            <div v-for="(stop, index) in sortedStops" :key="stop.id" class="trip-modal__stop">
              <div class="trip-modal__stop-number">{{ index + 1 }}</div>
              <div class="trip-modal__stop-content">
                <div class="trip-modal__stop-title">{{ stop.title }}</div>
                <div class="trip-modal__stop-type">{{ formatStopType(stop.type) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="trip-modal__actions">
        <button class="trip-modal__btn trip-modal__btn--cancel" @click="close">
          Fermer
        </button>
        <button 
          class="trip-modal__btn trip-modal__btn--primary" 
          @click="duplicateTrip" 
          :disabled="isProcessing"
        >
          <i v-if="isProcessing" class="fi fi-rr-spinner trip-dashboard__spinner"></i>
          <i v-else class="fi fi-rr-rocket-lunch"></i>
          {{ isProcessing ? 'Création en cours...' : 'Lancer ce Roadtrip' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, computed, ref } from 'vue';
import api from '../services/api';
import { useRouter } from 'vue-router';

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  trip: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close']);
const router = useRouter();
const isProcessing = ref(false);

const close = () => {
  emit('close');
};

const sortedStops = computed(() => {
  if (!props.trip.stops) return [];
  return [...props.trip.stops].sort((a, b) => a.order - b.order);
});

const formatStopType = (type: string) => {
  const map: Record<string, string> = {
    'city': 'Ville étape',
    'poi': 'Point d\'intérêt',
    'restaurant': 'Restaurant',
    'accommodation': 'Hébergement',
    'activity': 'Activité'
  };
  return map[type] || type;
};

const duplicateTrip = async () => {
  if (!props.trip || !props.trip.id) return;
  isProcessing.value = true;
  try {
    const response = await api.post(`/trips/${props.trip.id}/duplicate`);
    const newTrip = response.data;
    
    // Fermer la modal
    close();
    
    // Rediriger vers le dashboard du nouveau voyage
    router.push(`/trips/${newTrip.id}`);
  } catch (error) {
    console.error('Erreur lors de la duplication du voyage:', error);
    alert('Une erreur est survenue lors de la création du roadtrip.');
  } finally {
    isProcessing.value = false;
  }
};
</script>

<style>
@import "@/assets/styles/tripDetailsModal.css";
</style>
