<template>
  <div class="trip-dashboard__modal-overlay" @click.self="$emit('close')">
    <div class="trip-dashboard__modal trip-dashboard__modal--large">
      <h3 class="trip-dashboard__modal-title">
        <i class="fi fi-rr-edit"></i>
        Modifier le voyage
      </h3>
      <form @submit.prevent="submitUpdate">
        <div class="trip-dashboard__form-group">
          <label class="trip-dashboard__label">Titre</label>
          <input v-model="form.title" required class="trip-dashboard__input" minlength="3" />
        </div>

        <div class="trip-dashboard__form-group">
          <label class="trip-dashboard__label">Description</label>
          <textarea v-model="form.description" class="trip-dashboard__textarea" rows="4"></textarea>
        </div>

        <div class="trip-dashboard__form-row">
          <div class="trip-dashboard__form-group">
            <label class="trip-dashboard__label">Date de début</label>
            <input type="date" v-model="form.startDate" disabled class="trip-dashboard__input trip-dashboard__input--disabled" />
          </div>
          <div class="trip-dashboard__form-group">
            <label class="trip-dashboard__label">Date de fin</label>
            <input type="date" v-model="form.endDate" disabled class="trip-dashboard__input trip-dashboard__input--disabled" />
          </div>
        </div>

        <div class="trip-dashboard__form-group">
          <label class="trip-dashboard__label">Budget (€)</label>
          <input type="number" v-model="form.budget" min="0" class="trip-dashboard__input" />
        </div>

        <div class="trip-dashboard__form-group">
          <label class="trip-dashboard__label">Photo de couverture</label>
          <div class="trip-edit-modal__cover-preview">
            <img
              v-if="previewUrl"
              :src="previewUrl"
              alt="Aperçu de la nouvelle couverture"
              class="trip-edit-modal__img"
            />
            <img
              v-else-if="currentCoverImage"
              :src="`${backendUrl}/uploads/${currentCoverImage}`"
              alt="Couverture actuelle"
              class="trip-edit-modal__img"
            />
            <div v-else class="trip-edit-modal__placeholder">
              <i class="fi fi-rr-picture"></i>
              <span>Aucune image</span>
            </div>
          </div>
          <div class="trip-edit-modal__file-actions">
            <input type="file" @change="handleFileUpload" accept="image/*" class="trip-dashboard__input" />
            <button v-if="previewUrl" @click="cancelNewImage" type="button" class="trip-dashboard__btn trip-dashboard__btn--secondary">
              Annuler le changement
            </button>
          </div>
          <p class="trip-dashboard__form-hint">
            Laissez vide pour conserver l'image actuelle.
          </p>
        </div>

        <div class="trip-dashboard__modal-actions">
          <button type="button" class="trip-dashboard__btn trip-dashboard__btn--secondary" @click="$emit('close')">
            Annuler
          </button>
          <button type="submit" class="trip-dashboard__btn trip-dashboard__btn--primary" :disabled="isSubmitting || !isFormValid">
            <i v-if="isSubmitting" class="fi fi-rr-spinner trip-dashboard__spinner"></i>
            <i v-else class="fi fi-rr-check"></i>
            {{ isSubmitting ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Trip } from '../types/trip';

const props = defineProps<{
  trip: Trip;
  isSubmitting: boolean;
}>();

const emit = defineEmits(['close', 'update']);

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3333';

const form = ref({
  title: props.trip.title,
  description: props.trip.description || '',
  startDate: new Date(props.trip.startDate).toISOString().split('T')[0],
  endDate: new Date(props.trip.endDate).toISOString().split('T')[0],
  budget: props.trip.budget,
  status: props.trip.status
});

const selectedFile = ref<File | null>(null);
const previewUrl = ref<string | null>(null);
const currentCoverImage = computed(() => (props.trip as any).coverImage);

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    selectedFile.value = target.files[0]!;
    previewUrl.value = URL.createObjectURL(selectedFile.value!);
  }
};

const cancelNewImage = () => {
  selectedFile.value = null;
  previewUrl.value = null;
};

const isFormValid = computed(() => {
  return form.value.title && form.value.title.length >= 3 && form.value.startDate && form.value.endDate && new Date(form.value.startDate) <= new Date(form.value.endDate);
});

const submitUpdate = () => {
  if (!isFormValid.value) return;
  emit('update', { ...form.value, coverImage: selectedFile.value });
};
</script>

<style scoped>
/* Reuse styles from trip dashboard or define specific ones if needed */
.trip-dashboard__textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    font-size: 0.95rem;
    font-family: inherit;
    resize: vertical;
    min-height: 80px;
}
.trip-dashboard__form-hint {
    font-size: 0.8rem;
    color: #64748b;
    margin-top: 0.25rem;
}
.trip-dashboard__input--disabled, .trip-dashboard__select--disabled {
    background-color: #f1f5f9;
    cursor: not-allowed;
    color: #64748b;
}

.trip-dashboard__modal--large {
    max-width: 700px;
    width: 90%;
}

.trip-edit-modal__cover-preview {
    width: 100%;
    height: 180px;
    border-radius: 0.5rem;
    overflow: hidden;
    margin-bottom: 1rem;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
}

.trip-edit-modal__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.trip-edit-modal__placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #94a3b8;
    gap: 0.5rem;
}

.trip-edit-modal__placeholder i {
    font-size: 2rem;
}

.trip-edit-modal__file-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}
</style>
