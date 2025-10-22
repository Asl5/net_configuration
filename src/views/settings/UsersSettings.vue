<template>
  <div class="min-h-screen h-dvh w-full flex flex-col bg-gray-50">
    <BaseHeader title="Gestione Utenti" />
    <div class="flex flex-1 min-h-0 overflow-hidden">
      <!-- Sidebar nascosta su mobile -->
      <aside class="hidden md:flex md:w-64 border-r overflow-y-auto bg-white md:flex-col">
        <div class="p-4 border-b flex items-center justify-between">
          <h2 class="text-sm font-semibold text-gray-700">Utenti</h2>
          <BaseButton size="xs" variant="primary" @click="openAddUser">+</BaseButton>
        </div>
        <ul class="flex-1">
          <li
            v-for="u in users"
            :key="u.matricola"
            @click="onUserClick(u)"
            class="px-4 py-2 cursor-pointer hover:bg-gray-300 text-gray-700"
            :class="
              u.matricola === selectedUser?.matricola
                ? 'bg-gray-400 font-semibold text-gray-100'
                : ''
            "
          >
            {{ u.nome }}
          </li>
        </ul>
      </aside>

      <!-- Contenuto -->
      <main class="flex-1 overflow-auto p-4 md:p-6">
        <!-- Selettore utente per mobile -->
        <div class="md:hidden mb-4">
          <div class="bg-white rounded-lg shadow p-4">
            <div class="flex items-center justify-between mb-3">
              <label for="user-mobile" class="block text-sm font-medium text-gray-700"
                >Utente</label
              >
              <BaseButton size="xs" variant="primary" @click="openAddUser">+</BaseButton>
            </div>
            <!-- BaseSelect per mobile -->
            <BaseSelect
              :modelValue="selectedUser?.matricola ?? null"
              :options="users.map((u) => ({ value: u.matricola, label: u.nome }))"
              placeholder="Seleziona un utente"
              :clearable="false"
              :fit="false"
              size="md"
              class="w-full text-gray-900"
              wrapperClass="w-full"
              @update:modelValue="
                (val) => {
                  const u = users.find((x) => x.matricola === val);
                  if (u) onUserClick(u);
                }
              "
            />
          </div>
        </div>

        <div v-if="selectedUser" class="w-full space-y-6">
          <div class="w-full bg-white rounded-lg shadow p-4 md:p-6 space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-gray-800">
                {{ selectedUser.nome }} {{ selectedUser.cognome }}
              </h2>
              <BaseButton variant="danger" size="sm" @click="onClickDeleteUser">Elimina</BaseButton>
            </div>
            <!-- Dati base -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <BaseInput v-model="selectedUser.matricola" label="Matricola" disabled />
              <BaseInput v-model="selectedUser.nome" label="Nome" />
              <BaseInput v-model="selectedUser.cognome" label="Cognome" />
            </div>
            <!-- Ruolo -->
            <div class="flex flex-col sm:flex-row gap-4">
              <BaseSelect
                v-model="selectedUser.roleId"
                :options="roleOptions"
                label="Ruolo"
                placeholder="Seleziona ruolo"
                class="w-full sm:w-64"
                :fit="false"
                :clearable="true"
                wrapperClass="w-full sm:w-56"
              />
            </div>

            <!-- Azioni -->
            <div class="flex mt-4 md:justify-end">
              <BaseButton class="w-full md:w-auto" variant="primary" @click="saveRights">
                Salva modifiche
              </BaseButton>
            </div>
          </div>
        </div>

        <div v-else class="hidden md:block text-gray-500">
          Seleziona un utente dalla lista a sinistra.
        </div>
      </main>
    </div>

    <!-- Modale gestione nuovo utente -->
    <transition name="fade">
      <div
        v-if="showAddUser"
        class="fixed inset-0 flex items-center justify-center bg-black/40 z-50"
      >
        <div class="bg-white rounded-lg shadow-xl p-4 md:p-6 w-full max-w-md md:max-w-3xl">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Nuovo utente</h3>

          <!-- Nome + Matricola -->
          <div class="flex flex-col md:flex-row gap-4 mb-6">

            <BaseInput
              v-model="newUser.nome"
              label="Nome"
              placeholder="Matricola"
              class="w-full md:w-full"
            />
            <BaseInput
              v-model="newUser.cognome"
              label="Cognome"
              placeholder="Matricola"
              class="w-full md:w-full"
            />
          </div>

          <!-- Campi base soltanto: matricola, ruolo -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <BaseInput
              v-model="newUser.matricola"
              label="Matricola"
              placeholder="Matricola"
              class="w-full md:w-full"
            />
            <BaseSelect
              v-model="newUser.roleId"
              :options="roleOptions"
              label="Ruolo"
              placeholder="Seleziona ruolo"
              class="w-full md:w-full"
            />
          </div>

          <!-- Bottoni -->
          <div class="flex flex-col sm:flex-row justify-end gap-3 mt-6">
            <BaseButton class="w-full sm:w-auto" variant="secondary" @click="showAddUser = false">
              Annulla
            </BaseButton>
            <BaseButton class="w-full sm:w-auto" variant="primary" @click="confirmAddUser">
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
      message="I permessi sono stati salvati correttamente."
      ok-text="Ok"
      @confirm="showConfirmModal = false"
    />
    <BaseModalAlert
      :show="showErrorModal"
      title="Errore"
      message="Seleziona un ruolo prima di salvare."
      ok-text="Ok"
      @confirm="showErrorModal = false"
    />
  </div>
  <!-- Avviso modifiche non salvate -->
  <BaseModalAlert
    :show="showUnsavedModal"
    title="Modifiche non salvate"
    message="Hai modifiche non salvate. Vuoi procedere senza salvare?"
    ok-text="SÃ¬, continua"
    cancel-text="Annulla"
    @confirm="confirmUserSwitch"
    @cancel="showUnsavedModal = false"
  />
  <!-- Modale conferma eliminazione utente -->
  <BaseModalAlert
    :show="showDeleteModal"
    title="Conferma eliminazione"
    :message="`Sei sicuro di voler eliminare l'utente ${selectedUser?.nome}?`"
    ok-text="Elimina"
    cancel-text="Annulla"
    @confirm="performDeleteUser"
    @cancel="showDeleteModal = false"
  />
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import BaseHeader from "@/components/base/BaseHeader.vue";
import BaseSelect from "@/components/base/BaseSelect.vue";
import BaseButton from "@/components/base/BaseButton.vue";
import BaseInput from "@/components/base/BaseInput.vue";
// import BaseCheckBox from "@/components/base/BaseCheckBox.vue";
import BaseModalAlert from "@/components/base/BaseModalAlert.vue";
import { useRightsStore } from "@/stores/rights";
import { getDeviceName } from "@/utils/utils";
import {
  apiAddUser,
  apiSaveUserRole,
  apiDeleteUser,
  apiLoadRoles,
  // apiLoadUsers,
  // apiLoadFlows,
  // apiLoadFlowPermissions,
  apiBatchInsertUserRights,
  apiBatchUpdateUserRights,
  apiLoadUsers,
} from "@/services/api";

const rightsStore = useRightsStore();

const showUnsavedModal = ref(false);
let pendingUserSwitch: any = null;
/* ================== Stato ================== */
const users = ref<any[]>([]);
const selectedUser = ref<any | null>(null);
const showDeleteModal = ref(false);
function onClickDeleteUser() {
  if (!selectedUser.value) return;
  showDeleteModal.value = true;
}
async function performDeleteUser() {
  if (!selectedUser.value) return;
  try {
    await apiDeleteUser(selectedUser.value.matricola);
    // rimuovi da lista locale
    users.value = users.value.filter((u) => u.matricola !== selectedUser.value!.matricola);
    selectedUser.value = null;
    showDeleteModal.value = false;
    // riallinea lista utenti da backend
    // await reloadUsersViaQuery6();
  } catch (e) {
    console.error(e);
    alert("Errore durante l'eliminazione utente");
  }
}
const rightsByFlow = reactive<Record<number, number[]>>({});
// Snapshot iniziale dei permessi per flusso all'apertura/selezione utente
const initialRightsByFlow = reactive<Record<number, number[]>>({});
const isDirty = ref(false);
const showConfirmModal = ref(false);
const showErrorModal = ref(false);
const rightsByFlowNew = reactive<Record<number, number[]>>({});
// Traccia l\'ultimo flusso su cui l\'utente ha toccato un permesso
// const lastTouchedFlowId = ref<number | null>(null);
/* ================== Ruoli (query 7) ================== */
const roleOptions = ref<{ value: number; label: string; descrizioneLunga: string }[]>([]);
const roleLoading = ref(false);
// const userStore = useRightsStore();
// const userMatricola = userStore.matricola
async function loadRoles() {
  roleLoading.value = true;
  try {
    const { data } = await apiLoadRoles();
    console.log(data)
    const rows = Array.isArray(data?.rows) ? data.rows : [];
    roleOptions.value = rows.map((r: any) => ({
      value: r.ID,
      label: r.DESCRIZIONE_BREVE + " - " + r.DESCRIZIONE_LUNGA,
      descrizioneLunga: r.DESCRIZIONE_LUNGA,
    }));
  } catch (err) {
    console.error("Errore caricamento ruoli:", err);
  } finally {
    roleLoading.value = false;
  }
}

// // Carica utenti via queryId 6 e poi ricarica ruoli, flussi, permessi
// async function reloadUsersViaQuery6() {
//   try {
//     const { data } = await apiLoadUsers();
//     const rows = Array.isArray(data?.rows) ? data.rows : [];

//     const map = new Map<string, any>();
//     rows.forEach((r: any) => {
//       const key = r.MATRICOLA;
//       if (!map.has(key)) {
//         map.set(key, {
//           matricola: r.MATRICOLA,
//           nome: r.MATRICOLA, // TODO: usa campo nome reale se disponibile
//           roleId: r.ID_DIRITTO ?? null,
//           flowPerms: {},
//         });
//       }
//       const user = map.get(key);
//       if (r.ID_FLUSSO) {
//         if (!user.flowPerms[r.ID_FLUSSO]) user.flowPerms[r.ID_FLUSSO] = [];
//         if (r.ID_DIRITTO_FLUSSO && !user.flowPerms[r.ID_FLUSSO].includes(r.ID_DIRITTO_FLUSSO)) {
//           user.flowPerms[r.ID_FLUSSO].push(r.ID_DIRITTO_FLUSSO);
//         }
//       }
//     });
//     users.value = Array.from(map.values());

//     await loadRoles();
//     await loadFlows();
//     await loadFlowPermissions();
//   } catch (err) {
//     console.error("Errore inizializzazione pagina:", err);
//   }
// }

function confirmUserSwitch() {
  showUnsavedModal.value = false;
  // Azzeramento diritti selezionati
  for (const f of flows.value) {
    rightsByFlow[f.id] = [];
    initialRightsByFlow[f.id] = [];
  }
  if (pendingUserSwitch) {
    selectUser(pendingUserSwitch);
    pendingUserSwitch = null;
  }
}

/* ================== Flussi (query 8) ================== */
const flows = ref<{ id: number; nome: string; descrizioneLunga: string }[]>([]);
// async function loadFlows() {
//   try {
//     const { data } = await apiLoadFlows(userMatricola!);
//     console.log("data", data);
//     const rows = Array.isArray(data?.rows) ? data.rows : [];
//     flows.value = rows.map((r: any) => ({
//       id: r.ID_FLUSSO,
//       nome: r.DESCRIZIONE_FLUSSO,
//       descrizioneLunga: r.DESCRIZIONE_FLUSSO_LUN,
//     }));
//     console.log("flows", flows.value);
//   } catch (err) {
//     console.error("Errore caricamento flussi:", err);
//   }
// }

/* ================== Permessi flusso (query 9) ================== */
// const flowPermissions = ref<{ id: number; descrizione: string; descrizione_lunga: string }[]>([]);
// async function loadFlowPermissions() {
//   try {
//     const { data } = await apiLoadFlowPermissions();
//     const rows = Array.isArray(data?.rows) ? data.rows : [];
//     flowPermissions.value = rows.map((r: any) => ({
//       id: r.ID,
//       descrizione: r.DESCRIZIONE,
//       descrizione_lunga: r.DESCRIZIONE_LUNGA,
//     }));
//   } catch (err) {
//     console.error("Errore caricamento permessi flusso:", err);
//   }
// }

/* ================== Aggiungi utente ================== */
const showAddUser = ref(false);
const newUser = reactive({ matricola: "", nome: "", cognome: "", roleId: null as number | null });

function openAddUser() {
  newUser.matricola = "";
  newUser.nome = "";
  newUser.cognome = "";
  newUser.roleId = null;
  for (const f of flows.value) {
    rightsByFlowNew[f.id] = [];
  }
  showAddUser.value = true;
}

async function confirmAddUser() {
  if (!newUser.matricola ||!newUser.nome||!newUser.cognome|| !newUser.roleId) {
    alert("Compila tutti i campi obbligatori");
    return;
  }

  try {
    // Inserimento utente
    await apiAddUser(newUser.matricola,newUser.nome,newUser.cognome,newUser.roleId);
    // Ricarica lista utenti (queryId 1)
    await reloadUsersViaQuery6();


    showAddUser.value = false;

    // Mostra conferma per poco e chiudi automaticamente
    showConfirmModal.value = true;
    setTimeout(() => {
      showConfirmModal.value = false;
    }, 1200);

    // Azzerare stato modifiche per non mostrare conferma cambio utente
    isDirty.value = false;
    pendingUserSwitch = null;
    showUnsavedModal.value = false;

  } catch (err) {
    alert("Errore durante il salvataggio del nuovo utente.");
    console.error(err);
  }
}

// function addUser() {
//   if (!newUser.nome || !newUser.matricola || !newUser.roleId) {
//     alert("Compila tutti i campi");
//     return;
//   }
//   users.value.push({
//     matricola: newUser.matricola,
//     nome: newUser.nome,
//     roleId: newUser.roleId,
//     flowPerms: {},
//   });
//   showAddUser.value = false;
// }

// /* ================== Metodi gestione utenti ================== */
// function markDirty() {
//   isDirty.value = true;
// }

// Carica utenti (queryId 1) e ruoli
async function reloadUsersViaQuery6() {
  try {
    const { data } = await apiLoadUsers();
    console.log(data)
    const rows = Array.isArray((data as any)?.rows) ? (data as any).rows : [];
    users.value = rows.map((r: any) => ({
      matricola: r.MATRICOLA,
      nome: r.NOME ?? r.MATRICOLA,
      cognome: r.COGNOME ?? "",
      roleId: r.ID_DIRITTO ?? null,
    }));
    console.log(users)
    await loadRoles();
  } catch (err) {
    console.error("Errore inizializzazione pagina:", err);
  }
}

function selectUser(u: any) {
  selectedUser.value = u;

  // inizializza le righe dei permessi per tutti i flussi (array vuoto)
  for (const f of flows.value) {
    if (!Array.isArray(rightsByFlow[f.id])) rightsByFlow[f.id] = [];
  }
  // popola dai permessi dell'utente
  Object.keys(u.flowPerms ?? {}).forEach((fid) => {
    const idNum = Number(fid);
    rightsByFlow[idNum] = Array.isArray(u.flowPerms[idNum]) ? [...u.flowPerms[idNum]] : [];
  });

  isDirty.value = false;
  // Crea snapshot iniziale per confronto in saveRights
  for (const f of flows.value) {
    initialRightsByFlow[f.id] = Array.isArray(rightsByFlow[f.id]) ? [...rightsByFlow[f.id]] : [];
  }
}

function onUserClick(u: any) {
  if (isDirty.value) {
    pendingUserSwitch = u;
    showUnsavedModal.value = true;
    return;
  }
  // Azzeramento diritti selezionati
  for (const f of flows.value) {
    rightsByFlow[f.id] = [];
    initialRightsByFlow[f.id] = [];
  }
  selectUser(u);
}

async function saveRights() {
  if (!selectedUser.value) return;

  if (!selectedUser.value.roleId) {
    showErrorModal.value = true;
    return;
  }

  try {
    // 1. Salva ruolo
    await apiSaveUserRole(
      Number(selectedUser.value.roleId),
      String(rightsStore.matricola ?? ""),
      getDeviceName(),
      selectedUser.value.nome
    );

    const batchInsert: any[] = []; // ðŸ‘ˆ nuovi diritti ’ 47
    const batchUpdate: any[] = []; // ðŸ‘ˆ giÃ  esistenti ’ 27

    for (const flowId in rightsByFlow) {
      const diritti = rightsByFlow[flowId] ?? [];
      const iniziali = initialRightsByFlow[flowId] ?? [];

      for (const dirittoId of diritti) {
        if (iniziali.includes(dirittoId)) {
          // giÃ  presente ’ update
          batchUpdate.push({
            params: [
              { index: 1, value: Number(flowId) },
              { index: 2, value: dirittoId },
              { index: 3, value: rightsStore.matricola },
              { index: 4, value: getDeviceName() },
              { index: 5, value: selectedUser.value.matricola },
              { index: 6, value: Number(flowId) },
            ],
          });
        } else {
          // nuovo ’ insert
          batchInsert.push({
            params: [
              { index: 1, value: Number(flowId) },
              { index: 2, value: dirittoId },
              { index: 3, value: getDeviceName() },
              { index: 4, value: rightsStore.matricola },
              { index: 5, value: selectedUser.value.matricola },
            ],
          });
        }
      }
    }

    if (batchInsert.length > 0) {
      await apiBatchInsertUserRights(batchInsert);
    }

    if (batchUpdate.length > 0) {
      await apiBatchUpdateUserRights(batchUpdate);
    }

    showConfirmModal.value = true;
    isDirty.value = false;

    // aggiorna lo snapshot
    for (const f of flows.value) {
      initialRightsByFlow[f.id] = [...(rightsByFlow[f.id] ?? [])];
    }
    // allinea anche i permessi locali dell\'utente selezionato
    if (selectedUser.value) {
      selectedUser.value.flowPerms = {} as any;
      for (const f of flows.value) {
        (selectedUser.value.flowPerms as any)[f.id] = [...(rightsByFlow[f.id] ?? [])];
      }
    }
  } catch (err) {
    console.error("Errore salvataggio:", err);
    alert("Errore durante il salvataggio dei permessi.");
  }
}

/* ================== Bootstrap ================== */
onMounted(async () => {
  await reloadUsersViaQuery6();
});
</script>
