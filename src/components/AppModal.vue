<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="app-modal"
        @click.self="handleOverlayClick"
        @keydown.escape="handleEscape"
      >
        <div class="app-modal__container" :class="[`app-modal__container--${type}`]">
          <div class="app-modal__icon" :class="[`app-modal__icon--${type}`]">
            <i :class="iconClass"></i>
          </div>

          <div class="app-modal__content">
            <h3 class="app-modal__title">{{ title }}</h3>
            <p class="app-modal__message">{{ message }}</p>
          </div>

          <div class="app-modal__actions">
            <template v-if="type === 'confirmation' || type === 'danger'">
              <button
                type="button"
                class="app-modal__btn app-modal__btn--secondary"
                @click="handleCancel"
              >
                {{ cancelText }}
              </button>
              <button
                type="button"
                class="app-modal__btn"
                :class="[`app-modal__btn--${type === 'danger' ? 'danger' : 'primary'}`]"
                @click="handleConfirm"
              >
                {{ confirmText }}
              </button>
            </template>
            <template v-else>
              <button
                type="button"
                class="app-modal__btn app-modal__btn--primary"
                @click="handleClose"
              >
                {{ closeText }}
              </button>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts">
import {defineComponent, computed, onMounted, onUnmounted} from 'vue'

export type ModalType = 'confirmation' | 'info' | 'warning' | 'danger' | 'success'

export default defineComponent({
  name: 'AppModal',
  props: {
    modelValue: {
      type: Boolean,
      required: true
    },
    type: {
      type: String as () => ModalType,
      default: 'confirmation'
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    confirmText: {
      type: String,
      default: 'Confirmer'
    },
    cancelText: {
      type: String,
      default: 'Annuler'
    },
    closeText: {
      type: String,
      default: 'Fermer'
    },
    closeOnOverlay: {
      type: Boolean,
      default: true
    },
    closeOnEscape: {
      type: Boolean,
      default: true
    }
  },
  emits: ['update:modelValue', 'confirm', 'cancel', 'close'],
  setup(props, {emit}) {
    const iconClass = computed(() => {
      const icons: Record<ModalType, string> = {
        confirmation: 'fi fi-rr-interrogation',
        info: 'fi fi-rr-info',
        warning: 'fi fi-rr-triangle-warning',
        danger: 'fi fi-rr-trash',
        success: 'fi fi-rr-check'
      }
      return icons[props.type] || icons.info
    })

    const close = () => {
      emit('update:modelValue', false)
    }

    const handleConfirm = () => {
      emit('confirm')
      close()
    }

    const handleCancel = () => {
      emit('cancel')
      close()
    }

    const handleClose = () => {
      emit('close')
      close()
    }

    const handleOverlayClick = () => {
      if (props.closeOnOverlay) {
        if (props.type === 'confirmation' || props.type === 'danger') {
          handleCancel()
        } else {
          handleClose()
        }
      }
    }

    const handleEscape = () => {
      if (props.closeOnEscape) {
        if (props.type === 'confirmation' || props.type === 'danger') {
          handleCancel()
        } else {
          handleClose()
        }
      }
    }

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && props.modelValue && props.closeOnEscape) {
        handleEscape()
      }
    }

    onMounted(() => {
      document.addEventListener('keydown', handleKeydown)
    })

    onUnmounted(() => {
      document.removeEventListener('keydown', handleKeydown)
    })

    return {
      iconClass,
      handleConfirm,
      handleCancel,
      handleClose,
      handleOverlayClick,
      handleEscape
    }
  }
})
</script>

<style>
@import "@/assets/styles/appModal.css";
</style>
