<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { RouterLink, RouterView, useRouter, useRoute } from 'vue-router';

const isAuthenticated = ref(false);
const router = useRouter();
const route = useRoute();

const checkAuth = () => {
  isAuthenticated.value = !!localStorage.getItem('authToken');
};

const logout = () => {
  localStorage.removeItem('authToken');
  checkAuth();
  router.push('/login');
};

onMounted(checkAuth);
watch(() => route.path, checkAuth);
</script>

<template>
  <header class="general-header">
    <a class="header-logo" href="/">
      <img src="@/assets/img/logos/black.png" alt="">
    </a>
    <div class="header-links">
      <RouterLink to="/" class="header-link">
        Accueil
      </RouterLink>
      <span class="header-link">Fonctionnalités</span>
      <span class="header-link">FAQ</span>
      <RouterLink v-if="!isAuthenticated" to="/login" class="header-link">Connexion</RouterLink>
      <a v-if="isAuthenticated" @click="logout" class="header-link" style="cursor: pointer;">Déconnexion</a>
    </div>
    <RouterLink v-if="!isAuthenticated" to="/register" class="header-button">
      Inscription
    </RouterLink>
  </header>

  <RouterView class="router-view"/>
</template>

<style>
@import "@/assets/styles/generalView.css";
</style>
