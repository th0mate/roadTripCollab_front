<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { RouterLink, RouterView, useRouter, useRoute } from 'vue-router'
import { isAuthenticated as checkAuthStatus, logout as authLogout } from '@/services/authService'

const isMobileMenuOpen = ref(false)

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

const isAuthenticated = ref(false)
const router = useRouter()
const route = useRoute()

const checkAuth = () => {
  isAuthenticated.value = checkAuthStatus()
}

const logout = async () => {
  try {
    await authLogout()
    checkAuth()
    router.push('/login')
  } catch (error) {
    console.error('Failed to logout:', error)
  }
}

onMounted(checkAuth)
watch(
  () => route.path,
  () => {
    checkAuth()
  }
)
</script>

<template>
  <header class="general-header">
    <a class="header-logo" href="/">
      <img src="@/assets/img/logos/black.png" alt="RoadTrip Collab" />
    </a>

    <nav class="header-links">
      <RouterLink to="/" class="header-link"> Accueil </RouterLink>
      <span class="header-link">Fonctionnalités</span>
      <span class="header-link">FAQ</span>
      <RouterLink v-if="!isAuthenticated" to="/login" class="header-link">Connexion</RouterLink>
      <RouterLink v-if="isAuthenticated" to="/profile" class="header-link">Profil</RouterLink>
      <a v-if="isAuthenticated" @click="logout" class="header-link" style="cursor: pointer"
        >Déconnexion</a
      >
    </nav>

    <RouterLink v-if="!isAuthenticated" to="/register" class="header-button">
      Inscription
    </RouterLink>

    <button class="hamburger-button" @click="toggleMobileMenu" :class="{ active: isMobileMenuOpen }">
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
      <i class="fi fi-rr-cross hamburger-close-icon"></i>
    </button>
  </header>

  <div class="mobile-menu-overlay" :class="{ active: isMobileMenuOpen }" @click="closeMobileMenu"></div>

  <nav class="mobile-menu" :class="{ active: isMobileMenuOpen }">
    <div class="mobile-menu-links">
      <RouterLink to="/" class="mobile-menu-link" @click="closeMobileMenu"> Accueil </RouterLink>
      <span class="mobile-menu-link" @click="closeMobileMenu">Fonctionnalités</span>
      <span class="mobile-menu-link" @click="closeMobileMenu">FAQ</span>
      <RouterLink v-if="!isAuthenticated" to="/login" class="mobile-menu-link" @click="closeMobileMenu">
        Connexion
      </RouterLink>
      <RouterLink v-if="isAuthenticated" to="/profile" class="mobile-menu-link" @click="closeMobileMenu">
        Profil
      </RouterLink>
      <a v-if="isAuthenticated" @click="logout" class="mobile-menu-link" style="cursor: pointer">
        Déconnexion
      </a>
      <RouterLink
        v-if="!isAuthenticated"
        to="/register"
        class="mobile-menu-button"
        @click="closeMobileMenu"
      >
        Inscription
      </RouterLink>
    </div>
  </nav>

  <RouterView class="router-view" />
</template>

<style>
@import '@/assets/styles/generalView.css';
</style>
