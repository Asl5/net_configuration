<template>
  <transition name="fade">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div
        class="bg-white rounded-lg shadow-lg w-full flex flex-col overflow-hidden"
        :style="computedStyle"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-100">
          <h3 class="text-lg font-semibold text-gray-800">{{ title }}</h3>
          <button
            @click="close"
            class="text-gray-800 hover:text-gray-600 font-semibold focus:outline-none"
          >
            ✕
          </button>
        </div>

        <!-- Content -->
        <div
        ref="scrollContainer"
          class="p-4 flex-1"
          :class="scrollable ? 'overflow-y-auto' : 'overflow-visible'"
        >
          <slot />
        </div>

        <!-- Footer -->
        <div
          v-if="$slots.footer"
          class="px-4 py-3 border-t border-gray-200 bg-gray-100"
        >
          <slot name="footer" />
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch, computed, ref } from 'vue'
import { provide  } from "vue"

const scrollContainer = ref<HTMLElement | null>(null)
provide("modalScrollContainer", scrollContainer)
const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    lockScroll?: boolean
    maxHeight?: string
    maxWidth?: string
    scrollable?: boolean
  }>(),
  {
    lockScroll: true,
    maxHeight: undefined as any,
    maxWidth: undefined as any,
    scrollable: true,
  }
)

const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()

function close() {
  emit('update:modelValue', false)
}

/* ===== Blocca scroll body ===== */
const lockBody = () => (document.body.style.overflow = 'hidden')
const unlockBody = () => (document.body.style.overflow = '')

onMounted(() => {
  if (props.modelValue && props.lockScroll) lockBody()
})
onBeforeUnmount(unlockBody)

watch(
  () => props.modelValue,
  (v) => {
    if (!props.lockScroll) return
    if (v) lockBody()
    else unlockBody()
  }
)

watch(
  () => props.lockScroll,
  (v) => {
    if (!props.modelValue) return
    if (v) lockBody()
    else unlockBody()
  }
)

/* ===== Rileva dimensioni schermo ===== */
const windowSize = ref({ width: window.innerWidth, height: window.innerHeight })
function handleResize() {
  windowSize.value = { width: window.innerWidth, height: window.innerHeight }
}
onMounted(() => window.addEventListener('resize', handleResize))
onBeforeUnmount(() => window.removeEventListener('resize', handleResize))

/* ===== Calcolo dimensioni dinamiche ===== */
const computedStyle = computed(() => {
  const w = windowSize.value.width
  const isSmall = w < 768 // breakpoint per tablet/schermi piccoli

  const style: Record<string, string> = {}

  if (isSmall) {
    // Forza valori su schermi piccoli
    style.maxWidth = '90vw'
    style.maxHeight = '60vh'
  } else {
    // Usa le props o i default “grandi”
    style.maxWidth = props.maxWidth ? `min(${props.maxWidth}, 95vw)` : '95vw'
    style.maxHeight = props.maxHeight ? `min(${props.maxHeight}, 95vh)` : '95vh'
  }

  return style
})
</script>


<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
