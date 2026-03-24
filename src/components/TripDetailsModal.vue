<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue';
import api from '../services/api';
import { useRouter } from 'vue-router';
import { useToast } from '../composables/useToast';

const toast = useToast();

const props = defineProps<{ isOpen: boolean; trip: any; }>();
const emit = defineEmits(['close']);
const router = useRouter();
const isProcessing = ref(false);
const close = () => emit('close');
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3333';

const stopConfig: Record<string, { color: string; icon: string; label: string }> = {
  city:          { color: '#9fe000', icon: 'fi-rr-city',     label: 'Ville' },
  accommodation: { color: '#60a5fa', icon: 'fi-rr-home',     label: 'Hébergement' },
  restaurant:    { color: '#fbbf24', icon: 'fi-rr-utensils', label: 'Restaurant' },
  activity:      { color: '#a78bfa', icon: 'fi-rr-kayak',    label: 'Activité' },
  poi:           { color: '#fb7185', icon: 'fi-rr-marker',   label: 'POI' },
};
const getStop = (type: string) => stopConfig[type] ?? { color: '#a1a1aa', icon: 'fi-rr-marker', label: type };

const sortedStops = computed(() => {
  if (!props.trip?.stops) return [];
  return [...props.trip.stops].sort((a: any, b: any) => a.order - b.order);
});
const cityStops = computed(() =>
  sortedStops.value.filter((s: any) => s.type === 'city').slice(0, 5)
);

const tripDuration = computed(() => {
  if (!props.trip?.startDate || !props.trip?.endDate) return null;
  return Math.max(1, Math.ceil(
    (new Date(props.trip.endDate).getTime() - new Date(props.trip.startDate).getTime())
    / (1000 * 60 * 60 * 24)
  ));
});
const formattedDates = computed(() => {
  if (!props.trip?.startDate || !props.trip?.endDate) return null;
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${fmt(props.trip.startDate)} – ${fmt(props.trip.endDate)}`;
});

const budgetPerPerson = computed(() => {
  if (!props.trip?.budget) return null;
  const n = props.trip.participants?.length || 1;
  if (n < 2) return null;
  return Math.round(props.trip.budget / n);
});

const formatBudget = (v: number) => {
  if (v >= 10000) return Math.round(v / 1000) + 'k €';
  if (v >= 1000) return (Math.round(v / 100) / 10).toString().replace('.', ',') + 'k €';
  return v + ' €';
};

const getFirstName = (fullName: string) => fullName?.split(' ')[0] || '?';
const getInitials = (name: string) => {
  if (!name) return '?';
  return name.split(' ').map((x: string) => x[0]).join('').toUpperCase().substring(0, 2);
};
const getAvatarUrl = (avatar: string | null) => {
  if (!avatar) return null;
  return avatar.startsWith('http') ? avatar : `${backendUrl}${avatar}`;
};

const PLACEHOLDERS = [
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1503221043305-f7498f8b7888?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1530789253388-582c481c54b0?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1501555088652-021faa106b9b?q=80&w=1200&auto=format&fit=crop',
];

const heroImages = computed((): string[] => {
  const photos: string[] = [];
  for (const stop of (props.trip?.stops || [])) {
    for (const photo of (stop.photos || [])) {
      if (photo.filePath) photos.push(`${backendUrl}/uploads/${photo.filePath}`);
    }
  }
  return photos.length > 0 ? photos : PLACEHOLDERS;
});

const currentSlide = ref(0);
const isTransitioning = ref(false);
let slideTimer: ReturnType<typeof setInterval> | null = null;

const goToSlide = (idx: number) => {
  if (isTransitioning.value) return;
  isTransitioning.value = true;
  currentSlide.value = idx;
  setTimeout(() => { isTransitioning.value = false; }, 700);
};

const nextSlide = () => {
  goToSlide((currentSlide.value + 1) % heroImages.value.length);
};

const startCarousel = () => {
  stopCarousel();
  if (heroImages.value.length > 1) {
    slideTimer = setInterval(nextSlide, 4000);
  }
};
const stopCarousel = () => {
  if (slideTimer) { clearInterval(slideTimer); slideTimer = null; }
};

watch(() => props.isOpen, (open) => {
  if (open) { currentSlide.value = 0; startCarousel(); }
  else stopCarousel();
}, { immediate: true });

watch(heroImages, () => { currentSlide.value = 0; startCarousel(); });

onUnmounted(stopCarousel);

const duplicateTrip = async () => {
  if (!props.trip?.id) return;
  isProcessing.value = true;
  try {
    const res = await api.post(`/trips/${props.trip.id}/duplicate`);
    close();
    router.push(`/trips/${res.data.id}`);
  } catch {
    toast.error('Erreur lors de la duplication du voyage.');
  } finally {
    isProcessing.value = false;
  }
};
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-250 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-zinc-950/70 backdrop-blur-md"
        @click.self="close"
      >
        <Transition
          enter-active-class="transition duration-[380ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
          enter-from-class="opacity-0 translate-y-8 sm:translate-y-0 sm:scale-[0.96]"
          enter-to-class="opacity-100 translate-y-0 sm:scale-100"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0 translate-y-4"
        >
          <div
            v-if="isOpen"
            class="modal-shell w-full sm:max-w-2xl bg-white dark:bg-[#111113] rounded-t-[2rem] sm:rounded-[2rem] border border-zinc-200/60 dark:border-white/8 shadow-[0_40px_100px_rgba(0,0,0,0.18)] dark:shadow-[0_40px_100px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh]"
          >

            <div class="relative shrink-0 overflow-hidden" style="height: 260px;">

              <div
                v-for="(img, idx) in heroImages"
                :key="img"
                class="slide absolute inset-0"
                :class="idx === currentSlide ? 'slide--active' : 'slide--hidden'"
              >
                <img :src="img" class="w-full h-full object-cover" alt="" />
              </div>

              <div class="absolute inset-0 bg-gradient-to-t from-zinc-950/95 via-zinc-950/30 to-transparent pointer-events-none"></div>
              <div class="absolute inset-0 bg-gradient-to-r from-zinc-950/40 to-transparent pointer-events-none"></div>

              <div
                v-if="heroImages.length > 1"
                class="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10"
              >
                <button
                  v-for="(_, idx) in heroImages"
                  :key="idx"
                  @click="goToSlide(idx)"
                  class="dot-btn transition-all duration-300 rounded-full cursor-pointer"
                  :class="idx === currentSlide
                    ? 'w-5 h-1.5 bg-primary-400'
                    : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/60'"
                ></button>
              </div>

              <button
                @click="close"
                class="absolute top-4 right-4 z-20 w-9 h-9 rounded-xl bg-black/50 hover:bg-black/75 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer"
              >
                <i class="fi fi-rr-cross-small text-lg leading-none"></i>
              </button>

              <!-- Category + dates badges (bottom of top area, left) -->
              <div class="absolute top-4 left-4 flex items-center gap-2 flex-wrap">
                <span
                  v-if="trip.category"
                  class="inline-flex items-center h-7 px-3 rounded-lg bg-primary-400 text-zinc-950 text-[10px] font-black uppercase tracking-wider shadow-lg shadow-primary-400/30"
                >{{ trip.category }}</span>
                <span
                  v-if="formattedDates"
                  class="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg bg-black/50 backdrop-blur-sm border border-white/10 text-white/80 text-[10px] font-semibold"
                >
                  <i class="fi fi-rr-calendar text-primary-400 text-[10px] leading-none shrink-0"></i>
                  {{ formattedDates }}
                </span>
              </div>

              <div class="absolute bottom-0 left-0 right-0 px-6 pb-5 flex flex-col gap-2">
                <div v-if="cityStops.length >= 2" class="flex items-center gap-1.5 flex-wrap">
                  <template v-for="(city, idx) in cityStops" :key="city.id">
                    <span class="text-[10px] font-black text-primary-400 uppercase tracking-wider leading-none">{{ city.title }}</span>
                    <i
                      v-if="idx < cityStops.length - 1"
                      class="fi fi-rr-arrow-right text-[9px] text-white/25 leading-none shrink-0"
                    ></i>
                  </template>
                  <span v-if="trip.stops?.length > 5" class="text-[10px] text-white/30 font-bold leading-none">…</span>
                </div>

                <h2 class="text-[1.6rem] font-black text-white leading-[1.15] tracking-tight">
                  {{ trip.title }}
                </h2>

                <div class="flex items-center gap-5">
                  <div v-if="tripDuration" class="flex items-center gap-1.5">
                    <i class="fi fi-rr-clock text-primary-400 text-[11px] leading-none shrink-0"></i>
                    <span class="text-[11px] font-bold text-white/60 leading-none">{{ tripDuration }}j</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <i class="fi fi-rr-map-marker text-primary-400 text-[11px] leading-none shrink-0"></i>
                    <span class="text-[11px] font-bold text-white/60 leading-none">{{ sortedStops.length }} étapes</span>
                  </div>
                  <div v-if="trip.participants?.length" class="flex items-center gap-1.5">
                    <i class="fi fi-rr-users text-primary-400 text-[11px] leading-none shrink-0"></i>
                    <span class="text-[11px] font-bold text-white/60 leading-none">{{ trip.participants.length }} voyageurs</span>
                  </div>
                  <div v-if="trip.budget" class="flex items-center gap-1.5">
                    <i class="fi fi-rr-coins text-primary-400 text-[11px] leading-none shrink-0"></i>
                    <span class="text-[11px] font-bold text-white/60 leading-none">{{ trip.budget.toLocaleString('fr-FR') }} €</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="shrink-0 grid grid-cols-4 divide-x divide-zinc-100 dark:divide-white/5 border-b border-zinc-100 dark:border-white/5">
              <div class="flex flex-col items-center justify-center gap-0.5 py-4 px-2">
                <span class="text-xl font-black text-zinc-900 dark:text-white leading-none">{{ tripDuration ?? '—' }}</span>
                <span class="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5 leading-none">{{ tripDuration === 1 ? 'Jour' : 'Jours' }}</span>
              </div>
              <div class="flex flex-col items-center justify-center gap-0.5 py-4 px-2">
                <span class="text-xl font-black text-zinc-900 dark:text-white leading-none">{{ sortedStops.length }}</span>
                <span class="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5 leading-none">Étapes</span>
              </div>
              <div class="flex flex-col items-center justify-center gap-0.5 py-4 px-2">
                <span class="text-base sm:text-xl font-black text-zinc-900 dark:text-white leading-none whitespace-nowrap">
                  {{ trip.budget ? formatBudget(trip.budget) : '—' }}
                </span>
                <span class="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5 leading-none whitespace-nowrap">
                  {{ budgetPerPerson ? '~' + formatBudget(budgetPerPerson) + '/p.' : 'Budget' }}
                </span>
              </div>
              <div class="flex flex-col items-center justify-center gap-0.5 py-4 px-2">
                <span class="text-xl font-black text-zinc-900 dark:text-white leading-none">{{ trip.participants?.length ?? '—' }}</span>
                <span class="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5 leading-none">Voyageurs</span>
              </div>
            </div>

            <div class="flex-grow overflow-y-auto custom-scrollbar px-6 py-6 space-y-7">

              <div v-if="trip.description">
                <p class="section-label">À propos</p>
                <p class="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{{ trip.description }}</p>
              </div>

              <div v-if="sortedStops.length > 0">
                <p class="section-label">Itinéraire</p>
                <div class="space-y-0">
                  <div
                    v-for="(stop, idx) in sortedStops"
                    :key="stop.id"
                    class="flex items-stretch gap-3 group"
                  >
                    <!-- Connector column: dot + line -->
                    <div class="flex flex-col items-center shrink-0" style="width: 28px;">
                      <div
                        class="timeline-dot w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        :style="{
                          backgroundColor: getStop(stop.type).color + '1a',
                          border: `1.5px solid ${getStop(stop.type).color}45`,
                        }"
                      >
                        <i
                          :class="['fi', getStop(stop.type).icon, 'text-[10px] leading-none']"
                          :style="{ color: getStop(stop.type).color }"
                        ></i>
                      </div>
                      <div
                        v-if="idx < sortedStops.length - 1"
                        class="flex-1 w-px mt-1 bg-zinc-100 dark:bg-white/6 min-h-[10px]"
                      ></div>
                    </div>

                    <div class="flex-1 min-w-0 flex items-start justify-between gap-2 pb-3 pt-0.5">
                      <div class="min-w-0">
                        <p class="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-snug truncate">{{ stop.title }}</p>
                        <p v-if="stop.address" class="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 truncate leading-snug">{{ stop.address }}</p>
                      </div>
                      <span
                        class="shrink-0 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md mt-0.5"
                        :style="{
                          color: getStop(stop.type).color,
                          backgroundColor: getStop(stop.type).color + '18',
                        }"
                      >{{ getStop(stop.type).label }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="trip.participants?.length">
                <p class="section-label">L'équipe</p>
                <div class="flex flex-wrap gap-2">
                  <div
                    v-for="p in trip.participants"
                    :key="p.id"
                    class="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/8"
                  >
                    <div class="w-6 h-6 rounded-full overflow-hidden shrink-0">
                      <img
                        v-if="getAvatarUrl(p.avatar)"
                        :src="getAvatarUrl(p.avatar)!"
                        :alt="p.fullName"
                        class="w-full h-full object-cover"
                      />
                      <div
                        v-else
                        class="w-full h-full bg-primary-400/20 flex items-center justify-center"
                      >
                        <span class="text-[8px] font-black text-primary-600 dark:text-primary-400 leading-none">{{ getInitials(p.fullName) }}</span>
                      </div>
                    </div>
                    <span class="text-xs font-semibold text-zinc-700 dark:text-zinc-300 leading-none">{{ getFirstName(p.fullName) }}</span>
                  </div>
                </div>
              </div>

            </div>

            <div class="shrink-0 px-6 py-4 border-t border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-black/20">
              <p class="text-center text-[10px] font-medium text-zinc-400 dark:text-zinc-500 mb-3 leading-snug">
                Cet itinéraire sera copié dans votre espace — vous pourrez le modifier librement.
              </p>
              <div class="flex items-center gap-3">
                <button
                  @click="close"
                  class="h-11 px-5 rounded-full text-sm font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 transition-all cursor-pointer shrink-0"
                >
                  Fermer
                </button>
                <button
                  @click="duplicateTrip"
                  :disabled="isProcessing"
                  class="flex-1 h-11 rounded-full bg-primary-400 hover:bg-primary-500 text-zinc-950 text-sm font-black transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-400/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span v-if="isProcessing" class="w-4 h-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin"></span>
                  <template v-else>
                    <i class="fi fi-rr-rocket text-sm leading-none shrink-0"></i>
                    <span>Créer mon aventure</span>
                  </template>
                </button>
              </div>
            </div>

          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.slide {
  transition: opacity 0.7s ease;
}
.slide--active {
  opacity: 1;
  z-index: 1;
}
.slide--hidden {
  opacity: 0;
  z-index: 0;
}

.dot-btn {
  border: none;
  padding: 0;
  outline: none;
}

.slide img {
  transition: transform 7s ease;
}
.modal-shell:hover .slide--active img {
  transform: scale(1.05);
}

.group:hover .timeline-dot {
  transform: scale(1.12);
}
.timeline-dot {
  transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
}
</style>
