<template>
  <div class="min-h-screen h-dvh w-full flex flex-col bg-white">
    <BaseHeader title="Sintesi Flusso" />

    <div class="flex-1 min-h-0 overflow-auto">
      <div class="w-full px-4 sm:px-6 py-4 sm:py-6 space-y-3">
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
            @update:modelValue="saveFilters"
          />
          <BaseButton
            class="w-full sm:w-auto"
            variant="primary"
            size="md"
            :disabled="!selectedFlow || loading"
            @click="apply"
          >
            Carica
          </BaseButton>

          <BaseButton
            class="w-full sm:w-auto"
            variant="info"
            size="md"
            @click="showStats = true"
          >
            Statistiche
          </BaseButton>
          <BaseButton class="w-full sm:w-auto" variant="secondary" size="md" @click="openRequests">
            Storico richieste
          </BaseButton>
          <BaseButton
            class="w-full sm:w-auto"
            variant="secondary"
            size="md"
            :disabled="rows.length === 0"
            @click="onExport"
          >
            Export griglia
          </BaseButton>
        </div>

        <div class="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-600">
          <span
            ><BaseIcon
              name="error"
              size="w-5 h-5"
              color="yellow-600"
              class="inline align-text-bottom mr-1" /></span
          ><span>
             La tabella mostra gli ultimi periodi disponibili (24 mesi) per il flusso selezionato.</span>
        </div>
        <BaseModal v-model="showRequests" title="Richieste Dati Storici">
          <!-- Con paginazione -->
          <RequestsGrid
            :rows="requestsRows"
            :showPagination="true"
            :pageSize="5"
            :showRefresh="true"
            @refresh="loadRequests"
          />

          <!-- Oppure senza -->
          <!-- <RequestsGrid :rows="requestsRows" :showPagination="false" /> -->

          <template #footer>
            <BaseButton variant="secondary" @click="showRequests = false"> Chiudi </BaseButton>
          </template>
        </BaseModal>

        <div class="">
          <BaseBusy :loading="loading" variant="blur" text="Caricamento">
            <template v-if="rows.length">
              <BaseGrid
                :columns="columns"
                :items="rows"
                :sticky-header="true"
                :scroll-x="true"
                y-max-height="70vh"
                header-bg-class="bg-gray-300"
                header-text-class="text-gray-800"
                row-text-class="text-gray-800"
                zebra-even-class="bg-gray-50"
                :page="currentPage"
                :pageSize="pageSize"
                showPagination
              >
                <template #cell-__row_export__="{ row }">
                  <BaseIconButton
                    icon="file-excel"
                    title="Esporta riga"
                    size="lg"
                    @click="() => onExportRow(row)"
                  />
                </template>
                <!-- Dettaglio errori -->
                <template v-slot:cell-dettagli="{ value }">
                  <div class="flex flex-col text-xs text-gray-700">
                    <template v-for="(rit, idx) in (value as RitVal[])" :key="rit.code">
                      <div class="py-1">
                        <span
                          class="cursor-help hover:underline"
                          @mouseenter="onEnter($event, rit)"
                          @mouseleave="onLeave"
                        >
                          {{ rit.code }}: <strong>{{ rit.value }}</strong>
                        </span>
                      </div>
                      <div
                        v-if="idx < (value as RitVal[]).length - 1"
                        class="border-t border-gray-200"
                      ></div>
                    </template>
                  </div>
                </template>
              </BaseGrid>

              <!-- Tooltip globale per i dettagli -->
              <BaseTooltip ref="tooltip" v-slot="{ data }">
                <div v-if="data">
                  <div class="font-semibold mb-1">
                    {{ data.descrizione || "Nessuna descrizione" }}
                  </div>
                  <div><span class="font-medium">Codice:</span> {{ data.code }}</div>
                  <div><span class="font-medium">Count:</span> {{ data.value }}</div>
                </div>
              </BaseTooltip>
            </template>

            <BasePlaceholder
              v-else
              icon="folder-open"
              title="Nessun dato"
              subtitle="Seleziona un flusso e clicca Carica"
            />
          </BaseBusy>
        </div>
        <p v-if="error" class="text-red-600">{{ error }}</p>
      </div>
    </div>
  </div>
  <BaseModal v-model="showStats" title="Statistiche flusso" height="60vh">
    <div class="space-y-4">
      <!-- KPI globali del flusso -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <BaseStatCard title="Invii totali" variant="blue">
          <div class="text-2xl font-semibold text-gray-900">
            {{ flowStats.inviiTotali.toLocaleString() }}
          </div>
        </BaseStatCard>
        <BaseStatCard title="Errori/Ritorni totali" variant="emerald">
          <div class="text-2xl font-semibold text-gray-900">
            {{ flowStats.erroriTotali.toLocaleString() }}
          </div>
        </BaseStatCard>
        <BaseStatCard title="Tasso errori" variant="violet">
          <div class="text-2xl font-semibold text-gray-900">
            {{ (flowStats.tassoErrori * 100).toFixed(1) }}%
          </div>
        </BaseStatCard>
      </div>
      <!-- Periodo migliore/peggiore (opzionale) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3" v-if="flowStats.best || flowStats.worst">
        <BaseStatCard title="Periodo migliore (tasso minore)" variant="emerald">
          <div class="text-sm text-gray-700" v-if="flowStats.best">
            {{ flowStats.best.periodo }} ” {{ (flowStats.best.tasso * 100).toFixed(1) }}%
          </div>
          <div v-else class="text-sm text-gray-500">N/D</div>
        </BaseStatCard>
        <BaseStatCard title="Periodo peggiore (tasso maggiore)" variant="rose">
          <div class="text-sm text-gray-700" v-if="flowStats.worst">
            {{ flowStats.worst.periodo }} ” {{ (flowStats.worst.tasso * 100).toFixed(1) }}%
          </div>
          <div v-else class="text-sm text-gray-500">N/D</div>
        </BaseStatCard>
      </div>
    </div>
    <template #footer>
      <BaseButton variant="secondary" @click="showStats = false">Chiudi</BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import BaseHeader from "@/components/base/BaseHeader.vue";
import BaseSelect from "@/components/base/BaseSelect.vue";
import BaseModal from "@/components/base/BaseModal.vue";
import BaseStatCard from "@/components/base/BaseStatCard.vue";
import BaseButton from "@/components/base/BaseButton.vue";
import BaseBusy from "@/components/base/BaseBusy.vue";
import BaseGrid from "@/components/base/BaseGrid.vue";
import BaseIcon from "@/components/base/BaseIcon.vue";
import BasePlaceholder from "@/components/base/BasePlaceholder.vue";
import BaseTooltip from "@/components/base/BaseTooltip.vue";
import { exportGridToExcel, type ExportColumn } from "@/utils/utils";
import BaseIconButton from "@/components/base/BaseIconButton.vue";
import RequestsGrid from "@/components/custom/RequestsGrid.vue";
import { useRightsStore } from "@/stores/rights";
import { formatDateTimeIt } from "@/utils/date";
import { apiLoadFlows, apiLoadFlowQueries, apiBatchCounts, spiLoadRequests } from "@/services/api";

const FILTERS_KEY = "dashboardFlowsFilters";

/* ===== Tipi ===== */
type FlowRow = {
  ID_FLUSSO: number;
  DESCRIZIONE_FLUSSO?: string;
  DESCRIZIONE_FLUSSO_LUN?: string;
  ELABORAZIONE: "M" | "W"; // Mensile/Settimanale
};
type QueryRef = { id: number; code: string; descrizione?: string };
type RitVal = { code: string; value: number; descrizione?: string };

type Period = {
  key: string; // es. "2025-03" o "2025-W05"
  year: number;
  idx: number; // mese 1..12 oppure settimana 1..53
  label: string; // "Mar 2025" / "Settimana 05 2025"
  end: Date; // fine periodo (ultimo giorno mese o domenica della settimana)
  paramLike: string; // stringa per la query: "03%2025" / "05%2025"
};

type TooltipExpose = {
  show: (e: MouseEvent, payload: RitVal) => void;
  hide: () => void;
  data: RitVal | null;
};

/* ===== Stato ===== */
const rightsStore = useRightsStore();

const flowOptions = ref<{ value: number; label: string }[]>([]);
const allFlows = ref<FlowRow[]>([]);
const selectedFlow = ref<number | null>(null);
const flowLoading = ref(false);
const showStats = ref(false);
const loading = ref(false);
const error = ref<string | null>(null);

/* mapping inv/rit per flusso (da query 13) */
const flowQueries = ref<Record<number, { inv: QueryRef[]; rit: QueryRef[] }>>({});

const currentPage = ref(1);
const pageSize = ref(2); // default 10
const showRequests = ref(false);
const requestsRows = ref<any[]>([]);

async function openRequests() {
  await loadRequests(); // ðŸ”¹ ricarica sempre la lista
  showRequests.value = true;
}

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

/* griglia */
const columns = ref<any[]>([  { key: "periodo", label: "Periodo", align: "left" },  { key: "invii", label: "N invii", align: "right" },  { key: "errori", label: "N errori", align: "right" },  { key: "dettagli", label: "Dettaglio errori", align: "left", cellClass: "whitespace-normal" },  { key: "visibile_fino", label: "Visualizzabile fino", align: "left" },  { key: "__row_export__", label: "EXPORT", align: "center", headerClass: "text-center" },]);
const rows = ref<any[]>([]);

/* tooltip globale */
const tooltip = ref<TooltipExpose | null>(null);
function onEnter(e: MouseEvent, rit: RitVal) {
  tooltip.value?.show(e, rit);
}
function onLeave() {
  tooltip.value?.hide();
}

const flowStats = computed(() => {
  // Somme invii/errori e tassi per periodo, direttamente dalle righe della griglia
  let invTot = 0;
  let errTot = 0;

  type PerTasso = { periodo: string; tasso: number };
  const perTasso: PerTasso[] = [];

  for (const r of rows.value as any[]) {
    const inv = Number(r.invii || 0);
    const err = Number(r.errori || 0);
    invTot += Number.isFinite(inv) ? inv : 0;
    errTot += Number.isFinite(err) ? err : 0;

    const tasso = inv > 0 ? err / inv : 0;
    perTasso.push({ periodo: String(r.periodo), tasso });
  }

  const tassoGlobal = invTot > 0 ? errTot / invTot : 0;

  let best: PerTasso | null = null;
  let worst: PerTasso | null = null;
  if (perTasso.length) {
    best = perTasso.reduce((min, x) => (x.tasso < min.tasso ? x : min), perTasso[0]);
    worst = perTasso.reduce((max, x) => (x.tasso > max.tasso ? x : max), perTasso[0]);
  }

  return {
    inviiTotali: invTot,
    erroriTotali: errTot,
    tassoErrori: tassoGlobal,
    best,
    worst,
  };
});

/* ===== Helpers date ===== */
const itMonths = [
  "Gen",
  "Feb",
  "Mar",
  "Apr",
  "Mag",
  "Giu",
  "Lug",
  "Ago",
  "Set",
  "Ott",
  "Nov",
  "Dic",
];

function saveFilters() {
  localStorage.setItem(
    FILTERS_KEY,
    JSON.stringify({
      flow: selectedFlow.value,
    })
  );
}

function endOfMonth(year: number, month1to12: number) {
  return new Date(year, month1to12, 0); // ultimo giorno del mese
}
function isoWeekStart(year: number, week: number) {
  // LunedÃ¬ della settimana ISO
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay() || 7; // 1..7 (lun..dom)
  if (dow > 1) simple.setDate(simple.getDate() - (dow - 1));
  return simple;
}
function isoWeekEnd(year: number, week: number) {
  const start = isoWeekStart(year, week);
  const end = new Date(start);
  end.setDate(start.getDate() + 6); // domenica
  return end;
}
function addYears(d: Date, years: number) {
  const x = new Date(d);
  x.setFullYear(x.getFullYear() + years);
  return x;
}
function fmt(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/* periodi: ultimi 24 mesi oppure 52 settimane */
function buildPeriods(elab: "M" | "W"): Period[] {
  const out: Period[] = [];
  const now = new Date();

  if (elab === "M") {
    // ultimi 24 mesi
    for (let i = 0; i < 24; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1; // 1..12
      out.push({
        key: `${year}-${String(month).padStart(2, "0")}`,
        year,
        idx: month,
        label: `${itMonths[month - 1]} ${year}`,
        end: endOfMonth(year, month),
        paramLike: `${String(month).padStart(2, "0")}%${year}`,
      });
    }
  } else {
    // ultime 52 settimane ISO
    now.getFullYear();
    for (let w = 0; w < 52; w++) {
      const weekDate = new Date(now);
      weekDate.setDate(now.getDate() - w * 7);
      // stima ISO week (semplice): prendo la settimana del weekDate
      // per stabilizzare, calcolo la settimana target come floor((dayOfYear-1)/7)+1
      const startOfYear = new Date(weekDate.getFullYear(), 0, 1);
      const diff = Math.floor((+weekDate - +startOfYear) / (24 * 60 * 60 * 1000));
      const week = Math.max(1, Math.min(53, Math.floor(diff / 7) + 1));
      const year = weekDate.getFullYear();

      const end = isoWeekEnd(year, week);

      out.push({
        key: `${year}-W${String(week).padStart(2, "0")}`,
        year,
        idx: week,
        label: `Settimana ${String(week).padStart(2, "0")} ${year}`,
        end,
        paramLike: `${String(week).padStart(2, "0")}%${year}`,
      });
    }
  }

  return out;
}

/* ===== Caricamenti ===== */
async function loadFlows(matricola: string) {
  flowLoading.value = true;
  try {
    const { data } = await apiLoadFlows(matricola);
    const rows = Array.isArray(data?.rows) ? data.rows : [];
    // mappo i flussi unici
    const byId = new Map<number, FlowRow>();
    for (const r of rows) {
      const id = r.ID_FLUSSO;
      if (!byId.has(id)) {
        byId.set(id, {
          ID_FLUSSO: id,
          DESCRIZIONE_FLUSSO: r.DESCRIZIONE_FLUSSO,
          DESCRIZIONE_FLUSSO_LUN: r.DESCRIZIONE_FLUSSO_LUN,
          ELABORAZIONE: r.ELABORAZIONE ?? "M",
        });
      }
    }
    allFlows.value = Array.from(byId.values());
    flowOptions.value = allFlows.value.map((f) => ({
      value: f.ID_FLUSSO,
      label: `${f.DESCRIZIONE_FLUSSO ?? ""} - ${f.DESCRIZIONE_FLUSSO_LUN ?? ""}`.replace(
        /^ - /,
        ""
      ),
    }));
  } finally {
    flowLoading.value = false;
  }
}

/** Query 13: popola flowQueries con {inv[], rit[]} */
async function loadFlowQueries() {
  try {
    const { data } = await apiLoadFlowQueries();
    const rows = Array.isArray(data?.rows) ? data.rows : [];
    const tmp: Record<number, { inv: QueryRef[]; rit: QueryRef[] }> = {};

    for (const r of rows) {
      const flowId: number = r.ID_FLUSSO;
      const qInv: number | null = r.QUERY_INV ?? null;
      const qRit: number | null = r.QUERY_RIT ?? null;

      const codeInv =
        r.CODICE_INV ?? r.CODICE_QUERY_INV ?? r.CODICE ?? (qInv != null ? String(qInv) : null);
      const codeRit =
        r.CODICE_RIT ?? r.CODICE_QUERY_RIT ?? r.CODICE ?? (qRit != null ? String(qRit) : null);

      const descInv = r.DESCRIZIONE ?? "";
      const descRit = r.DESCRIZIONE ?? "";

      if (!tmp[flowId]) tmp[flowId] = { inv: [], rit: [] };
      if (qInv && codeInv && !tmp[flowId].inv.some((x) => x.id === qInv)) {
        tmp[flowId].inv.push({ id: qInv, code: String(codeInv), descrizione: descInv });
      }
      if (qRit && codeRit && !tmp[flowId].rit.some((x) => x.id === qRit)) {
        tmp[flowId].rit.push({ id: qRit, code: String(codeRit), descrizione: descRit });
      }
    }

    flowQueries.value = tmp;
  } catch (err) {
    console.error("Errore caricamento query 13:", err);
    flowQueries.value = {};
  }
}

/* ===== Query helpers ===== */
async function fetchCountsForQueryId(
  queryId: number,
  periods: Period[]
): Promise<Record<string, number>> {
  if (!queryId || periods.length === 0) return {};
  // batch: per ogni periodo passiamo paramLike "MM%YYYY" oppure "WW%YYYY"
  // const batch = periods.map((p) => ({
  //   params: [
  //     { index: 1, value: p.paramLike },
  //     { index: 2, value: p.paramLike },
  //   ],
  // }));
  try {
    const { data } = await apiBatchCounts(queryId, periods.map((p) => p.paramLike));
    const batchRows = Array.isArray(data?.batchRows) ? data.batchRows : [];
    const out: Record<string, number> = {};
    periods.forEach((p, i) => {
      let count = 0;
      const row0 = batchRows[i]?.[0];
      if (row0 && typeof row0 === "object") {
        const v = Object.values(row0)[0];
        const n = Number(v);
        if (!Number.isNaN(n)) count = n;
      }
      out[p.key] = count;
    });
    return out;
  } catch {
    const zero: Record<string, number> = {};
    periods.forEach((p) => (zero[p.key] = 0));
    return zero;
  }
}

async function fetchCountsSum(queryIds: number[], periods: Period[]) {
  const out: Record<string, number> = {};
  periods.forEach((p) => (out[p.key] = 0));
  for (const q of queryIds) {
    const part = await fetchCountsForQueryId(q, periods);
    periods.forEach((p) => (out[p.key] += part[p.key] ?? 0));
  }
  return out;
}

/* ===== Applica ===== */
const selectedFlowRow = computed(
  () => allFlows.value.find((f) => f.ID_FLUSSO === selectedFlow.value) || null
);

async function apply() {
  if (!selectedFlow.value) return;
  const fl = selectedFlowRow.value;
  if (!fl) return;

  loading.value = true;
  error.value = null;
  rows.value = [];

  try {
    // periodi
    const periods = buildPeriods(fl.ELABORAZIONE);

    // mapping query per flusso
    const fq = flowQueries.value[selectedFlow.value] || { inv: [], rit: [] };

    // invii: somma di tutte le query inv del flusso
    const inviiMap = fq.inv.length
      ? await fetchCountsSum(
          fq.inv.map((x) => x.id),
          periods
        )
      : {};
    // errori per singola query rit
    const ritPerQuery: Record<number, Record<string, number>> = {};
    for (const r of fq.rit) {
      ritPerQuery[r.id] = await fetchCountsForQueryId(r.id, periods);
    }

    // costruiamo righe
    rows.value = periods.map((p) => {
      const inv = inviiMap[p.key] ?? 0;

      // dettagli errori (ordinati per value desc)
      const dettagli: RitVal[] = fq.rit
        .map((r) => ({
          code: r.code,
          descrizione: r.descrizione,
          value: ritPerQuery[r.id]?.[p.key] ?? 0,
        }))
        .sort((a, b) => b.value - a.value);

      const errSum = dettagli.reduce((s, d) => s + (d.value || 0), 0);

      const visibileFino = addYears(p.end, 2);

      return {
        periodo: p.label,
        invii: inv,
        errori: errSum,
        dettagli,
        visibile_fino: fmt(visibileFino),
      };
    });
  } catch (e: any) {
    error.value = e?.message ?? "Errore durante il calcolo";
  } finally {
    loading.value = false;
  }
  watch(selectedFlow, saveFilters);
}

/* ===== Bootstrap ===== */
onMounted(async () => {
  rightsStore.hydrateFromSession();

  // Stato  iniziale (placeholder)
  rows.value = [];
  error.value = null;

  if (rightsStore.matricola) {
    await loadFlows(rightsStore.matricola);
    await loadFlowQueries();

    // Restore filtri
    const raw = localStorage.getItem(FILTERS_KEY);
    if (raw) {
      try {
        const obj = JSON.parse(raw);
        if (obj.flow) selectedFlow.value = obj.flow;
      } catch {}
    }

    // Autocarica se c'Ã¨ giÃ  un flusso selezionato
    if (selectedFlow.value) {
      setTimeout(() => apply(), 0);
    }
  }
});
function safeFilePart(v: string){ return String(v||"").replace(/[^0-9A-Za-z_\-]+/g, "_"); }

/* ===================== Export ===================== */
async function onExport() {
  try {
    const cols: ExportColumn[] = [
      { key: "periodo", label: "Periodo" },
      { key: "invii", label: "N invii" },
      { key: "errori", label: "N errori" },
      { key: "dettagli", label: "Dettaglio errori", formatter: (val: any) => {
        const arr = Array.isArray(val) ? val : [];
        return arr.map((x: any) => `${x.code}: ${x.value}`).join("; ");
      } },
      { key: "visibile_fino", label: "Visualizzabile fino" },
    ];
    const flow = selectedFlowRow.value;
    const flowName = (flow?.DESCRIZIONE_FLUSSO || flow?.DESCRIZIONE_FLUSSO_LUN || "flusso");
    const tipo = flow?.ELABORAZIONE === "W" ? "settimanale" : "mensile";
    const filename = `${safeFilePart(flowName)}_${tipo}.xlsx`;
    exportGridToExcel({ columns: cols, items: rows.value as any[], filename, sheetName: "Sintesi Flusso" });
  } catch (e) {
    console.error("Export fallito", e);
  }
}
async function onExportRow(row: any) {
  try {
    const cols: ExportColumn[] = [
      { key: "periodo", label: "Periodo" },
      { key: "invii", label: "N invii" },
      { key: "errori", label: "N errori" },
      { key: "dettagli", label: "Dettaglio errori", formatter: (val: any) => {
        const arr = Array.isArray(val) ? val : [];
        return arr.map((x: any) => `${x.code}: ${x.value}`).join("; ");
      } },
      { key: "visibile_fino", label: "Visualizzabile fino" },
    ];
    const flow = selectedFlowRow.value;
    const flowName = (flow?.DESCRIZIONE_FLUSSO || flow?.DESCRIZIONE_FLUSSO_LUN || "flusso");
    const safePeriodo = safeFilePart(row.periodo);
    const filename = `${safeFilePart(flowName)}_${safePeriodo}.xlsx`;
    exportGridToExcel({ columns: cols, items: [row], filename, sheetName: "Riga" });
  } catch (e) {
    console.error("Export riga fallito", e);
  }
}</script>









