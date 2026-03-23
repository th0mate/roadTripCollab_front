<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { login as apiLogin } from '../services/authService';
import { useAuthStore } from '../stores/auth';

const email = ref('');
const password = ref('');
const router = useRouter();
const authStore = useAuthStore();
const errorMessage = ref('');
const isLoading = ref(false);

const handleLogin = async () => {
  if (isLoading.value) return;
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const response = await apiLogin({ email: email.value, password: password.value });
    authStore.login(response.data.token);
    await router.push('/my-trips');
  } catch (error: any) {
    errorMessage.value = "Identifiants incorrects. Veuillez réessayer.";
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
        <div class="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-400 rounded-full blur-[120px]"></div>
        <div class="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-600 rounded-full blur-[120px]"></div>
      </div>
      
      <div class="relative z-10 max-w-lg text-center lg:text-left">
        <RouterLink to="/" class="inline-flex items-center gap-3 mb-10 group">
          <div class="w-12 h-12 bg-primary-400 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:scale-110 transition-transform duration-500">
            <i class="fi fi-rr-road text-zinc-900 text-xl leading-none"></i>
          </div>
          <span class="text-3xl font-black tracking-tight text-white">RoadTrip<span class="text-primary-400">Collab</span></span>
        </RouterLink>
        
        <h2 class="text-5xl font-black text-white leading-tight mb-6">
          Prêt pour votre <span class="text-primary-400">prochaine</span> aventure ?
        </h2>
        <p class="text-xl text-zinc-400 leading-relaxed mb-8">
          Rejoignez des milliers de voyageurs et commencez à planifier vos road trips inoubliables dès aujourd'hui.
        </p>
        
        <div class="flex items-center gap-4 py-6 px-8 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 max-w-sm">
          <div class="flex -space-x-3">
             <div v-for="i in 4" :key="i" class="w-10 h-10 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400 overflow-hidden">
                <img :src="`https://i.pravatar.cc/100?img=${i+10}`" alt="avatar" />
             </div>
          </div>
          <div class="text-sm">
            <p class="text-white font-bold">+2k membres</p>
            <p class="text-zinc-500">nous ont déjà rejoint</p>
          </div>
        </div>
      </div>
    </div>

    <div class="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 pt-32 lg:pt-32 relative">
      <div class="absolute top-28 left-8 lg:hidden">
        <RouterLink to="/" class="flex items-center gap-2">
          <div class="w-8 h-8 bg-primary-400 rounded-lg flex items-center justify-center">
            <i class="fi fi-rr-road text-zinc-900 text-xs leading-none"></i>
          </div>
          <span class="font-bold text-zinc-900 dark:text-white">RoadTripCollab</span>
        </RouterLink>
      </div>

      <div class="w-full max-w-md mt-24 lg:mt-0">
        <div class="mb-10 text-center lg:text-left">
          <h1 class="text-3xl font-black text-zinc-900 dark:text-white mb-3">Bon retour 👋</h1>
          <p class="text-zinc-500 dark:text-zinc-400">Heureux de vous revoir ! Connectez-vous à votre compte.</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-6">
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

          <div>
            <div class="flex justify-between items-center mb-2.5">
              <label for="password" class="form-label !ml-0 !mb-0">Mot de passe</label>
              <RouterLink to="/forgot-password" class="text-sm font-bold text-primary-400 hover:text-primary-500 transition-colors">
                Oublié ?
              </RouterLink>
            </div>
            <div class="group relative">
              <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-400 group-focus-within:text-primary-400 transition-colors">
                <i class="fi fi-rr-lock leading-none"></i>
              </span>
              <input
                type="password" id="password" v-model="password"
                class="block w-full bg-white dark:bg-[#1C1C1E] border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-11 pr-4 py-4 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:ring-4 focus:ring-primary-400/10 focus:border-primary-400 transition-all outline-none"
                placeholder="••••••••••••"
                required :disabled="isLoading"
              />
            </div>
          </div>

          <div v-if="errorMessage" class="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/10 text-rose-600 dark:text-rose-400 text-sm animate-shake">
            <i class="fi fi-rr-exclamation-octagon leading-none text-lg"></i>
            <p class="font-medium">{{ errorMessage }}</p>
          </div>

          <button type="submit" :disabled="isLoading" class="btn-primary w-full !py-4 !rounded-2xl !text-base group shadow-xl shadow-primary-500/20">
            <span v-if="isLoading" class="spinner border-zinc-900/30 border-t-zinc-900"></span>
            <span v-else class="flex items-center justify-center gap-2">
              Se connecter
              <i class="fi fi-rr-arrow-small-right text-xl leading-none group-hover:translate-x-1 transition-transform"></i>
            </span>
          </button>
        </form>

        <div class="mt-10 pt-8 border-t border-zinc-100 dark:border-zinc-800 text-center">
          <p class="text-zinc-500 dark:text-zinc-400">
            Nouveau sur la plateforme ?
            <RouterLink to="/register" class="font-bold text-primary-400 hover:text-primary-500 transition-colors">
              Créer un compte
            </RouterLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}
.animate-shake {
  animation: shake 0.4s ease-in-out;
}
</style>
