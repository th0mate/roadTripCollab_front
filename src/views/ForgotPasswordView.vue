<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink } from 'vue-router';
import { forgotPassword } from '../services/authService';

const email = ref('');
const successMessage = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

const handleForgotPassword = async () => {
  if (isLoading.value || !email.value) { errorMessage.value = 'Veuillez entrer votre email.'; return; }
  isLoading.value = true; errorMessage.value = ''; successMessage.value = '';
  try {
    await forgotPassword({ email: email.value });
    successMessage.value = 'Si un compte existe, un lien de réinitialisation a été envoyé.';
  } catch (error: any) {
    errorMessage.value = error.response?.status === 404 ? "Aucun compte associé à cet email." : "Une erreur est survenue.";
  } finally { isLoading.value = false; }
};
</script>

<template>
  <div class="page-wrapper !pt-0 !pb-0 flex min-h-screen">
    <div class="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-zinc-900 items-center justify-center p-12">
      <div class="absolute inset-0 z-0 opacity-20">
        <div class="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-400 rounded-full blur-[120px]"></div>
        <div class="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-500 rounded-full blur-[120px]"></div>
      </div>
      
      <div class="relative z-10 max-w-lg text-center lg:text-left">
        <RouterLink to="/" class="inline-flex items-center gap-3 mb-10 group">
          <div class="w-12 h-12 bg-primary-400 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:scale-110 transition-transform duration-500">
            <i class="fi fi-rr-road text-zinc-900 text-xl leading-none"></i>
          </div>
          <span class="text-3xl font-black tracking-tight text-white">RoadTrip<span class="text-primary-400">Collab</span></span>
        </RouterLink>
        
        <h2 class="text-5xl font-black text-white leading-tight mb-6">
          On vous aide à <span class="text-primary-400">repartir</span>.
        </h2>
        <p class="text-xl text-zinc-400 leading-relaxed mb-8">
          Pas d'inquiétude, ça arrive aux meilleurs. Quelques secondes et vous serez de nouveau prêt pour l'aventure.
        </p>
        
        <div class="p-8 bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/10">
           <div class="flex items-center gap-4 mb-4">
              <div class="w-10 h-10 rounded-full bg-primary-400/20 flex items-center justify-center text-primary-400">
                 <i class="fi fi-rr-shield-check text-lg"></i>
              </div>
              <p class="text-white font-bold">Sécurisé & Rapide</p>
           </div>
           <p class="text-zinc-500 text-sm leading-relaxed">
             Votre sécurité est notre priorité. Le lien de réinitialisation est à usage unique et expire après 1 heure.
           </p>
        </div>
      </div>
    </div>

    <div class="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 pt-32 lg:pt-0 relative">
      <div class="absolute top-28 left-8 lg:hidden">
        <RouterLink to="/" class="flex items-center gap-2">
          <div class="w-8 h-8 bg-primary-400 rounded-lg flex items-center justify-center">
            <i class="fi fi-rr-road text-zinc-900 text-xs leading-none"></i>
          </div>
          <span class="font-bold text-zinc-900 dark:text-white">RoadTripCollab</span>
        </RouterLink>
      </div>

      <div class="w-full max-w-md">
        <div class="mb-10 text-center lg:text-left">
          <div class="inline-flex w-14 h-14 bg-amber-50 dark:bg-amber-500/10 rounded-2xl items-center justify-center mb-6">
            <i class="fi fi-rr-key text-amber-500 text-2xl leading-none mt-0.5"></i>
          </div>
          <h1 class="text-3xl font-black text-zinc-900 dark:text-white mb-3">Mot de passe oublié ?</h1>
          <p class="text-zinc-500 dark:text-zinc-400">Entrez votre adresse email pour recevoir les instructions.</p>
        </div>

        <form @submit.prevent="handleForgotPassword" class="space-y-6">
          <div>
            <label for="email" class="form-label !ml-0 !mb-2.5">Adresse email</label>
            <div class="group relative">
              <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-400 group-focus-within:text-primary-400 transition-colors">
                <i class="fi fi-rr-envelope leading-none"></i>
              </span>
              <input
                type="email" id="email" v-model="email"
                class="block w-full bg-white dark:bg-[#1C1C1E] border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-11 pr-4 py-4 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:ring-4 focus:ring-primary-400/10 focus:border-primary-400 transition-all outline-none"
                placeholder="nom@exemple.com"
                required :disabled="isLoading"
              />
            </div>
          </div>

          <div v-if="successMessage" class="flex items-start gap-3 p-4 rounded-2xl bg-primary-50 dark:bg-primary-400/10 border border-primary-100 dark:border-primary-400/20 text-primary-700 dark:text-primary-400 text-sm">
            <i class="fi fi-rr-check-circle leading-none text-lg mt-0.5"></i>
            <p class="font-medium leading-relaxed">{{ successMessage }}</p>
          </div>

          <div v-if="errorMessage" class="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/10 text-rose-600 dark:text-rose-400 text-sm">
            <i class="fi fi-rr-exclamation-octagon leading-none text-lg"></i>
            <p class="font-medium">{{ errorMessage }}</p>
          </div>

          <button type="submit" :disabled="isLoading" class="btn-primary w-full !py-4 !rounded-2xl !text-base group shadow-xl shadow-primary-500/20">
            <span v-if="isLoading" class="spinner border-zinc-900/30 border-t-zinc-900"></span>
            <span v-else class="flex items-center justify-center gap-2">
              Envoyer le lien
              <i class="fi fi-rr-paper-plane text-lg leading-none group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"></i>
            </span>
          </button>
        </form>

        <div class="mt-10 pt-8 border-t border-zinc-100 dark:border-zinc-800 text-center">
          <p class="text-zinc-500 dark:text-zinc-400 font-medium">
            <RouterLink to="/login" class="inline-flex items-center gap-2 text-primary-400 hover:text-primary-500 transition-colors">
              <i class="fi fi-rr-arrow-small-left text-xl leading-none"></i>
              Retour à la connexion
            </RouterLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
