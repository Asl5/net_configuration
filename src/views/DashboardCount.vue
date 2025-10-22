<template>
  <div class="min-h-screen h-dvh w-full flex flex-col bg-gray-50">
    <BaseHeader title="Dashboard Invii" />

    <div class="flex-1 min-h-0 overflow-auto">
      <div class="w-full px-4 sm:px-6 py-4 sm:py-6 space-y-3">
        <div
          class="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-end gap-3 sm:gap-4"
        >
          <BaseSelect
            v-model="selectedRangeType"
            :options="rangeOptions"
            label="Tipo intervallo"
            placeholder="Seleziona intervallo"
            wrapperClass="w-full sm:w-56"
          />
          <BaseMultiSelect
            v-model="selectedMonths"
            :options="monthOptions"
            label="Mesi"
            placeholder="Mesi"
            wrapperClass="w-full sm:flex-1"
          />

          <BaseMultiSelect
            v-model="selectedFlows"
            :options="flowOptions"
            label="Flussi"
            placeholder="Flussi"
            wrapperClass="w-full sm:flex-1"
          />

          <BaseSelect
            v-model="selectedYear"
            :options="yearOptions"
            label="Anno"
            placeholder="Anno"
            wrapperClass="w-full sm:w-40"
          />

          <BaseButton class="w-full sm:w-auto" variant="primary" @click="onCarica">
            Carica
          </BaseButton>
          <BaseButton class="w-full sm:w-auto" variant="info" @click="showStats = true">
            Statistiche
          </BaseButton>
          <BaseButton
            class="w-full sm:w-auto"
            variant="secondary"
            :disabled="pivotRows.length === 0"
            @click="onExport"
          >
            Export griglia
          </BaseButton>
        </div>
        <p v-if="filtersError" class="text-red-600 text-sm">{{ filtersError }}</p>

           <div class="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-600">
          <span
            ><BaseIcon
              name="error"
              size="w-5 h-5"
              color="yellow-600"
              class="inline align-text-bottom mr-1" /></span
          ><span>
              I dati visualizzati fanno riferimento allultimo invio effettuato e possono essere
            filtrati per un massimo di <strong>2 anni</strong>.</span>
          </div>
           <div class="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-600">
          <span
            ><BaseIcon
              name="error"
              size="w-5 h-5"
              color="yellow-600"
              class="inline align-text-bottom mr-1" /></span
          ><span>
             Per ragioni di prestazioni possibile filtrare i dati per un massimo
            <strong>3 mesi</strong> alla volta.</span>
          </div>
             <div class="">
          <BaseBusy :loading="pivotLoading" variant="blur" text="Caricamento">
            <template v-if="pivotRows.length > 0">
              <BaseGrid
                :columns="pivotColumns"
                :items="pivotRows"
                :sticky-header="true"
                :scroll-x="true"
                y-max-height="60vh"
                header-bg-class="bg-gray-300"
                header-text-class="text-gray-800"
                row-text-class="text-gray-800"
                zebra-even-class="bg-gray-50"
                :page="1"
                :pageSize="20"
                showPagination
              >
                <template
                  v-for="col of dettaglioColumns"
                  :key="col.key"
                  v-slot:[`cell-${col.key}`]="{ value }"
                >
                  <div class="flex flex-col text-xs text-gray-700 space-y-1">
                    <div
                      v-for="(rit) in (value as RitVal[])"
                      :key="rit.code"
                      class="flex items-center mb-1"
                    >
                      <span
                        class="cursor-help hover:underline"
                        @mouseenter="onEnter($event, rit)"
                        @mouseleave="onLeave"
                      >
                        {{ rit.code }}: <strong>{{ rit.value }}</strong>
                      </span>
                    </div>
                  </div>
                </template>
                <template #cell-__row_export__="{ row }">
                  <BaseIconButton
                    icon="file-excel"
                    title="Esporta riga"
                    size="lg"
                    @click="() => onExportRow(row)"
                  />
                </template>
              </BaseGrid>
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
            <template v-else>
              <BasePlaceholder
                icon="folder-open"
                title="Nessun dato"
                subtitle="Seleziona i filtri e clicca Carica"
              />
            </template>
          </BaseBusy>
        </div>
        <p v-if="pivotError" class="text-red-600">{{ pivotError }}</p>
      </div>
    </div>
  </div>
  <BaseModal v-model="showStats" title="Statistiche" height="60vh">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      <BaseStatCard v-for="k in perFlowKpi" :key="k.flowName" :title="k.flowName">
        <!-- Body libero: metti tu i tre valori -->
        <div class="grid grid-cols-3 gap-3">
          <div>
            <div class="text-[11px] text-gray-500">Invii</div>
            <div class="text-lg font-semibold text-gray-900">
              {{ k.inviiTotali.toLocaleString() }}
            </div>
          </div>
          <div>
            <div class="text-[11px] text-gray-500">Ritorni</div>
            <div class="text-lg font-semibold text-gray-900">
              {{ k.ritorniTotali.toLocaleString() }}
            </div>
          </div>
          <div>
            <div class="text-[11px] text-gray-500">% Ritorni</div>
            <div class="text-lg font-semibold text-gray-900">
              {{ (k.tassoRitorni * 100).toFixed(1) }}%
            </div>
          </div>
        </div>
      </BaseStatCard>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3">
      <BaseStatCard title="Invii totali" variant="blue">
        <div class="text-2xl font-semibold text-gray-900">
          {{ kpi.inviiTotali.toLocaleString() }}
        </div>
      </BaseStatCard>
      <BaseStatCard title="Ritorni totali" variant="emerald">
        <div class="text-2xl font-semibold text-gray-900">
          {{ kpi.ritorniTotali.toLocaleString() }}
        </div>
      </BaseStatCard>
      <BaseStatCard title="Tasso ritorni" variant="violet">
        <div class="text-2xl font-semibold text-gray-900">
          {{ (kpi.tassoRitorni * 100).toFixed(1) }}%
        </div>
      </BaseStatCard>
    </div>
    <template #footer>
      <BaseButton variant="secondary" @click="showStats = false">Chiudi</BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import BaseHeader from "@/components/base/BaseHeader.vue";
import BaseGrid from "@/components/base/BaseGrid.vue";
import BaseSelect from "@/components/base/BaseSelect.vue";
import BaseBusy from "@/components/base/BaseBusy.vue";
import BasePlaceholder from "@/components/base/BasePlaceholder.vue";
import BaseButton from "@/components/base/BaseButton.vue";
import BaseStatCard from "@/components/base/BaseStatCard.vue";
import BaseTooltip from "@/components/base/BaseTooltip.vue";
import BaseMultiSelect from "@/components/base/BaseMultiSelect.vue";
import BaseIcon from "@/components/base/BaseIcon.vue";
import BaseIconButton from "@/components/base/BaseIconButton.vue";
import { exportGridToExcel, exportToExcelAoA, type ExportColumn } from "@/utils/utils";
import { apiLoadFlowsSimple, apiLoadFlowQueriesSimple, apiBatchCounts } from "@/services/api";
import { useRightsStore } from "@/stores/rights";
import { pad2 } from "@/utils/date";
import BaseModal from "@/components/base/BaseModal.vue";

const showStats = ref(false);
/* ===================== Tipi ===================== */
type FlowRow = {
  ID_FLUSSO: number;
  NOME_FLUSSO: string;
  ELABORAZIONE: "M" | "W";
};
type Period = { code: string; label: string };
type QueryRef = { id: number; code: string; descrizione?: string };
type RitVal = { code: string; value: number; descrizione?: string };

/* ===================== Stato filtri ===================== */
const selectedRangeType = ref<"M" | "W">("M");
const selectedMonths = ref<number[]>([]);
const selectedWeeks = ref<number[]>([]);
const selectedFlows = ref<number[]>([]);
const selectedYear = ref<number>(new Date().getFullYear());
type TooltipExpose = {
  show: (e: MouseEvent, payload: RitVal) => void;
  hide: () => void;
  data: RitVal | null;
};
const filtersError = ref<string | null>(null);
const tooltip = ref<TooltipExpose | null>(null);

function onEnter(e: MouseEvent, rit: RitVal) {
  tooltip.value?.show(e, rit);
}
function onLeave() {
  tooltip.value?.hide();
}

/* Opzioni base */
const rangeOptions = [
  { value: "M", label: "Mensile" },
  { value: "W", label: "Settimanale" },
];
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
const weekOptions = Array.from({ length: 52 }, (_, i) => ({
  value: i + 1,
  label: `Settimana ${i + 1}`,
}));
const yearOptions = Array.from({ length: 6 }, (_, i) => {
  const y = new Date().getFullYear() - 2 + i;
  return { value: y, label: String(y) };
});

/* ===================== BaseGrid data ===================== */
const pivotColumns = ref<any[]>([]);
const kpi = ref({ ready: false, inviiTotali: 0, ritorniTotali: 0, tassoRitorni: 0, varPerc: 0 });
type PivotRow = Record<string, string | number | RitVal[]>;

const pivotRows = ref<PivotRow[]>([]);
const pivotLoading = ref(false);
const pivotError = ref<string | null>(null);

/* ===================== Flussi & mapping query ===================== */
const flows = ref<FlowRow[]>([]);
const flowOptions = computed(() =>
  flows.value.map((f) => ({ value: f.ID_FLUSSO, label: f.NOME_FLUSSO }))
);
/** ID_FLUSSO -> liste query inv/rit (con codice) da query 13 */
const flowQueries = ref<Record<number, { inv: QueryRef[]; rit: QueryRef[] }>>({});

/* ===================== Helpers ===================== */
const FILTERS_KEY = "pivotFilters";
function randomColor() {
  const palette = [
    "bg-blue-100 text-blue-800",
    "bg-green-100 text-green-800",
    "bg-yellow-100 text-yellow-800",
    "bg-pink-100 text-pink-800",
    "bg-purple-100 text-purple-800",
  ];
  return palette[Math.floor(Math.random() * palette.length)];
}

function onCarica() {
  filtersError.value = null;

  // Valida: massimo 3 mesi quando filtro mensile (rangeType = 'M')
  if (selectedRangeType.value === "M" && selectedMonths.value.length > 3) {
    filtersError.value = "Seleziona al massimo 3 mesi alla volta.";
    return;
  }

  // Se nessun mese selezionato, lasciamo passare (interpreti come tutti i )
  // Se vuoi obbligare almeno un mese, scommenta:
  // if (selectedRangeType.value === "M" && selectedMonths.value.length === 0) {
  // filtersError.value = "Seleziona almeno 1 mese.";
  // return;
  // }

  applyFilters();
}

const dettaglioColumns = computed<{ key: string }[]>(() => {
  const out: Array<{ key: string }> = [];
  for (const c of pivotColumns.value) {
    if (c?.subColumns?.length) {
      for (const s of c.subColumns) {
        if (String(s.key).endsWith("-dettagli")) out.push({ key: s.key });
      }
    }
  }
  return out;
});

/* Periodi */
const toMonthCode = (n: number) => String(n).padStart(2, "0"); // "MM"
const toWeekCode = (n: number) => String(n).padStart(2, "0"); // "WW"
function makePeriodList(): Period[] {
  if (selectedRangeType.value === "M") {
    const chosen = selectedMonths.value.length
      ? monthOptions.filter((m) => selectedMonths.value.includes(m.value))
      : monthOptions;
    return chosen.map((m) => ({ code: toMonthCode(m.value), label: m.label }));
  } else {
    const chosen = selectedWeeks.value.length
      ? weekOptions.filter((w) => selectedWeeks.value.includes(w.value))
      : weekOptions;
    return chosen.map((w) => ({ code: toWeekCode(w.value), label: w.label }));
  }
}

const perFlowKpi = computed(() => {
  // periodKeys = lista codici periodo dalle colonne pivot (solo quelle con subColumns)
  const periodKeys: string[] = pivotColumns.value
    .filter((c: any) => c?.subColumns?.length)
    .map((c: any) => String(c.key));

  const half = Math.floor(periodKeys.length / 2);

  return pivotRows.value.map((row: any) => {
    const flowName = row?.flusso?.name ?? "Flusso";

    // Somme per invii e ritorni su tutti i periodi
    const inviiTotali = periodKeys.reduce(
      (sum, code) => sum + Number(row[`${code}-invii`] ?? 0),
      0
    );
    const ritorniTotali = periodKeys.reduce(
      (sum, code) => sum + Number(row[`${code}-ritorni`] ?? 0),
      0
    );
    const tassoRitorni = inviiTotali > 0 ? ritorniTotali / inviiTotali : 0;

    // Var% invii: seconda met  vs prima met  dei periodi
    let varPerc = 0;
    if (half > 0) {
      const first = periodKeys.slice(0, half);
      const second = periodKeys.slice(half);
      const invFirst = first.reduce((s, code) => s + Number(row[`${code}-invii`] ?? 0), 0);
      const invSecond = second.reduce((s, code) => s + Number(row[`${code}-invii`] ?? 0), 0);
      if (invFirst > 0) varPerc = (invSecond - invFirst) / invFirst;
      else if (invSecond > 0) varPerc = 1;
      else varPerc = 0;
    }

    return { flowName, inviiTotali, ritorniTotali, tassoRitorni, varPerc };
  });
});

function computeKpi() {
  let invTot = 0;
  let ritTot = 0;

  for (const r of pivotRows.value as any[]) {
    for (const [k, v] of Object.entries(r)) {
      if (typeof v !== "number") continue;
      if (k.endsWith("-invii")) invTot += Number.isFinite(v) ? v : 0;
      if (k.endsWith("-ritorni")) ritTot += Number.isFinite(v) ? v : 0;
    }
  }

  invTot = Number.isFinite(invTot) ? invTot : 0;
  ritTot = Number.isFinite(ritTot) ? ritTot : 0;

  const rate = invTot > 0 ? ritTot / invTot : 0;

  kpi.value = {
    ready: true,
    inviiTotali: invTot,
    ritorniTotali: ritTot,
    tassoRitorni: rate,
    varPerc: 0, // non usato pi¹
  };
}

/* ===================== Loaders ===================== */
async function loadFlows(matricola: string) {
  try {
    const { data } = await apiLoadFlowsSimple(matricola);
    const rows = Array.isArray(data?.rows) ? data.rows : [];
    const map = new Map<number, FlowRow>();
    for (const r of rows) {
      const id = r.ID_FLUSSO;
      if (!map.has(id)) {
        map.set(id, {
          ID_FLUSSO: id,
          NOME_FLUSSO: r.DESCRIZIONE_FLUSSO_LUN,
          ELABORAZIONE: r.ELABORAZIONE ?? "M",
        });
      }
    }
    flows.value = Array.from(map.values());
  } catch (err) {
    console.error("Errore caricamento flussi:", err);
  }
}

/** Query 13: tutte le query inv/rit con relativo codice */
async function loadFlowQueries() {
  try {
    const { data } = await apiLoadFlowQueriesSimple();

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
    console.error("Errore caricamento query (13):", err);
    flowQueries.value = {};
  }
}

/* ===================== Query helpers ===================== */
/** Batch select per un singolo queryId su tutti i periodi; ritorna mappa periodo->count */
async function fetchCountsForQueryId(
  queryId: number,
  periods: Period[]
): Promise<Record<string, number>> {

  if (!periods.length || !queryId) return {};


  try {
    const { data } = await apiBatchCounts(queryId, periods.map((p) => `${pad2(p.code)}%${selectedYear.value}`));

    const batchRows = Array.isArray(data?.batchRows) ? data.batchRows : [];
    const out: Record<string, number> = {};

    periods.forEach((p, idx) => {
      let count = 0;
      const row0 = batchRows[idx]?.[0];
      if (row0 && typeof row0 === "object") {
        const firstVal = Object.values(row0)[0];
        const n = Number(firstVal);
        if (!Number.isNaN(n)) count = n;
      }
      out[p.code] = count;
    });

    return out;
  } catch (err) {
    console.error(`Errore batch (queryId=${queryId}):`, err);
    const zeroed: Record<string, number> = {};
    periods.forEach((p) => (zeroed[p.code] = 0));
    return zeroed;
  }
}

/** Somma i risultati di pi¹ queryId per periodo */
async function fetchCountsForQueryIdsSum(
  queryIds: number[],
  periods: Period[]
): Promise<Record<string, number>> {
  const totals: Record<string, number> = {};
  for (const p of periods) totals[p.code] = 0;

  for (const q of queryIds) {

    const partial = await fetchCountsForQueryId(q, periods);
    for (const p of periods) {
      totals[p.code] += partial[p.code] ?? 0;
    }
  }
  return totals;
}

/* ===================== Colonne con subheader ===================== */
function buildColumns(periods: Period[]) {
  pivotColumns.value = [
    {
      key: "flusso",
      label: "Flusso",
      align: "left",
      formatter: (val: any) =>
        val
          ? `<span class="inline-block px-2 py-1 rounded-md text-xs font-medium ${val.color}">${val.name}</span>`
          : "",
    },

    ...periods.map((p) => ({
      key: p.code,
      label: p.label,
      align: "center",
      subColumns: [
        { key: `${p.code}-invii`, label: "Invii", align: "center" },
        { key: `${p.code}-ritorni`, label: "Ritorni", align: "center" },
        {
          key: `${p.code}-dettagli`,
          label: "CODICE",
          align: "center",
          // niente formatter: lo slot ricever  direttamente l'array RitVal[]
          cellClass: "whitespace-normal",
        },
      ],
    })),
    {
      key: "__row_export__",
      label: "EXPORT",
      align: "center",
      width: 80,
    },
  ];
}

/* ===================== Apply ===================== */
async function applyFilters() {
  kpi.value.ready = false;
  saveFilters();
  pivotLoading.value = true;
  pivotError.value = null;

  try {
    const periods = makePeriodList();
    buildColumns(periods);

    const selectedFlowRows = flows.value.filter(
      (f) => selectedFlows.value.length === 0 || selectedFlows.value.includes(f.ID_FLUSSO)
    );

    const inviiForFlow: Record<number, Record<string, number>> = {};
    const ritorniForFlow: Record<number, Record<string, RitVal[]>> = {};

    await Promise.all(
      selectedFlowRows.map(async (f) => {
        if (f.ELABORAZIONE !== selectedRangeType.value) {
          inviiForFlow[f.ID_FLUSSO] = {};
          ritorniForFlow[f.ID_FLUSSO] = {};
          return;
        }

        const q = flowQueries.value[f.ID_FLUSSO] || { inv: [], rit: [] };

        // Invii = somma per periodo
        inviiForFlow[f.ID_FLUSSO] =
          q.inv.length > 0
            ? await fetchCountsForQueryIdsSum(
                q.inv.map((x) => x.id),
                periods
              )
            : {};

        // Ritorni = elenco {code,value} per periodo
        const ritMap: Record<string, RitVal[]> = {};
        for (const p of periods) ritMap[p.code] = [];

        const partials = await Promise.all(
          q.rit.map(({ id }) => fetchCountsForQueryId(id, periods))
        );
        for (const p of periods) {
          ritMap[p.code] = q.rit.map((ritObj, idx) => ({
            code: ritObj.code,
            descrizione: ritObj.descrizione,
            value: partials[idx][p.code] ?? 0,
          }));
        }
        ritorniForFlow[f.ID_FLUSSO] = ritMap;
      })
    );

    // Righe
    pivotRows.value = selectedFlowRows.map((f) => {
      const row: any = { flusso: { name: f.NOME_FLUSSO, color: randomColor() } };

      for (const p of periods) {
        if (f.ELABORAZIONE !== selectedRangeType.value) {
          row[`${p.code}-invii`] = "-";
          row[`${p.code}-ritorni`] = "-";
          row[`${p.code}-dettagli`] = [];
          continue;
        }

        // Invii (numero)
        row[`${p.code}-invii`] = inviiForFlow[f.ID_FLUSSO]?.[p.code] ?? 0;

        // Ritorni (somma della lista)
        const ritPairs = [...(ritorniForFlow[f.ID_FLUSSO]?.[p.code] ?? [])].sort(
          (a, b) => b.value - a.value
        );
        row[`${p.code}-ritorni`] = ritPairs.reduce((sum, r) => sum + r.value, 0);
        // CODICE = HTML con "CODICE_X: valore"
        row[`${p.code}-dettagli`] = row[`${p.code}-dettagli`] = ritPairs;
      }

      return row;
    });
    computeKpi();
  } catch (err: any) {
    pivotError.value = err.message ?? "Errore durante l'elaborazione pivot";
  } finally {
    pivotLoading.value = false;
  }
}

/* ===================== Export ===================== */
function onExportRow(row: any) {
  try {
    const cols: ExportColumn[] = [];
    for (const c of pivotColumns.value as any[]) {
      if (String(c.key) === "__row_export__") continue;
      if (c.subColumns && Array.isArray(c.subColumns) && c.subColumns.length) {
        for (const sc of c.subColumns) {
          const key = String(sc.key);
          const label = String(sc.label ?? sc.key);
          const formatter = key.endsWith("-dettagli")
            ? (val: any) => {
                const arr = Array.isArray(val) ? val : [];
                return arr.map((r: any) => `${r.code}: ${r.value}`).join("; ");
              }
            : undefined;
          cols.push({ key, label, formatter } as ExportColumn);
        }
      } else {
        const key = String(c.key);
        const label = String(c.label ?? c.key);
        const formatter =
          key === "flusso"
            ? (val: any) =>
                val && typeof val === "object" && "name" in val
                  ? (val as any).name
                  : String(val ?? "")
            : undefined;
        cols.push({ key, label, formatter } as ExportColumn);
      }
    }
    const flowName =
      row?.flusso && typeof row.flusso === "object" && "name" in row.flusso
        ? (row.flusso as any).name
        : String(row.flusso ?? "");
    const filenameBase = selectedRangeType.value === "M" ? "mensile" : "settimanale";
    const safeFlow = String(flowName).replace(/[^0-9A-Za-z_\-]+/g, "_");
    const filename = `dashboard_${filenameBase}_${selectedYear.value}_${safeFlow}.xlsx`;
    exportGridToExcel({ columns: cols, items: [row], filename, sheetName: "Riga" });
  } catch (e) {
    console.error("Export riga fallito", e);
  }
}
async function onExport() {
  try {
    const topHeaders: string[] = [];
    const subHeaders: string[] = [];
    const keys: string[] = [];
    for (const c of pivotColumns.value as any[]) {
      if (String(c.key) === "__row_export__") continue;
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
    const dataRows = (pivotRows.value as any[]).map((r) =>
      keys.map((k) => {
        const val = r[k];
        if (k.endsWith("-dettagli")) {
          const arr = Array.isArray(val) ? val : [];
          return arr.map((x: any) => `${x.code}: ${x.value}`).join("; ");
        }
        if (k === "flusso" && val && typeof val === "object" && "name" in val) {
          return (val as any).name;
        }
        return val;
      })
    );
    const aoa = [topHeaders, subHeaders, ...dataRows];

    const merges: Array<{ s: { r: number; c: number }; e: { r: number; c: number } }> = [];
    let colIndex = 0;
    for (const c of pivotColumns.value as any[]) {
      if (String(c.key) === "__row_export__") continue;
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
    const filenameBase = selectedRangeType.value === "M" ? "mensile" : "settimanale";
    let flowPart: string;
    if (selectedFlows.value.length === 1) {
      const fid = selectedFlows.value[0];
      const found = flows.value.find((f) => f.ID_FLUSSO === fid);
      flowPart = found ? found.NOME_FLUSSO : "flusso";
    } else if (selectedFlows.value.length > 1) {
      flowPart = "multi";
    } else {
      flowPart = "tutti";
    }
    const safeFlow = String(flowPart).replace(/[^0-9A-Za-z_\-]+/g, "_");
    const filename = `dashboard_${filenameBase}_${selectedYear.value}_${safeFlow}.xlsx`;
    exportToExcelAoA({ aoa, merges, filename, sheetName: "Dashboard" });
  } catch (e) {
    console.error("Export fallito", e);
  }
}

/* ===================== Persistenza filtri ===================== */
function saveFilters() {
  localStorage.setItem(
    FILTERS_KEY,
    JSON.stringify({
      rangeType: selectedRangeType.value,
      months: selectedMonths.value,
      weeks: selectedWeeks.value,
      flows: selectedFlows.value,
      year: selectedYear.value,
    })
  );
}

/* ===================== Bootstrap ===================== */
onMounted(async () => {
  // ripristino filtri
  const saved = localStorage.getItem(FILTERS_KEY);
  if (saved) {
    try {
      const obj = JSON.parse(saved);
      selectedRangeType.value = obj.rangeType ?? "M";
      selectedMonths.value = obj.months ?? [];
      selectedWeeks.value = obj.weeks ?? [];
      selectedFlows.value = obj.flows ?? [];
      selectedYear.value = obj.year ?? new Date().getFullYear();
    } catch {}
  }

  const rightsStore = useRightsStore();
  rightsStore.hydrateFromSession();

  // 1) stato iniziale: placeholder Nessun
  pivotRows.value = [];
  pivotColumns.value = [];
  pivotError.value = null;

  if (rightsStore.matricola) {
    console.log("adadaaaaaaaaaaaaaaaa")
    await loadFlows(rightsStore.matricola);
    await loadFlowQueries();

    // 2) avvia il caricamento dopo il render del placeholder
    setTimeout(() => {
      applyFilters();
    }, 0);
  }
});
</script>
