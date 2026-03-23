<script setup lang="ts">
import { computed, ref } from 'vue';
import api from '../services/api';
import { useRouter } from 'vue-router';

const props = defineProps<{ isOpen: boolean; trip: any; }>();
const emit = defineEmits(['close']);
const router = useRouter();
const isProcessing = ref(false);
const close = () => emit('close');
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3333';

const sortedStops = computed(() => {
  if (!props.trip?.stops) return [];
  return [...props.trip.stops].sort((a, b) => a.order - b.order);
});

const formatStopType = (type: string) => ({
  'city': 'Ville étape', 'poi': 'Point d\'intérêt',
  'restaurant': 'Restaurant', 'accommodation': 'Hébergement', 'activity': 'Activité'
}[type] || type);

const duplicateTrip = async () => {
  if (!props.trip?.id) return;
  isProcessing.value = true;
  try {
    const response = await api.post(`/trips/${props.trip.id}/duplicate`);
    close(); router.push(`/trips/${response.data.id}`);
  } catch { alert('Erreur lors de la création.'); }
  finally { isProcessing.value = false; }
};
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="isOpen" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-zinc-950/60 backdrop-blur-sm" @click.self="close">
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 translate-y-4 sm:scale-95"
          enter-to-class="opacity-100 translate-y-0 sm:scale-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 translate-y-4"
        >
          <div v-if="isOpen" class="w-full sm:max-w-xl bg-white dark:bg-zinc-800 rounded-t-3xl sm:rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">

            <div class="relative h-48 sm:h-56 shrink-0 overflow-hidden bg-zinc-100 dark:bg-zinc-700">
              <img v-if="trip.coverImage" :src="`${backendUrl}/uploads/${trip.coverImage}`" class="w-full h-full object-cover" />
              <div v-else class="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600"></div>
              <div class="absolute inset-0 bg-gradient-to-t from-zinc-900/80 via-zinc-900/20 to-transparent"></div>

              <button @click="close" class="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white/20 dark:bg-zinc-900/40 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center text-white transition-all cursor-pointer">
                <i class="fi fi-rr-cross-small text-sm leading-none"></i>
              </button>

              <div class="absolute bottom-5 left-5 right-5">
                <h2 class="text-xl font-bold text-white mb-0.5 line-clamp-1">{{ trip.title }}</h2>
                <p class="text-primary-300 text-xs font-medium">{{ sortedStops.length }} étapes</p>
              </div>
            </div>

            <div class="p-5 overflow-y-auto custom-scrollbar flex-grow space-y-5">
              <div class="grid grid-cols-2 gap-3">
                <div class="bg-zinc-50 dark:bg-zinc-700/50 rounded-xl p-4 border border-zinc-100 dark:border-zinc-700">
                  <p class="section-label mb-1">Budget</p>
                  <p class="text-lg font-bold text-zinc-900 dark:text-white">{{ trip.budget ? trip.budget + ' €' : '—' }}</p>
                </div>
                <div class="bg-zinc-50 dark:bg-zinc-700/50 rounded-xl p-4 border border-zinc-100 dark:border-zinc-700">
                  <p class="section-label mb-1">Participants</p>
                  <p class="text-lg font-bold text-zinc-900 dark:text-white">{{ trip.participants?.length || 1 }}</p>
                </div>
              </div>

              <div v-if="trip.description">
                <p class="section-label mb-2">À propos</p>
                <p class="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{{ trip.description }}</p>
              </div>

              <div v-if="sortedStops.length > 0">
                <p class="section-label mb-3">Itinéraire</p>
                <div class="space-y-2 border-l-2 border-zinc-100 dark:border-zinc-700 pl-5 ml-2">
                  <div v-for="(stop, index) in sortedStops" :key="stop.id" class="relative">
                    <div class="absolute -left-[25px] top-2 w-3 h-3 rounded-full bg-white dark:bg-zinc-800 border-2 border-primary-400"></div>
                    <div class="bg-zinc-50 dark:bg-zinc-700/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-700">
                      <div class="flex items-center justify-between">
                        <p class="text-sm font-semibold text-zinc-900 dark:text-white">{{ stop.title }}</p>
                        <span class="badge-zinc text-[10px]">{{ formatStopType(stop.type) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="px-5 py-4 border-t border-zinc-100 dark:border-zinc-700 flex gap-3">
              <button @click="close" class="btn-ghost flex-1">Fermer</button>
              <button
                @click="duplicateTrip" :disabled="isProcessing"
                class="btn-primary flex-[2] disabled:opacity-50"
              >
                <span v-if="isProcessing" class="spinner w-4 h-4 opacity-70"></span>
                <span v-else class="flex items-center gap-2">
                  <i class="fi fi-rr-copy-alt leading-none"></i>
                  Créer un itinéraire similaire
                </span>
              </button>
            </div>

          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
