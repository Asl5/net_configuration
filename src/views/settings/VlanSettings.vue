<template>
  <div class="min-h-screen h-dvh w-full flex flex-col bg-gray-50">
    <BaseHeader title="Gestione VLAN" />
    <div class="flex flex-1 min-h-0 overflow-hidden">
      <!-- Sidebar -->
      <aside class="hidden md:flex md:w-96 border-r overflow-y-auto bg-white md:flex-col">
        <div class="p-4 border-b flex items-center justify-between">
          <!-- <h2 class="text-sm font-semibold text-gray-700">VLAN</h2> -->
          <BaseButton size="xs" variant="primary" @click="openAdd">NUOVA</BaseButton>
        </div>
        <div class="flex-1">
          <div
            v-for="g in groupedVlans"
            :key="g.key"
            class="border-b"
          >
            <div
              class="px-4 py-2 text-md font-bold uppercase text-white bg-gray-400 flex items-center justify-between cursor-pointer hover:bg-gray-300 select-none"
              @click="toggleGroup(g.key)"
            >
              <span>VLAN: {{ g.label }}</span>
              <span :class="['transition-transform', isExpanded(g.key) ? 'rotate-90' : 'rotate-0']">
                <BaseIcon name="chevronRight" size="w-4 h-4" color="text-white"  />
              </span>
            </div>
            <ul v-show="isExpanded(g.key)">
              <li
                v-for="v in g.items"
                :key="v.ID"
                @click="onVlanClick(v)"
                :class="itemClass(v)"
              >
                 {{ v.NOME_VLAN.toUpperCase() }} {{ v.DESCRIZIONE.toUpperCase() }}
              </li>
            </ul>
          </div>
        </div>
      </aside>

      <!-- Dettaglio -->
      <main class="flex-1 overflow-auto p-4 md:p-6">
        <div v-if="selectedVlan" class="w-full space-y-6">
          <div class="w-full bg-white rounded-lg shadow p-4 md:p-6 space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-gray-800">
                VLAN {{ selectedVlan.ID_VLAN }} - {{ displayNome }}
                <span v-if="isDirty" class="ml-2 text-xs text-orange-600"
                  >(modifiche non salvate)</span
                >
              </h2>
              <BaseButton size="md" variant="third" @click="openAssociateModal(selectedVlan!)">
                Associa a sedi
              </BaseButton>
            </div>

          <div class="grid grid-cols-12 gap-4 items-start">
            <div class="col-span-4 space-y-5">
              <BaseInput :floating="true" v-model="selectedVlan.NOME_VLAN" label="Nome VLAN" size="md" />
              <BaseInput v-model="selectedVlan.REFERENTE!" label="Referente" />
            </div>
            <div class="col-span-8">
              <BaseTextArea
                v-model="selectedVlan.DESCRIZIONE"
                label="Descrizione"
                placeholder="Descrizione"
                class="w-full resize-y min-h-24"
              />
            </div>
          </div>

          <!-- Sedi associate (solo visualizzazione) -->
          <div class="mt-4">
            <h3 class="text-md font-semibold text-gray-800">Sedi associate</h3>
            <div v-if="vlanAssociations.length === 0" class="text-sm text-gray-500">
              Nessuna sede associata.
            </div>
            <div v-else class="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div
                v-for="(a, i) in vlanAssociations"
                :key="`${a.ID_SEDE}-${i}`"
                class="border rounded p-2 bg-gray-50"
              >
                <div class="font-medium text-gray-700">{{ getSedeLabel(a.ID_SEDE) }}</div>
                <div class="text-xs text-gray-600 space-x-2">
                  <span v-if="a.SUBNET">Subnet: {{ a.SUBNET }}</span>
                  <span v-if="a.GATEWAY">Gateway: {{ a.GATEWAY }}</span>
                  <span v-if="a.IP_START && a.IP_END">Range: {{ a.IP_START }} - {{ a.IP_END }}</span>
                </div>
                <div v-if="a.NOTE" class="text-xs text-gray-500 mt-1">Note: {{ a.NOTE }}</div>
              </div>
            </div>
          </div>

            <div class="flex mt-4 md:justify-end">
              <BaseButton size="sm" variant="primary" @click="save">Salva</BaseButton>
            </div>
          </div>
        </div>

        <div v-else class="hidden md:block text-gray-500">
          Seleziona una VLAN dalla lista a sinistra.
        </div>
      </main>
    </div>

    <!-- Modale nuova VLAN -->
    <BaseModal v-model="showAdd" title="Nuova Vlan" height="40vh" max-width="50vw">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        <!-- Colonna sinistra: input uno sotto l'altro -->
        <div class="flex flex-col gap-4">
          <BaseInput  v-model.number="newVlan.ID_VLAN" label="ID VLAN" type="number" />
          <BaseInput v-model="newVlan.NOME_VLAN" label="Nome VLAN" />
          <BaseInput v-model="newVlan.REFERENTE!" label="Referente" />
        </div>

        <!-- Colonna destra: textarea alta quanto i 3 input -->
        <div class="h-full">
          <BaseTextArea
            v-model="newVlan.DESCRIZIONE"
            label="Descrizione"
            placeholder="Descrizione"
            class="w-full h-full min-h-36"
          />
        </div>
      </div>

      <div class="mt-3 flex justify-end gap-2 w-full">
        <BaseButton variant="secondary" @click="closeAdd">Annulla</BaseButton>
        <BaseButton variant="primary" @click="create">Crea</BaseButton>
      </div>
    </BaseModal>

    <!-- Modal associazione VLAN -> Sede -->
<BaseModal
  v-model="showAssociate"
  :title="`Associa sede a VLAN:  ${ associationForVlanIdNumber  }`"
  height="75vh"
  body-class="flex flex-col   h-full"
>
  <!-- HEADER STICKY -->
  <div
    class="sticky top-0 z-10  p-2  flex items-center justify-between  "
  >
     <!-- <BaseLabel
        as="h1"
        :text="`ID VLAN:  ${ associationForVlanIdNumber  }`"
        size="lg"
        weight="bold" textColor="text-gray-700"
      /> -->
<div></div>
    <BaseButton size="xs" variant="third" @click="addAssociationForm">Aggiungi</BaseButton>
  </div>

  <!-- CORPO SCORREVOLE -->
  <div class="flex-1 overflow-y-auto px-1 py-2 space-y-6">
    <div
      v-for="(form, idx) in associationForms"
      :key="idx"
      class=" w-full bg-white  p-2 md:p-2 space-y-4 border-b-2 border-gray-400"
    >
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <BaseSelect
          v-model="form.ID_SEDE"
          :options="sediOptions"
          label="Sede"
          placeholder="Seleziona sede"
          :disabled="!form.isNew"
        />
        <BaseInput
          v-model="form.SUBNET"
          label="SUBNET"
          :pattern="/^((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\.){3}(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\/(3[0-2]|[12]?\\d)$/"
          pattern-message="Subnet CIDR non valida (es. 192.168.1.0/24)"
          validate-on="input"
          :allowed-chars="/[0-9./]/"
          inputmode="decimal"
        />
        <BaseInput
          v-model="form.MASK"
          label="MASK"
          :pattern="/^((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\.){3}(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)$/"
          pattern-message="Mask non valida (es. 255.255.255.0)"
          validate-on="input"
          :allowed-chars="/[0-9.]/"
          inputmode="decimal"
        />
        <BaseInput
          v-model="form.GATEWAY"
          label="GATEWAY"
          :pattern="/^((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\.){3}(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)$/"
          pattern-message="IP non valido"
          validate-on="input"
          :allowed-chars="/[0-9.]/"
          inputmode="decimal"
        />
        <BaseInput
          v-model="form.IP_START"
          label="IP START"
          :pattern="/^((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\.){3}(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)$/"
          pattern-message="IP non valido"
          validate-on="input"
          :allowed-chars="/[0-9.]/"
          inputmode="decimal"
        />
        <BaseInput
          v-model="form.IP_END"
          label="IP END"
          :pattern="/^((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\.){3}(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)$/"
          pattern-message="IP non valido"
          validate-on="input"
          :allowed-chars="/[0-9.]/"
          inputmode="decimal"
        />
        <BaseInput
          v-model="form.BROADCAST"
          label="BROADCAST"
          :pattern="/^((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\.){3}(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)$/"
          pattern-message="IP non valido"
          validate-on="input"
          :allowed-chars="/[0-9.]/"
          inputmode="decimal"
        />
        <!-- <BaseInput v-model.number="form.ID_ACL" type="number" label="ID ACL" /> -->
        <div class="md:col-span-4">
          <BaseTextArea v-model="form.NOTE" label="NOTE" rows="2" />
        </div>
      </div>

      <div class="mt-3 flex justify-end gap-2">
        <BaseButton size="xs" variant="danger" @click="removeAssociationForm(idx)">Rimuovi</BaseButton>
        <!-- <BaseButton size="xs" variant="primary" @click="saveAssociationAt(idx)">Salva</BaseButton> -->
      </div>
    </div>
  </div>

  <!-- FOOTER FISSO -->
  <div
    class="sticky bottom-0 z-10 -mx-4 pt-2 pr-2 pb-0 flex justify-end gap-2 bg-gray-50 border-t border-gray-200"
  >
    <BaseButton variant="secondary" @click="closeAssociate">Chiudi</BaseButton>
    <BaseButton variant="primary" @click="saveAllAssociations">Salva</BaseButton>
  </div>
</BaseModal>


    <!-- Modali conferma -->
    <BaseModalAlert
      :show="showConfirmModal"
      title="Salvataggio riuscito"
      message="La VLAN è stata salvata correttamente."
      ok-text="Ok"
      @confirm="showConfirmModal = false"
    />

    <BaseModalAlert
      :show="showUnsavedModal"
      title="Modifiche non salvate"
      message="Hai modifiche non salvate. Vuoi procedere senza salvare?"
      ok-text="Sì, continua"
      cancel-text="Annulla"
      @confirm="confirmSwitch"
      @cancel="showUnsavedModal = false"
    />
    <!-- Conferma salvataggio associazioni VLAN-Sede -->
    <BaseModalAlert
      :show="showAssocSavedModal"
      title="Associazioni salvate"
      message="Le associazioni VLAN-Sede sono state salvate correttamente."
      ok-text="Ok"
      @confirm="showAssocSavedModal = false"
    />  </div>

  <BaseModalAlert
    :show="showDeleteAssocModal"
    title="Conferma eliminazione"
    message="Confermi la rimozione dell'associazione VLAN-Sede?"
    ok-text="Elimina"
    cancel-text="Annulla"
    @confirm="confirmDeleteAssociation"
    @cancel="cancelDeleteAssociation"
  />
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed } from "vue";
import BaseHeader from "@/components/base/BaseHeader.vue";
import BaseButton from "@/components/base/BaseButton.vue";
import BaseInput from "@/components/base/BaseInput.vue";
import BaseTextArea from "@/components/base/BaseTextArea.vue";
import BaseModal from "@/components/base/BaseModal.vue";
// import BaseLabel from "@/components/base/BaseLabel.vue";
import BaseSelect from "@/components/base/BaseSelect.vue";
// import BaseCalendar from "@/components/base/BaseCalendar.vue";
import BaseModalAlert from "@/components/base/BaseModalAlert.vue";
import BaseIcon from "@/components/base/BaseIcon.vue";
import {
  apiLoadVlans,
  apiCreateVlan,
  apiUpdateVlan,
  apiLoadSedi,
  apiLoadVlanSedi,
  apiInsertVlanSede,
  apiUpdateVlanSede,
  apiDeleteVlanSede,
} from "@/services/api";

type Vlan = {
  ID_VLAN: string;
  ID: number;
  NOME_VLAN: string;
  DESCRIZIONE: string;
  REFERENTE?: string;
};

/* ================== Stato ================== */
const vlanList = ref<Vlan[]>([]);
const selectedVlan = ref<Vlan | null>(null);
const originalVlan = ref<Vlan | null>(null);
const showUnsavedModal = ref(false);
const pendingSwitch = ref<Vlan | null>(null);
const showConfirmModal = ref(false);
const isDirty = ref(false);
const showAssociate = ref(false);
type AssocForm = {
  ID_SEDE: number | null;
  SUBNET: string;
  MASK: string;
  GATEWAY: string;
  IP_START: string;
  IP_END: string;
  BROADCAST: string;
  ID_ACL: number | null;
  NOTE: string;
  isNew: boolean;
};
const associationForms = ref<AssocForm[]>([]);
const associationForVlanId = ref<number | null>(null);
const associationForVlanIdNumber = ref<string | null>(null);
const sediOptions = ref<{ label: string; value: number }[]>([]);

// Stato riassunto associazioni per la vista principale
type AssocRow = {
  ID_SEDE: number | null;
  SUBNET: string;
  MASK: string;
  GATEWAY: string;
  IP_START: string;
  IP_END: string;
  BROADCAST: string;
  ID_ACL: number | null;
  NOTE: string;
};
const vlanAssociations = ref<AssocRow[]>([]);

/* ================== Computed ================== */
const displayNome = computed(() => selectedVlan.value?.NOME_VLAN ?? "");

// === Sidebar grouping (as in VlanDeviceView) ===
function vlanGroupKey(v: Vlan): string {
  return String(v.ID_VLAN ?? "");
}

const groupedVlans = computed(() => {
  const map = new Map<string, Vlan[]>();
  const order: string[] = [];
  for (const v of vlanList.value) {
    const key = vlanGroupKey(v);
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
    if (selectedVlan.value) {
      expandedKey.value = vlanGroupKey(selectedVlan.value);
    } else if (!expandedKey.value && groupedVlans.value.length) {
      expandedKey.value = groupedVlans.value[0].key;
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
  const base: string[] = [
    "px-4 py-2 cursor-pointer text-gray-800",

    "hover:bg-gray-300",
  ];
  if (v.ID === (selectedVlan.value?.ID ?? null)) base.push("bg-gray-300", "font-semibold");
  return base.join(" ");
}

/* ================== Load / Select ================== */
async function reload() {
  const { data } = await apiLoadVlans();
  const rows = Array.isArray((data as any)?.rows) ? (data as any).rows : [];
  vlanList.value = rows.map((r: any, i: number) => ({
    ID: r.ID ?? i,
    ID_VLAN: r.ID_VLAN ?? "",
    NOME_VLAN: r.NOME_VLAN ?? "",
    DESCRIZIONE: r.DESCRIZIONE ?? "",
    REFERENTE: r.REFERENTE ?? "",
  }));
  if (vlanList.value.length && !selectedVlan.value) selectVlan(vlanList.value[0]);
}

function selectVlan(v: Vlan) {

  selectedVlan.value = JSON.parse(JSON.stringify(v));
  originalVlan.value = JSON.parse(JSON.stringify(v));
  isDirty.value = false;
  // Aggiorna riassunto associazioni
  loadVlanAssociations();
}

/* ================== Cambio VLAN ================== */
function onVlanClick(v: Vlan) {
  if (isDirty.value) {
    pendingSwitch.value = v;
    showUnsavedModal.value = true;
    return;
  }
  selectVlan(v);
}

function confirmSwitch() {
  showUnsavedModal.value = false;
  if (pendingSwitch.value) {
    discardChanges();
    selectVlan(pendingSwitch.value);
    pendingSwitch.value = null;
  }
}

function discardChanges() {
  if (selectedVlan.value && originalVlan.value) {
    Object.assign(selectedVlan.value, JSON.parse(JSON.stringify(originalVlan.value)));
  }
}

async function openAssociateModal(v: Vlan) {
  // Identifica VLAN corrente
  const idValn = String((v as any)?.ID_VLAN ?? (v as any)?.ID_VLAN);
  const id = Number((v as any)?.ID ?? (v as any)?.ID);
  if (!id || Number.isNaN(id)) return;

  // Svuota subito il form e apri la modale (campi vuoti)
  associationForms.value = [getEmptyAssocForm()];
  associationForVlanId.value = id;
  associationForVlanIdNumber.value = idValn;
  showAssociate.value = true;

  // Carica opzioni sedi e, se presenti, le associazioni già configurate
  await loadSediOptions();
  const { data } = await apiLoadVlanSedi(id);
  const rows = Array.isArray((data as any)?.rows) ? (data as any).rows : [];
  if (rows.length) {
    associationForms.value = rows.map((r: any) => ({
      ID_SEDE: r.ID_SEDE != null ? Number(r.ID_SEDE) : null,
      SUBNET: r.SUBNET ?? "",
      MASK: r.MASK ?? "",
      GATEWAY: r.GATEWAY ?? "",
      IP_START: r.IP_START ?? "",
      IP_END: r.IP_END ?? "",
      BROADCAST: r.BROADCAST ?? "",
      ID_ACL: r.ID_ACL != null ? Number(r.ID_ACL) : null,
      NOTE: r.NOTE ?? "",
      isNew: false,
    }));
  } else {
    associationForms.value = [getEmptyAssocForm()];
  }
  // Carica anche il riassunto per la vista principale
  await loadVlanAssociations();
}

async function loadSediOptions(force = false) {
  if (!force && sediOptions.value.length) return;
  const { data } = await apiLoadSedi();
  const rows = Array.isArray((data as any)?.rows) ? (data as any).rows : [];

  sediOptions.value = rows
    .map((r: any) => ({
      value: Number(r.ID),
      label: r.NOME ?? String(r.ID),
    }))
    .filter((o: { value: unknown }) => !Number.isNaN(o.value));

}

// Helper per mostrare l'etichetta della sede
function getSedeLabel(id: number | null): string {
  if (id == null) return "Sede sconosciuta";
  const opt = sediOptions.value.find((o) => o.value === id);
  return opt?.label ?? `Sede ${id}`;
}

// Carica le associazioni della VLAN selezionata per il riassunto
async function loadVlanAssociations() {
  try {
    if (!selectedVlan.value) {
      vlanAssociations.value = [];
      return;
    }
    // Allinea con la modale: usa l'ID record VLAN
    const id = selectedVlan.value.ID;
    if (!id) {
      vlanAssociations.value = [];
      return;
    }
    // Assicura di avere le etichette sedi per il mapping
    await loadSediOptions();
    const { data } = await apiLoadVlanSedi(id);
    const rows = Array.isArray((data as any)?.rows) ? (data as any).rows : [];
    vlanAssociations.value = rows.map((r: any) => ({
      ID_SEDE: r.ID_SEDE != null ? Number(r.ID_SEDE) : (r.SEDE_ID != null ? Number(r.SEDE_ID) : null),
      SUBNET: r.SUBNET ?? "",
      MASK: r.MASK ?? "",
      GATEWAY: r.GATEWAY ?? "",
      IP_START: r.IP_START ?? "",
      IP_END: r.IP_END ?? "",
      BROADCAST: r.BROADCAST ?? "",
      ID_ACL: r.ID_ACL != null ? Number(r.ID_ACL) : null,
      NOTE: r.NOTE ?? "",
    }));
  } catch (e) {
    console.error(e);
    vlanAssociations.value = [];
  }
}

// utils/ipTools.ts
function calcNetworkDetails(subnet: string, maskInput?: string) {
  try {
    const toIP = (num: number) =>
      [num >>> 24, (num >> 16) & 255, (num >> 8) & 255, num & 255].join(".");

    const parseMaskToCidr = (maskStr?: string): number | null => {
      if (!maskStr) return null;
      // support numbers like "24"
      const asNum = Number(maskStr);
      if (!Number.isNaN(asNum) && asNum >= 0 && asNum <= 32) return asNum;
      // dotted decimal
      const parts = maskStr.split(".").map((n) => Number(n));
      if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return null;
      let maskInt = (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
      // validate contiguous ones
      const inv = ~maskInt >>> 0;
      if (((inv + 1) & inv) !== 0) return null; // not contiguous ones
      let cidr = 0;
      while (maskInt & 0x80000000) {
        cidr++;
        maskInt = (maskInt << 1) >>> 0;
      }
      return cidr;
    };

    // Accept formats: "ip/cidr", "ip" with optional maskInput, or default /24
    let ipStr = subnet.trim();
    let cidrStr: string | undefined;
    if (ipStr.includes("/")) {
      [ipStr, cidrStr] = ipStr.split("/");
    }

    const ipParts = ipStr.split(".").map((n) => Number(n));
    if (ipParts.length !== 4 || ipParts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
      throw new Error("IP non valido");
    }

    let cidrInt: number | null = null;
    if (cidrStr != null && cidrStr !== "") cidrInt = parseMaskToCidr(cidrStr);
    if (cidrInt == null) cidrInt = parseMaskToCidr(maskInput ?? undefined);
    if (cidrInt == null) cidrInt = 24; // default a /24 se non specificato

    const mask = (cidrInt === 0 ? 0 : 0xffffffff << (32 - cidrInt)) >>> 0;

    const ipInt = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];
    const network = ipInt & mask;
    const broadcast = network | (~mask >>> 0);

    // Calcolo gateway e range host con salvaguardia per reti molto piccole
    const totalHosts = Math.max(0, broadcast - network + 1);
    const firstHost = totalHosts >= 2 ? network + 1 : network;
    const secondHost = totalHosts >= 3 ? network + 2 : firstHost;
    const lastHost = totalHosts >= 2 ? broadcast - 1 : broadcast;

    return {
      SUBNET: `${toIP(network)}\\${cidrInt}`,
      MASK: toIP(mask >>> 0),
      GATEWAY: toIP(firstHost),
      BROADCAST: toIP(broadcast),
      IP_START: toIP(secondHost),
      IP_END: toIP(lastHost),
    };
  } catch (e) {
    console.log(e)
    return { SUBNET: subnet, MASK: "", GATEWAY: "", BROADCAST: "", IP_START: "", IP_END: "" };
  }
}

function closeAssociate() {
  showAssociate.value = false;
}

function getEmptyAssocForm(): AssocForm {
  return {
    ID_SEDE: null,
    SUBNET: "",
    MASK: "",
    GATEWAY: "",
    IP_START: "",
    IP_END: "",
    BROADCAST: "",
    ID_ACL: null,
    NOTE: "",
    isNew: true,
  };
}

async function addAssociationForm() {
  await loadSediOptions(true);
  associationForms.value.push(getEmptyAssocForm());
}

const showDeleteAssocModal = ref(false);
let pendingDeleteIndex: number | null = null;
function removeAssociationForm(index: number) {

  const f = associationForms.value[index];
  if (!f) return;
  if (f.isNew) {
    associationForms.value.splice(index, 1);
    return;
  }
  pendingDeleteIndex = index;
  showDeleteAssocModal.value = true;
}

async function confirmDeleteAssociation() {
  if (pendingDeleteIndex == null) return;
  const f = associationForms.value[pendingDeleteIndex];
  try {
    if (associationForVlanId.value && f?.ID_SEDE != null) {
      await apiDeleteVlanSede(associationForVlanId.value, f.ID_SEDE);
      const { data } = await apiLoadVlanSedi(associationForVlanId.value);
      const rows = Array.isArray((data as any)?.rows) ? (data as any).rows : [];
      associationForms.value = rows.map((r: any) => ({
        ID_SEDE: r.ID_SEDE != null ? Number(r.ID_SEDE) : (r.SEDE_ID != null ? Number(r.SEDE_ID) : null),
        SUBNET: r.SUBNET ?? "",
        MASK: r.MASK ?? "",
        GATEWAY: r.GATEWAY ?? "",
        IP_START: r.IP_START ?? "",
        IP_END: r.IP_END ?? "",
        BROADCAST: r.BROADCAST ?? "",
        ID_ACL: r.ID_ACL != null ? Number(r.ID_ACL) : null,
        NOTE: r.NOTE ?? "",
        isNew: false,
      }));
      // Aggiorna riassunto
      await loadVlanAssociations();
    }
  } finally {
    showDeleteAssocModal.value = false;
    pendingDeleteIndex = null;
  }
}

function cancelDeleteAssociation() {
  showDeleteAssocModal.value = false;
  pendingDeleteIndex = null;
}


/* ================== Watch su modifiche ================== */
watch(
  () => selectedVlan.value && { ...selectedVlan.value },
  () => {
    if (!selectedVlan.value || !originalVlan.value) return;
    const a = JSON.stringify(selectedVlan.value);
    const b = JSON.stringify(originalVlan.value);
    isDirty.value = a !== b;
  },
  { deep: true }
);

// Calcolo rete e normalizzazione SUBNET spostati in saveAllAssociations()

/* ================== Salvataggio ================== */

// Salva tutte le associazioni presenti nel form (insert per isNew, altrimenti update)
async function saveAllAssociations() {
  try {


    for (const f of associationForms.value) {

      if (!associationForVlanId.value || !f.ID_SEDE) continue;

      // Calcolo dettagli rete al salvataggio
      const details = calcNetworkDetails(String(f.SUBNET ?? ""), String(f.MASK ?? ""));
      const payload = {
        ID_VLAN: String(associationForVlanId.value),
        ID_SEDE: String(f.ID_SEDE),
        SUBNET: String(details.SUBNET ?? f.SUBNET ?? ""),
        MASK: String(details.MASK ?? f.MASK ?? ""),
        GATEWAY: String(details.GATEWAY ?? f.GATEWAY ?? ""),
        IP_START: String(details.IP_START ?? f.IP_START ?? ""),
        IP_END: String(details.IP_END ?? f.IP_END ?? ""),
        BROADCAST: String(details.BROADCAST ?? f.BROADCAST ?? ""),
        ID_ACL: f.ID_ACL != null ? String(f.ID_ACL) : "",
        NOTE: String(f.NOTE ?? ""),
      };

      if (f.isNew) {

        await apiInsertVlanSede(payload);
      } else {
        await apiUpdateVlanSede(payload);
      }
    }
    const { data } = await apiLoadVlanSedi(associationForVlanId.value as number);
    const rows = Array.isArray((data as any)?.rows) ? (data as any).rows : [];
    associationForms.value = rows.map((r: any) => ({
      ID_SEDE: r.ID_SEDE != null ? Number(r.ID_SEDE) : null,
      SUBNET: r.SUBNET ?? "",
      MASK: r.MASK ?? "",
      GATEWAY: r.GATEWAY ?? "",
      IP_START: r.IP_START ?? "",
      IP_END: r.IP_END ?? "",
      BROADCAST: r.BROADCAST ?? "",
      ID_ACL: r.ID_ACL != null ? Number(r.ID_ACL) : null,
      NOTE: r.NOTE ?? "",
      isNew: false,

    }));
    showAssociate.value = false;
    showAssocSavedModal.value = true;
    // Aggiorna riassunto nella vista principale
    await loadVlanAssociations();
  } catch (e) {
    console.error(e);
  }
}


async function save() {
  if (!selectedVlan.value) return;
  await apiUpdateVlan(selectedVlan.value.ID, {
    NOME_VLAN: selectedVlan.value.NOME_VLAN,
    DESCRIZIONE: selectedVlan.value.DESCRIZIONE,
    REFERENTE: selectedVlan.value.REFERENTE,
  });
  const idx = vlanList.value.findIndex((x) => x.ID === selectedVlan.value?.ID);
  if (idx !== -1) vlanList.value[idx] = JSON.parse(JSON.stringify(selectedVlan.value));
  originalVlan.value = JSON.parse(JSON.stringify(selectedVlan.value));
  isDirty.value = false;
  showConfirmModal.value = true;
}

/* ================== Nuova VLAN ================== */
const showAdd = ref(false);
const newVlan = reactive<Vlan>({
  ID: 0,
  ID_VLAN: "",
  NOME_VLAN: "",
  DESCRIZIONE: "",
  REFERENTE: "",
});

function openAdd() {
  // Reset campi ogni volta che si apre la modale
  newVlan.ID = 0;
  newVlan.ID_VLAN = "";
  newVlan.NOME_VLAN = "";
  newVlan.DESCRIZIONE = "";
  newVlan.REFERENTE = "";
  showAdd.value = true;
}
function closeAdd() {
  showAdd.value = false;
}
async function create() {
  await apiCreateVlan(newVlan);
  showAdd.value = false;
  await reload();
}

/* ================== Mount ================== */
onMounted(async () => {
  await reload();
  // Precarica opzioni sedi per mostrare etichette
  await loadSediOptions();
  await loadVlanAssociations();
});

/* ================== Conferma chiusura pagina ================== */
const beforeUnloadHandler = (e: BeforeUnloadEvent) => {
  if (isDirty.value) {
    e.preventDefault();
    e.returnValue = "";
  }
};
window.addEventListener("beforeunload", beforeUnloadHandler);
const showAssocSavedModal = ref(false);
</script>
