<script setup lang="ts">
import { computed } from "vue";
import { iconMap } from "@/icons/map";

const props = defineProps<{
  /** Nome logico dell’icona (vedi iconMap) */
  name: string;
  /** Colore (classe Tailwind o HEX opzionale) */
  color?: string;
  /** Dimensione (es. w-4, w-6, h-5, text-xl, ecc.) */
  size?: string;
  /** Classe extra opzionale */
  class?: string;
}>();

const IconComponent = computed(() => iconMap[props.name]);
const computedClass = computed(() => [
  props.size || "w-5 h-5",
  props.color || "text-gray-700",
  props.class,
]);
</script>

<template>
  <component
    :is="IconComponent"
    v-if="IconComponent"
    :class="computedClass"
  />
  <span v-else class="text-xs text-red-500">?</span>
</template>
