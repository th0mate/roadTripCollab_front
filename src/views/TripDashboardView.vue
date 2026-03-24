<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../services/api';
import { useToast } from '../composables/useToast';

const toast = useToast();

import { getMe } from '../services/authService';
import { useTripMap } from '../composables/useTripMap';
import TripEditModal from '../components/TripEditModal.vue';
import TripPhotosModal from '../components/TripPhotosModal.vue';
import TripAddStopModal from '../components/TripAddStopModal.vue';
import AppModal from '../components/AppModal.vue';
import TripOnboarding from '../components/TripOnboarding.vue';

const route = useRoute();
const router = useRouter();
const tripId = route.params.id;
const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3333';

const trip = ref<any>(null);
const loading = ref(true);
const error = ref('');
const currentUser = ref<any>(null);
const isSubmitting = ref(false);
const daysData = ref<any[]>([]);
const currentDayIndex = ref(0);

const showItineraryDrawer = ref(false);
const showBudgetDrawer = ref(false);
const showEditModal = ref(false);
const showPhotosModal = ref(false);
const showAddStopModal = ref(false);
const showExpenseModal = ref(false);
const showEditExpenseModal = ref(false);
const showInviteModal = ref(false);
const showParticipantsModal = ref(false);
const showRouteSettingsModal = ref(false);
const showDeleteConfirmModal = ref(false);
const showHubModal = ref(false);
const showPublicModal = ref(false);
const selectedCategory = ref('');
const selectedStopForPhotos = ref<any>(null);

const categories = [
  { label: 'Montagnes', icon: 'fi-rr-mountains' },
  { label: 'Plage', icon: 'fi-rr-umbrella-beach' },
  { label: 'Forêt', icon: 'fi-rr-tree' },
  { label: 'Désert', icon: 'fi-rr-sun' },
  { label: 'Ville', icon: 'fi-rr-building' },
];

const makeTripPublic = async () => {
  if (!selectedCategory.value) {
    toast.error('Veuillez choisir une catégorie.');
    return;
  }
  isSubmitting.value = true;
  try {
    await api.post(`/trips/${tripId}/public`, { category: selectedCategory.value });
    trip.value.isPublic = true;
    trip.value.category = selectedCategory.value;
    showPublicModal.value = false;
    toast.success('Voyage rendu public avec succès !');
  } catch (e) {
    toast.error('Erreur lors du partage.');
  } finally {
    isSubmitting.value = false;
  }
};
const selectedDateForAdd = ref('');
const preSelectedPlace = ref<any>(null);
const editingExpense = ref<any>(null);
const itemToDelete = ref<any>(null);
const editingHubDay = ref('');
const hubStartTime = ref('09:00');
const isEditingStop = ref(false);
const editingStopId = ref<number | null>(null);
const inviteEmail = ref('');
const showQuickSuggestions = ref(false);
const mapSearchQuery = ref('');
const mapHeaderRef = ref<HTMLElement | null>(null);
const sharedPoiInfoWindow = ref<google.maps.InfoWindow | null>(null);
let activeExplorationMarker: google.maps.Marker | null = null;
let currentSearchSessionId = 0;

const routeFilters = ref({
  first: true,    // Orange
  main: true,     // Green
  activity: true, // Pink
  return: true    // Cyan
});

const routeSettings = ref({ 
  carConsumption: 7.0, 
  fuelPrice: 1.8, 
  tollRate: 0.12, 
  avoidTolls: false 
});

const estimatedFuelCost = ref(0);
const estimatedTollCost = ref(0);

const newExpense = ref({ 
  title: '', 
  amount: 0, 
  category: 'food', 
  paidBy: null as any, 
  date: new Date().toISOString().split('T')[0] 
});

const {
  initMap: initTripMap, 
  clearAll: clearAllMap, 
  clearPolylines, 
  clearSearchMarkers: clearSearchMarkersBase, 
  addMarker,
  drawEncodedRoute, 
  fitBounds, 
  map: tripMap 
} = useTripMap();

const extractDateLocal = (s?: string) => s ? s.substring(0, 10) : '';

const extractTimeLocal = (s?: string) => { 
  if (!s || s.length < 13) return ''; 
  const p = s.split(/[T ]/); 
  return p[1] ? p[1].substring(0, 5) : ''; 
};

const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '';

const formatTime = (s?: string) => extractTimeLocal(s);

const formatDuration = (min: number) => min < 60 ? `${min} min` : `${Math.floor(min/60)}h${String(min%60).padStart(2,'0').replace(/^0$/,'')}`;

const formatDateRange = (s: string, e: string) => `${formatDate(s)} → ${formatDate(e)}`;

const formatStatus = (s: string) => ({ planning: 'Planification', active: 'En cours', completed: 'Terminé', cancelled: 'Annulé' }[s] || s);

const getInitials = (n: string) => n?.split(' ').map(p=>p[0]).join('').toUpperCase().slice(0,2) || '?';

const getAvatarUrl = (p: string | null) => p ? (p.startsWith('http') ? p : `${backendUrl}${p}`) : '';

const getStatusIcon = (s: string) => ({ planning: 'fi fi-rr-time-quarter-past', active: 'fi fi-rr-rocket-lunch', completed: 'fi fi-rr-check-circle', cancelled: 'fi fi-rr-ban' }[s] || 'fi fi-rr-circle');

const getStopIconClass = (t: string) => ({ city:'fi fi-rr-building', accommodation:'fi fi-rr-bed', restaurant:'fi fi-rr-restaurant', activity:'fi fi-rr-ticket', poi:'fi fi-rr-marker' }[t] || 'fi fi-rr-marker');

const getCategoryIconClass = (c: string) => ({ transport:'fi fi-rr-plane', fuel:'fi fi-rr-gas-pump', tolls:'fi fi-rr-road', accommodation:'fi fi-rr-bed', food:'fi fi-rr-restaurant', activity:'fi fi-rr-ticket', other:'fi fi-rr-box' }[c] || 'fi fi-rr-coins');

const formatStopType = (t: string) => ({ city:'Ville', accommodation:'Hébergement', restaurant:'Restaurant', activity:'Activité', poi:'Point d\'intérêt' }[t] || t);

const getStopColor = (t: string) => {
  switch (t) {
    case 'accommodation': return '#00F3FF'; 
    case 'restaurant': return '#FF0055'; 
    case 'activity': return '#9D00FF'; 
    case 'city': return '#00FF41'; 
    case 'poi': return '#FFF000'; 
    default: return '#ccff00'; 
  }
};

const clearSearchMarkers = () => {
  clearSearchMarkersBase();
  if (activeExplorationMarker) {
    activeExplorationMarker.setMap(null);
    activeExplorationMarker = null;
  }
};

const clearAll = () => {
  clearAllMap();
  if (activeExplorationMarker) {
    activeExplorationMarker.setMap(null);
    activeExplorationMarker = null;
  }
};

const getCityNameForDay = (day: any) => {
  if (!day || !trip.value) return '';
  const dateStr = day.date;
  const cityStop = trip.value.stops.find((s: any) => s.type === 'city' && extractDateLocal(s.arrivalDate) === dateStr);
  return cityStop ? cityStop.title : '';
};

const myParticipant = computed(() => trip.value?.participants?.find((p:any) => p.id === currentUser.value?.id));

const isInvitationPending = computed(() => { 
  const piv = myParticipant.value?.pivot as any; 
  return piv?.invitationStatus === 'pending' || piv?.invitation_status === 'pending'; 
});

const currentDay = computed(() => daysData.value[currentDayIndex.value] || null);

const budgetStats = computed(() => {
  if (!trip.value) return { total:0, spent:0, remaining:0, percentage:0, perUser:[] };
  const total = Number(trip.value.budget) || 0;
  const spent = trip.value.expenses?.reduce((s:number,e:any) => s+Number(e.amount),0) || 0;
  const perUser = trip.value.participants?.map((p:any) => {
    const userSpent = trip.value.expenses?.filter((e:any) => e.paidBy===p.id).reduce((s:number,e:any)=>s+Number(e.amount),0)||0;
    return { ...p, spent:userSpent, pct: total>0?(userSpent/total)*100:0 };
  }) || [];
  return { total, spent, remaining: total-spent, percentage: total>0?Math.min(100,(spent/total)*100):0, perUser };
});

const getGoogleRoute = (origin: any, destination: any): Promise<any> => {
  return new Promise((resolve) => {
    if (!(window as any).google || !(window as any).google.maps) {
      resolve(null);
      return;
    }

    const lat1 = parseFloat(origin.lat).toFixed(5);
    const lng1 = parseFloat(origin.lng).toFixed(5);
    const lat2 = parseFloat(destination.lat).toFixed(5);
    const lng2 = parseFloat(destination.lng).toFixed(5);
    const cacheKey = `rt_cache_${lat1},${lng1}_${lat2},${lng2}`;
    
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.ts < 7 * 24 * 60 * 60 * 1000) {
          resolve(parsed.data);
          return;
        }
      } catch (e) { localStorage.removeItem(cacheKey); }
    }

    const ds = new (window as any).google.maps.DirectionsService();
    ds.route({
      origin: { lat: parseFloat(origin.lat), lng: parseFloat(origin.lng) },
      destination: { lat: parseFloat(destination.lat), lng: parseFloat(destination.lng) },
      travelMode: (window as any).google.maps.TravelMode.DRIVING
    }, (result: any, status: any) => {
      if (status === 'OK' && result.routes.length > 0) {
        const route = result.routes[0];
        const leg = route.legs[0];
        
        const hasTollWarning = route.warnings?.some((w: string) => /péage|payant|toll|charge/i.test(w));
        const hasTollInSteps = leg.steps?.some((s: any) => /péage|payant|toll|charge/i.test(s.instructions || ''));
        
        const fullPath: any[] = [];
        leg.steps.forEach((step: any) => { if (step.path) fullPath.push(...step.path); });
        const highResPolyline = (window as any).google.maps.geometry.encoding.encodePath(fullPath);
        
        const routeData = {
          distance: leg.distance.value,
          duration: leg.duration.value,
          polyline: highResPolyline,
          hasTolls: !!(hasTollWarning || hasTollInSteps)
        };

        localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: routeData }));
        resolve(routeData);
      } else {
        resolve(null);
      }
    });
  });
};

const calculateItineraryByDay = async () => {
  if (!trip.value) return;
  estimatedFuelCost.value = 0; estimatedTollCost.value = 0;
  const start = new Date(trip.value.startDate), end = new Date(trip.value.endDate);
  const days: any[] = [];
  const tripSettings = trip.value.settings || {};
  const sortedAccommodations = [...trip.value.stops].filter(s => s.type==='accommodation'&&s.arrivalDate).sort((a,b)=>(b.arrivalDate||'').localeCompare(a.arrivalDate||''));

  const startLoc = tripSettings.startLocation || { latitude: null, longitude: null, title: 'Départ du voyage' };

  for (let d = new Date(start); d <= end; d.setDate(d.getDate()+1)) {
    const dateStr = extractDateLocal(d.toISOString());
    const arrivals = trip.value.stops.filter((s:any) => s.arrivalDate && extractDateLocal(s.arrivalDate)===dateStr);
    let morningAcc = sortedAccommodations.find(s => extractDateLocal(s.arrivalDate!)<dateStr && (s.departureDate?extractDateLocal(s.departureDate)>=dateStr:true));
    if (!morningAcc && dateStr !== extractDateLocal(trip.value.startDate)) morningAcc = sortedAccommodations.find(s => extractDateLocal(s.arrivalDate!)<dateStr);
    const eveningAcc = sortedAccommodations.find(s => extractDateLocal(s.arrivalDate!)<=dateStr&&(s.departureDate?extractDateLocal(s.departureDate)>dateStr:true)) || sortedAccommodations.find(s=>extractDateLocal(s.arrivalDate!)<=dateStr);

    const dayIt: any[] = [];
    if (morningAcc) {
      const t = tripSettings[dateStr]?.startTime || '09:00';
      dayIt.push({ ...morningAcc, id:`start-${morningAcc.id}-${dateStr}`, displayTitle:`Départ : ${morningAcc.title}`, isAccommodationHub:true, isMorningDeparture:true, latitude:parseFloat(morningAcc.latitude), longitude:parseFloat(morningAcc.longitude), arrivalDate:`${dateStr}T${t}:00`, departureDate:`${dateStr}T${t}:00` });
    } else if (dateStr === extractDateLocal(trip.value.startDate)) {
      dayIt.push({ id:`start-trip-${dateStr}`, displayTitle:startLoc.title||'Départ du voyage', type:'poi', latitude:startLoc.latitude?parseFloat(startLoc.latitude):null, longitude:startLoc.longitude?parseFloat(startLoc.longitude):null, isAccommodationHub:true, isMorningDeparture:true, arrivalDate:`${dateStr}T${tripSettings[dateStr]?.startTime||'09:00'}:00`, departureDate:`${dateStr}T${tripSettings[dateStr]?.startTime||'09:00'}:00` });
    }

    const activitiesOnly = arrivals.filter((s:any) => s.type !== 'city');
    activitiesOnly.sort((a:any,b:any)=>(extractTimeLocal(a.arrivalDate)||'00:00').localeCompare(extractTimeLocal(b.arrivalDate)||'00:00')||(a.order-b.order)).forEach((a:any)=>dayIt.push({...a,latitude:parseFloat(a.latitude),longitude:parseFloat(a.longitude)}));

    if (eveningAcc && extractDateLocal(eveningAcc.arrivalDate!)<dateStr) {
      dayIt.push({ ...eveningAcc, id:`end-${eveningAcc.id}-${dateStr}`, displayTitle:`${eveningAcc.title} (Retour)`, isAccommodationHub:true, isEveningReturn:true, latitude:parseFloat(eveningAcc.latitude), longitude:parseFloat(eveningAcc.longitude), arrivalDate:null, departureDate:null });
    }
    
    if (dayIt.length === 0) {
      const cityStop = trip.value.stops.find((s:any) => s.type === 'city' && s.arrivalDate && extractDateLocal(s.arrivalDate) === dateStr);
      if (cityStop) dayIt.push({...cityStop, latitude:parseFloat(cityStop.latitude), longitude:parseFloat(cityStop.longitude)});
    }

    days.push({ date:dateStr, activities:dayIt });
  }

  for (const day of days) {
    const valid = day.activities.filter((a:any)=>!isNaN(parseFloat(a.latitude))&&!isNaN(parseFloat(a.longitude)));
    if (valid.length < 2) continue;
    for (let i = 0; i < valid.length - 1; i++) {
      const rd = await getGoogleRoute({lat:valid[i].latitude,lng:valid[i].longitude},{lat:valid[i+1].latitude,lng:valid[i+1].longitude});
      if(rd) {
        valid[i].polylineNext=rd.polyline;
        const distKm = rd.distance / 1000;
        valid[i].distanceToNext = Math.round(distKm * 10) / 10;
        valid[i].travelTimeToNext = Math.round(rd.duration / 60);
        valid[i].fuelCostNext = (distKm / 100) * routeSettings.value.carConsumption * routeSettings.value.fuelPrice;
        estimatedFuelCost.value += valid[i].fuelCostNext;
        if (rd.hasTolls) {
          valid[i].tollCostNext = distKm * routeSettings.value.tollRate;
          estimatedTollCost.value += valid[i].tollCostNext;
        } else {
          valid[i].tollCostNext = 0;
        }
      }
    }
  }

  for (let i = 0; i < days.length - 1; i++) {
    const currentDay = days[i], nextDay = days[i+1];
    const lastOfCurrent = [...currentDay.activities].reverse().find((a:any)=>!isNaN(parseFloat(a.latitude))&&!isNaN(parseFloat(a.longitude)));
    const firstOfNext = nextDay.activities.find((a:any)=>!isNaN(parseFloat(a.latitude))&&!isNaN(parseFloat(a.longitude)));
    if (lastOfCurrent && firstOfNext) {
      if (lastOfCurrent.latitude === firstOfNext.latitude && lastOfCurrent.longitude === firstOfNext.longitude) continue;
      const rd = await getGoogleRoute({lat:lastOfCurrent.latitude,lng:lastOfCurrent.longitude},{lat:firstOfNext.latitude,lng:firstOfNext.longitude});
      if (rd) {
        lastOfCurrent.interDayPolyline = rd.polyline;
        const distKm = rd.distance / 1000;
        lastOfCurrent.distanceToNext = Math.round(distKm * 10) / 10;
        lastOfCurrent.travelTimeToNext = Math.round(rd.duration / 60);
        lastOfCurrent.fuelCostNext = (distKm / 100) * routeSettings.value.carConsumption * routeSettings.value.fuelPrice;
        estimatedFuelCost.value += lastOfCurrent.fuelCostNext;
        if (rd.hasTolls) {
          lastOfCurrent.tollCostNext = distKm * routeSettings.value.tollRate;
          estimatedTollCost.value += lastOfCurrent.tollCostNext;
        } else {
          lastOfCurrent.tollCostNext = 0;
        }
      }
    }
  }

  const lastDay = days[days.length - 1];
  const lastPoint = [...lastDay.activities].reverse().find((a:any)=>!isNaN(parseFloat(a.latitude))&&!isNaN(parseFloat(a.longitude)));
  if (lastPoint && !isNaN(parseFloat(startLoc.latitude)) && !isNaN(parseFloat(startLoc.longitude))) {
    if (parseFloat(lastPoint.latitude).toFixed(5) !== parseFloat(startLoc.latitude).toFixed(5) || 
        parseFloat(lastPoint.longitude).toFixed(5) !== parseFloat(startLoc.longitude).toFixed(5)) {
      const rd = await getGoogleRoute({lat:lastPoint.latitude,lng:lastPoint.longitude},{lat:parseFloat(startLoc.latitude),lng:parseFloat(startLoc.longitude)});
      if (rd) {
        lastPoint.polylineNext = rd.polyline;
        const distKm = rd.distance / 1000;
        const durationMin = Math.round(rd.duration / 60);
        const fuelCost = (distKm / 100) * routeSettings.value.carConsumption * routeSettings.value.fuelPrice;
        estimatedFuelCost.value += fuelCost;
        let tollCost = 0;
        if (rd.hasTolls) {
          tollCost = distKm * routeSettings.value.tollRate;
          estimatedTollCost.value += tollCost;
        }
        lastPoint.returnRouteData = { 
          distance: Math.round(distKm * 10) / 10, 
          duration: durationMin, 
          title: `Retour vers ${startLoc.title || 'le point de départ'}`,
          fuelCost: fuelCost,
          tollCost: tollCost
        };
        lastPoint.distanceToNext = lastPoint.returnRouteData.distance;
        lastPoint.travelTimeToNext = lastPoint.returnRouteData.duration;
        lastPoint.fuelCostNext = fuelCost;
        lastPoint.tollCostNext = tollCost;
        lastDay.activities.push({ 
          id: 'return-home', 
          displayTitle: lastPoint.returnRouteData.title, 
          isReturnStep: true, 
          type: 'poi', 
          latitude: parseFloat(startLoc.latitude), 
          longitude: parseFloat(startLoc.longitude) 
        });
      }
    }
  }
  daysData.value = days;
};

const fetchTripData = async () => {
  try {
    const res = await api.get(`/trips/${tripId}`);
    trip.value = res.data;
    routeSettings.value = { 
      carConsumption: trip.value.carConsumption||7.0, 
      fuelPrice: trip.value.fuelPrice||1.8, 
      tollRate: (trip.value as any).tollRate||0.12, 
      avoidTolls: false 
    };
    await calculateItineraryByDay();
    if (tripMap.value) refreshMap(true); 
  } catch (e) { 
    router.push('/my-trips'); 
  }
  finally { loading.value = false; }
};

const refreshMap = (shouldFit = false) => {
  if (!tripMap.value || !trip.value) return;
  clearAll();
  
  let hasPoints = false;
  const gBounds = new (window as any).google.maps.LatLngBounds();
  
  daysData.value.forEach((day, dayIdx) => {
    day.activities.forEach((act:any, idx:number) => {
      if(act.polylineNext) {
        const nextAct = day.activities[idx + 1];
        const isFirstRouteOfTrip = dayIdx === 0 && idx === 0;
        const isReturnRoute = nextAct?.isReturnStep === true;
        const isBetweenActivities = !act.isAccommodationHub && act.type !== 'city' && nextAct && !nextAct.isAccommodationHub && nextAct.type !== 'city' && !isReturnRoute;
        
        if (isReturnRoute) {
          if (routeFilters.value.return) drawEncodedRoute(act.polylineNext, { color: '#00ffff', weight: 6, opacity: 1 });
        } else if (isFirstRouteOfTrip) {
          if (routeFilters.value.first) drawEncodedRoute(act.polylineNext, { color: '#ff9900', weight: 6, opacity: 1 });
        } else if (isBetweenActivities) {
          if (routeFilters.value.activity) drawEncodedRoute(act.polylineNext, { color: '#ff00ff', weight: 5, opacity: 0.9 });
        } else {
          if (routeFilters.value.main) drawEncodedRoute(act.polylineNext, { color: '#ccff00', weight: 5, opacity: 0.9 });
        }
      }
      if(act.interDayPolyline && routeFilters.value.main) drawEncodedRoute(act.interDayPolyline, { color: '#ccff00', weight: 5, opacity: 0.9 });
    });
  });

  const usedStops: any[] = [];
  const addedCoords = new Set<string>();
  daysData.value.forEach(day => {
    day.activities.forEach((act:any) => {
      const lat = parseFloat(act.latitude), lng = parseFloat(act.longitude);
      if (isNaN(lat) || isNaN(lng)) return;
      const coordKey = `${lat.toFixed(6)},${lng.toFixed(6)}`;
      if (!addedCoords.has(coordKey)) {
        usedStops.push(act);
        addedCoords.add(coordKey);
      }
    });
  });

  usedStops.forEach((s:any, i:number) => {
    const lat = parseFloat(s.latitude), lng = parseFloat(s.longitude);
    const marker = addMarker(lat, lng, { 
      label: (i+1).toString(), 
      title: s.displayTitle || s.title,
      color: getStopColor(s.type)
    });
    
    if (marker) {
      marker.addListener('click', () => {
        openTripStopInfoWindow(s, marker);
      });
    }

    if (shouldFit) gBounds.extend({lat,lng});
    hasPoints = true;
  });
  if (shouldFit && hasPoints) tripMap.value.fitBounds(gBounds, { top: 80, bottom: 80, left: 80, right: 80 });
};

const redrawOnlyRoutes = () => {
  if (!tripMap.value) return;
  clearPolylines();
  daysData.value.forEach((day, dayIdx) => {
    day.activities.forEach((act:any, idx:number) => {
      if(act.polylineNext) {
        const nextAct = day.activities[idx + 1];
        const isFirstRouteOfTrip = dayIdx === 0 && idx === 0;
        const isReturnRoute = nextAct?.isReturnStep === true;
        const isBetweenActivities = !act.isAccommodationHub && act.type !== 'city' && nextAct && !nextAct.isAccommodationHub && nextAct.type !== 'city' && !isReturnRoute;
        
        if (isReturnRoute) {
          if (routeFilters.value.return) drawEncodedRoute(act.polylineNext, { color: '#00ffff', weight: 6, opacity: 1 });
        } else if (isFirstRouteOfTrip) {
          if (routeFilters.value.first) drawEncodedRoute(act.polylineNext, { color: '#ff9900', weight: 6, opacity: 1 });
        } else if (isBetweenActivities) {
          if (routeFilters.value.activity) drawEncodedRoute(act.polylineNext, { color: '#ff00ff', weight: 5, opacity: 0.9 });
        } else {
          if (routeFilters.value.main) drawEncodedRoute(act.polylineNext, { color: '#ccff00', weight: 5, opacity: 0.9 });
        }
      }
      if(act.interDayPolyline && routeFilters.value.main) drawEncodedRoute(act.interDayPolyline, { color: '#ccff00', weight: 5, opacity: 0.9 });
    });
  });
};

const openPoiInfoWindow = (place: google.maps.places.PlaceResult, marker: google.maps.Marker) => {
  if (!tripMap.value) return;
  if (!sharedPoiInfoWindow.value) sharedPoiInfoWindow.value = new google.maps.InfoWindow();

  const photoUrl = place.photos && place.photos.length > 0 ? place.photos[0].getUrl({ maxWidth: 400, maxHeight: 200 }) : null;
  const ratingHtml = place.rating ? `<div class="flex items-center gap-1.5 mt-1.5"><span class="text-amber-400 text-sm">★</span><span class="text-xs font-black text-zinc-900 dark:text-zinc-100">${place.rating}</span><span class="text-[10px] text-zinc-400 dark:text-zinc-500">(${place.user_ratings_total || 0} avis)</span></div>` : '';

  const content = `
    <div class="poi-popup-container overflow-hidden rounded-2xl bg-white dark:bg-[#161618] min-w-[260px] max-w-[280px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-zinc-200 dark:border-white/10">
      ${photoUrl ? `<div class="w-full h-32 bg-cover bg-center" style="background-image: url('${photoUrl}')"></div>` : '<div class="w-full h-2 bg-primary-400"></div>'}
      <div class="p-4">
        <h4 class="font-black text-sm text-zinc-900 dark:text-zinc-100 leading-tight">${place.name}</h4>
        <p class="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1.5 flex items-start gap-1.5 leading-relaxed">
          <i class="fi fi-rr-marker mt-0.5 shrink-0"></i>
          <span>${place.formatted_address || "Adresse non disponible"}</span>
        </p>
        ${ratingHtml}
        <div class="mt-4 flex flex-col gap-2">
          ${place.url ? `
            <a href="${place.url}" target="_blank" class="flex items-center justify-center gap-2 py-2 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-[10px] font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-widest hover:bg-zinc-200 dark:hover:bg-white/10 transition-all text-decoration-none">
              <i class="fi fi-rr-map"></i> Voir sur Google Maps
            </a>
          ` : ''}
          <button id="btn-add-poi-${place.place_id}" class="w-full py-3 bg-primary-400 text-zinc-900 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary-500 transition-all cursor-pointer shadow-lg shadow-primary-400/20 flex items-center justify-center gap-2 border-none">
            <i class="fi fi-rr-plus-small text-sm"></i> Ajouter au voyage
          </button>
        </div>
      </div>
    </div>
  `;

  sharedPoiInfoWindow.value.setContent(content);
  sharedPoiInfoWindow.value.open(tripMap.value, marker);

  google.maps.event.addListenerOnce(sharedPoiInfoWindow.value, 'domready', () => {
    const btn = document.getElementById(`btn-add-poi-${place.place_id}`);
    if (btn) btn.onclick = () => { 
      if (!trip.value || !place.geometry?.location) return;
      if (!selectedDateForAdd.value) {
        selectedDateForAdd.value = daysData.value[currentDayIndex.value]?.date || trip.value.startDate.split('T')[0];
      }
      preSelectedPlace.value = place;
      showAddStopModal.value = true;
      sharedPoiInfoWindow.value?.close(); 
    };
  });
};

const handlePoiClick = (poi: any) => {
  if (!tripMap.value) return;
  currentSearchSessionId++;
  const sessionId = currentSearchSessionId;
  mapSearchQuery.value = '';
  const input = document.getElementById('map-search-input') as HTMLInputElement;
  if (input) input.value = '';
  if (sharedPoiInfoWindow.value) sharedPoiInfoWindow.value.close();
  if (activeExplorationMarker) {
    activeExplorationMarker.setMap(null);
    activeExplorationMarker = null;
  }
  clearSearchMarkers();
  const service = new google.maps.places.PlacesService(tripMap.value);
  service.getDetails({
    placeId: poi.placeId,
    fields: ['name', 'formatted_address', 'geometry', 'rating', 'types', 'place_id', 'user_ratings_total', 'photos', 'url']
  }, (place, status) => {
    if (sessionId !== currentSearchSessionId) return;
    if (status === google.maps.places.PlacesServiceStatus.OK && place && place.geometry?.location) {
      clearSearchMarkers();
      const marker = addMarker(place.geometry.location.lat(), place.geometry.location.lng(), { title: place.name }, true);
      if (marker) {
        activeExplorationMarker = marker;
        marker.addListener('click', () => openPoiInfoWindow(place, marker!));
        openPoiInfoWindow(place, marker);
      }
    }
  });
};

const initMap = async () => {
  if (!trip.value) return;
  const checkGoogle = () => new Promise<void>(res => { 
    if((window as any).google?.maps) res(); 
    else { const iv = setInterval(()=>{ if((window as any).google?.maps){ clearInterval(iv); res(); } }, 100); } 
  });
  await checkGoogle();
  let initial = { lat: 46.6, lng: 1.9 };
  if (trip.value.stops.length > 0) { 
    const f = trip.value.stops[0]; 
    initial = { lat: parseFloat(f.latitude), lng: parseFloat(f.longitude) }; 
  }
  await initTripMap('trip-map', initial, { 
    mapTypeId: 'hybrid', 
    tilt: 45, 
    mapTypeControl: false, 
    streetViewControl: false,
    onPoiClick: handlePoiClick
  });
  
  const input = document.getElementById('map-search-input') as HTMLInputElement;
  const g = (window as any).google;
  if (input && tripMap.value && g) {
    const sb = new g.maps.places.SearchBox(input);
    tripMap.value.addListener('bounds_changed', () => {
      sb.setBounds(tripMap.value!.getBounds() as google.maps.LatLngBounds);
    });
    sb.addListener('places_changed', async () => {
      currentSearchSessionId++;
      const sessionId = currentSearchSessionId;
      const places = sb.getPlaces();
      if (!input.value.trim()) { clearSearchMarkers(); return; }
      clearSearchMarkers();
      if (!places || places.length === 0) return;
      const b = new g.maps.LatLngBounds();
      const results = places.slice(0, 20);
      for (const place of results) {
        if (sessionId !== currentSearchSessionId) return;
        if (!place.geometry?.location) continue;
        const marker = addMarker(place.geometry.location.lat(), place.geometry.location.lng(), { title: place.name }, true);
        if (marker) {
          marker.addListener('click', () => {
            if (!place.photos || !place.url) {
              const service = new g.maps.places.PlacesService(tripMap.value!);
              service.getDetails({ placeId: place.place_id!, fields: ['name', 'formatted_address', 'geometry', 'rating', 'types', 'place_id', 'user_ratings_total', 'photos', 'url'] }, (details: any, status: any) => {
                if (sessionId !== currentSearchSessionId) return;
                if (status === g.maps.places.PlacesServiceStatus.OK && details) openPoiInfoWindow(details, marker);
                else openPoiInfoWindow(place, marker);
              });
            } else { openPoiInfoWindow(place, marker); }
          });
        }
        if (place.geometry.viewport) b.union(place.geometry.viewport);
        else b.extend(place.geometry.location);
        if (results.length === 1 && marker) g.maps.event.trigger(marker, 'click');
      }
      tripMap.value!.fitBounds(b);
    });
  }
  refreshMap(true);
};

const onSidebarAddClick = () => {
  if (!currentDay.value) return;
  selectedDateForAdd.value = currentDay.value.date;
  const input = document.getElementById('map-search-input');
  if (input) {
    input.focus();
    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

const focusMapSearchForDay = (date: string) => {
  selectedDateForAdd.value = date;
  const input = document.getElementById('map-search-input') as HTMLInputElement;
  if (input) {
    setTimeout(() => {
      input.focus();
      showQuickSuggestions.value = true;
    }, 150);
  }
};

const focusStopOnMap = (stop:any) => { 
  if(!tripMap.value||!stop.latitude||!stop.longitude) return; 
  tripMap.value.panTo({lat:parseFloat(stop.latitude),lng:parseFloat(stop.longitude)}); 
  tripMap.value.setZoom(15); 
};

const focusDayOnMap = (day:any) => { 
  if(!tripMap.value) return; 
  const g=(window as any).google; 
  if(!g) return; 
  const b=new g.maps.LatLngBounds(); 
  let ok=false; 
  day.activities.forEach((a:any)=>{ 
    if(a.latitude&&a.longitude){
      b.extend({lat:parseFloat(a.latitude),lng:parseFloat(a.longitude)});
      ok=true;
    }
  }); 
  if(ok) tripMap.value.fitBounds(b); 
};

const applyQuickSearch = (q:string) => {
  mapSearchQuery.value = q;
  showQuickSuggestions.value = false;
  if (!tripMap.value) return;
  currentSearchSessionId++;
  const sessionId = currentSearchSessionId;
  const g = (window as any).google;
  const service = new g.maps.places.PlacesService(tripMap.value);
  service.textSearch({ query: q, bounds: tripMap.value.getBounds() as google.maps.LatLngBounds }, async (results, status) => {
    if (sessionId !== currentSearchSessionId) return;
    if (status === g.maps.places.PlacesServiceStatus.OK && results) {
      clearSearchMarkers();
      const b = new g.maps.LatLngBounds();
      for (const place of results.slice(0, 20)) {
        if (!place.geometry?.location) continue;
        const marker = addMarker(place.geometry.location.lat(), place.geometry.location.lng(), { title: place.name }, true);
        if (marker) {
          marker.addListener('click', () => {
            service.getDetails({ placeId: place.place_id!, fields: ['name', 'formatted_address', 'geometry', 'rating', 'types', 'place_id', 'user_ratings_total', 'photos', 'url'] }, (details: any, status: any) => {
              if (sessionId !== currentSearchSessionId) return;
              if (status === g.maps.places.PlacesServiceStatus.OK && details) openPoiInfoWindow(details, marker);
              else openPoiInfoWindow(place, marker);
            });
          });
        }
        if (place.geometry.viewport) b.union(place.geometry.viewport);
        else b.extend(place.geometry.location);
      }
      tripMap.value!.fitBounds(b);
    }
  });
};

const clearMapSearch = () => {
  currentSearchSessionId++;
  mapSearchQuery.value = '';
  const input = document.getElementById('map-search-input') as HTMLInputElement;
  if (input) input.value = '';
  if (sharedPoiInfoWindow.value) sharedPoiInfoWindow.value.close();
  setTimeout(() => {
    clearSearchMarkers();
    if (activeExplorationMarker) {
      activeExplorationMarker.setMap(null);
      activeExplorationMarker = null;
    }
  }, 50);
};

const handleUpdateTrip = async (formData:any) => {
  if (!trip.value) return; isSubmitting.value=true;
  try {
    const fd = new FormData();
    fd.append('title',formData.title);
    if(formData.description) fd.append('description',formData.description);
    fd.append('startDate',formData.startDate);
    fd.append('endDate',formData.endDate);
    if(formData.budget) fd.append('budget',formData.budget.toString());
    fd.append('status',formData.status);
    if(formData.coverImage) fd.append('cover_image',formData.coverImage);
    await api.patch(`/trips/${trip.value.id}`,fd,{headers:{'Content-Type':'multipart/form-data'}});
    showEditModal.value=false; await fetchTripData();
    toast.success('Voyage mis à jour !');
  } catch(e){ toast.error('Erreur lors de la mise à jour.'); } finally{isSubmitting.value=false;}
};

const createExpense = async () => {
  if(!trip.value) return; isSubmitting.value=true;
  try {
    await api.post(`/trips/${trip.value.id}/expenses`,{
      tripId: trip.value.id,
      title:newExpense.value.title,
      amount:newExpense.value.amount,
      category:newExpense.value.category,
      paidBy:newExpense.value.paidBy || currentUser.value?.id,
      expenseDate: `${newExpense.value.date} 00:00:00`
    });
    showExpenseModal.value=false;
    newExpense.value={title:'',amount:0,category:'food',paidBy:null,date:new Date().toISOString().split('T')[0]};
    await fetchTripData();
    toast.success('Dépense ajoutée !');
  }
  catch(e){ toast.error('Erreur lors de l\'ajout de la dépense.'); } finally{isSubmitting.value=false;}
};

const updateExpense = async () => {
  if(!editingExpense.value) return; isSubmitting.value=true;
  try {
    await api.patch(`/expenses/${editingExpense.value.id}`,{
      title:editingExpense.value.title,
      amount:editingExpense.value.amount,
      category:editingExpense.value.category,
      paidBy:editingExpense.value.paidBy,
      expenseDate: `${editingExpense.value.expenseDate} 00:00:00`
    });
    showEditExpenseModal.value=false;
    editingExpense.value=null;
    await fetchTripData();
    toast.success('Dépense mise à jour !');
  }
  catch(e){ toast.error('Erreur lors de la mise à jour de la dépense.'); } finally{isSubmitting.value=false;}
};

const openEditExpenseModal = (exp:any) => { 
  editingExpense.value={...exp,expenseDate:new Date(exp.expenseDate).toISOString().split('T')[0]}; 
  showEditExpenseModal.value=true; 
};

const openEditStopModal = (stop:any) => {
  isEditingStop.value = true;
  editingStopId.value = stop.id;
  selectedDateForAdd.value = extractDateLocal(stop.arrivalDate);
  preSelectedPlace.value = {
    name: stop.title,
    latitude: stop.latitude,
    longitude: stop.longitude,
    formatted_address: stop.address || stop.title,
    existingStop: stop
  };
  showAddStopModal.value = true;
};

const closeAddStopModal = () => {
  showAddStopModal.value = false;
  preSelectedPlace.value = null;
  isEditingStop.value = false;
  editingStopId.value = null;
};

const inviteParticipant = async () => {
  if(!trip.value) return; isSubmitting.value=true;
  try {
    await api.post(`/trips/${trip.value.id}/invite`,{email:inviteEmail.value});
    showInviteModal.value=false; inviteEmail.value='';
    await fetchTripData();
    toast.success('Invitation envoyée !');
  }
  catch(e){ toast.error('Erreur lors de l\'invitation.'); } finally{isSubmitting.value=false;}
};

const acceptInvitation = async () => {
  const piv = myParticipant.value?.pivot as any; if(!piv?.id) return; isSubmitting.value=true;
  try { await api.post(`/invitations/${piv.id}/accept`); await fetchTripData(); toast.success('Invitation acceptée !'); } catch(e){ toast.error('Erreur lors de l\'acceptation.'); } finally{isSubmitting.value=false;}
};

const getParticipantAction = (p:any): 'remove'|'leave'|null => { 
  if(!trip.value||!currentUser.value) return null; 
  return trip.value.creatorId===currentUser.value.id ? (p.id===currentUser.value.id?null:'remove') : (p.id===currentUser.value.id?'leave':null); 
};

const openDeleteModal = (type:'expense'|'stop'|'participant', item:any) => {
  const action = type==='participant'?getParticipantAction(item):undefined;
  if(type==='participant'&&!action) return;
  itemToDelete.value={type,id:item.id,name:type==='expense'?item.title:item.title||item.fullName,extraId:item.id,action};
  showDeleteConfirmModal.value=true;
};

const deleteStopAndExpense = async (stop: any) => {
  if (!trip.value) return;
  const stopDate = extractDateLocal(stop.arrivalDate);
  const relatedExpense = trip.value.expenses?.find((e: any) => 
    e.title === stop.title && extractDateLocal(e.expenseDate) === stopDate
  );
  itemToDelete.value = { 
    type: 'stop', 
    id: stop.id, 
    name: stop.title,
    hasRelatedExpense: !!relatedExpense,
    relatedExpenseId: relatedExpense?.id
  };
  showDeleteConfirmModal.value = true;
};

const confirmDeleteItem = async () => {
  if(!itemToDelete.value||!trip.value) return; isSubmitting.value=true;
  try {
    if(itemToDelete.value.type==='expense') {
      await api.delete(`/expenses/${itemToDelete.value.id}`);
    }
    else if(itemToDelete.value.type==='stop') {
      if (itemToDelete.value.relatedExpenseId) {
        await api.delete(`/expenses/${itemToDelete.value.relatedExpenseId}`);
      }
      await api.delete(`/stops/${itemToDelete.value.id}`);
    }
    else if(itemToDelete.value.type==='participant') { 
      await api.delete(`/trips/${trip.value.id}/participants/${itemToDelete.value.extraId}`); 
      if(itemToDelete.value.action==='leave'){router.push('/my-trips');return;} 
    }
    if (itemToDelete.value.type === 'stop') {
      toast.success(`"${itemToDelete.value.name}" supprimé de l'itinéraire.`);
    } else if (itemToDelete.value.type === 'expense') {
      toast.success(`Dépense "${itemToDelete.value.name}" supprimée.`);
    } else if (itemToDelete.value.type === 'participant') {
      toast.info(itemToDelete.value.action === 'leave' ? 'Vous avez quitté le voyage.' : `${itemToDelete.value.name} retiré du voyage.`);
    }
    showDeleteConfirmModal.value=false;
    itemToDelete.value=null;
    await fetchTripData();
    await nextTick();
    refreshMap(false);
  } catch(e){} finally{isSubmitting.value=false;}
};

const openTripStopInfoWindow = (stop: any, marker: google.maps.Marker) => {
  if (!tripMap.value) return;
  if (!sharedPoiInfoWindow.value) sharedPoiInfoWindow.value = new google.maps.InfoWindow();
  const isReturn = stop.isReturnStep;
  const isAccommodation = stop.isAccommodationHub;
  const dateStr = formatDate(stop.arrivalDate || stop.departureDate);
  const typeStr = formatStopType(stop.type);
  const content = `
    <div class="poi-popup-container overflow-hidden rounded-2xl bg-white dark:bg-[#161618] min-w-[240px] max-w-[260px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-zinc-200 dark:border-white/10">
      <div class="w-full h-2" style="background-color: ${getStopColor(stop.type)}"></div>
      <div class="p-4">
        <div class="flex items-center gap-2 mb-1">
          <i class="${getStopIconClass(stop.type)} text-xs text-zinc-400"></i>
          <span class="text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">${typeStr}</span>
        </div>
        <h4 class="font-black text-sm text-zinc-900 dark:text-zinc-100 leading-tight">${stop.displayTitle || stop.title}</h4>
        <p class="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1.5">
          <i class="fi fi-rr-calendar text-[9px]"></i>
          <span>${dateStr} ${formatTime(stop.arrivalDate) ? '· ' + formatTime(stop.arrivalDate) : ''}</span>
        </p>
        <div class="mt-4 flex flex-col gap-2">
          ${!isReturn && !isAccommodation ? `
            <button id="btn-delete-stop-${stop.id}" class="w-full py-2.5 bg-rose-500/10 text-rose-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-500 hover:text-white transition-all cursor-pointer border border-rose-500/20 flex items-center justify-center gap-2">
              <i class="fi fi-rr-trash text-sm"></i> Supprimer du voyage
            </button>
          ` : `
            <p class="text-[9px] text-zinc-400 italic text-center py-2">Étape système (non supprimable)</p>
          `}
        </div>
      </div>
    </div>
  `;
  sharedPoiInfoWindow.value.setContent(content);
  sharedPoiInfoWindow.value.open(tripMap.value, marker);
  if (!isReturn && !isAccommodation) {
    google.maps.event.addListenerOnce(sharedPoiInfoWindow.value, 'domready', () => {
      const btn = document.getElementById(`btn-delete-stop-${stop.id}`);
      if (btn) btn.onclick = () => { deleteStopAndExpense(stop); sharedPoiInfoWindow.value?.close(); };
    });
  }
};

const openHubModal = (activity:any, date:string) => { if(!activity.isMorningDeparture) return; editingHubDay.value=date; hubStartTime.value=extractTimeLocal(activity.departureDate)||'09:00'; showHubModal.value=true; };

const updateHubTime = async () => {
  if(!trip.value) return; isSubmitting.value=true;
  try {
    const s={...(trip.value.settings||{})};
    s[editingHubDay.value]={...(s[editingHubDay.value]||{}),startTime:hubStartTime.value};
    await api.patch(`/trips/${trip.value.id}`,{settings:s});
    trip.value.settings=s; showHubModal.value=false;
    await calculateItineraryByDay(); refreshMap(false);
    toast.success('Horaire de départ mis à jour !');
  }
  catch(e){ toast.error('Erreur lors de la mise à jour.'); } finally{isSubmitting.value=false;}
};

const saveRouteSettings = async () => {
  if(!trip.value) return; isSubmitting.value=true;
  try {
    await api.patch(`/trips/${trip.value.id}`,{carConsumption:routeSettings.value.carConsumption,fuelPrice:routeSettings.value.fuelPrice});
    showRouteSettingsModal.value=false;
    await calculateItineraryByDay(); refreshMap(false);
    toast.success('Paramètres du véhicule sauvegardés !');
  }
  catch(e){ toast.error('Erreur lors de la sauvegarde.'); } finally{isSubmitting.value=false;}
};

const handleClickOutside = (e:MouseEvent) => { 
  if(mapHeaderRef.value && !mapHeaderRef.value.contains(e.target as Node)) showQuickSuggestions.value=false; 
};

watch(currentDayIndex, (idx) => {
  const day=daysData.value[idx]; 
  if(day) focusDayOnMap(day); 
});

watch(routeFilters, () => redrawOnlyRoutes(), { deep: true });

watch(tripMap, (m) => { 
  if(m) {
    m.addListener('click', (event: any) => {
      if (event.placeId) return;
      if (sharedPoiInfoWindow.value) sharedPoiInfoWindow.value.close();
      if (!mapSearchQuery.value.trim()) {
        currentSearchSessionId++;
        if (activeExplorationMarker) {
          activeExplorationMarker.setMap(null);
          activeExplorationMarker = null;
        }
        clearSearchMarkers();
      }
    }); 
  }
});

onMounted(async () => {
  try {
    currentUser.value = await getMe();
    await fetchTripData();
    await nextTick();
    await initMap();
    document.addEventListener('click', handleClickOutside);
  } catch (err: any) {
    error.value = 'Une erreur est survenue lors du chargement des données.';
    loading.value = false;
  }
});

onUnmounted(() => document.removeEventListener('click', handleClickOutside));

const quickSuggestions = [ 
  {label:'Hôtels',icon:'fi fi-rr-bed'}, 
  {label:'Restaurants',icon:'fi fi-rr-restaurant'}, 
  {label:'Musées',icon:'fi fi-rr-bank'}, 
  {label:'Parcs',icon:'fi fi-rr-tree'}, 
  {label:'Essence',icon:'fi fi-rr-gas-pump'} 
];
</script>

<template>
  <div class="flex flex-col flex-grow overflow-hidden pt-14">
    <div v-if="loading" class="flex flex-col flex-grow overflow-hidden bg-zinc-50 dark:bg-[#0c0c0e] animate-pulse">
      <div class="shrink-0 flex items-center justify-between px-4 h-[52px] bg-white dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800/50">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-xl bg-zinc-200 dark:bg-zinc-800"></div>
          <div class="h-4 w-36 rounded-lg bg-zinc-200 dark:bg-zinc-800"></div>
        </div>
        <div class="flex items-center gap-2">
          <div class="h-8 w-8 rounded-xl bg-zinc-200 dark:bg-zinc-800"></div>
          <div class="h-8 w-8 rounded-xl bg-zinc-200 dark:bg-zinc-800"></div>
          <div class="h-8 w-8 rounded-xl bg-zinc-200 dark:bg-zinc-800"></div>
        </div>
      </div>
      <div class="flex-grow flex overflow-hidden" style="height: calc(100vh - 104px);">
        <aside class="w-[340px] shrink-0 flex flex-col p-3 gap-3">
          <div class="p-4 bg-white dark:bg-zinc-900 rounded-[1.5rem] border border-zinc-200 dark:border-white/5 space-y-3">
            <div class="flex items-center justify-between">
              <div class="space-y-1.5">
                <div class="h-2.5 w-12 rounded-full bg-zinc-200 dark:bg-zinc-800"></div>
                <div class="h-6 w-28 rounded-lg bg-zinc-200 dark:bg-zinc-800"></div>
              </div>
              <div class="flex gap-1.5">
                <div class="w-7 h-7 rounded-lg bg-zinc-200 dark:bg-zinc-800"></div>
                <div class="w-7 h-7 rounded-lg bg-zinc-200 dark:bg-zinc-800"></div>
              </div>
            </div>
            <div class="h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-800"></div>
            <div class="grid grid-cols-2 gap-2">
              <div class="h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800"></div>
              <div class="h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800"></div>
            </div>
          </div>
          <div class="flex-grow bg-white dark:bg-zinc-900 rounded-[1.5rem] border border-zinc-200 dark:border-white/5 overflow-hidden flex flex-col">
            <div class="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800/50 flex items-center justify-between">
              <div class="h-2.5 w-20 rounded-full bg-zinc-200 dark:bg-zinc-800"></div>
              <div class="h-4 w-4 rounded bg-zinc-200 dark:bg-zinc-800"></div>
            </div>
            <div class="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800/30 flex items-center gap-2">
              <div class="h-6 w-6 rounded-lg bg-zinc-200 dark:bg-zinc-800"></div>
              <div class="flex-grow h-3 rounded-full bg-zinc-200 dark:bg-zinc-800"></div>
              <div class="h-6 w-6 rounded-lg bg-zinc-200 dark:bg-zinc-800"></div>
            </div>
            <div class="flex-grow px-3 py-3 space-y-2">
              <div v-for="i in 5" :key="i" class="flex items-center gap-2.5 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/30">
                <div class="w-7 h-7 rounded-lg bg-zinc-200 dark:bg-zinc-800 shrink-0"></div>
                <div class="flex-grow space-y-1.5">
                  <div class="h-2.5 rounded-full bg-zinc-200 dark:bg-zinc-800" :style="{width: `${55 + i * 8}%`}"></div>
                  <div class="h-2 w-16 rounded-full bg-zinc-100 dark:bg-zinc-800/60"></div>
                </div>
              </div>
            </div>
            <div class="px-3 pb-3 pt-2 space-y-1.5 border-t border-zinc-100 dark:border-zinc-800/50">
              <div class="h-8 w-full rounded-xl bg-zinc-100 dark:bg-zinc-800"></div>
              <div class="h-8 w-full rounded-xl bg-zinc-200 dark:bg-zinc-800"></div>
            </div>
          </div>
        </aside>
        <div class="flex-grow rounded-[2.5rem] my-3 mr-3 bg-zinc-200 dark:bg-zinc-800 overflow-hidden relative">
          <div class="absolute inset-0 bg-gradient-to-br from-zinc-300/50 to-zinc-200/20 dark:from-zinc-700/50 dark:to-zinc-800/20"></div>
          <div class="absolute top-6 left-6 w-80 h-12 rounded-2xl bg-white/80 dark:bg-zinc-900/80"></div>
          <div class="absolute top-6 right-6 flex flex-col gap-2">
            <div class="w-11 h-11 rounded-2xl bg-white/80 dark:bg-zinc-900/80"></div>
          </div>
          <div class="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 bg-white/70 dark:bg-zinc-900/80 rounded-2xl">
            <div v-for="i in 4" :key="i" class="h-8 w-20 rounded-xl bg-zinc-200/80 dark:bg-zinc-800/80"></div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="error" class="flex-grow flex items-center justify-center bg-zinc-50 dark:bg-[#0c0c0e]">
      <div class="text-center p-8">
        <i class="fi fi-rr-exclamation text-rose-400 text-4xl mb-4 block"></i>
        <p class="text-zinc-900 dark:text-white font-bold">{{ error }}</p>
        <button @click="router.push('/my-trips')" class="btn-primary mt-4">Mes voyages</button>
      </div>
    </div>

    <div v-else-if="trip" class="flex flex-col bg-zinc-50 dark:bg-[#0c0c0e] text-zinc-900 dark:text-zinc-100 overflow-hidden flex-grow">
      <div data-onboarding="dash-header" class="h-12 shrink-0 bg-white dark:bg-[#161618] border-b border-zinc-200 dark:border-zinc-800/50 flex items-center justify-between px-6 z-40">
        <div class="flex items-center gap-4">
          <h2 class="text-sm font-black flex items-center gap-2">
            <span class="w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0"></span>
            {{ trip.title }}
          </h2>
          <span class="badge" :class="{
            'badge-green': trip.status === 'active',
            'badge-zinc': trip.status === 'planning',
            'badge-violet': trip.status === 'completed',
            'badge-rose': trip.status === 'cancelled'
          }">
            <i :class="getStatusIcon(trip.status)"></i>{{ formatStatus(trip.status) }}
          </span>
          <div data-onboarding="dash-participants" class="flex -space-x-3">
            <button v-for="p in trip.participants.slice(0, 5)" :key="p.id"
              @click="showParticipantsModal = true"
              class="w-8 h-8 rounded-full border-2 border-white dark:border-[#161618] bg-zinc-100 dark:bg-zinc-800 overflow-hidden cursor-pointer hover:-translate-y-0.5 transition-all shadow-sm"
              :title="p.fullName">
              <img v-if="p.avatar" :src="getAvatarUrl(p.avatar)" class="w-full h-full object-cover" />
              <div v-else class="w-full h-full flex items-center justify-center text-[10px] font-black text-zinc-500 dark:text-zinc-400">{{ getInitials(p.fullName) }}</div>
            </button>
            <button @click="showInviteModal = true"
              class="w-8 h-8 rounded-full border-2 border-dashed border-zinc-300 dark:border-zinc-600 flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-primary-400 hover:border-primary-400 transition-all cursor-pointer bg-white dark:bg-transparent">
              <i class="fi fi-rr-plus text-[10px]"></i>
            </button>
          </div>
          <button v-if="trip.status === 'completed' && !trip.isPublic && trip.creatorId === currentUser?.id" 
            @click="showPublicModal = true"
            class="ml-2 px-3 py-1.5 rounded-xl bg-violet-500/10 text-violet-500 text-[10px] font-black uppercase tracking-widest hover:bg-violet-500 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 border border-violet-500/20">
            <i class="fi fi-rr-share"></i> Rendre public
          </button>
          <span v-else-if="trip.isPublic" class="ml-2 px-3 py-1.5 rounded-xl bg-primary-400/10 text-primary-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-primary-400/20">
            <i class="fi fi-rr-globe"></i> Public ({{ trip.category }})
          </span>
        </div>
        <div class="flex items-center gap-2">
          <button v-if="trip.status === 'active'" @click="router.push(`/trips/${tripId}/live`)"
            class="px-3 py-1.5 rounded-xl bg-primary-400 text-zinc-950 text-[10px] font-black uppercase tracking-widest hover:bg-primary-500 transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_0_12px_rgba(159,224,0,0.3)] animate-pulse-slow">
            <span class="w-1.5 h-1.5 rounded-full bg-zinc-950 animate-pulse"></span>Mode Live
          </button>
          <button @click="router.push(`/trips/${tripId}/settings`)"
            class="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 hover:text-primary-400 transition-all cursor-pointer flex items-center gap-1.5">
            <i class="fi fi-rr-settings-sliders"></i>Paramètres
          </button>
        </div>
      </div>

      <div v-if="isInvitationPending" class="shrink-0 px-6 py-3 bg-amber-500/10 border-b border-amber-500/30 flex items-center justify-between">
        <span class="text-sm text-amber-600 dark:text-amber-400 font-bold flex items-center gap-2">
          <i class="fi fi-rr-envelope"></i>Vous avez été invité à rejoindre ce voyage.
        </span>
        <button @click="acceptInvitation" :disabled="isSubmitting" class="btn-primary !py-1.5 !px-4 !text-xs">
          Accepter l'invitation
        </button>
      </div>

      <div class="flex-grow flex overflow-hidden" style="height: calc(100vh - 104px);">
        <aside class="w-[340px] shrink-0 flex flex-col bg-zinc-50 dark:bg-[#0c0c0e] overflow-hidden z-30 transition-all duration-300"
          :class="{'!w-0 opacity-0 pointer-events-none': showItineraryDrawer && showBudgetDrawer}">
          <section data-onboarding="dash-budget" class="m-3 p-4 bg-white dark:bg-zinc-900 rounded-[1.5rem] border border-zinc-200 dark:border-white/5 relative overflow-hidden shrink-0">
            <div class="absolute -top-10 -right-10 w-40 h-40 bg-primary-400/5 rounded-full blur-3xl pointer-events-none"></div>
            <div class="flex items-center justify-between mb-3 relative">
              <div>
                <p class="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 mb-0.5">Budget</p>
                <h3 class="text-xl font-black tracking-tighter text-zinc-900 dark:text-zinc-100">
                  {{ Math.round(budgetStats.spent) }}€
                  <span class="text-zinc-500 dark:text-zinc-400 text-xs font-bold"> / {{ budgetStats.total }}€</span>
                </h3>
              </div>
              <div class="flex gap-1.5">
                <button @click="showExpenseModal = true" class="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-primary-400 hover:text-zinc-900 transition-all cursor-pointer"><i class="fi fi-rr-plus text-xs"></i></button>
                <button @click="showBudgetDrawer = true" class="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-primary-400 transition-all cursor-pointer"><i class="fi fi-rr-wallet text-xs"></i></button>
              </div>
            </div>
            <div class="h-1.5 w-full bg-zinc-100 dark:bg-white/5 rounded-full overflow-hidden mb-3">
              <div class="h-full rounded-full transition-all duration-1000" :class="budgetStats.percentage > 90 ? 'bg-rose-500' : budgetStats.percentage > 70 ? 'bg-amber-400' : 'bg-primary-400 shadow-[0_0_8px_#ccff00]'" :style="{ width: `${budgetStats.percentage}%` }"></div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div class="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-white/5 rounded-xl border border-zinc-100 dark:border-white/5"><i class="fi fi-rr-gas-pump text-[10px] text-zinc-500 dark:text-zinc-400"></i><p class="text-[10px] font-black text-zinc-900 dark:text-zinc-100">{{ Math.round(estimatedFuelCost) }}€</p></div>
              <div class="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-white/5 rounded-xl border border-zinc-100 dark:border-white/5"><i class="fi fi-rr-road text-[10px] text-zinc-500 dark:text-zinc-400"></i><p class="text-[10px] font-black text-zinc-900 dark:text-zinc-100">{{ Math.round(estimatedTollCost) }}€</p></div>
            </div>
          </section>

          <section class="mx-3 mb-3 flex-grow flex flex-col bg-white dark:bg-zinc-900 rounded-[1.5rem] border border-zinc-200 dark:border-white/5 overflow-hidden min-h-0 relative">
            <div class="absolute -top-10 -left-10 w-40 h-40 bg-primary-400/5 rounded-full blur-3xl pointer-events-none"></div>
            <div class="px-4 py-3 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/50 shrink-0 relative">
              <h3 class="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Itinéraire</h3>
              <button @click="showRouteSettingsModal = true" class="w-6 h-6 rounded-lg flex items-center justify-center text-zinc-400 dark:text-zinc-600 hover:text-primary-400 transition-all cursor-pointer"><i class="fi fi-rr-settings text-xs"></i></button>
            </div>
            <div data-onboarding="dash-itinerary" class="px-4 py-2 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800/30 shrink-0">
              <button @click="currentDayIndex = Math.max(0, currentDayIndex - 1)" :disabled="currentDayIndex === 0" class="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white disabled:opacity-30 transition-all cursor-pointer"><i class="fi fi-rr-angle-small-left text-xs"></i></button>
              <div class="flex-grow text-center">
                <p class="text-[10px] font-black text-zinc-900 dark:text-zinc-100">J{{ currentDayIndex + 1 }} <span class="text-zinc-400 dark:text-zinc-600">/ {{ daysData.length }}</span></p>
                <p v-if="currentDay" class="text-[9px] text-primary-400 font-bold">
                  {{ formatDate(currentDay.date) }} 
                  <span v-if="getCityNameForDay(currentDay)" class="text-zinc-400 dark:text-zinc-500 ml-1">· {{ getCityNameForDay(currentDay) }}</span>
                </p>
              </div>
              <button @click="currentDayIndex = Math.min(daysData.length - 1, currentDayIndex + 1)" :disabled="currentDayIndex >= daysData.length - 1" class="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white disabled:opacity-30 transition-all cursor-pointer"><i class="fi fi-rr-angle-small-right text-xs"></i></button>
            </div>
            <div class="flex-grow overflow-y-auto px-3 py-3 space-y-1.5 custom-scrollbar min-h-0">
              <div v-if="!currentDay || currentDay.activities.length === 0" class="py-8 text-center">
                <i class="fi fi-rr-sun text-xl text-zinc-200 dark:text-zinc-800 mb-1 block"></i>
                <p class="text-[9px] text-zinc-400 dark:text-zinc-600 uppercase tracking-wider font-black">Journée libre</p>
              </div>
              <template v-if="currentDay" v-for="(act, idx) in currentDay.activities" :key="act.id">
                <div @click="focusStopOnMap(act)" class="p-2.5 bg-zinc-50 dark:bg-white/5 rounded-xl border border-zinc-100 dark:border-white/5 hover:border-primary-400/30 transition-all cursor-pointer group/act flex items-center gap-3" :class="{'border-cyan-500/30 bg-cyan-500/10 dark:bg-cyan-500/10': act.isReturnStep}">
                  <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all" :class="act.isMorningDeparture ? 'bg-amber-400/10 text-amber-500 dark:text-amber-400' : act.isEveningReturn ? 'bg-violet-500/10 text-violet-500 dark:text-violet-400' : act.isReturnStep ? 'bg-cyan-500/10 text-cyan-500 dark:text-cyan-400' : 'bg-primary-400/10 text-primary-500 dark:text-primary-400 group-hover/act:bg-primary-400 group-hover/act:text-zinc-900'"><i :class="getStopIconClass(act.type)" class="text-[10px]"></i></div>
                  <div class="flex-grow min-w-0">
                    <p class="text-[11px] font-black truncate leading-tight text-zinc-900 dark:text-zinc-100">{{ act.displayTitle || act.title }}</p>
                    <p class="text-[9px] text-zinc-500 dark:text-zinc-400 leading-tight">{{ formatTime(act.arrivalDate) || formatStopType(act.type) }}</p>
                  </div>
                  <div class="flex items-center gap-1 opacity-0 group-hover/act:opacity-100 transition-all shrink-0">
                    <button v-if="!act.isReturnStep && !act.isMorningDeparture && !act.isEveningReturn" @click.stop="openEditStopModal(act)" class="w-5 h-5 rounded flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-primary-400 cursor-pointer"><i class="fi fi-rr-edit text-[9px]"></i></button>
                    <button v-if="!act.isAccommodationHub && !act.isReturnStep" @click.stop="openDeleteModal('stop', act)" class="w-5 h-5 rounded flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-rose-400 cursor-pointer"><i class="fi fi-rr-trash text-[9px]"></i></button>
                  </div>
                </div>
                <div v-if="(act.travelTimeToNext || (act.returnRouteData && act.isReturnStep)) && Number(idx) < (currentDay?.activities?.length || 0) - 1" class="flex items-center gap-2 px-2 ml-1">
                  <div class="flex flex-col items-center shrink-0">
                    <div class="w-px h-2 bg-zinc-200 dark:bg-zinc-800"></div>
                    <i class="fi fi-rr-car-side text-[8px] text-zinc-400 dark:text-zinc-500 my-0.5"></i>
                    <div class="w-px h-2 bg-zinc-200 dark:bg-zinc-800"></div>
                  </div>
                  <div class="flex flex-wrap items-center gap-2 text-[8px] font-bold text-zinc-400 dark:text-zinc-400">
                    <span>{{ formatDuration(act.travelTimeToNext || act.returnRouteData?.duration) }} · {{ act.distanceToNext || act.returnRouteData?.distance }}km</span>
                    <span v-if="act.fuelCostNext" class="flex items-center gap-0.5 text-amber-600 dark:text-amber-500/80">
                      <i class="fi fi-rr-gas-pump"></i>{{ act.fuelCostNext.toFixed(2) }}€
                    </span>
                    <span v-if="act.tollCostNext" class="flex items-center gap-0.5 text-violet-600 dark:text-violet-400/80">
                      <i class="fi fi-rr-road"></i>{{ act.tollCostNext.toFixed(2) }}€
                    </span>
                  </div>
                </div>
              </template>
            </div>
            <div class="px-3 pb-3 space-y-1.5 shrink-0 border-t border-zinc-100 dark:border-zinc-800/50 pt-2.5">
              <button v-if="!isInvitationPending" @click="onSidebarAddClick" class="w-full py-2 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-600 hover:text-primary-400 hover:border-primary-400/30 transition-all cursor-pointer">Ajouter</button>
              <button @click="showItineraryDrawer = true" class="w-full py-2 rounded-xl bg-primary-400 text-zinc-900 text-[9px] font-black uppercase tracking-widest hover:bg-primary-500 transition-all cursor-pointer">Itinéraire complet</button>
            </div>
          </section>
        </aside>

        <transition name="panel-slide">
          <div v-if="showItineraryDrawer" class="w-[380px] shrink-0 flex flex-col bg-white dark:bg-zinc-900 rounded-[1.5rem] border border-zinc-200 dark:border-white/5 m-3 ml-0 overflow-hidden">
            <header class="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between shrink-0">
              <div class="flex items-center gap-2.5">
                <div class="w-7 h-7 rounded-lg bg-primary-400/10 flex items-center justify-center text-primary-500 dark:text-primary-400 shrink-0"><i class="fi fi-rr-map-marker text-xs"></i></div>
                <div>
                  <h2 class="text-sm font-black tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight">Itinéraire complet</h2>
                  <p class="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold">{{ formatDateRange(trip.startDate, trip.endDate) }}</p>
                </div>
              </div>
              <button @click="showItineraryDrawer = false" class="w-7 h-7 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-all cursor-pointer shrink-0"><i class="fi fi-rr-cross text-xs"></i></button>
            </header>
            <div class="flex-grow overflow-y-auto custom-scrollbar">
              <div v-for="(day, idx) in daysData" :key="day.date">
                <div class="px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 sticky top-0 z-10">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-1.5">
                      <span class="text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">J{{ idx + 1 }} · {{ formatDate(day.date) }}</span>
                      <span v-if="getCityNameForDay(day)" class="inline-flex items-center gap-1 text-[8px] font-black text-primary-500 dark:text-primary-400 bg-primary-400/10 px-1.5 py-0.5 rounded-md">
                        <i class="fi fi-rr-building text-[7px]"></i>{{ getCityNameForDay(day) }}
                      </span>
                    </div>
                    <button v-if="!isInvitationPending" @click="focusMapSearchForDay(day.date)" class="text-[9px] font-black text-primary-500 dark:text-primary-400 hover:underline cursor-pointer">+ Ajouter</button>
                  </div>
                </div>
                <div class="px-3 py-2 space-y-1.5">
                  <div v-for="stop in day.activities" :key="stop.id">
                    <div @click="focusStopOnMap(stop)"
                      class="flex items-center gap-2.5 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/40 hover:border-primary-400/30 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-all cursor-pointer group"
                      :class="{'border-cyan-500/20 bg-cyan-500/5 dark:bg-cyan-500/5': stop.isReturnStep}">
                      <div class="w-6 h-6 rounded-lg shrink-0 flex items-center justify-center text-[10px]"
                        :class="stop.isMorningDeparture ? 'bg-amber-400/10 text-amber-500' : stop.isReturnStep ? 'bg-cyan-500/10 text-cyan-500' : 'bg-primary-400/10 text-primary-500 dark:text-primary-400'">
                        <i :class="getStopIconClass(stop.type)"></i>
                      </div>
                      <div class="flex-grow min-w-0">
                        <p class="text-[11px] font-black truncate text-zinc-900 dark:text-zinc-100 leading-tight">{{ stop.displayTitle || stop.title }}</p>
                        <p class="text-[9px] text-zinc-400 dark:text-zinc-500 leading-tight">
                          {{ formatStopType(stop.type) }}<span v-if="formatTime(stop.arrivalDate)"> · {{ formatTime(stop.arrivalDate) }}</span>
                        </p>
                      </div>
                      <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                        <button v-if="!stop.isReturnStep && !stop.isMorningDeparture && !stop.isEveningReturn" @click.stop="openEditStopModal(stop); showItineraryDrawer = false" class="w-5 h-5 rounded flex items-center justify-center text-zinc-400 hover:text-primary-400 cursor-pointer"><i class="fi fi-rr-edit text-[9px]"></i></button>
                        <button v-if="!stop.isAccommodationHub && !stop.isReturnStep" @click.stop="openDeleteModal('stop', stop)" class="w-5 h-5 rounded flex items-center justify-center text-zinc-400 hover:text-rose-400 cursor-pointer"><i class="fi fi-rr-trash text-[9px]"></i></button>
                      </div>
                    </div>
                    <div v-if="stop.travelTimeToNext && day.activities.indexOf(stop) < day.activities.length - 1" class="flex items-center gap-1.5 pl-4 py-0.5">
                      <div class="w-px h-3 bg-zinc-200 dark:bg-zinc-800 ml-2.5"></div>
                      <i class="fi fi-rr-car-side text-[7px] text-zinc-300 dark:text-zinc-600"></i>
                      <span class="text-[8px] text-zinc-400 dark:text-zinc-500">{{ formatDuration(stop.travelTimeToNext) }} · {{ stop.distanceToNext }}km</span>
                      <span v-if="stop.fuelCostNext" class="text-[8px] text-amber-500/80 flex items-center gap-0.5">· <i class="fi fi-rr-gas-pump"></i>{{ stop.fuelCostNext.toFixed(1) }}€</span>
                      <span v-if="stop.tollCostNext" class="text-[8px] text-violet-500/80 flex items-center gap-0.5">· <i class="fi fi-rr-road"></i>{{ stop.tollCostNext.toFixed(1) }}€</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </transition>

        <main data-onboarding="dash-map" class="flex-grow relative bg-zinc-100 dark:bg-[#0c0c0e] overflow-hidden rounded-[2.5rem] my-3 mr-3 border border-zinc-200 dark:border-zinc-800/50" :class="{'ml-0': showItineraryDrawer || showBudgetDrawer}">
          <div id="trip-map" class="w-full h-full"></div>
          
          <div class="absolute top-6 left-6 w-full max-w-[420px] z-10 pointer-events-none" ref="mapHeaderRef">
            <div class="relative pointer-events-auto flex items-center">
              <input id="map-search-input" v-model="mapSearchQuery" type="text" @focus="showQuickSuggestions = true" class="w-full bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl border border-zinc-200 dark:border-zinc-700 rounded-2xl pl-12 pr-10 py-4 text-sm font-bold shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400 transition-all outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500" placeholder="Rechercher un lieu ou une adresse..." />
              <span class="absolute left-4 flex items-center text-primary-500 dark:text-primary-400 pointer-events-none z-20"><i class="fi fi-rr-search text-xl"></i></span>
              <button v-if="mapSearchQuery" @click="clearMapSearch" class="absolute right-4 flex items-center text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 cursor-pointer transition-colors z-20"><i class="fi fi-rr-cross-small text-xl"></i></button>
              <transition name="fade">
                <div v-if="showQuickSuggestions && !mapSearchQuery" class="absolute top-full mt-2 w-full bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl border border-zinc-200 dark:border-zinc-700 rounded-xl p-2 shadow-2xl">
                  <p class="text-[8px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2 px-1">Suggestions</p>
                  <div class="grid grid-cols-5 gap-1">
                    <button v-for="s in quickSuggestions" :key="s.label" @click="applyQuickSearch(s.label)" class="flex flex-col items-center gap-1 py-2 rounded-lg bg-zinc-50 dark:bg-white/5 hover:bg-primary-400/10 hover:text-primary-500 dark:hover:text-primary-400 text-zinc-500 dark:text-zinc-400 transition-all cursor-pointer"><i :class="s.icon" class="text-xs"></i><span class="text-[7px] font-black">{{ s.label }}</span></button>
                  </div>
                </div>
              </transition>
            </div>
          </div>

          <div class="absolute top-6 right-6 flex flex-col gap-2 z-10">
            <button @click="fitBounds()" class="w-11 h-11 rounded-2xl bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-xl border border-zinc-200 dark:border-zinc-700 shadow-xl dark:shadow-2xl flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-primary-500 dark:hover:text-primary-400 transition-all cursor-pointer hover:border-primary-400/30">
              <i class="fi fi-rr-location-crosshairs text-base"></i>
            </button>
          </div>

          <div class="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 p-1.5 bg-white/70 dark:bg-[#1C1C1E]/95 backdrop-blur-xl dark:backdrop-blur-2xl border border-zinc-200/50 dark:border-zinc-700/50 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <button @click="routeFilters.first = !routeFilters.first" :class="[routeFilters.first ? 'bg-[#ff9900]/10 border-[#ff9900]/30 text-[#ff9900]' : 'bg-zinc-50 dark:bg-white/5 border-transparent text-zinc-400 dark:text-zinc-500 opacity-50']" class="px-3 py-2 rounded-xl border transition-all flex items-center gap-2 cursor-pointer">
              <div class="w-3 h-1 rounded-full bg-[#ff9900]"></div>
              <span class="text-[10px] font-black uppercase tracking-widest">Départ</span>
            </button>
            <button @click="routeFilters.main = !routeFilters.main" :class="[routeFilters.main ? 'bg-[#ccff00]/10 border-[#ccff00]/30 text-[#ccff00]' : 'bg-zinc-50 dark:bg-white/5 border-transparent text-zinc-400 dark:text-zinc-500 opacity-50']" class="px-3 py-2 rounded-xl border transition-all flex items-center gap-2 cursor-pointer">
              <div class="w-3 h-1 rounded-full bg-[#ccff00]"></div>
              <span class="text-[10px] font-black uppercase tracking-widest">Trajets</span>
            </button>
            <button @click="routeFilters.activity = !routeFilters.activity" :class="[routeFilters.activity ? 'bg-[#ff00ff]/10 border-[#ff00ff]/30 text-[#ff00ff]' : 'bg-zinc-50 dark:bg-white/5 border-transparent text-zinc-400 dark:text-zinc-500 opacity-50']" class="px-3 py-2 rounded-xl border transition-all flex items-center gap-2 cursor-pointer">
              <div class="w-3 h-1 rounded-full bg-[#ff00ff]"></div>
              <span class="text-[10px] font-black uppercase tracking-widest">Activités</span>
            </button>
            <button @click="routeFilters.return = !routeFilters.return" :class="[routeFilters.return ? 'bg-[#00ffff]/10 border-[#00ffff]/30 text-[#00ffff]' : 'bg-zinc-50 dark:bg-white/5 border-transparent text-zinc-400 dark:text-zinc-500 opacity-50']" class="px-3 py-2 rounded-xl border transition-all flex items-center gap-2 cursor-pointer">
              <div class="w-3 h-1 rounded-full bg-[#00ffff]"></div>
              <span class="text-[10px] font-black uppercase tracking-widest">Retour</span>
            </button>
          </div>
        </main>

        <transition name="panel-slide-right">
          <div v-if="showBudgetDrawer" class="w-[380px] shrink-0 flex flex-col bg-white dark:bg-zinc-900 rounded-[1.5rem] border border-zinc-200 dark:border-white/5 m-3 mr-0 overflow-hidden">
            <header class="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between shrink-0">
              <div class="flex items-center gap-2.5">
                <div class="w-7 h-7 rounded-lg bg-primary-400/10 flex items-center justify-center text-primary-500 dark:text-primary-400 shrink-0"><i class="fi fi-rr-wallet text-xs"></i></div>
                <div>
                  <h2 class="text-sm font-black tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight">Finances &amp; Budget</h2>
                  <p class="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold">Gestion des dépenses</p>
                </div>
              </div>
              <button @click="showBudgetDrawer = false" class="w-7 h-7 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-all cursor-pointer shrink-0"><i class="fi fi-rr-cross text-xs"></i></button>
            </header>
            <div class="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/40 shrink-0">
              <div class="flex items-center justify-between mb-2">
                <div>
                  <p class="text-[8px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-0.5">Dépensé / Budget</p>
                  <p class="text-lg font-black text-zinc-900 dark:text-zinc-100 leading-tight">
                    {{ Math.round(budgetStats.spent) }}€
                    <span class="text-zinc-400 dark:text-zinc-500 text-xs font-bold">/ {{ budgetStats.total }}€</span>
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-[8px] font-black uppercase tracking-widest text-primary-500 dark:text-primary-400 mb-0.5">Restant</p>
                  <p class="text-lg font-black text-primary-500 dark:text-primary-400">{{ Math.round(budgetStats.remaining) }}€</p>
                </div>
              </div>
              <div class="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-700"
                  :class="budgetStats.percentage > 90 ? 'bg-rose-500' : budgetStats.percentage > 70 ? 'bg-amber-400' : 'bg-primary-400'"
                  :style="{ width: `${budgetStats.percentage}%` }"></div>
              </div>
              <div class="flex items-center gap-4 mt-2">
                <span class="text-[8px] font-black text-amber-500/80 flex items-center gap-1"><i class="fi fi-rr-gas-pump"></i>Essence ~{{ Math.round(estimatedFuelCost) }}€</span>
                <span class="text-[8px] font-black text-violet-500/80 flex items-center gap-1"><i class="fi fi-rr-road"></i>Péages ~{{ Math.round(estimatedTollCost) }}€</span>
              </div>
            </div>
            <div class="px-4 py-2.5 shrink-0 border-b border-zinc-100 dark:border-zinc-800/40">
              <button @click="showExpenseModal = true" class="w-full py-2 rounded-xl bg-primary-400 text-zinc-900 text-[10px] font-black uppercase tracking-widest hover:bg-primary-500 transition-all cursor-pointer flex items-center justify-center gap-1.5">
                <i class="fi fi-rr-plus text-xs"></i>Ajouter une dépense
              </button>
            </div>
            <div class="flex-grow overflow-y-auto custom-scrollbar">
              <div v-if="!trip.expenses?.length" class="py-12 text-center">
                <i class="fi fi-rr-receipt text-2xl text-zinc-200 dark:text-zinc-800 mb-2 block"></i>
                <p class="text-[9px] text-zinc-400 dark:text-zinc-600 uppercase tracking-widest font-black">Aucune dépense</p>
              </div>
              <div class="px-3 py-2 space-y-1.5">
                <div v-for="exp in trip.expenses" :key="exp.id"
                  @click="openEditExpenseModal(exp)"
                  class="flex items-center gap-2.5 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/40 hover:border-primary-400/30 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-all cursor-pointer group">
                  <div class="w-7 h-7 rounded-lg bg-primary-400/10 text-primary-500 dark:text-primary-400 flex items-center justify-center shrink-0">
                    <i :class="getCategoryIconClass(exp.category)" class="text-xs"></i>
                  </div>
                  <div class="flex-grow min-w-0">
                    <p class="text-[11px] font-black truncate text-zinc-900 dark:text-zinc-100 leading-tight">{{ exp.title }}</p>
                    <p class="text-[9px] text-zinc-400 dark:text-zinc-500 leading-tight">{{ formatDate(exp.expenseDate) }} · {{ exp.payer?.fullName || '?' }}</p>
                  </div>
                  <div class="flex items-center gap-1.5 shrink-0">
                    <span class="text-xs font-black text-rose-500">-{{ exp.amount }}€</span>
                    <button @click.stop="openEditExpenseModal(exp)" class="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center text-zinc-400 hover:text-primary-400 cursor-pointer transition-all"><i class="fi fi-rr-edit text-[9px]"></i></button>
                    <button @click.stop="openDeleteModal('expense', exp)" class="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center text-zinc-400 hover:text-rose-400 cursor-pointer transition-all"><i class="fi fi-rr-trash text-[9px]"></i></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <div v-if="showExpenseModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-md" @click.self="showExpenseModal = false">
        <div class="w-full max-w-md bg-white dark:bg-[#111113] rounded-[2rem] border border-zinc-200/80 dark:border-white/8 shadow-[0_32px_80px_rgba(0,0,0,0.18)] dark:shadow-[0_32px_80px_rgba(0,0,0,0.7)] overflow-hidden animate-slide-up">
          <div class="h-1 w-full bg-primary-400"></div>
          <div class="px-6 py-5 flex items-center justify-between">
            <div class="flex items-center gap-3.5">
              <div class="w-10 h-10 rounded-2xl bg-primary-400/10 flex items-center justify-center text-primary-500 dark:text-primary-400 shrink-0"><i class="fi fi-rr-receipt text-base leading-none"></i></div>
              <div>
                <h3 class="font-black text-base text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight">Ajouter une dépense</h3>
                <p class="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Saisir une nouvelle dépense</p>
              </div>
            </div>
            <button @click="showExpenseModal = false" class="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-all"><i class="fi fi-rr-cross-small text-base leading-none"></i></button>
          </div>
          <form @submit.prevent="createExpense" class="px-6 pb-6 space-y-4">
            <div>
              <label class="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-widest mb-1.5 block">Titre</label>
              <input v-model="newExpense.title" required class="w-full bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 dark:text-zinc-100 outline-none transition-all" placeholder="Ex: Plein d'essence" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-widest mb-1.5 block">Montant (€)</label>
                <input type="number" v-model="newExpense.amount" required min="0" step="0.01" class="w-full bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 dark:text-zinc-100 outline-none transition-all" />
              </div>
              <div>
                <label class="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-widest mb-1.5 block">Catégorie</label>
                <select v-model="newExpense.category" class="w-full bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 dark:text-zinc-100 outline-none transition-all">
                  <option value="fuel">Essence</option><option value="tolls">Péage</option><option value="food">Nourriture</option><option value="accommodation">Logement</option><option value="activity">Activité</option><option value="transport">Transport</option><option value="other">Autre</option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-widest mb-1.5 block">Payé par</label>
                <select v-model="newExpense.paidBy" required class="w-full bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 dark:text-zinc-100 outline-none transition-all">
                  <option v-for="p in trip.participants" :key="p.id" :value="p.id">{{ p.id === currentUser?.id ? 'Moi' : p.fullName }}</option>
                </select>
              </div>
              <div>
                <label class="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-widest mb-1.5 block">Date</label>
                <input type="date" v-model="newExpense.date" required class="w-full bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 dark:text-zinc-100 outline-none transition-all" />
              </div>
            </div>
            <div class="flex gap-3 pt-1">
              <button type="button" @click="showExpenseModal = false" class="btn-secondary flex-1">Annuler</button>
              <button type="submit" :disabled="isSubmitting" class="flex-[2] bg-primary-400 hover:bg-primary-500 text-zinc-900 font-black text-sm rounded-xl py-3 transition-all shadow-lg shadow-primary-400/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
                <span v-if="isSubmitting" class="spinner w-4 h-4"></span>
                <span v-else><i class="fi fi-rr-plus mr-1"></i>Ajouter</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <div v-if="showEditExpenseModal && editingExpense" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-md" @click.self="showEditExpenseModal = false">
        <div class="w-full max-w-md bg-white dark:bg-[#111113] rounded-[2rem] border border-zinc-200/80 dark:border-white/8 shadow-[0_32px_80px_rgba(0,0,0,0.18)] dark:shadow-[0_32px_80px_rgba(0,0,0,0.7)] overflow-hidden animate-slide-up">
          <div class="h-1 w-full bg-amber-400"></div>
          <div class="px-6 py-5 flex items-center justify-between">
            <div class="flex items-center gap-3.5">
              <div class="w-10 h-10 rounded-2xl bg-amber-400/10 flex items-center justify-center text-amber-500 dark:text-amber-400 shrink-0"><i class="fi fi-rr-edit text-base leading-none"></i></div>
              <div>
                <h3 class="font-black text-base text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight">Modifier la dépense</h3>
                <p class="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 truncate max-w-[200px]">{{ editingExpense.title }}</p>
              </div>
            </div>
            <button @click="showEditExpenseModal = false" class="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-all"><i class="fi fi-rr-cross-small text-base leading-none"></i></button>
          </div>
          <form @submit.prevent="updateExpense" class="px-6 pb-6 space-y-4">
            <div>
              <label class="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-widest mb-1.5 block">Titre</label>
              <input v-model="editingExpense.title" required class="w-full bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 dark:text-zinc-100 outline-none transition-all" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-widest mb-1.5 block">Montant (€)</label>
                <input type="number" v-model="editingExpense.amount" required min="0" step="0.01" class="w-full bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 dark:text-zinc-100 outline-none transition-all" />
              </div>
              <div>
                <label class="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-widest mb-1.5 block">Catégorie</label>
                <select v-model="editingExpense.category" class="w-full bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 dark:text-zinc-100 outline-none transition-all">
                  <option value="fuel">Essence</option><option value="tolls">Péage</option><option value="food">Nourriture</option><option value="accommodation">Logement</option><option value="activity">Activité</option><option value="transport">Transport</option><option value="other">Autre</option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-widest mb-1.5 block">Payé par</label>
                <select v-model="editingExpense.paidBy" required class="w-full bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 dark:text-zinc-100 outline-none transition-all">
                  <option v-for="p in trip!.participants" :key="p.id" :value="p.id">{{ p.id === currentUser?.id ? 'Moi' : p.fullName }}</option>
                </select>
              </div>
              <div>
                <label class="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-widest mb-1.5 block">Date</label>
                <input type="date" v-model="editingExpense.expenseDate" required class="w-full bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 dark:text-zinc-100 outline-none transition-all" />
              </div>
            </div>
            <div class="flex gap-3 pt-1">
              <button type="button" @click="showEditExpenseModal = false" class="btn-secondary flex-1">Annuler</button>
              <button type="submit" :disabled="isSubmitting" class="flex-[2] bg-amber-400 hover:bg-amber-500 text-zinc-900 font-black text-sm rounded-xl py-3 transition-all shadow-lg shadow-amber-400/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
                <span v-if="isSubmitting" class="spinner w-4 h-4"></span>
                <span v-else><i class="fi fi-rr-check mr-1"></i>Enregistrer</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <TripEditModal v-if="trip && showEditModal" :trip="trip" :isSubmitting="isSubmitting" @close="showEditModal = false" @update="handleUpdateTrip" />
      <TripPhotosModal v-if="showPhotosModal && selectedStopForPhotos" :stop="selectedStopForPhotos" @close="showPhotosModal = false; selectedStopForPhotos = null" />
      <TripAddStopModal v-if="showAddStopModal && trip" 
        :tripId="trip.id" 
        :initialDate="selectedDateForAdd" 
        :place="preSelectedPlace"
        :participants="trip.participants"
        :expenses="trip.expenses"
        :currentUserId="currentUser?.id"
        :tripStartDate="trip.startDate"
        :tripEndDate="trip.endDate"
        :isEditing="isEditingStop"
        @close="closeAddStopModal" 
        @added="fetchTripData" />
      <AppModal v-model="showDeleteConfirmModal" type="danger" :title="itemToDelete?.action === 'leave' ? 'Quitter le voyage' : 'Supprimer'" :message="itemToDelete?.action === 'leave' ? 'Êtes-vous sûr de vouloir quitter ce voyage ?' : `Supprimer '${itemToDelete?.name}' ?`" confirm-text="Confirmer" cancel-text="Annuler" @confirm="confirmDeleteItem" />
      <TripOnboarding view="dashboard" />

      <!-- Modal pour rendre public -->
      <Teleport to="body">
        <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
          <div v-if="showPublicModal" class="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-md" @click.self="showPublicModal = false">
            <div class="w-full max-w-md bg-white dark:bg-[#111113] rounded-[2.5rem] border border-zinc-200/80 dark:border-white/8 shadow-2xl overflow-hidden animate-slide-up">
              <div class="p-8 text-center">
                <div class="w-20 h-20 bg-violet-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-violet-500">
                  <i class="fi fi-rr-share text-3xl"></i>
                </div>
                <h3 class="text-2xl font-black text-zinc-900 dark:text-white mb-2">Partager votre aventure</h3>
                <p class="text-zinc-500 dark:text-zinc-400 text-sm mb-8">Choisissez une catégorie pour que la communauté puisse découvrir votre voyage.</p>
                
                <div class="grid grid-cols-2 gap-3 mb-8">
                  <button v-for="cat in categories" :key="cat.label"
                    @click="selectedCategory = cat.label"
                    class="flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer text-left"
                    :class="selectedCategory === cat.label 
                      ? 'bg-primary-400 border-primary-400 text-zinc-950 shadow-lg shadow-primary-400/20' 
                      : 'bg-zinc-50 dark:bg-white/5 border-zinc-100 dark:border-white/5 text-zinc-500 dark:text-zinc-400 hover:border-primary-400/50'">
                    <i :class="cat.icon" class="text-sm"></i>
                    <span class="text-xs font-bold">{{ cat.label }}</span>
                  </button>
                </div>

                <div class="flex gap-3">
                  <button @click="showPublicModal = false" class="btn-secondary flex-1">Plus tard</button>
                  <button @click="makeTripPublic" :disabled="isSubmitting || !selectedCategory" class="btn-primary flex-1">
                    <span v-if="isSubmitting" class="spinner w-4 h-4"></span>
                    <span v-else>Partager</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
.dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(204, 255, 0, 0.3); }

.drawer-left-enter-active, .drawer-left-leave-active { transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
.drawer-left-enter-from, .drawer-left-leave-to { transform: translateX(-100%); opacity: 0; }
.drawer-right-enter-active, .drawer-right-leave-active { transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
.drawer-right-enter-from, .drawer-right-leave-to { transform: translateX(100%); opacity: 0; }
.animate-slide-up { animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
@keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-6px); }

/* Panneaux inline itinéraire (gauche) et budget (droite) */
.panel-slide-enter-active, .panel-slide-leave-active,
.panel-slide-right-enter-active, .panel-slide-right-leave-active {
  transition: opacity 0.25s ease, max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  max-width: 400px;
}
.panel-slide-enter-from, .panel-slide-leave-to {
  opacity: 0;
  max-width: 0;
}
.panel-slide-right-enter-from, .panel-slide-right-leave-to {
  opacity: 0;
  max-width: 0;
}
</style>

<style>
.gm-style-iw-c { padding: 0 !important; background: transparent !important; box-shadow: none !important; border-radius: 1rem !important; max-width: none !important; max-height: none !important; }
.gm-style-iw-d { overflow: hidden !important; max-height: none !important; }
.gm-ui-hover-svc { display: none !important; }
.gm-style-iw-t::after { display: none !important; }
.pac-container { background-color: rgba(255, 255, 255, 0.95) !important; backdrop-filter: blur(12px) !important; border-radius: 1.25rem !important; border: 1px solid rgba(0, 0, 0, 0.05) !important; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15) !important; margin-top: 8px !important; font-family: 'Plus Jakarta Sans', sans-serif !important; padding: 8px !important; z-index: 9999 !important; }
.dark .pac-container { background-color: rgba(28, 28, 30, 0.95) !important; border: 1px solid rgba(255, 255, 255, 0.1) !important; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5) !important; }
.pac-item { padding: 8px 12px !important; cursor: pointer !important; display: grid !important; grid-template-columns: auto 1fr !important; align-items: center !important; gap: 10px !important; border: none !important; border-radius: 0.75rem !important; transition: all 0.2s ease !important; line-height: 1.1 !important; }
.pac-item:hover { background-color: rgba(204, 255, 0, 0.1) !important; }
.pac-item-query { color: #18181b !important; font-size: 13px !important; font-weight: 700 !important; display: block !important; width: 100% !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; padding-right: 0 !important; }
.dark .pac-item-query { color: #f4f4f5 !important; }
.pac-item > span:not(.pac-item-query):not(.pac-icon) { font-size: 10px !important; color: #71717a !important; display: block !important; width: 100% !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; margin-top: 0px !important; }
.pac-item > span:not(.pac-item-query):not(.pac-icon):empty { display: none !important; }
.pac-item:has(span:not(.pac-item-query):not(.pac-icon):empty) .pac-item-query { grid-row: 1 / span 2 !important; align-self: center !important; }
.pac-icon { grid-row: 1 / span 2 !important; margin-top: 0 !important; flex-shrink: 0 !important; filter: grayscale(1) opacity(0.6) !important; }
.pac-logo:after { display: none !important; }
</style>