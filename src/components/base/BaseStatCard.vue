<template>
  <div
    class="relative flex flex-col rounded-xl border  m-2 shadow-md"
    :class="rootClass"
  >
    <!-- Header -->
    <div v-if="$slots.header || title" class="p-2 px-3 border-b ">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div
            v-if="$slots.icon"
            class="h-8 w-8 rounded-lg flex items-center justify-center"
            :class="iconBgClass"
          >
            <slot name="icon" />
          </div>
          <div v-if="title" class="text-sm font-semibold text-brand-green">
            {{ title }}
          </div>
        </div>
        <slot name="header-right" />
      </div>

      <slot name="header" />
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-auto p-4 pb-20">
      <slot />
    </div>

    <!-- Footer (always visible) -->
    <div
      class="absolute bottom-0 left-0 right-0 h-8 py-1 bg-gray-50 border-t  rounded-b-xl text-sm text-gray-600"
    >
      <slot name="footer">
        <div class="text-center text-gray-400"></div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

type Variant = "blue" | "emerald" | "violet" | "slate" | "rose" | "amber";

const props = withDefaults(
  defineProps<{
    title?: string;
    variant?: Variant;
    rootClass?: string;
  }>(),
  {
    title: "",
    variant: "slate",
    rootClass: "p-0",
  }
);

const iconBgClass = computed(() => {
  switch (props.variant) {
    case "blue":
      return "bg-blue-50 text-blue-600";
    case "emerald":
      return "bg-emerald-50 text-emerald-600";
    case "violet":
      return "bg-violet-50 text-violet-600";
    case "rose":
      return "bg-rose-50 text-rose-600";
    case "amber":
      return "bg-amber-50 text-amber-600";
    default:
      return "bg-slate-50 text-slate-600";
  }
});
</script>
