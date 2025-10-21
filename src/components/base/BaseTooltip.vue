<template>
  <teleport to="body">
    <div
      v-if="visible"
      class="fixed z-[99999] bg-gray-800 text-white text-xs rounded-lg px-3 py-2 shadow-xl pointer-events-none"
      :style="{ top: y + 'px', left: x + 'px' }"
    >
      <!-- Contenuto dinamico -->
      <slot :data="data" />

      <!-- Freccetta -->
      <div
        class="absolute w-0 h-0 border-l-6 border-r-6 border-b-6 border-l-transparent border-r-transparent border-b-gray-800"
        :style="{ top: '-6px', left: '50%', transform: 'translateX(-50%)' }"
      ></div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";

type RitVal = { code: string; value: number; descrizione?: string };

const visible = ref(false);
const x = ref(0);
const y = ref(0);
const data = ref<RitVal | null>(null);

function show(e: MouseEvent, payload: RitVal) {
  visible.value = true;
  x.value = e.clientX + 10;
  y.value = e.clientY + 10;
  data.value = payload;
}

function hide() {
  visible.value = false;
  data.value = null;
}

function move(e: MouseEvent) {
  if (visible.value) {
    x.value = e.clientX + 10;
    y.value = e.clientY + 10;
  }
}

onMounted(() => {
  window.addEventListener("mousemove", move);
});
onBeforeUnmount(() => {
  window.removeEventListener("mousemove", move);
});

defineExpose({ show, hide, data });
</script>
