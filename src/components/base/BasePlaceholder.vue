<template>
  <div
    class="flex items-center justify-center w-full h-[60vh] bg-white rounded-lg border border-gray-200 shadow-sm"
  >
    <div class="flex flex-col items-center text-gray-500 text-center">
      <!-- Icona -->
      <font-awesome-icon :icon="icon" class="text-8xl mb-6" />

      <!-- Testo principale -->
      <p class="text-2xl font-semibold">{{ title }}</p>

      <!-- Testo secondario -->
      <p v-if="subtitle" class="text-base mt-2">
        {{ subtitle }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

defineProps<{
  icon: string | string[]; // es: "folder-open" oppure ['fas', 'folder-open']
  title: string;           // testo principale
  subtitle?: string;       // testo secondario opzionale
}>();
</script>
