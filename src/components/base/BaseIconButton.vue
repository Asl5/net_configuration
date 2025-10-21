<!-- filepath: src/components/base/IconButton.vue -->
<template>
  <button
    :class="['inline-flex items-center justify-center rounded p-1 transition min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0', variantClass, sizeClass]"
    v-bind="$attrs"
    @click="$emit('click', $event)"
    type="button"
  >
    <!-- Priorità: slot custom > svg inline > icona FA -->
    <slot v-if="$slots.default" />
    <span v-else-if="svgPath" aria-hidden="true"
      :class="['inline-block', iconSizeClass, iconColorClass]">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" :width="iconPx" :height="iconPx">
        <path :d="svgPath" />
      </svg>
    </span>
    <i v-else :class="faClass" aria-hidden="true"></i>
  </button>
  
</template>

<script setup lang="ts">
import { computed } from "vue";
const props = defineProps({
  size: { type: String, default: "md" },
  variant: { type: String, default: "default" },
  // Nome icona. Supporta:
  // - FontAwesome (es: 'fa-solid fa-download' oppure alias 'download')
  // - Alcune SVG inline pre-mappate (es: 'file-excel', 'download')
  icon: { type: String, default: "" },
  // Colore icona (Tailwind class) quando si usa SVG inline
  iconColor: { type: String, default: "text-gray-600" },
});
const sizeClass = computed(() =>
  props.size === "xs"
    ? "h-7 w-7 text-xs"
    : props.size === "sm"
    ? "h-8 w-8 text-sm"
    : "h-10 w-10 text-base"
);
const variantClass = computed(() =>
  props.variant === "danger"
    ? " hover:bg-red-200 text-red-600"
    : " hover:bg-gray-200 text-gray-600 "
);

// Dimensioni icona coerenti col bottone
const iconPx = computed(() => (props.size === 'xs' ? 14 : props.size === 'sm' ? 16 : 18));
const iconSizeClass = computed(() => (props.size === 'xs' ? 'h-3.5 w-3.5' : props.size === 'sm' ? 'h-4 w-4' : 'h-4.5 w-4.5'));
const iconColorClass = computed(() => props.iconColor);

// Mappa SVG inline disponibili
const svgMap: Record<string, string> = {
  // Semplice download
  download: 'M12 16a1 1 0 0 0 1-1V8h2.586a1 1 0 0 0 .707-1.707l-4.586-4.586a1 1 0 0 0-1.414 0L5.707 6.293A1 1 0 0 0 6.414 8H9v7a1 1 0 0 0 1 1h2Zm-7 2a1 1 0 1 0 0 2h14a1 1 0 1 0 0-2H5Z',
  // Icona stile Excel semplificata (foglio con X)
  'file-excel': 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm1 7V3.5L19.5 8H15ZM9 10l2 3 2-3h2l-3 4 3 4h-2l-2-3-2 3H7l3-4-3-4h2Z',
};

const svgPath = computed(() => svgMap[props.icon] ?? (props.icon === 'excel' ? svgMap['file-excel'] : ''));

// FontAwesome class resolution
function resolveFa(icon: string): string {
  if (!icon) return 'fa-solid fa-circle';
  if (icon.includes('fa-')) return icon; // already class string
  // simple aliases
  const aliases: Record<string, string> = {
    download: 'fa-solid fa-download',
    'file-excel': 'fa-regular fa-file-excel',
    excel: 'fa-regular fa-file-excel',
    file: 'fa-regular fa-file',
  };
  return aliases[icon] ?? `fa-solid fa-${icon}`;
}

const faClass = computed(() => resolveFa(props.icon));
</script>
