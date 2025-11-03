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
import { onMounted, onBeforeUnmount, watch, computed } from 'vue';

/**
 * BaseModal — modale centrata, con blocco scroll e larghezza/altezza configurabili.
 * Ora include anche la prop `maxWidth`.
 */
const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    title?: string;
    lockScroll?: boolean;
    maxHeight?: string;
    maxWidth?: string; // ✅ nuova prop per controllare la larghezza
    scrollable?: boolean;
  }>(),
  {
    lockScroll: true,
    maxHeight: undefined as any,
    maxWidth: undefined as any,
    scrollable: true,
  }
);

const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>();

function close() {
  emit('update:modelValue', false);
}

/* ===== Blocca scroll body ===== */
function lockBody() {
  document.body.style.overflow = 'hidden';
}
function unlockBody() {
  document.body.style.overflow = '';
}

onMounted(() => {
  if (props.modelValue && props.lockScroll) lockBody();
});
onBeforeUnmount(() => unlockBody());

watch(
  () => props.modelValue,
  (v) => {
    if (!props.lockScroll) return;
    if (v) {
      lockBody();
    } else {
      unlockBody();
    }
  }
);

watch(
  () => props.lockScroll,
  (v) => {
    if (!props.modelValue) return;
    if (v) {
      lockBody();
    } else {
      unlockBody();
    }
  }
);

/* ===== Calcolo dimensioni dinamiche ===== */
const computedStyle = computed(() => {
  const style: Record<string, string> = {
    maxHeight: '95vh',
    maxWidth: '95vw', // ✅ di default non supera lo schermo
  };

  // Rispetta maxHeight personalizzata
  if (props.maxHeight) {
    style.height = `min(${props.maxHeight}, 95vh)`;
  }

  // Applica maxWidth personalizzata se definita
  if (props.maxWidth) {
    style.maxWidth = `min(${props.maxWidth}, 95vw)`;
  }

  return style;
});
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
