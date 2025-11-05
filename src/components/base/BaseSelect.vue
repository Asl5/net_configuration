<template>
  <div :class="['inline-flex', fit ? 'w-auto' : '', wrapperClass]">
    <div class="w-full">
      <label v-if="label" class="block text-sm font-medium  text-gray-700">
        {{ label }}
      </label>

      <div class="relative">
        <!-- Box visibile -->
        <button
          type="button"
          @click="toggleOpen"
          :disabled="disabled"
          class="border rounded-lg text-sm bg-white shadow-sm py-2 pl-3 pr-10 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
        >
          <span v-if="selectedOption" class="truncate text-gray-900">
            {{ selectedOption.label }}
          </span>
          <span v-else class="text-gray-400">
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
          <label
            v-for="opt in options"
            :key="opt.value"
            class="block px-3 py-2 cursor-pointer hover:bg-gray-50 text-gray-900 text-sm"
            @click="selectOption(opt)"
          >
            {{ opt.label }}
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
    modelValue: string | number | null;
    options: Option[];
    label?: string;
    placeholder?: string;
    fit?: boolean;
    disabled?: boolean;
    wrapperClass?: string;
    help?: string;
  }>(),
  {
    modelValue: null,
    options: () => [],
    label: "",
    placeholder: "",
    fit: false,
    disabled: false,
    wrapperClass: "",
    help: "",
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", v: string | number | null): void;
}>();

const open = ref(false);
function toggleOpen() {
  if (props.disabled) return;
  open.value = !open.value;
}
function close() {
  open.value = false;
}
function selectOption(opt: Option) {
  emit("update:modelValue", opt.value);
  close();
}

// chiudi se clicchi fuori
function handleClickOutside(e: MouseEvent) {
  if (!(e.target as HTMLElement).closest(".relative")) {
    close();
  }
}
onMounted(() => document.addEventListener("click", handleClickOutside));
onBeforeUnmount(() => document.removeEventListener("click", handleClickOutside));

const selectedOption = computed(() =>
  props.options.find((o) => o.value === props.modelValue) || null
);

</script>
