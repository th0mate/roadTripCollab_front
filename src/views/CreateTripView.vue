<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';
import { useToast } from '../composables/useToast';

const toast = useToast();

const router = useRouter();
const currentStep = ref(1);
const isLoading = ref(false);
const apiError = ref('');
const today = new Date().toISOString().split('T')[0];

const trip = ref({ title: '', description: '', startDate: '', endDate: '', budget: 0, startLocation: null as any });
const startLocationSearch = ref('');
const startLocationResults = ref<City[]>([]);
const showStartLocationResults = ref(false);

const selectedFile = ref<File | null>(null);
const previewUrl = ref<string | null>(null);
const newParticipantEmail = ref('');
const participants = ref<string[]>([]);
const participantError = ref('');

interface City { place_id: string; display_name: string; lat: string; lon: string; }
interface TripDay { date: string; searchTerm: string; city: City | null; }
const tripDays = ref<TripDay[]>([]);
const activeSearchIndex = ref<number | null>(null);
const searchResults = ref<City[]>([]);
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

const mapContainer = ref<HTMLElement | null>(null);
let map: google.maps.Map | null = null;
let markers: Map<number, google.maps.Marker> = new Map();
let polyline: google.maps.Polyline | null = null;

const isGeolocating = ref(false)

const geolocateUser = async () => {
  if (!navigator.geolocation) return
  isGeolocating.value = true
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 })
    )
    const { latitude, longitude } = pos.coords
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
    )
    const data = await res.json()
    const cityName = data.address?.city || data.address?.town || data.address?.village || data.address?.county
    if (cityName && tripDays.value[0]) {
      tripDays.value[0].searchTerm = cityName
      tripDays.value[0].city = {
        place_id: data.place_id,
        display_name: data.display_name,
        lat: String(latitude),
        lon: String(longitude),
      }
    }
  } catch (e) {
    console.warn('Géolocalisation refusée ou échouée', e)
  } finally {
    isGeolocating.value = false
  }
}

const isStep1Valid = computed(() => trip.value.title && trip.value.startDate && trip.value.endDate);
const areAllDaysFilled = computed(() => tripDays.value.every(day => day.city !== null));

watch([() => trip.value.startDate, () => trip.value.endDate], () => {
  if (trip.value.startDate && trip.value.endDate) generateDays();
});

watch(currentStep, (newStep) => {
  if (newStep === 3) setTimeout(initMap, 100);
});

watch(tripDays, () => {
  if (currentStep.value === 3 && map) updateMapFeatures();
}, { deep: true });

const nextStep = () => { 
  if (currentStep.value === 1) generateDays(); 
  if (currentStep.value < 3) currentStep.value++; 
};
const prevStep = () => { if (currentStep.value > 1) currentStep.value--; };

const generateDays = () => {
  const start = new Date(trip.value.startDate);
  const end = new Date(trip.value.endDate);
  const days: TripDay[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dStr = new Date(d).toISOString().split('T')[0];
    const existing = tripDays.value.find(day => day.date === dStr);
    days.push(existing || { date: dStr || '', searchTerm: '', city: null });
  }
  tripDays.value = days;
};

const initMap = () => {
  if (!mapContainer.value || map) return;
  map = new google.maps.Map(mapContainer.value, {
    center: { lat: 46.603354, lng: 1.888334 },
    zoom: 5,
    mapTypeId: 'satellite',
    disableDefaultUI: true,
    tilt: 45
  });
  updateMapFeatures();
};

const updateMapFeatures = () => {
  if (!map) return;
  const path: google.maps.LatLngLiteral[] = [];
  const bounds = new google.maps.LatLngBounds();

  tripDays.value.forEach((day, i) => {
    if (day.city) {
      const pos = { lat: parseFloat(day.city.lat), lng: parseFloat(day.city.lon) };
      path.push(pos);
      bounds.extend(pos);

      if (!markers.has(i)) {
        const marker = new google.maps.Marker({
          position: pos,
          map: map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#9fe000',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 7
          },
          label: { text: (i + 1).toString(), color: '#000', fontSize: '10px', fontWeight: 'bold' },
          animation: google.maps.Animation.DROP
        });
        markers.set(i, marker);
      } else {
        const existing = markers.get(i)!;
        if (existing.getPosition()?.lat() !== pos.lat || existing.getPosition()?.lng() !== pos.lng) {
          existing.setPosition(pos);
        }
      }
    } else {
      if (markers.has(i)) {
        markers.get(i)!.setMap(null);
        markers.delete(i);
      }
    }
  });

  if (polyline) polyline.setMap(null);
  if (path.length > 1) {
    polyline = new google.maps.Polyline({
      path: path, geodesic: true, strokeColor: '#9fe000', strokeOpacity: 0.8, strokeWeight: 3, map: map
    });
  }

  if (path.length > 0) {
    path.length === 1 ? (map.setCenter(path[0]!), map.setZoom(10)) : map.fitBounds(bounds, 80);
  }
};

const searchCity = (index: number) => {
  activeSearchIndex.value = index;
  const day = tripDays.value[index];
  if (!day || day.searchTerm.length < 3) { searchResults.value = []; return; }
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(day.searchTerm)}&featuretype=city`);
      const data = await res.json();
      searchResults.value = data.filter((c: any, i: number, s: any[]) => i === s.findIndex(t => t.display_name === c.display_name));
    } catch (e) { console.error(e); }
  }, 500);
};

const selectCity = (index: number, result: City) => {
  const day = tripDays.value[index];
  if (!day) return;
  day.city = result; day.searchTerm = result.display_name.split(',')[0] ?? '';
  activeSearchIndex.value = null; searchResults.value = [];
};

const copyPreviousCity = (index: number) => {
  if (index > 0 && tripDays.value[index-1]?.city) {
    tripDays.value[index].city = tripDays.value[index-1].city;
    tripDays.value[index].searchTerm = tripDays.value[index-1].searchTerm;
  }
};

const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

const createTrip = async () => {
  isLoading.value = true;
  try {
    const formData = new FormData();
    formData.append('title', trip.value.title);
    if (trip.value.description) formData.append('description', trip.value.description);
    formData.append('startDate', trip.value.startDate);
    formData.append('endDate', trip.value.endDate);
    if (trip.value.budget) formData.append('budget', trip.value.budget.toString());
    formData.append('status', 'planning');
    if (selectedFile.value) formData.append('cover_image', selectedFile.value);
    
    if (trip.value.startLocation) {
      formData.append('settings', JSON.stringify({ startLocation: trip.value.startLocation }));
    }

    const tripResponse = await api.post('/trips', formData);
    const tripId = tripResponse.data.id;

    for (let i = 0; i < tripDays.value.length; i++) {
      const day = tripDays.value[i];
      if (!day?.city) continue;
      await api.post(`/trips/${tripId}/stops`, {
        title: day.searchTerm, type: 'city', latitude: parseFloat(day.city.lat), longitude: parseFloat(day.city.lon),
        address: day.city.display_name, arrivalDate: day.date, departureDate: day.date, order: i + 1, isLocked: true
      });
    }
    await Promise.all(participants.value.map(email => api.post(`/trips/${tripId}/participants`, { email })));
    toast.success(`Voyage "${trip.value.title}" créé avec succès !`);
    router.push('/my-trips');
  } catch (error: any) {
    const msg = error.response?.data?.errors
      ? error.response.data.errors.map((e: any) => e.message).join(', ')
      : error.response?.data?.message || 'Erreur lors de la création.'
    apiError.value = msg
    toast.error(msg)
  }
  finally { isLoading.value = false; }
};

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files?.length) {
    selectedFile.value = target.files[0]!;
    previewUrl.value = URL.createObjectURL(selectedFile.value!);
  }
};

const addParticipant = async () => {
  const email = newParticipantEmail.value.trim();
  if (!email || participants.value.includes(email)) return;
  try {
    await api.post('/participants/check', { email });
    participants.value.push(email); newParticipantEmail.value = ''; participantError.value = '';
  } catch (error: any) { participantError.value = "Inconnu"; }
};
const removeParticipant = (index: number) => participants.value.splice(index, 1);

const searchStartLocation = () => {
  if (startLocationSearch.value.length < 3) { 
    startLocationResults.value = []; 
    showStartLocationResults.value = false; 
    if (startLocationSearch.value.length === 0) trip.value.startLocation = null;
    return; 
  }
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(startLocationSearch.value)}`);
      startLocationResults.value = await res.json();
      showStartLocationResults.value = true;
    } catch (e) { console.error(e); }
  }, 500);
};

const selectStartLocation = (result: City) => {
  trip.value.startLocation = {
    title: result.display_name.split(',')[0],
    address: result.display_name,
    latitude: parseFloat(result.lat),
    longitude: parseFloat(result.lon)
  };
  startLocationSearch.value = result.display_name.split(',')[0];
  showStartLocationResults.value = false;
};
</script>

<template>
  <div class="h-screen flex flex-col lg:flex-row bg-white dark:bg-[#0c0c0e] overflow-hidden">
    
    <div class="flex-grow flex flex-col h-full relative z-20 bg-white dark:bg-[#0c0c0e]">
      <div class="h-24 lg:h-32 shrink-0"></div>

      <div class="flex-grow overflow-hidden flex flex-col px-6 sm:px-12 lg:px-20">
        <div class="max-w-2xl w-full flex flex-col h-full mx-auto lg:mx-0">
          
          <div class="mb-6 shrink-0">
            <div class="flex items-center gap-4 mb-4">
              <div v-for="step in 3" :key="step" class="h-1 flex-1 rounded-full transition-all duration-700" :class="currentStep >= step ? 'bg-primary-400' : 'bg-zinc-100 dark:bg-zinc-800'"></div>
            </div>
            <h1 class="text-2xl lg:text-3xl font-black tracking-tighter leading-tight">
              {{ currentStep === 1 ? 'Configurez le voyage.' : currentStep === 2 ? 'Invitez l\'équipe.' : 'Tracez l\'itinéraire.' }}
            </h1>
          </div>

          <div class="flex-grow overflow-y-auto pr-4 custom-scrollbar pb-6">
            <div v-if="currentStep === 1" class="space-y-5 animate-slide-up">
              <div>
                <label class="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 ml-1 block">Nom de votre expédition</label>
                <div class="group relative">
                  <span class="absolute inset-y-0 left-0 flex items-center pl-5 text-zinc-400 group-focus-within:text-primary-400 transition-colors"><i class="fi fi-rr-road leading-none text-sm"></i></span>
                  <input type="text" v-model="trip.title" class="block w-full bg-zinc-50 dark:bg-[#1C1C1E] border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl pl-12 pr-6 py-3.5 text-zinc-900 dark:text-white placeholder:text-zinc-400/50 focus:ring-4 focus:ring-primary-400/10 focus:border-primary-400 transition-all outline-none font-bold" placeholder="Ex: Islande 2026" />
                </div>
              </div>
              
              <div>
                <label class="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 ml-1 block">Point de départ</label>
                <div class="group relative">
                  <span class="absolute inset-y-0 left-0 flex items-center pl-5 text-zinc-400 group-focus-within:text-primary-400 transition-colors"><i class="fi fi-rr-marker leading-none text-sm"></i></span>
                  <input type="text" v-model="startLocationSearch" @input="searchStartLocation" class="block w-full bg-zinc-50 dark:bg-[#1C1C1E] border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl pl-12 pr-6 py-3.5 text-zinc-900 dark:text-white placeholder:text-zinc-400/50 focus:ring-4 focus:ring-primary-400/10 focus:border-primary-400 transition-all outline-none font-bold" placeholder="D'où partez-vous ?" />
                  
                  <div v-if="showStartLocationResults && startLocationResults.length > 0" class="absolute z-50 w-full mt-2 bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden animate-fade-in">
                    <div v-for="result in startLocationResults" :key="result.place_id" @click="selectStartLocation(result)" class="px-5 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer text-sm font-medium border-b border-zinc-50 dark:border-zinc-800 last:border-0 truncate">
                      {{ result.display_name }}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label class="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 ml-1 block">Description</label>
                <div class="group relative">
                  <span class="absolute top-4.5 left-5 text-zinc-400 group-focus-within:text-primary-400 transition-colors"><i class="fi fi-rr-quote-right leading-none text-sm"></i></span>
                  <textarea v-model="trip.description" class="block w-full bg-zinc-50 dark:bg-[#1C1C1E] border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl pl-12 pr-6 py-3.5 text-zinc-900 dark:text-white placeholder:text-zinc-400/50 focus:ring-4 focus:ring-primary-400/10 focus:border-primary-400 transition-all outline-none resize-none h-24 lg:h-28 font-medium" placeholder="Ambiance, envies..."></textarea>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-5">
                <div>
                  <label class="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 ml-1 block">Départ</label>
                  <input type="date" v-model="trip.startDate" :min="today" class="block w-full bg-zinc-50 dark:bg-[#1C1C1E] border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 text-sm text-zinc-900 dark:text-white focus:ring-4 focus:ring-primary-400/10 focus:border-primary-400 transition-all outline-none font-bold" />
                </div>
                <div>
                  <label class="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 ml-1 block">Retour</label>
                  <input type="date" v-model="trip.endDate" :min="trip.startDate" :disabled="!trip.startDate" class="block w-full bg-zinc-50 dark:bg-[#1C1C1E] border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 text-sm text-zinc-900 dark:text-white focus:ring-4 focus:ring-primary-400/10 focus:border-primary-400 transition-all outline-none font-bold disabled:opacity-30" />
                </div>
              </div>
              <div>
                <label class="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 ml-1 block">Budget (€)</label>
                <input type="number" v-model="trip.budget" min="0" class="no-spinner block w-full bg-zinc-50 dark:bg-[#1C1C1E] border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 text-zinc-900 dark:text-white placeholder:text-zinc-400/50 focus:ring-4 focus:ring-primary-400/10 focus:border-primary-400 transition-all outline-none font-bold" placeholder="Ex: 1200" />
              </div>
            </div>

            <div v-if="currentStep === 2" class="space-y-6 animate-slide-up">
              <div>
                <label class="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 ml-1 block">Ajouter un co-pilote</label>
                <div class="flex gap-2">
                  <input type="email" v-model="newParticipantEmail" @keyup.enter="addParticipant" class="flex-grow bg-zinc-50 dark:bg-[#1C1C1E] border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 text-zinc-900 dark:text-white focus:border-primary-400 transition-all outline-none font-bold" placeholder="Email..." />
                  <button @click="addParticipant" class="btn-primary !px-6 shadow-lg shadow-primary-400/20 cursor-pointer">Ajouter</button>
                </div>
              </div>
              <div class="grid grid-cols-1 gap-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                <div v-for="(email, index) in participants" :key="index" class="flex items-center justify-between p-4 bg-zinc-50 dark:bg-white/5 rounded-2xl border border-zinc-100 dark:border-white/5 animate-fade-in transition-all hover:border-primary-400/30">
                  <div class="flex items-center gap-4"><div class="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center text-xs font-black uppercase">{{ email[0] }}</div><span class="text-sm font-bold text-zinc-700 dark:text-zinc-200">{{ email }}</span></div>
                  <button @click="removeParticipant(index)" class="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-rose-500 transition-all cursor-pointer"><i class="fi fi-rr-cross-small text-xl"></i></button>
                </div>
                <div v-if="participants.length === 0" class="py-16 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2.5rem]">
                  <i class="fi fi-rr-user-add text-4xl text-zinc-200 dark:text-zinc-800 mb-4 block"></i>
                  <p class="text-zinc-400 font-medium text-sm italic">Le voyage est plus beau à plusieurs !</p>
                </div>
              </div>
            </div>

            <div v-if="currentStep === 3" class="space-y-6 animate-slide-up pb-10">
              <div v-for="(day, index) in tripDays" :key="index" class="relative group pl-16 pb-10 last:pb-0">
                <div v-if="index < tripDays.length - 1" class="absolute left-[19px] top-6 bottom-0 w-0.5 bg-zinc-100 dark:bg-zinc-800"></div>
                <div class="absolute left-0 top-0 w-10 h-10 rounded-2xl border-4 border-white dark:border-[#0c0c0e] transition-all duration-500 shadow-md flex items-center justify-center z-10" :class="day.city ? 'bg-primary-400 scale-110' : 'bg-zinc-100 dark:bg-zinc-800'">
                  <span class="text-[10px] font-black" :class="day.city ? 'text-zinc-900' : 'text-zinc-400'">{{ index + 1 }}</span>
                </div>
                
                <div class="flex justify-between items-center mb-3">
                  <p class="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{{ formatDate(day.date) }}</p>
                  <button v-if="index > 0" @click="copyPreviousCity(index)" class="text-[9px] font-black uppercase text-primary-400 hover:opacity-70 transition-all cursor-pointer">Copier J-1</button>
                </div>

                <div :class="index === 0 ? 'flex gap-2 items-start' : ''">
                  <div class="group relative" :class="index === 0 ? 'flex-1' : ''">
                    <span class="absolute top-2.5 left-4 text-[9px] font-black uppercase tracking-widest text-zinc-400 group-focus-within:text-primary-400 transition-colors">Ville étape</span>
                    <span class="absolute top-[60%] -translate-y-1/2 left-5 text-zinc-400 group-focus-within:text-primary-400 transition-colors">
                      <i class="fi fi-rr-marker text-sm"></i>
                    </span>
                    <input type="text" v-model="day.searchTerm" @input="searchCity(index)"
                      class="block w-full bg-zinc-50 dark:bg-[#1C1C1E] border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl pl-12 pr-6 pt-8 pb-4 text-zinc-900 dark:text-white placeholder:text-zinc-400/50 focus:ring-4 focus:ring-primary-400/10 focus:border-primary-400 transition-all outline-none text-sm font-bold"
                      placeholder="Ex: Reykjavik" />

                    <div v-if="activeSearchIndex === index && searchResults.length > 0" class="absolute z-50 w-full mt-2 bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden animate-fade-in"><div v-for="result in searchResults" :key="result.place_id" @click="selectCity(index, result)" class="px-5 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer text-sm font-medium border-b border-zinc-50 dark:border-zinc-800 last:border-0 truncate">{{ result.display_name }}</div></div>
                  </div>
                  <div v-if="index === 0" class="flex flex-col items-center gap-1 pt-1">
                    <button
                      type="button"
                      @click="geolocateUser"
                      :disabled="isGeolocating"
                      title="Détecter ma ville actuelle"
                      class="p-2 rounded-xl text-zinc-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <i :class="isGeolocating ? 'fi fi-rr-spinner animate-spin' : 'fi fi-rr-target'" class="text-lg leading-none"></i>
                    </button>
                    <span class="text-[10px] text-zinc-400 text-center leading-tight">Non<br>enregistré</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="py-6 mt-auto shrink-0 flex gap-4">
            <button v-if="currentStep > 1" @click="prevStep" class="btn-secondary !px-10 !py-4 font-black uppercase tracking-widest text-[10px] cursor-pointer">Retour</button>
            <button v-if="currentStep < 3" @click="nextStep" :disabled="currentStep === 1 && !isStep1Valid" class="btn-primary flex-grow !py-4 shadow-xl shadow-primary-400/20 font-black uppercase tracking-widest text-xs cursor-pointer">
              {{ currentStep === 2 && participants.length === 0 ? 'Ignorer' : 'Suivant' }}
            </button>
            <button v-if="currentStep === 3" @click="createTrip" :disabled="isLoading || !areAllDaysFilled" class="btn-primary flex-grow !py-4 shadow-xl shadow-primary-400/20 font-black uppercase tracking-widest text-xs cursor-pointer"><span v-if="isLoading" class="spinner w-4 h-4"></span><span v-else>Lancer l'expédition</span></button>
          </div>
        </div>
      </div>
    </div>

    <div class="hidden lg:flex w-full lg:w-[45%] xl:w-[50%] bg-zinc-900 relative items-center justify-center p-20 pt-32 overflow-hidden shrink-0">
      <div class="absolute inset-0">
        <div class="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-primary-400/20 rounded-full blur-[150px] animate-pulse"></div>
        <div class="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-blue-600/20 rounded-full blur-[150px] animate-pulse" style="animation-delay: 2s"></div>
      </div>

      <div class="relative z-10 w-full h-full flex items-center justify-center max-w-2xl pt-8">
        <div v-if="currentStep < 3" class="bg-white/5 backdrop-blur-3xl rounded-[3rem] p-10 border border-white/10 shadow-2xl w-full">
          <div class="relative h-80 rounded-[2.5rem] overflow-hidden bg-zinc-100 dark:bg-zinc-800 shadow-2xl mb-10 group/img transition-colors duration-500">
            <img v-if="previewUrl" :src="previewUrl" class="w-full h-full object-cover animate-fade-in" />
            <div v-else class="w-full h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 opacity-50"><i class="fi fi-rr-camera text-6xl mb-4"></i><p class="font-black uppercase tracking-widest text-[10px]">Photo de couverture</p></div>
            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>
            <label class="absolute top-6 right-6 w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center cursor-pointer hover:bg-primary-400 hover:text-zinc-900 transition-all shadow-2xl group/btn"><i class="fi fi-rr-picture text-xl group-hover/btn:scale-110 transition-transform"></i><input type="file" @change="handleFileUpload" accept="image/*" class="hidden" /></label>
            <div class="absolute bottom-8 left-10 right-10"><h3 class="text-4xl font-black text-white line-clamp-2 mb-3 tracking-tighter">{{ trip.title || 'Votre Aventure' }}</h3><div class="flex items-center gap-4 text-primary-400 font-black text-[11px] uppercase tracking-[0.2em]"><i class="fi fi-rr-calendar"></i><span>{{ trip.startDate ? formatDate(trip.startDate) : 'Dates à définir' }}</span></div></div>
          </div>
          <div class="flex items-center justify-between">
            <div class="space-y-3 text-white"><span class="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Team Explorers</span><div class="flex -space-x-3"><div v-for="i in 4" :key="i" class="w-12 h-12 rounded-2xl border-4 border-zinc-900 bg-zinc-800 flex items-center justify-center text-xs font-black transition-all" :class="i > (participants.length + 1) ? 'opacity-20' : 'hover:-translate-y-2'"><span v-if="i === 1" class="text-primary-400">ME</span><span v-else-if="i <= (participants.length + 1)">{{ participants[i-2]?.[0].toUpperCase() }}</span><span v-else>?</span></div></div></div>
            <div class="text-right text-white"><span class="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Budget</span><div class="text-3xl font-black tracking-tighter">{{ trip.budget || 0 }}<span class="text-primary-400 text-xl ml-1">€</span></div></div>
          </div>
        </div>

        <div v-else class="w-full h-full flex flex-col gap-6 animate-fade-in pt-8">
          <div class="flex items-center justify-between px-2">
            <div><h2 class="text-2xl font-black text-white tracking-tighter uppercase">Itinéraire <span class="text-primary-400">Satellite</span></h2><p class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Aperçu orbital en direct</p></div>
            <div class="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-md"><div class="w-2 h-2 rounded-full bg-primary-400 animate-pulse"></div><span class="text-[10px] font-black text-white uppercase tracking-widest">Live Sync</span></div>
          </div>
          <div class="flex-grow rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl relative">
            <div ref="mapContainer" class="w-full h-full"></div>
            <div class="absolute bottom-8 left-1/2 -translate-x-1/2 bg-zinc-900/80 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-6 whitespace-nowrap">
              <div class="flex flex-col"><span class="text-[8px] font-black text-zinc-500 uppercase">Étapes</span><span class="text-sm font-black text-white">{{ tripDays.filter(d => d.city).length }} / {{ tripDays.length }}</span></div>
              <div class="w-px h-6 bg-white/10"></div>
              <div class="flex flex-col"><span class="text-[8px] font-black text-zinc-500 uppercase">Statut</span><span class="text-sm font-black text-primary-400 uppercase tracking-tighter">{{ areAllDaysFilled ? 'Mission prête' : 'En calcul' }}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-slide-up { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
.animate-fade-in { animation: fadeIn 1s ease forwards; }
@keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
input::-webkit-calendar-picker-indicator { filter: invert(0.5); cursor: pointer; }
.dark input::-webkit-calendar-picker-indicator { filter: invert(1); }
.no-spinner::-webkit-outer-spin-button, .no-spinner::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.no-spinner { -moz-appearance: textfield; }
</style>
