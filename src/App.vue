<script setup lang="ts">
import {RouterLink, RouterView} from 'vue-router'
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
      <span class="header-link">Connexion</span>
    </div>
    <a href="" class="header-button">
      Inscription
    </a>
  </header>

  <RouterView class="router-view"/>
</template>

<style>
@import "@/assets/styles/generalView.css";
</style>
