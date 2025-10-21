<template>
  <transition name="fade">
    <div
      v-if="show"
      class="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
    >
      <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <!-- Titolo -->
        <h3 class="text-lg font-semibold mb-4 text-gray-700" :class="titleClass">
          {{ title }}
        </h3>

        <!-- Messaggio -->
        <p class="text-sm mb-6 text-gray-500" :class="messageClass">
          {{ message }}
        </p>

        <!-- Bottoni -->
        <div class="flex justify-end gap-3">
          <BaseButton
            v-if="cancelText"
            variant="secondary"
            size="sm"
            @click="$emit('cancel')"
          >
            {{ cancelText }}
          </BaseButton>
          <BaseButton
            variant="primary"
            size="sm"
            @click="$emit('confirm')"
          >
            {{ okText }}
          </BaseButton>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { watch } from "vue";
import BaseButton from "@/components/base/BaseButton.vue";

const props = defineProps<{
  show: boolean;
  title: string;
  message: string;
  okText?: string;
  cancelText?: string;
  titleClass?: string;
  messageClass?: string;
  autoCloseMs?: number; // <--- nuova prop
}>();

const emit = defineEmits<{
  (e: "confirm"): void;
  (e: "cancel"): void;
}>();

let timer: ReturnType<typeof setTimeout> | null = null;

watch(
  () => props.show,
  (val) => {
    if (val && props.autoCloseMs) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        emit("confirm");
      }, props.autoCloseMs);
    } else if (!val && timer) {
      clearTimeout(timer);
      timer = null;
    }
  }
);
</script>

<style scoped>
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
</style>
