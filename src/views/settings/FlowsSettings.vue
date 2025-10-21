<template>
  <div class="min-h-screen h-dvh w-full flex flex-col bg-gray-50">
    <BaseHeader title="Net configuration" />
    <div class="flex flex-1 min-h-0 overflow-hidden">
      <!-- Sidebar nascosta su mobile -->
      <aside class="hidden md:flex md:w-64 border-r overflow-y-auto bg-white md:flex-col">
        <div class="p-4 border-b flex items-center justify-between">
          <h2 class="text-sm font-semibold text-gray-700">Flussi</h2>
          <BaseButton size="xs" variant="primary" @click="openAddFlow">+</BaseButton>
        </div>
        <ul class="flex-1">
          <li
            v-for="f in flows"
            :key="f.id"
            @click="onFlowClick(f)"
            class="px-4 py-2 cursor-pointer hover:bg-gray-300 text-gray-600"
            :class="f.id === selectedFlow?.id ? 'bg-gray-400 font-semibold text-gray-100' : ''"
          >
            {{ f.descrizioneLunga }}
          </li>
        </ul>
      </aside>

      <!-- Contenuto -->
      <main class="flex-1 overflow-auto p-4 md:p-6">
        <!-- Selettore flusso per mobile -->
        <div class="md:hidden mb-4">
          <div class="bg-white rounded-lg shadow p-4">
            <div class="flex items-center justify-between mb-2">
              <label class="block text-sm font-medium text-gray-700">Flusso</label>
              <BaseButton size="xs" variant="primary" @click="openAddFlow">+</BaseButton>
            </div>
            <BaseSelect
              :modelValue="selectedFlow?.id ?? null"
              :options="flows.map((f) => ({ value: Number(f.id), label: f.nome }))"
              placeholder="Seleziona un flusso"
              :fit="false"
              :disabled="!flows.length"
              wrapperClass="w-full"
              @update:modelValue="
                (val) => {
                  const f = flows.find((x) => Number(x.id) === Number(val));
                  if (f) onFlowClick(f);
                }
              "
            />
          </div>
        </div>

        <div v-if="selectedFlow" class="w-full space-y-6">
          <div class="w-full bg-white rounded-lg shadow p-4 md:p-6 space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-gray-800">{{ selectedFlow.nome }}</h2>
            </div>
            <!-- Campi flusso -->
            <div class="flex flex-col md:flex-row gap-4">
              <BaseInput
                v-model="selectedFlow.nome"
                label="Nome flusso"
                placeholder="Nome"
                class="flex-1 min-w-0"
                @update:modelValue="markDirty"
              />
              <BaseInput
                v-model="selectedFlow.descrizioneLunga"
                label="Descrizione"
                placeholder="Descrizione"
                class="flex-1 min-w-0"
                @update:modelValue="markDirty"
              />
              <BaseSelect
                v-model="selectedFlow.rangeType"
                :options="rangeOptions"
                label="Tipo intervallo"
                placeholder="Seleziona intervallo…"
                wrapperClass="flex-1 min-w-0"
                @update:modelValue="markDirty"
              />
            </div>

            <!-- Azioni -->
            <div class="flex mt-2 md:justify-start gap-2">
              <BaseButton class="w-full md:w-auto" variant="primary" @click="saveFlow">
                Salva modifiche
              </BaseButton>
              <BaseButton class="w-full md:w-auto" variant="secondary" @click="closeEditor">
                Chiudi
              </BaseButton>
            </div>
          </div>
        </div>

        <div v-else class="hidden md:block text-gray-500">
          Seleziona un flusso dalla lista a sinistra.
        </div>
      </main>
    </div>

    <!-- Modale gestione nuovo flusso -->
    <transition name="fade">
      <div
        v-if="showAddFlow"
        class="fixed inset-0 flex items-center justify-center bg-black/40 z-50"
      >
        <div class="bg-white rounded-lg shadow-xl p-4 md:p-6 w-full max-w-md md:max-w-3xl">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Nuovo flusso</h3>

          <div class="flex flex-col md:flex-row gap-4 mb-6">
            <BaseInput
              v-model="newFlow.nome"
              label="Nome flusso"
              placeholder="Nome"
              class="flex-1 min-w-0"
            />
            <BaseInput
              v-model="newFlow.descrizioneLunga"
              label="Descrizione"
              placeholder="Descrizione"
              class="flex-1 min-w-0"
            />
            <BaseSelect
              v-model="newFlow.rangeType"
              :options="rangeOptions"
              label="Tipo intervallo"
              placeholder="Seleziona intervallo…"
              wrapperClass="flex-1 min-w-0"
            />
          </div>

          <div class="flex flex-col sm:flex-row justify-end gap-3">
            <BaseButton class="w-full sm:w-auto" variant="secondary" @click="showAddFlow = false">
              Annulla
            </BaseButton>
            <BaseButton class="w-full sm:w-auto" variant="primary" @click="confirmAddFlow">
              Salva
            </BaseButton>
          </div>
        </div>
      </div>
    </transition>

    <!-- Modali -->
    <BaseModalAlert
      :show="showConfirmModal"
      title="Salvataggio riuscito"
      message="Il flusso è stato salvato correttamente."
      ok-text="Ok"
      @confirm="showConfirmModal = false"
    />

    <BaseModalAlert
      :show="showErrorModal"
      title="Errore"
      message="Compila tutti i campi obbligatori."
      ok-text="Ok"
      @confirm="showErrorModal = false"
    />

    <BaseModalAlert
      :show="showUnsavedModal"
      title="Attenzione"
      message="Hai delle modifiche non salvate. Sei sicuro di voler cambiare flusso?"
      ok-text="Sì, continua"
      cancel-text="Annulla"
      @confirm="switchFlow"
      @cancel="showUnsavedModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import BaseHeader from "@/components/base/BaseHeader.vue";
import BaseButton from "@/components/base/BaseButton.vue";
import BaseInput from "@/components/base/BaseInput.vue";
import BaseSelect from "@/components/base/BaseSelect.vue";
import BaseModalAlert from "@/components/base/BaseModalAlert.vue";

const flows = ref<{ id: number; nome: string; descrizioneLunga: string; rangeType: string }[]>([]);
const selectedFlow = ref<{
  id: number;
  nome: string;
  descrizioneLunga: string;
  rangeType: string;
} | null>(null);
const isDirty = ref(false);
const showAddFlow = ref(false);
const showConfirmModal = ref(false);
const showErrorModal = ref(false);
const showUnsavedModal = ref(false);
let pendingFlowSwitch: any = null;

const rangeOptions = [
  { value: "M", label: "Mensile" },
  { value: "W", label: "Settimanale" },
];

const newFlow = reactive({ nome: "", descrizioneLunga: "", rangeType: "M" });

function openAddFlow() {
  newFlow.nome = "";
  newFlow.descrizioneLunga = "";
  newFlow.rangeType = "M";
  showAddFlow.value = true;
}

function onFlowClick(f: any) {
  if (isDirty.value) {
    // Se ci sono modifiche non salvate, mostra il modal di avviso
    pendingFlowSwitch = f;
    showUnsavedModal.value = true;
  } else {
    selectedFlow.value = { ...f };
    isDirty.value = false;
  }
}

function markDirty() {
  isDirty.value = true;
}

import { apiUpdateFlow } from '@/services/api'

async function saveFlow() {
  if (!selectedFlow.value?.nome || !selectedFlow.value?.descrizioneLunga || !selectedFlow.value?.rangeType) {
    showErrorModal.value = true;
    return;
  }
  try {
    await apiUpdateFlow(
      selectedFlow.value.id,
      selectedFlow.value.nome,
      selectedFlow.value.descrizioneLunga,
      selectedFlow.value.rangeType
    );
    const idx = flows.value.findIndex((f) => f.id === selectedFlow.value?.id);
    if (idx !== -1) {
      flows.value[idx] = { ...selectedFlow.value };
    }
    showConfirmModal.value = true;
    isDirty.value = false;
    selectedFlow.value = null;
  } catch (err) {
    showErrorModal.value = true;
    console.error(err);
  }
}

async function confirmAddFlow() {

  if (!newFlow.nome || !newFlow.descrizioneLunga || !newFlow.rangeType) {
    showErrorModal.value = true;
    return;
  }
  try {
    const { data } = await apiAddFlow(newFlow.nome, newFlow.descrizioneLunga, newFlow.rangeType);
    flows.value.push({
      id: data?.id ?? flows.value.length + 1,
      nome: newFlow.nome,
      descrizioneLunga: newFlow.descrizioneLunga,
      rangeType: newFlow.rangeType,
    });
    await caricaFlussi();
     showAddFlow.value = false;
    showConfirmModal.value = true;
  } catch (err) {
    showErrorModal.value = true;
    console.error(err);
  }
}

import { apiFetchFlussiForSettings, apiAddFlow } from '@/services/api'

async function caricaFlussi() {
  try {
    const flussi = await apiFetchFlussiForSettings();
    flows.value = flussi;
  } catch (err) {
    console.error("Errore caricamento flussi:", err);
  }
}

function switchFlow() {
  if (pendingFlowSwitch) {
    selectedFlow.value = { ...pendingFlowSwitch };
    isDirty.value = false;
    pendingFlowSwitch = null;
  }
  showUnsavedModal.value = false;
}

onMounted(async () => {
  await caricaFlussi();
});
function closeEditor() {
  selectedFlow.value = null;
}
</script>


