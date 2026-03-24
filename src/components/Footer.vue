<template>
  <div class="px-4 sm:px-6 lg:px-8 pb-10 transition-colors duration-200">
    <footer class="max-w-7xl mx-auto bg-white dark:bg-[#1C1C1E] rounded-[2.5rem] border border-zinc-200/60 dark:border-zinc-800/50 shadow-sm p-8 sm:p-12 transition-colors duration-200">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
        <div class="col-span-1 md:col-span-1 flex flex-col items-start">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 bg-primary-400 dark:bg-primary-400 rounded-xl flex items-center justify-center shadow-md shadow-primary-500/20">
              <i class="fi fi-rr-road text-white dark:text-zinc-900 text-[16px] leading-none"></i>
            </div>
            <span class="font-extrabold text-lg text-zinc-900 dark:text-white tracking-tight">RoadTrip<span class="text-primary-400">Collab</span></span>
          </div>
          <p class="text-[15px] text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xs">
            Planifiez, partagez et vivez vos road trips inoubliables entre amis.
          </p>
        </div>

        <div>
          <h4 class="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-widest mb-6 border-l-2 border-primary-500 pl-3">Produit</h4>
          <ul class="space-y-3 pl-3">
            <li><router-link to="/decouvrir" class="text-[15px] font-medium text-zinc-500 dark:text-zinc-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Découvrir</router-link></li>
            <li><router-link to="/fonctionnalites" class="text-[15px] font-medium text-zinc-500 dark:text-zinc-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Fonctionnalités</router-link></li>
            <li><a href="#" class="text-[15px] font-medium text-zinc-500 dark:text-zinc-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Sécurité</a></li>
          </ul>
        </div>

        <div>
          <h4 class="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-widest mb-6 border-l-2 border-violet-500 pl-3">Compagnie</h4>
          <ul class="space-y-3 pl-3">
            <li><a href="#" class="text-[15px] font-medium text-zinc-500 dark:text-zinc-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">À propos</a></li>
            <li><a href="#" class="text-[15px] font-medium text-zinc-500 dark:text-zinc-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Blog</a></li>
            <li><a href="#" class="text-[15px] font-medium text-zinc-500 dark:text-zinc-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Contact</a></li>
          </ul>
        </div>

        <div>
          <h4 class="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-widest mb-6 border-l-2 border-amber-500 pl-3">Juridique</h4>
          <ul class="space-y-3 pl-3">
            <li><router-link to="/mentions-legales" class="text-[15px] font-medium text-zinc-500 dark:text-zinc-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Mentions légales</router-link></li>
            <li><router-link to="/politique-confidentialite" class="text-[15px] font-medium text-zinc-500 dark:text-zinc-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Confidentialité</router-link></li>
            <li><router-link to="/cookies" class="text-[15px] font-medium text-zinc-500 dark:text-zinc-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Cookies</router-link></li>
            <li><router-link to="/rgpd" class="text-[15px] font-medium text-zinc-500 dark:text-zinc-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">RGPD</router-link></li>
          </ul>
        </div>
      </div>

      <div class="mt-12 pt-8 border-t border-zinc-100 dark:border-zinc-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p class="text-sm font-medium text-zinc-400 dark:text-zinc-500">
          © 2026 RoadTripCollab. Conçu avec passion.
        </p>
        <div class="flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-100 dark:border-zinc-800">
          <span class="text-xs font-semibold text-zinc-500">Made with</span>
          <i class="fi fi-rr-heart text-rose-500 text-sm leading-none animate-pulse"></i>
        </div>
      </div>
    </footer>
  </div>
</template>
