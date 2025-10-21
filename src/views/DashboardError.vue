<!-- src/views/DashboardView.vue -->
<template>
  <div class="min-h-screen h-dvh w-full flex flex-col bg-white">
    <BaseHeader title="Dashboard Errori" />

    <div class="flex-1 min-h-0 overflow-auto">
      <div class="w-full px-4 sm:px-6 py-4 sm:py-6 space-y-3">
        <!-- Barra filtri -->
        <div
          class="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-end gap-3 sm:gap-4"
        >
          <BaseSelect
            v-model="selectedFlow"
            :options="flowOptions"
            :loading="flowLoading"
            label="Flusso"
            placeholder="Seleziona flusso"
            size="md"
            :fit="false"
            :clearable="true"
            wrapperClass="w-full sm:flex-1"
          />
          <BaseSelect
            v-model="selectedType"
            :options="typeOptions"
            :loading="typeLoading"
            :disabled="selectedFlow === null || typeLoading"
            label="Tipo"
            placeholder="Seleziona tipo"
            size="md"
            :fit="false"
            :clearable="true"
            wrapperClass="w-full sm:flex-1"
          />
          <BaseSelect
            v-model="selectedMonth"
            :options="monthOptions"
            label="Mese"
            placeholder="Seleziona mese"
            size="md"
            :fit="false"
            :clearable="true"
            wrapperClass="w-full sm:w-48"
          />
          <BaseSelect
            v-model="selectedYear"
            :options="yearOptions"
            label="Anno"
            placeholder="Seleziona anno"
            size="md"
            :fit="false"
            :clearable="true"
            wrapperClass="w-full sm:w-40"
          />
          <BaseButton
            class="w-full sm:w-auto"
            variant="primary"
            :disabled="dynamicLoading || flowLoading"
            @click="applyFilters"
          >
            Carica
          </BaseButton>
          <BaseButton
            class="w-full sm:w-auto"
            variant="info"
            :disabled="dynamicLoading || dynamicRows.length === 0"
            @click="showStats = true"
          >
            Statistiche
          </BaseButton>
          <BaseButton
            class="w-full sm:w-auto"
            variant="secondary"
            :disabled="dynamicLoading || dynamicRows.length === 0"
            @click="onExport"
          >
            Export griglia
          </BaseButton>
        </div>
        <div v-if="selectedTypeObj" class="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p class="text-sm text-blue-800">
             <span><BaseIcon name="info" size="w-5 h-5" color="yellow-600"  class="inline align-text-bottom mr-1" /></span
          > <span class="font-semibold">Descrizione:</span>
            {{ selectedTypeObj.descrizioneLunga }}
          </p>
        </div>
        <div
          class="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-600 mb-3"
        >
          <span><BaseIcon name="error" size="w-5 h-5" color="yellow-600"  class="inline align-text-bottom mr-1" /></span
          ><span>
            I dati visualizzati fanno riferimento all'ultimo invio effettuato e possono essere
            filtrati per un massimo di <strong>2 anni</strong>.</span
          >
        </div>
        <div class="">
          <BaseBusy :loading="dynamicLoading" variant="blur" text="Caricamento">
            <template v-if="dynamicRows.length > 0">
              <BaseGrid
                :columns="dynamicColumns"
                :items="dynamicRows"
                :sticky-header="true"
                :scroll-x="true"
                :scroll-y="true"
                y-max-height="60vh"
                header-bg-class="bg-gray-300"
                header-text-class="text-gray-800"
                row-text-class="text-gray-800"
                zebra-even-class="bg-gray-50"
                :showRefresh="true"
                @refresh="applyFilters"
                :page="1"
                :pageSize="20"
                showPagination
                :show-filters="false"
              />
            </template>
            <template v-else>
              <BasePlaceholder
                icon="folder-open"
                title="Nessun dato disponibile"
                subtitle="Modifica i filtri e riprova"
              />
            </template>
          </BaseBusy>
        </div>

        <p v-if="dynamicError" class="text-red-600 mt-2">{{ dynamicError }}</p>
      </div>
    </div>
  </div>
  <BaseModal v-model="showStats" title="Statistiche" height="60vh">
    <div v-if="stats.ready" class="space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <BaseStatCard title="Totale righe" variant="blue">
          <div class="text-2xl font-semibold text-gray-900">
            {{ stats.totalRows.toLocaleString() }}
          </div>
        </BaseStatCard>
        <BaseStatCard title="Totale conteggi" variant="rose">
          <div class="text-2xl font-semibold text-gray-900">
            {{ stats.totalCount.toLocaleString() }}
          </div>
        </BaseStatCard>
        <BaseStatCard title="Descrizioni uniche" variant="amber">
          <div class="text-2xl font-semibold text-gray-900">
            {{ stats.topCodes.length > 0 ? stats.topCodes.length.toLocaleString() : "�" }}
          </div>
        </BaseStatCard>
      </div>
      <div v-if="stats.topCodes.length > 0" class="w-full">
        <div class="grid grid-cols-2 sm:grid-cols-2 gap-3">
          <BaseStatCard title="Top 5 descrizioni errore" variant="violet">
            <div>
              <div
                v-for="c in stats.topCodes"
                :key="c.key"
                class="flex items-center justify-between text-sm"
              >
                <div class="text-gray-700 truncate">{{ c.key }}</div>
                <div class="font-semibold text-gray-900">{{ c.value.toLocaleString() }}</div>
              </div>
            </div>
          </BaseStatCard>

          <BaseStatCard title="Per flusso" variant="emerald">
            <div class="space-y-1">
              <div v-if="stats.perFlow.length > 0" class="w-full">
                <div
                  v-for="f in stats.perFlow"
                  :key="f.flow"
                  class="flex items-center justify-between text-sm"
                >
                  <div class="text-gray-700 truncate">{{ f.flow }}</div>
                  <div class="font-semibold text-gray-900">{{ f.count.toLocaleString() }}</div>
                </div>
              </div>
              <div v-else class="text-sm text-gray-500">Nessun dato</div>
            </div>
          </BaseStatCard>
        </div>
      </div>
    </div>
    <template #footer>
      <BaseButton variant="secondary" @click="showStats = false">Chiudi</BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import BaseGrid from "@/components/base/BaseGrid.vue";
import BaseBusy from "@/components/base/BaseBusy.vue";
import BaseHeader from "@/components/base/BaseHeader.vue";
import BaseSelect from "@/components/base/BaseSelect.vue";
import BaseIcon from "@/components/base/BaseIcon.vue";
import BaseButton from "@/components/base/BaseButton.vue";
import BasePlaceholder from "@/components/base/BasePlaceholder.vue";
import BaseStatCard from "@/components/base/BaseStatCard.vue";

import BaseModal from "@/components/base/BaseModal.vue";
import { apiLoadFlows, apiLoadErrorTypes, apiRunDynamicQuery } from "@/services/api";
// import { formatDateTimeIt } from "@/utils/date";
// import { dashboardColumns } from "@/grids/registry";
// import type { DashboardDbRow, DashboardRow } from "@/grids/models";
// import { useQueryGrid } from "@/composable/useQueryGrid";
import { useRightsStore } from "@/stores/rights";
import { dynamicColumnsRegistry } from "@/grids/dynamicColumnRegistry";
import { pad2 } from "@/utils/date";
import { exportToExcelAoA } from "@/utils/utils";

/* ==================== Flussi ==================== */
type FlowOption = { value: number; label: string };
const flowOptions = ref<FlowOption[]>([]);
const selectedFlow = ref<number | null>(null);
const flowLoading = ref(false);
const FILTERS_KEY = "dashboardFilters";
type TypeOption = {
  value: number | string;
  label: string;
  codice: string;
  query: number;
  descrizioneLunga?: string;
};
const typeOptions = ref<TypeOption[]>([]);
const selectedType = ref<number | string | null>(null);
const typeLoading = ref(false);
const rightsStore = useRightsStore();
const dynamicColumns = ref<any[]>([]);
const dynamicRows = ref<any[]>([]);
const dynamicLoading = ref(false);
const dynamicError = ref<string | null>(null);
const now = new Date();
const currentMonth = now.getMonth() + 1; // 1..12
const currentYear = now.getFullYear();
const monthOptions = [
  { value: 1, label: "Gennaio" },
  { value: 2, label: "Febbraio" },
  { value: 3, label: "Marzo" },
  { value: 4, label: "Aprile" },
  { value: 5, label: "Maggio" },
  { value: 6, label: "Giugno" },
  { value: 7, label: "Luglio" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Settembre" },
  { value: 10, label: "Ottobre" },
  { value: 11, label: "Novembre" },
  { value: 12, label: "Dicembre" },
];

const showStats = ref(false);

type Stats = {
  ready: boolean;
  totalRows: number;
  totalCount: number; // somma della prima colonna numerica individuata
  topCodes: Array<{ key: string; value: number }>;
  perFlow: Array<{ flow: string; count: number }>;
};

const stats = ref<Stats>({
  ready: false,
  totalRows: 0,
  totalCount: 0,
  topCodes: [],
  perFlow: [],
});
const yearOptions = Array.from({ length: 6 }, (_, i) => {
  const y = currentYear - 2 + i;
  return { value: y, label: String(y) };
});
const selectedMonth = ref<number | null>(currentMonth);
const selectedYear = ref<number | null>(currentYear);

function saveFilters() {
  const filters = {
    flow: selectedFlow.value,
    type: selectedType.value,
    month: selectedMonth.value,
    year: selectedYear.value,
  };
  localStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
}

// function restoreFilters() {
//   const raw = localStorage.getItem(FILTERS_KEY);
//   if (!raw) return;
//   try {
//     const filters = JSON.parse(raw);
//     if (filters.flow) selectedFlow.value = filters.flow;
//     if (filters.type) selectedType.value = filters.type;
//     if (filters.month) selectedMonth.value = filters.month;
//     if (filters.year) selectedYear.value = filters.year;
//   } catch (err) {
//     console.warn("Errore parsing filtri da localStorage", err);
//   }
// }

async function loadFlows(matricola: string) {
  flowLoading.value = true;
  try {
    const { data } = await apiLoadFlows(matricola);
    const rows = Array.isArray(data?.rows) ? data.rows : [];
    flowOptions.value = rows.map((r: any) => ({
      value: r.ID_FLUSSO,
      label: r.DESCRIZIONE_FLUSSO + " - " + r.DESCRIZIONE_FLUSSO_LUN,
    }));
  } catch (err) {
    console.error("Errore caricamento flussi:", err);
  } finally {
    flowLoading.value = false;
  }
}

/* ==================== Tipo (query 4) ==================== */

async function loadTypesForFlow(flowId: number) {
  typeLoading.value = true;
  try {
    const { data } = await apiLoadErrorTypes(flowId);
    const rows = Array.isArray(data?.rows) ? data.rows : [];
    // Adatta i campi qui sotto a quelli reali della tua query 4
    typeOptions.value = rows.map((r: any) => ({
      value: r.ID_TIPO ?? r.ID ?? r.VALUE ?? r.id,
      codice: r.CODICE,
      query: r.ID_QUERY_ERROR,
      label: r.CODICE + " - " + r.NAME,
      descrizioneLunga: r.DESCRIZIONE_LUNGA ?? r.DESCRIZIONE ?? "",
    }));
  } catch (err) {
    console.error("Errore caricamento tipi:", err);
  } finally {
    typeLoading.value = false;
  }
}

/* ==================== Griglia ==================== */
// const columns = dashboardColumns;

// const gridParams = computed(() => {
//   const params: Array<{ name: string; value: unknown }> = [];
//   if (selectedFlow.value != null) params.push({ name: "flowId", value: selectedFlow.value });
//   if (selectedMonth.value != null) params.push({ name: "month", value: selectedMonth.value });
//   if (selectedYear.value != null) params.push({ name: "year", value: selectedYear.value });
//   // Se in futuro vorrai usare anche il "tipo" per la query 103:
//   // if (selectedType.value != null) params.push({ name: "typeId", value: selectedType.value })
//   return params;
// });

// const { filteredRows, loading, error, refresh } = useQueryGrid<DashboardDbRow, DashboardRow>({
//   queryId: 103,
//   params: gridParams,
//   mapRow: (r: DashboardDbRow) => ({
//     id: r.ID,
//     descrizione: r.DESCRIZIONE,
//     data_ins: formatDateTimeIt(r.DATA_INS ?? null),
//   }),
//   filterFn: (r, term) => r.descrizione.toLowerCase().includes(term) || String(r.id).includes(term),
// });

/* ==================== Bottone applica ==================== */

function computeStatsFromDynamic() {
  const rows = dynamicRows.value || [];

  const empty = {
    ready: false,
    totalRows: 0,
    totalCount: 0,
    topCodes: [] as Array<{ key: string; value: number }>, // conterr� le DESCRIZIONI
    perFlow: [] as Array<{ flow: string; count: number }>,
  };

  if (rows.length === 0) {
    stats.value = empty;
    return;
  }

  const firstRow = rows[0];
  const keys = Object.keys(firstRow);

  // Colonna numerica preferita
  const numericKeys = keys.filter((k) => typeof firstRow[k] === "number");
  const preferredNumKey =
    numericKeys.find((k) => /count|tot|num|quant|val/i.test(k)) || numericKeys[0] || null;

  // 1) tenta match ESATTO (case-insensitive) per "DESC. ERRORE"
  let descrKey: string | null =
    keys.find((k) => k.toLowerCase() === "desc. errore".toLowerCase()) || null;

  // 2) se non c��, tenta alias comuni (case-insensitive)
  if (!descrKey) {
    const preferredDescrOrder = [
      "DESC. ERRORE",
      "DESCRIZIONE",
      "DESCR_ERR",
      "DESCRIZIONE_ERRORE",
      "ERRORE_DESCRIZIONE",
      "ERRORE",
      "MESSAGE",
      "MESSAGGIO",
      "TESTO",
      "DESCRIPTION",
    ];
    descrKey =
      preferredDescrOrder.find((expected) =>
        keys.some((k) => k.toLowerCase() === expected.toLowerCase())
      ) || null;
  }

  // 3) fallback regex generica
  if (!descrKey) {
    descrKey =
      keys.find((k) =>
        /(^|[.s])(desc.?s*errore|descrizione|descr|message|messaggio|testo|errore)s?($|[.s])/i.test(
          k
        )
      ) || null;
  }

  // Colonna flusso (opzionale)
  const flowKey = keys.find((k) => /(^|)(flusso|flow)s?($|)/i.test(k)) || null;

  const out = { ...empty };
  out.totalRows = rows.length;

  if (preferredNumKey) {
    out.totalCount = rows.reduce((sum, r) => {
      const v = Number(r[preferredNumKey]);
      return sum + (Number.isFinite(v) ? v : 0);
    }, 0);
  }

  // Top descrizioni errore (usiamo "DESC. ERRORE" se c��)
  if (descrKey && preferredNumKey) {
    const map = new Map<string, number>();
    for (const r of rows) {
      const descr = String(r[descrKey] ?? "");
      const n = Number(r[preferredNumKey] ?? 1);
      map.set(descr, (map.get(descr) ?? 0) + (Number.isFinite(n) ? n : 0));
    }
    out.topCodes = Array.from(map.entries())
      .map(([key, value]) => ({ key, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  } else {
    out.topCodes = [];
  }

  // Aggregazione per flusso
  if (flowKey && preferredNumKey) {
    const fmap = new Map<string, number>();
    for (const r of rows) {
      const flow = String(r[flowKey] ?? "");
      const n = Number(r[preferredNumKey] ?? 1);
      fmap.set(flow, (fmap.get(flow) ?? 0) + (Number.isFinite(n) ? n : 0));
    }
    out.perFlow = Array.from(fmap.entries())
      .map(([flow, count]) => ({ flow, count }))
      .sort((a, b) => b.count - a.count);
  }

  out.ready = true;
  stats.value = out;
}
async function applyFilters() {
  if (!selectedType.value) return;

  const opt = typeOptions.value.find((o) => o.value === selectedType.value);
  if (!opt) return;

  dynamicLoading.value = true;
  dynamicError.value = null;

  try {
    const { data } = await apiRunDynamicQuery(
      opt.query,
      `${pad2(selectedMonth.value)}%${selectedYear.value}`,
      `${pad2(selectedMonth.value)}%${selectedYear.value}`
    );

    const rows = Array.isArray(data?.rows) ? data.rows : [];

    if (rows.length === 0) {
      dynamicRows.value = [];
      dynamicColumns.value = [];
      stats.value = { ready: false, totalRows: 0, totalCount: 0, topCodes: [], perFlow: [] };
      return;
    }

    dynamicRows.value = rows;

    const config = dynamicColumnsRegistry[opt.query];
    if (config) {
      dynamicColumns.value = config;
    } else {
      dynamicColumns.value = Object.keys(rows[0]).map((key) => ({
        key,
        label: key,
        align: "left",
      }));
    }

    // Calcola le statistiche dopo aver aggiornato righe e colonne
    computeStatsFromDynamic();
  } catch (err: any) {
    dynamicRows.value = [];
    dynamicColumns.value = [];
    stats.value = { ready: false, totalRows: 0, totalCount: 0, topCodes: [], perFlow: [] };
    dynamicError.value = err.message || "Errore durante l'esecuzione query";
  } finally {
    dynamicLoading.value = false;
  }
}

const selectedTypeObj = computed(() =>
  typeOptions.value.find((t) => t.value === selectedType.value)
);

/* ==================== Bootstrap ==================== */
onMounted(async () => {
  rightsStore.hydrateFromSession();

  if (rightsStore.matricola) {
    await loadFlows(rightsStore.matricola);
  } else {
    console.warn("Nessuna matricola trovata, utente non bootstrap?");
  }

  // Prova a ripristinare i filtri precedenti
  const raw = localStorage.getItem(FILTERS_KEY);
  if (raw) {
    try {
      const filters = JSON.parse(raw);
      if (filters.flow) {
        selectedFlow.value = filters.flow;
        await loadTypesForFlow(filters.flow); // ?? prima popola la combo tipo
      }
      if (filters.type) selectedType.value = filters.type;
      if (filters.month) selectedMonth.value = filters.month;
      if (filters.year) selectedYear.value = filters.year;
    } catch (err) {
      console.warn("Errore parsing filtri", err);
    }
  }

  // Se ci sono gi� flow e type salvati ? carico direttamente la griglia
  if (selectedFlow.value && selectedType.value) {
    await applyFilters();
  }
});

watch([selectedFlow, selectedType, selectedMonth, selectedYear], saveFilters);
/* Popola la combo "Tipo" al cambio flusso */
watch(selectedFlow, async (val, oldVal) => {
  // reset combo tipo
  selectedType.value = null;
  typeOptions.value = [];
  if (val != null && val !== oldVal) {
    await loadTypesForFlow(val);
  }
});

/* ==================== Export griglia ==================== */
function onExport() {
  if (!dynamicRows.value.length || !dynamicColumns.value.length) return;

  const topHeaders: string[] = [];
  const subHeaders: string[] = [];
  const keys: string[] = [];
  for (const c of dynamicColumns.value as any[]) {
    if (c.subColumns && Array.isArray(c.subColumns) && c.subColumns.length) {
      for (const sc of c.subColumns) {
        topHeaders.push(String(c.label ?? c.key));
        subHeaders.push(String(sc.label ?? sc.key));
        keys.push(String(sc.key));
      }
    } else {
      topHeaders.push(String(c.label ?? c.key));
      subHeaders.push("");
      keys.push(String(c.key));
    }
  }

  const dataRows = (dynamicRows.value as any[]).map((row) => keys.map((k) => row[k]));
  const aoa = [topHeaders, subHeaders, ...dataRows];

  const merges: Array<{ s: { r: number; c: number }; e: { r: number; c: number } }> = [];
  let colIndex = 0;
  for (const c of dynamicColumns.value as any[]) {
    if (c.subColumns && Array.isArray(c.subColumns) && c.subColumns.length) {
      const start = colIndex;
      const end = colIndex + c.subColumns.length - 1;
      merges.push({ s: { r: 0, c: start }, e: { r: 0, c: end } });
      colIndex += c.subColumns.length;
    } else {
      merges.push({ s: { r: 0, c: colIndex }, e: { r: 1, c: colIndex } });
      colIndex += 1;
    }
  }

  const flowLabel =
    flowOptions.value.find((f) => f.value === selectedFlow.value)?.label ?? "flusso";
  const safeFlow = String(flowLabel).replace(/[^0-9A-Za-z_-]+/g, "_");
  const filename = `ERROR_${safeFlow}_${selectedYear.value}_${pad2(selectedMonth.value ?? 0)}.xlsx`;
  exportToExcelAoA({ aoa, merges, filename, sheetName: "Dashboard Errori" });
}
</script>

