<template>
  <transition name="fade">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div
        class="bg-white rounded-lg shadow-lg flex flex-col"
        :class="['w-full', 'max-w-4xl', 'max-h-[90vh]']"
        :style="modalStyle"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-800">{{ title }}</h3>
          <button
            @click="close"
            class="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            ✕
          </button>
        </div>

        <!-- Content -->
        <div
          class="p-4 flex-1"
          :class="scrollable ? 'overflow-auto' : 'overflow-visible'"
        >
          <slot />
        </div>

        <!-- Footer -->
        <div
          v-if="$slots.footer"
          class="px-4 py-3 border-t border-gray-200 bg-gray-50"
        >
          <slot name="footer" />
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    title?: string;
    width?: string;
    height?: string;
    scrollable?: boolean; // decidi tu se scroll o no
  }>(),
  {
    title: "",
    width: "70vw",
    height: "80vh",
    scrollable: true, // di default c’è scroll
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

function close() {
  emit("update:modelValue", false);
}

// dimensioni dinamiche
const modalStyle = computed(() => ({
  width: props.width,
  height: props.height,
}));
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
