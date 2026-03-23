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

const navigation = [
  { name: 'Dashboard', to: '/admin/dashboard', icon: 'fi-rr-apps' },
  { name: 'Utilisateurs', to: '/admin/users', icon: 'fi-rr-users' },
  { name: 'Voyages', to: '/admin/trips', icon: 'fi-rr-road' },
  { name: 'Étapes & Photos', to: '/admin/stops', icon: 'fi-rr-map-marker' },
]
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 flex">
    
    <!-- Mobile Overlay -->
    <div
      v-if="isSidebarOpen"
      class="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
      @click="closeSidebar"
    ></div>

    <!-- Sidebar -->
    <aside
      class="fixed top-0 left-0 bottom-0 z-50 w-72 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 shadow-2xl lg:shadow-none lg:static transform transition-transform duration-300 ease-in-out flex flex-col"
      :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
    >
      <!-- Logo -->
      <div class="px-8 py-6 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center">
          <i class="fi fi-rr-shield-check text-xl"></i>
        </div>
        <span class="text-xl font-bold text-slate-900 dark:text-white">AdminRTC</span>
      </div>

      <!-- Nav Links -->
      <nav class="flex-grow py-6 px-4 space-y-2 overflow-y-auto">
        <RouterLink
          v-for="item in navigation"
          :key="item.name"
          :to="item.to"
          @click="closeSidebar"
          class="flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all group"
          :class="route.path === item.to || route.path.startsWith(item.to + '/') ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700'"
        >
          <i :class="`fi ${item.icon} text-lg ${route.path === item.to || route.path.startsWith(item.to + '/') ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 group-hover:text-primary-500'}`"></i>
          {{ item.name }}
        </RouterLink>
      </nav>

      <!-- Footer -->
      <div class="p-6 border-t border-slate-100 dark:border-slate-700">
        <RouterLink to="/" class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
          <i class="fi fi-rr-arrow-left"></i>
          Retour au site
        </RouterLink>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-grow min-w-0 flex flex-col h-screen overflow-hidden">
      <!-- Mobile Header -->
      <header class="lg:hidden flex items-center justify-between px-4 py-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30">
        <div class="flex items-center gap-2 text-primary-600 font-bold">
          <i class="fi fi-rr-shield-check"></i> AdminRTC
        </div>
        <button @click="toggleSidebar" class="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
          <i class="fi fi-rr-menu-burger"></i>
        </button>
      </header>

      <!-- Page Content -->
      <div class="flex-grow overflow-y-auto p-4 sm:p-6 lg:p-10 custom-scrollbar">
        <slot />
      </div>
    </main>

  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
.dark .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #475569; }
</style>
