<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-zinc-950/60 backdrop-blur-md"
        @click.self="handleOverlayClick"
      >
        <Transition
          enter-active-class="transition duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
          enter-from-class="opacity-0 translate-y-6 sm:translate-y-0 sm:scale-95"
          enter-to-class="opacity-100 translate-y-0 sm:scale-100"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="opacity-100 translate-y-0 sm:scale-100"
          leave-to-class="opacity-0 translate-y-4 sm:scale-95"
        >
          <div
            v-if="modelValue"
            class="w-full sm:max-w-md bg-white dark:bg-[#111113] rounded-t-[2rem] sm:rounded-[2rem] border border-zinc-200/80 dark:border-white/8 shadow-[0_32px_80px_rgba(0,0,0,0.18)] dark:shadow-[0_32px_80px_rgba(0,0,0,0.7)] overflow-hidden"
          >
            <!-- Bande accent colorée -->
            <div class="h-1 w-full" :class="accentBarClass"></div>

            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-5">
              <div class="flex items-center gap-3.5">
                <div
                  class="w-10 h-10 rounded-2xl flex items-center justify-center text-base shrink-0"
                  :class="iconColorClass"
                >
                  <i :class="iconClass" class="leading-none"></i>
                </div>
                <div>
                  <h3 class="font-black text-zinc-900 dark:text-zinc-100 text-base leading-tight tracking-tight">{{ title }}</h3>
                  <p v-if="message" class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">{{ message }}</p>
                </div>
              </div>
              <button
                @click="handleClose"
                class="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer shrink-0"
              >
                <i class="fi fi-rr-cross-small text-base leading-none"></i>
              </button>
            </div>

            <!-- Content slot (si utilisé) -->
            <div v-if="$slots.default" class="px-6 pb-4 overflow-y-auto max-h-[50vh] custom-scrollbar">
              <slot />
            </div>

            <!-- Footer -->
            <div class="px-6 pb-6 pt-2 flex gap-3">
              <template v-if="type === 'confirmation' || type === 'danger'">
                <button
                  type="button"
                  class="btn-secondary flex-1"
                  @click="handleCancel"
                >
                  {{ cancelText }}
                </button>
                <button
                  type="button"
                  class="btn flex-[2] font-black rounded-xl py-3 text-sm transition-all"
                  :class="type === 'danger'
                    ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/25'
                    : 'bg-primary-400 hover:bg-primary-500 text-zinc-900 shadow-lg shadow-primary-400/25'"
                  @click="handleConfirm"
                >
                  {{ confirmText }}
                </button>
              </template>
              <template v-else>
                <button
                  type="button"
                  class="btn-primary flex-1"
                  @click="handleClose"
                >
                  {{ closeText }}
                </button>
              </template>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'

export type ModalType = 'confirmation' | 'info' | 'warning' | 'danger' | 'success'

const props = withDefaults(defineProps<{
  modelValue: boolean
  type?: ModalType
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  closeText?: string
  closeOnOverlay?: boolean
  closeOnEscape?: boolean
}>(), {
  type: 'confirmation',
  confirmText: 'Valider',
  cancelText: 'Annuler',
  closeText: 'Fermer',
  closeOnOverlay: true,
  closeOnEscape: true
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
  (e: 'close'): void
}>()

const iconClass = computed(() => {
  const icons: Record<ModalType, string> = {
    confirmation: 'fi fi-rr-interrogation',
    info: 'fi fi-rr-info',
    warning: 'fi fi-rr-triangle-warning',
    danger: 'fi fi-rr-trash',
    success: 'fi fi-rr-check-circle'
  }
  return icons[props.type] || icons.info
})

const accentBarClass = computed(() => {
  const bars: Record<ModalType, string> = {
    confirmation: 'bg-primary-400',
    info: 'bg-blue-500',
    warning: 'bg-amber-400',
    danger: 'bg-rose-500',
    success: 'bg-emerald-500'
  }
  return bars[props.type] || bars.info
})

const iconColorClass = computed(() => {
  const colors: Record<ModalType, string> = {
    confirmation: 'bg-primary-400/10 text-primary-500 dark:text-primary-400',
    info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    warning: 'bg-amber-400/10 text-amber-600 dark:text-amber-400',
    danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
  }
  return colors[props.type] || colors.info
})

const close = () => emit('update:modelValue', false)
const handleConfirm = () => emit('confirm')
const handleCancel = () => { emit('cancel'); close() }
const handleClose = () => { emit('close'); close() }
const handleOverlayClick = () => {
  if (props.closeOnOverlay) {
    if (props.type === 'confirmation' || props.type === 'danger') handleCancel()
    else handleClose()
  }
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.modelValue && props.closeOnEscape) {
    if (props.type === 'confirmation' || props.type === 'danger') handleCancel()
    else handleClose()
  }
}

onMounted(() => document.addEventListener('keydown', handleKeydown))
onUnmounted(() => document.removeEventListener('keydown', handleKeydown))
</script>
