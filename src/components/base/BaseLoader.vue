<template>
  <div class="inline-flex items-center gap-2" role="status" aria-live="polite" aria-busy="true">
    <svg class="animate-spin" :class="sizeClass" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
    </svg>
    <span v-if="text" class="text-sm text-gray-600">{{ text }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  size?: 'sm' | 'md' | 'lg'
  text?: string
}>(), {
  size: 'md',
  text: ''
})

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm': return 'w-5 h-5 text-gray-500'
    case 'lg': return 'w-10 h-10 text-gray-500'
    default:   return 'w-7 h-7 text-gray-500'
  }
})
</script>
