<template>
  <div class="app-surface app-text rounded-lg shadow-md flex flex-col h-full overflow-hidden">
    <!-- Header -->
    <div
      v-if="hasHeader"
      class="px-4 py-2 flex items-center justify-between border-b app-border"
    >
      <!-- Se passo la prop title -->
      <BaseLabel
        v-if="title"
        as="h1"
        :text="title"
        size="lg"
        weight="semibold"
      />

      <!-- Se non passo title, uso lo slot -->
      <slot v-else name="title" />

      <slot name="badge" />
    </div>

    <!-- Body -->
    <div class="p-4 text-sm app-text space-y-3 flex-1">
      <slot name="body" />
    </div>

    <!-- Footer (altezza minima fissa) -->
    <div
      class="px-4 py-3 app-surface text-xs app-muted flex items-center gap-2 min-h-[30px]"
    >
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import BaseLabel from "@/components/base/BaseLabel.vue";
import { useSlots, computed } from "vue";

const props = defineProps<{
  title?: string;
}>();

const slots = useSlots();
const hasHeader = computed(() => props.title || slots.title || slots.badge);
</script>

