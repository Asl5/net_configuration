<template>
  <div class="min-h-screen h-dvh w-full flex flex-col bg-gray-50">
    <BaseHeader title="Gestione ACL" />

    <div class="flex flex-1 min-h-0 overflow-hidden">
      <!-- Sidebar -->
      <aside class="hidden md:flex md:w-72 border-r overflow-y-auto bg-white md:flex-col">
        <div class="p-4 border-b flex items-center justify-between">
          <h2 class="text-sm font-semibold text-gray-700">Elenco ACL</h2>
          <BaseButton size="xs" variant="primary" @click="openAdd">+</BaseButton>
        </div>

        <ul class="flex-1">
          <li
            v-for="acl in aclList"
            :key="acl.NUMERO"
            @click="onAclClick(acl)"
            class="px-4 py-2 cursor-pointer hover:bg-gray-300 text-gray-700"
            :class="acl.NUMERO === selectedAcl?.NUMERO ? 'bg-gray-400 font-semibold text-gray-100' : ''"
          >
            #{{ acl.NUMERO }} - {{ acl.DESCRIZIONE }}
          </li>
        </ul>
      </aside>

      <!-- Dettaglio -->
      <main class="flex-1 overflow-auto p-4 md:p-6">
        <div v-if="selectedAcl" class="w-full bg-white rounded-lg shadow p-4 md:p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-800">
              ACL #{{ selectedAcl.NUMERO }}
              <span v-if="isDirty" class="ml-2 text-xs text-orange-600">(modifiche non salvate)</span>
            </h2>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <BaseInput v-model.number="selectedAcl.NUMERO" label="Numero ACL" type="number" disabled />
            <BaseSelect
              v-model="selectedAcl.DIREZIONE"
              label="Direzione"
              :options="[
                { value: 'IN', label: 'IN' },
                { value: 'OUT', label: 'OUT' }
              ]"
            />
          </div>

          <BaseInput v-model="selectedAcl.DESCRIZIONE" label="Descrizione" />
          <BaseTextArea
            v-model="selectedAcl.TESTO_CONFIG"
            label="Blocco configurazione"
            rows="10"
            class="font-mono text-xs"
          />

          <div class="flex mt-4 justify-end">
            <BaseButton size="sm" variant="primary" @click="saveAcl">Salva</BaseButton>
          </div>
        </div>

        <div v-else class="text-gray-500">Seleziona una ACL dalla lista a sinistra.</div>
      </main>
    </div>

    <!-- Modale nuova ACL -->
    <BaseModal v-model="showAdd" title="Nuova ACL" height="60vh">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <BaseInput v-model.number="newAcl.NUMERO" label="Numero ACL" type="number" />
        <BaseSelect
          v-model="newAcl.DIREZIONE"
          label="Direzione"
          :options="[
            { value: 'IN', label: 'IN' },
            { value: 'OUT', label: 'OUT' }
          ]"
        />
      </div>

      <BaseInput v-model="newAcl.DESCRIZIONE" label="Descrizione" />
      <BaseTextArea
        v-model="newAcl.TESTO_CONFIG"
        label="Blocco configurazione"
        rows="10"
        class="font-mono text-xs w-full resize-y min-h-40"
      />

      <div class="mt-3 flex justify-end gap-2 w-full">
        <BaseButton variant="secondary" @click="closeAdd">Annulla</BaseButton>
        <BaseButton variant="primary" @click="createAcl">Crea</BaseButton>
      </div>
    </BaseModal>

    <!-- Modale conferma -->
    <BaseModalAlert
      :show="showConfirm"
      title="Salvataggio riuscito"
      message="L'ACL è stata salvata correttamente."
      ok-text="OK"
      @confirm="showConfirm = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from "vue";
import BaseHeader from "@/components/base/BaseHeader.vue";
import BaseButton from "@/components/base/BaseButton.vue";
import BaseInput from "@/components/base/BaseInput.vue";
import BaseTextArea from "@/components/base/BaseTextArea.vue";
import BaseSelect from "@/components/base/BaseSelect.vue";
import BaseModal from "@/components/base/BaseModal.vue";
import BaseModalAlert from "@/components/base/BaseModalAlert.vue";
import { apiLoadAcl, apiUpdateAcl, apiCreateAcl } from "@/services/api";

/* ===== Stato ===== */
const aclList = ref<any[]>([]);
const selectedAcl = ref<any | null>(null);
const originalAcl = ref<any | null>(null);
const isDirty = ref(false);
const showAdd = ref(false);
const showConfirm = ref(false);

const newAcl = reactive({
  NUMERO: null as number | null,
  DESCRIZIONE: "",
  DIREZIONE: "IN",
  TESTO_CONFIG: "",
});

/* ===== Funzioni ===== */
async function reload() {
  const { data } = await apiLoadAcl();
  const rows = Array.isArray((data as any)?.rows) ? (data as any).rows : [];
  aclList.value = rows.map((r: any) => ({
    NUMERO: r.NUMERO,
    DESCRIZIONE: r.DESCRIZIONE ?? "",
    DIREZIONE: r.DIREZIONE ?? "IN",
    TESTO_CONFIG: r.TESTO_CONFIG ?? "",
  }));
  if (aclList.value.length && !selectedAcl.value) selectAcl(aclList.value[0]);
}

function selectAcl(a: any) {
  selectedAcl.value = JSON.parse(JSON.stringify(a));
  originalAcl.value = JSON.parse(JSON.stringify(a));
  isDirty.value = false;
}

function onAclClick(a: any) {
  if (isDirty.value && selectedAcl.value?.NUMERO !== a.NUMERO) {
    if (!confirm("Hai modifiche non salvate. Vuoi procedere?")) return;
  }
  selectAcl(a);
}

async function saveAcl() {
  if (!selectedAcl.value) return;
  await apiUpdateAcl(selectedAcl.value);
  originalAcl.value = JSON.parse(JSON.stringify(selectedAcl.value));
  isDirty.value = false;
  showConfirm.value = true;
  await reload();
}

function openAdd() {
  showAdd.value = true;
}
function closeAdd() {
  showAdd.value = false;
}

async function createAcl() {
  if (newAcl.NUMERO == null) {
    alert("Inserisci il numero ACL");
    return;
  }
  const payload = {
    NUMERO: Number(newAcl.NUMERO),
    DESCRIZIONE: newAcl.DESCRIZIONE,
    DIREZIONE: newAcl.DIREZIONE,
    TESTO_CONFIG: newAcl.TESTO_CONFIG,
  };
  await apiCreateAcl(payload);
  showAdd.value = false;
  showConfirm.value = true;
  await reload();
}

/* ===== Watch ===== */
watch(
  () => selectedAcl.value,
  (newVal, oldVal) => {
    if (!newVal || !oldVal) return;
    isDirty.value = JSON.stringify(newVal) !== JSON.stringify(originalAcl.value);
  },
  { deep: true }
);

onMounted(() => reload());
</script>
