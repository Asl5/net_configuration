<template>
  <div class="min-h-screen h-dvh w-full flex flex-col bg-gray-50">
    <BaseHeader title="Gestione Utenti" />
    <div class="flex flex-1 min-h-0 overflow-hidden">
      <!-- Sidebar nascosta su mobile -->
      <aside class="hidden md:flex md:w-64 border-r overflow-y-auto bg-white md:flex-col">
        <div class="p-4 border-b flex items-center justify-between">
          <h2 class="text-sm font-semibold text-gray-700">Utenti</h2>
          <BaseButton size="xs" variant="primary" @click="openAddUser">NUOVA</BaseButton>
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
            {{ u.matricola }} - {{ u.nome }} {{ u.cognome }}
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
              <BaseButton size="xs" variant="primary" @click="openAddUser">NUOVA</BaseButton>
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
                {{ displayMatricola }} - {{ displayNome }} {{ displayCognome }}
                <span v-if="isDirty" class="ml-2 text-xs font-normal text-orange-600">(modifiche non salvate)</span>
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
import { ref, reactive, onMounted, watch } from "vue";
import BaseHeader from "@/components/base/BaseHeader.vue";
import BaseSelect from "@/components/base/BaseSelect.vue";
import BaseButton from "@/components/base/BaseButton.vue";
import BaseInput from "@/components/base/BaseInput.vue";
import BaseModalAlert from "@/components/base/BaseModalAlert.vue";

import {
  apiAddUser,
  apiSaveUser,
  apiDeleteUser,
  apiLoadRoles,

  apiLoadUsers,
} from "@/services/api";


/* ================== Stato ================== */
const users = ref<any[]>([]);
const selectedUser = ref<any | null>(null);
const originalUser = ref<{ nome: string; cognome: string; roleId: number | null } | null>(null);
const displayNome = ref("");
const displayCognome = ref("");
const displayMatricola = ref("");
const showUnsavedModal = ref(false);
let pendingUserSwitch: any = null;
const showDeleteModal = ref(false);

const rightsByFlow = reactive<Record<number, number[]>>({});
const initialRightsByFlow = reactive<Record<number, number[]>>({});
const isDirty = ref(false);
const showConfirmModal = ref(false);
const showErrorModal = ref(false);
const rightsByFlowNew = reactive<Record<number, number[]>>({});
const roleOptions = ref<{ value: number; label: string; descrizioneLunga: string }[]>([]);
const roleLoading = ref(false);
const flows = ref<{ id: number; nome: string; descrizioneLunga: string }[]>([]);

/* ================== Caricamento ruoli ================== */
async function loadRoles() {
  roleLoading.value = true;
  try {
    const { data } = await apiLoadRoles();
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

/* ================== Carica utenti ================== */
async function reloadUsersViaQuery6() {
  try {
    const { data } = await apiLoadUsers();
    const rows = Array.isArray((data as any)?.rows) ? (data as any).rows : [];
    users.value = rows.map((r: any) => ({
      matricola: r.MATRICOLA,
      nome: r.NOME ?? r.MATRICOLA,
      cognome: r.COGNOME ?? "",
      roleId: r.ID_DIRITTO ?? null,
    }));
    await loadRoles();
  } catch (err) {
    console.error("Errore inizializzazione pagina:", err);
  }
}

/* ================== Selezione e confronto modifiche ================== */
function selectUser(u: any) {
  // crea una copia indipendente dell'utente selezionato
  selectedUser.value = JSON.parse(JSON.stringify(u));

  displayNome.value = u?.nome ?? "";
  displayCognome.value = u?.cognome ?? "";
  displayMatricola.value = u?.matricola ?? "";

  // snapshot permessi (solo se serve)
  for (const f of flows.value) {
    if (!Array.isArray(rightsByFlow[f.id])) rightsByFlow[f.id] = [];
  }
  Object.keys(u.flowPerms ?? {}).forEach((fid) => {
    const idNum = Number(fid);
    rightsByFlow[idNum] = Array.isArray(u.flowPerms[idNum]) ? [...u.flowPerms[idNum]] : [];
  });

  // snapshot base
  originalUser.value = {
    nome: u?.nome ?? "",
    cognome: u?.cognome ?? "",
    roleId: u?.roleId ?? null,
  };

  for (const f of flows.value) {
    initialRightsByFlow[f.id] = Array.isArray(rightsByFlow[f.id])
      ? [...rightsByFlow[f.id]]
      : [];
  }

  isDirty.value = false;
}

function resetRights() {
  for (const f of flows.value) {
    rightsByFlow[f.id] = [];
    initialRightsByFlow[f.id] = [];
  }
}

function onUserClick(u: any) {
  if (isDirty.value) {
    pendingUserSwitch = u;
    showUnsavedModal.value = true;
    return;
  }
  switchToUser(u);
}

function switchToUser(u: any) {
  resetRights();
  selectUser(u);
}

function confirmUserSwitch() {
  showUnsavedModal.value = false;
  if (pendingUserSwitch) {
    // Pulisce eventuali modifiche non salvate
    discardUnsavedChanges();
    switchToUser(pendingUserSwitch);
    pendingUserSwitch = null;
  }
  isDirty.value = false;
}

function discardUnsavedChanges() {
  if (selectedUser.value && originalUser.value) {
    selectedUser.value.nome = originalUser.value.nome;
    selectedUser.value.cognome = originalUser.value.cognome;
    selectedUser.value.roleId = originalUser.value.roleId;
  }
  for (const f of flows.value) {
    rightsByFlow[f.id] = [...(initialRightsByFlow[f.id] ?? [])];
  }
}

function isRightsDirty(): boolean {
  for (const f of flows.value) {
    const cur = rightsByFlow[f.id] ?? [];
    const init = initialRightsByFlow[f.id] ?? [];
    if (cur.length !== init.length) return true;
    for (const v of cur) if (!init.includes(v)) return true;
  }
  return false;
}

/* ================== Watch su modifiche ================== */
watch(
  () => [
    selectedUser.value?.nome ?? "",
    selectedUser.value?.cognome ?? "",
    selectedUser.value?.roleId ?? null,
  ],
  () => {
    if (!selectedUser.value || !originalUser.value) return;
    isDirty.value =
      selectedUser.value.nome !== originalUser.value.nome ||
      selectedUser.value.cognome !== originalUser.value.cognome ||
      selectedUser.value.roleId !== originalUser.value.roleId ||
      isRightsDirty();
  }
);

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
  if (!newUser.matricola || !newUser.nome || !newUser.cognome || !newUser.roleId) {
    alert("Compila tutti i campi obbligatori");
    return;
  }

  try {
    await apiAddUser(newUser.matricola, newUser.nome, newUser.cognome, newUser.roleId);
    await reloadUsersViaQuery6();
    showAddUser.value = false;
    showConfirmModal.value = true;
    setTimeout(() => (showConfirmModal.value = false), 1200);
    isDirty.value = false;
    pendingUserSwitch = null;
    showUnsavedModal.value = false;
  } catch (err) {
    alert("Errore durante il salvataggio del nuovo utente.");
    console.error(err);
  }
}

/* ================== Eliminazione utente ================== */
function onClickDeleteUser() {
  if (!selectedUser.value) return;
  showDeleteModal.value = true;
}

async function performDeleteUser() {
  if (!selectedUser.value) return;
  try {
    await apiDeleteUser(selectedUser.value.matricola);
    users.value = users.value.filter((u) => u.matricola !== selectedUser.value!.matricola);
    selectedUser.value = null;
    showDeleteModal.value = false;
  } catch (e) {
    console.error(e);
    alert("Errore durante l'eliminazione utente");
  }
}

/* ================== Salvataggio ================== */
async function saveRights() {
  if (!selectedUser.value) return;
  if (!selectedUser.value.roleId) {
    showErrorModal.value = true;
    return;
  }

  try {
    await apiSaveUser(
      String(selectedUser.value.matricola ?? ""),
      String(selectedUser.value.nome ?? ""),
      String(selectedUser.value.cognome ?? ""),
      Number(selectedUser.value.roleId)
    );

    // aggiorna voce nella lista solo dopo salvataggio
  const idx = users.value.findIndex((u) => u.matricola === selectedUser.value?.matricola);
if (idx !== -1 && selectedUser.value) {
  users.value[idx] = {
    ...users.value[idx],
    nome: selectedUser.value.nome,
    cognome: selectedUser.value.cognome,
    roleId: selectedUser.value.roleId,
  } as any;
}

    // aggiorna baseline dopo salvataggio
    originalUser.value = {
      nome: selectedUser.value.nome ?? "",
      cognome: selectedUser.value.cognome ?? "",
      roleId: selectedUser.value.roleId ?? null,
    };
    for (const f of flows.value) {
      initialRightsByFlow[f.id] = [...(rightsByFlow[f.id] ?? [])];
    }

    isDirty.value = false;
    showConfirmModal.value = true;
  } catch (err) {
    console.error("Errore salvataggio:", err);
    alert("Errore durante il salvataggio dei permessi.");
  }
}

/* ================== Bootstrap ================== */
onMounted(async () => {
  await reloadUsersViaQuery6();
});

/* ================== Avviso chiusura pagina ================== */
const beforeUnloadHandler = (e: BeforeUnloadEvent) => {
  e.preventDefault();
  e.returnValue = "";
};
watch(
  () => isDirty.value,
  (dirty) => {
    if (dirty) window.addEventListener("beforeunload", beforeUnloadHandler);
    else window.removeEventListener("beforeunload", beforeUnloadHandler);
  },
  { immediate: true }
);
</script>
