<template>
  <BaseGrid
    :columns="columns"
    :items="rows"
    :sticky-header="true"
    :scroll-x="true"
    y-max-height="60vh"
    header-bg-class="bg-gray-300"
    header-text-class="text-gray-800"
    row-text-class="text-gray-800"
    zebra-even-class="bg-gray-50"
    :page="page"
    :pageSize="pageSize"
    :showPagination="showPagination"
        :showRefresh="true"
    @refresh="handleRefresh"
  >
    <!-- Stato colorato -->
    <template #cell-stato="{ row }">
      <span
        class="inline-block px-2 py-1 rounded text-xs font-medium"
        :class="statoColor(row.stato as number)"
      >
        {{ row.desc_stato }}
      </span>
    </template>
  </BaseGrid>
</template>

<script setup lang="ts">
import BaseGrid from "@/components/base/BaseGrid.vue";
import { textCol } from "@/grids/columns";

const props = withDefaults(
  defineProps<{
    rows: any[];
    showPagination?: boolean;
    page?: number;
    pageSize?: number;
    onRefresh?: () => void;      // AGGIUNTO
  }>(),
  {
    showPagination: true,
    page: 1,
    pageSize: 10,
  }
);

const columns = [
  // textCol<any>("id", "ID", { width: "w-20" }),
  textCol<any>("id_flusso", "Flusso", { width: "w-40" }),
  textCol<any>("periodo", "Periodo", { width: "w-32" }),
  // qui mettiamo solo la chiave "stato", ma dentro usiamo row.stato + row.desc_stato
  textCol<any>("stato", "Stato", { width: "w-32" }),
  textCol<any>("data_richiesta", "Data Richiesta", { width: "w-40" }),
];

function statoColor(code: number | string) {
  // accetta sia numero che stringa
  const c = Number(code);
  switch (c) {
    case 1:
      return "bg-green-100 text-green-800"; // Completata
    case 2:
      return "bg-red-100 text-red-800"; // In elaborazione
    case 3:
      return "bg-red-100 text-red-800"; // Errore
    default:
      return "bg-yellow-100 text-yellow-800"; // Inviata o altro
  }
}

function handleRefresh() {
  // Se hai una prop onRefresh, chiamala
  if (typeof props.onRefresh === "function") {
    props.onRefresh();
  }
}
</script>
