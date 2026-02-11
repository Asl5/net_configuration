<template>
  <div :class="['inline-flex', fit ? 'w-auto' : '', wrapperClass]">
    <div class="w-full mb-1">
      <label v-if="label && !floating" class="block text-sm font-medium text-gray-700">
        {{ label }}
      </label>

      <div class="relative">
        <!-- Box visibile -->
        <button
          type="button"
          @click="toggleOpen"
          :disabled="disabled"
          class="border rounded-lg text-sm bg-white shadow-sm py-2 pl-3 pr-10 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full h-10 flex items-center"
          @focus="isFocused = true"
          @blur="isFocused = false"
          ref="triggerEl"
        >
          <span v-if="selectedOption" class="truncate text-gray-900">
            {{ selectedOption.label }}
          </span>
          <!-- <span v-else class="text-gray-400">
            {{ placeholder || " " }}
          </span> -->

          <!-- Floating label overlay -->
          <label
            v-if="floating && label"
            class="absolute pointer-events-none z-10 transition-all duration-150 text-sm left-3"
            :class="[
              isSelectActive ? 'top-0 -translate-y-1/2 text-xs px-1 font-bold' : 'top-1/2 -translate-y-1/2 font-normal',
              'text-gray-500',
              'bg-white'
            ]"
          >
            {{ label }}
          </label>

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

        <!-- Dropdown (teleported to either modal portal or body) -->
        <teleport :to="teleportTarget">
          <div
            v-if="open"
            :style="dropdownStyle"
            class="fixed z-50 bg-white border rounded-lg shadow-lg overflow-auto"
            ref="dropdownEl"
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
        </teleport>
      </div>

      <p v-if="help" class="mt-1 text-sm text-gray-500">{{ help }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, nextTick, inject, type Ref } from "vue";

type Option = { value: string | number; label: string };
const modalScrollContainer = inject<Ref<HTMLElement | null>>(
  "modalScrollContainer",
  ref(null)
)
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
    floating?: boolean;
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
    floating: true,
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", v: string | number | null): void;
}>();

const open = ref(false);
const triggerEl = ref<HTMLElement | null>(null);
const dropdownEl = ref<HTMLElement | null>(null);
const teleportTarget = inject<string>('modalPortalTarget', 'body');

const dropdownStyle = ref<{ top: string; left: string; width: string; maxHeight: string }>(
  { top: "0px", left: "0px", width: "0px", maxHeight: "240px" }
);

function positionDropdown() {
  const t = triggerEl.value;
  if (!t) return;
  const rect = t.getBoundingClientRect();
  const viewportH = window.innerHeight;
  const spaceBelow = viewportH - rect.bottom - 8; // 8px margin
  const desiredMax = 240; // ~max-h-60
  let topPx = rect.bottom + 4; // small gap
  let maxH = Math.min(desiredMax, Math.max(120, spaceBelow));
  // If not enough space below, try placing above
  if (spaceBelow < 120) {
    const spaceAbove = rect.top - 8;
    if (spaceAbove > spaceBelow) {
      maxH = Math.min(desiredMax, Math.max(120, spaceAbove));
      topPx = Math.max(8, rect.top - maxH - 4);
    }
  }
  dropdownStyle.value = {
    top: `${Math.round(topPx)}px`,
    left: `${Math.round(rect.left)}px`,
    width: `${Math.round(rect.width)}px`,
    maxHeight: `${Math.round(maxH)}px`,
  };
}

function toggleOpen() {
  if (props.disabled) return;
  open.value = !open.value;
  if (open.value) nextTick(positionDropdown);
}
function close() {
  open.value = false;
}
function selectOption(opt: Option) {
  emit("update:modelValue", opt.value);
  close();
}

// Close on click outside and keep dropdown positioned on scroll/resize
function handleGlobalClick(e: MouseEvent) {
  const target = e.target as HTMLElement | null;
  const insideTrigger = !!(triggerEl.value && target && triggerEl.value.contains(target));
  const insideDropdown = !!(dropdownEl.value && target && dropdownEl.value.contains(target));
  if (!insideTrigger && !insideDropdown) close();
}
function handleWindowEvents() {
  if (open.value) positionDropdown();
}
function handleKey(e: KeyboardEvent) {
  if (e.key === "Escape") close();
}
onMounted(() => {
  document.addEventListener("click", handleGlobalClick);
  // window.addEventListener("scroll", handleWindowEvents, true);
  window.addEventListener("resize", handleWindowEvents);
  window.addEventListener("keydown", handleKey); if (modalScrollContainer.value) {
    modalScrollContainer.value.addEventListener("scroll", handleWindowEvents)
  } else {
    window.addEventListener("scroll", handleWindowEvents, true)
  }
});
onBeforeUnmount(() => {
  document.removeEventListener("click", handleGlobalClick);
  // window.removeEventListener("scroll", handleWindowEvents, true);
  window.removeEventListener("resize", handleWindowEvents);
  window.removeEventListener("keydown", handleKey);  if (modalScrollContainer.value) {
    modalScrollContainer.value.removeEventListener("scroll", handleWindowEvents)
  } else {
    window.removeEventListener("scroll", handleWindowEvents, true)
  }
});

const selectedOption = computed(() =>
  props.options.find((o) => o.value === props.modelValue) || null
);

// floating helpers
const isFocused = ref(false);
const isSelectActive = computed(() => open.value || !!selectedOption.value || isFocused.value);

</script>
