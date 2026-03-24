<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-250 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="visible" class="fixed inset-0 z-[200]" @click.self="handleOverlayClick">

        <svg
          class="absolute inset-0 w-full h-full pointer-events-none transition-all duration-500"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <mask id="onboarding-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                v-if="spotlightRect"
                :x="spotlightRect.x - PADDING"
                :y="spotlightRect.y - PADDING"
                :width="spotlightRect.width + PADDING * 2"
                :height="spotlightRect.height + PADDING * 2"
                :rx="spotlightRx"
                fill="black"
                class="transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
              />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(9,9,11,0.82)"
            mask="url(#onboarding-mask)"
          />
        </svg>

        <Transition
          enter-active-class="transition duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition duration-200"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div
            v-if="spotlightRect"
            class="absolute pointer-events-none rounded-[inherit] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
            :style="{
              left: `${spotlightRect.x - PADDING - 2}px`,
              top: `${spotlightRect.y - PADDING - 2}px`,
              width: `${spotlightRect.width + PADDING * 2 + 4}px`,
              height: `${spotlightRect.height + PADDING * 2 + 4}px`,
              borderRadius: `${spotlightRx + 2}px`,
              boxShadow: `0 0 0 2px ${currentStep.glowColor}, 0 0 32px 4px ${currentStep.glowColor}40`,
            }"
          />
        </Transition>

        <Transition
          mode="out-in"
          enter-active-class="transition duration-350 ease-[cubic-bezier(0.16,1,0.3,1)]"
          enter-from-class="opacity-0 scale-95 translate-y-2"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            :key="currentIndex"
            class="absolute z-10 w-[320px] bg-white dark:bg-[#111113] rounded-[1.75rem] border border-zinc-200/80 dark:border-white/8 shadow-[0_24px_60px_rgba(0,0,0,0.22)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.75)] overflow-hidden"
            :style="cardStyle"
          >
            <div class="h-0.5 w-full" :style="{ background: currentStep.glowColor }"></div>

            <div class="flex items-start justify-between px-5 pt-4 pb-0">
              <div
                class="w-10 h-10 rounded-2xl flex items-center justify-center text-base shrink-0"
                :style="{ background: `${currentStep.glowColor}18`, color: currentStep.glowColor }"
              >
                <i :class="currentStep.icon" class="leading-none"></i>
              </div>
              <button
                @click="dismiss"
                class="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
              >
                Passer <i class="fi fi-rr-cross-small text-xs leading-none"></i>
              </button>
            </div>

            <div class="px-5 pt-3 pb-4">
              <h3 class="text-base font-black text-zinc-900 dark:text-zinc-50 leading-tight tracking-tight mb-1.5">
                {{ currentStep.title }}
              </h3>
              <p class="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-3.5">
                {{ currentStep.description }}
              </p>

              <ul class="space-y-1.5">
                <li
                  v-for="(f, i) in currentStep.features"
                  :key="i"
                  class="flex items-center gap-2"
                >
                  <div
                    class="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                    :style="{ background: `${currentStep.glowColor}20`, color: currentStep.glowColor }"
                  >
                    <i :class="f.icon" class="text-[8px] leading-none"></i>
                  </div>
                  <span class="text-[11px] text-zinc-500 dark:text-zinc-400">
                    <span class="font-semibold text-zinc-700 dark:text-zinc-200">{{ f.label }}</span>
                    <span v-if="f.desc"> — {{ f.desc }}</span>
                  </span>
                </li>
              </ul>
            </div>

            <div class="px-5 pb-4 flex items-center justify-between">
              <div class="flex items-center gap-1">
                <button
                  v-for="(_, i) in steps"
                  :key="i"
                  @click="goTo(i)"
                  class="transition-all duration-300 rounded-full cursor-pointer"
                  :class="i === currentIndex ? 'w-5 h-1.5' : 'w-1.5 h-1.5 bg-zinc-200 dark:bg-zinc-700'"
                  :style="i === currentIndex ? { background: currentStep.glowColor } : {}"
                />
              </div>

              <div class="flex items-center gap-1.5">
                <button
                  v-if="currentIndex > 0"
                  @click="prev"
                  class="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                >
                  <i class="fi fi-rr-arrow-left text-xs leading-none"></i>
                </button>

                <button
                  v-if="!isLastStep"
                  @click="next"
                  class="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black transition-all cursor-pointer shadow-md"
                  :style="{ background: currentStep.glowColor, color: '#111', boxShadow: `0 4px 16px ${currentStep.glowColor}50` }"
                >
                  Suivant <i class="fi fi-rr-arrow-right text-[10px] leading-none"></i>
                </button>

                <button
                  v-else
                  @click="dismiss"
                  class="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black transition-all cursor-pointer shadow-md"
                  :style="{ background: currentStep.glowColor, color: '#111', boxShadow: `0 4px 16px ${currentStep.glowColor}50` }"
                >
                  <i class="fi fi-rr-rocket-lunch text-[10px] leading-none"></i> C'est parti !
                </button>
              </div>
            </div>
          </div>
        </Transition>

        <Transition
          enter-active-class="transition duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]"
          enter-from-class="opacity-0 scale-50"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition duration-150"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div
            v-if="arrowStyle && spotlightRect"
            :key="`arrow-${currentIndex}`"
            class="absolute pointer-events-none z-10 flex items-center justify-center"
            :style="arrowStyle"
          >
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center animate-bounce"
              :style="{ background: currentStep.glowColor, color: '#111', boxShadow: `0 4px 16px ${currentStep.glowColor}60` }"
            >
              <i :class="arrowIcon" class="text-xs leading-none"></i>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'

const props = defineProps<{
  view: 'dashboard' | 'live'
  storageKey?: string
}>()

const emit = defineEmits<{ (e: 'done'): void }>()

const STORAGE_KEY = computed(() => props.storageKey ?? `roadtrip_onboarding_${props.view}_seen_v2`)
const PADDING = 12
const CARD_W = 320
const CARD_H = 240
const ARROW_SIZE = 32

const visible = ref(false)
const currentIndex = ref(0)
const spotlightRect = ref<DOMRect | null>(null)

type Step = {
  title: string
  description: string
  icon: string
  glowColor: string
  selector: string | null
  spotlightRxOverride?: number
  features: Array<{ icon: string; label: string; desc?: string }>
}

const dashboardSteps: Step[] = [
  {
    title: 'Bienvenue sur le tableau de bord',
    description: 'Ton espace central pour planifier chaque étail de ton road trip : itinéraire, budget, stops et collaborateurs.',
    icon: 'fi fi-rr-road',
    glowColor: '#9fe000',
    selector: null,
    features: [
      { icon: 'fi fi-rr-map', label: 'Carte interactive', desc: 'au centre' },
      { icon: 'fi fi-rr-sidebar', label: 'Panneau latéral', desc: 'itinéraire & budget' },
      { icon: 'fi fi-rr-user-add', label: 'Collaboration', desc: 'invitation de participants' },
    ],
  },
  {
    title: 'La carte interactive',
    description: 'Explore ton itinéraire. Recherche des lieux, visualise les routes et ajoute des étapes directement depuis la carte.',
    icon: 'fi fi-rr-map-marker',
    glowColor: '#3b82f6',
    selector: '[data-onboarding="dash-map"]',
    spotlightRxOverride: 20,
    features: [
      { icon: 'fi fi-rr-search', label: 'Recherche intelligente', desc: 'hôtels, restos, musées…' },
      { icon: 'fi fi-rr-route', label: 'Tracé des routes', desc: 'durée & distance estimées' },
      { icon: 'fi fi-rr-filter', label: 'Filtres de trajets', desc: 'départ, retour, activités' },
    ],
  },
  {
    title: 'L\'itinéraire jour par jour',
    description: 'Navigue entre les jours de ton trip. Chaque étape est organisée avec les horaires et les durées de trajet.',
    icon: 'fi fi-rr-calendar',
    glowColor: '#8b5cf6',
    selector: '[data-onboarding="dash-itinerary"]',
    features: [
      { icon: 'fi fi-rr-arrow-alt-left', label: 'Navigation J1/J2…', desc: 'passer d\'un jour à l\'autre' },
      { icon: 'fi fi-rr-location-alt', label: 'Stops typés', desc: 'ville, hébergement, restaurant…' },
      { icon: 'fi fi-rr-add', label: 'Ajout rapide', desc: 'bouton + en bas du panneau' },
    ],
  },
  {
    title: 'Budget & dépenses',
    description: 'Suis ton budget en temps réel. Les coûts de carburant et de péage sont estimés automatiquement.',
    icon: 'fi fi-rr-sack',
    glowColor: '#f59e0b',
    selector: '[data-onboarding="dash-budget"]',
    features: [
      { icon: 'fi fi-rr-gas-pump', label: 'Estimation carburant & péage' },
      { icon: 'fi fi-rr-receipt', label: 'Suivi des dépenses', desc: 'par date et catégorie' },
      { icon: 'fi fi-rr-settings', label: 'Paramètres véhicule', desc: 'conso, prix essence' },
    ],
  },
  {
    title: 'Collaboration & partage',
    description: 'Invitez des compagnons de voyage, gérez les rôles et partagez le trip une fois terminé.',
    icon: 'fi fi-rr-users-alt',
    glowColor: '#f43f5e',
    selector: '[data-onboarding="dash-participants"]',
    features: [
      { icon: 'fi fi-rr-envelope', label: 'Invitation par email' },
      { icon: 'fi fi-rr-users', label: 'Gestion des participants' },
      { icon: 'fi fi-rr-share', label: 'Partage public', desc: 'rendre le trip visible à tous' },
    ],
  },
]

const liveSteps: Step[] = [
  {
    title: 'Mode Live activé !',
    description: 'Tu es en mode voyage. Suis ta progression en temps réel, stop par stop, jour après jour.',
    icon: 'fi fi-rr-pulse',
    glowColor: '#9fe000',
    selector: null,
    features: [
      { icon: 'fi fi-rr-clock', label: 'Mise à jour toutes les 30s' },
      { icon: 'fi fi-rr-map-marker', label: 'Stop actuel détecté', desc: 'selon l\'heure' },
      { icon: 'fi fi-rr-calendar-day', label: 'Vue du jour seulement' },
    ],
  },
  {
    title: 'Stop actuel & suivant',
    description: 'En haut de l\'interface, ton stop en cours et le prochain en un coup d\'œil, avec les infos essentielles.',
    icon: 'fi fi-rr-navigation',
    glowColor: '#f97316',
    selector: '[data-onboarding="live-current-stop"]',
    features: [
      { icon: 'fi fi-rr-location-alt', label: 'Stop en cours', desc: 'nom, type & horaires' },
      { icon: 'fi fi-rr-arrow-alt-right', label: 'Prochain stop', desc: 'distance & durée' },
      { icon: 'fi fi-rr-map', label: 'Navigation GPS', desc: 'ouvre Google Maps' },
    ],
  },
  {
    title: 'Timeline du jour',
    description: 'Visualise toutes les activités du jour. Chaque stop affiche son statut en temps réel.',
    icon: 'fi fi-rr-list-timeline',
    glowColor: '#8b5cf6',
    selector: '[data-onboarding="live-timeline"]',
    features: [
      { icon: 'fi fi-rr-check', label: 'Stops passés', desc: 'grisés avec coche' },
      { icon: 'fi fi-rr-circle', label: 'Stop actuel', desc: 'animation pulsante' },
      { icon: 'fi fi-rr-camera', label: 'Photos par stop' },
    ],
  },
  {
    title: 'Carte du jour & budget',
    description: 'La carte n\'affiche que les routes du jour. Ajoute une dépense rapidement.',
    icon: 'fi fi-rr-sack',
    glowColor: '#0ea5e9',
    selector: '[data-onboarding="live-map"]',
    spotlightRxOverride: 24,
    features: [
      { icon: 'fi fi-rr-receipt', label: 'Dépenses du jour' },
      { icon: 'fi fi-rr-route', label: 'Trajets passés grisés', desc: 'futurs en vert' },
      { icon: 'fi fi-rr-mobile', label: 'Vue mobile', desc: 'basculer carte / panneau' },
    ],
  },
]

const steps = computed<Step[]>(() => props.view === 'live' ? liveSteps : dashboardSteps)
const currentStep = computed(() => steps.value[currentIndex.value])
const isLastStep = computed(() => currentIndex.value === steps.value.length - 1)
const spotlightRx = computed(() => currentStep.value.spotlightRxOverride ?? 14)

function measureSpotlight() {
  const sel = currentStep.value.selector
  if (!sel) { spotlightRect.value = null; return }
  const el = document.querySelector(sel)
  if (!el) { spotlightRect.value = null; return }
  spotlightRect.value = el.getBoundingClientRect()
}

watch(currentIndex, async () => {
  await nextTick()
  measureSpotlight()
})

const cardStyle = computed(() => {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const GAP = 16
  const r = spotlightRect.value

  if (!r) {
    // Centered fallback
    return {
      left: `${(vw - CARD_W) / 2}px`,
      top: `${(vh - CARD_H) / 2}px`,
    }
  }

  const spotLeft = r.x - PADDING
  const spotTop = r.y - PADDING
  const spotRight = r.x + r.width + PADDING
  const spotBottom = r.y + r.height + PADDING

  const spaceBelow = vh - spotBottom
  const spaceAbove = spotTop
  const spaceRight = vw - spotRight
  const spaceLeft = spotLeft

  let top: number
  let left: number

  if (spaceBelow >= CARD_H + GAP) {
    top = spotBottom + GAP
    left = Math.max(8, Math.min(r.x, vw - CARD_W - 8))
  } else if (spaceAbove >= CARD_H + GAP) {
    top = spotTop - CARD_H - GAP
    left = Math.max(8, Math.min(r.x, vw - CARD_W - 8))
  } else if (spaceRight >= CARD_W + GAP) {
    left = spotRight + GAP
    top = Math.max(8, Math.min(r.y, vh - CARD_H - 8))
  } else if (spaceLeft >= CARD_W + GAP) {
    left = spotLeft - CARD_W - GAP
    top = Math.max(8, Math.min(r.y, vh - CARD_H - 8))
  } else {
    left = (vw - CARD_W) / 2
    top = (vh - CARD_H) / 2
  }

  return {
    left: `${Math.max(8, Math.min(left, vw - CARD_W - 8))}px`,
    top: `${Math.max(8, Math.min(top, vh - CARD_H - 8))}px`,
  }
})

const arrowIcon = computed(() => {
  const r = spotlightRect.value
  if (!r) return 'fi fi-rr-arrow-down'
  const vw = window.innerWidth
  const vh = window.innerHeight

  const spotCx = r.x + r.width / 2
  const spotCy = r.y + r.height / 2

  const cardLeft = parseFloat(cardStyle.value.left as string)
  const cardTop = parseFloat(cardStyle.value.top as string)
  const cardCx = cardLeft + CARD_W / 2
  const cardCy = cardTop + CARD_H / 2

  const dx = spotCx - cardCx
  const dy = spotCy - cardCy

  if (Math.abs(dy) > Math.abs(dx)) {
    return dy > 0 ? 'fi fi-rr-arrow-down' : 'fi fi-rr-arrow-up'
  } else {
    return dx > 0 ? 'fi fi-rr-arrow-right' : 'fi fi-rr-arrow-left'
  }
})

const arrowStyle = computed(() => {
  const r = spotlightRect.value
  if (!r) return null

  const cardLeft = parseFloat(cardStyle.value.left as string)
  const cardTop = parseFloat(cardStyle.value.top as string)

  const icon = arrowIcon.value
  let left: number
  let top: number

  if (icon === 'fi fi-rr-arrow-down') {
    left = cardLeft + CARD_W / 2 - ARROW_SIZE / 2
    top = cardTop + CARD_H + 6
  } else if (icon === 'fi fi-rr-arrow-up') {
    left = cardLeft + CARD_W / 2 - ARROW_SIZE / 2
    top = cardTop - ARROW_SIZE - 6
  } else if (icon === 'fi fi-rr-arrow-right') {
    left = cardLeft + CARD_W + 6
    top = cardTop + CARD_H / 2 - ARROW_SIZE / 2
  } else {
    left = cardLeft - ARROW_SIZE - 6
    top = cardTop + CARD_H / 2 - ARROW_SIZE / 2
  }

  return { left: `${left}px`, top: `${top}px`, width: `${ARROW_SIZE}px`, height: `${ARROW_SIZE}px` }
})


function next() { if (!isLastStep.value) currentIndex.value++ }
function prev() { if (currentIndex.value > 0) currentIndex.value-- }
function goTo(i: number) { currentIndex.value = i }

function dismiss() {
  visible.value = false
  localStorage.setItem(STORAGE_KEY.value, '1')
  emit('done')
}

function handleOverlayClick() {
  if (isLastStep.value) dismiss()
  else next()
}


const onResize = () => measureSpotlight()

onMounted(() => {
  if (!localStorage.getItem(STORAGE_KEY.value)) {
    setTimeout(async () => {
      visible.value = true
      await nextTick()
      measureSpotlight()
    }, 700)
  }
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})
</script>
