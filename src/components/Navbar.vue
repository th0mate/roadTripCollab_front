<template>
  <div :class="[isDashboard ? 'fixed top-0 z-50 w-full' : 'fixed top-0 z-50 w-full px-4 sm:px-6 lg:px-8 pt-4 pointer-events-none']">
    <nav :class="[
      isDashboard 
        ? 'w-full bg-white dark:bg-[#1C1C1E] border-b border-zinc-200 dark:border-zinc-800 pointer-events-auto' 
        : 'max-w-7xl mx-auto bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl shadow-lg shadow-black/5 dark:shadow-none pointer-events-auto transition-all duration-300'
    ]">
      <div :class="[isDashboard ? 'px-4' : 'px-4 sm:px-6']">
        <div :class="[isDashboard ? 'h-14' : 'h-16 sm:h-20']" class="flex justify-between items-center transition-all duration-300">
          <router-link to="/" class="flex items-center gap-3 group cursor-pointer">
            <div :class="[isDashboard ? 'w-8 h-8 rounded-lg' : 'w-10 h-10 rounded-xl']" class="bg-primary-400 flex items-center justify-center shadow-md shadow-primary-500/20 group-hover:scale-105 transition-all">
              <i class="fi fi-rr-road text-white dark:text-zinc-900 text-[14px] leading-none"></i>
            </div>
            <span :class="[isDashboard ? 'text-base' : 'text-lg']" class="font-extrabold tracking-tight">
              <span class="text-zinc-900 dark:text-white">RoadTrip</span><span class="text-primary-400">Collab</span>
            </span>
          </router-link>

          <div class="hidden md:flex items-center gap-1">
            <router-link to="/" class="nav-link" active-class="active">
              Accueil
            </router-link>
            <router-link to="/decouvrir" class="nav-link" active-class="active">
              Découvrir
            </router-link>
            
            <template v-if="!authStore.isAuthenticated">
              <router-link to="/fonctionnalites" class="nav-link" active-class="active">Fonctionnalités</router-link>
            </template>
            
            <template v-else>
              <router-link to="/my-trips" class="nav-link" active-class="active">
                Mes Voyages
              </router-link>
              <router-link to="/create-trip" class="nav-link" active-class="active">
                Nouveau
              </router-link>
              <router-link v-if="isAdmin" to="/admin/dashboard" class="nav-link" active-class="active">
                Administration
              </router-link>
            </template>

            <div class="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-3"></div>
            
            <button @click="themeStore.toggleTheme" class="p-2.5 rounded-2xl text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all active:scale-90 cursor-pointer" title="Changer le thème">
              <i :class="themeStore.isDark ? 'fi fi-rr-sun' : 'fi fi-rr-moon'" class="text-lg leading-none"></i>
            </button>

            <div class="flex items-center gap-2 ml-2">
              <template v-if="!authStore.isAuthenticated">
                <router-link v-if="route.path !== '/login'" to="/login" class="px-5 py-2.5 text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer">
                  Connexion
                </router-link>
                <router-link v-if="route.path !== '/register'" to="/register" class="btn-primary !px-6 !py-2.5 !text-sm">
                  S'inscrire
                </router-link>
              </template>
              
              <template v-else>
                <router-link to="/profile" class="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center hover:bg-primary-400 hover:text-white dark:hover:text-zinc-900 transition-all cursor-pointer" title="Mon Profil">
                  <i class="fi fi-rr-user text-lg leading-none"></i>
                </router-link>
                <button @click="handleLogout" class="p-2.5 rounded-xl text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all active:scale-90 cursor-pointer" title="Déconnexion">
                  <i class="fi fi-rr-exit text-lg leading-none"></i>
                </button>
              </template>
            </div>
          </div>

          <div class="md:hidden flex items-center gap-2">
            <button @click="themeStore.toggleTheme" class="p-2.5 rounded-xl text-zinc-600 dark:text-zinc-400 active:scale-90 cursor-pointer">
               <i :class="themeStore.isDark ? 'fi fi-rr-sun' : 'fi fi-rr-moon'" class="text-lg"></i>
            </button>
            <button class="p-2.5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer">
               <i class="fi fi-rr-menu-burger text-xl"></i>
            </button>
          </div>
        </div>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { useThemeStore } from '../stores/theme'
import { useAuthStore } from '../stores/auth'
import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'

const themeStore = useThemeStore()
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const isDashboard = computed(() => route.name === 'trip-dashboard' || route.name === 'trip-live')
const isAdmin = computed(() => authStore.isAdmin)

const handleLogout = () => {
  authStore.logout()
  router.push('/')
}
</script>
