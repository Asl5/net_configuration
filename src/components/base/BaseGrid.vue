<template>
  <div
    :class="[
      'rounded-xl relative flex flex-col',
      wrapperClass,
      bordered ? ['border', borderColorClass] : '',
      rounded ? 'rounded-xl' : 'rounded-none',
      'bg-white shadow-lg',
    ]"
  >
    <!-- Contenitore scroll -->
    <div
      :class="['w-full flex-1', scrollX ? 'overflow-x-auto' : '', scrollY ? 'overflow-y-auto' : '']"
      :style="scrollY && yMaxHeight ? { maxHeight: yMaxHeight } : undefined"
    >
      <table :class="[tableClass, 'divide-y', dividerColorClass]">
        <!-- Header -->
        <thead :class="[headerBgClass, stickyHeader ? 'sticky top-0 z-10' : '', 'relative']">
          <!-- Pulsante refresh -->
          <div v-if="showRefresh" class="absolute inset-y-0 right-2 flex items-center">
            <button
              class="text-gray-500 hover:text-gray-700 p-2 rounded-md hover:bg-gray-100"
              @click="emit('refresh')"
              aria-label="Aggiorna"
              title="Aggiorna"
            >
              <font-awesome-icon icon="rotate-right" />
            </button>
          </div>

<!-- 🔹 Header principale -->
<tr>
<th
  v-for="(col, ci) in columns"
  :key="'h-' + col.key"
  scope="col"
  :colspan="col.subColumns ? col.subColumns.length : 1"
  :rowspan="col.subColumns ? 1 : 2"
  :class="[
    'px-4 text-xs font-semibold uppercase tracking-wider',
    dense ? 'py-2' : 'py-1',
    headerTextClass,
    alignClass(col.align),
    col.width,
    col.headerClass,
    showRefresh && ci === columns.length - 1 ? 'pr-12' : '',
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
    <!-- Label -->
    <span
      class="text-gray-800 font-semibold w-full text-center"
      :class="alignClass(col.align)"
    >
      {{ col.label }}
    </span>

    <!-- Campo filtro -->
    <input
      v-if="showFilters && !col.subColumns"
      v-model="filters[col.key]"
      type="text"
      placeholder=""
      class="w-full border border-gray-300 rounded-md px-2 py-1 text-xs
             focus:outline-none focus:ring-1 focus:ring-blue-400"
    />
  </div>
</th>


</tr>




          <!-- Subheader -->
          <tr v-if="hasSubHeaders">
            <template v-for="col in columns" :key="'s-group-' + col.key">
  <th
  v-for="(col, ci) in columns"
  :key="'h-' + col.key"
  scope="col"
  :colspan="col.subColumns ? col.subColumns.length : 1"
  :rowspan="col.subColumns ? 1 : 2"
  :class="[
    'px-4 text-xs font-semibold uppercase tracking-wider',
    dense ? 'py-2' : 'py-1',
    headerTextClass,
    alignClass(col.align),
    col.width,
    col.headerClass,
    showRefresh && ci === columns.length - 1 ? 'pr-12' : '',
  ]"
>
  <div
    :class="[
      'h-full w-full flex flex-col',
      showFilters ? 'justify-between min-h-[3.5rem]' : 'justify-center',
      alignClass(col.align),
    ]"
  >
    <!-- Label -->
    <span
      :class="[
        'text-gray-800 font-semibold',
        showFilters ? 'pb-1' : '',
        alignClass(col.align),
      ]"
    >
      {{ col.label }}
    </span>

    <!-- Campo filtro -->
    <input
      v-if="showFilters && !col.subColumns"
      v-model="filters[col.key]"
      type="text"
      placeholder=""
      class="w-full border border-gray-300 rounded-md px-2 py-1 text-xs
             focus:outline-none focus:ring-1 focus:ring-blue-400 mt-auto"
    />
  </div>
</th>


            </template>
          </tr>
        </thead>

        <!-- Body -->
        <tbody :class="['divide-y', dividerColorClass]">
          <tr
            v-for="(row, i) in pagedItems"
            :key="i"
            :class="[
              zebra ? (i % 2 === 0 ? zebraEvenClass : zebraOddClass) : '',
              'hover:bg-gray-50',
            ]"
          >
            <td
              v-for="col in flatColumns"
              :key="col.key"
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
        <BaseButton
          size="sm"
          variant="secondary"
          :disabled="page <= 1"
          @click="prevPage"
        >
          <BaseIcon name="chevronLeft" class="w-4 h-4 mr-2" />
          Prev
        </BaseButton>
        <BaseButton
          size="sm"
          variant="secondary"
          :disabled="page >= totalPages"
          @click="nextPage"
        >
          Next
          <BaseIcon name="chevronRight" class="w-4 h-4 ml-2" />
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import BaseButton from "@/components/base/BaseButton.vue";
import BaseIcon from "@/components/base/BaseIcon.vue";
import type { Align, GridColumn } from "@/grids/columns";
import { onMounted } from "vue";

type RowLike = Record<string, unknown>;

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
  }>(),
  {
    page: 1,
    pageSize: 20,
    showPagination: false,
    bordered: true,
    rounded: true,
    dense: false,
    stickyHeader: false,
    zebra: true,
    scrollX: true,showFilters: false,
    scrollY: false,
    nowrap: false,
    wrapperClass: "overflow-hidden bg-white",
    tableClass: "min-w-full",
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
  }
);

const emit = defineEmits<{
  (e: "details", row: RowLike, index: number): void;
  (e: "edit", row: RowLike, index: number): void;
  (e: "remove", row: RowLike, index: number): void;
  (e: "refresh"): void;
}>();

const filters = ref<Record<string, string>>({});


onMounted(() => {
  props.columns.forEach((col) => {
    if (col.subColumns) {
      col.subColumns.forEach((sub) => (filters.value[sub.key] = ""));
    } else {
      filters.value[col.key] = "";
    }
  });
});

const filteredItems = computed(() => {
  return props.items.filter((row) =>
    Object.entries(filters.value).every(([key, val]) => {
      if (!val) return true;
      const cellValue = String(row[key] ?? "").toLowerCase();
      return cellValue.includes(val.toLowerCase());
    })
  );
});

const totalItems = computed(() => filteredItems.value.length);
const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / pageSize.value)));

const pagedItems = computed(() =>
  filteredItems.value.slice(startIndex.value, endIndex.value)
);


const page = ref(props.page);
const pageSize = ref(props.pageSize);

// const totalItems = computed(() => props.items.length);
// const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / pageSize.value)));

const startIndex = computed(() => (page.value - 1) * pageSize.value);
const endIndex = computed(() => Math.min(startIndex.value + pageSize.value, totalItems.value));

// const pagedItems = computed(() => props.items.slice(startIndex.value, endIndex.value));

// 🔹 Flatten subColumns
const flatColumns = computed(() =>
  props.columns.flatMap((col) => (col.subColumns ? col.subColumns : col))
);

const hasSubHeaders = computed(() =>
  props.columns.some((col) => col.subColumns && col.subColumns.length > 0)
);

function prevPage() {
  if (page.value > 1) page.value--;
}
function nextPage() {
  if (page.value < totalPages.value) page.value++;
}
function alignClass(a?: Align) {
  return a === "center" ? "text-center" : a === "right" ? "text-right" : "text-left";
}
</script>
