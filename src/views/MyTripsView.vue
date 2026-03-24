<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import api from '../services/api';
import { useToast } from '../composables/useToast';

const toast = useToast();

const router = useRouter();
const loading = ref(true);
const createdTrips = ref<any[]>([]);
const participatingTrips = ref<any[]>([]);
const invitations = ref<any[]>([]);
const activeFilter = ref<'all' | 'created' | 'shared'>('all');
const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3333';

const placeholders = [
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1503221043305-f7498f8b7888?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1530789253388-582c481c54b0?q=80&w=800&auto=format&fit=crop'
];

const fetchTrips = async () => {
  try {
    const [tripsRes, invitesRes] = await Promise.all([
      api.get('/trips'),
      api.get('/invitations')
    ]);
    createdTrips.value = tripsRes.data.createdTrips;
    participatingTrips.value = tripsRes.data.participatingTrips;
    invitations.value = invitesRes.data.invitations;
  } catch (error) { console.error(error); }
  finally { loading.value = false; }
};

const handleInvitation = async (id: number, action: 'accept' | 'decline') => {
  try {
    await api.post(`/invitations/${id}/${action}`);
    await fetchTrips();
    toast.success(action === 'accept' ? 'Invitation acceptée !' : 'Invitation refusée.');
  }
  catch (e) { toast.error('Erreur lors du traitement de l\'invitation.'); }
};

const filteredTrips = computed(() => {
  const all = [
    ...createdTrips.value.map(t => ({ ...t, isOwner: true })),
    ...participatingTrips.value.map(t => ({ ...t, isOwner: false }))
  ].sort((a, b) => new Date(b.created_at || b.createdAt).getTime() - new Date(a.created_at || a.createdAt).getTime());

  if (activeFilter.value === 'created') return all.filter(t => t.isOwner);
  if (activeFilter.value === 'shared') return all.filter(t => !t.isOwner);
  return all;
});

const stats = computed(() => {
  const total = createdTrips.value.length + participatingTrips.value.length;
  const active = [...createdTrips.value, ...participatingTrips.value].filter(t => t.status === 'active').length;
  const finished = [...createdTrips.value, ...participatingTrips.value].filter(t => t.status === 'completed').length;
  return { total, active, finished };
});

const statusLabel = (s: string) => ({ active: 'En cours', completed: 'Terminé', planning: 'Planification' }[s] || s)
const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date non fixée';
const getInitials = (n: string) => {
  if (!n) return '?';
  return n.split(' ').map(x => x[0]).join('').toUpperCase().substring(0, 2);
}

const getAvatarUrl = (avatar: string | null) => {
  if (!avatar) return null;
  return avatar.startsWith('http') ? avatar : `${backendUrl}${avatar}`;
}

const calculateBudgetStats = (trip: any) => {
  const totalBudget = trip.budget || 0;
  const spent = trip.expenses?.reduce((sum: number, exp: any) => sum + Number(exp.amount), 0) || 0;
  const remaining = totalBudget - spent;
  const percentage = totalBudget > 0 ? Math.min(100, (spent / totalBudget) * 100) : 0;
  
  return { totalBudget, spent, remaining, percentage };
}

onMounted(fetchTrips);
</script>

<template>
  <div class="page-wrapper nav-safe-zone bg-zinc-50 dark:bg-[#0c0c0e]">
    
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mb-12">
      <div class="relative overflow-hidden bg-zinc-900 rounded-[2rem] p-8 md:p-12 text-white border border-white/5 shadow-2xl">
        <div class="absolute top-0 right-0 w-96 h-96 bg-primary-400/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div class="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none"></div>

        <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          <div class="max-w-xl">
            <div class="flex items-center gap-3 mb-4">
              <h1 class="text-4xl md:text-5xl font-black tracking-tight">Mes <span class="text-primary-400">Voyages</span></h1>
            </div>
            <p class="text-zinc-400 text-lg leading-relaxed">
              Prêt pour votre prochaine escale ? Gérez vos itinéraires et collaborez avec vos amis en temps réel.
            </p>
          </div>

          <div class="grid grid-cols-3 gap-4 md:gap-8 shrink-0">
            <div class="text-center">
              <p class="text-3xl md:text-4xl font-black text-white">{{ stats.total }}</p>
              <p class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Total</p>
            </div>
            <div class="text-center">
              <p class="text-3xl md:text-4xl font-black text-primary-400">{{ stats.active }}</p>
              <p class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">En cours</p>
            </div>
            <div class="text-center">
              <p class="text-3xl md:text-4xl font-black text-blue-400">{{ stats.finished }}</p>
              <p class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Terminés</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
      
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div class="flex p-1.5 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm w-fit">
          <button @click="activeFilter = 'all'" :class="[activeFilter === 'all' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300']" class="px-6 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer">Tout</button>
          <button @click="activeFilter = 'created'" :class="[activeFilter === 'created' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300']" class="px-6 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer">Mes créations</button>
          <button @click="activeFilter = 'shared'" :class="[activeFilter === 'shared' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300']" class="px-6 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer">Partagés</button>
        </div>

        <RouterLink to="/create-trip" class="btn-primary !px-8 !py-4 !rounded-2xl group shadow-xl shadow-primary-400/10">
          <i class="fi fi-rr-plus mt-0.5 group-hover:rotate-90 transition-transform duration-300"></i>
          Nouveau voyage
        </RouterLink>
      </div>

      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div v-for="i in 3" :key="i" class="h-80 rounded-[2rem] bg-zinc-200 dark:bg-zinc-800 animate-pulse"></div>
      </div>

      <template v-else>
        <div v-if="invitations.length > 0" class="mb-16 animate-fade-in">
          <div class="flex items-center gap-4 mb-8 px-2">
            <i class="fi fi-rr-bell-ring text-primary-400 animate-bounce"></i>
            <h2 class="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-wider">Invitations reçues</h2>
            <span class="bg-rose-500 text-white px-2 py-0.5 rounded-lg text-[10px] font-black">{{ invitations.length }}</span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div v-for="invite in invitations" :key="invite.id" class="p-6 bg-primary-400/5 dark:bg-primary-400/5 rounded-[2rem] border-2 border-dashed border-primary-400/20 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div class="flex items-center gap-4">
                <div class="w-14 h-14 rounded-2xl bg-primary-400 flex items-center justify-center text-zinc-900 text-xl font-black shadow-lg shadow-primary-400/20 overflow-hidden">
                  <img v-if="invite.trip?.creator?.avatar" :src="getAvatarUrl(invite.trip.creator.avatar)" class="w-full h-full object-cover" />
                  <span v-else>{{ invite.trip?.creator?.fullName?.[0]?.toUpperCase() }}</span>
                </div>
                <div>
                  <p class="text-xs font-bold text-primary-600 dark:text-primary-400 mb-1">Invité par {{ invite.trip?.creator?.fullName }}</p>
                  <h3 class="text-lg font-black text-zinc-900 dark:text-white leading-tight">{{ invite.trip?.title }}</h3>
                </div>
              </div>
              <div class="flex gap-2 w-full sm:w-auto">
                <button @click="handleInvitation(invite.id, 'decline')" class="btn-secondary !px-6 !py-3 !rounded-xl !text-rose-500 !border-rose-200 flex-1">Refuser</button>
                <button @click="handleInvitation(invite.id, 'accept')" class="btn-primary !px-8 !py-3 !rounded-xl flex-1">Accepter</button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="filteredTrips.length === 0" class="flex flex-col items-center justify-center py-32 text-center">
          <div class="w-24 h-24 rounded-[2rem] bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-300 dark:text-zinc-700 mb-8 border border-zinc-200/50 dark:border-zinc-800/50 shadow-inner">
            <i class="fi fi-rr-map-marker text-4xl"></i>
          </div>
          <h3 class="text-2xl font-black text-zinc-900 dark:text-white mb-3">La route est libre...</h3>
          <p class="text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-10 font-medium">Vous n'avez aucun voyage pour le moment. Créez votre première aventure dès maintenant !</p>
          <RouterLink to="/create-trip" class="btn-primary !px-10 !py-5">Démarrer une expédition</RouterLink>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          <div
            v-for="trip in filteredTrips" :key="trip.id"
            @click="router.push(`/trips/${trip.id}`)"
            class="trip-card group relative bg-white dark:bg-[#1C1C1E] rounded-[2rem] border border-zinc-200/50 dark:border-zinc-800/50 overflow-hidden transition-all duration-500 hover:-translate-y-3 cursor-pointer shadow-sm hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]"
            :class="trip.status === 'active' ? 'ring-2 ring-primary-400/30 ring-offset-2 ring-offset-zinc-50 dark:ring-offset-[#0c0c0e]' : ''"
          >
            <div class="h-64 relative overflow-hidden">
              <img :src="trip.coverImage ? `${backendUrl}/uploads/${trip.coverImage}` : placeholders[trip.id % 4]" class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
              <div class="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-80"></div>
              
              <div class="absolute top-6 left-6 right-6 flex justify-between items-start">
                <span :class="[ 
                  'px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 backdrop-blur-md',
                  trip.status === 'active' ? 'bg-primary-400 text-zinc-950 shadow-lg shadow-primary-400/20' : 'bg-black/40 text-white'
                ]">
                  {{ statusLabel(trip.status) }}
                </span>
                <div v-if="!trip.isOwner" class="w-8 h-8 rounded-full bg-blue-500/80 backdrop-blur-md text-white flex items-center justify-center shadow-lg"><i class="fi fi-rr-users text-xs"></i></div>
              </div>

              <div class="absolute bottom-6 left-8 right-8">
                <h3 class="text-2xl font-black text-white group-hover:text-primary-400 transition-colors line-clamp-1 mb-2">{{ trip.title }}</h3>
                <div class="flex items-center gap-3 text-white/60 text-[10px] font-bold uppercase tracking-[0.2em]">
                  <i class="fi fi-rr-calendar text-primary-400 text-sm"></i>
                  <span>{{ formatDate(trip.startDate) }}</span>
                </div>
              </div>
            </div>

            <div class="p-8 space-y-6 border-t border-zinc-100 dark:border-white/5 bg-white dark:bg-[#1C1C1E]">
              <div v-if="trip.budget > 0" class="space-y-2">
                <div class="flex justify-between items-end">
                  <span class="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Budget</span>
                  <span class="text-xs font-black text-zinc-900 dark:text-white">{{ Math.round(calculateBudgetStats(trip).spent) }}€ <span class="text-zinc-400">/ {{ trip.budget }}€</span></span>
                </div>
                <div class="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    class="h-full transition-all duration-1000 ease-out rounded-full" 
                    :class="[
                      calculateBudgetStats(trip).percentage > 90 ? 'bg-rose-500' : 
                      calculateBudgetStats(trip).percentage > 70 ? 'bg-amber-500' : 'bg-primary-400'
                    ]"
                    :style="{ width: `${calculateBudgetStats(trip).percentage}%` }"
                  ></div>
                </div>
              </div>

              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="flex -space-x-3">
                    <div v-for="(p, idx) in (trip.participants || []).slice(0, 3)" :key="p.id" 
                      class="w-9 h-9 rounded-full border-2 border-white dark:border-[#1C1C1E] bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 flex items-center justify-center text-[10px] font-black text-zinc-500 dark:text-zinc-400 shadow-sm overflow-hidden group-hover:scale-110 transition-all" 
                      :style="{ transitionDelay: `${idx*100}ms`, zIndex: 10 - idx }">
                      <img v-if="p.avatar" :src="getAvatarUrl(p.avatar)" class="w-full h-full object-cover" />
                      <span v-else>{{ getInitials(p.fullName) }}</span>
                    </div>
                    <div v-if="trip.participants?.length > 3" class="w-9 h-9 rounded-full border-2 border-white dark:border-[#1C1C1E] bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-400 shadow-sm z-0">
                      +{{ trip.participants.length - 3 }}
                    </div>
                    <div v-if="!trip.participants?.length" class="w-9 h-9 rounded-full border-2 border-white dark:border-[#1C1C1E] bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-300"><i class="fi fi-rr-user text-[10px]"></i></div>
                  </div>
                  <span class="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Team</span>
                </div>

                <div class="flex items-center gap-2">
                  <button v-if="trip.status === 'active'" @click.stop="router.push(`/trips/${trip.id}/live`)"
                    class="flex items-center gap-1.5 px-3 py-1.5 bg-primary-400 text-zinc-950 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-500 transition-all shadow-[0_0_12px_rgba(159,224,0,0.25)] active:scale-95">
                    <span class="w-1.5 h-1.5 rounded-full bg-zinc-950 animate-pulse"></span>
                    En Route
                  </button>
                  <div class="flex items-center gap-2 text-primary-400 font-black text-xs uppercase tracking-widest group-hover:translate-x-2 transition-all">
                    <span>Voir</span>
                    <i class="fi fi-rr-arrow-small-right text-xl leading-none"></i>
                  </div>
                </div>
              </div>
            </div>
            <div class="absolute bottom-0 left-0 right-0 h-1 bg-primary-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left shadow-[0_0_15px_var(--brand-primary)]"></div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.trip-card { perspective: 1000px; }
</style>
