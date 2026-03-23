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
            <router-link to="/cookies" class="legal-nav-link">Cookies</router-link>
            <router-link to="/rgpd" class="legal-nav-link active">RGPD</router-link>
          </div>
        </aside>

        <!-- Main Content -->
        <main class="flex-grow max-w-3xl">
          <header class="mb-12">
            <h1 class="text-4xl lg:text-5xl font-black text-zinc-900 dark:text-white mb-4 tracking-tight">Conformité <span class="text-primary-400">RGPD</span></h1>
            <p class="text-zinc-500 dark:text-zinc-400 font-medium">Votre vie privée est au cœur de notre engagement.</p>
          </header>

          <div class="space-y-12">
            <section>
              <h2 class="text-2xl font-bold text-zinc-900 dark:text-white mb-6">Notre engagement</h2>
              <div class="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-8 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm">
                <p class="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Chez RoadTripCollab (édité par VIBEN SAS), nous prenons la protection de vos données personnelles très au sérieux. Nous nous engageons à respecter les principes du RGPD (Règlement UE 2016/679) pour garantir la sécurité et la confidentialité de vos informations.
                </p>
              </div>
            </section>

            <section>
              <h2 class="text-2xl font-bold text-zinc-900 dark:text-white mb-6">Responsable du traitement</h2>
              <div class="bg-white dark:bg-[#1C1C1E] rounded-[2rem] p-8 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-2xl bg-primary-400/10 flex items-center justify-center text-primary-400 shrink-0">
                    <i class="fi fi-rr-user-shield text-xl"></i>
                  </div>
                  <div>
                    <p class="font-bold text-zinc-900 dark:text-white">Patrick</p>
                    <p class="text-sm text-zinc-500">Responsable de la protection des données (DPO)</p>
                    <a href="mailto:patrick@viben.fr" class="text-primary-400 text-sm font-bold hover:underline mt-1 block">patrick@viben.fr</a>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 class="text-2xl font-bold text-zinc-900 dark:text-white mb-6">Vos droits fondamentaux</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div v-for="right in rights" :key="right.title" class="p-6 bg-white dark:bg-[#1C1C1E] rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm">
                  <div class="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-4">
                    <i :class="['fi', right.icon]"></i>
                  </div>
                  <h3 class="font-bold text-zinc-900 dark:text-white text-sm mb-2">{{ right.title }}</h3>
                  <p class="text-xs text-zinc-500 leading-relaxed">{{ right.desc }}</p>
                </div>
              </div>
            </section>

            <section class="p-8 bg-primary-400/5 rounded-[2rem] border border-primary-400/20">
              <h2 class="text-lg font-bold text-zinc-900 dark:text-white mb-2">Exercer vos droits</h2>
              <p class="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-0">
                Pour toute demande d'accès, de rectification ou de suppression, envoyez simplement un email à <span class="font-bold text-zinc-900 dark:text-white">patrick@viben.fr</span>. Nous traiterons votre demande dans les meilleurs délais (maximum 30 jours).
              </p>
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

<script setup lang="ts">
const rights = [
  { icon: 'fi-rr-eye', title: 'Droit d\'accès', desc: 'Savoir quelles données nous possédons sur vous.' },
  { icon: 'fi-rr-edit', title: 'Droit de rectification', desc: 'Modifier vos informations personnelles.' },
  { icon: 'fi-rr-trash', title: 'Droit à l\'oubli', desc: 'Demander la suppression définitive de votre compte.' },
  { icon: 'fi-rr-download', title: 'Portabilité', desc: 'Récupérer vos données pour un autre service.' }
]
</script>

