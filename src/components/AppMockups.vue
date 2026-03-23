<template>
  <section id="mockups" class="py-20 bg-white dark:bg-zinc-900 transition-colors duration-200 overflow-hidden">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="lg:grid lg:grid-cols-2 lg:gap-16 items-center">

        <!-- Text side -->
        <div class="text-center lg:text-left mb-12 lg:mb-0">
          <span class="section-label mb-3 inline-block">Interface</span>
          <h2 class="text-3xl lg:text-4xl font-bold text-zinc-900 dark:text-white mb-8">
            Pensée pour la <span class="text-primary-500">fluidité</span>
          </h2>

          <div class="space-y-5">
            <div v-for="feature in uiFeatures" :key="feature.title" class="flex items-start gap-4 p-4 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all cursor-default group">
              <div
                class="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200"
                :class="feature.bgClass"
              >
                <i :class="`fi ${feature.icon} ${feature.iconClass} text-sm leading-none`"></i>
              </div>
              <div>
                <h4 class="font-semibold text-zinc-900 dark:text-white mb-0.5">{{ feature.title }}</h4>
                <p class="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{{ feature.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Mockup side -->
        <div class="relative">
          <!-- Main App Mockup -->
          <div class="relative z-10 paper-card overflow-hidden shadow-xl lg:-rotate-2 hover:rotate-0 transition-transform duration-500">
            <div class="bg-zinc-100 dark:bg-zinc-700 px-3 py-2.5 flex gap-1.5 items-center border-b border-zinc-200 dark:border-zinc-700">
              <div class="w-2.5 h-2.5 rounded-full bg-rose-400"></div>
              <div class="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
              <div class="w-2.5 h-2.5 rounded-full bg-primary-400"></div>
              <div class="flex-grow flex justify-center">
                <div class="h-4 w-36 bg-zinc-200 dark:bg-zinc-600 rounded-md text-[10px] text-zinc-400 flex items-center justify-center px-2">roadtripcollab.app</div>
              </div>
            </div>
            <div class="p-5 space-y-4">
              <div class="h-28 w-full bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl"></div>
              <div class="grid grid-cols-3 gap-2">
                <div v-for="i in 3" :key="i" class="h-20 bg-zinc-100 dark:bg-zinc-700 rounded-xl animate-pulse" :style="{ animationDelay: `${i * 0.2}s` }"></div>
              </div>
              <div class="space-y-2">
                <div class="h-2.5 w-full bg-zinc-100 dark:bg-zinc-700 rounded-full"></div>
                <div class="h-2.5 w-3/4 bg-zinc-100 dark:bg-zinc-700 rounded-full"></div>
              </div>
            </div>
          </div>

          <!-- Floating Mobile Mockup -->
          <div class="absolute -bottom-8 -right-8 z-20 w-36 hidden md:block">
            <div class="bg-zinc-900 rounded-[2rem] border-4 border-zinc-800 shadow-2xl overflow-hidden aspect-[9/19]">
              <div class="bg-white dark:bg-zinc-900 h-full p-3 pt-6 space-y-2.5">
                <div class="h-14 w-full bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg"></div>
                <div v-for="i in 3" :key="i" class="h-7 w-full bg-zinc-100 dark:bg-zinc-800 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const uiFeatures = [
  {
    title: 'Mobile First',
    description: 'Accédez à vos trajets sur la route avec une application parfaitement responsive.',
    icon: 'fi-rr-smartphone',
    bgClass: 'bg-primary-50 dark:bg-primary-500/10',
    iconClass: 'text-primary-600 dark:text-primary-400'
  },
  {
    title: 'Clarté Visuelle',
    description: 'Des graphiques et cartes en temps réel pour une compréhension immédiate.',
    icon: 'fi-rr-eye',
    bgClass: 'bg-blue-50 dark:bg-blue-500/10',
    iconClass: 'text-blue-600 dark:text-blue-400'
  },
  {
    title: 'Personnalisable',
    description: 'Configurez vos préférences, thème et notifications selon vos envies.',
    icon: 'fi-rr-settings',
    bgClass: 'bg-violet-50 dark:bg-violet-500/10',
    iconClass: 'text-violet-600 dark:text-violet-400'
  }
]
</script>
