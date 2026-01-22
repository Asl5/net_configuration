<template>
  <div class="min-h-screen h-dvh w-full flex flex-col bg-gray-50">
    <BaseHeader title="VLAN Device View" />

    <div class="flex flex-1 min-h-0 overflow-hidden">
      <!-- Sidebar VLAN -->
      <aside class="hidden md:flex md:w-72 border-r overflow-y-auto bg-white md:flex-col">

        <div class="flex-1">
          <div
            v-for="(g) in groupedVlans"
            :key="g.key"
            class="border-b"
          >
            <div
              class="px-4 py-2 text-md font-bold  uppercase text-white bg-gray-400 flex items-center justify-between cursor-pointer hover:bg-gray-300 select-none"
              @click="toggleGroup(g.key)"
            >
              <span>VLAN: {{ g.label }}</span>
              <span :class="['transition-transform', isExpanded(g.key) ? 'rotate-90' : 'rotate-0']">
                <BaseIcon name="chevronRight" size="w-4 h-4" color="text-white/80" />
              </span>
            </div>
            <ul v-show="isExpanded(g.key)">
              <li
                v-for="v in g.items"
                :key="String(v.ID)"
                @click="onVlanClick(v)"
                :class="itemClass(v)"
              >
                 {{ v.NOME_VLAN.toUpperCase() }} {{ v.DESCRIZIONE.toUpperCase() }}
              </li>
            </ul>
          </div>
        </div>
      </aside>

      <!-- Right panel: devices for selected VLAN -->
      <main class="flex-1 overflow-auto p-4 md:p-6">
        <div v-if="selectedVlan" class="w-full space-y-4">
          <div class="w-full bg-white rounded-lg shadow p-4 md:p-6 space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-gray-800">
                VLAN {{ selectedVlan.ID_VLAN }} - Dispositivi ACL
                <span v-if="isDirty" class="ml-2 text-xs text-orange-600"
                  >(modifiche non salvate)</span
                >
              </h2>
              <div class="flex gap-2">
                <BaseButton size="sm" variant="third" @click="addRow"
                  >Aggiungi dispositivo</BaseButton
                >
              </div>
            </div>

            <div v-if="loading" class="text-gray-500 italic">Caricamento...</div>

            <div v-else class="divide-y">
              <!-- Editable rows -->
              <div v-for="(d, idx) in devices" :key="d.__key" class="py-3">
                <div class="grid grid-cols-12 gap-3 items-start">
                  <div class="col-span-2">
                    <BaseInput v-model="d.STANZA" label="Stanza" />
                  </div>
                  <div class="col-span-3">
                    <BaseInput v-model="d.DESCRIZIONE" label="Descrizione" />
                  </div>
                  <div class="col-span-2">
                    <BaseInput v-model="d.SERIALE" label="Seriale" />
                  </div>
                  <div class="col-span-2">
                    <BaseInput v-model="d.HOST_NAME" label="Hostname" />
                  </div>
                  <div class="col-span-1">
                    <BaseInput v-model="d.PORTA" label="Porta" />
                  </div>
                  <div class="col-span-2">
                    <BaseInput v-model="d.IP" label="IP" />
                  </div>
                  <div class="col-span-2">
                    <BaseInput v-model="d.FORNITORE" label="Fornitore" />
                  </div>
                  <div class="col-span-4">
                    <BaseTextArea v-model="d.NOTE" label="Note" rows="1" />
                  </div>
                  <div class="col-span-2">
                    <BaseInput v-model="d.STATO" label="Stato" />
                  </div>
                </div>

                <div class="mt-2 flex justify-end gap-2">
                  <BaseButton
                    size="xs"
                    variant="danger"
                    @click="askDeleteRow(idx)"
                  >
                    Elimina</BaseButton
                  >
                </div>

                <div class="mt-2">
                  <span
                    :class="
                      d.__meta?.status === 'new'
                        ? 'bg-gray-100 text-gray-600'
                        : d.__meta?.status === 'deleted'
                        ? 'bg-red-100 text-red-700'
                        : d.__meta?.status === 'updated'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-blue-100 text-blue-700'
                    "
                    class="text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap"
                    >{{
                      d.__meta?.status === "new"
                        ? "Nuovo"
                        : d.__meta?.status === "deleted"
                        ? "Eliminato"
                        : d.__meta?.status === "updated"
                        ? "Modificato"
                        : "Già presente"
                    }}</span
                  >
                </div>
              </div>
            </div>
            <div v-if="devices.length > 0" class="flex mt-4 md:justify-end">
              <BaseButton size="sm" variant="primary" @click="saveAll">Salva</BaseButton>
            </div>
          </div>
        </div>
        <div v-else class="hidden md:block text-gray-500">
          Seleziona una VLAN dalla lista a sinistra.
        </div>
      </main>
    </div>
    <BaseModalAlert
      :show="showUnsavedModal"
      title="Attenzione"
      message="Hai delle modifiche non salvate. Vuoi cambiare VLAN?"
      ok-text="Si, continua"
      cancel-text="Annulla"
      @confirm="confirmSwitchVlan"
      @cancel="cancelSwitchVlan"
    />
    <BaseModalAlert
      :show="showDeleteModal"
      title="Conferma eliminazione"
      :message="deleteMessage"
      ok-text="Elimina"
      cancel-text="Annulla"
      @confirm="confirmDeleteRow"
      @cancel="cancelDeleteRow"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import BaseHeader from "@/components/base/BaseHeader.vue";
import BaseButton from "@/components/base/BaseButton.vue";
import BaseInput from "@/components/base/BaseInput.vue";
import BaseTextArea from "@/components/base/BaseTextArea.vue";
import BaseModalAlert from "@/components/base/BaseModalAlert.vue";
import BaseIcon from "@/components/base/BaseIcon.vue";
import { apiLoadVlanDevices, apiLoadVlans } from "@/services/api";
import {
  apiInsertVlanDevice,
  apiUpdateVlanDevice,
  apiDeleteVlanDevice,
  type VlanDevice,
} from "@/services/api";

type Vlan = { ID: number; ID_VLAN: string; NOME_VLAN: string; DESCRIZIONE: string };

const vlanList = ref<Vlan[]>([]);
const selectedVlan = ref<Vlan | null>(null);
const loading = ref(false);
const showUnsavedModal = ref(false);
const pendingVlan = ref<Vlan | null>(null);
const showDeleteModal = ref(false);
const deleteIndex = ref<number | null>(null);

function vlanGroupKey(v: Vlan): string {
  const n = Number(v.ID_VLAN);
  if (!Number.isNaN(n)) return String(Math.floor(n / 100));
  return (v.NOME_VLAN?.[0] || "X").toUpperCase();
}

// Alterna i gruppi: blocchi contigui ottengono bg bianco / grigio-200
const groupedVlans = computed(() => {
  const map = new Map<string, Vlan[]>();
  const order: string[] = [];
  for (const v of vlanList.value) {
    const key =  v.ID_VLAN;
    console.log(key)
    if (!map.has(key)) {
      map.set(key, []);
      order.push(key);
    }
    map.get(key)!.push(v);
  }
  return order.map((key) => {
    const items = map.get(key)!;
    const label = items[0]?.ID_VLAN ? String(items[0].ID_VLAN) : key;
    return { key, label, items };
  });
});

const expandedKey = ref<string | null>(null);

watch(
  () => [groupedVlans.value, selectedVlan.value?.ID_VLAN],
  () => {
    // Non collassare i gruppi quando si seleziona una VLAN interna.
    // Apri il gruppo solo se nessun gruppo è ancora aperto.
    if (!expandedKey.value) {
      if (selectedVlan.value) {
        expandedKey.value = String(selectedVlan.value.ID_VLAN);
      } else if (groupedVlans.value.length) {
        expandedKey.value = groupedVlans.value[0].key;
      }
    }
  },
  { immediate: true, deep: true }
);

function isExpanded(key: string) {
  return expandedKey.value === key;
}
function toggleGroup(key: string) {
  expandedKey.value = expandedKey.value === key ? null : key;
}

function itemClass(v: Vlan): string {
  const base: string[] = ["px-4 py-2 cursor-pointer text-gray-800",  "hover:bg-gray-300"];
  const isSelected = v.ID === (selectedVlan.value?.ID ?? null);
  if (isSelected) base.push("bg-gray-200", "font-bold");
  return base.join(" ");
}

type DeviceRow = VlanDevice & {
  __key: string;
  __meta?: { status?: "new" | "updated" | "deleted"; original?: VlanDevice };
};
const devices = ref<DeviceRow[]>([]);

// Change tracking
const toInsert = ref<VlanDevice[]>([]);
const toUpdate = ref<{ old: VlanDevice; new: VlanDevice }[]>([]);
const toDelete = ref<VlanDevice[]>([]);
// Dirty state also includes typing in new (unsaved) rows
const newInputDirty = ref(false);
const isDirty = computed(
  () => toInsert.value.length + toUpdate.value.length + toDelete.value.length > 0 || newInputDirty.value
);

// Consider a row meaningful for insert only if key fields have content
function hasMeaningfulContent(d: VlanDevice): boolean {
  const keyFields: (keyof VlanDevice)[] = [
    'SERIALE', 'HOST_NAME', 'PORTA', 'IP',
  ];
  return keyFields.some((k) => String((d as any)[k] ?? '').trim().length > 0);
}

// Any field content (used to show unsaved badge as soon as user types)
function hasAnyFieldContent(d: VlanDevice): boolean {
  const fields: (keyof VlanDevice)[] = [
    'STANZA','DESCRIZIONE','SERIALE','HOST_NAME','PORTA','IP','FORNITORE','NOTE','STATO',
  ];
  return fields.some((k) => String((d as any)[k] ?? '').trim().length > 0);
}

function rowKey(d: Partial<VlanDevice>) {
  return [
    String(d.ID_VLAN ?? ""),
    d.SERIALE ?? "",
    d.HOST_NAME ?? "",
    d.PORTA ?? "",
    d.IP ?? "",
  ].join("|");
}

async function reloadVlans() {
  const { data } = await apiLoadVlans();
  console.log(data)
  const rows = Array.isArray((data as any)?.rows) ? (data as any).rows : [];
  console.log(rows)
  vlanList.value = rows.map((r: any, i: number) => ({
    ID: r.ID ?? i,
    ID_VLAN: r.ID_VLAN ?? "",
    NOME_VLAN: r.NOME_VLAN ?? "",
    DESCRIZIONE: r.DESCRIZIONE ?? "",
  }));
  console.log(vlanList)
  if (vlanList.value.length && !selectedVlan.value) onVlanClick(vlanList.value[0]);
}

async function onVlanClick(v: Vlan) {
  if (selectedVlan.value?.ID !== v.ID && isDirty.value) {
    pendingVlan.value = v;
    showUnsavedModal.value = true;
    return;
  }
  selectedVlan.value = v;
  await loadDevices();
}

async function loadDevices() {
  if (!selectedVlan.value) return;
  loading.value = true;
  try {
    // reset tracking
    toInsert.value = [];
    toUpdate.value = [];
    toDelete.value = [];

    const { data } = await apiLoadVlanDevices(selectedVlan.value.ID);
    const rows = Array.isArray((data as any)?.rows) ? (data as any).rows : [];
    const mapRow = (r: any): DeviceRow => {
      const d: VlanDevice = {
        ID: r.ID_DEVICE ?? null,
        ID_VLAN: String(r.ID_VLAN ?? selectedVlan.value!.ID_VLAN),
        STANZA: r.STANZA ?? "",
        DESCRIZIONE: r.DESCRIZIONE ?? "",
        SERIALE: r.SERIALE ?? "",
        HOST_NAME: r.HOST_NAME ?? "",
        PORTA: r.PORTA ?? "",
        IP: r.IP ?? "",
        FORNITORE: r.FORNITORE ?? "",
        NOTE: r.NOTE ?? "",
        STATO: r.STATO ?? "",
      };
      const original = { ...d, ID_DEVICE: r.ID_DEVICE ?? null } as any;
      return {
        ...(original as any),
        __key: rowKey(d),
        __meta: { original: JSON.parse(JSON.stringify(original)) },
      } as any;
    };
    devices.value = rows.map(mapRow);
    // If no devices exist for this VLAN, create a default empty row
    // and mark it as a new (unsaved) entry so it isn't treated as existing.
    if (devices.value.length === 0) {
      addRow();
    }
  } finally {
    loading.value = false;
  }
}

function addRow() {
  if (!selectedVlan.value) return;
  const d: VlanDevice = {
    ID: null as any,
    ID_VLAN: String(selectedVlan.value.ID_VLAN),
    STANZA: "",
    DESCRIZIONE: "",
    SERIALE: "",
    HOST_NAME: "",
    PORTA: "",
    IP: "",
    FORNITORE: "",
    NOTE: "",
    STATO: "",
  };
  const row: DeviceRow = {
    ...d,
    __key: `${rowKey(d)}|new|${Date.now()}`,
    __meta: { status: "new", original: JSON.parse(JSON.stringify(d)) },
  };
  devices.value.unshift(row);
}

function removeRow(index: number) {
  const row = devices.value[index];
  if (!row) return;
  devices.value.splice(index, 1);
  // If new and not saved yet, remove from toInsert; else mark for delete
  if (row.__meta?.status !== "new") {
    const original = row.__meta?.original as VlanDevice | undefined;
    if (original) toDelete.value.push(original);
  }
}

function askDeleteRow(index: number) {
  deleteIndex.value = index;
  showDeleteModal.value = true;
}

function confirmDeleteRow() {
  if (deleteIndex.value !== null) {
    removeRow(deleteIndex.value);
  }
  deleteIndex.value = null;
  showDeleteModal.value = false;
}

function cancelDeleteRow() {
  deleteIndex.value = null;
  showDeleteModal.value = false;
}

// Watch each device row for changes to populate toUpdate
watch(
  devices,
  () => {
    const newInserts: VlanDevice[] = [];
    let anyNewInputs = false;
    for (const row of devices.value) {
      const orig = row.__meta?.original;
      const current: VlanDevice = {
        ID: row.ID,
        ID_VLAN: row.ID_VLAN,
        STANZA: row.STANZA,
        DESCRIZIONE: row.DESCRIZIONE,
        SERIALE: row.SERIALE,
        HOST_NAME: row.HOST_NAME,
        PORTA: row.PORTA,
        IP: row.IP,
        FORNITORE: row.FORNITORE,
        NOTE: row.NOTE,
        STATO: row.STATO,
      } as any;
      (current as any).ID_DEVICE = (row as any).ID_DEVICE ?? null;
      // Consider as NEW if explicitly marked or missing backend id
      const looksNew = row.__meta?.status === "new" || !(row as any).ID_DEVICE;
      if (looksNew) {
        if (row.__meta) row.__meta.status = "new"; else (row as any).__meta = { status: "new", original: JSON.parse(JSON.stringify(current)) } as any;
        // Unsaved indicator: any field typed in new row
        if (hasAnyFieldContent(current)) anyNewInputs = true;
        // Only consider for insert if key fields have content
        if (hasMeaningfulContent(current)) {
          newInserts.push({ ...current, ID_VLAN: String(current.ID_VLAN) });
        }
        continue;
      }
      if (!orig) continue;
      const changed = JSON.stringify(current) !== JSON.stringify(orig);
      const idx = toUpdate.value.findIndex((u) => rowKey(u.old) === rowKey(orig));
      if (changed) {
        if (row.__meta && row.__meta.status !== "updated") row.__meta.status = "updated";
        if (idx === -1)
          toUpdate.value.push({ old: JSON.parse(JSON.stringify(orig)), new: current });
        else toUpdate.value[idx].new = current;
      } else {
        if (row.__meta && row.__meta.status && row.__meta.status !== "new")
          row.__meta.status = undefined as any;
        if (idx !== -1) toUpdate.value.splice(idx, 1);
      }
    }
    toInsert.value = newInserts;
    newInputDirty.value = anyNewInputs;
  },
  { deep: true, flush: "post" }
);

async function saveAll() {
  if (!selectedVlan.value) return;
  try {
    // Preview mode: log what would be done and return early
    const vlanIdStr = String(selectedVlan.value.ID_VLAN);
    const preview = {
      deletes: toDelete.value.map((d) => ({
        ID_VLAN: String(d.ID_VLAN),
        SERIALE: d.SERIALE,
        HOST_NAME: d.HOST_NAME,
        PORTA: d.PORTA,
        IP: d.IP,
      })),
      inserts: toInsert.value.map((d) => ({
        ...d,
        ID_VLAN: vlanIdStr,
      })),
      updates: toUpdate.value.map((u) => ({
        id: (u.old as any).ID_DEVICE ?? null,
        new: { ...u.new, ID_VLAN: vlanIdStr },
      })),
      counts: {
        deletes: toDelete.value.length,
        inserts: toInsert.value.length,
        updates: toUpdate.value.length,
      },
    };

    console.log(toInsert)
    console.log(toUpdate)

    // Deletes (endpoint expects VLAN primary key)
    for (const d of toDelete.value) {
      console.log(d);
      await apiDeleteVlanDevice({
        ID_VLAN: String(selectedVlan.value!.ID),
      });
    }
    // Inserts (first param must be VLAN primary key)
    for (const d of toInsert.value) {
      console.log(d);
      await apiInsertVlanDevice({ ...d, ID: String(selectedVlan.value!.ID) });
    }
    // Updates

    console.log("[VlanDeviceView] SAVE PREVIEW", preview);
    // Early return: do not call endpoints for now
    for (const u of toUpdate.value) {
      await apiUpdateVlanDevice({ ...u.new, ID_VLAN: String(selectedVlan.value!.ID) });
    }

    await loadDevices();
  } catch (e) {
    console.error(e);
  }
}

onMounted(() => reloadVlans());

function confirmSwitchVlan() {
  if (pendingVlan.value) {
    const next = pendingVlan.value;
    pendingVlan.value = null;
    showUnsavedModal.value = false;
    selectedVlan.value = next;
    loadDevices();
  } else {
    showUnsavedModal.value = false;
  }
}
function cancelSwitchVlan() {
  pendingVlan.value = null;
  showUnsavedModal.value = false;
}

const deleteMessage = computed(() => {
  if (deleteIndex.value === null) return "Sei sicuro di voler eliminare la riga?";
  const d = devices.value[deleteIndex.value];
  if (!d) return "Sei sicuro di voler eliminare la riga?";
  const parts = [d.HOST_NAME, d.SERIALE, d.IP].filter(Boolean);
  const what = parts.length ? parts.join(" Â· ") : "questa riga";
  return `Sei sicuro di voler eliminare ${what}?`;
});
</script>

