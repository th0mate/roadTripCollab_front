<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../services/api';
import { getMe } from '../services/authService';
import { useTripMap } from '../composables/useTripMap';

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
  <!-- Loading -->
  <div v-if="loading" class="fixed top-14 left-0 right-0 bottom-0 flex items-center justify-center bg-zinc-50 dark:bg-[#0c0c0e] z-40">
    <div class="flex flex-col items-center gap-6">
      <div class="relative w-20 h-20">
        <div class="absolute inset-0 rounded-full border border-primary-400/10"></div>
        <div class="absolute inset-0 rounded-full border-2 border-t-primary-400 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
        <div class="absolute inset-[5px] rounded-full border border-primary-400/20"></div>
        <div class="absolute inset-[5px] rounded-full border-2 border-t-transparent border-r-primary-400/40 border-b-transparent border-l-transparent animate-spin" style="animation-duration:1.5s;animation-direction:reverse"></div>
        <div class="absolute inset-0 flex items-center justify-center">
          <i class="fi fi-rr-rocket-lunch text-primary-400 text-xl"></i>
        </div>
      </div>
      <div class="text-center">
        <p class="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-[0.25em]">Mode En Route</p>
        <p class="text-[10px] text-zinc-400 mt-1 font-medium">Calcul de l'itinéraire...</p>
      </div>
    </div>
  </div>

  <!-- Main layout -->
  <div v-else-if="trip" class="fixed top-14 left-0 right-0 bottom-0 flex flex-col bg-zinc-100 dark:bg-[#0c0c0e] overflow-hidden">

    <!-- ═══ SUB TOPBAR ═══ -->
    <div class="shrink-0 h-[52px] flex items-center gap-3 px-4 bg-white dark:bg-[#111113] border-b border-zinc-200 dark:border-zinc-800/60 shadow-sm dark:shadow-none z-30">
      <button @click="router.push(`/trips/${tripId}`)" class="live-icon-btn group shrink-0 cursor-pointer">
        <i class="fi fi-rr-arrow-left text-sm text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors"></i>
      </button>

      <div class="flex-1 min-w-0">
        <p class="text-[9px] font-black text-zinc-400 uppercase tracking-[0.22em] leading-none">En Route</p>
        <h1 class="font-black text-zinc-900 dark:text-white text-sm leading-snug truncate">{{ trip.title }}</h1>
      </div>

      <button @click="showMobileMap = !showMobileMap" class="md:hidden live-icon-btn group shrink-0 cursor-pointer">
        <i :class="showMobileMap ? 'fi fi-rr-list' : 'fi fi-rr-map'" class="text-sm text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors"></i>
      </button>

      <div class="hidden sm:flex items-center gap-3 shrink-0">
        <div class="text-right leading-none">
          <p class="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Jour</p>
          <p class="text-xl font-black text-zinc-900 dark:text-white leading-tight mt-px">{{ tripProgress.day }}<span class="text-sm font-medium text-zinc-400"> / {{ tripProgress.total }}</span></p>
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
    </div>

    <!-- ═══ CONTENT ═══ -->
    <div class="flex-1 flex overflow-hidden">

      <!-- ─── LEFT PANEL ─── -->
      <div class="w-full md:w-[376px] lg:w-[408px] shrink-0 flex flex-col bg-zinc-100 dark:bg-[#0c0c0e] border-r border-zinc-200 dark:border-zinc-800/50 z-20 overflow-hidden"
        :class="showMobileMap ? 'hidden md:flex' : 'flex'">
        <div class="flex-1 overflow-y-auto no-scrollbar">
          <div class="p-3 sm:p-4 space-y-3">

            <!-- ① DATE + PROGRESS -->
            <div class="live-card card-enter" style="animation-delay:0ms">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-xl bg-primary-400/10 dark:bg-primary-400/10 flex items-center justify-center shrink-0">
                    <i class="fi fi-rr-calendar text-primary-400 text-sm"></i>
                  </div>
                  <span class="text-sm font-black text-zinc-900 dark:text-white capitalize">{{ formatDateLong(todayDateStr) }}</span>
                </div>
                <span class="text-xs font-black text-primary-400 tabular-nums">{{ Math.round(tripProgress.pct) }}%</span>
              </div>
              <div class="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div class="progress-bar h-full rounded-full" :style="{ width: `${tripProgress.pct}%` }"></div>
              </div>
              <div class="flex justify-between mt-2">
                <span class="text-[10px] text-zinc-400 font-semibold">{{ formatDate(trip.startDate) }}</span>
                <span class="text-[10px] text-zinc-400 font-semibold">{{ formatDate(trip.endDate) }}</span>
              </div>
            </div>

            <!-- ② EN CE MOMENT -->
            <Transition name="pop">
              <div v-if="currentStop" class="current-stop-card card-enter" :style="{ '--stop-color': getStopColor(currentStop.type), animationDelay: '60ms' }">
                <div class="current-stop-glow"></div>
                <div class="relative z-10">
                  <div class="flex items-center gap-2 mb-3">
                    <span class="current-stop-pulse" :style="{ background: getStopColor(currentStop.type) }"></span>
                    <span class="text-[9px] font-black uppercase tracking-[0.22em]" :style="{ color: getStopColor(currentStop.type) }">En ce moment</span>
                  </div>
                  <div class="flex items-center gap-3">
                    <div class="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" :style="{ background: `${getStopColor(currentStop.type)}22` }">
                      <i :class="getStopIconClass(currentStop.type)" class="text-lg" :style="{ color: getStopColor(currentStop.type) }"></i>
                    </div>
                    <div class="min-w-0">
                      <h3 class="font-black text-zinc-900 dark:text-white text-base leading-tight truncate">{{ currentStop.displayTitle || currentStop.title }}</h3>
                      <p class="text-[10px] font-bold mt-0.5" :style="{ color: getStopColor(currentStop.type) }">{{ formatStopType(currentStop.type) }}</p>
                      <p v-if="currentStop.arrivalDate" class="text-[10px] text-zinc-400 font-medium mt-1">
                        {{ formatTime(currentStop.arrivalDate) }}{{ currentStop.departureDate ? ` — ${formatTime(currentStop.departureDate)}` : '' }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Transition>

            <!-- ③ PROCHAIN ARRÊT -->
            <div v-if="nextStop" class="live-card card-enter overflow-hidden" style="animation-delay:120ms">
              <div class="flex items-center justify-between mb-3">
                <span class="live-section-label">Prochain arrêt</span>
                <span v-if="nextStop.arrivalDate" class="text-[10px] font-black text-zinc-500 dark:text-zinc-400 tabular-nums">{{ formatTime(nextStop.arrivalDate) }}</span>
              </div>
              <div class="flex items-center gap-3 mb-4">
                <div class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 next-stop-icon" :style="{ '--stop-color': getStopColor(nextStop.type) }">
                  <i :class="getStopIconClass(nextStop.type)" class="text-xl" :style="{ color: getStopColor(nextStop.type) }"></i>
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="font-black text-zinc-900 dark:text-white text-[15px] leading-tight truncate">{{ nextStop.displayTitle || nextStop.title }}</h3>
                  <p class="text-[10px] font-semibold text-zinc-400 mt-0.5">{{ formatStopType(nextStop.type) }}</p>
                  <div v-if="prevStopBeforeNext?.distanceToNext" class="flex items-center gap-3 mt-1.5">
                    <span class="route-chip"><i class="fi fi-rr-route text-[9px]"></i>{{ prevStopBeforeNext.distanceToNext }} km</span>
                    <span class="route-chip"><i class="fi fi-rr-clock text-[9px]"></i>{{ formatDuration(prevStopBeforeNext.travelTimeToNext) }}</span>
                  </div>
                </div>
              </div>
              <button @click="openGoogleMaps(nextStop)" class="navigate-btn w-full cursor-pointer">
                <i class="fi fi-rr-navigation text-sm"></i>
                Naviguer
              </button>
            </div>

            <!-- Aucune activité -->
            <div v-else-if="!currentStop" class="live-card card-enter text-center py-8" style="animation-delay:120ms">
              <div class="w-14 h-14 rounded-3xl bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center mx-auto mb-3">
                <i class="fi fi-rr-road text-zinc-400 dark:text-zinc-500 text-2xl"></i>
              </div>
              <p class="font-black text-zinc-700 dark:text-zinc-300 text-sm">Aucune activité planifiée</p>
              <p class="text-[11px] text-zinc-400 mt-1">Profitez de la route !</p>
            </div>

            <!-- ④ TIMELINE DU JOUR -->
            <div v-if="todayActivities.length > 0" class="card-enter" style="animation-delay:180ms">
              <p class="live-section-label px-1 mb-2">Itinéraire du jour</p>
              <div class="live-card !p-0 overflow-hidden">
                <div class="timeline-line"></div>
                <div v-for="(stop, idx) in todayActivities" :key="stop.id">
                  <div class="relative flex items-start gap-3 px-4 py-3 transition-colors duration-200"
                    :class="[
                      isPastStop(stop) ? 'opacity-40' : '',
                      isCurrentStop(stop) ? 'bg-primary-400/[0.04] dark:bg-primary-400/[0.06]' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/30'
                    ]">
                    <!-- dot -->
                    <div class="timeline-dot shrink-0"
                      :class="isPastStop(stop) ? 'timeline-dot-past' : isCurrentStop(stop) ? 'timeline-dot-active' : isNextStop(stop) ? 'timeline-dot-next' : 'timeline-dot-future'"
                      :style="{ '--dot-color': getStopColor(stop.type) }">
                      <i v-if="isPastStop(stop)" class="fi fi-rr-check text-[6px] text-white"></i>
                      <span v-else-if="isCurrentStop(stop)" class="timeline-dot-inner-pulse" :style="{ background: getStopColor(stop.type) }"></span>
                    </div>
                    <div class="flex-1 min-w-0 pt-0.5 pr-1">
                      <div class="flex items-start justify-between gap-2">
                        <div class="flex items-center gap-1.5 min-w-0">
                          <i :class="getStopIconClass(stop.type)" class="text-[11px] shrink-0 mt-px" :style="{ color: isPastStop(stop) ? '#71717a' : getStopColor(stop.type) }"></i>
                          <span class="text-[13px] font-bold text-zinc-900 dark:text-white truncate leading-tight">{{ stop.displayTitle || stop.title }}</span>
                        </div>
                        <span v-if="stop.arrivalDate" class="text-[10px] font-black text-zinc-400 shrink-0 tabular-nums mt-px">{{ formatTime(stop.arrivalDate) }}</span>
                      </div>
                      <div class="flex items-center gap-2 mt-1">
                        <span v-if="isCurrentStop(stop)" class="timeline-badge" :style="{ background: `${getStopColor(stop.type)}18`, color: getStopColor(stop.type) }">
                          <span class="w-1 h-1 rounded-full animate-pulse inline-block" :style="{ background: getStopColor(stop.type) }"></span>
                          En cours
                        </span>
                        <span v-else-if="isNextStop(stop)" class="timeline-badge bg-primary-400/10 text-primary-500 dark:text-primary-400">
                          Prochain
                        </span>
                      </div>
                      <div v-if="stop.distanceToNext && !stop.isReturnStep" class="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-zinc-100 dark:border-zinc-800/60">
                        <i class="fi fi-rr-car text-[9px] text-zinc-300 dark:text-zinc-600"></i>
                        <span class="text-[10px] font-semibold text-zinc-400">{{ stop.distanceToNext }} km · {{ formatDuration(stop.travelTimeToNext) }}</span>
                      </div>
                    </div>
                  </div>
                  <div v-if="(idx as number) < todayActivities.length - 1" class="h-px bg-zinc-100 dark:bg-zinc-800/60 ml-[3.25rem] mr-4"></div>
                </div>
              </div>
            </div>

            <!-- ⑤ BUDGET -->
            <div class="live-card card-enter" style="animation-delay:240ms">
              <div class="flex items-center justify-between mb-3">
                <span class="live-section-label">Budget</span>
                <button @click="router.push(`/trips/${tripId}`)" class="text-[10px] font-black text-primary-500 dark:text-primary-400 hover:underline transition-colors cursor-pointer">Détails →</button>
              </div>
              <div class="grid grid-cols-3 gap-2 mb-3">
                <div class="budget-stat-cell">
                  <span class="budget-stat-value">{{ Math.round(budgetStats.total) }}€</span>
                  <span class="budget-stat-label">Budget</span>
                </div>
                <div class="budget-stat-cell">
                  <span class="budget-stat-value">{{ Math.round(budgetStats.spent) }}€</span>
                  <span class="budget-stat-label">Dépensé</span>
                </div>
                <div class="budget-stat-cell">
                  <span class="budget-stat-value" :class="budgetStats.remaining >= 0 ? 'text-primary-500 dark:text-primary-400' : 'text-rose-500'">{{ Math.round(Math.abs(budgetStats.remaining)) }}€</span>
                  <span class="budget-stat-label">{{ budgetStats.remaining >= 0 ? 'Restant' : 'Dépassé' }}</span>
                </div>
              </div>
              <div class="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-700"
                  :class="budgetStats.percentage > 90 ? 'bg-rose-500' : budgetStats.percentage > 70 ? 'bg-amber-500' : 'budget-bar'"
                  :style="{ width: `${budgetStats.percentage}%` }"></div>
              </div>
              <div v-if="todayExpenses.length > 0" class="flex items-center justify-between mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/50">
                <span class="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">Aujourd'hui</span>
                <span class="text-xs font-black text-zinc-700 dark:text-zinc-200">{{ todayExpensesTotal.toFixed(2) }}€</span>
              </div>
            </div>

            <!-- ⑥ ADD EXPENSE -->
            <button @click="showAddExpenseModal = true" class="expense-cta-btn card-enter cursor-pointer group" style="animation-delay:300ms">
              <div class="w-8 h-8 rounded-xl bg-primary-400/10 flex items-center justify-center shrink-0 group-hover:bg-primary-400/20 transition-colors">
                <i class="fi fi-rr-coins text-primary-500 dark:text-primary-400 text-sm"></i>
              </div>
              <span>Saisir une dépense</span>
              <i class="fi fi-rr-plus ml-auto text-zinc-400 group-hover:text-primary-400 transition-colors text-sm"></i>
            </button>

            <!-- ⑦ PROCHAINS JOURS -->
            <div v-if="upcomingDays.length > 0" class="card-enter" style="animation-delay:360ms">
              <p class="live-section-label px-1 mb-2">Prochains jours</p>
              <div class="space-y-2">
                <div v-for="(day, i) in upcomingDays.slice(0, 4)" :key="day.date"
                  class="upcoming-day-row"
                  :style="{ animationDelay: `${360 + i * 50}ms` }">
                  <div class="upcoming-day-date">
                    <span class="text-sm font-black text-zinc-700 dark:text-zinc-200 leading-none">{{ new Date(day.date + 'T12:00:00').getDate() }}</span>
                    <span class="text-[8px] font-bold text-zinc-400 uppercase leading-none">{{ new Date(day.date + 'T12:00:00').toLocaleDateString('fr-FR', { month: 'short' }) }}</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-[12px] font-black text-zinc-800 dark:text-zinc-200 capitalize leading-tight">{{ formatDateShort(day.date) }}</p>
                    <p class="text-[10px] text-zinc-400 font-medium leading-tight mt-px">{{ day.activities.length }} arrêt{{ day.activities.length > 1 ? 's' : '' }}</p>
                  </div>
                  <div class="flex -space-x-1.5 shrink-0">
                    <div v-for="(act, j) in day.activities.slice(0, 5)" :key="act.id"
                      class="w-4 h-4 rounded-full border-2 border-white dark:border-[#0c0c0e] shadow-sm"
                      :style="{ background: getStopColor(act.type), zIndex: 10 - (j as number) }">
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="h-4"></div>
          </div>
        </div>
      </div>

      <!-- ─── MAP ─── -->
      <div class="flex-1 relative p-3" :class="showMobileMap ? 'flex' : 'hidden md:flex'">
        <div class="absolute inset-3 rounded-3xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div id="live-map" class="w-full h-full"></div>
        </div>

        <div class="absolute inset-3 pointer-events-none rounded-3xl overflow-hidden">
          <!-- Heure -->
          <div class="absolute top-4 left-4 pointer-events-auto">
            <div class="map-chip gap-2">
              <span class="w-1.5 h-1.5 bg-primary-400 rounded-full animate-pulse shrink-0"></span>
              <span class="text-sm font-black text-zinc-900 dark:text-white tabular-nums">{{ currentTimeFormatted }}</span>
            </div>
          </div>

          <!-- Floating next-stop -->
          <Transition name="float-up">
            <div v-if="nextStop" class="absolute bottom-6 left-4 right-4 pointer-events-auto md:left-auto md:right-5 md:w-[280px]">
              <div class="map-float-card">
                <div class="flex items-center gap-2 mb-2.5">
                  <span class="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">Prochain arrêt</span>
                  <div class="flex-1 h-px bg-zinc-200 dark:bg-zinc-700/80"></div>
                </div>
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" :style="{ background: `${getStopColor(nextStop.type)}18` }">
                    <i :class="getStopIconClass(nextStop.type)" class="text-[17px]" :style="{ color: getStopColor(nextStop.type) }"></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-black text-zinc-900 dark:text-white text-sm truncate leading-tight">{{ nextStop.displayTitle || nextStop.title }}</p>
                    <div v-if="prevStopBeforeNext?.distanceToNext" class="flex items-center gap-2 mt-0.5">
                      <span class="text-[10px] font-bold text-zinc-500">{{ prevStopBeforeNext.distanceToNext }} km</span>
                      <span class="text-zinc-300 dark:text-zinc-600 text-[10px]">·</span>
                      <span class="text-[10px] font-bold text-zinc-500">{{ formatDuration(prevStopBeforeNext.travelTimeToNext) }}</span>
                    </div>
                  </div>
                  <button @click="openGoogleMaps(nextStop)" class="map-nav-btn cursor-pointer">
                    <i class="fi fi-rr-navigation text-zinc-950 text-[13px]"></i>
                  </button>
                </div>
              </div>
            </div>
          </Transition>

          <!-- Aucun stop sur la carte -->
          <div v-if="!loading && todayActivities.length === 0" class="absolute inset-0 flex items-center justify-center">
            <div class="map-chip flex-col gap-2 !py-5 !px-6 pointer-events-auto text-center">
              <i class="fi fi-rr-road text-2xl text-zinc-400"></i>
              <div>
                <p class="font-black text-zinc-700 dark:text-zinc-300 text-sm">Jour libre</p>
                <p class="text-[10px] text-zinc-400 mt-0.5">Aucune activité planifiée aujourd'hui</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ═══ MODAL DÉPENSE ═══ -->
  <Teleport to="body">
    <Transition name="modal-slide">
      <div v-if="showAddExpenseModal" class="fixed top-14 left-0 right-0 bottom-0 z-50 flex items-end sm:items-center justify-center">
        <div class="absolute inset-0 bg-zinc-950/50 backdrop-blur-[6px]" @click="showAddExpenseModal = false"></div>
        <div class="modal-sheet">
          <!-- handle mobile -->
          <div class="w-8 h-1 bg-zinc-300 dark:bg-zinc-600 rounded-full mx-auto mb-5 sm:hidden"></div>

          <div class="flex items-start justify-between mb-6">
            <div>
              <p class="text-[9px] font-black text-zinc-400 uppercase tracking-[0.22em] mb-1">Saisie rapide · {{ currentTimeFormatted }}</p>
              <h3 class="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Nouvelle dépense</h3>
            </div>
            <button @click="showAddExpenseModal = false" class="live-icon-btn shrink-0 cursor-pointer">
              <i class="fi fi-rr-cross text-xs text-zinc-500 dark:text-zinc-400"></i>
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
</template>

<style scoped>
@reference "../index.css";

@keyframes cardEnter {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
.card-enter {
  opacity: 0;
  animation: cardEnter 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.live-card {
  @apply bg-white dark:bg-[#1a1a1c] rounded-3xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-none border border-zinc-200/70 dark:border-zinc-800/40;
}

.live-icon-btn {
  @apply w-9 h-9 rounded-2xl bg-zinc-100 dark:bg-zinc-800/70 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700/80 transition-all active:scale-90;
}

.live-section-label {
  @apply text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.22em] block;
}

.live-badge {
  @apply flex items-center gap-1.5 px-3 py-1.5 bg-primary-400/10 dark:bg-primary-400/[0.12] rounded-xl border border-primary-400/20 text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-wider;
}

.live-badge-sm {
  @apply flex items-center gap-1.5 px-2.5 py-1.5 bg-primary-400/10 dark:bg-primary-400/[0.12] rounded-xl border border-primary-400/20 text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-wider;
}

.live-dot {
  @apply w-1.5 h-1.5 bg-primary-400 rounded-full animate-pulse;
}

.progress-bar {
  background: var(--brand-primary);
  box-shadow: 0 0 10px color-mix(in srgb, var(--brand-primary) 60%, transparent);
  transition: width 1s cubic-bezier(0.16, 1, 0.3, 1);
}

.current-stop-card {
  @apply relative overflow-hidden rounded-3xl p-4 border-2;
  border-color: color-mix(in srgb, var(--stop-color) 35%, transparent);
  background: color-mix(in srgb, var(--stop-color) 7%, white);
}
.dark .current-stop-card {
  background: color-mix(in srgb, var(--stop-color) 8%, #1a1a1c);
}
.current-stop-glow {
  @apply absolute -top-12 -right-12 w-40 h-40 rounded-full pointer-events-none;
  background: color-mix(in srgb, var(--stop-color) 30%, transparent);
  filter: blur(40px);
}
.current-stop-pulse {
  @apply w-2 h-2 rounded-full animate-pulse inline-block;
}

.next-stop-icon {
  background: color-mix(in srgb, var(--stop-color) 14%, transparent);
}

.route-chip {
  @apply inline-flex items-center gap-1 text-[10px] font-bold text-zinc-500 dark:text-zinc-400;
}

.navigate-btn {
  @apply flex items-center justify-center gap-2 w-full py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all active:scale-[0.97];
  background: var(--brand-primary);
  color: #0a0a0a;
  box-shadow: 0 4px 20px color-mix(in srgb, var(--brand-primary) 35%, transparent);
}
.navigate-btn:hover { filter: brightness(1.07); }

.timeline-line {
  @apply absolute left-[1.875rem] top-0 bottom-0 w-px bg-zinc-100 dark:bg-zinc-800/60 pointer-events-none;
}

.timeline-dot {
  @apply w-5 h-5 rounded-full border-2 border-white dark:border-[#1a1a1c] mt-1 z-10 flex items-center justify-center shrink-0 transition-all duration-300;
}
.timeline-dot-past   { background: #d4d4d8; }
.timeline-dot-next   { background: var(--brand-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand-primary) 20%, transparent); }
.timeline-dot-active { background: var(--dot-color); box-shadow: 0 0 0 3px color-mix(in srgb, var(--dot-color) 20%, transparent); }
.timeline-dot-future { background: #d4d4d8; }

.timeline-dot-inner-pulse {
  @apply w-2 h-2 rounded-full animate-pulse inline-block;
}

.timeline-badge {
  @apply inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg;
}

.budget-stat-cell {
  @apply flex flex-col items-center gap-0.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl py-3 px-2;
}
.budget-stat-value { @apply text-base font-black text-zinc-900 dark:text-white leading-tight; }
.budget-stat-label { @apply text-[9px] font-bold text-zinc-400 uppercase tracking-wide; }

.budget-bar {
  background: var(--brand-primary);
  box-shadow: 0 0 6px color-mix(in srgb, var(--brand-primary) 40%, transparent);
}

.expense-cta-btn {
  @apply flex items-center gap-3 w-full p-3.5 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800/60 text-zinc-500 dark:text-zinc-400 font-black text-sm hover:border-primary-400/40 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-primary-400/[0.04] transition-all duration-200;
}

.upcoming-day-row {
  @apply flex items-center gap-3 p-3 bg-white dark:bg-[#1a1a1c] rounded-2xl border border-zinc-200/70 dark:border-zinc-800/40 shadow-[0_1px_6px_rgba(0,0,0,0.04)] dark:shadow-none hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors;
}
.upcoming-day-date {
  @apply w-10 h-10 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 flex flex-col items-center justify-center gap-0.5 shrink-0 border border-zinc-100 dark:border-zinc-700/50;
}

.map-chip {
  @apply flex items-center bg-white/95 dark:bg-[#1a1a1c]/95 backdrop-blur-xl rounded-2xl px-4 py-2.5 border border-zinc-200/60 dark:border-zinc-700/50 shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)];
}

.map-float-card {
  @apply bg-white/95 dark:bg-[#1a1a1c]/96 backdrop-blur-2xl rounded-3xl border border-zinc-200/60 dark:border-zinc-700/50 shadow-[0_8px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.5)] p-4;
}

.map-nav-btn {
  @apply w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90 shrink-0;
  background: var(--brand-primary);
  box-shadow: 0 4px 14px color-mix(in srgb, var(--brand-primary) 40%, transparent);
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
.pop-enter-from  { opacity: 0; transform: scale(0.96) translateY(-6px); }
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
