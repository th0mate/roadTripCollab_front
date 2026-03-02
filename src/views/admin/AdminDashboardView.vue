<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import { getStats, getTrips, getUsers } from '@/services/adminService'
import type { AdminStats, AdminTrip, AdminUser } from '@/types/admin'

const stats = ref<AdminStats | null>(null)
const recentTrips = ref<AdminTrip[]>([])
const recentUsers = ref<AdminUser[]>([])
const loading = ref(true)

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
    <div class="admin-page-header">
      <h1>Dashboard</h1>
      <p>Vue d'ensemble de la plateforme RoadTrip Collab</p>
    </div>

    <div v-if="loading" class="admin-loading">Chargement des statistiques…</div>

    <template v-else>
      <!-- Stats cards -->
      <div class="admin-stats-grid">
        <div class="admin-stat-card">
          <div class="admin-stat-card__icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="admin-stat-card__body">
            <div class="admin-stat-card__value">{{ stats?.totalUsers ?? 0 }}</div>
            <div class="admin-stat-card__label">Utilisateurs</div>
          </div>
        </div>

        <div class="admin-stat-card">
          <div class="admin-stat-card__icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
            </svg>
          </div>
          <div class="admin-stat-card__body">
            <div class="admin-stat-card__value">{{ stats?.totalTrips ?? 0 }}</div>
            <div class="admin-stat-card__label">Voyages</div>
          </div>
        </div>

        <div class="admin-stat-card">
          <div class="admin-stat-card__icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 11l3 3L22 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="admin-stat-card__body">
            <div class="admin-stat-card__value">{{ stats?.totalStops ?? 0 }}</div>
            <div class="admin-stat-card__label">Étapes</div>
          </div>
        </div>

        <div class="admin-stat-card">
          <div class="admin-stat-card__icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="admin-stat-card__body">
            <div class="admin-stat-card__value">{{ formatAmount(stats?.totalExpenseAmount ?? 0) }}</div>
            <div class="admin-stat-card__label">Dépenses totales ({{ stats?.totalExpenses ?? 0 }})</div>
          </div>
        </div>
      </div>

      <!-- Derniers voyages -->
      <div class="admin-table-wrapper" style="margin-bottom: 24px;">
        <div style="padding: 16px 20px; border-bottom: 1px solid var(--rtc-border); font-weight: 700; font-size: 0.9rem;">
          Derniers voyages créés
        </div>
        <table class="admin-table">
          <thead>
            <tr>
              <th>Titre</th>
              <th>Créateur</th>
              <th>Statut</th>
              <th>Dates</th>
              <th>Budget</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="trip in recentTrips" :key="trip.id">
              <td><strong>{{ trip.title }}</strong></td>
              <td>{{ trip.creator?.fullName ?? '—' }}</td>
              <td>
                <span class="admin-badge" :class="`admin-badge--${trip.status}`">
                  {{ statusLabel[trip.status] ?? trip.status }}
                </span>
              </td>
              <td style="font-size: 0.75rem; color: var(--rtc-text-muted);">
                {{ formatDate(trip.startDate) }} → {{ formatDate(trip.endDate) }}
              </td>
              <td>{{ trip.budget ? formatAmount(trip.budget) : '—' }}</td>
            </tr>
            <tr v-if="recentTrips.length === 0">
              <td colspan="5" style="text-align:center; color: var(--rtc-text-muted);">Aucun voyage</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Derniers utilisateurs -->
      <div class="admin-table-wrapper">
        <div style="padding: 16px 20px; border-bottom: 1px solid var(--rtc-border); font-weight: 700; font-size: 0.9rem;">
          Derniers utilisateurs inscrits
        </div>
        <table class="admin-table">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Email</th>
              <th>Statut</th>
              <th>Inscription</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in recentUsers" :key="u.id">
              <td>
                <div class="admin-user-cell">
                  <div class="admin-avatar">{{ u.fullName?.substring(0, 2).toUpperCase() }}</div>
                  <div class="admin-user-cell__name">{{ u.fullName }}</div>
                </div>
              </td>
              <td>{{ u.email }}</td>
              <td>
                <span class="admin-badge" :class="u.isVerified ? 'admin-badge--verified' : 'admin-badge--unverified'">
                  {{ u.isVerified ? 'Vérifié' : 'Non vérifié' }}
                </span>
              </td>
              <td style="font-size: 0.75rem; color: var(--rtc-text-muted);">{{ formatDate(u.createdAt) }}</td>
            </tr>
            <tr v-if="recentUsers.length === 0">
              <td colspan="4" style="text-align:center; color: var(--rtc-text-muted);">Aucun utilisateur</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </AdminLayout>
</template>

<style scoped>
@import '@/assets/styles/adminView.css';
</style>
