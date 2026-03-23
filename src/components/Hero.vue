<template>
  <section class="pt-28 pb-12 lg:pt-40 lg:pb-20 transition-colors duration-500 overflow-hidden relative">
    <!-- Subtle background decoration -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div class="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary-400/10 dark:bg-primary-400/5 rounded-full blur-[120px]"></div>
      <div class="absolute -bottom-20 -left-20 w-96 h-96 bg-blue-400/10 dark:bg-blue-500/5 rounded-full blur-[100px]"></div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      <div class="lg:grid lg:grid-cols-2 lg:gap-16 items-center">

        <!-- Text Content -->
        <div class="text-center lg:text-left pt-8 lg:pt-0">
          <!-- Tag -->
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 rounded-full text-[13px] font-bold mb-8 shadow-sm">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-primary-400"></span>
            </span>
            Nouveau : Planificateur d'itinéraires IA
          </div>

          <h1 class="text-5xl lg:text-6xl xl:text-[5rem] font-black tracking-tight text-zinc-900 dark:text-white mb-8 leading-[1]">
            L'aventure <span class="text-primary-400 drop-shadow-[0_0_15px_rgba(var(--color-primary-400),0.3)]">ensemble</span>, simplifiée.
          </h1>

          <p class="text-lg text-zinc-500 dark:text-zinc-400 mb-10 max-w-lg mx-auto lg:mx-0 leading-relaxed font-medium">
            Planifiez vos itinéraires, gérez vos dépenses et capturez vos souvenirs. Le compagnon idéal pour vos road trips entre amis.
          </p>

          <div class="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
            <router-link to="/register" class="btn-primary px-10 py-4 text-base w-full sm:w-auto">
              Commencer l'aventure
              <i class="fi fi-rr-arrow-right text-lg"></i>
            </router-link>
            <a href="#features" class="btn-ghost px-8 py-4 text-base font-bold w-full sm:w-auto">
              Découvrir
            </a>
          </div>

          <!-- Social proof -->
          <div class="mt-12 flex items-center justify-center lg:justify-start gap-4">
            <div class="flex -space-x-3">
              <div v-for="i in 4" :key="i" class="w-10 h-10 rounded-full border-2 border-white dark:border-[#0c0c0e] bg-zinc-200 dark:bg-zinc-800 overflow-hidden ring-4 ring-zinc-50 dark:ring-white/5">
                <img :src="`https://i.pravatar.cc/150?u=nature${i}`" :alt="`User ${i}`" class="w-full h-full object-cover" />
              </div>
            </div>
            <div class="text-left">
              <div class="flex items-center gap-1 text-primary-400">
                <i v-for="i in 5" :key="i" class="fi fi-ss-star text-[10px]"></i>
              </div>
              <p class="text-xs text-zinc-500 dark:text-zinc-400">
                <span class="font-bold text-zinc-900 dark:text-white">12,000+</span> voyageurs ravis
              </p>
            </div>
          </div>
        </div>

        <!-- Visual / Stats cards -->
        <div class="hidden lg:block mt-10 lg:mt-0">
          <div class="relative">
            <!-- Glass background effect -->
            <div class="absolute inset-0 bg-gradient-to-br from-primary-400/10 to-blue-500/10 blur-2xl rounded-full opacity-50 scale-90"></div>
            
            <!-- Main card -->
            <div class="bg-white dark:bg-[#1C1C1E] rounded-[3rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-zinc-200 dark:border-white/5 relative z-10">
              <div class="flex items-center justify-between mb-10">
                <div>
                  <p class="text-[11px] font-black uppercase tracking-widest text-zinc-400 mb-2">Prochaine étape</p>
                  <h3 class="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
                    <div class="w-2 h-2 rounded-full bg-primary-400"></div>
                    Road Trip Islande
                  </h3>
                </div>
                <div class="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-900 dark:text-primary-400">
                  <i class="fi fi-rr-map-marker text-xl"></i>
                </div>
              </div>

              <!-- Progress bar -->
              <div class="mb-10 p-6 bg-zinc-50 dark:bg-white/5 rounded-3xl">
                <div class="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-3 font-bold uppercase tracking-wider">
                  <span>Progression</span>
                  <span class="text-primary-400">62%</span>
                </div>
                <div class="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div class="h-full bg-primary-400 rounded-full transition-all duration-1000" style="width: 62%"></div>
                </div>
              </div>

              <!-- Stats row -->
              <div class="grid grid-cols-3 gap-6">
                <div class="bg-zinc-50 dark:bg-white/5 p-4 rounded-2xl text-center">
                  <p class="text-2xl font-black text-zinc-900 dark:text-white">12</p>
                  <p class="text-[10px] font-bold text-zinc-400 uppercase mt-1">Jours</p>
                </div>
                <div class="bg-zinc-50 dark:bg-white/5 p-4 rounded-2xl text-center">
                  <p class="text-2xl font-black text-primary-400">8</p>
                  <p class="text-[10px] font-bold text-zinc-400 uppercase mt-1">Étapes</p>
                </div>
                <div class="bg-zinc-50 dark:bg-white/5 p-4 rounded-2xl text-center">
                  <p class="text-2xl font-black text-blue-500">4</p>
                  <p class="text-[10px] font-bold text-zinc-400 uppercase mt-1">Amis</p>
                </div>
              </div>
            </div>

            <!-- Floating components -->
            <div class="absolute -bottom-10 -right-6 bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow-2xl border border-zinc-100 dark:border-white/10 z-20 animate-bounce-slow">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-primary-400 rounded-xl flex items-center justify-center text-zinc-950">
                  <i class="fi fi-rr-wallet text-lg"></i>
                </div>
                <div>
                  <p class="text-[10px] font-bold text-zinc-400 uppercase">Budget</p>
                  <p class="text-sm font-black text-zinc-900 dark:text-white">850.00 €</p>
                </div>
              </div>
            </div>

            <div class="absolute top-10 -left-10 bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow-2xl border border-zinc-100 dark:border-white/10 z-20 animate-float">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white">
                  <i class="fi fi-rr-camera text-lg"></i>
                </div>
                <div>
                  <p class="text-[10px] font-bold text-zinc-400 uppercase">Photos</p>
                  <p class="text-sm font-black text-zinc-900 dark:text-white">1,248</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </section>
</template>

<style scoped>
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
@keyframes bounce-slow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(5px); }
}
.animate-float { animation: float 4s ease-in-out infinite; }
.animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
</style>


<script setup lang="ts">
</script>
