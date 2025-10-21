<template>
  <div :class="['inline-flex', fit ? 'w-auto' : '', wrapperClass]">
    <div class="w-full">
      <label v-if="label" class="block text-sm font-medium mb-1 text-gray-700">
        {{ label }}
      </label>

      <div class="relative">
        <!-- Box visibile -->
        <button
          type="button"
          @click="toggleOpen"
          :disabled="disabled"
          class=" text-sm border rounded-lg bg-white shadow-sm py-2 pl-3 pr-10 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full min-h-[2.5rem] max-h-[2.5rem]"
        >
          <span
            v-if="innerValue.length"
            class="block text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis"
            :title="selectedLabels.join(', ')"
          >
            {{ displayValue }}
          </span>
          <span v-else class="block truncate text-gray-400 whitespace-nowrap overflow-hidden text-ellipsis" :title="placeholder || 'Seleziona…'">
            {{ placeholder || "Seleziona…" }}
          </span>

          <!-- Chevron -->
          <span class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                clip-rule="evenodd"
              />
            </svg>
          </span>
        </button>

        <!-- Dropdown -->
        <div
          v-if="open"
          class="absolute z-50 mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto w-full"
        >
          <!-- Seleziona/deseleziona tutti -->
          <div
            class="flex items-center gap-2 px-3 py-1 cursor-pointer hover:bg-gray-100 font-semibold text-sm text-gray-700 border-b"
            @click="toggleSelectAll"
          >
            <input
              type="checkbox"
              class="accent-blue-600"
              :checked="isAllSelected"
              readonly
            />
            <span>{{ isAllSelected ? "Deseleziona tutti" : "Seleziona tutti" }}</span>
          </div>

          <!-- Opzioni -->
          <label
            v-for="opt in options"
            :key="opt.value"
            class="flex items-center gap-2 px-3 py-1 cursor-pointer hover:bg-gray-50"
          >
            <input
              type="checkbox"
              class="accent-blue-600"
              :value="opt.value"
              v-model="innerValue"
              :disabled="disabled"
            />
            <span class="text-gray-900">{{ opt.label }}</span>
          </label>

          <p v-if="!options.length" class="text-sm text-gray-400 px-3 py-2">
            Nessuna opzione disponibile
          </p>
        </div>
      </div>

      <p v-if="help" class="mt-1 text-sm text-gray-500">{{ help }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from "vue";

type Option = { value: string | number; label: string };

const props = withDefaults(
  defineProps<{
    modelValue: Array<string | number>;
    options: Option[];
    label?: string;
    placeholder?: string;
    fit?: boolean;
    disabled?: boolean;
    wrapperClass?: string;
    help?: string;
    maxVisibleLabels?: number;
  }>(),
  {
    modelValue: () => [],
    options: () => [],
    label: "",
    placeholder: "",
    fit: false,
    disabled: false,
    wrapperClass: "",
    help: "",
    maxVisibleLabels: 3,
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", v: Array<string | number>): void;
}>();

const innerValue = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const open = ref(false);
function toggleOpen() {
  if (props.disabled) return;
  open.value = !open.value;
}
function close() {
  open.value = false;
}

// chiudi se clicchi fuori
function handleClickOutside(e: MouseEvent) {
  if (!(e.target as HTMLElement).closest(".relative")) {
    close();
  }
}
onMounted(() => document.addEventListener("click", handleClickOutside));
onBeforeUnmount(() => document.removeEventListener("click", handleClickOutside));

const selectedLabels = computed(() =>
  props.options.filter((o) => innerValue.value.includes(o.value)).map((o) => o.label)
);

// Stringa visualizzata con clamp: mostra fino a N etichette poi "+X"
const displayValue = computed(() => {
  const labels = selectedLabels.value;
  const max = props.maxVisibleLabels ?? 3;
  if (labels.length <= max) return labels.join(', ');
  const shown = labels.slice(0, max).join(', ');
  const rest = labels.length - max;
  return `${shown}, +${rest}`;
});

const isAllSelected = computed(() =>
  props.options.length > 0 && innerValue.value.length === props.options.length
);

function toggleSelectAll() {
  if (isAllSelected.value) {
    innerValue.value = [];
  } else {
    innerValue.value = props.options.map((o) => o.value);
  }
}
</script>
