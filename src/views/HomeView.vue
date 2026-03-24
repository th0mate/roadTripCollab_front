<template>
  <div>
    <div class="transition-colors duration-500">
      <Hero />

      <section class="py-24 relative">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div class="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div class="max-w-xl text-center md:text-left">
              <span class="section-label">Inspirations</span>
              <h2 class="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white leading-tight">
                Découvrez les <span class="text-primary-400">aventures</span> partagées
              </h2>
            </div>

            <div class="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
              <button
                v-for="(cat, idx) in categories" :key="idx"
                @click="selectCategory(cat.label)"
                class="shrink-0 flex items-center gap-2 px-6 py-3 rounded-2xl text-[13px] font-bold transition-all border cursor-pointer active:scale-95"
                :class="activeCategory === cat.label
                  ? 'bg-primary-400 border-primary-400 text-zinc-950 shadow-[0_8px_20px_rgba(var(--color-primary-400),0.2)]'
                  : 'bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/5 text-zinc-500 dark:text-zinc-400 hover:border-primary-400/50 hover:text-primary-400'"
              >

                <i class="text-sm leading-none mt-0.5" :class="[cat.icon]"></i>
                {{ cat.label }}
              </button>
            </div>
          </div>

          <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div v-for="i in 3" :key="i" class="h-[420px] rounded-[2.5rem] bg-zinc-100 dark:bg-white/5 animate-pulse"></div>
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

        <div v-else class="text-center py-20">
          <div class="w-16 h-16 bg-zinc-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i class="fi fi-rr-search text-zinc-300 dark:text-zinc-700 text-2xl"></i>
          </div>
          <p class="text-zinc-500 dark:text-zinc-400 font-medium">Aucun voyage trouvé dans cette catégorie.</p>
        </div>

        <div class="mt-20 text-center">
          <router-link
            to="/decouvrir"
            class="btn-secondary px-10 py-4 group inline-flex items-center gap-2"
          >
            <span>Découvrir toutes les aventures</span>
            <i class="fi fi-rr-arrow-right text-sm group-hover:translate-x-1 transition-transform"></i>
          </router-link>
        </div>
      </div>
    </section>

      <Features />

      <section class="py-24 relative overflow-hidden">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div class="bg-gradient-to-br from-[#1C1C1E] to-[#0c0c0e] rounded-[4rem] p-12 md:p-20 text-center shadow-3xl relative overflow-hidden border border-white/5">

            <div class="absolute -top-32 -right-32 w-80 h-80 bg-primary-400/10 rounded-full blur-[100px] pointer-events-none"></div>
            <div class="absolute -bottom-32 -left-32 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

            <h2 class="text-4xl lg:text-6xl font-black text-white mb-8 relative z-10 leading-[1.1]">
              Prêt à tracer <span class="text-primary-400">votre propre</span> route ?
            </h2>
            <p class="text-zinc-400 mb-12 max-w-2xl mx-auto text-lg md:text-xl font-medium relative z-10 leading-relaxed">
              Rejoignez une communauté de passionnés et commencez à organiser votre prochain voyage collaboratif dès maintenant.
            </p>
            <div class="flex items-center justify-center gap-4 relative z-10">
              <router-link to="/register" class="btn-primary px-10 py-5 text-base shadow-[0_20px_40px_rgba(var(--color-primary-400),0.15)]">
                Démarrer gratuitement
                <i class="fi fi-rr-arrow-right"></i>
              </router-link>
            </div>
          </div>
        </div>
      </section>

      <TripDetailsModal v-if="selectedTrip" :isOpen="isModalOpen" :trip="selectedTrip" @close="isModalOpen = false" />
    </div>
  </div>
</template>


<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '../services/api'
import Hero from '../components/Hero.vue'
import Features from '../components/Features.vue'
import TripDetailsModal from '../components/TripDetailsModal.vue'

const isLoading = ref(true)
const isModalOpen = ref(false)
const selectedTrip = ref<any>(null)
const destinations = ref<any[]>([])
const activeCategory = ref('Tout')
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3333'

const placeholders = [
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1503221043305-f7498f8b7888?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1530789253388-582c481c54b0?q=80&w=800&auto=format&fit=crop'
]

const categories = ref([
  { label: 'Tout', icon: 'fi-rr-globe' },
  { label: 'Montagnes', icon: 'fi-rr-mountains' },
  { label: 'Plage', icon: 'fi-rr-umbrella-beach' },
  { label: 'Forêt', icon: 'fi-rr-tree' },
  { label: 'Désert', icon: 'fi-rr-sun' },
])

const fetchFinishedTrips = async () => {
  isLoading.value = true
  try {
    const response = await api.get(`/trips/finished`, {
      params: {
        page: 1,
        limit: 6,
        category: activeCategory.value
      }
    })
    destinations.value = response.data.data
  } catch (error) {
    console.error('Erreur lors du chargement des voyages:', error)
  } finally {
    isLoading.value = false
  }
}

const selectCategory = (category: string) => {
  activeCategory.value = category
  fetchFinishedTrips()
}

const openTripModal = (trip: any) => {
  selectedTrip.value = trip
  isModalOpen.value = true
}

onMounted(() => fetchFinishedTrips())
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
