<template>
  <div class="min-h-screen h-dvh w-full flex flex-col bg-gray-50">
    <BaseHeader title="Gestione Flussi Invio/Ritorno" />

    <div class="flex flex-1 min-h-0 overflow-hidden">
      <!-- Colonna sinistra: lista flussi -->
      <aside class="hidden md:flex md:w-64 border-r overflow-y-auto bg-white md:flex-col">
        <div class="p-4 border-b flex items-center justify-between">
          <h2 class="text-sm font-semibold text-gray-700">Flussi</h2>
        </div>
        <ul class="flex-1">
          <li
            v-for="f in flows"
            :key="f.id"
            @click="onFlowClick(f)"
            class="px-4 py-2 cursor-pointer hover:bg-gray-300 text-gray-600"
            :class="f.id === selectedFlow?.id ? 'bg-gray-400 font-semibold text-gray-100' : ''"
          >
            {{ f.nome }}
          </li>
        </ul>
      </aside>

      <main class="flex-1 overflow-auto p-4 md:p-6">
        <!-- Selettore flusso per mobile -->
        <div class="md:hidden mb-4">
          <div class="bg-white rounded-lg shadow p-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Flusso</label>
            <BaseSelect
              :modelValue="selectedFlow?.id ?? null"
              :options="flows.map((f) => ({ value: f.id, label: f.nome }))"
              placeholder="Seleziona un flusso"
              :clearable="false"
              :fit="false"
              size="md"
              class="w-full text-gray-900"
              wrapperClass="w-full"
              @update:modelValue="
                (val) => {
                  const f = flows.find((x) => x.id === val);
                  if (f) onFlowClick(f);
                }
              "
            />
          </div>
        </div>
        <div v-if="selectedFlow" class="w-full space-y-8">
          <div class="w-full bg-white rounded-lg shadow p-4 md:p-6 space-y-6">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-gray-800">{{ selectedFlow.nome }}</h2>
            </div>
            <!-- Card Invio -->
            <div class="w-full p-2">
              <div class="flex items-center justify-between">
                <h3 class="text-base font-semibold text-gray-800 mb-3">Invio</h3>
                <BaseButton size="xs" variant="primary" @click="addInvio">+</BaseButton>
              </div>

              <!-- Record estratti dal backend -->
              <div
                v-for="item in invii.filter((i) => i.id)"
                :key="item.id"
                class="flex flex-col md:flex-row items-stretch md:items-end gap-2 mb-2 w-full"
              >
                <div class="flex flex-col md:flex-row w-full gap-4">
                  <BaseInput
                    v-model="item.nome"
                    label="Nome"
                    placeholder="Nome invio"
                    class="flex-1"
                  />
                  <BaseInput
                    v-model="item.descrizione"
                    label="Descrizione"
                    placeholder="Descrizione invio"
                    class="flex-[2]"
                  />
                  <BaseInput
                    v-model="item.codice"
                    label="Codice"
                    placeholder="Codice invio"
                    class="flex-1"
                  />
                </div>
              </div>

              <!-- Record aggiunti manualmente -->
              <div
                v-for="(item, idx) in invii.filter((i) => !i.id)"
                :key="`new-${idx}`"
                class="flex flex-col md:flex-row items-stretch md:items-center mb-2 w-full gap-4"
              >
                <div class="flex flex-col md:flex-row w-full gap-4">
                  <BaseInput
                    v-model="item.nome"
                    label="Nome"
                    placeholder="Nome invio"
                    class="flex-1"
                  />
                  <BaseInput
                    v-model="item.descrizione"
                    label="Descrizione"
                    placeholder="Descrizione invio"
                    class="flex-[2]"
                  />
                  <BaseInput
                    v-model="item.codice"
                    label="Codice"
                    placeholder="Codice invio"
                    class="flex-1"
                  />
                </div>
              <BaseIconButton
  size="xs"
  variant="danger"
  class="mt-2 md:mt-0 md:ml-2 self-start md:self-auto"
  @click="removeInvioByItem(item)"
  aria-label="Rimuovi"
>
  <font-awesome-icon :icon="['fas', 'trash']" class="text-red-600" />
</BaseIconButton>
              </div>

              <div class="flex mt-4 md:justify-end">
                <BaseButton class="w-full md:w-auto" variant="primary" @click="saveAllInvii">
                  Salva tutti gli invii
                </BaseButton>
              </div>
            </div>
            <hr />
            <!-- Card Ritorno -->
            <div class="w-full p-2">
              <div class="flex items-center justify-between">
                <h3 class="text-base font-semibold text-gray-800 mb-3">Ritorno</h3>
                <BaseButton size="xs" variant="primary" @click="addRitorno">+</BaseButton>
              </div>

              <!-- Record estratti dal backend -->
              <div
                v-for="item in ritorni.filter((i) => i.id)"
                :key="item.id"
                class="flex flex-col md:flex-row items-stretch md:items-end gap-2 mb-2 w-full"
              >
                <div class="flex flex-col md:flex-row w-full gap-4">
                  <BaseInput
                    v-model="item.nome"
                    label="Nome"
                    placeholder="Nome ritorno"
                    @input="isDirty = true"
                    class="flex-1"
                  />
                  <BaseInput
                    v-model="item.descrizione"
                    label="Descrizione"
                    placeholder="Descrizione ritorno"
                    @input="isDirty = true"
                    class="flex-[2]"
                  />
                  <BaseInput
                    v-model="item.codice"
                    label="Codice"
                    placeholder="Codice ritorno"
                    @input="isDirty = true"
                    class="flex-1"
                  />
                </div>
              </div>

              <!-- Record aggiunti manualmente -->
              <div
                v-for="(item, idx) in ritorni.filter((i) => !i.id)"
                :key="`new-${idx}`"
                class="flex flex-col md:flex-row items-stretch md:items-center mb-2 w-full gap-4"
              >
                <div class="flex flex-col md:flex-row w-full gap-4">
                  <BaseInput
                    v-model="item.nome"
                    label="Nome"
                    placeholder="Nome ritorno"
                    @input="isDirty = true"
                    class="flex-1"
                  />
                  <BaseInput
                    v-model="item.descrizione"
                    label="Descrizione"
                    placeholder="Descrizione ritorno"
                    @input="isDirty = true"
                    class="flex-[2]"
                  />
                  <BaseInput
                    v-model="item.codice"
                    label="Codice"
                    placeholder="Codice ritorno"
                    @input="isDirty = true"
                    class="flex-1"
                  />
                </div>
               <BaseIconButton
  size="xs"
  variant="danger"
  class="mt-2 md:mt-0 md:ml-2 self-start md:self-auto"
  @click="removeRitornoByItem(item)"
  aria-label="Rimuovi"
>
  <font-awesome-icon :icon="['fas', 'trash']" class="text-red-600" />
</BaseIconButton>
              </div>

              <div class="flex mt-4 md:justify-end">
                <BaseButton class="w-full md:w-auto" variant="primary" @click="saveAllRitorni">
                  Salva tutti i ritorni
                </BaseButton>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="hidden md:block text-gray-500">
          Seleziona un flusso dalla lista a sinistra.
        </div>
      </main>
      <!-- ...esistente... -->
    </div>

    <!-- Modale conferma salvataggio -->
    <BaseModalAlert
      :show="showConfirmModal"
      title="Salvataggio riuscito"
      message="Il flusso è stato salvato correttamente."
      ok-text="Ok"
      :autoCloseMs="2000"
      @confirm="showConfirmModal = false"
    />

    <!-- Modale errore -->
    <BaseModalAlert
      :show="showErrorModal"
      title="Errore"
      message="Compila tutti i campi obbligatori."
      ok-text="Ok"
      :autoCloseMs="2000"
      @confirm="showErrorModal = false"
    />

    <!-- Modale per flusso non salvato -->
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
import { ref, onMounted } from "vue";
import BaseHeader from "@/components/base/BaseHeader.vue";
import BaseButton from "@/components/base/BaseButton.vue";
import BaseInput from "@/components/base/BaseInput.vue";
import BaseSelect from "@/components/base/BaseSelect.vue";
import BaseModalAlert from "@/components/base/BaseModalAlert.vue";
import { http } from "@/services/http";
import { QUERY_BASE } from "@/config/config";
import { useRightsStore } from "@/stores/rights";
import BaseIconButton from "@/components/base/BaseIconButton.vue";

const userStore = useRightsStore();
const userMatricola = userStore.matricola;
const allInvii = ref<
  { id?: number; flussoId: number; nome: string; descrizione: string; codice: string }[]
>([]);
const allRitorni = ref<
  { id?: number; flussoId: number; nome: string; descrizione: string; codice: string }[]
>([]);
const invii = ref<{ id?: number; nome: string; descrizione: string; codice: string }[]>([]);
const ritorni = ref<{ id?: number; nome: string; descrizione: string; codice: string }[]>([]);

function addInvio() {
  invii.value.push({ nome: "", descrizione: "", codice: "" });
}



function addRitorno() {
  ritorni.value.push({ nome: "", descrizione: "", codice: "" });
}

function removeInvioByItem(item: { id?: number; nome: string; descrizione: string; codice: string }) {
  const idx = invii.value.indexOf(item);
  if (idx !== -1) {
    invii.value.splice(idx, 1);
    isDirty.value = true;
  }
}

function removeRitornoByItem(item: { id?: number; nome: string; descrizione: string; codice: string }) {
  const idx = ritorni.value.indexOf(item);
  if (idx !== -1) {
    ritorni.value.splice(idx, 1);
    isDirty.value = true;
  }
}



async function saveAllInvii() {
  if (!selectedFlow.value) {
    showErrorModal.value = true;
    return;
  }
  for (const item of invii.value) {
    if (!item.nome || !item.descrizione || !item.codice) {
      showErrorModal.value = true;
      return;
    }
  }

  // Split: update (con id) e insert (senza id)
  const toUpdate = invii.value.filter((item) => item.id);
  const toInsert = invii.value.filter((item) => !item.id);

  try {
    // Batch update
    if (toUpdate.length) {
      const batchUpdate = toUpdate.map((item) => ({
        params: [
          { index: 1, value: item.descrizione },
          { index: 2, value: item.nome },
          { index: 3, value: item.codice },
          { index: 4, value: item.id },
        ],
      }));
      await http.post(QUERY_BASE, {
        queryId: 35, // update
        kind: "batchUpdate",
        batch: batchUpdate,
      });
    }

    // Batch insert
    if (toInsert.length) {
      const batchInsert = toInsert.map((item) => ({
        params: [
          { index: 1, value: selectedFlow.value!.id },
          { index: 2, value: item.descrizione },
          { index: 3, value: item.nome },
          { index: 4, value: item.codice },
        ],
      }));
      const { data } = await http.post(QUERY_BASE, {
        queryId: 33, // insert
        kind: "batch",
        batch: batchInsert,
      });
      // Aggiorna gli id dei nuovi record
      if (Array.isArray(data?.batchRows)) {
        let insertIdx = 0;
        invii.value.forEach((item) => {
          if (!item.id && data.batchRows[insertIdx]?.ID) {
            item.id = data.batchRows[insertIdx].ID;
            insertIdx++;
          }
        });
      }
    }

    showConfirmModal.value = true;
    // Se c'è uno switch pendente ed il salvataggio è andato a buon fine, procedi con lo switch
    if (pendingFlowSwitch) {
      switchFlow();
    }
  } catch (err) {
    showErrorModal.value = true;
    console.error(err);
  }
}

async function saveAllRitorni() {
  if (!selectedFlow.value) {
    showErrorModal.value = true;
    return;
  }
  for (const item of ritorni.value) {

    if (!item.nome || !item.descrizione || !item.codice) {
      showErrorModal.value = true;
      return;
    }
  }

  const toUpdate = ritorni.value.filter((item) => item.id);
  const toInsert = ritorni.value.filter((item) => !item.id);

  try {
    if (toUpdate.length) {
      const batchUpdate = toUpdate.map((item) => ({
        params: [
          { index: 1, value: item.descrizione },
          { index: 2, value: item.nome },
          { index: 3, value: item.codice },
          { index: 4, value: item.id },
        ],
      }));

      await http.post(QUERY_BASE, {
        queryId: 36, // update
        kind: "batch",
        batch: batchUpdate,
      });
    }

    if (toInsert.length) {
      const batchInsert = toInsert.map((item) => ({
        params: [
          { index: 1, value: selectedFlow.value!.id },
          { index: 2, value: item.descrizione },
          { index: 3, value: item.nome },
          { index: 4, value: item.codice },
        ],
      }));
      const { data } = await http.post(QUERY_BASE, {
        queryId: 34, // insert
        kind: "batch",
        batch: batchInsert,
      });
      if (Array.isArray(data?.batchRows)) {
        let insertIdx = 0;
        ritorni.value.forEach((item) => {
          if (!item.id && data.batchRows[insertIdx]?.ID) {
            item.id = data.batchRows[insertIdx].ID;
            insertIdx++;
          }
        });
      }
    }

    showConfirmModal.value = true;
  } catch (err) {
    showErrorModal.value = true;
    console.error(err);
  }
}

const flows = ref<{ id: number; nome: string; descrizioneLunga: string; rangeType: string }[]>([]);
const selectedFlow = ref<{
  id: number;
  nome: string;
  descrizioneLunga: string;
  rangeType: string;
} | null>(null);
const isDirty = ref(false);

// Cache locale dei draft per flusso (invii/ritorni in modifica)
const draftsByFlow: Record<number, { invii: any[]; ritorni: any[] }> = {};

const showConfirmModal = ref(false);
const showErrorModal = ref(false);
const showUnsavedModal = ref(false);
let pendingFlowSwitch: any = null;

function switchFlow() {
  if (pendingFlowSwitch) {
    // Salva il draft corrente prima di switchare
    if (selectedFlow.value) {
      draftsByFlow[selectedFlow.value.id] = {
        invii: invii.value.map((x) => ({ ...x })),
        ritorni: ritorni.value.map((x) => ({ ...x })),
      };
    }

    // Switch al nuovo flusso
    selectedFlow.value = { ...pendingFlowSwitch };

    // Ripristina draft se esiste, altrimenti filtra dai dati globali
    const cached = draftsByFlow[selectedFlow.value!.id];
    if (cached) {
      invii.value = cached.invii.map((x) => ({ ...x }));
      ritorni.value = cached.ritorni.map((x) => ({ ...x }));
    } else {
      invii.value = allInvii.value.filter((i) => i.flussoId === selectedFlow.value!.id).map((i) => ({ ...i }));
      ritorni.value = allRitorni.value.filter((r) => r.flussoId === selectedFlow.value!.id).map((r) => ({ ...r }));
    }

    isDirty.value = false;
    pendingFlowSwitch = null;
  }
  showUnsavedModal.value = false;
}

async function caricaFlussi() {
  try {
    const { data } = await http.post(QUERY_BASE, {
      queryId: 8,
      params: [],
      maxRows: 100,
    });
    const rows = Array.isArray(data?.rows) ? data.rows : [];
    flows.value = rows.map((r: any) => ({
      id: r.ID,
      nome: r.DESCRIZIONE,
      descrizioneLunga: r.DESCRIZIONE_LUNGA,
      rangeType: r.ELABORAZIONE ?? "M",
    }));
  } catch (err) {
    console.error("Errore caricamento flussi:", err);
  }
}

onMounted(async () => {

  await caricaFlussi();
  const { data: invioData } = await http.post(QUERY_BASE, {
    queryId: 31,
    params: [{ index: 1, value: userMatricola }],
    maxRows: 100,
  });
  allInvii.value = Array.isArray(invioData?.rows)
    ? invioData.rows.map((r: any) => ({
        id: r.ID,
        flussoId: r.ID_FLUSSO,
        nome: r.NAME,
        descrizione: r.DESCRIZIONE,
        codice: r.CODICE,
      }))
    : [];


  const { data: ritornoData } = await http.post(QUERY_BASE, {
    queryId: 32,
    params: [{ index: 1, value: userMatricola }],
  });
  allRitorni.value = Array.isArray(ritornoData?.rows)
    ? ritornoData.rows.map((r: any) => ({
        id: r.ID,
        flussoId: r.ID_FLUSSO,
        nome: r.NAME,
        descrizione: r.DESCRIZIONE,
        codice: r.CODICE,
      }))
    : [];
});

async function onFlowClick(f: any) {
  // Se ci sono modifiche non salvate, chiedi conferma e pianifica lo switch
  if (isDirty.value && selectedFlow.value && selectedFlow.value.id !== f.id) {
    pendingFlowSwitch = { ...f };
    showUnsavedModal.value = true;
    return;
  }

  // Salva il draft del flusso corrente prima di cambiare
  if (selectedFlow.value) {
    draftsByFlow[selectedFlow.value.id] = {
      invii: invii.value.map((x) => ({ ...x })),
      ritorni: ritorni.value.map((x) => ({ ...x })),
    };
  }

  // Seleziona nuovo flusso e ripristina draft se presente
  selectedFlow.value = { ...f };
  const cached = draftsByFlow[f.id];
  if (cached) {
    invii.value = cached.invii.map((x) => ({ ...x }));
    ritorni.value = cached.ritorni.map((x) => ({ ...x }));
  } else {
    invii.value = allInvii.value.filter((i) => i.flussoId === f.id).map((i) => ({ ...i }));
    ritorni.value = allRitorni.value.filter((r) => r.flussoId === f.id).map((r) => ({ ...r }));
  }
}
</script>

