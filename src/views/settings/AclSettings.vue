<template>
  <div class="min-h-screen h-dvh w-full flex flex-col bg-gray-50">
    <BaseHeader title="Gestione ACL" />

    <div class="flex flex-1 min-h-0 overflow-hidden">
      <!-- Sidebar -->
      <aside class="hidden md:flex md:w-72 border-r overflow-y-auto bg-white md:flex-col">
        <div class="p-4 border-b flex items-center justify-between">
          <h2 class="text-sm font-semibold text-gray-700">Elenco ACL</h2>
          <BaseButton size="xs" variant="primary" @click="openAdd">NUOVA</BaseButton>
        </div>

        <ul class="flex-1">
          <li
            v-for="acl in aclList"
            :key="acl.NUMERO"
            @click="onAclClick(acl)"
            class="px-4 py-2 cursor-pointer hover:bg-gray-300 text-gray-700"
            :class="
              acl.NUMERO === selectedAcl?.NUMERO ? 'bg-gray-400 font-semibold text-gray-100' : ''
            "
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
              <span v-if="isDirty" class="ml-2 text-xs text-orange-600"
                >(modifiche non salvate)</span
              >
            </h2>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <!-- <BaseInput v-model.number="selectedAcl.NUMERO" label="Numero ACL" type="text" disabled /> -->
            <div class="col-span-1 sm:col-span-1">
              <div class="flex items-end gap-4 w-full">
                <BaseSelect
                  v-model="selectedAcl.DIREZIONE"
                  label="Direzione"
                  :options="[
                    { value: 'IN', label: 'IN' },
                    { value: 'OUT', label: 'OUT' },
                  ]"
                  wrapper-class="w-32 md:w-40"
                />
                <BaseInput v-model="selectedAcl.DESCRIZIONE" label="Descrizione" />
              </div>
              <!-- Incolla configurazione (parse automatico, senza bottoni) -->
              <div class="col-span-2 sm:col-span-2">
                <BaseInput
                  v-model="pasteText"
                  as="textarea"
                  label="Incolla configurazione ACL Cisco"
                  rows="8"
                  class="font-mono text-xs"
                  placeholder="Incolla righe tipo: access-list 135 permit tcp host 1.2.3.4 eq 80 any"
                />
              </div>
            </div>
            <!-- Regole derivate / modificabili (input singola riga, 2 per riga) -->
            <div class="space-y-2 sm:col-span-2">
              <h3 class="text-sm font-semibold text-gray-700">Regole</h3>
              <div class="max-h-[70vh] overflow-y-auto pr-1">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div
                    v-for="(r, idx) in aclRules"
                    :key="r.ID ?? `row-${idx}`"
                    class="bg-white border rounded p-2 grid grid-cols-[minmax(0,1fr)_auto] grid-rows-2 gap-x-2 gap-y-1"
                  >
                    <BaseInput
                      v-model="r.ESTESA"
                      placeholder="Regola estesa"
                      class="font-mono text-xs w-full col-start-1 row-start-1"
                      @update:modelValue="() => updateRuleEditState(r)"
                    />
                    <div class="col-start-2 row-span-2 self-center">
                      <span
                        :class="
                          r._editing
                            ? 'bg-orange-100 text-orange-700'
                            : r.ID
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                        "
                        class="text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap"
                        >{{ r._editing ? "Da confermare" : r.ID ? "Già presente" : "Nuova" }}</span
                      >
                    </div>
                    <BaseInput
                      v-model="r.SPIEGAZIONE"
                      placeholder="Spiegazione"
                      class="text-xs w-full col-start-1 row-start-2"
                      @update:modelValue="() => updateRuleEditState(r)"
                    />
                    <span
                      :class="
                        r._editing
                          ? 'bg-orange-100 text-orange-700'
                          : r.ID
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      "
                      class="hidden text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap"
                      >{{ r._editing ? "Da confermare" : r.ID ? "Già presente" : "Nuova" }}</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex justify-end mt-2">
            <BaseButton size="xs" variant="primary" @click="importFromPaste">
              Genera dalle righe incollate
            </BaseButton>
          </div>

          <div class="flex mt-4 justify-end">
            <BaseButton size="sm" variant="primary" @click="saveAcl">Salva</BaseButton>
          </div>
        </div>

        <div v-else class="text-gray-500">Seleziona una ACL dalla lista a sinistra.</div>
      </main>
    </div>

    <!-- Modale nuova ACL -->
    <BaseModal v-model="showAdd" title="Nuova ACL" height="60vh" max-width="50vw">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <BaseInput v-model.number="newAcl.NUMERO" label="ACL" type="text" />
        <BaseSelect
          v-model="newAcl.DIREZIONE"
          label="Direzione"
          :options="[
            { value: 'IN', label: 'IN' },
            { value: 'OUT', label: 'OUT' },
          ]"
        />
        <div class="md:col-span-2 col-span-2">
          <BaseInput v-model="newAcl.DESCRIZIONE" label="Descrizione" class="" />
        </div>
      </div>

      <!-- Rimosso campo TESTO_CONFIG nella creazione -->

      <div class="mt-3 flex justify-end gap-2 w-full">
        <BaseButton variant="secondary" @click="closeAdd">Annulla</BaseButton>
        <BaseButton variant="primary" @click="createAcl">Crea</BaseButton>
      </div>
    </BaseModal>

    <!-- Conferma cambio ACL -->
    <BaseModalAlert
      :show="showUnsavedModal"
      title="Attenzione"
      message="Hai delle modifiche non salvate. Vuoi cambiare ACL?"
      ok-text="Si, continua"
      cancel-text="Annulla"
      @confirm="confirmSwitchAcl"
      @cancel="cancelSwitchAcl"
    />

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
import BaseSelect from "@/components/base/BaseSelect.vue";
import BaseModal from "@/components/base/BaseModal.vue";
import BaseModalAlert from "@/components/base/BaseModalAlert.vue";
import {
  apiLoadAcl,
  apiUpdateAcl,
  apiCreateAcl,
  apiLoadAclRules,
  apiCreateAclRuleEstesa,
  apiUpdateAclRuleEstesa,
} from "@/services/api";

/* ===== Stato ===== */
const aclList = ref<any[]>([]);
const selectedAcl = ref<any | null>(null);
const originalAcl = ref<any | null>(null);
const isDirty = ref(false);
const showAdd = ref(false);
const showConfirm = ref(false);
const showUnsavedModal = ref(false);
const pendingAcl = ref<any | null>(null);
const pasteText = ref("");
const aclRules = ref<any[]>([]);
const originalAclRules = ref<any[]>([]);

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
    ID: r.ID,
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
  // reset campi locali quando si cambia ACL
  pasteText.value = "";
  aclRules.value = [];
  originalAclRules.value = [];
  reloadRules();
}

function onAclClick(a: any) {
  if (isDirty.value && selectedAcl.value?.NUMERO !== a.NUMERO) {
    pendingAcl.value = a;
    showUnsavedModal.value = true;
    return;
  }
  selectAcl(a);
}

function confirmSwitchAcl() {
  if (pendingAcl.value) {
    const next = pendingAcl.value;
    pendingAcl.value = null;
    showUnsavedModal.value = false;
    selectAcl(next);
  } else {
    showUnsavedModal.value = false;
  }
}

function cancelSwitchAcl() {
  pendingAcl.value = null;
  showUnsavedModal.value = false;
}

async function saveAcl() {
  if (!selectedAcl.value) return;
  await apiUpdateAcl({ ...selectedAcl.value, TESTO_CONFIG: "" });
  await saveAclRulesInternal();
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
    TESTO_CONFIG: "",
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

/* ===== Regole ACL ===== */
async function reloadRules() {
  if (!selectedAcl.value?.ID) return;
  const { data } = await apiLoadAclRules(selectedAcl.value.ID);

  const rows = Array.isArray((data as any)?.rows) ? (data as any).rows : [];
  originalAclRules.value = rows.map((r: any) => ({
    ID: r.ID,
    ACL_ID: r.ACL_ID ?? selectedAcl.value.NUMERO,
    AZIONE: r.AZIONE,
    PROTOCOLLO: r.PROTOCOLLO,
    ORIGINE: r.ORIGINE,
    DESTINAZIONE: r.DESTINAZIONE,
    PORTA_DESTINAZIONE: r.PORTA_DESTINAZIONE ?? "",
    PORTA_ORIGINE: r.PORTA_ORIGINE ?? "",
    SPIEGAZIONE: (r as any).SPIEGAZIONE ?? (r as any).spiegazione ?? "",
    ESTESA: (
      ((r as any).ESTESA ?? buildExtendedFromParts(selectedAcl.value.NUMERO ?? r.ACL_ID, r)) + ""
    )
      .trim()
      .replace(/\s+/g, " "),
    _editing: false,
  }));

  // Mostriamo solo ESTESA ma manteniamo i campi per salvataggio
  aclRules.value = originalAclRules.value.map((r: any) => ({ ...r }));
}

// Converte i campi atomici in stringa estesa tipo "access-list <num> permit tcp host 1.2.3.4 any eq 80"
function buildExtendedFromParts(aclNumber: string | number, r: any) {
  const num = String(aclNumber ?? r?.ACL_ID ?? "").trim();
  const parts: string[] = [
    "access-list",
    num,
    String(r.AZIONE || "").toLowerCase(),
    String(r.PROTOCOLLO || "").toLowerCase(),
    String(r.ORIGINE || ""),
    String(r.DESTINAZIONE || ""),
  ];
  if (r.PORTA_DESTINAZIONE) parts.push("eq", String(r.PORTA_DESTINAZIONE));
  return parts.filter(Boolean).join(" ").trim();
}

function normalizeEstesa(s: string) {
  return (s || "").trim().replace(/\s+/g, " ");
}
function updateRuleEditState(rule: any) {
  try {
    const current = normalizeEstesa(rule?.ESTESA || "");
    const currentSpieg = String(rule?.SPIEGAZIONE || "").trim();
    let original = "";
    let originalSpieg = "";
    if (rule?.ID != null) {
      const o = (originalAclRules.value || []).find((x: any) => String(x.ID) === String(rule.ID));
      original = normalizeEstesa(o?.ESTESA || "");
      originalSpieg = String(o?.SPIEGAZIONE || "").trim();
    }
    rule._editing = current !== original || currentSpieg !== originalSpieg;
  } catch {}
}

// Effettua il parse di una singola riga "access-list ..." nei campi richiesti dal backend
// function parseSingleRule(line: string,) {
//   const m = /^access-list\s+(\S+)\s+(permit|deny)\s+(\S+)\s+(.+)$/i.exec(line.trim());
//   if (!m) return null;
//   const [  action, proto, rest] = m;

//   const tokens = rest.trim().split(/\s+/);
//   let i = 0;

//   const parseAddr = (): { addr: string } | null => {
//     if (i >= tokens.length) return null;
//     let addr = "";
//     if (tokens[i] === "host") {
//       if (i + 1 >= tokens.length) return null;
//       addr = `host ${tokens[i + 1]}`;
//       i += 2;
//     } else if (tokens[i] === "any") {
//       addr = "any";
//       i += 1;
//     } else {
//       if (i + 1 >= tokens.length) return null;
//       addr = `${tokens[i]} ${tokens[i + 1]}`;
//       i += 2;
//     }
//     // eventuale porta sorgente: la saltiamo (schema backend non la usa)
//     if (tokens[i] === "eq" && i + 1 < tokens.length) i += 2;
//     return { addr };
//   };

//   const src = parseAddr();
//   if (!src) return null;
//   const dst = parseAddr();
//   if (!dst) return null;

//   let portDst: string | null = null;
//   if (tokens[i] === "eq" && i + 1 < tokens.length) {
//     portDst = tokens[i + 1] ?? null;
//     i += 2;
//   }

//   return {
//     AZIONE: String(action).toUpperCase(),
//     PROTOCOLLO: String(proto).toLowerCase(),
//     ORIGINE: src.addr,
//     DESTINAZIONE: dst.addr,
//     PORTA_DESTINAZIONE: portDst || "",
//   } as any;
// }

async function saveAclRulesInternal() {
  // Inserisce/aggiorna solo tramite ESTESA usando batch
  if (!selectedAcl.value?.NUMERO) return;
  const numeroAcl = selectedAcl.value.ID;
  const toInsert: { numeroAcl: string | number; estesa: string; spiegazione?: string }[] = [];
  const toUpdate: { id: string | number; estesa: string; spiegazione?: string }[] = [];

  for (const r of aclRules.value) {
    const est = String(r.ESTESA || "")
      .trim()
      .replace(/\s+/g, " ");
    if (!est.length) continue;
    if (r.ID) {
      if (r._editing) toUpdate.push({ estesa: est, id: r.ID, spiegazione: r.SPIEGAZIONE || "" });
    } else toInsert.push({ numeroAcl, estesa: est, spiegazione: r.SPIEGAZIONE || "" });
  }
  console.log(toUpdate);
  if (toUpdate.length) await apiUpdateAclRuleEstesa(toUpdate as any);
  if (toInsert.length) await apiCreateAclRuleEstesa(toInsert as any);

  await reloadRules();
}

// parsing solo su click del bottone "Genera dalle righe incollate"

function importFromPaste() {
  const aclNum = selectedAcl.value?.NUMERO;
  if (!aclNum) return;
  const t = pasteText.value || "";
  if (!t.trim().length) return;
  // Supporta righe 'access-list <num> ...' e righe 'permit/deny ...' (ACL named)
  const prepared: string[] = [];
  const raw = t
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length);

  for (const l of raw) {
    if (/^ip\s+access-list\b/i.test(l) || /^exit\b/i.test(l) || /^remark\b/i.test(l)) continue;
    if (/^access-list\s+/i.test(l)) prepared.push(l);
    else if (/^(permit|deny)\b/i.test(l)) prepared.push(`access-list ${aclNum} ${l}`);
  }

  const normKey = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();
  const existing = new Set(aclRules.value.map((r: any) => normKey(r.ESTESA || "")));
  for (const line of prepared) {
    const normalized = line.trim().replace(/\s+/g, " ");
    const key = normKey(normalized);
    if (existing.has(key)) continue;
    aclRules.value.push({ ID: null, ACL_ID: aclNum, ESTESA: normalized, SPIEGAZIONE: "" });
    existing.add(key);
  }
}

// function parseCiscoAclConfig(text: string, aclNumber: string) {
//   const lines = text
//     .split(/\r?\n/)
//     .map((l) => l.trim())
//     .filter((l) => l.length);

//   const out: any[] = [];
//   for (const line of lines) {
//     const parsed = parseSingleRule(line.trim().replace(/\s+/g, " "), String(aclNumber));
//     if (!parsed) continue;
//     out.push({ ACL_ID: aclNumber, ...parsed });
//   }
//   return out;
// }

// salvataggio puntuale rimosso; gestione centralizzata nel Salva finale
</script>
