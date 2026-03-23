<template>
  <div class="page-wrapper nav-safe-zone bg-zinc-50 dark:bg-[#0c0c0e]">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
      <div class="flex flex-col lg:flex-row gap-12">
        
        <!-- Sidebar Navigation -->
        <aside class="lg:w-64 shrink-0">
          <div class="sticky top-32 space-y-1">
            <p class="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-4 px-4">Navigation</p>
            <router-link to="/mentions-legales" class="legal-nav-link">Mentions Légales</router-link>
            <router-link to="/politique-confidentialite" class="legal-nav-link">Confidentialité</router-link>
            <router-link to="/cookies" class="legal-nav-link active">Cookies</router-link>
            <router-link to="/rgpd" class="legal-nav-link">RGPD</router-link>
          </div>
        </aside>

        <!-- Main Content -->
        <main class="flex-grow max-w-3xl">
          <header class="mb-12">
            <h1 class="text-4xl lg:text-5xl font-black text-zinc-900 dark:text-white mb-4 tracking-tight">Politique des <span class="text-primary-400">Cookies</span></h1>
            <p class="text-zinc-500 dark:text-zinc-400 font-medium">Transparence totale sur les technologies que nous utilisons.</p>
          </header>

          <div class="space-y-12">
            <section>
              <h2 class="text-2xl font-bold text-zinc-900 dark:text-white mb-6">Qu'est-ce qu'un cookie ?</h2>
              <div class="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-8 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm">
                <p class="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Un cookie est un petit fichier texte déposé sur votre terminal lors de la consultation d'un site web. Il permet à son émetteur d'identifier le terminal dans lequel il est enregistré, pendant la durée de validité ou d'enregistrement dudit cookie.
                </p>
              </div>
            </section>

            <section>
              <h2 class="text-2xl font-bold text-zinc-900 dark:text-white mb-6">Les cookies que nous utilisons</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div class="p-8 bg-white dark:bg-[#1C1C1E] rounded-[2rem] border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm">
                  <div class="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-4">
                    <i class="fi fi-rr-shield-check text-lg"></i>
                  </div>
                  <h3 class="font-bold text-zinc-900 dark:text-white mb-2">Indispensables</h3>
                  <p class="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">Nécessaires pour l'authentification et la sécurité de votre session de navigation.</p>
                </div>
                <div class="p-8 bg-white dark:bg-[#1C1C1E] rounded-[2rem] border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm">
                  <div class="w-10 h-10 rounded-xl bg-primary-400/10 flex items-center justify-center text-primary-400 mb-4">
                    <i class="fi fi-rr-chart-pie-alt text-lg"></i>
                  </div>
                  <h3 class="font-bold text-zinc-900 dark:text-white mb-2">Performance</h3>
                  <p class="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">Utilisés de manière anonyme pour comprendre l'utilisation de l'application et l'améliorer.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 class="text-2xl font-bold text-zinc-900 dark:text-white mb-6">Gérer vos préférences</h2>
              <div class="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-8 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm">
                <p class="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
                  Vous pouvez configurer votre navigateur pour rejeter systématiquement les cookies. Cependant, certaines fonctionnalités de RoadTripCollab (comme l'authentification) ne pourront plus fonctionner correctement.
                </p>
                <div class="flex flex-wrap gap-2">
                  <span class="px-3 py-1 bg-zinc-50 dark:bg-zinc-800 text-zinc-500 rounded-lg text-[10px] font-bold uppercase border border-zinc-100 dark:border-zinc-700">Chrome</span>
                  <span class="px-3 py-1 bg-zinc-50 dark:bg-zinc-800 text-zinc-500 rounded-lg text-[10px] font-bold uppercase border border-zinc-100 dark:border-zinc-700">Firefox</span>
                  <span class="px-3 py-1 bg-zinc-50 dark:bg-zinc-800 text-zinc-500 rounded-lg text-[10px] font-bold uppercase border border-zinc-100 dark:border-zinc-700">Safari</span>
                  <span class="px-3 py-1 bg-zinc-50 dark:bg-zinc-800 text-zinc-500 rounded-lg text-[10px] font-bold uppercase border border-zinc-100 dark:border-zinc-700">Edge</span>
                </div>
              </div>
            </section>
          </div>

          <footer class="mt-20 pt-8 border-t border-zinc-200 dark:border-zinc-800 text-sm text-zinc-400">
            Dernière mise à jour : 05 mars 2026
          </footer>
        </main>
      </div>
    </div>
  </div>
</template>

