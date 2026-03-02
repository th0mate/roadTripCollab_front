<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()
const isSidebarOpen = ref(false)

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

const closeSidebar = () => {
  isSidebarOpen.value = false
}
</script>

<template>
  <div class="admin-layout">
    <!-- Overlay mobile -->
    <div
      v-if="isSidebarOpen"
      class="admin-sidebar-overlay"
      @click="closeSidebar"
    />

    <!-- Sidebar -->
    <aside class="admin-sidebar" :class="{ 'admin-sidebar--open': isSidebarOpen }">
      <div class="admin-sidebar__logo">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:16px;height:16px;display:inline;margin-right:6px;vertical-align:middle;">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Administration
      </div>

      <nav class="admin-sidebar__nav">
        <RouterLink
          to="/admin/dashboard"
          class="admin-sidebar__link"
          @click="closeSidebar"
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="7" height="7" rx="1" fill="currentColor"/>
            <rect x="14" y="3" width="7" height="7" rx="1" fill="currentColor"/>
            <rect x="3" y="14" width="7" height="7" rx="1" fill="currentColor"/>
            <rect x="14" y="14" width="7" height="7" rx="1" fill="currentColor"/>
          </svg>
          Dashboard
        </RouterLink>

        <RouterLink
          to="/admin/users"
          class="admin-sidebar__link"
          @click="closeSidebar"
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Utilisateurs
        </RouterLink>

        <RouterLink
          to="/admin/trips"
          class="admin-sidebar__link"
          @click="closeSidebar"
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
          </svg>
          Voyages
        </RouterLink>

        <RouterLink
          to="/admin/stops"
          class="admin-sidebar__link"
          @click="closeSidebar"
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2 1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Étapes &amp; Photos
        </RouterLink>
      </nav>

      <div class="admin-sidebar__footer">
        <RouterLink to="/" class="admin-sidebar__back">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:14px;height:14px;">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Retour au site
        </RouterLink>
      </div>
    </aside>

    <!-- Contenu principal -->
    <div class="admin-main">
      <!-- Bouton burger mobile -->
      <button class="admin-burger" @click="toggleSidebar" aria-label="Menu administration">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>

      <div class="admin-content">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
@import '@/assets/styles/adminView.css';

.admin-sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 199;
}

.admin-burger {
  display: none;
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 201;
  background: var(--rtc-primary);
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.admin-burger svg {
  width: 22px;
  height: 22px;
}

@media (max-width: 768px) {
  .admin-burger {
    display: flex;
  }
}
</style>
