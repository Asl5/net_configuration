<template>
  <div class="min-h-screen h-dvh w-full flex flex-col bg-gray-50">
    <BaseHeader title="Gestione Sedi" />
    <div class="flex flex-1 min-h-0 overflow-hidden">
      <!-- Sidebar -->
      <aside class="hidden md:flex md:w-72 border-r overflow-y-auto bg-white md:flex-col">
        <div class="p-4 border-b flex items-center justify-between">
          <h2 class="text-sm font-semibold text-gray-700">Sedi</h2>
          <BaseButton size="xs" variant="primary" @click="openAdd">+</BaseButton>
        </div>
        <ul class="flex-1">
          <li
            v-for="s in sedi"
            :key="s.id"
            @click="onSedeClick(s)"
            class="px-4 py-2 cursor-pointer hover:bg-gray-300 text-gray-700"
            :class="s.id === selectedSede?.id ? 'bg-gray-400 font-semibold text-gray-100' : ''"
          >
            {{ s.NOME }} <span class="text-xs opacity-70">({{ s.COMUNE }})</span>
          </li>
        </ul>
      </aside>

      <!-- Dettaglio -->
      <main class="flex-1 overflow-auto p-4 md:p-6">
        <div v-if="selectedSede" class="w-full space-y-6">
          <div class="w-full bg-white rounded-lg shadow p-4 md:p-6 space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-gray-800">
                {{ displayNome }}
                <span v-if="isDirty" class="ml-2 text-xs text-orange-600">(modifiche non salvate)</span>
              </h2>

            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <BaseInput v-model="selectedSede.NOME" label="Nome" />
              <BaseInput v-model="selectedSede.COMUNE" label="Comune" />
              <BaseInput v-model="selectedSede.INDIRIZZO" label="Indirizzo" />
              <BaseInput v-model="selectedSede.ORARIO_SEDE" label="Orario sede" />
              <BaseInput v-model="selectedSede.COD_UNIVOCO_INFRATEL" label="Cod. univoco Infratel" />
              <BaseInput v-model="selectedSede.CONNETTIVITA" label="Connettività" />
              <BaseInput v-model="selectedSede.NOTE" label="Note" />

              <BaseCalendar
                v-model="selectedSede.DATA_AGGIORNAMENTO"
                label="Data aggiornamento"

              />
                 <div class="flex items-center gap-3 mt-6">
                <input id="attiva" type="checkbox" v-model="attivaBool" class="h-4 w-4" />
                <label for="attiva" class="text-sm text-gray-700">Attiva</label>
              </div>
            </div>
             <div class="flex mt-4 md:justify-end">
                <BaseButton size="sm" variant="primary" @click="save">Salva</BaseButton>
              </div>
          </div>
        </div>

        <div v-else class="hidden md:block text-gray-500">
          Seleziona una sede dalla lista a sinistra.
        </div>
      </main>
    </div>

    <!-- Modale nuova sede -->
    <transition name="fade">
      <div v-if="showAdd" class="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
        <div class="bg-white rounded-lg shadow-xl p-4 md:p-6 w-full max-w-xl">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Nuova sede</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BaseInput v-model="newSede.NOME" label="Nome" />
            <BaseInput v-model="newSede.COMUNE" label="Comune" />
            <BaseInput v-model="newSede.INDIRIZZO" label="Indirizzo" />
            <BaseInput v-model="newSede.ORARIO_SEDE" label="Orario sede" />
            <BaseInput v-model="newSede.COD_UNIVOCO_INFRATEL" label="Cod. univoco Infratel" />
            <BaseInput v-model="newSede.CONNETTIVITA" label="Connettività" />
            <BaseInput v-model="newSede.NOTE" label="Note" />
            <div class="flex items-center gap-3 mt-6">
              <input id="attiva2" type="checkbox" v-model="newAttivaBool" class="h-4 w-4" />
              <label for="attiva2" class="text-sm text-gray-700">Attiva</label>
            </div>
          </div>
          <div class="flex justify-end mt-6 gap-2">
            <BaseButton variant="secondary" @click="closeAdd">Annulla</BaseButton>
            <BaseButton variant="primary" @click="create">Crea</BaseButton>
          </div>
        </div>
      </div>
    </transition>

    <!-- Modali conferma -->
    <BaseModalAlert
      :show="showConfirmModal"
      title="Salvataggio riuscito"
      message="La sede è stata salvata correttamente."
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed } from "vue";
import BaseHeader from "@/components/base/BaseHeader.vue";
import BaseButton from "@/components/base/BaseButton.vue";
import BaseInput from "@/components/base/BaseInput.vue";
import BaseCalendar from "@/components/base/BaseCalendar.vue";
import BaseModalAlert from "@/components/base/BaseModalAlert.vue";
import { apiLoadSedi, apiCreateSede, apiUpdateSede } from "@/services/api";

type Sede = {
  id: number;
  NOME: string;
  COMUNE: string;
  INDIRIZZO: string;
  ORARIO_SEDE: string;
  COD_UNIVOCO_INFRATEL: string;
  CONNETTIVITA: string;
  NOTE: string | null;
  ATTIVA: number;
  DATA_AGGIORNAMENTO: string;
};

/* ================== Stato ================== */
const sedi = ref<Sede[]>([]);
const selectedSede = ref<Sede | null>(null);
const originalSede = ref<Sede | null>(null);
const showUnsavedModal = ref(false);
const pendingSwitch = ref<Sede | null>(null);
const showConfirmModal = ref(false);
const isDirty = ref(false);

/* ================== Computed ================== */
const displayNome = computed(() => selectedSede.value?.NOME ?? "");
const attivaBool = computed({
  get: () => (selectedSede.value?.ATTIVA ?? 0) === 1,
  set: (v: boolean) => {
    if (selectedSede.value) selectedSede.value.ATTIVA = v ? 1 : 0;
  },
});

/* ================== Load / Select ================== */
async function reload() {
  const { data } = await apiLoadSedi();
  const rows = Array.isArray((data as any)?.rows) ? (data as any).rows : [];
  sedi.value = rows.map((r: any, i: number) => ({
    id: r.ID ?? i,
    NOME: r.NOME ?? "",
    COMUNE: r.COMUNE ?? "",
    INDIRIZZO: r.INDIRIZZO ?? "",
    ORARIO_SEDE: r.ORARIO_SEDE ?? "",
    COD_UNIVOCO_INFRATEL: r.COD_UNIVOCO_INFRATEL ?? "",
    CONNETTIVITA: r.CONNETTIVITA ?? "",
    NOTE: r.NOTE ?? "",
    ATTIVA: r.ATTIVA ?? 1,
    DATA_AGGIORNAMENTO: (r.DATA_AGGIORNAMENTO ?? "").toString().slice(0, 10),
  }));
  if (sedi.value.length && !selectedSede.value) selectSede(sedi.value[0]);
}

function selectSede(s: Sede) {
  selectedSede.value = JSON.parse(JSON.stringify(s));
  originalSede.value = JSON.parse(JSON.stringify(s));
  isDirty.value = false;
}

/* ================== Cambio sede ================== */
function onSedeClick(s: Sede) {
  if (isDirty.value) {
    pendingSwitch.value = s;
    showUnsavedModal.value = true;
    return;
  }
  selectSede(s);
}

function confirmSwitch() {
  showUnsavedModal.value = false;
  if (pendingSwitch.value) {
    // ripristina modifiche e cambia sede
    discardChanges();
    selectSede(pendingSwitch.value);
    pendingSwitch.value = null;
  }
}

function discardChanges() {
  if (selectedSede.value && originalSede.value) {
    Object.assign(selectedSede.value, JSON.parse(JSON.stringify(originalSede.value)));
  }
}

/* ================== Watch su modifiche ================== */
watch(
  () => selectedSede.value && { ...selectedSede.value },
  () => {
    if (!selectedSede.value || !originalSede.value) return;
    const a = JSON.stringify(selectedSede.value);
    const b = JSON.stringify(originalSede.value);
    isDirty.value = a !== b;
  },
  { deep: true }
);

/* ================== Salvataggio ================== */
async function save() {
  if (!selectedSede.value) return;
  await apiUpdateSede(selectedSede.value.id, { ...selectedSede.value });
  const idx = sedi.value.findIndex((x) => x.id === selectedSede.value?.id);
  if (idx !== -1) sedi.value[idx] = JSON.parse(JSON.stringify(selectedSede.value));
  originalSede.value = JSON.parse(JSON.stringify(selectedSede.value));
  isDirty.value = false;
  showConfirmModal.value = true;
}

/* ================== Nuova sede ================== */
const showAdd = ref(false);
const newSede = reactive<Omit<Sede, "id">>({
  NOME: "",
  COMUNE: "",
  INDIRIZZO: "",
  ORARIO_SEDE: "",
  COD_UNIVOCO_INFRATEL: "",
  CONNETTIVITA: "",
  NOTE: "",
  ATTIVA: 1,
  DATA_AGGIORNAMENTO: new Date().toISOString().slice(0, 10),
});
const newAttivaBool = computed({
  get: () => (newSede.ATTIVA ?? 0) === 1,
  set: (v: boolean) => (newSede.ATTIVA = v ? 1 : 0),
});

function openAdd() {
  showAdd.value = true;
}
function closeAdd() {
  showAdd.value = false;
}
async function create() {
  await apiCreateSede({ ...newSede });
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
</script>
