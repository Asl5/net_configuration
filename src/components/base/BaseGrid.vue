<template>
  <div
    :class="[
      'rounded-xl relative flex flex-col bg-white shadow-lg overflow-hidden',
      wrapperClass,
      bordered ? ['border', borderColorClass] : '',
      rounded ? 'rounded-xl' : 'rounded-none',
    ]"
  >
    <!-- Contenitore scroll -->
    <div
      :class="['w-full flex-1', scrollX ? 'overflow-x-auto' : '', scrollY ? 'overflow-y-auto' : '']"
      :style="scrollY && yMaxHeight ? { maxHeight: yMaxHeight } : undefined"
    >
      <table :class="[tableClass, 'min-w-full divide-y', dividerColorClass]">
        <!-- Header -->
        <thead :class="[headerBgClass, stickyHeader ? 'sticky top-0 z-10' : '', 'relative']">
          <!-- Pulsanti header (refresh, export) -->
          <div v-if="showRefresh || showExport" class="absolute inset-y-0 right-2 flex items-center gap-2">
            <button
              v-if="showRefresh"
              class="text-gray-500 hover:text-gray-700 p-2 rounded-md hover:bg-gray-100"
              @click="emit('refresh')"
              aria-label="Aggiorna"
              title="Aggiorna"
            >
              <font-awesome-icon icon="rotate-right" />
            </button>
            <button
              v-if="showExport"
              class="text-gray-500 hover:text-gray-700 p-2 rounded-md hover:bg-gray-100"
              @click="onExportClick"
              aria-label="Esporta"
              title="Esporta"
            >
              <font-awesome-icon icon="file-arrow-down" />
            </button>
          </div>

          <tr>
            <th
              v-if="anyExpandable"
              class="w-10 px-2 text-xs font-semibold uppercase tracking-wider"
              :class="[dense ? 'py-2' : 'py-3', headerTextClass]"
            ></th>

            <th
              v-for="(col, ci) in flatColumns"
              :key="'h-' + col.key"
              scope="col"
              :class="[
                'px-4 text-xs font-semibold uppercase tracking-wider',
                dense ? 'py-2' : 'py-3',
                headerTextClass,
                alignClass(col.align),
                col.width,
                col.headerClass,
                (showRefresh || showExport) && ci === flatColumns.length - 1 ? 'pr-14' : '',
              ]"
            >
              <div
                :class="[
                  'w-full h-full',
                  showFilters
                    ? 'flex flex-col justify-between min-h-[3.5rem]'
                    : 'flex items-center justify-center',
                ]"
              >
                <span class="text-gray-800 font-semibold w-full" :class="alignClass(col.align)">
                  {{ col.label }}
                </span>

                <input
                  v-if="showFilters"
                  v-model="filters[col.key]"
                  type="text"
                  class="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>
            </th>

            <th v-if="showActions" class="px-4" :class="dense ? 'py-2' : 'py-3'">
              <span class="sr-only">{{ actionsLabel || "Azioni" }}</span>
            </th>
          </tr>
        </thead>

        <!-- Body -->
        <tbody :class="['divide-y', dividerColorClass]">
          <!-- Riga principale + riga espansa come sibling per ogni elemento -->
          <template v-for="(row, i) in pagedItems" :key="'wrap-' + i">

            <tr
              :class="[
                zebra ? (i % 2 === 0 ? zebraEvenClass : zebraOddClass) : '',
                'hover:bg-gray-50',
              ]"
            >
              <!-- Expander -->
              <td v-if="anyExpandable" class="px-2" :class="dense ? 'py-2' : 'py-3'">
                <button
                  v-if="hasExpandedData(row)"
                  type="button"
                  class="inline-flex items-center justify-center w-6 h-6 rounded hover:bg-gray-100 border border-gray-200"
                  @click.stop="toggleRow(i)"
                >
                  <svg
                    v-if="!expanded[i]"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    class="w-3.5 h-3.5"
                  >
                    <path fill="currentColor" d="M6 10h8v1H6zM10 6h1v8h-1z" />
                  </svg>
                  <svg
                    v-else
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    class="w-3.5 h-3.5"
                  >
                    <path fill="currentColor" d="M6 10h8v1H6z" />
                  </svg>
                </button>
              </td>

              <!-- Celle -->
              <td
                v-for="col in flatColumns"
                :key="'c-' + col.key + '-' + i"
                :class="[
                  'px-4',
                  dense ? 'py-2' : 'py-3',
                  'text-sm',
                  rowTextClass,
                  alignClass(col.align),
                  col.cellClass,
                  nowrap ? 'whitespace-nowrap' : 'whitespace-normal',
                ]"
              >
                <slot
                  :name="`cell-${col.key}`"
                  :value="row[col.key]"
                  :row="row"
                  :col="col"
                  :index="i"
                >
                  <span v-if="col.formatter" v-html="col.formatter(row[col.key], row)" />
                  <span v-else v-html="row[col.key]" />
                </slot>
              </td>

              <!-- Azioni -->
              <td v-if="showActions" class="px-4" :class="dense ? 'py-2' : 'py-3'">
                <slot name="actions" :row="row" :index="i">
                  <div class="flex gap-2 justify-end">
                    <BaseButton
                      v-if="showDetails"
                      :size="actionSize"
                      variant="secondary"
                      @click="emit('details', row, i)"
                    >
                      Dettagli
                    </BaseButton>
                    <BaseButton
                      v-if="showEdit"
                      :size="actionSize"
                      variant="ghost"
                      @click="emit('edit', row, i)"
                    >
                      Modifica
                    </BaseButton>
                    <BaseButton
                      v-if="showRemove"
                      :size="actionSize"
                      variant="danger"
                      @click="emit('remove', row, i)"
                    >
                      Rimuovi
                    </BaseButton>
                  </div>
                </slot>
              </td>
            </tr>

            <!-- 🔹 Sottogriglia come riga separata subito sotto -->
            <tr
              v-if=" anyExpandable && expanded[i] && hasExpandedData(row) "
              class="bg-gray-50"
            >
              <td :colspan="colspanForExpand" class="px-6 py-3">
                <slot name="expand" :parent="row" :rows="row[expandField]">
                  <div class="text-xs text-gray-700">
                    <div class="mb-2 font-semibold text-gray-800">
                      Regole ACL ({{ row[expandField].length }})
                    </div>

                    <!-- 🔸 Contenitore scrollabile -->
                    <div
                      class="border border-gray-200 rounded-lg overflow-y-auto shadow-inner scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                      :style="{ maxHeight: expandMaxHeight }"
                    >
                      <table class="min-w-full text-sm">
                        <thead
                          :class="[headerBgClass, 'sticky', 'top-0', 'border-gray-200', 'z-10']"
                        >
                          <tr>
                            <th
                              v-for="ec in expandColumnsResolved"
                              :key="'eh-' + ec.key"
                              :class="[
                                'px-3 py-2 font-semibold text-gray-700 uppercase tracking-wide text-xs',
                                alignClass(ec.align),
                                ec.width,
                                ec.headerClass,
                              ]"
                            >
                              {{ ec.label }}
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          <tr
                            v-for="(r, ri) in row[expandField]"
                            :key="'er-' + ri"
                            class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                          >
                            <td
                              v-for="ec in expandColumnsResolved"
                              :key="'ec-' + ec.key + '-' + ri"
                              :class="[
                                'px-3 py-2 align-top',
                                alignClass(ec.align),
                                ec.cellClass,
                              ]"
                            >
                              <span v-if="ec.formatter" v-html="ec.formatter(r[ec.key], r)" />
                              <span v-else>{{ r[ec.key] }}</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </slot>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Footer/Paginazione -->
    <div
      v-if="showPagination && totalPages > 1"
      :class="[
        'px-4 py-3 border-t rounded-b-xl shadow-lg flex items-center justify-between',
        headerBgClass,
        borderColorClass,
      ]"
    >
      <p class="text-sm text-gray-700">
        Mostrati {{ startIndex + 1 }}–{{ endIndex }} di {{ totalItems }} elementi
      </p>
      <div class="flex gap-2">
        <BaseButton size="sm" variant="secondary" :disabled="page <= 1" @click="prevPage">
          Prev
        </BaseButton>
        <BaseButton size="sm" variant="secondary" :disabled="page >= totalPages" @click="nextPage">
          Next
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import BaseButton from "@/components/base/BaseButton.vue";
import type { Align, GridColumn } from "@/grids/columns";

type RowLike = Record<string, any>;

type GridColumnGroup<T> = GridColumn<T> & {
  subColumns?: GridColumn<T>[];
};

const props = withDefaults(
  defineProps<{
    items: RowLike[];
    columns: GridColumnGroup<RowLike>[];

    /** Pagination */
    page?: number;
    pageSize?: number;
    showPagination?: boolean;
    showFilters?: boolean;

    /** Stili/feature */
    bordered?: boolean;
    rounded?: boolean;
    dense?: boolean;
    stickyHeader?: boolean;
    zebra?: boolean;
    showRefresh?: boolean;
    showExport?: boolean;
    exportMode?: 'page' | 'all';

    /** Scorrimento */
    scrollX?: boolean;
    scrollY?: boolean;
    yMaxHeight?: string;

    /** Wrapping celle */
    nowrap?: boolean;

    /** Class token */
    wrapperClass?: string;
    tableClass?: string;
    headerBgClass?: string;
    headerTextClass?: string;
    rowTextClass?: string;
    zebraOddClass?: string;
    zebraEvenClass?: string;
    borderColorClass?: string;
    dividerColorClass?: string;

    /** Azioni */
    showActions?: boolean;
    actionsLabel?: string;
    showDetails?: boolean;
    showEdit?: boolean;
    showRemove?: boolean;
    actionSize?: "xs" | "sm" | "md";

    /** Espansione */
    expandable?: boolean;
    expandField?: string;
    expandColumns?: GridColumn<RowLike>[];
    expandMaxHeight?: string;
  }>(),
  {
    page: 1,
    pageSize: 20,
    showPagination: false,
    showFilters: false,

    bordered: true,
    rounded: true,
    dense: false,
    stickyHeader: false,
    zebra: true,
    scrollX: true,
    scrollY: false,
    nowrap: false,

    wrapperClass: "overflow-hidden bg-white",
    tableClass: "",
    headerBgClass: "bg-gray-50",
    headerTextClass: "text-gray-500",
    rowTextClass: "text-gray-700",
    zebraOddClass: "",
    zebraEvenClass: "bg-gray-50/40",
    borderColorClass: "border-gray-200",
    dividerColorClass: "divide-gray-200",

    showActions: false,
    actionsLabel: "",
    showDetails: false,
    showEdit: true,
    showRemove: true,
    actionSize: "xs",

    expandable: false,
    expandField: "_children",
    expandMaxHeight: "16rem",
    showExport: false,
    exportMode: 'page',
  }
);

const emit = defineEmits<{
  (e: "details", row: RowLike, index: number): void;
  (e: "edit", row: RowLike, index: number): void;
  (e: "remove", row: RowLike, index: number): void;
  (e: "refresh"): void;
  (e: "export", rows: RowLike[]): void;
}>();

const filters = ref<Record<string, string>>({});
const page = ref(props.page);
const pageSize = ref(props.pageSize);

onMounted(() => {
  // setup filtri per ogni colonna
  flatColumns.value.forEach((c) => (filters.value[c.key] = ""));
});

const flatColumns = computed(() => props.columns.flatMap((c) => (c.subColumns ? c.subColumns : c)));

const filteredItems = computed(() =>
  props.items.filter((row) =>
    Object.entries(filters.value).every(([key, val]) => {
      if (!val) return true;
      const cellValue = String(row[key] ?? "").toLowerCase();
      return cellValue.includes(val.toLowerCase());
    })
  )
);

const totalItems = computed(() => filteredItems.value.length);
const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / pageSize.value)));
const startIndex = computed(() => (page.value - 1) * pageSize.value);
const endIndex = computed(() => Math.min(startIndex.value + pageSize.value, totalItems.value));
const pagedItems = computed(() => filteredItems.value.slice(startIndex.value, endIndex.value));

function onExportClick() {
  const rows = props.exportMode === 'all' ? filteredItems.value : pagedItems.value;
  emit('export', rows);
}

function prevPage() {
  if (page.value > 1) page.value--;
}
function nextPage() {
  if (page.value < totalPages.value) page.value++;
}
function alignClass(a?: Align) {
  return a === "center" ? "text-center" : a === "right" ? "text-right" : "text-left";
}

/** Espansione */
const expanded = ref<Record<number, boolean>>({});
function toggleRow(i: number) {
  const isOpen = !!expanded.value[i];
  // Chiudi tutte le altre righe
  expanded.value = {};
  // Se la riga non era aperta, aprila
  if (!isOpen) expanded.value[i] = true;
}
const anyExpandable = computed(
  () => props.expandable && props.items.some((r) => Array.isArray(r[props.expandField]) && r[props.expandField].length)
);
const colspanForExpand = computed(() => flatColumns.value.length + (anyExpandable.value ? 1 : 0));
function hasExpandedData(row: RowLike) {
  const rows = row?.[props.expandField as string];
  if (!Array.isArray(rows) || !rows.length) return false;
  return rows.some((r: any) =>
    expandColumnsResolved.value.some((ec) => String(r?.[ec.key] ?? '').trim().length > 0)
  );
}

// const anyExpandable = computed(
//   () => props.expandable && Array.isArray(props.items) && (props.items as RowLike[]).some((r) => hasExpandedData(r))
// );
const expandColumnsResolved = computed<GridColumn<RowLike>[]>(() => {
  if (props.expandColumns?.length) return props.expandColumns;
  // default colonne figli (ACL rules) con proprietà richieste
  const make = (key: string, label: string): GridColumn<RowLike> => ({
    key,
    label,
    align: "left",
    width: "w-auto",
    headerClass: "text-gray-700 font-medium px-2 py-1",
    cellClass: "text-gray-800 px-2 py-1",
  });
  return [
    make("AZIONE", "Azione"),
    make("PROTOCOLLO", "Protocollo"),
    make("ORIGINE", "Origine"),
    make("DESTINAZIONE", "Destinazione"),
    make("PORTA_DESTINAZIONE", "Porta"),
  ];
});
</script>
