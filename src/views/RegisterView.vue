<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { register as apiRegister } from '../services/authService';
import { useAuthStore } from '../stores/auth';

const username = ref('');
const email = ref('');
const password = ref('');
const router = useRouter();
const authStore = useAuthStore();
const errorMessage = ref('');
const isLoading = ref(false);

const handleRegister = async () => {
  if (isLoading.value) return;
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const response = await apiRegister({ 
      username: username.value, 
      email: email.value, 
      password: password.value 
    });
    authStore.login(response.data.token);
    await router.push('/my-trips');
  } catch (error: any) {
    errorMessage.value = "Erreur lors de l'inscription. L'email ou le pseudo est peut-être déjà utilisé.";
    console.error(error);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="page-wrapper !pt-0 !pb-0 flex items-center justify-center min-h-screen">
    <div class="hidden lg:flex lg:w-1/2 min-h-screen relative overflow-hidden bg-zinc-900 items-center justify-center p-12">
      <div class="absolute inset-0 z-0 opacity-20">
        <div class="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary-400 rounded-full blur-[120px]"></div>
        <div class="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-500 rounded-full blur-[120px]"></div>
      </div>
      
      <div class="relative z-10 max-w-lg text-center lg:text-left">
        <RouterLink to="/" class="inline-flex items-center gap-3 mb-10 group">
          <div class="w-12 h-12 bg-primary-400 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:scale-110 transition-transform duration-500">
            <i class="fi fi-rr-road text-zinc-900 text-xl leading-none"></i>
          </div>
          <span class="text-3xl font-black tracking-tight text-white">RoadTrip<span class="text-primary-400">Collab</span></span>
        </RouterLink>
        
        <h2 class="text-5xl font-black text-white leading-tight mb-6">
          Commencez votre <span class="text-primary-400">voyage</span> ici.
        </h2>
        <p class="text-xl text-zinc-400 leading-relaxed mb-8">
          Créez votre compte en quelques secondes et commencez à inviter vos amis pour votre prochain grand départ.
        </p>
        
        <div class="grid grid-cols-2 gap-4">
           <div class="p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10">
              <i class="fi fi-rr-map-marker text-primary-400 text-2xl mb-3 block"></i>
              <p class="text-white font-bold text-lg">Itinéraires</p>
              <p class="text-zinc-500 text-sm">Précis et optimisés</p>
           </div>
           <div class="p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10">
              <i class="fi fi-rr-users text-amber-500 text-2xl mb-3 block"></i>
              <p class="text-white font-bold text-lg">Collaboration</p>
              <p class="text-zinc-500 text-sm">Partagez les frais</p>
           </div>
        </div>
      </div>
    </div>

    <div class="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 pt-32 lg:pt-32 relative overflow-y-auto">
      <div class="absolute top-28 left-8 lg:hidden">
        <RouterLink to="/" class="flex items-center gap-2">
          <div class="w-8 h-8 bg-primary-400 rounded-lg flex items-center justify-center">
            <i class="fi fi-rr-road text-zinc-900 text-xs leading-none"></i>
          </div>
          <span class="font-bold text-zinc-900 dark:text-white">RoadTripCollab</span>
        </RouterLink>
      </div>

      <div class="w-full max-w-md py-12 lg:py-0 mt-24 lg:mt-0">
        <div class="mb-10 text-center lg:text-left">
          <h1 class="text-3xl font-black text-zinc-900 dark:text-white mb-3">Créer un compte</h1>
          <p class="text-zinc-500 dark:text-zinc-400">Rejoignez l'aventure et commencez à planifier.</p>
        </div>

        <form @submit.prevent="handleRegister" class="space-y-5">
          <div>
            <label for="username" class="form-label !ml-0 !mb-2">Nom d'utilisateur</label>
            <div class="group relative">
              <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-400 group-focus-within:text-primary-400 transition-colors">
                <i class="fi fi-rr-user leading-none"></i>
              </span>
              <input
                type="text" id="username" v-model="username"
                class="block w-full bg-white dark:bg-[#1C1C1E] border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-11 pr-4 py-3.5 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:ring-4 focus:ring-primary-400/10 focus:border-primary-400 transition-all outline-none"
                placeholder="aventurier_du_dimanche"
                required :disabled="isLoading"
              />
            </div>
          </div>

          <div>
            <label for="email" class="form-label !ml-0 !mb-2">Adresse email</label>
            <div class="group relative">
              <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-400 group-focus-within:text-primary-400 transition-colors">
                <i class="fi fi-rr-envelope leading-none"></i>
              </span>
              <input
                type="email" id="email" v-model="email"
                class="block w-full bg-white dark:bg-[#1C1C1E] border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-11 pr-4 py-3.5 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:ring-4 focus:ring-primary-400/10 focus:border-primary-400 transition-all outline-none"
                placeholder="nom@exemple.com"
                required :disabled="isLoading"
              />
            </div>
          </div>

          <div>
            <label for="password" class="form-label !ml-0 !mb-2">Mot de passe</label>
            <div class="group relative">
              <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-400 group-focus-within:text-primary-400 transition-colors">
                <i class="fi fi-rr-lock leading-none"></i>
              </span>
              <input
                type="password" id="password" v-model="password"
                class="block w-full bg-white dark:bg-[#1C1C1E] border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-11 pr-4 py-3.5 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:ring-4 focus:ring-primary-400/10 focus:border-primary-400 transition-all outline-none"
                placeholder="••••••••••••"
                required :disabled="isLoading"
              />
            </div>
            <p class="mt-2 text-[11px] text-zinc-500 px-1 italic">Minimum 8 caractères conseillés.</p>
          </div>

          <div v-if="errorMessage" class="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/10 text-rose-600 dark:text-rose-400 text-sm">
            <i class="fi fi-rr-exclamation-octagon leading-none text-lg"></i>
            <p class="font-medium text-xs leading-snug">{{ errorMessage }}</p>
          </div>

          <button type="submit" :disabled="isLoading" class="btn-primary w-full !py-4 !rounded-2xl !text-base group shadow-xl shadow-primary-500/20 mt-2">
            <span v-if="isLoading" class="spinner border-zinc-900/30 border-t-zinc-900"></span>
            <span v-else class="flex items-center justify-center gap-2">
              Créer mon compte
              <i class="fi fi-rr-rocket-lunch text-lg leading-none group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform"></i>
            </span>
          </button>
        </form>

        <div class="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 text-center">
          <p class="text-zinc-500 dark:text-zinc-400 text-sm">
            Vous avez déjà un compte ?
            <RouterLink to="/login" class="font-bold text-primary-400 hover:text-primary-500 transition-colors">
              Connectez-vous
            </RouterLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
