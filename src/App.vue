<template>
  <div class="min-h-screen flex flex-col selection:bg-primary-400/30 selection:text-primary-400">
    <Navbar v-if="!isAdminRoute" />
    <main class="flex-grow">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <Footer v-if="showFooter && !isAdminRoute" />
    <AppToast />
  </div>
</template>

<script setup lang="ts">
import Navbar from './components/Navbar.vue'
import Footer from './components/Footer.vue'
import AppToast from './components/AppToast.vue'
import { onMounted, computed } from 'vue'
import { useAuthStore } from './stores/auth'
import { useThemeStore } from './stores/theme'
import { useRoute } from 'vue-router'

const authStore = useAuthStore()
const themeStore = useThemeStore()
const route = useRoute()

const isAdminRoute = computed(() => !!route.meta.requiresAdmin)

const showFooter = computed(() => {
  return !['login', 'register', 'forgot-password', 'reset-password', 'create-trip', 'trip-dashboard'].includes(route.name as string)
})

onMounted(() => {
  authStore.checkAuth()
  if (themeStore.isDark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
})
</script>

<style scoped>
/* Scoped styles can go here if needed */
</style>

