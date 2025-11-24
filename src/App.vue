<script setup lang="ts">
import {RouterLink, RouterView} from 'vue-router'
import {ref} from 'vue'

const isMobileMenuOpen = ref(false)

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}
</script>

<template>
  <header class="general-header">
    <a class="header-logo" href="/">
      <img src="@/assets/img/logos/black.png" alt="RoadTrip Collab">
    </a>

    <nav class="header-links">
      <RouterLink to="/" class="header-link">
        Accueil
      </RouterLink>
      <span class="header-link">Fonctionnalités</span>
      <span class="header-link">FAQ</span>
      <span class="header-link">Connexion</span>
    </nav>

    <a href="" class="header-button">
      Inscription
    </a>

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
      <RouterLink to="/" class="mobile-menu-link" @click="closeMobileMenu">
        Accueil
      </RouterLink>
      <span class="mobile-menu-link" @click="closeMobileMenu">Fonctionnalités</span>
      <span class="mobile-menu-link" @click="closeMobileMenu">FAQ</span>
      <span class="mobile-menu-link" @click="closeMobileMenu">Connexion</span>
      <a href="" class="mobile-menu-button" @click="closeMobileMenu">
        Inscription
      </a>
    </div>
  </nav>

  <RouterView class="router-view"/>
</template>

<style>
@import "@/assets/styles/generalView.css";
</style>
