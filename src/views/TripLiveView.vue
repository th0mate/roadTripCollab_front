<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../services/api';
import { getMe } from '../services/authService';
import { useTripMap } from '../composables/useTripMap';
import TripPhotosModal from '../components/TripPhotosModal.vue';
import TripOnboarding from '../components/TripOnboarding.vue';

const route = useRoute();
const router = useRouter();
const tripId = route.params.id;

const trip = ref<any>(null);
const loading = ref(true);
const currentUser = ref<any>(null);
const daysData = ref<any[]>([]);
const currentTime = ref(new Date());
const showAddExpenseModal = ref(false);
const isSubmittingExpense = ref(false);
const showMobileMap = ref(false);
const showPhotosModal = ref(false);
const selectedStopForPhotos = ref<any>(null);

const openPhotos = (stop: any) => {
  selectedStopForPhotos.value = stop;
  showPhotosModal.value = true;
};

const newExpense = ref({ title: '', amount: 0, category: 'food', paidBy: null as any, description: '' });
const routeSettings = ref({ carConsumption: 7.0, fuelPrice: 1.8 });

let clockInterval: ReturnType<typeof setInterval>;

const { initMap: initTripMap, clearAll, addMarker, drawEncodedRoute, map: tripMap } = useTripMap();

const extractDateLocal = (s?: string) => s ? s.substring(0, 10) : '';
const extractTimeLocal = (s?: string) => {
  if (!s || s.length < 13) return '';
  const p = s.split(/[T ]/);
  return p[1] ? p[1].substring(0, 5) : '';
};

const getStopColor = (t: string): string => ({
  accommodation: '#00F3FF', restaurant: '#FF0055', activity: '#9D00FF', city: '#00FF41', poi: '#FFF000',
} as Record<string, string>)[t] ?? '#ccff00';

const getStopIconClass = (t: string): string => ({
  city: 'fi fi-rr-building', accommodation: 'fi fi-rr-bed', restaurant: 'fi fi-rr-restaurant',
  activity: 'fi fi-rr-ticket', poi: 'fi fi-rr-marker',
} as Record<string, string>)[t] ?? 'fi fi-rr-marker';

const formatStopType = (t: string): string => ({
  city: 'Ville', accommodation: 'Hébergement', restaurant: 'Restaurant', activity: 'Activité', poi: 'Point d\'intérêt',
} as Record<string, string>)[t] ?? t;

const formatTime = (s?: string) => extractTimeLocal(s);
const formatDuration = (min: number) => min < 60 ? `${min} min` : `${Math.floor(min / 60)}h${String(min % 60).padStart(2, '0').replace(/^00$/, '')}`;
const formatDateLong = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
};
const formatDateShort = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
};
const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '';

const todayDateStr = computed(() => new Date().toISOString().substring(0, 10));
const currentTimeFormatted = computed(() => currentTime.value.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));

const currentDayData = computed(() => daysData.value.find(d => d.date === todayDateStr.value) ?? null);
const currentDayIndexVal = computed(() => Math.max(0, daysData.value.findIndex(d => d.date === todayDateStr.value)));

const tripProgress = computed(() => {
  const total = daysData.value.length;
  const day = currentDayIndexVal.value + 1;
  return { day, total, pct: total > 0 ? Math.min(100, (day / total) * 100) : 0 };
});

const todayActivities = computed(() => currentDayData.value?.activities ?? []);


const isCurrentStop = (stop: any): boolean => {
  if (!stop.arrivalDate) return false;
  const arrival = new Date(stop.arrivalDate);
  const now = currentTime.value;
  if (stop.departureDate) return now >= arrival && now <= new Date(stop.departureDate);
  return now >= arrival && now <= new Date(arrival.getTime() + 2 * 3600 * 1000);
};

const isPastStop = (stop: any): boolean => {
  if (!stop.arrivalDate) return false;
  if (stop.departureDate) return currentTime.value > new Date(stop.departureDate);
  return currentTime.value > new Date(new Date(stop.arrivalDate).getTime() + 2 * 3600 * 1000);
};

const currentStop = computed(() => todayActivities.value.find((s: any) => isCurrentStop(s)) ?? null);

const nextStop = computed(() => {
  const now = currentTime.value;
  return todayActivities.value.find((s: any) => {
    if (!s.arrivalDate || s.isReturnStep) return false;
    return new Date(s.arrivalDate) > now && !isCurrentStop(s);
  }) ?? null;
});

const isNextStop = (stop: any): boolean => nextStop.value?.id === stop.id;

const prevStopBeforeNext = computed(() => {
  if (!nextStop.value) return null;
  const idx = todayActivities.value.findIndex((s: any) => s.id === nextStop.value?.id);
  return idx > 0 ? todayActivities.value[idx - 1] : null;
});

const upcomingDays = computed(() => daysData.value.filter(d => d.date > todayDateStr.value));

const budgetStats = computed(() => {
  if (!trip.value) return { total: 0, spent: 0, remaining: 0, percentage: 0 };
  const total = Number(trip.value.budget) || 0;
  const spent = trip.value.expenses?.reduce((s: number, e: any) => s + Number(e.amount), 0) ?? 0;
  return { total, spent, remaining: total - spent, percentage: total > 0 ? Math.min(100, (spent / total) * 100) : 0 };
});

const todayExpenses = computed(() => trip.value?.expenses?.filter((e: any) => e.expenseDate === todayDateStr.value) ?? []);
const todayExpensesTotal = computed(() => todayExpenses.value.reduce((s: number, e: any) => s + Number(e.amount), 0));

const getStopStatusColor = (stop: any): string => {
  if (isCurrentStop(stop)) return getStopColor(stop.type);
  if (isPastStop(stop)) return '#52525b';
  if (isNextStop(stop)) return '#ccff00';
  return '#3f3f46';
};

const getGoogleRoute = (origin: any, destination: any): Promise<any> =>
  new Promise(resolve => {
    if (!(window as any).google?.maps) { resolve(null); return; }
    const cacheKey = `rt_cache_${parseFloat(origin.lat).toFixed(5)},${parseFloat(origin.lng).toFixed(5)}_${parseFloat(destination.lat).toFixed(5)},${parseFloat(destination.lng).toFixed(5)}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const p = JSON.parse(cached);
        if (Date.now() - p.ts < 7 * 86400 * 1000) { resolve(p.data); return; }
      } catch { localStorage.removeItem(cacheKey); }
    }
    new (window as any).google.maps.DirectionsService().route({
      origin: { lat: parseFloat(origin.lat), lng: parseFloat(origin.lng) },
      destination: { lat: parseFloat(destination.lat), lng: parseFloat(destination.lng) },
      travelMode: (window as any).google.maps.TravelMode.DRIVING
    }, (result: any, status: any) => {
      if (status === 'OK' && result.routes[0]) {
        const leg = result.routes[0].legs[0];
        const path: any[] = [];
        leg.steps.forEach((s: any) => { if (s.path) path.push(...s.path); });
        const data = {
          distance: leg.distance.value, duration: leg.duration.value,
          polyline: (window as any).google.maps.geometry.encoding.encodePath(path)
        };
        localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data }));
        resolve(data);
      } else resolve(null);
    });
  });

const calculateItineraryByDay = async () => {
  if (!trip.value) return;
  const start = new Date(trip.value.startDate), end = new Date(trip.value.endDate);
  const days: any[] = [];
  const tripSettings = trip.value.settings || {};
  const sortedAccs = [...trip.value.stops]
    .filter(s => s.type === 'accommodation' && s.arrivalDate)
    .sort((a, b) => (b.arrivalDate || '').localeCompare(a.arrivalDate || ''));

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = extractDateLocal(d.toISOString());
    const arrivals = trip.value.stops.filter((s: any) => s.arrivalDate && extractDateLocal(s.arrivalDate) === dateStr);
    let morningAcc = sortedAccs.find(s => extractDateLocal(s.arrivalDate!) < dateStr && (s.departureDate ? extractDateLocal(s.departureDate) >= dateStr : true));
    if (!morningAcc && dateStr !== extractDateLocal(trip.value.startDate))
      morningAcc = sortedAccs.find(s => extractDateLocal(s.arrivalDate!) < dateStr);
    const eveningAcc = sortedAccs.find(s => extractDateLocal(s.arrivalDate!) <= dateStr && (s.departureDate ? extractDateLocal(s.departureDate) > dateStr : true))
      ?? sortedAccs.find(s => extractDateLocal(s.arrivalDate!) <= dateStr);

    const dayIt: any[] = [];
    if (morningAcc) {
      const t = tripSettings[dateStr]?.startTime || '09:00';
      dayIt.push({ ...morningAcc, id: `start-${morningAcc.id}-${dateStr}`, displayTitle: `Départ : ${morningAcc.title}`, isAccommodationHub: true, isMorningDeparture: true, latitude: parseFloat(morningAcc.latitude), longitude: parseFloat(morningAcc.longitude), arrivalDate: `${dateStr}T${t}:00`, departureDate: `${dateStr}T${t}:00` });
    }
    arrivals.filter((s: any) => s.type !== 'city')
      .sort((a: any, b: any) => (extractTimeLocal(a.arrivalDate) || '00:00').localeCompare(extractTimeLocal(b.arrivalDate) || '00:00') || (a.order - b.order))
      .forEach((a: any) => dayIt.push({ ...a, latitude: parseFloat(a.latitude), longitude: parseFloat(a.longitude) }));
    if (eveningAcc && extractDateLocal(eveningAcc.arrivalDate!) < dateStr)
      dayIt.push({ ...eveningAcc, id: `end-${eveningAcc.id}-${dateStr}`, displayTitle: `${eveningAcc.title} (Retour)`, isAccommodationHub: true, isEveningReturn: true, latitude: parseFloat(eveningAcc.latitude), longitude: parseFloat(eveningAcc.longitude), arrivalDate: null, departureDate: null });
    if (!dayIt.length) {
      const c = trip.value.stops.find((s: any) => s.type === 'city' && s.arrivalDate && extractDateLocal(s.arrivalDate) === dateStr);
      if (c) dayIt.push({ ...c, latitude: parseFloat(c.latitude), longitude: parseFloat(c.longitude) });
    }
    days.push({ date: dateStr, activities: dayIt });
  }

  const today = days.find(d => d.date === todayDateStr.value);
  if (today) {
    const valid = today.activities.filter((a: any) => !isNaN(a.latitude) && !isNaN(a.longitude));
    for (let i = 0; i < valid.length - 1; i++) {
      const rd = await getGoogleRoute({ lat: valid[i].latitude, lng: valid[i].longitude }, { lat: valid[i + 1].latitude, lng: valid[i + 1].longitude });
      if (rd) {
        valid[i].polylineNext = rd.polyline;
        valid[i].distanceToNext = Math.round(rd.distance / 100) / 10;
        valid[i].travelTimeToNext = Math.round(rd.duration / 60);
      }
    }
  }
  daysData.value = days;
};

const refreshMap = () => {
  if (!tripMap.value) return;
  clearAll();
  const today = currentDayData.value;
  if (!today?.activities?.length) return;

  const gBounds = new (window as any).google.maps.LatLngBounds();
  let hasPoints = false;

  today.activities.forEach((act: any, idx: number) => {
    if (!isNaN(act.latitude) && !isNaN(act.longitude)) {
      addMarker(act.latitude, act.longitude, {
        title: act.displayTitle || act.title,
        color: isPastStop(act) ? '#52525b' : getStopColor(act.type),
        label: String(idx + 1),
      });
      gBounds.extend({ lat: act.latitude, lng: act.longitude });
      hasPoints = true;
    }
    if (act.polylineNext) {
      drawEncodedRoute(act.polylineNext, {
        color: isPastStop(act) ? '#52525b' : '#ccff00',
        weight: 5, opacity: isPastStop(act) ? 0.35 : 0.9
      });
    }
  });

  if (hasPoints) tripMap.value.fitBounds(gBounds, { top: 80, bottom: 80, left: 80, right: 80 });
};

const fetchTripData = async () => {
  try {
    const [res, user] = await Promise.all([api.get(`/trips/${tripId}`), getMe().catch(() => null)]);
    trip.value = res.data;
    currentUser.value = user;
    routeSettings.value = { carConsumption: trip.value.carConsumption || 7.0, fuelPrice: trip.value.fuelPrice || 1.8 };
    if (trip.value.status !== 'active') { router.replace(`/trips/${tripId}`); return; }
    await calculateItineraryByDay();
  } catch { router.replace('/my-trips'); }
  finally { loading.value = false; }
};

const openGoogleMaps = (stop: any) => {
  if (!stop?.latitude || !stop?.longitude) return;
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${stop.latitude},${stop.longitude}&travelmode=driving`, '_blank');
};

const addExpense = async () => {
  if (!newExpense.value.title || !newExpense.value.amount) return;
  isSubmittingExpense.value = true;
  try {
    await api.post(`/trips/${tripId}/expenses`, {
      title: newExpense.value.title,
      amount: Number(newExpense.value.amount),
      category: newExpense.value.category,
      paidBy: newExpense.value.paidBy || currentUser.value?.id,
      expenseDate: todayDateStr.value,
      description: newExpense.value.description,
    });
    const res = await api.get(`/trips/${tripId}`);
    trip.value = res.data;
    newExpense.value = { title: '', amount: 0, category: 'food', paidBy: null, description: '' };
    showAddExpenseModal.value = false;
  } catch (e) { console.error(e); }
  finally { isSubmittingExpense.value = false; }
};

onMounted(async () => {
  await fetchTripData();
  if (!trip.value) return;
  await nextTick();
  await new Promise<void>(res => {
    if ((window as any).google?.maps) res();
    else { const iv = setInterval(() => { if ((window as any).google?.maps) { clearInterval(iv); res(); } }, 100); }
  });
  let initial = { lat: 46.6, lng: 1.9 };
  if (trip.value?.stops?.length) {
    const f = trip.value.stops[0];
    initial = { lat: parseFloat(f.latitude), lng: parseFloat(f.longitude) };
  }
  await initTripMap('live-map', initial, { mapTypeId: 'hybrid', tilt: 45, mapTypeControl: false, streetViewControl: false });
  if (tripMap.value) refreshMap();
  clockInterval = setInterval(() => { currentTime.value = new Date(); }, 30000);
});

onUnmounted(() => { clearInterval(clockInterval); clearAll(); });
</script>

<template>
<div>
  <div v-if="loading" class="fixed top-14 left-0 right-0 bottom-0 flex items-center justify-center bg-zinc-50 dark:bg-[#0c0c0e] z-40">
    <div class="flex flex-col items-center gap-5">
      <div class="relative w-16 h-16">
        <div class="absolute inset-0 rounded-full border border-primary-400/15"></div>
        <div class="absolute inset-0 rounded-full border-2 border-t-primary-400 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
        <div class="absolute inset-[4px] rounded-full border border-primary-400/20"></div>
        <div class="absolute inset-[4px] rounded-full border-2 border-t-transparent border-r-primary-400/40 border-b-transparent border-l-transparent animate-spin" style="animation-duration:1.5s;animation-direction:reverse"></div>
        <div class="absolute inset-0 flex items-center justify-center">
          <i class="fi fi-rr-rocket-lunch text-primary-400 text-lg leading-none"></i>
        </div>
      </div>
      <div class="text-center">
        <p class="text-[11px] font-black text-zinc-900 dark:text-white uppercase tracking-[0.3em]">En Route</p>
        <p class="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1.5">Calcul de l'itinéraire...</p>
      </div>
    </div>
  </div>

  <div v-else-if="trip" class="fixed top-14 left-0 right-0 bottom-0 flex flex-col overflow-hidden bg-zinc-100 dark:bg-[#0c0c0e]">

    <header data-onboarding="live-header" class="shrink-0 relative h-[52px] flex items-center gap-3 px-4 bg-white dark:bg-[#111113] border-b border-zinc-200 dark:border-zinc-800/60 z-30">

      <div class="topbar-progress-track">
        <div class="topbar-progress-fill" :style="{ width: `${tripProgress.pct}%` }"></div>
      </div>

      <button @click="router.push(`/trips/${tripId}`)" class="icon-btn cursor-pointer shrink-0" title="Retour au tableau de bord">
        <i class="fi fi-rr-arrow-left text-sm leading-none"></i>
      </button>

      <div class="flex-1 min-w-0">
        <p class="text-[8px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.28em] leading-none mb-0.5">En Route</p>
        <h1 class="font-black text-zinc-900 dark:text-white text-[13px] leading-none truncate">{{ trip.title }}</h1>
      </div>

      <button @click="showMobileMap = !showMobileMap" class="md:hidden icon-btn cursor-pointer shrink-0" :title="showMobileMap ? 'Voir le panneau' : 'Voir la carte'">
        <i :class="showMobileMap ? 'fi fi-rr-list' : 'fi fi-rr-map'" class="text-sm leading-none"></i>
      </button>

      <div class="hidden sm:flex items-center gap-2.5 shrink-0">
        <div class="text-right leading-none">
          <p class="text-[8px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-0.5">Jour</p>
          <p class="text-lg font-black text-zinc-900 dark:text-white tabular-nums leading-none">{{ tripProgress.day }}<span class="text-xs font-semibold text-zinc-400 dark:text-zinc-500">/{{ tripProgress.total }}</span></p>
        </div>
        <div class="live-badge">
          <span class="live-dot"></span>
          <span>Live</span>
        </div>
      </div>
      <div class="sm:hidden live-badge-sm">
        <span class="live-dot"></span>
        <span>J{{ tripProgress.day }}</span>
      </div>
    </header>

    <div class="flex-1 flex overflow-hidden">

      <div class="w-full md:w-[388px] lg:w-[416px] shrink-0 flex flex-col z-20 p-3"
        :class="showMobileMap ? 'hidden md:flex' : 'flex'">
        <div class="flex-1 flex flex-col bg-white dark:bg-[#111113] rounded-3xl border border-zinc-200 dark:border-zinc-800/50 shadow-[0_2px_20px_rgba(0,0,0,0.07)] dark:shadow-[0_2px_20px_rgba(0,0,0,0.35)] overflow-hidden min-h-0">

        <div class="flex-1 overflow-y-auto no-scrollbar divide-y divide-zinc-100 dark:divide-zinc-800/50">

          <div class="px-4 py-3 flex items-center gap-3 card-enter" style="animation-delay:0ms">
            <div class="flex-1 min-w-0">
              <p class="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 capitalize leading-tight truncate">{{ formatDateLong(todayDateStr) }}</p>
              <div class="flex items-center gap-2 mt-1.5">
                <div class="flex-1 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div class="trip-progress-bar h-full rounded-full" :style="{ width: `${tripProgress.pct}%` }"></div>
                </div>
                <span class="text-[9px] font-black text-zinc-400 dark:text-zinc-500 tabular-nums shrink-0">{{ formatDate(trip.startDate) }} → {{ formatDate(trip.endDate) }}</span>
              </div>
            </div>
            <div class="shrink-0 text-center">
              <p class="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none mb-0.5">Jour</p>
              <p class="text-xl font-black text-zinc-900 dark:text-white leading-none tabular-nums">{{ tripProgress.day }}<span class="text-sm font-medium text-zinc-400 dark:text-zinc-500">/{{ tripProgress.total }}</span></p>
            </div>
          </div>

          <Transition name="pop">
            <div v-if="currentStop"
              data-onboarding="live-current-stop"
              class="hero-section card-enter"
              :style="{ '--sc': getStopColor(currentStop.type), animationDelay: '50ms' }">
              <div class="hero-left-strip"></div>
              <div class="hero-ambient-glow"></div>
              <div class="relative z-10 pl-6 pr-4 py-4">
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full animate-pulse shrink-0" :style="{ background: 'var(--sc)' }"></span>
                    <span class="text-[9px] font-black uppercase tracking-[0.28em] text-zinc-500 dark:text-zinc-400">En ce moment</span>
                  </div>
                  <button v-if="!currentStop.isAccommodationHub" @click="openPhotos(currentStop)"
                    class="photos-btn cursor-pointer"
                    :style="{ color: 'var(--sc)', background: 'color-mix(in srgb, var(--sc) 12%, transparent)' }">
                    <i class="fi fi-rr-camera text-[10px] leading-none"></i>
                    <span>Photos</span>
                  </button>
                </div>
                <div class="flex items-center gap-3">
                  <div class="stop-icon-lg shrink-0" :style="{ background: 'color-mix(in srgb, var(--sc) 14%, transparent)' }">
                    <i :class="getStopIconClass(currentStop.type)" class="text-[22px] leading-none" :style="{ color: 'var(--sc)' }"></i>
                  </div>
                  <div class="min-w-0">
                    <h2 class="font-black text-zinc-900 dark:text-white text-[16px] leading-snug truncate">{{ currentStop.displayTitle || currentStop.title }}</h2>
                    <div class="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span class="text-[10px] font-bold" :style="{ color: 'var(--sc)' }">{{ formatStopType(currentStop.type) }}</span>
                      <template v-if="currentStop.arrivalDate">
                        <span class="text-zinc-300 dark:text-zinc-700 text-xs leading-none">·</span>
                        <span class="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 tabular-nums">{{ formatTime(currentStop.arrivalDate) }}{{ currentStop.departureDate ? ` — ${formatTime(currentStop.departureDate)}` : '' }}</span>
                      </template>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Transition>

          <div v-if="nextStop" class="px-4 py-4 card-enter" style="animation-delay:100ms">
            <p class="section-label mb-3">Prochain arrêt</p>
            <div class="flex items-start gap-3 mb-3.5">
              <div class="stop-icon-md shrink-0 mt-0.5" :style="{ background: `${getStopColor(nextStop.type)}12` }">
                <i :class="getStopIconClass(nextStop.type)" class="text-base leading-none" :style="{ color: getStopColor(nextStop.type) }"></i>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2">
                  <h3 class="font-bold text-zinc-900 dark:text-white text-[14px] leading-snug truncate">{{ nextStop.displayTitle || nextStop.title }}</h3>
                  <span v-if="nextStop.arrivalDate" class="text-[11px] font-black text-zinc-500 dark:text-zinc-400 tabular-nums shrink-0 mt-px">{{ formatTime(nextStop.arrivalDate) }}</span>
                </div>
                <div class="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span class="type-tag" :style="{ color: getStopColor(nextStop.type), background: `${getStopColor(nextStop.type)}12` }">{{ formatStopType(nextStop.type) }}</span>
                  <template v-if="prevStopBeforeNext?.distanceToNext">
                    <span class="text-zinc-300 dark:text-zinc-700 text-xs">·</span>
                    <span class="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium tabular-nums">{{ prevStopBeforeNext.distanceToNext }} km · {{ formatDuration(prevStopBeforeNext.travelTimeToNext) }}</span>
                  </template>
                </div>
              </div>
            </div>
            <button @click="openGoogleMaps(nextStop)" class="nav-btn w-full cursor-pointer">
              <i class="fi fi-rr-navigation text-sm leading-none"></i>
              <span>Naviguer</span>
            </button>
          </div>

          <div v-else-if="!currentStop" class="px-4 py-8 text-center card-enter" style="animation-delay:100ms">
            <div class="w-11 h-11 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 flex items-center justify-center mx-auto mb-3">
              <i class="fi fi-rr-road text-zinc-400 dark:text-zinc-500 text-lg leading-none"></i>
            </div>
            <p class="font-bold text-zinc-700 dark:text-zinc-300 text-sm">Aucune activité planifiée</p>
            <p class="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">Profitez de la route !</p>
          </div>

          <div v-if="todayActivities.length > 0" data-onboarding="live-timeline" class="card-enter" style="animation-delay:150ms">
            <div class="px-4 pt-4 pb-1.5">
              <p class="section-label">Itinéraire du jour</p>
            </div>
            <div class="relative pb-1">
              <div class="timeline-rail"></div>
              <div v-for="(stop, idx) in todayActivities" :key="stop.id">
                <div class="timeline-row group"
                  :class="[
                    isPastStop(stop) ? 'opacity-40' : '',
                    isCurrentStop(stop) ? 'is-current' : ''
                  ]">
                  <div class="timeline-node"
                    :class="isPastStop(stop) ? 'node-done' : isCurrentStop(stop) ? 'node-active' : isNextStop(stop) ? 'node-next' : 'node-idle'"
                    :style="isCurrentStop(stop) ? { '--nc': getStopColor(stop.type) } : {}">
                    <i v-if="isPastStop(stop)" class="fi fi-rr-check text-[5px] text-white leading-none"></i>
                    <span v-else-if="isCurrentStop(stop)" class="node-pulse" :style="{ background: getStopColor(stop.type) }"></span>
                  </div>
                  <div class="flex-1 min-w-0 py-3 pr-4">
                    <div class="flex items-center gap-2">
                      <i :class="getStopIconClass(stop.type)" class="text-[10px] shrink-0 leading-none"
                        :style="{ color: isPastStop(stop) ? '#a1a1aa' : getStopColor(stop.type) }"></i>
                      <span class="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 truncate flex-1 leading-tight">{{ stop.displayTitle || stop.title }}</span>
                      <button v-if="!stop.isAccommodationHub" @click.stop="openPhotos(stop)"
                        class="photo-row-btn cursor-pointer sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                        title="Voir / ajouter des photos">
                        <i class="fi fi-rr-camera text-[9px] leading-none"></i>
                      </button>
                      <span v-if="stop.arrivalDate" class="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 tabular-nums shrink-0">{{ formatTime(stop.arrivalDate) }}</span>
                    </div>
                    <div class="flex items-center gap-2 mt-1 flex-wrap">
                      <span v-if="isCurrentStop(stop)" class="status-pill" :style="{ color: getStopColor(stop.type), background: `${getStopColor(stop.type)}14` }">
                        <span class="w-1 h-1 rounded-full animate-pulse inline-block shrink-0" :style="{ background: getStopColor(stop.type) }"></span>
                        En cours
                      </span>
                      <span v-else-if="isNextStop(stop)" class="status-pill text-primary-600 dark:text-primary-400 bg-primary-400/10">
                        Prochain
                      </span>
                      <span v-if="stop.distanceToNext && !stop.isReturnStep" class="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                        {{ stop.distanceToNext }} km · {{ formatDuration(stop.travelTimeToNext) }}
                      </span>
                    </div>
                  </div>
                </div>
                <div v-if="(idx as number) < todayActivities.length - 1" class="ml-12 mr-4 h-px bg-zinc-100 dark:bg-zinc-800/50"></div>
              </div>
            </div>
          </div>

          <div data-onboarding="live-budget" class="px-4 py-4 card-enter" style="animation-delay:200ms">
            <div class="flex items-center justify-between mb-3.5">
              <p class="section-label">Budget</p>
              <button @click="router.push(`/trips/${tripId}`)" class="text-[10px] font-black text-primary-500 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 transition-colors cursor-pointer">
                Voir détails →
              </button>
            </div>
            <div class="grid grid-cols-3 gap-2 mb-3">
              <div class="stat-cell">
                <span class="stat-val">{{ Math.round(budgetStats.total) }}€</span>
                <span class="stat-lbl">Total</span>
              </div>
              <div class="stat-cell">
                <span class="stat-val">{{ Math.round(budgetStats.spent) }}€</span>
                <span class="stat-lbl">Dépensé</span>
              </div>
              <div class="stat-cell">
                <span class="stat-val" :class="budgetStats.remaining >= 0 ? 'text-primary-500 dark:text-primary-400' : 'text-rose-500'">
                  {{ budgetStats.remaining >= 0 ? '' : '-' }}{{ Math.round(Math.abs(budgetStats.remaining)) }}€
                </span>
                <span class="stat-lbl">{{ budgetStats.remaining >= 0 ? 'Restant' : 'Dépassé' }}</span>
              </div>
            </div>
            <div class="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div class="h-full rounded-full transition-all duration-700"
                :class="budgetStats.percentage > 90 ? 'bg-rose-500' : budgetStats.percentage > 70 ? 'bg-amber-500' : 'budget-fill'"
                :style="{ width: `${budgetStats.percentage}%` }"></div>
            </div>
            <div v-if="todayExpenses.length > 0" class="flex items-center justify-between mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/50">
              <span class="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">Dépenses aujourd'hui</span>
              <span class="text-[11px] font-black text-zinc-800 dark:text-zinc-200 tabular-nums">{{ todayExpensesTotal.toFixed(2) }}€</span>
            </div>
          </div>

          <div v-if="upcomingDays.length > 0" class="px-4 py-4 card-enter" style="animation-delay:250ms">
            <p class="section-label mb-3">Prochains jours</p>
            <div class="space-y-0.5">
              <div v-for="(day, i) in upcomingDays.slice(0, 5)" :key="day.date" class="upcoming-row">
                <div class="upcoming-date shrink-0">
                  <span class="text-[14px] font-black text-zinc-800 dark:text-zinc-100 leading-none tabular-nums">{{ new Date(day.date + 'T12:00:00').getDate() }}</span>
                  <span class="text-[8px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider leading-none">{{ new Date(day.date + 'T12:00:00').toLocaleDateString('fr-FR', { month: 'short' }) }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-[12px] font-bold text-zinc-800 dark:text-zinc-200 leading-tight truncate">
                    {{ day.activities.filter((a: any) => !a.isAccommodationHub).map((a: any) => a.title).slice(0, 2).join(', ') || formatDateShort(day.date) }}
                  </p>
                  <p class="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                    {{ day.activities.filter((a: any) => !a.isAccommodationHub).length }} étape{{ day.activities.filter((a: any) => !a.isAccommodationHub).length > 1 ? 's' : '' }}
                  </p>
                </div>
                <i class="fi fi-rr-angle-right text-[10px] text-zinc-300 dark:text-zinc-600 shrink-0 leading-none"></i>
              </div>
            </div>
          </div>

          <div class="h-2"></div>
        </div>

        <div class="shrink-0 grid grid-cols-2 gap-2 p-3 border-t border-zinc-200 dark:border-zinc-800/50">
          <button
            @click="currentStop && !currentStop.isAccommodationHub ? openPhotos(currentStop) : null"
            :disabled="!currentStop || currentStop.isAccommodationHub"
            class="action-btn action-btn-secondary cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">
            <i class="fi fi-rr-camera text-sm leading-none"></i>
            <span>Photos</span>
          </button>
          <button @click="showAddExpenseModal = true" class="action-btn action-btn-primary cursor-pointer">
            <i class="fi fi-rr-coins text-sm leading-none"></i>
            <span>Dépense</span>
          </button>
        </div>
        </div>
      </div>

      <div data-onboarding="live-map" class="flex-1 relative p-3" :class="showMobileMap ? 'flex' : 'hidden md:flex'">
        <div class="absolute inset-3 rounded-3xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div id="live-map" class="w-full h-full"></div>
        </div>

        <div class="absolute inset-3 pointer-events-none rounded-3xl overflow-hidden">
          <div class="absolute top-4 left-4 pointer-events-auto">
            <div class="map-chip gap-2">
              <span class="w-1.5 h-1.5 bg-primary-400 rounded-full animate-pulse shrink-0"></span>
              <span class="text-[13px] font-black text-zinc-900 dark:text-white tabular-nums">{{ currentTimeFormatted }}</span>
            </div>
          </div>

          <Transition name="float-up">
            <div v-if="nextStop" class="absolute bottom-6 left-4 right-4 pointer-events-auto md:left-auto md:right-5 md:w-[270px]">
              <div class="map-float-card">
                <div class="flex items-center gap-2 mb-2.5">
                  <span class="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.22em]">Prochain arrêt</span>
                  <div class="flex-1 h-px bg-zinc-200 dark:bg-zinc-700/60"></div>
                </div>
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" :style="{ background: `${getStopColor(nextStop.type)}14` }">
                    <i :class="getStopIconClass(nextStop.type)" class="text-base leading-none" :style="{ color: getStopColor(nextStop.type) }"></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-bold text-zinc-900 dark:text-white text-[13px] truncate leading-tight">{{ nextStop.displayTitle || nextStop.title }}</p>
                    <p v-if="prevStopBeforeNext?.distanceToNext" class="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 tabular-nums">
                      {{ prevStopBeforeNext.distanceToNext }} km · {{ formatDuration(prevStopBeforeNext.travelTimeToNext) }}
                    </p>
                  </div>
                  <button @click="openGoogleMaps(nextStop)" class="map-nav-btn cursor-pointer shrink-0">
                    <i class="fi fi-rr-navigation text-zinc-950 text-[13px] leading-none"></i>
                  </button>
                </div>
              </div>
            </div>
          </Transition>

          <div v-if="!loading && todayActivities.length === 0" class="absolute inset-0 flex items-center justify-center">
            <div class="map-chip flex-col gap-2 !py-5 !px-6 pointer-events-auto text-center">
              <i class="fi fi-rr-road text-2xl text-zinc-400"></i>
              <div>
                <p class="font-bold text-zinc-700 dark:text-zinc-300 text-sm">Jour libre</p>
                <p class="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">Aucune activité aujourd'hui</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <TripPhotosModal
      v-if="showPhotosModal && selectedStopForPhotos"
      :stop="selectedStopForPhotos"
      @close="showPhotosModal = false"
    />
  </Teleport>

  <TripOnboarding view="live" />

  <Teleport to="body">
    <Transition name="modal-slide">
      <div v-if="showAddExpenseModal" class="fixed top-14 left-0 right-0 bottom-0 z-50 flex items-end sm:items-center justify-center">
        <div class="absolute inset-0 bg-zinc-950/50 backdrop-blur-[6px]" @click="showAddExpenseModal = false"></div>
        <div class="modal-sheet">
          <div class="w-8 h-1 bg-zinc-300 dark:bg-zinc-600 rounded-full mx-auto mb-5 sm:hidden"></div>
          <div class="flex items-start justify-between mb-6">
            <div>
              <p class="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.22em] mb-1">Saisie rapide · {{ currentTimeFormatted }}</p>
              <h3 class="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Nouvelle dépense</h3>
            </div>
            <button @click="showAddExpenseModal = false" class="icon-btn cursor-pointer shrink-0">
              <i class="fi fi-rr-cross text-xs leading-none"></i>
            </button>
          </div>
          <form @submit.prevent="addExpense" class="space-y-4">
            <div class="modal-field">
              <label class="modal-label">Description</label>
              <input v-model="newExpense.title" type="text" placeholder="Ex : Déjeuner à Lyon" class="modal-input" required />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="modal-field">
                <label class="modal-label">Montant</label>
                <div class="relative">
                  <input v-model="newExpense.amount" type="number" step="0.01" min="0" placeholder="0.00" class="modal-input !pr-8" required />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-black text-zinc-400">€</span>
                </div>
              </div>
              <div class="modal-field">
                <label class="modal-label">Catégorie</label>
                <select v-model="newExpense.category" class="modal-input">
                  <option value="food">🍽️ Repas</option>
                  <option value="transport">✈️ Transport</option>
                  <option value="fuel">⛽ Carburant</option>
                  <option value="accommodation">🏨 Hébergement</option>
                  <option value="activity">🎡 Activité</option>
                  <option value="tolls">🛣️ Péages</option>
                  <option value="other">📦 Autre</option>
                </select>
              </div>
            </div>
            <div v-if="trip?.participants?.length > 1" class="modal-field">
              <label class="modal-label">Payé par</label>
              <select v-model="newExpense.paidBy" class="modal-input">
                <option :value="null">— Sélectionner —</option>
                <option v-for="p in trip.participants" :key="p.id" :value="p.id">{{ p.fullName }}</option>
              </select>
            </div>
            <div class="flex gap-2.5 pt-2">
              <button type="button" @click="showAddExpenseModal = false" class="modal-cancel-btn flex-1 cursor-pointer">Annuler</button>
              <button type="submit" :disabled="isSubmittingExpense" class="modal-submit-btn flex-1 cursor-pointer">
                <span v-if="isSubmittingExpense" class="spinner w-4 h-4"></span>
                <template v-else><i class="fi fi-rr-check text-sm"></i> Enregistrer</template>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</div>
</template>

<style scoped>
@reference "../index.css";

@keyframes cardEnter {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.card-enter {
  opacity: 0;
  animation: cardEnter 0.42s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.topbar-progress-track {
  @apply absolute bottom-0 left-0 w-full h-[2px] pointer-events-none overflow-hidden;
  background: transparent;
}
.topbar-progress-fill {
  @apply h-full transition-all duration-1000;
  background: var(--brand-primary);
  box-shadow: 0 0 8px color-mix(in srgb, var(--brand-primary) 60%, transparent);
}

.icon-btn {
  @apply w-8 h-8 rounded-xl flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all active:scale-90;
}

.live-badge {
  @apply flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-primary-400/10 dark:bg-primary-400/[0.12] border border-primary-400/20 text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-wider;
}
.live-badge-sm {
  @apply flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-primary-400/10 dark:bg-primary-400/[0.12] border border-primary-400/20 text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-wider;
}
.live-dot { @apply w-1.5 h-1.5 bg-primary-400 rounded-full animate-pulse shrink-0; }

/* ── Labels de section ───────────────────────── */
.section-label {
  @apply text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.22em];
}

.trip-progress-bar {
  background: var(--brand-primary);
  box-shadow: 0 0 6px color-mix(in srgb, var(--brand-primary) 50%, transparent);
  transition: width 1.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.hero-section {
  @apply relative overflow-hidden;
  background: color-mix(in srgb, var(--sc) 5%, white);
}
.dark .hero-section {
  background: color-mix(in srgb, var(--sc) 7%, #111113);
}
.hero-left-strip {
  @apply absolute left-0 top-0 bottom-0 w-[3px] z-10 pointer-events-none;
  background: var(--sc);
}
.hero-ambient-glow {
  @apply absolute -top-8 -right-8 w-28 h-28 rounded-full pointer-events-none;
  background: color-mix(in srgb, var(--sc) 18%, transparent);
  filter: blur(36px);
}

.photos-btn {
  @apply flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:opacity-80 active:scale-95;
}

.stop-icon-lg {
  @apply w-12 h-12 rounded-2xl flex items-center justify-center;
}
.stop-icon-md {
  @apply w-10 h-10 rounded-xl flex items-center justify-center;
}

.type-tag {
  @apply inline-flex items-center px-2 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider;
}

.nav-btn {
  @apply flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-[0.97] text-zinc-950;
  background: var(--brand-primary);
  box-shadow: 0 4px 16px color-mix(in srgb, var(--brand-primary) 28%, transparent);
}
.nav-btn:hover { filter: brightness(1.07); }

.timeline-rail {
  @apply absolute top-0 bottom-0 w-px pointer-events-none;
  left: 1.625rem;
  background: linear-gradient(to bottom, transparent 0%, #e4e4e7 8%, #e4e4e7 92%, transparent);
}
.dark .timeline-rail {
  background: linear-gradient(to bottom, transparent 0%, #3f3f46 8%, #27272a 92%, transparent);
}

.timeline-row {
  @apply relative flex items-start pl-4 gap-3 transition-colors duration-150 hover:bg-zinc-50 dark:hover:bg-zinc-800/25;
}
.timeline-row.is-current {
  @apply bg-primary-400/[0.04] dark:bg-primary-400/[0.07] hover:bg-primary-400/[0.05] dark:hover:bg-primary-400/[0.09];
}

.timeline-node {
  @apply w-5 h-5 rounded-full border-2 border-white dark:border-[#111113] mt-[14px] z-10 shrink-0 flex items-center justify-center transition-all duration-300;
}
.node-done  { @apply bg-zinc-300 dark:bg-zinc-600; }
.node-idle  { @apply bg-zinc-200 dark:bg-zinc-700; }
.node-next  {
  background: var(--brand-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand-primary) 20%, transparent);
}
.node-active {
  background: var(--nc, #ccff00);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--nc, #ccff00) 22%, transparent);
}
.node-pulse { @apply w-2 h-2 rounded-full animate-pulse inline-block; }

.status-pill {
  @apply inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-xl;
}

.photo-row-btn {
  @apply w-6 h-6 rounded-xl flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-violet-500 dark:hover:text-violet-400 hover:bg-violet-500/10 transition-all shrink-0;
}

.stat-cell {
  @apply flex flex-col items-center gap-0.5 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50;
}
.stat-val { @apply text-[15px] font-black text-zinc-900 dark:text-white leading-tight tabular-nums; }
.stat-lbl { @apply text-[8px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider; }
.budget-fill {
  background: var(--brand-primary);
  box-shadow: 0 0 5px color-mix(in srgb, var(--brand-primary) 40%, transparent);
}

.upcoming-row {
  @apply flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors;
}
.upcoming-date {
  @apply w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 flex flex-col items-center justify-center gap-0.5 shrink-0 border border-zinc-200 dark:border-zinc-700/50;
}

.action-btn {
  @apply flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all active:scale-[0.97];
}
.action-btn-primary {
  @apply text-zinc-950;
  background: var(--brand-primary);
  box-shadow: 0 4px 14px color-mix(in srgb, var(--brand-primary) 28%, transparent);
}
.action-btn-primary:hover { filter: brightness(1.07); }
.action-btn-secondary {
  @apply bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60 hover:bg-zinc-200 dark:hover:bg-zinc-700/60;
}

.map-chip {
  @apply flex items-center bg-white/95 dark:bg-[#1a1a1c]/95 backdrop-blur-xl rounded-2xl px-4 py-2.5 border border-zinc-200/60 dark:border-zinc-700/50 shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)];
}
.map-float-card {
  @apply bg-white/96 dark:bg-[#1a1a1c]/96 backdrop-blur-2xl rounded-3xl border border-zinc-200/60 dark:border-zinc-700/50 shadow-[0_8px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.5)] p-4;
}
.map-nav-btn {
  @apply w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90;
  background: var(--brand-primary);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--brand-primary) 36%, transparent);
}
.map-nav-btn:hover { filter: brightness(1.08); }

.modal-sheet {
  @apply relative w-full sm:max-w-[440px] bg-white dark:bg-[#1a1a1c] rounded-t-[2rem] sm:rounded-[2rem] border border-zinc-200/60 dark:border-zinc-700/50 shadow-[0_-12px_60px_rgba(0,0,0,0.1)] dark:shadow-[0_-12px_60px_rgba(0,0,0,0.6)] p-6 sm:p-8 z-10;
}
.modal-field { @apply flex flex-col gap-1.5; }
.modal-label { @apply text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider; }
.modal-input {
  @apply w-full rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 px-4 py-3 text-zinc-900 dark:text-white text-sm font-semibold placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 dark:focus:border-primary-400 focus:bg-white dark:focus:bg-zinc-800/80 transition-all duration-200;
}
.modal-cancel-btn {
  @apply flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/50 hover:bg-zinc-200 dark:hover:bg-zinc-700/60 transition-all active:scale-[0.98];
}
.modal-submit-btn {
  @apply flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm text-zinc-950 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed;
  background: var(--brand-primary);
  box-shadow: 0 4px 18px color-mix(in srgb, var(--brand-primary) 30%, transparent);
}
.modal-submit-btn:hover:not(:disabled) { filter: brightness(1.07); }

.pop-enter-active { transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
.pop-leave-active { transition: all 0.2s ease; }
.pop-enter-from  { opacity: 0; transform: scale(0.97) translateY(-4px); }
.pop-leave-to    { opacity: 0; transform: scale(0.98); }

.float-up-enter-active { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.float-up-leave-active { transition: all 0.25s ease; }
.float-up-enter-from   { opacity: 0; transform: translateY(16px); }
.float-up-leave-to     { opacity: 0; transform: translateY(8px); }

.modal-slide-enter-active { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.modal-slide-leave-active { transition: all 0.25s ease; }
.modal-slide-enter-from .modal-sheet { transform: translateY(100%); opacity: 0; }
.modal-slide-leave-to .modal-sheet   { transform: translateY(40px); opacity: 0; }
.modal-slide-enter-from > div:first-child { opacity: 0; }
.modal-slide-leave-to > div:first-child   { opacity: 0; }
</style>
