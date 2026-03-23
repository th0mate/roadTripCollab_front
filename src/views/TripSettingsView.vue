<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../services/api';

const route = useRoute();
const router = useRouter();
const tripId = route.params.id;
const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3333';

const trip = ref<any>(null);
const loading = ref(true);
const isSubmitting = ref(false);
const previewUrl = ref<string | null>(null);
const selectedFile = ref<File | null>(null);

const form = ref({
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  budget: 0,
  status: 'planning',
  carConsumption: 7.0,
  fuelPrice: 1.8,
  tollRate: 0.12
});

const fetchTrip = async () => {
  try {
    const res = await api.get(`/trips/${tripId}`);
    trip.value = res.data;
    form.value = {
      title: trip.value.title,
      description: trip.value.description || '',
      startDate: new Date(trip.value.startDate).toISOString().split('T')[0],
      endDate: new Date(trip.value.endDate).toISOString().split('T')[0],
      budget: trip.value.budget,
      status: trip.value.status,
      carConsumption: trip.value.carConsumption || 7.0,
      fuelPrice: trip.value.fuelPrice || 1.8,
      tollRate: trip.value.tollRate || 0.12
    };
  } catch (e) {
    router.push('/my-trips');
  } finally {
    loading.value = false;
  }
};

onMounted(fetchTrip);

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files?.[0]) {
    selectedFile.value = target.files[0];
    previewUrl.value = URL.createObjectURL(selectedFile.value);
  }
};

const saveSettings = async () => {
  isSubmitting.value = true;
  try {
    const fd = new FormData();
    fd.append('title', form.value.title);
    fd.append('description', form.value.description);
    fd.append('startDate', form.value.startDate);
    fd.append('endDate', form.value.endDate);
    fd.append('budget', form.value.budget.toString());
    fd.append('status', form.value.status);
    fd.append('carConsumption', form.value.carConsumption.toString());
    fd.append('fuelPrice', form.value.fuelPrice.toString());
    fd.append('tollRate', form.value.tollRate.toString());
    
    if (selectedFile.value) {
      fd.append('cover_image', selectedFile.value);
    }

    await api.patch(`/trips/${tripId}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    router.push(`/trips/${tripId}`);
  } catch (e) {
    alert("Erreur lors de la sauvegarde.");
  } finally {
    isSubmitting.value = false;
  }
};

const deleteTrip = async () => {
  if (!confirm("Êtes-vous sûr de vouloir supprimer ce voyage ? Cette action est irréversible.")) return;
  try {
    await api.delete(`/trips/${tripId}`);
    router.push('/my-trips');
  } catch (e) {
    alert("Erreur lors de la suppression.");
  }
};

const activeSection = ref('general');
const sections = [
  { id: 'general', label: 'Général', icon: 'fi-rr-info' },
  { id: 'vehicle', label: 'Véhicule', icon: 'fi-rr-car-side' },
  { id: 'danger', label: 'Danger', icon: 'fi-rr-exclamation' }
];

const scrollTo = (id: string) => {
  activeSection.value = id;
  const el = document.getElementById(id);
  if (el) {
    window.scrollTo({
      top: el.offsetTop - 120,
      behavior: 'smooth'
    });
  }
};
</script>

<template>
  <div class="page-wrapper nav-safe-zone bg-zinc-50 dark:bg-[#0c0c0e]">
    <!-- Background Blur Elements -->
    <div class="fixed top-0 left-1/4 w-96 h-96 bg-primary-400/5 rounded-full blur-[120px] pointer-events-none"></div>
    <div class="fixed bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 relative z-10">
      
      <div v-if="loading" class="flex flex-col items-center justify-center py-32">
        <div class="spinner w-12 h-12 border-primary-400 border-t-transparent mb-6"></div>
        <p class="section-label">Initialisation de votre voyage...</p>
      </div>

      <div v-else class="flex flex-col lg:flex-row gap-16 animate-fade-in">
        
        <!-- Sticky Sidebar -->
        <aside class="lg:w-72 shrink-0">
          <div class="sticky top-32 space-y-8">
            <!-- Back & Title -->
            <div class="space-y-4 px-4">
              <button @click="router.push(`/trips/${tripId}`)" 
                class="inline-flex items-center gap-2 text-zinc-500 hover:text-primary-400 font-bold transition-colors group cursor-pointer">
                <i class="fi fi-rr-arrow-left group-hover:-translate-x-1 transition-transform"></i>
                Retour au voyage
              </button>
              <h1 class="text-3xl font-black text-zinc-900 dark:text-white leading-tight">Configuration</h1>
            </div>

            <!-- Nav Links -->
            <nav class="space-y-1">
              <button 
                v-for="section in sections" :key="section.id"
                @click="scrollTo(section.id)"
                class="legal-nav-link w-full text-left flex items-center gap-3 cursor-pointer"
                :class="{ 'active': activeSection === section.id }"
              >
                <i :class="['fi', section.icon]"></i>
                {{ section.label }}
              </button>
            </nav>

            <!-- Save Action -->
            <div class="pt-6 px-4">
              <button @click="saveSettings" :disabled="isSubmitting" class="btn-primary w-full !py-4 shadow-2xl">
                <span v-if="isSubmitting" class="spinner w-4 h-4 border-zinc-950 border-t-transparent"></span>
                <span v-else class="flex items-center gap-2">Enregistrer <i class="fi fi-rr-check"></i></span>
              </button>
            </div>
          </div>
        </aside>

        <!-- Main Content area -->
        <main class="flex-grow max-w-3xl space-y-24">
          
          <header class="hidden lg:block">
            <span class="badge-green mb-4">Paramètres avancés</span>
            <h2 class="text-5xl font-black text-zinc-900 dark:text-white mb-6 tracking-tight leading-tight">
              Ajustez chaque <span class="text-primary-400">détail</span> de votre aventure.
            </h2>
            <p class="text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Mettez à jour les informations de base, configurez votre véhicule pour des estimations de coûts précises et gérez le cycle de vie de votre projet.
            </p>
          </header>

          <!-- Section: Général -->
          <section id="general" class="scroll-mt-32">
            <div class="flex items-center gap-4 mb-8 px-2">
              <div class="w-12 h-12 rounded-2xl bg-primary-400/10 flex items-center justify-center text-primary-400">
                <i class="fi fi-rr-info text-xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-black text-zinc-900 dark:text-white leading-tight">Informations générales</h3>
                <p class="text-sm text-zinc-500">L'identité visuelle et temporelle de votre voyage.</p>
              </div>
            </div>

            <div class="paper-card p-8 lg:p-10 space-y-10">
              <!-- Cover Image Picker -->
              <div class="space-y-4">
                <label class="form-label !mb-0 ml-0 uppercase tracking-widest text-[10px]">Image de couverture</label>
                <div class="relative h-64 rounded-[2rem] overflow-hidden bg-zinc-100 dark:bg-zinc-800 group border-4 border-white dark:border-zinc-800 shadow-inner transition-all hover:shadow-2xl">
                  <img v-if="previewUrl" :src="previewUrl" class="w-full h-full object-cover" />
                  <img v-else-if="trip.coverImage" :src="`${backendUrl}/uploads/${trip.coverImage}`" class="w-full h-full object-cover" />
                  <div v-else class="w-full h-full flex flex-col items-center justify-center text-zinc-400">
                    <i class="fi fi-rr-picture text-5xl mb-4"></i>
                    <span class="text-[10px] font-black uppercase tracking-widest">Choisir une photo inspirante</span>
                  </div>
                  <label class="absolute inset-0 bg-black/0 hover:bg-black/40 flex items-center justify-center transition-all cursor-pointer">
                    <div class="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 shadow-2xl">
                      <i class="fi fi-rr-camera text-3xl"></i>
                    </div>
                    <input type="file" @change="handleFileUpload" accept="image/*" class="hidden" />
                  </label>
                </div>
              </div>

              <!-- Main Fields -->
              <div class="space-y-8">
                <div class="space-y-2">
                  <label class="form-label ml-0 uppercase tracking-widest text-[10px]">Nom du voyage</label>
                  <input v-model="form.title" class="input-field !rounded-2xl border-none focus:bg-zinc-50 dark:focus:bg-zinc-800/50 px-6 py-4" placeholder="Ex: Tour d'Europe 2026..." />
                </div>

                <div class="space-y-2">
                  <label class="form-label ml-0 uppercase tracking-widest text-[10px]">Description</label>
                  <textarea v-model="form.description" rows="4" class="input-field !rounded-2xl border-none focus:bg-zinc-50 dark:focus:bg-zinc-800/50 px-6 py-4 resize-none" placeholder="Racontez ce qui rend ce voyage unique..."></textarea>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div class="space-y-2">
                    <label class="form-label ml-0 uppercase tracking-widest text-[10px]">Début</label>
                    <input type="date" v-model="form.startDate" class="input-field !rounded-2xl border-none focus:bg-zinc-50 dark:focus:bg-zinc-800/50 px-6 py-4" />
                  </div>
                  <div class="space-y-2">
                    <label class="form-label ml-0 uppercase tracking-widest text-[10px]">Fin</label>
                    <input type="date" v-model="form.endDate" class="input-field !rounded-2xl border-none focus:bg-zinc-50 dark:focus:bg-zinc-800/50 px-6 py-4" />
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div class="space-y-2">
                    <label class="form-label ml-0 uppercase tracking-widest text-[10px]">Budget (€)</label>
                    <div class="relative">
                      <input type="number" v-model="form.budget" class="input-field !rounded-2xl border-none focus:bg-zinc-50 dark:focus:bg-zinc-800/50 px-6 py-4 pr-12" />
                      <span class="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-400 font-black">€</span>
                    </div>
                  </div>
                  <div class="space-y-2">
                    <label class="form-label ml-0 uppercase tracking-widest text-[10px]">Statut</label>
                    <select v-model="form.status" class="input-field !rounded-2xl border-none focus:bg-zinc-50 dark:focus:bg-zinc-800/50 px-6 py-4 cursor-pointer">
                      <option value="planning">📍 Planification</option>
                      <option value="active">🚗 En cours</option>
                      <option value="completed">✅ Terminé</option>
                      <option value="cancelled">❌ Annulé</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Section: Véhicule -->
          <section id="vehicle" class="scroll-mt-32">
            <div class="flex items-center gap-4 mb-8 px-2">
              <div class="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <i class="fi fi-rr-car-side text-xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-black text-zinc-900 dark:text-white leading-tight">Véhicule & Estimations</h3>
                <p class="text-sm text-zinc-500">Optimisez le calcul automatique de votre budget route.</p>
              </div>
            </div>

            <div class="paper-card p-8 lg:p-10">
              <div class="bg-zinc-50 dark:bg-zinc-800/30 rounded-3xl p-6 mb-8 border border-zinc-100 dark:border-zinc-800/50">
                <p class="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed italic">
                  "Ces valeurs sont utilisées pour estimer en temps réel le coût du carburant et des péages entre chaque étape sur votre carte et dans votre itinéraire."
                </p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-700/50 hover:border-primary-400/50 transition-all">
                  <label class="form-label ml-0 uppercase tracking-widest text-[9px] mb-3">Conso. (L/100)</label>
                  <input type="number" v-model="form.carConsumption" step="0.1" class="w-full bg-transparent border-none p-0 font-black text-2xl text-zinc-900 dark:text-white focus:ring-0 outline-none" />
                </div>
                <div class="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-700/50 hover:border-primary-400/50 transition-all">
                  <label class="form-label ml-0 uppercase tracking-widest text-[9px] mb-3">Carburant (€/L)</label>
                  <input type="number" v-model="form.fuelPrice" step="0.01" class="w-full bg-transparent border-none p-0 font-black text-2xl text-zinc-900 dark:text-white focus:ring-0 outline-none" />
                </div>
                <div class="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-700/50 hover:border-primary-400/50 transition-all">
                  <label class="form-label ml-0 uppercase tracking-widest text-[9px] mb-3">Péage (€/km)</label>
                  <input type="number" v-model="form.tollRate" step="0.01" class="w-full bg-transparent border-none p-0 font-black text-2xl text-zinc-900 dark:text-white focus:ring-0 outline-none" />
                </div>
              </div>
            </div>
          </section>

          <!-- Section: Danger -->
          <section id="danger" class="scroll-mt-32">
            <div class="flex items-center gap-4 mb-8 px-2">
              <div class="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                <i class="fi fi-rr-exclamation text-xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-black text-zinc-900 dark:text-white leading-tight">Zone critique</h3>
                <p class="text-sm text-zinc-500">Actions irréversibles sur ce projet.</p>
              </div>
            </div>

            <div class="bg-rose-500/5 rounded-[2.5rem] p-10 border border-rose-500/20 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
              <div class="max-w-md">
                <h4 class="text-zinc-900 dark:text-white font-black text-xl mb-2">Supprimer ce voyage</h4>
                <p class="text-zinc-500 dark:text-zinc-400 text-base leading-relaxed">
                  Attention, cette action est définitive. Toutes les données, étapes, dépenses et photos partagées seront supprimées pour tous les participants.
                </p>
              </div>
              <button @click="deleteTrip" class="btn-danger !px-10 !py-5 !rounded-2xl !text-base shadow-2xl transition-transform hover:-translate-y-1 active:scale-95">
                Supprimer l'aventure
              </button>
            </div>
          </section>

          <footer class="mt-20 pt-8 border-t border-zinc-200 dark:border-zinc-800 text-sm text-zinc-400 text-center font-bold uppercase tracking-widest opacity-50">
            RoadTripCollab Premium Configuration v1.0
          </footer>
        </main>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

/* Hide arrows on number inputs */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type=number] {
  -moz-appearance: textfield;
}
</style>
