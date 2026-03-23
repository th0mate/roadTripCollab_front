<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '../services/api';
import { getMe } from '../services/authService';
import type { User } from '../types/user';

const props = defineProps<{ stop: any; }>();
const emit = defineEmits(['close']);
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3333';
const photos = ref<any[]>([]);
const loadingPhotos = ref(true);
const isUploading = ref(false);
const currentUser = ref<User | null>(null);
const lightboxPhoto = ref<any>(null);

const fetchPhotos = async () => {
  loadingPhotos.value = true;
  try {
    const response = await api.get(`/stops/${props.stop.id}/photos`);
    photos.value = response.data.data;
  } catch (e) { console.error(e); }
  finally { loadingPhotos.value = false; }
};

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (!target.files?.length) return;
  isUploading.value = true;
  try {
    for (const file of Array.from(target.files)) {
      const formData = new FormData();
      formData.append('photo', file);
      await api.post(`/stops/${props.stop.id}/photos`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    await fetchPhotos();
  } catch (e) { console.error(e); }
  finally { isUploading.value = false; target.value = ''; }
};

const canDelete = (photo: any) => currentUser.value && photo.userId === currentUser.value.id;
const deletePhoto = async (photo: any) => {
  try { await api.delete(`/photos/${photo.id}`); photos.value = photos.value.filter(p => p.id !== photo.id); if (lightboxPhoto.value?.id === photo.id) lightboxPhoto.value = null; }
  catch (e) { console.error(e); }
};

onMounted(async () => {
  try { currentUser.value = await getMe(); } catch {}
  fetchPhotos();
});
</script>

<template>
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-md" @click.self="$emit('close')">
    <div class="w-full max-w-3xl h-[82vh] bg-white dark:bg-[#111113] rounded-[2rem] border border-zinc-200/80 dark:border-white/8 shadow-[0_32px_80px_rgba(0,0,0,0.18)] dark:shadow-[0_32px_80px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col animate-slide-up">

      <!-- Bande accent violette -->
      <div class="h-1 w-full bg-violet-500 shrink-0"></div>

      <!-- Header -->
      <div class="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-3.5">
          <div class="w-10 h-10 rounded-2xl bg-violet-500/10 text-violet-500 dark:text-violet-400 flex items-center justify-center shrink-0">
            <i class="fi fi-rr-camera text-base leading-none"></i>
          </div>
          <div>
            <h3 class="font-black text-zinc-900 dark:text-zinc-100 text-base leading-tight tracking-tight">Galerie photos</h3>
            <p class="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 truncate max-w-[220px] font-medium">{{ stop.title }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <!-- Upload button -->
          <label
            :class="{ 'opacity-40 pointer-events-none': isUploading }"
            class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[11px] font-black uppercase tracking-widest cursor-pointer hover:bg-violet-500/20 transition-all"
          >
            <span v-if="isUploading" class="spinner w-3.5 h-3.5"></span>
            <i v-else class="fi fi-rr-add-image text-sm leading-none"></i>
            {{ isUploading ? 'En cours…' : 'Ajouter' }}
            <input type="file" accept="image/*" multiple class="hidden" @change="handleFileUpload" :disabled="isUploading" />
          </label>

          <button @click="$emit('close')" class="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer">
            <i class="fi fi-rr-cross-small text-base leading-none"></i>
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-grow overflow-y-auto custom-scrollbar p-5">

        <!-- Loading skeleton -->
        <div v-if="loadingPhotos" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 animate-pulse">
          <div v-for="i in 8" :key="i" class="aspect-square rounded-2xl bg-zinc-100 dark:bg-zinc-800"></div>
        </div>

        <!-- Empty state -->
        <div v-else-if="photos.length === 0" class="h-full flex flex-col items-center justify-center text-center py-16">
          <div class="w-20 h-20 rounded-3xl bg-violet-500/10 flex items-center justify-center mb-5">
            <i class="fi fi-rr-picture text-3xl text-violet-400 leading-none"></i>
          </div>
          <h4 class="font-black text-zinc-900 dark:text-zinc-100 text-base mb-1.5">Aucune photo</h4>
          <p class="text-xs text-zinc-400 dark:text-zinc-500 max-w-[200px] leading-relaxed">Immortalisez cette étape en ajoutant vos premières photos.</p>
          <label class="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-500 text-white text-[11px] font-black uppercase tracking-widest cursor-pointer hover:bg-violet-600 transition-all">
            <i class="fi fi-rr-add-image"></i> Ajouter des photos
            <input type="file" accept="image/*" multiple class="hidden" @change="handleFileUpload" />
          </label>
        </div>

        <!-- Photos Grid -->
        <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <div
            v-for="photo in photos" :key="photo.id"
            class="group relative aspect-square rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 cursor-pointer"
            @click="lightboxPhoto = photo"
          >
            <img :src="`${backendUrl}/uploads/${photo.filePath}`" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />

            <!-- Overlay -->
            <div class="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-zinc-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3">
              <div class="flex justify-end gap-1.5">
                <button v-if="canDelete(photo)" @click.stop="deletePhoto(photo)"
                  class="w-7 h-7 rounded-xl bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center transition-all shadow-lg cursor-pointer">
                  <i class="fi fi-rr-trash text-xs leading-none"></i>
                </button>
                <button @click.stop="lightboxPhoto = photo"
                  class="w-7 h-7 rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer">
                  <i class="fi fi-rr-expand text-xs leading-none"></i>
                </button>
              </div>
              <div class="flex items-center gap-1.5">
                <div class="w-5 h-5 rounded-full bg-violet-500 text-white flex items-center justify-center text-[8px] font-black shrink-0">
                  {{ photo.user?.fullName?.[0]?.toUpperCase() || '?' }}
                </div>
                <span class="text-white text-[10px] font-bold truncate">{{ photo.user?.fullName }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Lightbox -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div v-if="lightboxPhoto" class="fixed inset-0 z-[200] flex items-center justify-center bg-zinc-950/90 backdrop-blur-sm p-6" @click.self="lightboxPhoto = null">
        <div class="relative max-w-4xl max-h-full">
          <img :src="`${backendUrl}/uploads/${lightboxPhoto.filePath}`" class="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl" />
          <button @click="lightboxPhoto = null" class="absolute top-3 right-3 w-9 h-9 rounded-xl bg-zinc-950/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-zinc-950/80 transition-all cursor-pointer">
            <i class="fi fi-rr-cross-small text-xl"></i>
          </button>
          <div v-if="canDelete(lightboxPhoto)" class="absolute bottom-3 right-3">
            <button @click="deletePhoto(lightboxPhoto)" class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/90 hover:bg-rose-500 text-white text-xs font-black cursor-pointer transition-all">
              <i class="fi fi-rr-trash"></i> Supprimer
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.animate-slide-up { animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
@keyframes slideUp { from { opacity: 0; transform: translateY(24px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
</style>
