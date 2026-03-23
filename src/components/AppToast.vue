<script setup lang="ts">
import { useToast } from '../composables/useToast'
const { toasts } = useToast()
</script>

<template>
  <Teleport to="body">
    <div class="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl pointer-events-auto min-w-[260px] max-w-sm"
          :class="{
            'bg-zinc-900/90 border-primary-400/30 text-white': toast.type === 'success',
            'bg-zinc-900/90 border-rose-500/30 text-white': toast.type === 'error',
            'bg-zinc-900/90 border-zinc-700 text-white': toast.type === 'info',
          }"
        >
          <span class="text-lg shrink-0" :class="{
            'text-primary-400': toast.type === 'success',
            'text-rose-400': toast.type === 'error',
            'text-zinc-400': toast.type === 'info',
          }">
            <i :class="{
              'fi fi-rr-check-circle': toast.type === 'success',
              'fi fi-rr-cross-circle': toast.type === 'error',
              'fi fi-rr-info': toast.type === 'info',
            }" class="leading-none"></i>
          </span>
          <p class="text-sm font-semibold leading-snug">{{ toast.message }}</p>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active { transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
.toast-leave-active { transition: all 0.25s ease-in; }
.toast-enter-from { opacity: 0; transform: translateX(40px) scale(0.95); }
.toast-leave-to { opacity: 0; transform: translateX(40px) scale(0.95); }
</style>
