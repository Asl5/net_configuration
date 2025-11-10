<template>
  <div class="min-h-screen h-dvh w-full flex flex-col bg-gray-50">
    <BaseHeader title="Mappa Topologica VLAN" />

    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar VLAN -->
      <aside class="hidden md:flex md:w-72 border-r overflow-y-auto bg-white md:flex-col">
        <div class="p-4 border-b flex items-center justify-between">
          <h2 class="text-sm font-semibold text-gray-700">VLAN</h2>
        </div>
        <ul class="flex-1">
          <li
            v-for="(v, i) in vlanList"
            :key="`${v.ID_VLAN}-${i}`"
            @click="selectVlan(v)"
            class="px-4 py-2 cursor-pointer hover:bg-gray-300 text-gray-700"
            :class="
              v.ID_VLAN === selectedVlan?.ID_VLAN ? 'bg-gray-400 font-semibold text-gray-100' : ''
            "
          >
            {{ v.ID_VLAN }}
          </li>
        </ul>
      </aside>

      <!-- Corpo principale -->
      <main class="flex-1 relative overflow-auto p-4 bg-gray-100 space-y-4">
        <div v-if="!selectedVlan" class="text-gray-500 text-center mt-10">
          Seleziona una VLAN per visualizzare i dettagli.
        </div>

        <div v-else>
          <h2 class="text-lg font-semibold text-gray-800 mb-3">Dettagli VLAN</h2>

          <!-- Nessun dato -->
          <div
            v-if="!rawRows.length"
            class="p-6 bg-white rounded-xl shadow text-center text-gray-500 italic border border-dashed border-gray-300"
          >
            Nessun dato disponibile per questa VLAN.
          </div>

          <!-- Tabs -->
          <div v-else class="flex flex-col gap-4 h-full">
            <!-- Tab bar -->
            <div class="flex items-center gap-2 border-b border-gray-300">
              <button
                v-for="t in tabs"
                :key="t.id"
                @click="activeTab = t.id"
                class="px-4 py-2 text-sm font-medium transition-all border-b-2"
                :class="
                  activeTab === t.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent hover:border-gray-300 text-gray-700'
                "
              >
                {{ t.label }}
              </button>
            </div>

            <!-- ======== TAB 1: GRIGLIA ======== -->
            <div
              v-if="activeTab === 'grid'"
              class="flex-1 bg-white rounded-xl shadow p-3 overflow-hidden"
            >
              <BaseGrid
                v-if="groupedRows.length"
                :items="groupedRows"
                :columns="columns"
                :expandable="true"
                :expand-columns="ruleColumns"
                :show-pagination="true"
                :page-size="10"
                bordered
                expand-max-height="16rem"
                sticky-header
                y-max-height="calc(100vh-280px)"
                header-bg-class="bg-gray-300"
                header-text-class="text-gray-800"
                row-text-class="text-gray-800"
                zebra-even-class="bg-gray-50"
                :showRefresh="false"
                zebra
              />
            </div>

            <!-- ======== TAB 2: STRUTTURA ======== -->
            <div
              v-if="activeTab === 'structure'"
              class="flex flex-col justify-start items-start bg-white p-6 rounded-xl shadow w-full overflow-auto h-full text-[15px]"
            >
              <div v-if="false" class="flex flex-col space-y-2">
                <!-- Sede -->
                <div class="flex items-center space-x-3">
                  <div
                    class="p-2 bg-sky-600 text-white rounded-md shadow font-semibold text-sm w-36"
                  >
                    🏥 {{ sedeName }}
                  </div>
                </div>

                <!-- Router -->
                <div class="flex items-center space-x-6 ml-6">
                  <div class="h-5 w-1 bg-gray-300"></div>
                  <div
                    class="p-2 bg-amber-500 text-white rounded-md shadow font-semibold text-sm w-36"
                  >
                    🖧 {{ routerName }}
                  </div>
                </div>

                <!-- VLAN -->
                <div class="flex items-center space-x-6 ml-12">
                  <div class="h-5 w-1 bg-gray-300"></div>
                  <div
                    class="p-2 bg-blue-600 text-white rounded-md shadow font-semibold text-sm w-36"
                  >
                    🌐 VLAN {{ selectedVlan.NOME_VLAN }}
                  </div>
                </div>

                <!-- ACL -->
                <div class="flex items-center space-x-6 ml-20">
                  <div class="h-5 w-1 bg-gray-300"></div>
                  <div
                    class="p-2 bg-red-500 text-white rounded-md shadow font-semibold text-sm w-36"
                  >
                    🧱 ACL {{ aclNumber }}
                  </div>
                </div>

                <!-- Regole in cascata -->
                <div
                  class="ml-28 space-y-2 mt-3 grid grid-cols-5 md:grid-cols-10 sm:grid-cols-10 gap-3"
                >
                  <div
                    v-for="r in rawRows"
                    :key="r.RULE_ID"
                    class="p-2 px-3 rounded-md text-white text-xs cursor-pointer shadow transition-transform hover:scale-[1.03]"
                    :class="{
                      'bg-green-600': r.AZIONE === 'PERMIT' && r.PROTOCOLLO !== 'UDP',
                      'bg-red-600': r.AZIONE === 'DENY',
                      'bg-blue-600': r.AZIONE === 'PERMIT' && r.PROTOCOLLO === 'UDP',
                    }"
                    @click="showRuleDetail(r.ORIGINE, r.DESTINAZIONE)"
                  >
                    {{ r.AZIONE }} {{ r.PROTOCOLLO }}
                  </div>
                </div>
              </div>
              <!-- Vista ad albero centrale con SVG (sempre espansa) -->
              <TopologyTree :groups="structureGroups" @open-interface="onOpenInterface" />

              <!-- Nuova struttura: sede -> vlan -> interfacce -> regole (legacy, nascosta) -->
              <div v-if="false" class="flex flex-col space-y-6 w-full">
                <div
                  v-for="(group, gi) in structureGroups"
                  :key="`struct-${gi}`"
                  class="flex flex-col space-y-3"
                >
                  <!-- Sede (toggle) -->
                  <div class="flex items-center gap-2 cursor-pointer select-none" @click="toggleSede(group.sede)">
                    <span class="text-blue-200">{{ isSedeOpen(group.sede) ? '▼' : '►' }}</span>
                    <div
                      class="p-2 rounded-md font-semibold text-sm w-52 bg-blue-600 text-white border border-blue-600 shadow"
                    >
                      🏥 {{ group.sede }}
                    </div>
                  </div>
                  <!-- VLAN per sede -->
                  <div class="flex flex-col space-y-2 ml-6" v-show="isSedeOpen(group.sede)">
                    <div
                      v-for="(vlan, vi) in group.vlans"
                      :key="`v-${vi}`"
                      class="flex flex-col space-y-2"
                    >
                      <div class="flex items-center space-x-4 cursor-pointer select-none" @click="toggleVlan(group.sede, vlan)">
                        <div class="h-5 w-1 bg-gray-300"></div>
                        <div
                          class="p-2 rounded-md font-semibold text-sm w-64 bg-blue-300 text-white border border-blue-300 shadow"
                        >
                         🌐 VLAN {{ vlan.id }} - {{ vlan.name }}
                        </div>
                      </div>
                      <!-- Interfacce per VLAN (sotto la card VLAN) -->
                      <div class="flex flex-col space-y-2 ml-12 mt-2" v-show="isVlanOpen(group.sede, vlan)">
                        <div
                          class="flex items-center space-x-3"
                          v-for="(iface, ii) in vlan.interfaces"
                          :key="`i-${ii}`"
                        >
                          <div class="h-5 w-1 bg-gray-300"></div>
                          <div
                            class="p-2 rounded-md font-semibold text-xs w-44 cursor-pointer bg-amber-500 text-white border border-amber-500 shadow hover:bg-amber-600"
                            @click="showInterface(group.sede, vlan.id, vlan.name, iface)"
                          >
                            🧱 {{ iface }}
                          </div>
                        </div>
                      </div>
                      <!-- Regole raggruppate per categoria (es. "PERMIT UDP", "DENY") con barra verticale e indentazione coerente -->
                      <div class="flex items-start space-x-3 ml-20 mt-2" v-show="isVlanOpen(group.sede, vlan)">
                        <div class="mt-2 h-5 w-1 bg-gray-300"></div>
                        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          <div
                            v-for="cat in groupRulesByLabel(vlan.rules)"
                            :key="cat.label"
                            class="p-2 px-3 rounded-md text-xs cursor-pointer transition-colors border"
                            :class="cat.color"
                            @click="showCategory(cat.label, cat.items)"
                          >
                            {{ cat.label }} ({{ cat.items.length }})
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- ======== TAB 3: DISPOSITIVI ======== -->
            <div v-if="activeTab === 'devices'" class="flex-1 bg-white rounded-xl shadow p-3 overflow-hidden">
              <div class="mb-2 text-sm text-gray-600">Dispositivi per VLAN selezionata</div>
              <div class="space-y-3">
                <div
                  v-for="key in deviceGroupKeys"
                  :key="`dev-${key}`"
                  class="border rounded-lg overflow-hidden"
                  :class="expandedDeviceGroups[key] ? 'border-blue-300' : 'border-gray-200'"
                >
                  <button
                    class="w-full flex items-center justify-between px-3 py-2 text-sm font-medium border-l-4"
                    :class="expandedDeviceGroups[key]
                      ? 'bg-blue-100 text-blue-900 border-blue-400'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300'"
                    @click="toggleDeviceGroup(key)"
                  >
                    <span>
                      {{ parseDeviceKey(key).sede || '-' }} - VLAN {{ (selectedVlan as any)?.ID ?? (selectedVlan as any)?.ID_VLAN }} {{ parseDeviceKey(key).name }}
                  </span>
                    <span>{{ expandedDeviceGroups[key] ? 'Nascondi' : 'Mostra' }}</span>
                  </button>
                  <div v-show="expandedDeviceGroups[key]" class="overflow-auto max-h-96 p-2">
                    <div v-if="loadingDevice[key]" class="text-gray-500 italic p-2">Caricamento dispositivi...</div>
                    <BaseGrid
                      v-else-if="(deviceRowsByGroup[key] || []).length"
                      :items="deviceRowsByGroup[key]"
                      :columns="deviceColumns"
                      :show-pagination="true"
                      :page-size="10"
                      bordered
                      sticky-header
                      y-max-height="calc(100vh-320px)"
                      header-bg-class="bg-gray-300"
                      header-text-class="text-gray-800"
                      row-text-class="text-gray-800"
                      zebra-even-class="bg-gray-50"
                      :showRefresh="false"
                      zebra
                    />
                    <div v-else class="text-gray-500 italic p-2">Nessun dispositivo trovato.</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- ======== TAB 4: HEATMAP ======== -->
            <div
              v-if="activeTab === 'heatmap'"
              class="bg-white rounded-xl p-4 shadow h-full overflow-auto"
            >
              <h3 class="text-md font-semibold text-gray-800 mb-3">Matrice ACL</h3>
              <!-- Vista semplice quando c'è un solo gruppo -->
              <div v-if="heatmapGroupKeys.length <= 1" class="overflow-x-auto">
                <table class="min-w-full border border-gray-200 rounded-lg text-sm">
                  <thead class="bg-gray-100 text-gray-700">
                    <tr>
                      <th class="p-2 border text-left">Origine</th>
                      <th v-for="dest in destinations" :key="dest" class="p-2 border text-center">
                        {{ dest }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="src in sources" :key="src">
                      <td class="p-2 border font-medium text-gray-700 bg-gray-50">{{ src }}</td>
                      <td
                        v-for="dest in destinations"
                        :key="`${src}-${dest}`"
                        class="p-2 border text-center cursor-pointer"
                        :class="{
                          'bg-green-200 text-green-900': getMatrixValue(src, dest) === 'PERMIT',
                          'bg-red-200 text-red-900': getMatrixValue(src, dest) === 'DENY',
                          'bg-gray-100 text-gray-400': getMatrixValue(src, dest) === '-',
                        }"
                        @click="showRuleDetail(src, dest)"
                      >
                        {{ getMatrixValue(src, dest) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <!-- Accordion per più gruppi (single-open, evidenzia selezionato) -->
              <div v-else class="space-y-3">
                <div
                  v-for="key in heatmapGroupKeys"
                  :key="`acl-${key}`"
                  class="border rounded-lg overflow-hidden"
                  :class="expandedHeatmaps[key] ? 'border-blue-300' : 'border-gray-200'"
                >
                  <button
                    class="w-full flex items-center justify-between px-3 py-2 text-sm font-medium border-l-4"
                    :class="expandedHeatmaps[key]
                      ? 'bg-blue-100 text-blue-900 border-blue-400'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300'"
                    @click="toggleHeatmap(key)"
                  >
                    <span>
                      {{ parseHeatmapKey(key).sede || '-' }} - VLAN {{ parseHeatmapKey(key).id }} {{ parseHeatmapKey(key).name }}
                    </span>
                    <span>{{ expandedHeatmaps[key] ? 'Nascondi' : 'Mostra' }}</span>
                  </button>
                  <div v-show="expandedHeatmaps[key]" class="overflow-auto max-h-96 p-2">
                    <table class="min-w-full border border-gray-200 rounded-lg text-sm">
                      <thead class="bg-gray-100 text-gray-700">
                        <tr>
                          <th class="p-2 border text-left">Origine</th>
                          <th
                            v-for="dest in destinationsFor(key)"
                            :key="`d-${key}-${dest}`"
                            class="p-2 border text-center"
                          >
                            {{ dest }}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="src in sourcesFor(key)" :key="`s-${key}-${src}`">
                          <td class="p-2 border font-medium text-gray-700 bg-gray-50">{{ src }}</td>
                          <td
                            v-for="dest in destinationsFor(key)"
                            :key="`c-${key}-${src}-${dest}`"
                            class="p-2 border text-center cursor-pointer"
                            :class="{
                              'bg-green-200 text-green-900':
                                getMatrixValueFor(key, src, dest) === 'PERMIT',
                              'bg-red-200 text-red-900':
                                getMatrixValueFor(key, src, dest) === 'DENY',
                              'bg-gray-100 text-gray-400':
                                getMatrixValueFor(key, src, dest) === '-',
                            }"
                            @click="showRuleDetailFor(key, src, dest)"
                          >
                            {{ getMatrixValueFor(key, src, dest) }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- Modale dettaglio -->
    <BaseModal v-model="showDetail" :title="detailTitle" max-height="50vh" max-width="30vw" body-class="overflow-auto">
      <!-- Elenco semplice delle regole in chiaro -->
      <div v-if="Array.isArray(selectedNode) && selectedNode.length" class="space-y-2">
        <div v-for="(it, idx) in selectedNode" :key="it.RULE_ID ?? idx" class="text-sm">
          <span class="inline-flex items-center rounded border bg-white px-2 py-1 text-gray-700">
            {{ it.ESTESA || ruleToString(it) }}
          </span>
        </div>
      </div>
      <!-- Fallback generico -->
      <div v-else-if="selectedNode" class="text-xs">
        <pre class="bg-gray-100 p-2 rounded border font-mono whitespace-pre-wrap"
          >{{ JSON.stringify(selectedNode, null, 2) }}
        </pre>
      </div>
      <div v-else class="text-gray-400 text-sm">Nessun dettaglio disponibile.</div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <BaseButton baseClass="flex justify-end" variant="secondary" @click="showDetail = false"
            >Chiudi</BaseButton
          >
        </div>
      </template>
    </BaseModal>
    <!-- Modale dispositivi -->
    <BaseModal v-model="showDevices" :title="devicesTitle" height="70vh" body-class="overflow-auto">
      <div class="space-y-3">
        <BaseGrid
          v-if="deviceRows.length"
          :items="deviceRows"
          :columns="deviceColumns"
          :show-pagination="true"
          :page-size="10"
          bordered
          sticky-header
          y-max-height="calc(70vh - 140px)"
          header-bg-class="bg-gray-300"
          header-text-class="text-gray-800"
          row-text-class="text-gray-800"
          zebra-even-class="bg-gray-50"
          :showRefresh="false"
          zebra
        />
        <div v-else class="text-gray-500 italic">Nessun dispositivo trovato.</div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <BaseButton variant="secondary" @click="showDevices = false">Chiudi</BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import BaseHeader from "@/components/base/BaseHeader.vue";
import BaseModal from "@/components/base/BaseModal.vue";
import BaseButton from "@/components/base/BaseButton.vue";
import TopologyTree from "@/components/custom/TopologyTree.vue";
// import BaseCard from "@/components/base/BaseCard.vue";
// import BaseLabel from "@/components/base/BaseLabel.vue";
import BaseGrid from "@/components/base/BaseGrid.vue";
import { textCol, type GridColumn } from "@/grids/columns";
import { apiLoadVlans, apiLoadVlanPanoramica } from "@/services/api";
import { apiLoadDevicesForVlan } from "@/services/api";

const vlanList = ref<any[]>([]);
const selectedVlan = ref<any | null>(null);
const rawRows = ref<any[]>([]);
const groupedRows = ref<any[]>([]);
const showDetail = ref(false);
const selectedNode = ref<any | null>(null);
const detailTitle = ref("Dettagli");
// Modale dispositivi
const showDevices = ref(false);
const devicesTitle = ref("Dispositivi");
// Heatmap state
const expandedHeatmaps = ref<Record<string, boolean>>({});

// Dati per la tab Struttura derivano dalla VLAN selezionata (rawRows)

const tabs = [
  { id: "grid", label: "Tabellare" },
  { id: "structure", label: "Struttura" },
  { id: "devices", label: "Dispositivi" },
  { id: "heatmap", label: "Heatmap ACL" },
];
const activeTab = ref("grid");

/* Colonne */
type Row = Record<string, unknown>;
const columns: GridColumn<Row>[] = [
  textCol<Row>("NOME_SEDE", "Sede"),
  textCol<Row>("NOME_VLAN", "VLAN"),
  textCol<Row>("NOME_INTERFACCIA", "Interfaccia"),
  textCol<Row>("DEVICE_NAME", "Router"),
  textCol<Row>("ACL_NUMERO", "ACL"),
  textCol<Row>("SUBNET", "Subnet"),
  textCol<Row>("MASK", "Maschera"),
  textCol<Row>("GATEWAY", "Gateway"),
  textCol<Row>("IP_START", "IP Inizio"),
  textCol<Row>("IP_END", "IP Fine"),
  textCol<Row>("USABLE_IPS", "IP disponibili")];
const ruleColumns: GridColumn<Row>[] = [
  textCol<Row>("ESTESA", "Regola"),
];

// Dispositivi
const deviceRows = ref<any[]>([]);
type DevRow = Record<string, unknown>;
const deviceColumns: GridColumn<DevRow>[] = [
  textCol<DevRow>("NOME_SEDE", "Sede"),
  textCol<DevRow>("STANZA", "Stanza"),
  textCol<DevRow>("DESCRIZIONE", "Descrizione"),
  textCol<DevRow>("SERIALE", "Seriale"),
  textCol<DevRow>("HOST_NAME", "Hostname"),
  textCol<DevRow>("PORTA", "Porta"),
  textCol<DevRow>("IP", "IP"),
  textCol<DevRow>("FORNITORE", "Fornitore"),
  textCol<DevRow>("NOTE", "Note"),
  textCol<DevRow>("STATO", "Stato"),
  textCol<DevRow>("DATA_REVISIONE", "Data revisione"),
];

async function loadDevicesForSelectedVlan(sede?: string) {
  const id = (selectedVlan.value as any)?.ID ?? (selectedVlan.value as any)?.ID_VLAN;
  if (!id) {
    deviceRows.value = [];
    return;
  }
  const { data } = await apiLoadDevicesForVlan(id).catch(() => ({ data: { rows: [] } }));
  const rows = Array.isArray((data as any)?.rows) ? (data as any).rows : [];
  const base = sede ? rows.filter((r: any) => String(r.NOME_SEDE ?? '') === String(sede)) : rows;
  deviceRows.value = uniqDevices(base);
}



// Gruppi dispositivi per sede + nome VLAN variabile
const deviceGroupKeys = computed(() => {
  const keys = new Set<string>();
  for (const r of rawRows.value) {

    const sede = String(r.NOME_SEDE ?? '');
    const name = String(r.NOME_VLAN ?? selectedVlan.value?.NOME_VLAN ?? '');
    const assoc = String(
      (r as any).ID_VLAN_SEQ ?? (r as any).VLAN_SEDE_ID ?? (r as any).ID_VAL ?? ''
    );
    if (!assoc) {
      // Debug: manca l'ID di associazione nella riga
      console.warn('deviceGroupKeys: associazione assente per riga', { sede, name, row: r });
      continue;
    }
    // Chiave: assocId|sede|nome
    keys.add(`${assoc}|${sede}|${name}`);
  }
  return Array.from(keys);
});
function parseDeviceKey(key: string) {
  const [assoc, sede, name] = String(key).split('|');
  return { assoc, sede, name };
}
const expandedDeviceGroups = ref<Record<string, boolean>>({});
const deviceRowsByGroup = ref<Record<string, any[]>>({});
const loadingDevice = ref<Record<string, boolean>>({});
async function toggleDeviceGroup(key: string) {
  expandedDeviceGroups.value[key] = !expandedDeviceGroups.value[key];
  // Se si apre un gruppo, chiudi tutti gli altri (accordion single-open)
  if (expandedDeviceGroups.value[key]) {
    for (const k of Object.keys(expandedDeviceGroups.value)) {
      if (k !== key) expandedDeviceGroups.value[k] = false;
    }
  }
  if (expandedDeviceGroups.value[key]) {
    if (!deviceRowsByGroup.value[key] || deviceRowsByGroup.value[key].length === 0) {
      const { assoc } = parseDeviceKey(key);
      loadingDevice.value[key] = true;
      try {
        const id = (selectedVlan.value as any)?.ID ?? (selectedVlan.value as any)?.ID_VLAN;

        if (id) {
          const { data } = await apiLoadDevicesForVlan(id).catch(() => ({ data: { rows: [] } }));
          const rows = Array.isArray((data as any)?.rows) ? (data as any).rows : [];
          const assocOf = (r: any) => String(r.ID_VLAN_UNIQUE ?? r.VLAN_SEDE_ID ?? r.ID_VAL ?? '');

          // Filtra SOLO per associazione; se assente, non mostrare nulla per evitare duplicazioni
          const filtered = assoc ? rows.filter((r: any) => assocOf(r) === assoc) : [];
          const deduped = uniqDevices(filtered);

          deviceRowsByGroup.value[key] = deduped;
        } else {
          deviceRowsByGroup.value[key] = [];
        }
      } finally {
        loadingDevice.value[key] = false;
      }
    }
  }
}

// Deduplica dispositivi uguali (la 28 replica righe per regole/interfacce)
function uniqDevices(rows: any[]) {
  const seen = new Set<string>();
  const keyOf = (r: any) => [
    String(r.SERIALE ?? ''),
    String(r.HOST_NAME ?? ''),
    String(r.IP ?? ''),
    String(r.PORTA ?? ''),
    String(r.STANZA ?? ''),
    String(r.NOME_SEDE ?? ''),
  ].join('|');
  const out: any[] = [];
  for (const r of rows) {
    const k = keyOf(r);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(r);
  }
  return out;
}

/* Load VLAN */
async function loadVlans() {
  const { data } = await apiLoadVlans().catch(() => ({ data: { rows: [] } }));

  const rows = Array.isArray((data as any)?.rows) ? (data as any).rows : [];
  // Mostra una sola voce per ogni ID_VLAN (no duplicati)
  const map: Record<number, { ID_VLAN: number; NOME_VLAN: string; SEDI: Set<string> }> = {};
  for (const r of rows) {
    const id = Number(r.ID_VLAN);
    if (!id) continue;
    if (!map[id]) map[id] = { ID_VLAN: id, NOME_VLAN: r.NOME_VLAN, SEDI: new Set<string>() };
    if (r.DESCRIZIONE) map[id].SEDI.add(r.DESCRIZIONE);
  }
  vlanList.value = Object.values(map).map((v) => ({
    ID_VLAN: v.ID_VLAN,
    NOME_VLAN: v.NOME_VLAN,
    SEDI: Array.from(v.SEDI),
  }));
}

// Carica dati globali per costruire la struttura sede -> vlan -> interfacce
// nessun caricamento extra richiesto per la struttura

/* Selezione VLAN */
async function selectVlan(v: any) {
  selectedVlan.value = v;
  activeTab.value = "grid";
  const { data } = await apiLoadVlanPanoramica(v.ID_VLAN).catch(() => ({ data: { rows: [] } }));
  const rows = ((data as any)?.rows ?? []) as any[];
  // Inietta il nome VLAN nelle righe per mostrarlo in griglia

  // Helpers per normalizzare subnet e calcolare IP utilizzabili
  function parseMaskToCidr(maskStr: null){
    if (maskStr == null) return null;
    const s = String(maskStr).trim();
    if (!s) return null;
    const asNum = Number(s);
    if (!Number.isNaN(asNum) && asNum >= 0 && asNum <= 32) return asNum;
    const parts = s.split(".").map((n) => Number(n));
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return null;
    let maskInt = (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
    const inv = (~maskInt) >>> 0;
    if (((inv + 1) & inv) !== 0) return null;
    let cidr = 0;
    while ((maskInt & 0x80000000) >>> 0) {
      cidr++;
      maskInt = (maskInt << 1) >>> 0;
    }
    return cidr;
  }
  function normalizeSubnetString(subnet: any, mask: any){
    const ip = String(subnet ?? "").trim();
    if (!ip) return "";
    if (ip.includes("\\")) return ip;
    if (ip.includes("/")) return ip.replace("/", "\\");
    const cidr = parseMaskToCidr(mask);
    return cidr != null ? `${ip}\\${cidr}` : ip;
  }
  function usableIps(subnet: any, mask: any){
    const s = String(subnet ?? "").trim();
    let cidr = null;
    if (s.includes("\\")) {
      const suf = s.split("\\")[1];
      const n = Number(suf);
      if (!Number.isNaN(n)) cidr = n;
    } else if (s.includes("/")) {
      const suf = s.split("/")[1];
      const n = Number(suf);
      if (!Number.isNaN(n)) cidr = n;
    }
    if (cidr == null) cidr = parseMaskToCidr(mask);
    if (cidr == null) return 0;
    const hostBits = 32 - cidr;
    if (cidr >= 31) return 0;
    return Math.max(0, Math.pow(2, hostBits) - 2);
  }
  // Inietta colonne derivate per griglia
  rawRows.value = rows.map((r) => ({
    ...r,
    NOME_VLAN: r.NOME_VLAN ?? v.NOME_VLAN,
    ESTESA: r.ESTESA ?? ruleToString(r),
    SUBNET: normalizeSubnetString(r.SUBNET, r.MASK),
    USABLE_IPS: usableIps(r.SUBNET, r.MASK),
  }));
  groupedRows.value = groupRowsForGrid(rawRows.value);
  // Precarica dispositivi per la tab dedicata
  loadDevicesForSelectedVlan();
}

function groupRowsForGrid(rows: any[]) {
  const grouped: Record<string, any> = {};
  for (const r of rows) {
    const nomeVlan = r.NOME_VLAN ?? "";
    const key = `${r.NOME_SEDE}-${nomeVlan}-${r.ACL_NUMERO}`;
    if (!grouped[key]) {
      grouped[key] = { ...r, _children: [] };
    }
        // Aggiungi alla sottogriglia solo se ha interfaccia e regola non vuota
    {
      const iface = String(r.NOME_INTERFACCIA ?? r.DEVICE_NAME ?? "").trim();
      const estesa = String((r as any).ESTESA ?? "").trim();
      if (iface && estesa) grouped[key]._children.push(r);
    }
  }
  return Object.values(grouped).map((g) => ({ ...g, RULE_COUNT: g._children.length }));
}

/* Heatmap */
const sources = computed(() => [...new Set(rawRows.value.map((r) => r.ORIGINE))]);
const destinations = computed(() => [...new Set(rawRows.value.map((r) => r.DESTINAZIONE))]);

// Gruppi heatmap per Sede + ID_VLAN (mostra entrambe anche se NOME_VLAN coincide)
const heatmapGroupKeys = computed(() => {
  const keys = new Set<string>();
  for (const r of rawRows.value) {
    const sede = String(r.NOME_SEDE ?? "");
    const id = String(r.ID_VLAN ?? selectedVlan.value?.ID_VLAN ?? "");
    const name = String(r.NOME_VLAN ?? selectedVlan.value?.NOME_VLAN ?? "");
    const k = `${sede}|${id}|${name}`;
    keys.add(k);
  }
  return Array.from(keys);
});

function parseHeatmapKey(key: string) {
  const [sede, id, name] = String(key).split("|");
  return { sede, id, name };
}
function rowsFor(key: string) {
  const { sede, id } = parseHeatmapKey(key);
  return rawRows.value.filter(
    (r) => String(r.NOME_SEDE ?? "") === sede && String(r.ID_VLAN ?? selectedVlan.value?.ID_VLAN ?? "") === id
  );
}
function sourcesFor(key: string) {
  return [...new Set(rowsFor(key).map((r) => r.ORIGINE))];
}
function destinationsFor(key: string) {
  return [...new Set(rowsFor(key).map((r) => r.DESTINAZIONE))];
}
function getMatrixValueFor(key: string, src: string, dest: string) {
  const match = rowsFor(key).find((r) => r.ORIGINE === src && r.DESTINAZIONE === dest);
  return match ? match.AZIONE : "-";
}
function toggleHeatmap(key: string) {
  expandedHeatmaps.value[key] = !expandedHeatmaps.value[key];
  // Chiudi gli altri gruppi quando uno viene aperto (single-open)
  if (expandedHeatmaps.value[key]) {
    for (const k of Object.keys(expandedHeatmaps.value)) {
      if (k !== key) expandedHeatmaps.value[k] = false;
    }
  }
}
function getMatrixValue(src: string, dest: string) {
  const match = rawRows.value.find((r) => r.ORIGINE === src && r.DESTINAZIONE === dest);
  return match ? match.AZIONE : "-";
}
function showRuleDetail(src: string, dest: string) {
  const rule = rawRows.value.find((r) => r.ORIGINE === src && r.DESTINAZIONE === dest);
  if (rule) {
    selectedNode.value = [rule];
    const sede = rule.NOME_SEDE ?? "";
    const vlanId = rule.ID_VLAN ?? "";
    const vlanName = rule.NOME_VLAN ?? "";
    const acl = rule.ACL_NUMERO ?? "";
    const cat = categoryLabel(rule);
    detailTitle.value = `${sede} | VLAN ${vlanId} ${vlanName} | ACL #${acl} | ${cat}`;
    showDetail.value = true;
  }
}

// Dettaglio per cella in heatmap espansa (scoped al gruppo sede+vlan)
function showRuleDetailFor(key: string, src: string, dest: string) {
  const rule = rowsFor(key).find((r) => r.ORIGINE === src && r.DESTINAZIONE === dest);
  if (rule) {
    selectedNode.value = [rule];
    const sede = rule.NOME_SEDE ?? "";
    const vlanId = rule.ID_VLAN ?? "";
    const vlanName = rule.NOME_VLAN ?? "";
    const acl = rule.ACL_NUMERO ?? "";
    const cat = categoryLabel(rule);
    detailTitle.value = `${sede} | VLAN ${vlanId} ${vlanName} | ACL #${acl} | ${cat}`;
    showDetail.value = true;
  }
}

// Raggruppa regole per etichetta (AZIONE + PROTOCOLLO) e calcola colore
function groupRulesByLabel(rules: any[]) {
  const map: Record<string, { label: string; color: string; items: any[] }> = {};
  for (const r of rules || []) {
    const action = String(r.AZIONE || "").trim();
    const proto = String(r.PROTOCOLLO || "").trim();
    const label = `${action}${proto ? " " + proto : ""}`;
    if (!map[label]) {
      // Card colore pieno = stesso colore di bordo + ombra
      let color = "bg-green-600 text-white border border-green-600 shadow hover:bg-green-700";
      if (action === "DENY")
        color = "bg-red-600 text-white border border-red-600 shadow hover:bg-red-700";
      else if (proto === "UDP")
        color = "bg-blue-600 text-white border border-blue-600 shadow hover:bg-blue-700";
      map[label] = { label, color, items: [] };
    }
    map[label].items.push(r);
  }
  return Object.values(map);
}

function showCategory(label: string, items: any[]) {
  selectedNode.value = items;
  const first = items[0] || {};
  const sede = first.NOME_SEDE ?? "";
  const vlanId = first.ID_VLAN ?? "";
  const vlanName = first.NOME_VLAN ?? "";
  const acl = first.ACL_NUMERO ?? "";
  const cat = categoryLabel(first);
  detailTitle.value = `${sede} | VLAN ${vlanId} ${vlanName} | ACL #${acl} | ${cat}`;
  showDetail.value = true;
}

function showInterface(sede: string, vlanId: string | number, vlanName: string, ifaceName: string) {
  const rows = rawRows.value.filter((r) => {
    const sameSede = String(r.NOME_SEDE ?? "") === String(sede);
    const sameVlan = String(r.ID_VLAN ?? selectedVlan.value?.ID_VLAN ?? "") === String(vlanId);
    const sameVlanName =
      String(r.NOME_VLAN ?? selectedVlan.value?.NOME_VLAN ?? "") === String(vlanName);
    const sameIface = String(r.NOME_INTERFACCIA ?? r.DEVICE_NAME ?? "") === String(ifaceName);
    return sameSede && sameVlan && sameVlanName && sameIface;
  });
  selectedNode.value = rows;
  detailTitle.value = `${sede} | VLAN ${vlanId} ${vlanName} | Interfaccia ${ifaceName} (${rows.length})`;
  showDetail.value = true;
}

// Handler per componente TopologyTree
function onOpenInterface(payload: { sede: string; vlanId: string | number; vlanName: string; iface: string }) {
  showInterface(payload.sede, payload.vlanId, payload.vlanName, payload.iface);
}

// Rende la regola in stringa semplice leggibile
function ruleToString(r: any) {
  const acl = String(r.ACL_NUMERO ?? "").trim();
  const act = String(r.AZIONE ?? "").toLowerCase(); // permit/deny
  const proto = String(r.PROTOCOLLO ?? "").toLowerCase(); // udp/tcp/icmp
  const srcRaw = String(r.ORIGINE ?? "").trim();
  const dstRaw = String(r.DESTINAZIONE ?? "").trim();
  const dstPort = String(r.PORTA_DESTINAZIONE ?? "").trim();

  const isIPv4 = (s: string) =>
    /^((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/.test(s);
  const normAddr = (s: string) => {
    if (!s) return "any";
    const low = s.toLowerCase();
    if (low === "any") return "any";
    if (low.startsWith("host ")) return s; // already formatted
    if (isIPv4(s)) return `host ${s}`;
    return s; // fallback (e.g., subnet, object-group)
  };

  const src = normAddr(srcRaw);
  const dst = normAddr(dstRaw);
  const portPart = dstPort ? ` eq ${dstPort}` : "";
  return `access-list ${acl} ${act} ${proto} ${src} ${dst}${portPart}`.replace(/\s+/g, " ").trim();
}

// Macro categoria (permit udp, deny, ecc.)
function categoryLabel(r: any) {
  const action = String(r.AZIONE ?? '').toLowerCase();
  const proto = String(r.PROTOCOLLO ?? '').toLowerCase();
  return `${action}${proto ? ' ' + proto : ''}`;
}
// function categoryClass(r: any) {
//   const action = String(r.AZIONE ?? '').toUpperCase();
//   const proto = String(r.PROTOCOLLO ?? '').toUpperCase();
//   if (action === 'DENY') return 'bg-red-50 text-red-800 border-red-300';
//   if (proto === 'UDP') return 'bg-blue-50 text-blue-800 border-blue-300';
//   return 'bg-green-50 text-green-800 border-green-300';
// }

/* Computed utili */
// Struttura: sede -> (solo) VLAN selezionata -> interfacce -> regole
const structureGroups = computed(() => {
  type VlanStruct = { id: string | number; name: string; interfaces: string[]; rules: any[] };
  const groups: Record<string, { sede: string; vlans: VlanStruct[] }> = {};
  const bySedeVlan: Record<string, VlanStruct> = {};
  for (const r of rawRows.value) {
    const sede = r.NOME_SEDE ?? "Sede";
    const vlanId = r.ID_VLAN ?? selectedVlan.value?.ID_VLAN;
    const vlanName = r.NOME_VLAN ?? selectedVlan.value?.NOME_VLAN ?? "";
    const iface = r.NOME_INTERFACCIA ?? r.DEVICE_NAME ?? "";

    if (!groups[sede]) groups[sede] = { sede, vlans: [] };
    const key = `${sede}::${vlanId}::${vlanName}`;
    if (!bySedeVlan[key]) {
      bySedeVlan[key] = { id: vlanId, name: vlanName, interfaces: [], rules: [] };
      groups[sede].vlans.push(bySedeVlan[key]);
    }
    const vs = bySedeVlan[key];
    if (iface && !vs.interfaces.includes(iface)) vs.interfaces.push(iface);
    vs.rules.push(r);
  }
  return Object.values(groups);
});

// Manteniamo anche i vecchi computed per compatibilità del template legacy
const sedeName = computed(() => rawRows.value[0]?.NOME_SEDE ?? "Sede");
const routerName = computed(() => rawRows.value[0]?.DEVICE_NAME ?? "Router");
const aclNumber = computed(() => rawRows.value[0]?.ACL_NUMERO ?? "-");

// Sedi per la tab "Sedi" derivate dai dati caricati per la VLAN selezionata
// const sediForSelectedVlan = computed(() => {
//   return [...new Set(rawRows.value.map((r) => r.NOME_SEDE))].filter((v): v is string => !!v);
// });

// Stato espansione per vista ad albero (Struttura)
const expandedSedi = ref<Record<string, boolean>>({});
const expandedVlans = ref<Record<string, Record<string, boolean>>>({});
function sedeKey(s: string) {
  return String(s);
}
function vlanKey(v: { id: string | number; name: string }) {
  return `${String(v.id)}|${String(v.name)}`;
}
function isSedeOpen(sede: string) {
  return !!expandedSedi.value[sedeKey(sede)];
}
function toggleSede(sede: string) {
  const key = sedeKey(sede);
  const next = !expandedSedi.value[key];
  // single-open per sedi
  expandedSedi.value = {};
  if (next) expandedSedi.value[key] = true;
}
function isVlanOpen(sede: string, vlan: { id: string | number; name: string }) {
  const sk = sedeKey(sede);
  const vk = vlanKey(vlan);
  return !!(expandedVlans.value[sk] && expandedVlans.value[sk][vk]);
}
function toggleVlan(sede: string, vlan: { id: string | number; name: string }) {
  const sk = sedeKey(sede);
  const vk = vlanKey(vlan);
  if (!expandedVlans.value[sk]) expandedVlans.value[sk] = {};
  const next = !expandedVlans.value[sk][vk];
  // single-open per VLAN all'interno della sede
  expandedVlans.value[sk] = {};
  if (next) expandedVlans.value[sk][vk] = true;
}

onMounted(() => loadVlans());
</script>


