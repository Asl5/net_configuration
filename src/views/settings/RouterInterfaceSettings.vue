<template>
  <div class="min-h-screen h-dvh w-full flex flex-col bg-gray-50">
    <BaseHeader title="Gestione Interfacce Router" />
    <div class="flex flex-1 min-h-0 overflow-hidden">
      <!-- Sidebar -->
      <aside class="hidden md:flex md:w-72 border-r overflow-y-auto bg-white md:flex-col">
        <div class="p-4 border-b flex items-center justify-between">
          <h2 class="text-sm font-semibold text-gray-700">Interfacce</h2>
          <BaseButton size="xs" variant="primary" @click="openAddInterface">+</BaseButton>
        </div>
        <ul class="flex-1">
          <li
            v-for="r in routerList"
            :key="r.ID"
            @click="onRouterClick(r)"
            class="px-4 py-2 cursor-pointer hover:bg-gray-300 text-gray-700"
            :class="r.ID === selectedRouter?.ID ? 'bg-gray-400 font-semibold text-gray-100' : ''"
          >
            {{ r.NOME_INTERFACCIA }}
          </li>
        </ul>
      </aside>

      <!-- Dettaglio -->
      <main class="flex-1 overflow-auto p-4 md:p-6">
        <div v-if="selectedRouter" class="w-full space-y-6">
          <div class="w-full bg-white rounded-lg shadow p-4 md:p-6 space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-gray-800">
                {{ selectedRouter.NOME_INTERFACCIA }}
                <span v-if="isDirty" class="ml-2 text-xs text-orange-600">
                  (modifiche non salvate)
                </span>
              </h2>
            </div>

            <div class="grid grid-cols-5 gap-4 items-start">
              <BaseInput v-model="selectedRouter.NOME_INTERFACCIA" label="Interfaccia" />

              <BaseInput
                v-model="selectedRouter.IP_ADDRESS"
                label="IP Address"
                :pattern="/^((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\.){3}(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)$/"
                pattern-message="IP non valido"
                validate-on="input"
                :allowed-chars="/[0-9.]/"
                inputmode="decimal"
              />

              <BaseInput
                v-model="selectedRouter.SUBNET_MASK"
                label="Mask"
                :pattern="/^((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\.){3}(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)$/"
                pattern-message="Mask non valida (es. 255.255.255.0)"
                validate-on="input"
                :allowed-chars="/[0-9.]/"
                inputmode="decimal"
              />

              <BaseSelect
                v-model="selectedRouter.ID_ACL"
                :options="aclOptions"
                label="ACL"
                placeholder="Seleziona ACL"
              />
              <BaseInput v-model="selectedRouter.DEVICE_NAME" label="Apparato" />
            </div>

            <div class="grid grid-cols-2 gap-4 mt-4">

              <BaseTextArea v-model="selectedRouter.DESCRIZIONE" label="Descrizione" rows="3"    class="text-xs h-36"/>
               <BaseTextArea
                v-model="selectedRouter.CONFIG_TESTO"
                label="Configurazione completa"
                rows="3"
                class="text-xs h-36"
              />
            </div>



            <div class="flex mt-4 md:justify-end">
              <BaseButton size="sm" variant="primary" @click="saveRouter">Salva</BaseButton>
            </div>
          </div>
        </div>

        <div v-else class="hidden md:block text-gray-500">
          Seleziona unï¿½?Tinterfaccia dalla lista a sinistra.
        </div>
      </main>
    </div>

    <!-- Modale nuova interfaccia -->
    <BaseModal v-model="showAddInterface" title="Nuova Interfaccia Router" height="65vh" max-width="50vw">
      <div class="grid grid-cols-2 sm:grid-cols-2 gap-4">
        <BaseSelect
          v-model="newRouter.ASSOC_ID"
          :options="assocOptions"
          label="Sede - VLAN"
          placeholder="Sede-VLAN"
        />
        <BaseInput v-model="newRouter.NOME_INTERFACCIA" label="Nome interfaccia" />
        <BaseInput
          v-model="newRouter.IP_ADDRESS"
          label="IP Address"
          :pattern="/^((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\.){3}(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)$/"
          pattern-message="IP non valido"
          validate-on="input"
          :allowed-chars="/[0-9.]/"
          inputmode="decimal"
        />
        <BaseInput
          v-model="newRouter.SUBNET_MASK"
          label="Mask"
          :pattern="/^((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\.){3}(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)$/"
          pattern-message="Mask non valida (es. 255.255.255.0)"
          validate-on="input"
          :allowed-chars="/[0-9.]/"
          inputmode="decimal"
        />
        <BaseSelect
          v-model="newRouter.ID_ACL"
          :options="aclOptions"
          label="ACL"
          placeholder="Seleziona ACL"
        />
        <BaseInput v-model="newRouter.DEVICE_NAME" label="Apparato" />
      </div>
<div class="grid grid-cols-2 sm:grid-cols-2 gap-4 mt-1">
      <BaseTextArea
        v-model="newRouter.DESCRIZIONE"
        label="Descrizione"
        class="w-full resize-y h-28"
      />
      <BaseTextArea
        v-model="newRouter.CONFIG_TESTO"
        label="Configurazione completa"
        class="font-mono text-xs w-full resize-y h-28"
      /></div>
      <div class="mt-3 flex justify-end gap-2 w-full">
        <BaseButton variant="secondary" @click="closeAddInterface">Annulla</BaseButton>
        <BaseButton variant="primary" @click="createRouter">Crea</BaseButton>
      </div>
    </BaseModal>

    <!-- Modale ACL -->
    <BaseModal
      v-model="showAcl"
      title="Access Control List (ACL)"
      height="80vh"
      body-class="flex flex-col !pr-4 !pt-0 !pb-2 h-full"
    >
      <!-- Header -->
      <div
        class="sticky top-0 z-10 -mx-4 p-2 flex items-center justify-between bg-gray-200 border-b shadow"
      >
        <BaseLabel
          :text="`ACL ${selectedAcl?.NUMERO ?? ''}`"
          as="h1"
          size="lg"
          weight="bold"
          textColor="text-gray-700"
        />
        <BaseButton size="xs" variant="primary" @click="openAclRulesModal">Regole</BaseButton>
      </div>

      <div class="flex-1 overflow-y-auto space-y-3 p-2">
        <BaseInput v-model.number="selectedAcl.NUMERO" label="Numero ACL" type="number" />
        <BaseSelect
          v-model="selectedAcl.DIREZIONE"
          label="Direzione"
          :options="[
            { value: 'IN', label: 'IN' },
            { value: 'OUT', label: 'OUT' },
          ]"
        />
        <BaseTextArea
          v-model="selectedAcl.DESCRIZIONE"
          label="Descrizione"
          rows="2"
          placeholder="Descrizione sintetica"
        />
        <BaseTextArea
          v-model="selectedAcl.TESTO_CONFIG"
          label="Blocco configurazione"
          class="font-mono text-xs"
          rows="10"
        />
      </div>

      <div class="sticky bottom-0 bg-white border-t pt-2 flex justify-end gap-2">
        <BaseButton variant="secondary" @click="showAcl = false">Chiudi</BaseButton>
        <BaseButton variant="primary" @click="saveAcl">Salva</BaseButton>
      </div>
    </BaseModal>

    <!-- Modale ACL Rules -->
    <!-- <BaseModal
      v-model="showAclRules"
      title="Regole ACL"
      height="80vh"
      body-class="flex flex-col h-full"
    >
      <div
        class="sticky top-0 z-10 -mx-4 p-2 flex items-center justify-between bg-gray-200 border-b shadow"
      >
        <BaseLabel
          :text="`ACL ${selectedAcl?.NUMERO ?? ''} - Regole`"
          as="h1"
          size="lg"
          weight="bold"
          textColor="text-gray-700"
        />
        <BaseButton size="xs" variant="primary" @click="addAclRule">Aggiungi</BaseButton>
      </div>

      <div class="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        <div
          v-for="(r, idx) in aclRules"
          :key="idx"
          class="bg-white rounded-lg shadow p-2 md:p-3 space-y-2"
        >
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
            <BaseSelect
              v-model="r.AZIONE"
              :options="[
                { value: 'PERMIT', label: 'PERMIT' },
                { value: 'DENY', label: 'DENY' },
              ]"
              label="Azione"
            />
            <BaseInput v-model="r.PROTOCOLLO" label="Protocollo" />
            <BaseInput v-model="r.ORIGINE" label="Origine" />
            <BaseInput v-model="r.DESTINAZIONE" label="Destinazione" />
            <BaseInput v-model="r.PORTA_DESTINAZIONE" label="Porta Dest." />
          </div>
          <div class="flex justify-end">
            <BaseButton size="xs" variant="danger" @click="removeAclRule(idx)">Rimuovi</BaseButton>
          </div>
        </div>
      </div>

      <div class="sticky bottom-0 bg-white border-t pt-2 flex justify-end gap-2">
        <BaseButton variant="secondary" @click="showAclRules = false">Chiudi</BaseButton>
        <BaseButton variant="primary" @click="saveAclRules">Salva</BaseButton>
      </div>
     </BaseModal> -->
   </div>

  <BaseModalAlert
    :show="alert.show"
    :title="alert.title"
    :message="alert.message"
    ok-text="OK"
    :auto-close-ms="alert.isError ? undefined : 1800"
    @confirm="closeAlert"
    @cancel="closeAlert"
  />
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from "vue";
import BaseHeader from "@/components/base/BaseHeader.vue";
import BaseButton from "@/components/base/BaseButton.vue";
import BaseInput from "@/components/base/BaseInput.vue";
import BaseTextArea from "@/components/base/BaseTextArea.vue";
import BaseModal from "@/components/base/BaseModal.vue";
import BaseLabel from "@/components/base/BaseLabel.vue";
import BaseModalAlert from "@/components/base/BaseModalAlert.vue";
import BaseSelect from "@/components/base/BaseSelect.vue";
import {
  apiLoadRouterInterfaces,
  apiCreateRouterInterface,
  apiUpdateRouterInterface,
  apiLoadAcl,
  apiUpdateAcl,
  apiCreateAcl,
  apiLoadAclRules,
  // apiUpdateAclRule,
  // apiCreateAclRule,
  // apiDeleteAclRule,
  apiLoadRouterInterfaceAssociations,
} from "@/services/api";

/* ===== Stato principale ===== */
const routerList = ref<any[]>([]);
const selectedRouter = ref<any | null>(null);
const originalRouter = ref<any | null>(null);
const isDirty = ref(false);

const showAddInterface = ref(false);
const newRouter = reactive({
  ASSOC_ID: null,
  NOME_INTERFACCIA: "",
  IP_ADDRESS: "",
  SUBNET_MASK: "",
  ID_ACL: null as number | null,
  DEVICE_NAME: "",
  DESCRIZIONE: "",
  CONFIG_TESTO: "",
});

// Opzioni combo associazione VLAN-SEDE
const assocOptions = ref<{ value: number; label: string }[]>([]);
async function loadAssocOptions() {
  const { data } = await apiLoadRouterInterfaceAssociations();

  const rows = Array.isArray((data as any)?.rows) ? (data as any).rows : [];
  assocOptions.value = rows
    .map((r: any) => ({
      value: Number(r.ID),
      label: `${r.ID_VLAN}: ${r.NOME_SEDE ?? r.ID_SEDE} - ${r.NOME_VLAN ?? r.ID_VLAN}`,
    }))
    .filter((o: any) => !Number.isNaN(o.value));

}

/* ===== ACL ===== */
const showAcl = ref(false);
const selectedAcl = reactive<any>({
  NUMERO: null,
  DESCRIZIONE: "",
  DIREZIONE: "IN",
  TESTO_CONFIG: "",
});
const showAclRules = ref(false);
const aclRules = ref<any[]>([]);

// Alert stato
const alert = reactive({ show: false, title: "", message: "", isError: false });
function closeAlert() {
  alert.show = false;
}
function showSuccess(message: string, title = "Operazione riuscita") {
  alert.title = title;
  alert.message = message;
  alert.isError = false;
  alert.show = true;
}
function showError(message: string, title = "Errore") {
  alert.title = title;
  alert.message = message;
  alert.isError = true;
  alert.show = true;
}

/* ======= Funzioni ======= */
async function reloadRouters() {
  const { data } = await apiLoadRouterInterfaces();
    routerList.value = Array.isArray((data as any)?.rows) ? (data as any).rows : [];
  if (routerList.value.length && !selectedRouter.value) selectRouter(routerList.value[0]);
}

/* ===== Stato ===== */
const aclOptions = ref<{ value: number; label: string }[]>([]);

/* ===== Caricamento opzioni ACL ===== */
async function loadAclOptions() {
  const { data } = await apiLoadAcl(); // deve restituire tutte le ACL (non una sola)

  const rows = Array.isArray((data as any)?.rows) ? (data as any).rows : [];
  aclOptions.value = rows
    .map((r: any) => ({
      value: Number(r.ID),
      label: `#${r.NUMERO} - ${r.DESCRIZIONE ?? ""}`,
    }))
    .filter((o: any) => !Number.isNaN(o.value));

}

/* ===== Apertura modale nuova interfaccia ===== */
function openAddInterface() {
  Promise.all([loadAssocOptions(), loadAclOptions()]).finally(() => {
    showAddInterface.value = true;
  });
}

function selectRouter(r: any) {
  selectedRouter.value = JSON.parse(JSON.stringify(r));
  if (selectedRouter.value) {
    const v = selectedRouter.value.ID;
    selectedRouter.value.ID = v !== null && v !== undefined && v !== "" ? Number(v) : null;
    const vAcl = (selectedRouter.value as any).ID_ACL;
    (selectedRouter.value as any).ID_ACL = vAcl !== null && vAcl !== undefined && vAcl !== "" ? Number(vAcl) : null;
  }
  // mantieni original allineato al tipo normalizzato per confronti corretti
  originalRouter.value = JSON.parse(JSON.stringify(selectedRouter.value));
  isDirty.value = false;

}

function onRouterClick(r: any) {
  if (isDirty.value && selectedRouter.value?.ID !== r.ID) {
    if (!confirm("Hai modifiche non salvate. Vuoi procedere?")) return;
  }
  selectRouter(r);
}

async function saveRouter() {
  if (!selectedRouter.value) return;
  try {
    await apiUpdateRouterInterface(selectedRouter.value.ID, selectedRouter.value);
    isDirty.value = false;
    await reloadRouters();
    showSuccess("Interfaccia salvata correttamente.");
  } catch (e: any) {
    showError(e?.message || "Salvataggio interfaccia fallito.");
  }
}

function closeAddInterface() {
  showAddInterface.value = false;
}
async function createRouter() {
  const payload = {
    ...newRouter,
    ID_ACL: newRouter.ID_ACL != null ? Number(newRouter.ID_ACL) : null,
  } as any;
  try {

    await apiCreateRouterInterface(payload);
    showAddInterface.value = false;
    await reloadRouters();
    showSuccess("Interfaccia creata correttamente.");
  } catch (e: any) {
    showError(e?.message || "Creazione interfaccia fallita.");
  }
}

async function saveAcl() {
  if (!selectedAcl.NUMERO) return;
  try {
    if (selectedAcl.ID) await apiUpdateAcl(selectedAcl);
    else await apiCreateAcl(selectedAcl);
    showAcl.value = false;
    showSuccess("ACL salvata correttamente.");
  } catch (e: any) {
    showError(e?.message || "Salvataggio ACL fallito.");
  }
}

async function openAclRulesModal() {

  if (!selectedAcl.NUMERO) return;
  const { data } = await apiLoadAclRules(selectedAcl.NUMERO);

  aclRules.value = Array.isArray(data?.rows) ? data.rows : [];
  showAclRules.value = true;
}

// function addAclRule() {
//   aclRules.value.push({
//     AZIONE: "PERMIT",
//     PROTOCOLLO: "",
//     ORIGINE: "",
//     DESTINAZIONE: "",
//     PORTA_DESTINAZIONE: "",
//     isNew: true,
//   });
// }

// function removeAclRule(idx: number) {
//   const r = aclRules.value[idx];
//   if (!r) return;
//   if (r.isNew) aclRules.value.splice(idx, 1);
//   else apiDeleteAclRule(r.ID).then(() => aclRules.value.splice(idx, 1));
// }

// async function saveAclRules() {
//   try {
//     for (const r of aclRules.value) {
//       if (r.isNew) await apiCreateAclRule({ ...r, ACL_ID: selectedAcl.ID });
//       else await apiUpdateAclRule(r);
//     }
//     showAclRules.value = false;
//     showSuccess("Regole ACL salvate correttamente.");
//   } catch (e: any) {
//     showError(e?.message || "Salvataggio regole ACL fallito.");
//   }
// }

/* ===== Watch ===== */
watch(
  () => selectedRouter.value,
  (newVal, oldVal) => {
    if (!newVal || !oldVal) return;
    isDirty.value = JSON.stringify(newVal) !== JSON.stringify(originalRouter.value);
  },
  { deep: true }
);

onMounted(() => {
  // Carica interfacce e opzioni ACL per i select
  Promise.all([reloadRouters(), loadAclOptions()]);
});

// Debug: traccia il valore ACL e la corrispondenza con le options
watch(
  () => (selectedRouter.value as any)?.ID_ACL ?? null,
  (newVal, oldVal) => {
    const match = aclOptions.value.find((o) => o.value === newVal) || null;
    console.log('[RouterInterfaceSettings] ACL v-model changed', {
      newValue: newVal,
      oldValue: oldVal ?? null,
      optionsCount: aclOptions.value.length,
      hasMatch: !!match,
      matchedOption: match,
    });
  },
  { immediate: true }
);

watch(
  aclOptions,
  (opts) => {
    const id = (selectedRouter.value as any)?.ID_ACL ?? null;
    const match = opts.find((o) => o.value === id) || null;
    console.log('[RouterInterfaceSettings] ACL options updated', {
      currentValue: id,
      optionsCount: opts.length,
      hasMatch: !!match,
    });
  },
  { deep: false }
);
</script>
