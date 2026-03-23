<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Trip } from '../types/trip';

const props = defineProps<{ trip: Trip; isSubmitting: boolean; }>();
const emit = defineEmits(['close', 'update']);
const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3333';

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
  if (target.files?.[0]) { 
    selectedFile.value = target.files[0]; 
    previewUrl.value = URL.createObjectURL(selectedFile.value); 
  }
};
const cancelNewImage = () => { selectedFile.value = null; previewUrl.value = null; };
const isFormValid = computed(() => form.value.title && form.value.title.length >= 3);
const submitUpdate = () => { if (!isFormValid.value) return; emit('update', { ...form.value, coverImage: selectedFile.value }); };
</script>

<template>
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md animate-fade-in" @click.self="$emit('close')">
    <div class="w-full max-w-xl bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] border border-zinc-200/50 dark:border-zinc-800/50 shadow-2xl overflow-hidden flex flex-col animate-slide-up">
      
      <!-- Header -->
      <div class="px-8 py-6 border-b border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-xl bg-primary-400/10 flex items-center justify-center text-primary-400">
            <i class="fi fi-rr-settings-sliders text-lg"></i>
          </div>
          <h3 class="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Paramètres du voyage</h3>
        </div>
        <button @click="$emit('close')" class="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-rose-500 transition-all cursor-pointer">
          <i class="fi fi-rr-cross-small text-xl"></i>
        </button>
      </div>

      <!-- Content -->
      <div class="p-8 overflow-y-auto custom-scrollbar flex-grow space-y-6">
        <!-- Image Preview Section -->
        <div class="relative h-40 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 group">
          <img v-if="previewUrl" :src="previewUrl" class="w-full h-full object-cover" />
          <img v-else-if="currentCoverImage" :src="`${backendUrl}/uploads/${currentCoverImage}`" class="w-full h-full object-cover" />
          <div v-else class="w-full h-full flex flex-col items-center justify-center text-zinc-400 opacity-50">
            <i class="fi fi-rr-picture text-3xl mb-2"></i>
            <span class="text-[10px] font-black uppercase">Aucune couverture</span>
          </div>
          <label class="absolute inset-0 bg-black/0 hover:bg-black/40 flex items-center justify-center transition-all cursor-pointer group-hover:opacity-100">
            <div class="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all">
              <i class="fi fi-rr-camera"></i>
            </div>
            <input type="file" @change="handleFileUpload" accept="image/*" class="hidden" />
          </label>
        </div>

        <div class="space-y-5">
          <div class="group relative">
            <label class="text-[10px] font-black uppercase text-zinc-400 mb-1.5 ml-1 block">Titre</label>
            <input v-model="form.title" class="block w-full bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 dark:text-zinc-100 outline-none transition-all" />
          </div>

          <div class="group relative">
            <label class="text-[10px] font-black uppercase text-zinc-400 mb-1.5 ml-1 block">Description</label>
            <textarea v-model="form.description" rows="3" class="block w-full bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 rounded-xl px-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-100 outline-none transition-all resize-none"></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-[10px] font-black uppercase text-zinc-400 mb-1.5 ml-1 block">Budget (€)</label>
              <input type="number" v-model="form.budget" class="block w-full bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 dark:text-zinc-100 outline-none transition-all" />
            </div>
            <div>
              <label class="text-[10px] font-black uppercase text-zinc-400 mb-1.5 ml-1 block">Statut</label>
              <select v-model="form.status" class="block w-full bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 dark:text-zinc-100 outline-none transition-all">
                <option value="planning">Planification</option>
                <option value="active">En cours</option>
                <option value="completed">Terminé</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-8 py-6 bg-zinc-50 dark:bg-white/[0.02] border-t border-zinc-100 dark:border-zinc-800/50 flex justify-end gap-3">
        <button @click="$emit('close')" class="px-6 py-3 text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer">Annuler</button>
        <button @click="submitUpdate" :disabled="isSubmitting || !isFormValid" class="btn-primary !px-8 shadow-xl shadow-primary-400/20">
          <span v-if="isSubmitting" class="spinner w-4 h-4"></span>
          <span v-else>Enregistrer</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
.animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
</style>
