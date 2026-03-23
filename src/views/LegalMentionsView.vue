<template>
  <div class="page-wrapper nav-safe-zone bg-zinc-50 dark:bg-[#0c0c0e]">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
      <div class="flex flex-col lg:flex-row gap-12">
        
        <!-- Sidebar Navigation -->
        <aside class="lg:w-64 shrink-0">
          <div class="sticky top-32 space-y-1">
            <p class="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-4 px-4">Navigation</p>
            <router-link to="/mentions-legales" class="legal-nav-link active">Mentions Légales</router-link>
            <router-link to="/politique-confidentialite" class="legal-nav-link">Confidentialité</router-link>
            <router-link to="/cookies" class="legal-nav-link">Cookies</router-link>
            <router-link to="/rgpd" class="legal-nav-link">RGPD</router-link>
          </div>
        </aside>

        <!-- Main Content -->
        <main class="flex-grow max-w-3xl">
          <header class="mb-12">
            <h1 class="text-4xl lg:text-5xl font-black text-zinc-900 dark:text-white mb-4 tracking-tight">Mentions <span class="text-primary-400">Légales</span></h1>
            <p class="text-zinc-500 dark:text-zinc-400 font-medium">Informations obligatoires concernant l'éditeur du site et l'hébergement.</p>
          </header>

          <div class="space-y-16">
            <!-- Section 1 -->
            <section id="edition">
              <div class="flex items-center gap-3 mb-6">
                <div class="w-10 h-10 rounded-xl bg-primary-400/10 flex items-center justify-center text-primary-400">
                  <i class="fi fi-rr-building text-lg"></i>
                </div>
                <h2 class="text-xl font-bold text-zinc-900 dark:text-white">Édition du site</h2>
              </div>
              <div class="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-8 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm">
                <p class="text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-4">
                  Le présent site, accessible à l’URL <strong>roadtripcollab.viben.fr</strong>, est édité par :<br><br>
                  <span class="block p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-700/50">
                    <strong class="text-zinc-900 dark:text-white">VIBEN SAS</strong><br>
                    Société par actions simplifiée au capital de [Montant] €<br>
                    R.C.S. <strong>Montpellier 841 654 270</strong><br>
                    Siège social : [Adresse du siège social]
                  </span>
                  <br>
                  Représentée par Patrick [Nom], en sa qualité de Président.
                </p>
              </div>
            </section>

            <!-- Section 2 -->
            <section id="contact">
              <div class="flex items-center gap-3 mb-6">
                <div class="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500">
                  <i class="fi fi-rr-envelope text-lg"></i>
                </div>
                <h2 class="text-xl font-bold text-zinc-900 dark:text-white">Nous contacter</h2>
              </div>
              <div class="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-8 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <a href="mailto:patrick@viben.fr" class="flex flex-col p-5 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-700/50 hover:border-primary-400/50 transition-all group">
                    <span class="text-[10px] font-black uppercase text-zinc-400 mb-1">Email direct</span>
                    <span class="font-bold text-zinc-900 dark:text-white group-hover:text-primary-400 transition-colors">patrick@viben.fr</span>
                  </a>
                  <div class="flex flex-col p-5 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-700/50">
                    <span class="text-[10px] font-black uppercase text-zinc-400 mb-1">Courrier</span>
                    <span class="font-bold text-zinc-900 dark:text-white leading-tight">VIBEN SAS, 25 Quai Charles de Gaulle, 34280 La Grande Motte</span>
                  </div>
                </div>
              </div>
            </section>

            <!-- Section 3 -->
            <section id="hosting">
              <div class="flex items-center gap-3 mb-6">
                <div class="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <i class="fi fi-rr-database text-lg"></i>
                </div>
                <h2 class="text-xl font-bold text-zinc-900 dark:text-white">Hébergement</h2>
              </div>
              <div class="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-8 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm">
                <p class="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Le site est hébergé par la société <strong>Hostinger</strong> :<br><br>
                  Hostinger International Ltd.<br>
                  61 Lordou Vironos Street, 6023 Larnaca, Chypre<br>
                  Site web : <a href="https://www.hostinger.fr" target="_blank" class="text-primary-400 font-bold hover:underline">www.hostinger.fr</a>
                </p>
              </div>
            </section>

            <!-- Section 4 -->
            <section id="copyright">
              <div class="flex items-center gap-3 mb-6">
                <div class="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                  <i class="fi fi-rr-copyright text-lg"></i>
                </div>
                <h2 class="text-xl font-bold text-zinc-900 dark:text-white">Propriété intellectuelle</h2>
              </div>
              <div class="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-8 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm">
                <p class="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  L'ensemble de ce site relève de la législation française et internationale sur le droit d'auteur et la propriété intellectuelle. Tous les droits de reproduction sont réservés.<br><br>
                  Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable de : VIBEN SAS.
                </p>
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

