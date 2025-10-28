<template>
  <div class="min-h-screen h-dvh w-full flex flex-col bg-gray-50">
    <BaseHeader title="Gestione VLAN" />
    <div class="flex flex-1 min-h-0 overflow-hidden">
      <!-- Sidebar -->
      <aside class="hidden md:flex md:w-72 border-r overflow-y-auto bg-white md:flex-col">
        <div class="p-4 border-b flex items-center justify-between">
          <h2 class="text-sm font-semibold text-gray-700">VLAN</h2>
          <BaseButton size="xs" variant="primary" @click="openAdd">+</BaseButton>
        </div>
        <ul class="flex-1">
          <li
            v-for="v in vlanList"
            :key="v.ID_VLAN"
            @click="onVlanClick(v)"
            class="px-4 py-2 cursor-pointer hover:bg-gray-300 text-gray-700"
            :class="
              v.ID_VLAN === selectedVlan?.ID_VLAN ? 'bg-gray-400 font-semibold text-gray-100' : ''
            "
          >
            {{ v.NOME_VLAN }}
          </li>
        </ul>
      </aside>

      <!-- Dettaglio -->
      <main class="flex-1 overflow-auto p-4 md:p-6">
        <div v-if="selectedVlan" class="w-full space-y-6">
          <div class="w-full bg-white rounded-lg shadow p-4 md:p-6 space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-gray-800">
                {{ displayNome }}
                <span v-if="isDirty" class="ml-2 text-xs text-orange-600"
                  >(modifiche non salvate)</span
                >
              </h2>
              <BaseButton size="md" variant="third" @click="openAssociateModal(selectedVlan!)">
                Associa a sedi
              </BaseButton>
            </div>

            <div class="grid grid-cols-12 gap-4 items-start">
              <div class="col-span-2">
                <BaseInput
                  v-model.number="selectedVlan.ID_VLAN"
                  label="ID VLAN"
                  type="number"
                  :disabled="true"
                />
              </div>
              <div class="col-span-4">
                <BaseInput v-model="selectedVlan.NOME_VLAN" label="Nome VLAN" size="md" />
              </div>
              <div class="col-span-6">
                <BaseTextArea
                  v-model="selectedVlan.DESCRIZIONE"
                  label="Descrizione"
                  placeholder="Descrizione"
                  class="w-full resize-y min-h-14"
                />
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
    <BaseModal v-model="showAdd" title="Nuova Vlan" height="40vh">
      <div class="grid grid-cols-2 md:grid-cols-2 gap-4">
        <BaseInput v-model.number="newVlan.ID_VLAN" label="ID VLAN" type="number" />
        <BaseInput v-model="newVlan.NOME_VLAN" label="Nome VLAN" />
      </div>
      <div class="grid grid-cols-1 md:grid-cols-1 gap-4">
        <BaseTextArea
          v-model="newVlan.DESCRIZIONE"
          label="Descrizione"
          placeholder="Descrizione"
          class="w-full resize-y min-h-28"
        />
      </div>
      <div class="mt-3 flex justify-end gap-2 w-full">
        <BaseButton variant="secondary" @click="closeAdd">Annulla</BaseButton>
        <BaseButton variant="primary" @click="create">Crea</BaseButton>
      </div>
    </BaseModal>

    <!-- Modal associazione VLAN -> Sede -->
<BaseModal
  v-model="showAssociate"
  title="Associa VLAN a Sede"
  height="75vh"
  body-class="flex flex-col !pr-4 !pt-0 !pb-2 h-full"
>
  <!-- HEADER STICKY -->
  <div
    class="sticky top-0 z-10 -mx-4 p-2 pt-2 flex items-center justify-between bg-gray-200 border-b border-gray-200 shadow-lg"
  >
     <BaseLabel
        as="h1"
        :text="`ID VLAN:  ${ associationForVlanId  }`"
        size="lg"
        weight="bold" textColor="text-gray-700"
      />

    <BaseButton size="xs" variant="primary" @click="addAssociationForm">Aggiungi</BaseButton>
  </div>

  <!-- CORPO SCORREVOLE -->
  <div class="flex-1 overflow-y-auto px-1 py-2 space-y-6">
    <div
      v-for="(form, idx) in associationForms"
      :key="idx"
      class=" w-full bg-white rounded-lg shadow-lg p-2 md:p-2 space-y-4"
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
    class="sticky bottom-0 z-10 -mx-4 pt-2 pr-2 pb-0 flex justify-end gap-2 bg-white border-t border-gray-200"
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
import BaseLabel from "@/components/base/BaseLabel.vue";
import BaseSelect from "@/components/base/BaseSelect.vue";
// import BaseCalendar from "@/components/base/BaseCalendar.vue";
import BaseModalAlert from "@/components/base/BaseModalAlert.vue";
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
  ID_VLAN: number;
  NOME_VLAN: string;
  DESCRIZIONE: string;
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
const sediOptions = ref<{ label: string; value: number }[]>([]);

/* ================== Computed ================== */
const displayNome = computed(() => selectedVlan.value?.NOME_VLAN ?? "");

/* ================== Load / Select ================== */
async function reload() {
  const { data } = await apiLoadVlans();
  const rows = Array.isArray((data as any)?.rows) ? (data as any).rows : [];
  vlanList.value = rows.map((r: any, i: number) => ({
    ID_VLAN: r.ID_VLAN ?? i,
    NOME_VLAN: r.NOME_VLAN ?? "",
    DESCRIZIONE: r.DESCRIZIONE ?? "",
  }));
  if (vlanList.value.length && !selectedVlan.value) selectVlan(vlanList.value[0]);
}

function selectVlan(v: Vlan) {
  console.log(v);
  selectedVlan.value = JSON.parse(JSON.stringify(v));
  originalVlan.value = JSON.parse(JSON.stringify(v));
  isDirty.value = false;
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
  console.debug("openAssociateModal arg:", v);
  const id = Number((v as any)?.ID_VLAN ?? (v as any)?.ID_VLAN);
  if (!id || Number.isNaN(id)) {
    console.warn(
      "ID_VLAN non valido in openAssociateModal:",
      (v as any)?.ID_VLAN,
      (v as any)?.ID_VLAN
    );
    return;
  }
  associationForVlanId.value = id;
  await loadSediOptions();
  // Carica associazioni esistenti (query 16)
  const { data } = await apiLoadVlanSedi(id);
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
  if (!associationForms.value.length) associationForms.value = [getEmptyAssocForm()];
  showAssociate.value = true;
}

async function loadSediOptions(force = false) {
  if (!force && sediOptions.value.length) return;
  const { data } = await apiLoadSedi();
  const rows = Array.isArray((data as any)?.rows) ? (data as any).rows : [];
  console.log(rows);
  sediOptions.value = rows
    .map((r: any) => ({
      value: Number(r.ID),
      label: r.NOME ?? String(r.ID),
    }))
    .filter((o: { value: unknown }) => !Number.isNaN(o.value));
  console.log(sediOptions);
}

// utils/ipTools.ts
function calcNetworkDetails(subnet: string) {
  try {
    const [ip, cidr] = subnet.split("/");
    const cidrInt = parseInt(cidr, 10);
    const mask = 0xffffffff << (32 - cidrInt);

    const ipParts = ip.split(".").map((n) => parseInt(n, 10));
    const ipInt = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];

    const network = ipInt & mask;
    const broadcast = network | (~mask >>> 0);

    const toIP = (num: number) =>
      [num >>> 24, (num >> 16) & 255, (num >> 8) & 255, num & 255].join(".");

    return {
      MASK: toIP(mask >>> 0),
      GATEWAY: toIP(network + 1),
      BROADCAST: toIP(broadcast),
      IP_START: toIP(network + 2),
      IP_END: toIP(broadcast - 1),
    };
  } catch (e) {
    return { e };
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
  console.log("aega");
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
        ID_SEDE: r.SEDE_ID != null ? Number(r.SEDE_ID) : null,
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

// async function saveAssociationAt(index: number) {
//   const f = associationForms.value[index];
//   console.log("dsagrh");
//   console.log(associationForVlanId.value);
//   console.log(f.ID_SEDE);
//   try {
//     if (!associationForVlanId.value || !f.ID_SEDE) return;
//     const payload = {
//       ID_VLAN: String(associationForVlanId.value),
//       ID_SEDE: String(f.ID_SEDE),
//       SUBNET: String(f.SUBNET ?? ""),
//       MASK: String(f.MASK ?? ""),
//       GATEWAY: String(f.GATEWAY ?? ""),
//       IP_START: String(f.IP_START ?? ""),
//       IP_END: String(f.IP_END ?? ""),
//       BROADCAST: String(f.BROADCAST ?? ""),
//       ID_ACL: f.ID_ACL != null ? String(f.ID_ACL) : "",
//       NOTE: String(f.NOTE ?? ""),
//     };
//     console.log(payload);
//     console.log("prova2222");
//     console.log(f.isNew);
//     if (f.isNew) {
//       console.log("prova");
//       await apiInsertVlanSede(payload);
//       // opzionale: reload elenco esistente
//       const { data } = await apiLoadVlanSedi(associationForVlanId.value);
//       const rows = Array.isArray((data as any)?.rows) ? (data as any).rows : [];
//       associationForms.value = rows.map((r: any) => ({
//         ID_SEDE: r.ID_SEDE != null ? Number(r.ID_SEDE) : null,
//         SUBNET: r.SUBNET ?? "",
//         MASK: r.MASK ?? "",
//         GATEWAY: r.GATEWAY ?? "",
//         IP_START: r.IP_START ?? "",
//         IP_END: r.IP_END ?? "",
//         BROADCAST: r.BROADCAST ?? "",
//         ID_ACL: r.ID_ACL != null ? Number(r.ID_ACL) : null,
//         NOTE: r.NOTE ?? "",
//         isNew: false,
//       }));
//     } else {
//       await apiUpdateVlanSede(payload);
//       const { data } = await apiLoadVlanSedi(associationForVlanId.value);
//       const rows = Array.isArray((data as any)?.rows) ? (data as any).rows : [];
//       associationForms.value = rows.map((r: any) => ({
//         ID_SEDE: r.ID_SEDE != null ? Number(r.ID_SEDE) : null,
//         SUBNET: r.SUBNET ?? "",
//         MASK: r.MASK ?? "",
//         GATEWAY: r.GATEWAY ?? "",
//         IP_START: r.IP_START ?? "",
//         IP_END: r.IP_END ?? "",
//         BROADCAST: r.BROADCAST ?? "",
//         ID_ACL: r.ID_ACL != null ? Number(r.ID_ACL) : null,
//         NOTE: r.NOTE ?? "",
//         isNew: false,
//       }));
//     }
//   } catch (e) {
//     console.log(e);
//   }
// }

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

watch(
  () => associationForms.value.map((f) => f.SUBNET),
  (newSubs, oldSubs) => {
    newSubs.forEach((subnet, idx) => {
      if (subnet && subnet !== oldSubs?.[idx]) {
        const details = calcNetworkDetails(subnet);
        Object.assign(associationForms.value[idx], details);
      }
    });
  },
  { deep: true }
);

/* ================== Salvataggio ================== */

// Salva tutte le associazioni presenti nel form (insert per isNew, altrimenti update)
async function saveAllAssociations() {
  try {
    for (const f of associationForms.value) {
      if (!associationForVlanId.value || !f.ID_SEDE) continue;
      const payload = {
        ID_VLAN: String(associationForVlanId.value),
        ID_SEDE: String(f.ID_SEDE),
        SUBNET: String(f.SUBNET ?? ""),
        MASK: String(f.MASK ?? ""),
        GATEWAY: String(f.GATEWAY ?? ""),
        IP_START: String(f.IP_START ?? ""),
        IP_END: String(f.IP_END ?? ""),
        BROADCAST: String(f.BROADCAST ?? ""),
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
  } catch (e) {
    console.error(e);
  }
}


async function save() {
  if (!selectedVlan.value) return;
  await apiUpdateVlan(selectedVlan.value.ID_VLAN, {
    NOME_VLAN: selectedVlan.value.NOME_VLAN,
    DESCRIZIONE: selectedVlan.value.DESCRIZIONE,
  });
  const idx = vlanList.value.findIndex((x) => x.ID_VLAN === selectedVlan.value?.ID_VLAN);
  if (idx !== -1) vlanList.value[idx] = JSON.parse(JSON.stringify(selectedVlan.value));
  originalVlan.value = JSON.parse(JSON.stringify(selectedVlan.value));
  isDirty.value = false;
  showConfirmModal.value = true;
}

/* ================== Nuova VLAN ================== */
const showAdd = ref(false);
const newVlan = reactive<Vlan>({
  ID_VLAN: 0,
  NOME_VLAN: "",
  DESCRIZIONE: "",
});

function openAdd() {
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
