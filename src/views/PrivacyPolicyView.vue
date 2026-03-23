<template>
  <div class="page-wrapper nav-safe-zone bg-zinc-50 dark:bg-[#0c0c0e]">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
      <div class="flex flex-col lg:flex-row gap-12">
        
        <aside class="lg:w-64 shrink-0">
          <div class="sticky top-32 space-y-1">
            <p class="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-4 px-4">Navigation</p>
            <router-link to="/mentions-legales" class="legal-nav-link">Mentions Légales</router-link>
            <router-link to="/politique-confidentialite" class="legal-nav-link active">Confidentialité</router-link>
            <router-link to="/cookies" class="legal-nav-link">Cookies</router-link>
            <router-link to="/rgpd" class="legal-nav-link">RGPD</router-link>
          </div>
        </aside>

        <main class="flex-grow max-w-3xl">
          <header class="mb-12">
            <h1 class="text-4xl lg:text-5xl font-black text-zinc-900 dark:text-white mb-4 tracking-tight">Politique de <span class="text-primary-400">Confidentialité</span></h1>
            <p class="text-zinc-500 dark:text-zinc-400 font-medium">Comment nous protégeons et utilisons vos données personnelles.</p>
          </header>

          <div class="space-y-12">
            <section>
              <h2 class="text-2xl font-bold text-zinc-900 dark:text-white mb-6">1. Collecte des données</h2>
              <div class="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-8 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm">
                <p class="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
                  Nous collectons uniquement les données nécessaires au bon fonctionnement de RoadTripCollab :
                </p>
                <div class="grid grid-cols-1 gap-4">
                  <div class="flex gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-700/50">
                    <i class="fi fi-rr-user text-primary-400 mt-1"></i>
                    <div>
                      <p class="font-bold text-zinc-900 dark:text-white text-sm">Informations de compte</p>
                      <p class="text-xs text-zinc-500 leading-relaxed">Email, nom complet, mot de passe haché et photo de profil.</p>
                    </div>
                  </div>
                  <div class="flex gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-700/50">
                    <i class="fi fi-rr-map-marker text-violet-500 mt-1"></i>
                    <div>
                      <p class="font-bold text-zinc-900 dark:text-white text-sm">Données de voyage</p>
                      <p class="text-xs text-zinc-500 leading-relaxed">Titres, dates, étapes, photos téléchargées et frais partagés.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 class="text-2xl font-bold text-zinc-900 dark:text-white mb-6">2. Utilisation de vos données</h2>
              <div class="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-8 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm">
                <ul class="space-y-4">
                  <li class="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
                    <i class="fi fi-rr-check text-primary-400"></i>
                    <span>Gestion de votre espace personnel</span>
                  </li>
                  <li class="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
                    <i class="fi fi-rr-check text-primary-400"></i>
                    <span>Collaboration en temps réel sur vos itinéraires</span>
                  </li>
                  <li class="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
                    <i class="fi fi-rr-check text-primary-400"></i>
                    <span>Optimisation de vos trajets et calcul des frais</span>
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 class="text-2xl font-bold text-zinc-900 dark:text-white mb-6">3. Conservation & Sécurité</h2>
              <div class="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-8 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm">
                <p class="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
                  Vos données sont hébergées sur des serveurs sécurisés en Europe. Nous appliquons les standards de sécurité les plus élevés pour protéger vos informations contre tout accès non autorisé.
                </p>
                <div class="p-4 bg-primary-400/5 rounded-2xl border border-primary-400/20 text-xs text-primary-700 dark:text-primary-400 font-medium">
                  En cas de suppression de votre compte, toutes vos données personnelles sont effacées de manière irréversible sous 30 jours.
                </div>
              </div>
            </section>

            <section class="p-10 bg-zinc-900 rounded-[3rem] text-white relative overflow-hidden">
              <div class="absolute top-0 right-0 w-64 h-64 bg-primary-400/10 rounded-full blur-[80px]"></div>
              <h2 class="text-2xl font-black mb-4 relative z-10">Vos droits (RGPD)</h2>
              <p class="text-zinc-400 mb-8 relative z-10 leading-relaxed">
                Vous disposez d'un droit total d'accès, de modification et de suppression de vos données. Pour toute demande, Patrick est à votre écoute.
              </p>
              <a href="mailto:patrick@viben.fr" class="btn-primary !py-4 !px-8 relative z-10">
                Contacter le DPO
              </a>
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

