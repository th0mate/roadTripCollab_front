<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { RouterLink, RouterView, useRouter, useRoute } from 'vue-router'
import { isAuthenticated as checkAuthStatus, logout as authLogout, getMe, isAdminUser, removeToken } from '@/services/authService'
import type { User } from '@/types/user'

const isMobileMenuOpen = ref(false)
const isProfileDropdownOpen = ref(false)
const user = ref<User | null>(null)
const router = useRouter()
const route = useRoute()
const isAuthenticated = ref(false)
const isAdmin = ref(false)
const profileDropdownRef = ref<HTMLElement | null>(null)

const apiBaseUrl = import.meta.env.VITE_API_URL || ''

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
  if (isMobileMenuOpen.value) {
    isProfileDropdownOpen.value = false
  }
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

const toggleProfileDropdown = () => {
  isProfileDropdownOpen.value = !isProfileDropdownOpen.value
}

const closeProfileDropdown = () => {
  isProfileDropdownOpen.value = false
}

const handleClickOutside = (event: MouseEvent) => {
  if (profileDropdownRef.value && !profileDropdownRef.value.contains(event.target as Node)) {
    closeProfileDropdown()
  }
}

const checkAuth = async () => {
  isAuthenticated.value = checkAuthStatus()
  if (isAuthenticated.value) {
    try {
      user.value = await getMe()
      isAdmin.value = isAdminUser()
    } catch (error) {
      console.error('Failed to get user data:', error)
      user.value = null
      isAdmin.value = false
      isAuthenticated.value = false
      removeToken()
    }
  } else {
    user.value = null
    isAdmin.value = false
  }
}

const logout = async () => {
  try {
    await authLogout()
    user.value = null
    isAuthenticated.value = false
    closeProfileDropdown()
    closeMobileMenu()
    router.push('/login')
  } catch (error) {
    console.error('Failed to logout:', error)
  }
}

const userInitials = computed(() => {
  if (!user.value?.fullName) return '?'
  const parts = user.value.fullName.trim().split(' ')
  if (parts.length >= 2) {
    const firstInitial = parts[0]?.[0] || ''
    const lastInitial = parts[parts.length - 1]?.[0] || ''
    return (firstInitial + lastInitial).toUpperCase()
  }
  return parts[0]?.substring(0, 2).toUpperCase() || '?'
})

const userProfilePicture = computed(() => {
  if (user.value?.profilePicture) {
    if (user.value.profilePicture.startsWith('http')) {
      return user.value.profilePicture
    }
    return `${apiBaseUrl}${user.value.profilePicture}`
  }
  return null
})

onMounted(() => {
  checkAuth()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

watch(
  () => route.path,
  () => {
    checkAuth()
    closeProfileDropdown()
    closeMobileMenu()
  }
)
</script>

<template>
  <header class="rtc-navbar">
    <a class="rtc-navbar__logo" href="/">
      <img src="@/assets/img/logos/black.png" alt="RoadTrip Collab" />
    </a>

    <nav class="rtc-navbar__nav">
      <RouterLink to="/" class="rtc-navbar__link">Accueil</RouterLink>
      <RouterLink v-if="isAuthenticated" to="/create-trip" class="rtc-navbar__link">Créer un voyage</RouterLink>
      <RouterLink v-if="isAuthenticated" to="/my-trips" class="rtc-navbar__link">Mes voyages</RouterLink>
      <RouterLink v-if="isAuthenticated && isAdmin" to="/admin/dashboard" class="rtc-navbar__link">Administration</RouterLink>
      <span class="rtc-navbar__link">Fonctionnalités</span>
      <span class="rtc-navbar__link">FAQ</span>
      <RouterLink v-if="!isAuthenticated" to="/login" class="rtc-navbar__link">Connexion</RouterLink>
    </nav>

    <div class="rtc-navbar__actions">
      <div v-if="isAuthenticated && user" class="rtc-navbar__profile" ref="profileDropdownRef">
        <button
          class="rtc-navbar__profile-trigger"
          :class="{ active: isProfileDropdownOpen }"
          @click.stop="toggleProfileDropdown"
        >
          <div class="rtc-navbar__avatar">
            <img v-if="userProfilePicture" :src="userProfilePicture" :alt="user.fullName" />
            <span v-else>{{ userInitials }}</span>
          </div>
          <span class="rtc-navbar__username">{{ user.fullName }}</span>
          <svg class="rtc-navbar__chevron" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 10l5 5 5-5H7z" fill="currentColor"/>
          </svg>
        </button>

        <div class="rtc-navbar__dropdown" :class="{ active: isProfileDropdownOpen }">
          <div class="rtc-navbar__dropdown-header">
            <div class="rtc-navbar__dropdown-avatar">
              <img v-if="userProfilePicture" :src="userProfilePicture" :alt="user.fullName" />
              <span v-else>{{ userInitials }}</span>
            </div>
            <div class="rtc-navbar__dropdown-info">
              <p class="rtc-navbar__dropdown-name">{{ user.fullName }}</p>
              <p class="rtc-navbar__dropdown-email">{{ user.email }}</p>
            </div>
          </div>
          <div class="rtc-navbar__dropdown-menu">
            <RouterLink to="/profile" class="rtc-navbar__dropdown-item" @click="closeProfileDropdown">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/>
              </svg>
              Mon profil
            </RouterLink>
            <div class="rtc-navbar__dropdown-divider"></div>
            <button class="rtc-navbar__dropdown-item rtc-navbar__dropdown-item--danger" @click="logout">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" fill="currentColor"/>
              </svg>
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      <RouterLink v-if="!isAuthenticated" to="/register" class="rtc-navbar__cta">
        <span>Inscription</span>
      </RouterLink>
    </div>

    <button class="rtc-navbar__hamburger" @click="toggleMobileMenu" :class="{ active: isMobileMenuOpen }">
      <span class="rtc-navbar__hamburger-line"></span>
      <span class="rtc-navbar__hamburger-line"></span>
      <span class="rtc-navbar__hamburger-line"></span>
      <i class="fi fi-rr-cross rtc-navbar__hamburger-close"></i>
    </button>
  </header>

  <div class="rtc-mobile-overlay" :class="{ active: isMobileMenuOpen }" @click="closeMobileMenu"></div>

  <nav class="rtc-mobile-menu" :class="{ active: isMobileMenuOpen }">
    <div v-if="isAuthenticated && user" class="rtc-mobile-menu__user">
      <div class="rtc-mobile-menu__user-avatar">
        <img v-if="userProfilePicture" :src="userProfilePicture" :alt="user.fullName" />
        <span v-else>{{ userInitials }}</span>
      </div>
      <div class="rtc-mobile-menu__user-info">
        <p class="rtc-mobile-menu__user-name">{{ user.fullName }}</p>
        <p class="rtc-mobile-menu__user-email">{{ user.email }}</p>
      </div>
    </div>

    <div class="rtc-mobile-menu__links">
      <RouterLink to="/" class="rtc-mobile-menu__link" @click="closeMobileMenu">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="currentColor"/>
        </svg>
        Accueil
      </RouterLink>
      <RouterLink v-if="isAuthenticated" to="/create-trip" class="rtc-mobile-menu__link" @click="closeMobileMenu">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
        </svg>
        Créer un voyage
      </RouterLink>
      <RouterLink v-if="isAuthenticated" to="/my-trips" class="rtc-mobile-menu__link" @click="closeMobileMenu">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" fill="currentColor"/>
        </svg>
        Mes voyages
      </RouterLink>
      <RouterLink v-if="isAuthenticated && isAdmin" to="/admin/dashboard" class="rtc-mobile-menu__link" @click="closeMobileMenu">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Administration
      </RouterLink>
      <span class="rtc-mobile-menu__link" @click="closeMobileMenu">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" fill="currentColor"/>
        </svg>
        Fonctionnalités
      </span>
      <span class="rtc-mobile-menu__link" @click="closeMobileMenu">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" fill="currentColor"/>
        </svg>
        FAQ
      </span>

      <div v-if="!isAuthenticated" class="rtc-mobile-menu__divider"></div>

      <RouterLink v-if="!isAuthenticated" to="/login" class="rtc-mobile-menu__link" @click="closeMobileMenu">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11 7L9.6 8.4l2.6 2.6H2v2h10.2l-2.6 2.6L11 17l5-5-5-5zm9 12h-8v2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-8v2h8v14z" fill="currentColor"/>
        </svg>
        Connexion
      </RouterLink>

      <template v-if="isAuthenticated">
        <div class="rtc-mobile-menu__divider"></div>
        <RouterLink to="/profile" class="rtc-mobile-menu__link" @click="closeMobileMenu">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/>
          </svg>
          Mon profil
        </RouterLink>
        <button class="rtc-mobile-menu__link rtc-mobile-menu__link--danger" @click="logout">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" fill="currentColor"/>
          </svg>
          Déconnexion
        </button>
      </template>
    </div>

    <RouterLink v-if="!isAuthenticated" to="/register" class="rtc-mobile-menu__cta" @click="closeMobileMenu">
      Inscription
    </RouterLink>
  </nav>

  <RouterView class="router-view" />
</template>

<style>
@import '@/assets/styles/generalView.css';
</style>

