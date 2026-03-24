<template>
  <div class="min-h-screen bg-zinc-50 dark:bg-[#0c0c0e] transition-colors duration-500 pb-24">
    <header class="pt-32 pb-16 relative overflow-hidden">
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute top-0 right-0 w-1/2 h-full bg-primary-400/5 blur-[120px] rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
        <div class="absolute bottom-0 left-0 w-1/2 h-full bg-blue-500/5 blur-[120px] rounded-full transform -translate-x-1/2 translate-y-1/2"></div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <span class="section-label mx-auto mb-6">Exploration</span>
        <h1 class="text-4xl md:text-6xl font-black text-zinc-900 dark:text-white mb-6 leading-tight">
          Découvrez des <span class="text-primary-400">itinéraires</span><br class="hidden md:block" /> partagés par la communauté
        </h1>
        <p class="text-zinc-500 dark:text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto font-medium">
          Laissez-vous inspirer par les voyages terminés et planifiez votre prochaine aventure en quelques clics.
        </p>
      </div>
    </header>

    <section class="mb-12 sticky top-24 z-30">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl p-3 shadow-xl shadow-black/5 dark:shadow-none flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
          <div class="flex items-center gap-2 min-w-max">
            <button
              v-for="(cat, idx) in categories" :key="idx"
              @click="selectCategory(cat.label)"
              class="shrink-0 flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all border cursor-pointer active:scale-95"
              :class="activeCategory === cat.label
                ? 'bg-primary-400 border-primary-400 text-zinc-950 shadow-lg shadow-primary-400/20'
                : 'bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/5 text-zinc-500 dark:text-zinc-400 hover:border-primary-400/50 hover:text-primary-400'"
            >
              <i class="text-sm leading-none" :class="[cat.icon]"></i> 
              {{ cat.label }}
            </button>
          </div>
          
          <div class="h-8 w-px bg-zinc-200 dark:bg-zinc-800 hidden md:block"></div>
          
          <div class="relative hidden md:block min-w-[240px]">
             <i class="fi fi-rr-search absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm"></i>
             <input 
              type="text" 
              placeholder="Rechercher une destination..." 
              class="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/5 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-400/50 transition-all"
             />
          </div>
        </div>
      </div>
    </section>

    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div v-if="isLoading && destinations.length === 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <div v-for="i in 6" :key="i" class="h-[420px] rounded-[2.5rem] bg-zinc-100 dark:bg-white/5 animate-pulse"></div>
      </div>

      <div v-else-if="destinations.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        <div
          v-for="trip in destinations" :key="trip.id"
          @click="openTripModal(trip)"
          class="group cursor-pointer flex flex-col bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] border border-zinc-200/50 dark:border-white/5 overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)]"
        >
          <div class="relative h-64 overflow-hidden shrink-0">
            <img
              :src="trip.coverImage ? `${backendUrl}/uploads/${trip.coverImage}` : placeholders[trip.id % placeholders.length]"
              class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            
            <div class="absolute top-5 left-5 flex gap-2">
              <span class="px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl text-[10px] font-black text-primary-400 uppercase tracking-wider border border-white/10">
                {{ trip.budget ? trip.budget + ' €' : 'Libre' }}
              </span>
              <span v-if="trip.category" class="px-3 py-1.5 bg-primary-400 backdrop-blur-md rounded-xl text-[10px] font-black text-zinc-950 uppercase tracking-wider">
                {{ trip.category }}
              </span>
            </div>

            <div class="absolute bottom-5 left-5 right-5">
              <div class="flex items-center gap-2 text-white/70 text-[10px] font-black uppercase tracking-[0.2em] mb-1">
                <i class="fi fi-rr-marker text-primary-400"></i>
                {{ trip.stops?.[0]?.title || 'Multi-étapes' }}
              </div>
              <h3 class="text-xl font-bold text-white group-hover:text-primary-400 transition-colors line-clamp-1">
                {{ trip.title }}
              </h3>
            </div>
          </div>

          <div class="p-6 flex flex-col gap-4">
            <p class="text-zinc-500 dark:text-zinc-400 text-sm line-clamp-2 leading-relaxed">
              {{ trip.description || 'Découvrez cet itinéraire incroyable et organisez le vôtre.' }}
            </p>
            
            <div class="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-white/5">
              <div class="flex items-center gap-4">
                 <div class="flex items-center gap-1.5">
                    <i class="fi fi-rr-users text-primary-400 text-xs"></i>
                    <span class="text-xs font-bold text-zinc-600 dark:text-zinc-400">{{ trip.participants?.length || 0 }} voyageurs</span>
                 </div>
                 <div class="flex items-center gap-1.5">
                    <i class="fi fi-rr-coins text-primary-400 text-xs"></i>
                    <span class="text-xs font-bold text-zinc-600 dark:text-zinc-400">{{ trip.budget || 0 }}€ budget</span>
                 </div>
              </div>
              <div class="flex items-center gap-1.5 text-zinc-400">
                <i class="fi fi-rr-map-marker text-[10px]"></i>
                <span class="text-[10px] font-bold uppercase tracking-widest">{{ trip.stops?.length || 0 }} étapes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-20 bg-white dark:bg-[#1C1C1E] rounded-[3rem] border border-dashed border-zinc-200 dark:border-zinc-800">
          <div class="w-20 h-20 bg-zinc-50 dark:bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <i class="fi fi-rr-search text-zinc-300 dark:text-zinc-700 text-3xl"></i>
          </div>
          <h3 class="text-xl font-bold text-zinc-900 dark:text-white mb-2">Aucun voyage trouvé</h3>
          <p class="text-zinc-500 dark:text-zinc-400">Essayez de changer de catégorie ou de recherche.</p>
          <button @click="selectCategory('Tout')" class="mt-6 text-primary-400 font-bold text-sm hover:underline cursor-pointer">Voir tous les voyages</button>
      </div>

      <div v-if="hasMore" class="mt-20 text-center">
        <button
          @click="loadMore"
          :disabled="isLoadingMore"
          class="btn-secondary px-10 py-4 group min-w-[220px]"
        >
          <span v-if="isLoadingMore" class="spinner text-primary-400 w-5 h-5"></span>
          <div v-else class="flex items-center gap-2">
            <span>Charger plus d'aventures</span>
            <i class="fi fi-rr-refresh text-sm group-hover:rotate-180 transition-transform duration-500"></i>
          </div>
        </button>
      </div>
    </section>

    <TripDetailsModal v-if="selectedTrip" :isOpen="isModalOpen" :trip="selectedTrip" @close="isModalOpen = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../services/api'
import TripDetailsModal from '../components/TripDetailsModal.vue'

const isLoading = ref(true)
const isLoadingMore = ref(false)
const isModalOpen = ref(false)
const selectedTrip = ref<any>(null)
const destinations = ref<any[]>([])
const currentPage = ref(1)
const hasMore = ref(false)
const activeCategory = ref('Tout')

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3333'

const placeholders = [
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1503221043305-f7498f8b7888?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1530789253388-582c481c54b0?q=80&w=800&auto=format&fit=crop'
]

const categories = [
  { label: 'Tout', icon: 'fi-rr-globe' },
  { label: 'Montagnes', icon: 'fi-rr-mountains' },
  { label: 'Plage', icon: 'fi-rr-umbrella-beach' },
  { label: 'Forêt', icon: 'fi-rr-tree' },
  { label: 'Désert', icon: 'fi-rr-sun' },
  { label: 'Ville', icon: 'fi-rr-building' },
]

const fetchFinishedTrips = async (page = 1) => {
  if (page === 1) isLoading.value = true; else isLoadingMore.value = true
  
  try {
    const response = await api.get(`/trips/finished`, {
        params: {
            page,
            limit: 9,
            category: activeCategory.value
        }
    })
    
    if (page === 1) {
      destinations.value = response.data.data
    } else {
      destinations.value.push(...response.data.data)
    }
    
    const meta = response.data.meta
    hasMore.value = meta.currentPage < meta.lastPage
    currentPage.value = meta.currentPage
  } catch (error) {
    console.error('Erreur lors du chargement des voyages:', error)
  } finally {
    isLoading.value = false
    isLoadingMore.value = false
  }
}

const loadMore = () => {
  if (hasMore.value && !isLoadingMore.value) {
    fetchFinishedTrips(currentPage.value + 1)
  }
}

const selectCategory = (category: string) => {
  activeCategory.value = category
  fetchFinishedTrips(1)
}

const openTripModal = (trip: any) => {
  selectedTrip.value = trip
  isModalOpen.value = true
}

onMounted(() => {
  fetchFinishedTrips(1)
})
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
