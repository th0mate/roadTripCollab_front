<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute, RouterLink } from 'vue-router';
import { resetPassword } from '../services/authService';

const password = ref('');
const confirmPassword = ref('');
const router = useRouter();
const route = useRoute();
const successMessage = ref('');
const errorMessage = ref('');
const isLoading = ref(false);
const passwordError = ref('');
const confirmPasswordError = ref('');
const token = ref('');

onMounted(() => {
  token.value = route.query.token as string;
  if (!token.value) errorMessage.value = "Lien de réinitialisation invalide ou expiré.";
});

const isPasswordValid = computed(() => {
  if (!password.value) { passwordError.value = ''; return false; }
  if (password.value.length < 8) { passwordError.value = '8 caractères minimum.'; return false; }
  if (!/[A-Z]/.test(password.value)) { passwordError.value = 'Une majuscule requise.'; return false; }
  if (!/[0-9]/.test(password.value)) { passwordError.value = 'Un chiffre requis.'; return false; }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password.value)) { passwordError.value = 'Un caractère spécial requis.'; return false; }
  passwordError.value = ''; return true;
});

const isConfirmPasswordValid = computed(() => {
  if (!confirmPassword.value) { confirmPasswordError.value = ''; return false; }
  const ok = confirmPassword.value === password.value;
  confirmPasswordError.value = ok ? '' : 'Les mots de passe ne correspondent pas.';
  return ok;
});

const handleResetPassword = async () => {
  if (isLoading.value || !token.value) return;
  if (!isPasswordValid.value || !isConfirmPasswordValid.value) { errorMessage.value = 'Vérifiez les champs.'; return; }
  isLoading.value = true; errorMessage.value = '';
  try {
    await resetPassword({ token: token.value, password: password.value });
    successMessage.value = "Mot de passe réinitialisé ! Redirection...";
    setTimeout(() => router.push("/login"), 2000);
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || "Échec. Le lien a peut-être expiré.";
  } finally { isLoading.value = false; }
};
</script>

<template>
  <div class="page-wrapper !pt-0 !pb-0 flex min-h-screen">
    <div class="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-zinc-900 items-center justify-center p-12">
      <div class="absolute inset-0 z-0 opacity-20">
        <div class="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-400 rounded-full blur-[120px]"></div>
        <div class="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600 rounded-full blur-[120px]"></div>
      </div>
      
      <div class="relative z-10 max-w-lg text-center lg:text-left">
        <RouterLink to="/" class="inline-flex items-center gap-3 mb-10 group">
          <div class="w-12 h-12 bg-primary-400 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:scale-110 transition-transform duration-500">
            <i class="fi fi-rr-road text-zinc-900 text-xl leading-none"></i>
          </div>
          <span class="text-3xl font-black tracking-tight text-white">RoadTrip<span class="text-primary-400">Collab</span></span>
        </RouterLink>
        
        <h2 class="text-5xl font-black text-white leading-tight mb-6">
          Votre compte est <span class="text-primary-400">entre de bonnes</span> mains.
        </h2>
        <p class="text-xl text-zinc-400 leading-relaxed mb-8">
          Choisissez un mot de passe robuste pour protéger vos futurs souvenirs de voyage.
        </p>
        
        <div class="flex flex-col gap-4">
           <div class="flex items-center gap-4 py-4 px-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
              <i class="fi fi-rr-shield-check text-primary-400 text-xl"></i>
              <p class="text-white font-medium">Chiffrement de bout en bout</p>
           </div>
           <div class="flex items-center gap-4 py-4 px-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
              <i class="fi fi-rr-lock text-primary-400 text-xl"></i>
              <p class="text-white font-medium">Protection contre les intrusions</p>
           </div>
        </div>
      </div>
    </div>

    <div class="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 pt-32 lg:pt-0 relative overflow-y-auto">
      <div class="absolute top-28 left-8 lg:hidden">
        <RouterLink to="/" class="flex items-center gap-2">
          <div class="w-8 h-8 bg-primary-400 rounded-lg flex items-center justify-center">
            <i class="fi fi-rr-road text-zinc-900 text-xs leading-none"></i>
          </div>
          <span class="font-bold text-zinc-900 dark:text-white">RoadTripCollab</span>
        </RouterLink>
      </div>

      <div class="w-full max-w-md py-12 lg:py-0">
        <div class="mb-10 text-center lg:text-left">
          <div class="inline-flex w-14 h-14 bg-primary-50 dark:bg-primary-400/10 rounded-2xl items-center justify-center mb-6">
            <i class="fi fi-rr-shield-check text-primary-400 text-2xl leading-none mt-0.5"></i>
          </div>
          <h1 class="text-3xl font-black text-zinc-900 dark:text-white mb-3">Sécurisez votre compte</h1>
          <p class="text-zinc-500 dark:text-zinc-400">Définissez votre nouveau mot de passe ci-dessous.</p>
        </div>

        <form v-if="token" @submit.prevent="handleResetPassword" class="space-y-6">
          <div>
            <label for="password" class="form-label !ml-0 !mb-2.5">Nouveau mot de passe</label>
            <div class="group relative">
              <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-400 group-focus-within:text-primary-400 transition-colors">
                <i class="fi fi-rr-lock leading-none"></i>
              </span>
              <input
                type="password" id="password" v-model="password"
                class="block w-full bg-white dark:bg-[#1C1C1E] border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-11 pr-4 py-4 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:ring-4 focus:ring-primary-400/10 focus:border-primary-400 transition-all outline-none"
                :class="{ 'border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/10': passwordError }"
                placeholder="••••••••••••"
                required :disabled="isLoading"
              />
            </div>
            <p v-if="passwordError" class="mt-2 text-xs text-rose-500 font-medium flex items-center gap-1.5 px-1">
              <i class="fi fi-rr-exclamation leading-none"></i> {{ passwordError }}
            </p>
          </div>

          <div>
            <label for="confirmPassword" class="form-label !ml-0 !mb-2.5">Confirmer le mot de passe</label>
            <div class="group relative">
              <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-400 group-focus-within:text-primary-400 transition-colors">
                <i class="fi fi-rr-check leading-none"></i>
              </span>
              <input
                type="password" id="confirmPassword" v-model="confirmPassword"
                class="block w-full bg-white dark:bg-[#1C1C1E] border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-11 pr-4 py-4 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:ring-4 focus:ring-primary-400/10 focus:border-primary-400 transition-all outline-none"
                :class="{ 'border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/10': confirmPasswordError }"
                placeholder="••••••••••••"
                required :disabled="isLoading"
              />
            </div>
            <p v-if="confirmPasswordError" class="mt-2 text-xs text-rose-500 font-medium flex items-center gap-1.5 px-1">
              <i class="fi fi-rr-exclamation leading-none"></i> {{ confirmPasswordError }}
            </p>
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
              Enregistrer le mot de passe
              <i class="fi fi-rr-shield-check text-lg leading-none"></i>
            </span>
          </button>
        </form>

        <div v-else class="text-center py-8">
          <div class="flex flex-col items-center gap-4 p-8 rounded-3xl bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/10 text-rose-600 dark:text-rose-400">
            <i class="fi fi-rr-shield-interrogation text-4xl leading-none"></i>
            <p class="font-bold text-lg leading-snug">{{ errorMessage }}</p>
            <RouterLink to="/forgot-password" class="btn-secondary !text-rose-600 !border-rose-200">Demander un nouveau lien</RouterLink>
          </div>
        </div>

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
