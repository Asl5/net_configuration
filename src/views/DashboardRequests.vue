<template>
  <div class="min-h-screen h-dvh w-full flex flex-col bg-white">
    <BaseHeader title="Richieste Dati Storici" />

    <div class="flex-1 min-h-0 overflow-auto">
      <div class="w-full px-4 sm:px-6 py-4 sm:py-6 space-y-4">
        <div
          class="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-end gap-3 sm:gap-4"
        >
          <BaseSelect
            v-model="selectedFlow"
            :options="flowOptions"
            :loading="flowLoading"
            label="Flusso"
            placeholder="Seleziona flusso…"
            wrapperClass="w-full sm:flex-1"
          />
          <BaseSelect
            v-if="selectedFlowRow?.elaborazione === 'M'"
            v-model="selectedMonth"
            :options="monthOptions"
            label="Mese"
            placeholder="Mese"
            wrapperClass="w-full sm:w-40"
          />

          <BaseSelect
            v-if="selectedFlowRow?.elaborazione === 'W'"
            v-model="selectedWeek"
            :options="weekOptions"
            label="Settimana"
            placeholder="Settimana"
            wrapperClass="w-full sm:w-40"
          />

          <BaseSelect
            v-model="selectedYear"
            :options="yearOptions"
            label="Anno"
            placeholder="Anno"
            wrapperClass="w-full sm:w-40"
          />

          <BaseButton
            class="w-full sm:w-auto"
            variant="primary"
            :disabled="!selectedFlow || !selectedMonth || !selectedYear || sending"
            @click="insertRequest"
          >
            Invia richiesta
          </BaseButton>
        </div>

        <!-- Avviso -->
        <div class="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-600">
          <span
            ><BaseIcon
              name="error"
              size="w-5 h-5"
              color="yellow-600"
              class="inline align-text-bottom mr-1" /></span
          ><span>
            Puoi richiedere dati più vecchi di 2 anni. Le richieste vengono elaborate entro circa
            <strong>1 ora</strong>.</span
          >
        </div>

        <!-- 🔹 Griglia richieste -->
        <BaseBusy :loading="loading" variant="blur" text="Caricamento…">
          <template v-if="requestsRows.length">
            <RequestsGrid
              :rows="requestsRows"
              :showPagination="true"
              :pageSize="5"
              @refresh="loadRequests"
            />
          </template>

          <BasePlaceholder
            v-else
            icon="inbox"
            title="Nessuna richiesta"
            subtitle="Invia una nuova richiesta per visualizzarla qui"
          />
        </BaseBusy>

        <p v-if="error" class="text-red-600">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import BaseHeader from "@/components/base/BaseHeader.vue";
import BaseSelect from "@/components/base/BaseSelect.vue";
import BaseButton from "@/components/base/BaseButton.vue";
import BaseBusy from "@/components/base/BaseBusy.vue";
import BaseIcon from "@/components/base/BaseIcon.vue";
import BasePlaceholder from "@/components/base/BasePlaceholder.vue";
import RequestsGrid from "@/components/custom/RequestsGrid.vue";
import { spiLoadFlows, spiLoadRequests, spiInsertRequest } from "@/services/api";
import { useRightsStore } from "@/stores/rights";
import { formatDateTimeIt, pad2 } from "@/utils/date";

/* Stato filtri */
const selectedFlow = ref<number | null>(null);
const selectedMonth = ref<number | null>(null);
const selectedWeek = ref<number | null>(null);
const selectedYear = ref<number | null>(null);

const flowOptions = ref<{ value: number; label: string; elaborazione: "M" | "W" }[]>([]);
const flowLoading = ref(false);

const selectedFlowRow = computed(
  () => flowOptions.value.find((f) => f.value === selectedFlow.value) || null
);

const requestsRows = ref<any[]>([]);

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
const weekOptions = Array.from({ length: 53 }, (_, i) => ({
  value: i + 1,
  label: `Settimana ${pad2(i + 1)}`,
}));
const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 10 }, (_, i) => {
  const y = currentYear - i;
  return { value: y, label: String(y) };
});

const loading = ref(false);
const sending = ref(false);
const error = ref<string | null>(null);

/* Carica i flussi (query 1) */
async function loadFlows(matricola: string) {
  flowLoading.value = true;
  try {
    const { data } = await spiLoadFlows(matricola);
    const flussi = Array.isArray(data?.rows) ? data.rows : [];
    flowOptions.value = flussi.map((r: any) => ({
      value: r.ID_FLUSSO,
      label: r.DESCRIZIONE_FLUSSO_LUN,
      elaborazione: r.ELABORAZIONE ?? "M",
    }));
  } catch (err) {
    console.error("Errore caricamento flussi:", err);
  } finally {
    flowLoading.value = false;
  }
}

/* 🔹 Carica richieste (query 23) */
async function loadRequests() {
  loading.value = true;
  try {
    const { data } = await spiLoadRequests();
    const rows = Array.isArray(data?.rows) ? data.rows : [];
    requestsRows.value = rows.map((r: any) => ({
      id: r.ID,
      id_flusso: `${r.DESCRIZIONE} - ${r.DESCRIZIONE_LUNGA}`,
      periodo: `${String(r.MESE_SETTIMANA).padStart(2, "0")}/${r.ANNO}`,
      stato: r.STATO,
      desc_stato: r.DESC_STATO,
      data_richiesta: formatDateTimeIt(r.DATA_RICHIESTA),
    }));
  } catch (err: any) {
    error.value = err.message || "Errore caricamento richieste";
  } finally {
    loading.value = false;
  }
}

// ...existing code...

/* Inserisci nuova richiesta */
async function insertRequest() {
  if (!selectedFlow.value || !selectedYear.value) return;

  // Usa mese o settimana in base al tipo di elaborazione
  const elab = selectedFlowRow.value?.elaborazione ?? "M";
  let periodo = "";

  if (elab === "M" && selectedMonth.value) {
    periodo = `${pad2(selectedMonth.value)}`;
  }
  if (elab === "W" && selectedWeek.value) {
    periodo = `${pad2(selectedWeek.value)}`;
  }

  sending.value = true;
  error.value = null;
  try {
    await spiInsertRequest(selectedFlow.value, periodo, selectedYear.value);

    await loadRequests();
  } catch (err: any) {
    error.value = err.message || "Errore inserimento richiesta";
  } finally {
    sending.value = false;
  }
}

// ...existing code...

/* Bootstrap */
onMounted(async () => {
  const rights = useRightsStore();
  rights.hydrateFromSession();
  if (rights.matricola) {
    await loadFlows(rights.matricola);
  }
  await loadRequests();
});
</script>
