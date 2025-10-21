<template>
  <div
    class="relative"
    :aria-busy="loading ? 'true' : 'false'"
    :aria-live="loading ? 'polite' : undefined"
  >
    <!-- Contenuto -->
    <div
      :class="[
        'transition',
        variant === 'blur' && loading ? blurClass : '',
        disableInteractions && loading ? 'pointer-events-none select-none' : ''
      ]"
    >
      <slot />
    </div>

    <!-- Overlay / Spinner centrato -->
    <div
      v-if="loading"
      class="absolute inset-0 flex items-center justify-center z-30"
      :class="variant === 'overlay' ? overlayClassComputed : 'bg-transparent'"
    >
      <BaseLoader :size="size" :text="text" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseLoader from './BaseLoader.vue'

const props = withDefaults(defineProps<{
  loading: boolean
  /** 'overlay' = velo + spinner; 'blur' = sfoca il contenuto + spinner */
  variant?: 'overlay' | 'blur'
  /** intensità blur */
  blurAmount?: 'sm' | 'md' | 'lg'
  /** disabilita interazioni durante loading */
  disableInteractions?: boolean
  /** colore/trasparenza overlay custom (solo variant=overlay) */
  overlayClass?: string
  /** dimensione spinner */
  size?: 'sm' | 'md' | 'lg'
  /** testo sotto/spalla allo spinner */
  text?: string
}>(), {
  variant: 'overlay',
  blurAmount: 'md',
  disableInteractions: true,
  overlayClass: 'bg-white/60 backdrop-blur-[2px]',
  size: 'md',
  text: ''
})

const blurClass = computed(() => {
  switch (props.blurAmount) {
    case 'sm': return 'filter blur-[1px] opacity-80'
    case 'lg': return 'filter blur-[6px] opacity-70'
    default:   return 'filter blur-[3px] opacity-75'
  }
})

const overlayClassComputed = computed(() => props.overlayClass)
</script>
