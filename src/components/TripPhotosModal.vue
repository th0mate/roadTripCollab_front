<template>
  <div class="trip-dashboard__modal-overlay" @click.self="$emit('close')">
    <div class="trip-dashboard__modal trip-dashboard__modal--photos">
      <div class="trip-dashboard__modal-header">
        <h3 class="trip-dashboard__modal-title">
          <i class="fi fi-rr-camera"></i>
          Photos : {{ stop.title }}
        </h3>
        <button class="trip-dashboard__modal-close-btn" @click="$emit('close')">
          <i class="fi fi-rr-cross"></i>
        </button>
      </div>

      <div class="trip-photos__upload-section">
        <label for="photo-upload" class="trip-photos__upload-btn" :class="{ 'trip-photos__upload-btn--loading': isUploading }">
          <i v-if="isUploading" class="fi fi-rr-spinner trip-dashboard__spinner"></i>
          <i v-else class="fi fi-rr-add-image"></i>
          <span>{{ isUploading ? 'Envoi...' : 'Ajouter des photos' }}</span>
        </label>
        <input
          type="file"
          id="photo-upload"
          accept="image/*"
          class="trip-photos__file-input"
          @change="handleFileUpload"
          :disabled="isUploading"
          multiple
        />
      </div>

      <div v-if="loadingPhotos" class="trip-photos__loading">
        <i class="fi fi-rr-spinner trip-dashboard__spinner"></i>
        Chargement des photos...
      </div>

      <div v-else-if="photos.length === 0" class="trip-photos__empty">
        <i class="fi fi-rr-picture"></i>
        <p>Aucune photo pour cette activité.</p>
      </div>

      <div v-else class="trip-photos__grid">
        <div v-for="photo in photos" :key="photo.id" class="trip-photos__item">
          <img :src="`${backendUrl}/uploads/${photo.filePath}`" alt="Photo" class="trip-photos__img" />
          <div class="trip-photos__overlay">
            <span class="trip-photos__author">Par {{ photo.user?.fullName }}</span>
            <button v-if="canDelete(photo)" class="trip-photos__delete" @click="deletePhoto(photo)">
              <i class="fi fi-rr-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import api from '../services/api';
import { getMe } from '../services/authService';
import type { User } from '../types/user';

const props = defineProps<{
  stop: any;
}>();

const emit = defineEmits(['close']);

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3333';
const photos = ref<any[]>([]);
const loadingPhotos = ref(true);
const isUploading = ref(false);
const currentUser = ref<User | null>(null);

const fetchPhotos = async () => {
  loadingPhotos.value = true;
  try {
    const response = await api.get(`/stops/${props.stop.id}/photos`);
    photos.value = response.data.data;
  } catch (e) {
    console.error('Error fetching photos:', e);
  } finally {
    loadingPhotos.value = false;
  }
};

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;

  const files = Array.from(target.files);
  isUploading.value = true;

  try {
    // On envoie les photos une par une (plus simple pour la gestion d'erreurs et compatible avec le backend actuel)
    for (const file of files) {
      const formData = new FormData();
      formData.append('photo', file);
      
      await api.post(`/stops/${props.stop.id}/photos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    }
    await fetchPhotos();
  } catch (e) {
    console.error('Error uploading photos:', e);
    alert("Une ou plusieurs photos n'ont pas pu être envoyées.");
  } finally {
    isUploading.value = false;
    target.value = ''; // Reset input
  }
};

const canDelete = (photo: any) => {
  return currentUser.value && photo.userId === currentUser.value.id;
};

const deletePhoto = async (photo: any) => {
  if (!confirm('Voulez-vous vraiment supprimer cette photo ?')) return;
  try {
    await api.delete(`/photos/${photo.id}`);
    photos.value = photos.value.filter(p => p.id !== photo.id);
  } catch (e) {
    console.error('Error deleting photo:', e);
    alert("Erreur lors de la suppression.");
  }
};

onMounted(async () => {
  try {
    currentUser.value = await getMe();
  } catch (e) {
    console.error("Failed to load user", e);
  }
  fetchPhotos();
});
</script>

<style scoped>
.trip-dashboard__modal--photos {
  max-width: 800px;
  width: 90%;
  height: 80vh;
  display: flex;
  flex-direction: column;
}

.trip-dashboard__modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.trip-dashboard__modal-close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #64748b;
}

.trip-photos__upload-section {
  margin-bottom: 1.5rem;
}

.trip-photos__file-input {
  display: none;
}

.trip-photos__upload-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 1rem;
  border: 2px dashed #cbd5e1;
  border-radius: 0.5rem;
  color: #64748b;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.trip-photos__upload-btn:hover {
  border-color: #1e4d3d;
  color: #1e4d3d;
  background: #f0fdf4;
}

.trip-photos__upload-btn--loading {
  cursor: not-allowed;
  opacity: 0.7;
}

.trip-photos__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.trip-photos__item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.trip-photos__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.trip-photos__item:hover .trip-photos__img {
  transform: scale(1.05);
}

.trip-photos__overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
  padding: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  opacity: 0;
  transition: opacity 0.2s;
}

.trip-photos__item:hover .trip-photos__overlay {
  opacity: 1;
}

.trip-photos__author {
  color: white;
  font-size: 0.7rem;
}

.trip-photos__delete {
  background: rgba(239, 68, 68, 0.8);
  border: none;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.trip-photos__empty, .trip-photos__loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  gap: 1rem;
}

.trip-photos__empty i, .trip-photos__loading i {
  font-size: 2rem;
}
</style>
