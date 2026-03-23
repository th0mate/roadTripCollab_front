<template>
  <div class="page-wrapper nav-safe-zone">
    <!-- Hero Section -->
    <section class="relative py-12 lg:py-20 overflow-hidden">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div class="text-center max-w-4xl mx-auto">
          <span class="badge-green mb-6">Tout-en-un</span>
          <h1 class="text-5xl lg:text-7xl font-black text-zinc-900 dark:text-white mb-8 tracking-tight leading-[1.1]">
            La plateforme pensée pour les <span class="text-primary-400">aventuriers</span> modernes.
          </h1>
          <p class="text-xl text-zinc-500 dark:text-zinc-400 leading-relaxed mb-12">
            De la première idée d'itinéraire à la gestion des dépenses après le retour, RoadTripCollab vous accompagne à chaque kilomètre.
          </p>
          <div class="flex flex-wrap justify-center gap-4">
            <router-link to="/register" class="btn-primary px-8 py-4 text-base">Commencer l'aventure</router-link>
            <a href="#details" class="btn-secondary px-8 py-4 text-base font-bold">Voir les détails</a>
          </div>
        </div>
      </div>
      
      <!-- Animated Background Elements -->
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none">
        <div class="absolute top-0 left-1/4 w-96 h-96 bg-primary-400/10 rounded-full blur-[120px] animate-pulse"></div>
        <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] animate-pulse" style="animation-delay: 2s"></div>
      </div>
    </section>

    <!-- Detailed Features Grid -->
    <section id="details" class="py-24 bg-zinc-50 dark:bg-zinc-900/30 transition-colors duration-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24">
          
          <!-- Feature 1: Map -->
          <div class="flex flex-col justify-center order-2 md:order-1">
            <div class="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-[#00d2ff] mb-8 shadow-lg shadow-blue-500/5">
              <i class="fi fi-rr-map-marker text-2xl"></i>
            </div>
            <h2 class="text-3xl lg:text-4xl font-black text-zinc-900 dark:text-white mb-6">Planification interactive sur carte</h2>
            <p class="text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed mb-8">
              Ajoutez vos étapes simplement en les recherchant. Notre intégration avec Google Places vous permet de trouver n'importe quel point d'intérêt, restaurant ou hôtel en un clin d'œil.
            </p>
            <ul class="space-y-4">
              <li class="flex items-center gap-3 font-bold text-zinc-700 dark:text-zinc-300">
                <i class="fi fi-rr-check-circle text-primary-400"></i>
                Optimisation d'itinéraire via OSRM
              </li>
              <li class="flex items-center gap-3 font-bold text-zinc-700 dark:text-zinc-300">
                <i class="fi fi-rr-check-circle text-primary-400"></i>
                Calcul automatique des temps de trajet
              </li>
              <li class="flex items-center gap-3 font-bold text-zinc-700 dark:text-zinc-300">
                <i class="fi fi-rr-check-circle text-primary-400"></i>
                Visualisation 2D/3D fluide
              </li>
            </ul>
          </div>
          <div class="order-1 md:order-2">
            <div class="paper-card overflow-hidden shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-700">
              <div class="bg-zinc-800 p-2 aspect-video flex items-center justify-center text-zinc-600 font-black italic">
                [ MAP INTERACTIVE PREVIEW ]
              </div>
            </div>
          </div>

          <!-- Feature 2: Expenses -->
          <div>
            <div class="paper-card overflow-hidden shadow-2xl -rotate-2 hover:rotate-0 transition-transform duration-700">
              <div class="bg-zinc-800 p-2 aspect-video flex items-center justify-center text-zinc-600 font-black italic">
                [ GESTION DES FRAIS PREVIEW ]
              </div>
            </div>
          </div>
          <div class="flex flex-col justify-center">
            <div class="w-14 h-14 rounded-2xl bg-primary-400/10 flex items-center justify-center text-primary-400 mb-8 shadow-lg shadow-primary-400/5">
              <i class="fi fi-rr-calculator text-2xl"></i>
            </div>
            <h2 class="text-3xl lg:text-4xl font-black text-zinc-900 dark:text-white mb-6">Finances transparentes entre amis</h2>
            <p class="text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed mb-8">
              Plus besoin de sortir la calculatrice au milieu du resto. Chaque voyageur saisit ses dépenses, choisit qui est concerné, et RoadTripCollab fait le reste.
            </p>
            <div class="grid grid-cols-2 gap-4">
              <div class="p-4 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50">
                <p class="text-primary-400 font-black text-xl mb-1">Split</p>
                <p class="text-xs text-zinc-500">Répartition équitable automatique</p>
              </div>
              <div class="p-4 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50">
                <p class="text-violet-500 font-black text-xl mb-1">Catégories</p>
                <p class="text-xs text-zinc-500">Suivi par type de dépense</p>
              </div>
            </div>
          </div>

          <!-- Feature 3: Photos & Social -->
          <div class="flex flex-col justify-center order-2 md:order-1">
            <div class="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center text-[#ff007c] mb-8 shadow-lg shadow-rose-500/5">
              <i class="fi fi-rr-camera text-2xl"></i>
            </div>
            <h2 class="text-3xl lg:text-4xl font-black text-zinc-900 dark:text-white mb-6">Un album de souvenirs partagé</h2>
            <p class="text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed mb-8">
              Chaque étape peut être illustrée. Vos photos sont géo-localisées et attachées à votre journal de bord. Une fois le voyage terminé, partagez-le sur le mur d'inspiration.
            </p>
            <div class="flex items-center gap-4">
              <div class="flex -space-x-3">
                <div v-for="i in 3" :key="i" class="w-10 h-10 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-200 overflow-hidden">
                  <img :src="`https://i.pravatar.cc/100?u=${i}`" alt="user" />
                </div>
              </div>
              <p class="text-sm font-bold text-zinc-600 dark:text-zinc-400">+ Toute l'équipe collabore</p>
            </div>
          </div>
          <div class="order-1 md:order-2">
            <div class="paper-card overflow-hidden shadow-2xl rotate-1 hover:rotate-0 transition-transform duration-700">
              <div class="bg-zinc-800 p-2 aspect-video flex items-center justify-center text-zinc-600 font-black italic">
                [ ALBUM PHOTO COLLABORATIF ]
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- Technical Specs -->
    <section class="py-24 relative">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-zinc-900 rounded-[3rem] p-12 lg:p-20 text-white relative overflow-hidden">
          <div class="absolute top-0 right-0 w-96 h-96 bg-primary-400/5 rounded-full blur-[100px]"></div>
          
          <div class="text-center mb-16">
            <h2 class="text-3xl lg:text-5xl font-black mb-6">Sous le capot</h2>
            <p class="text-zinc-400 max-w-2xl mx-auto text-lg">
              Une technologie robuste pour garantir la fiabilité de vos données même au bout du monde.
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div class="p-6 bg-white/5 rounded-3xl border border-white/10 text-center">
              <i class="fi fi-rr-rocket-lunch text-primary-400 text-3xl mb-4 block"></i>
              <h3 class="font-bold mb-2">Performance</h3>
              <p class="text-xs text-zinc-500">Optimisé pour charger instantanément sur mobile.</p>
            </div>
            <div class="p-6 bg-white/5 rounded-3xl border border-white/10 text-center">
              <i class="fi fi-rr-cloud-check text-blue-400 text-3xl mb-4 block"></i>
              <h3 class="font-bold mb-2">Cloud Sync</h3>
              <p class="text-xs text-zinc-500">Synchronisation en temps réel entre tous vos amis.</p>
            </div>
            <div class="p-6 bg-white/5 rounded-3xl border border-white/10 text-center">
              <i class="fi fi-rr-lock text-rose-400 text-3xl mb-4 block"></i>
              <h3 class="font-bold mb-2">Sécurité</h3>
              <p class="text-xs text-zinc-500">Chiffrement de vos données personnelles et mots de passe.</p>
            </div>
            <div class="p-6 bg-white/5 rounded-3xl border border-white/10 text-center">
              <i class="fi fi-rr-mobile-button text-violet-400 text-3xl mb-4 block"></i>
              <h3 class="font-bold mb-2">Responsive</h3>
              <p class="text-xs text-zinc-500">Une expérience parfaite sur smartphone, tablette et PC.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="py-24 text-center">
      <h2 class="text-3xl lg:text-4xl font-black text-zinc-900 dark:text-white mb-8">Prêt pour le départ ?</h2>
      <router-link to="/register" class="btn-primary !py-5 !px-12 !text-lg shadow-2xl">
        Créer mon premier voyage
        <i class="fi fi-rr-plane-departure ml-2"></i>
      </router-link>
    </section>
  </div>
</template>

<script setup lang="ts">
</script>
