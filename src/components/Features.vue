<template>
  <section id="features" class="py-24 transition-colors duration-200 overflow-hidden relative">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      <div class="text-center max-w-2xl mx-auto mb-20">
        <span class="section-label mb-3 inline-block">L'expérience ultime</span>
        <h2 class="text-4xl lg:text-5xl font-black text-zinc-900 dark:text-white mb-6">
          Tout pour un voyage <span class="text-primary-400">parfait</span>
        </h2>
        <p class="text-zinc-500 dark:text-zinc-400 text-lg">
          Oubliez les fichiers Excel. Gérez votre itinéraire, vos amis et vos dépenses au même endroit.
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <div
          v-for="(feat, index) in features"
          :key="index"
          @click="$router.push('/fonctionnalites')"
          class="feature-card group p-8 rounded-[2.5rem] bg-white dark:bg-[#1C1C1E] border border-zinc-200/50 dark:border-zinc-800/50 transition-all duration-500 hover:-translate-y-2 relative overflow-hidden cursor-pointer"
          :style="{ '--neon-color': feat.glowColor }"
        >
          <div class="absolute -inset-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl z-0" :style="{ backgroundColor: feat.glowColor }"></div>

          <div class="relative z-10">
            <div
              class="w-16 h-16 rounded-2xl flex items-center justify-center mb-8 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-lg"
              :class="feat.bgClass"
            >
              <i :class="['fi text-2xl leading-none', feat.icon, feat.iconClass]"></i>
            </div>
            <h3 class="text-xl font-black text-zinc-900 dark:text-white mb-4">{{ feat.title }}</h3>
            <p class="text-zinc-500 dark:text-zinc-400 text-[15px] leading-relaxed">
              {{ feat.description }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const features = [
  {
    title: "Itinéraires Opti",
    description: "Planifiez vos étapes sur une carte interactive. Notre algorithme calcule les distances et le temps de trajet.",
    icon: "fi-rr-map-marker-home",
    bgClass: "bg-blue-500/10",
    iconClass: "text-[#00d2ff]",
    glowColor: "rgba(0, 210, 255, 0.15)"
  },
  {
    title: "Dépenses Partagées",
    description: "Fini les calculs complexes. Notez chaque dépense et sachez instantanément qui doit quoi à qui.",
    icon: "fi-rr-calculator",
    bgClass: "bg-primary-400/10",
    iconClass: "text-primary-400",
    glowColor: "rgba(159, 224, 0, 0.15)"
  },
  {
    title: "Album Collaboratif",
    description: "Capturez l'instant. Ajoutez des photos à chaque étape pour créer un journal de bord mémorable entre amis.",
    icon: "fi-rr-camera",
    bgClass: "bg-rose-500/10",
    iconClass: "text-[#ff007c]",
    glowColor: "rgba(255, 0, 124, 0.15)"
  },
  {
    title: "Social & Chat",
    description: "Invitez vos amis par email et discutez en temps réel pour coordonner les prochaines étapes.",
    icon: "fi-rr-comment",
    bgClass: "bg-violet-500/10",
    iconClass: "text-[#9d50bb]",
    glowColor: "rgba(157, 80, 187, 0.15)"
  },
  {
    title: "Exploration Publique",
    description: "Partagez vos voyages terminés avec la communauté et inspirez-vous des aventures des autres membres.",
    icon: "fi-rr-globe",
    bgClass: "bg-amber-500/10",
    iconClass: "text-[#ff9d00]",
    glowColor: "rgba(255, 157, 0, 0.15)"
  },
  {
    title: "Profil Voyageur",
    description: "Gérez votre compte, vos préférences et retrouvez l'historique complet de toutes vos explorations passées.",
    icon: "fi-rr-user-gear",
    bgClass: "bg-emerald-500/10",
    iconClass: "text-[#00ff88]",
    glowColor: "rgba(0, 255, 136, 0.15)"
  }
]
</script>

<style scoped>
.feature-card:hover {
  border-color: var(--neon-color);
  background-color: rgba(255, 255, 255, 0.9);
}
.dark .feature-card:hover {
  background-color: rgba(28, 28, 30, 0.9);
}
</style>
