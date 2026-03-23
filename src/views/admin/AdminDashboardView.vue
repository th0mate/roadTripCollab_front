<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AdminLayout from '../../components/admin/AdminLayout.vue'
import { getStats, getTrips, getUsers } from '../../services/adminService'
import type { AdminStats, AdminTrip, AdminUser } from '../../types/admin'

const stats = ref<AdminStats | null>(null)
const recentTrips = ref<AdminTrip[]>([])
const recentUsers = ref<AdminUser[]>([])
const loading = ref(true)

const statusColors: Record<string, string> = {
  planning: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  completed: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  cancelled: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
}

const statusLabel: Record<string, string> = {
  planning: 'Planification',
  active: 'En cours',
  completed: 'Terminé',
  cancelled: 'Annulé',
}

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })

const formatAmount = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)

onMounted(async () => {
  try {
    const [statsData, tripsData, usersData] = await Promise.all([
      getStats(),
      getTrips(1),
      getUsers(1),
    ])
    stats.value = statsData
    recentTrips.value = tripsData.data.slice(0, 5)
    recentUsers.value = usersData.data.slice(0, 5)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <AdminLayout>
    <div class="animate-fade-in">
      
      <div class="mb-10">
        <h1 class="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Dashboard</h1>
        <p class="text-slate-600 dark:text-slate-400">Vue d'ensemble de la plateforme RoadTripCollab</p>
      </div>

      <div v-if="loading" class="flex flex-col items-center justify-center py-20">
        <div class="w-12 h-12 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin mb-4"></div>
        <p class="text-slate-500">Chargement des données...</p>
      </div>

      <template v-else>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          
          <div class="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center text-2xl">
              <i class="fi fi-rr-users-alt"></i>
            </div>
            <div>
              <p class="text-3xl font-bold text-slate-900 dark:text-white">{{ stats?.totalUsers ?? 0 }}</p>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Utilisateurs</p>
            </div>
          </div>

          <div class="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/30 text-primary-500 flex items-center justify-center text-2xl">
              <i class="fi fi-rr-road"></i>
            </div>
            <div>
              <p class="text-3xl font-bold text-slate-900 dark:text-white">{{ stats?.totalTrips ?? 0 }}</p>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Voyages créés</p>
            </div>
          </div>

          <div class="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 flex items-center justify-center text-2xl">
              <i class="fi fi-rr-map-marker"></i>
            </div>
            <div>
              <p class="text-3xl font-bold text-slate-900 dark:text-white">{{ stats?.totalStops ?? 0 }}</p>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Étapes planifiées</p>
            </div>
          </div>

          <div class="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-900/30 text-rose-500 flex items-center justify-center text-2xl">
              <i class="fi fi-rr-wallet"></i>
            </div>
            <div>
              <p class="text-2xl font-bold text-slate-900 dark:text-white truncate" :title="formatAmount(stats?.totalExpenseAmount ?? 0)">
                {{ formatAmount(stats?.totalExpenseAmount ?? 0) }}
              </p>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">
                Dépenses ({{ stats?.totalExpenses ?? 0 }})
              </p>
            </div>
          </div>

        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div class="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
            <div class="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h2 class="font-bold text-slate-900 dark:text-white">Derniers voyages créés</h2>
              <RouterLink to="/admin/trips" class="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors">Voir tout</RouterLink>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="text-xs uppercase text-slate-500 bg-slate-50 dark:bg-slate-900/30">
                    <th class="px-6 py-4 font-semibold">Voyage</th>
                    <th class="px-6 py-4 font-semibold">Statut</th>
                    <th class="px-6 py-4 font-semibold">Dates</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
                  <tr v-for="trip in recentTrips" :key="trip.id" class="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td class="px-6 py-4">
                      <p class="text-sm font-bold text-slate-900 dark:text-white mb-0.5">{{ trip.title }}</p>
                      <p class="text-xs text-slate-500">Par {{ trip.creator?.fullName || '—' }}</p>
                    </td>
                    <td class="px-6 py-4">
                      <span class="px-2.5 py-1 text-xs font-bold rounded-lg" :class="statusColors[trip.status] || 'bg-slate-100 text-slate-700'">
                        {{ statusLabel[trip.status] || trip.status }}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <p class="text-xs text-slate-600 dark:text-slate-400">
                        {{ formatDate(trip.startDate) }}<br/>{{ formatDate(trip.endDate) }}
                      </p>
                    </td>
                  </tr>
                  <tr v-if="recentTrips.length === 0">
                    <td colspan="3" class="px-6 py-8 text-center text-slate-500">Aucun voyage pour le moment.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
            <div class="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h2 class="font-bold text-slate-900 dark:text-white">Nouveaux inscrits</h2>
              <RouterLink to="/admin/users" class="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors">Voir tout</RouterLink>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="text-xs uppercase text-slate-500 bg-slate-50 dark:bg-slate-900/30">
                    <th class="px-6 py-4 font-semibold">Utilisateur</th>
                    <th class="px-6 py-4 font-semibold">Statut</th>
                    <th class="px-6 py-4 font-semibold">Inscription</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
                  <tr v-for="user in recentUsers" :key="user.id" class="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                          {{ user.fullName?.substring(0,2).toUpperCase() }}
                        </div>
                        <div>
                          <p class="text-sm font-bold text-slate-900 dark:text-white">{{ user.fullName }}</p>
                          <p class="text-xs text-slate-500">{{ user.email }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <span class="px-2.5 py-1 text-xs font-bold rounded-lg" :class="user.isVerified ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'">
                        {{ user.isVerified ? 'Vérifié' : 'Non vérifié' }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-xs text-slate-600 dark:text-slate-400">
                      {{ formatDate(user.createdAt) }}
                    </td>
                  </tr>
                  <tr v-if="recentUsers.length === 0">
                    <td colspan="3" class="px-6 py-8 text-center text-slate-500">Aucun utilisateur.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </template>
    </div>
  </AdminLayout>
</template>
