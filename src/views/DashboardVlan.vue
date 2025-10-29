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
            v-for="v in vlanList"
            :key="v.ID_VLAN"
            @click="selectVlan(v)"
            class="px-4 py-2 cursor-pointer hover:bg-gray-300 text-gray-700"
            :class="v.ID_VLAN === selectedVlan?.ID_VLAN ? 'bg-gray-400 font-semibold text-gray-100' : ''"
          >
            {{ v.NOME_VLAN }}
          </li>
        </ul>
      </aside>

      <!-- Corpo principale -->
      <main class="flex-1 relative overflow-auto p-4 bg-gray-100 space-y-4">
        <div v-if="!selectedVlan" class="text-gray-500 text-center mt-10">
          Seleziona una VLAN per visualizzare i dettagli.
        </div>

        <div v-else>
          <!-- Titolo VLAN -->
          <h2 class="text-lg font-semibold text-gray-800 mb-3">
            Dettagli VLAN {{ selectedVlan.NOME_VLAN }} (ID: {{ selectedVlan.ID_VLAN }})
          </h2>

          <!-- Tabs -->
          <div class="flex items-center gap-2 border-b border-gray-300 mb-4">
            <button
              v-for="t in tabs"
              :key="t.id"
              @click="activeTab = t.id"
              class="px-4 py-2 text-sm font-medium transition-all border-b-2"
              :class="activeTab === t.id
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent hover:border-gray-300 text-gray-700'"
            >
              {{ t.label }}
            </button>
          </div>

          <!-- ======== TAB 1: TABELLARE ======== -->
          <BaseGrid
            v-if="activeTab === 'grid' && groupedRows.length"
            :items="groupedRows"
            :columns="columns"
            :expandable="true"
            :expand-columns="ruleColumns"
            :show-pagination="true"
            :page-size="10"
            bordered
            expand-max-height="16rem"
            sticky-header
            y-max-height="60vh"
            header-bg-class="bg-gray-300"
            header-text-class="text-gray-800"
            row-text-class="text-gray-800"
            zebra-even-class="bg-gray-50"
            :showRefresh="false"
            zebra
          />

          <!-- ======== TAB 2: TOPOLOGIA ======== -->
          <div
            v-if="activeTab === 'topology'"
            class="mt-4 border rounded-xl bg-white p-2 shadow w-full"
            style="height: 70vh; min-height: 400px;"
          >
            <VueFlow
              v-model="elements"
              class="w-full h-[70vh]"
              :fit-view="true"
              :zoom-on-scroll="false"
              :nodes-draggable="false"
              :nodes-connectable="false"
              :edges-updatable="false"
              :apply-default="false"
              :default-edge-options="{ type: 'smoothstep', animated: false }"
            >
              <MiniMap />
              <Controls />
            </VueFlow>
          </div>

          <!-- ======== TAB 3: HEATMAP ACL ======== -->
          <div v-if="activeTab === 'heatmap'" class="bg-white rounded-xl p-4 shadow">
            <h3 class="text-md font-semibold text-gray-800 mb-3">Matrice ACL</h3>
            <div class="overflow-x-auto">
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
          </div>
        </div>
      </main>
    </div>

    <!-- Modale dettaglio nodo -->
    <BaseModal v-model="showDetail" :title="detailTitle" height="70vh" body-class="overflow-auto">
      <div v-if="selectedNode">
        <pre class="text-xs bg-gray-100 p-2 rounded border font-mono whitespace-pre-wrap">
{{ JSON.stringify(selectedNode, null, 2) }}
        </pre>
      </div>
      <div v-else class="text-gray-400 text-sm">Nessun dettaglio disponibile.</div>
      <div class="mt-3 flex justify-end">
        <BaseButton variant="secondary" @click="showDetail = false">Chiudi</BaseButton>
      </div>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { VueFlow } from '@vue-flow/core'
import { MiniMap } from '@vue-flow/minimap'
import { Controls } from '@vue-flow/controls'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/minimap/dist/style.css'
import '@vue-flow/controls/dist/style.css'

import BaseHeader from '@/components/base/BaseHeader.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseGrid from '@/components/base/BaseGrid.vue'
import { textCol, type GridColumn } from '@/grids/columns'
import { apiLoadVlans, apiLoadVlanPanoramica } from '@/services/api'

const vlanList = ref<any[]>([])
const selectedVlan = ref<any | null>(null)
const rawRows = ref<any[]>([])
const groupedRows = ref<any[]>([])
const elements = ref<any[]>([])
const showDetail = ref(false)
const selectedNode = ref<any | null>(null)
const detailTitle = ref('Dettagli')

/* Tabs */
const tabs = [
  { id: 'grid', label: 'Tabellare' },
  { id: 'topology', label: 'Topologia' },
  { id: 'heatmap', label: 'Heatmap ACL' },
]
const activeTab = ref('grid')

/* Colonne tabella */
type Row = Record<string, unknown>
const columns: GridColumn<Row>[] = [
  textCol<Row>('NOME_SEDE', 'Sede'),
  textCol<Row>('NOME_INTERFACCIA', 'Interfaccia'),
  textCol<Row>('DEVICE_NAME', 'Router'),
  textCol<Row>('ACL_NUMERO', 'ACL'),
  textCol<Row>('SUBNET', 'Subnet'),
  textCol<Row>('GATEWAY', 'Gateway'),
  textCol<Row>('RULE_COUNT', 'Rules'),
]
const ruleColumns: GridColumn<Row>[] = [
  textCol<Row>('AZIONE', 'Azione'),
  textCol<Row>('PROTOCOLLO', 'Protocollo'),
  textCol<Row>('ORIGINE', 'Origine'),
  textCol<Row>('DESTINAZIONE', 'Destinazione'),
  textCol<Row>('PORTA_DESTINAZIONE', 'Porta'),
]

/* ===== Caricamento VLAN ===== */
async function loadVlans() {
  try {
    const { data } = await apiLoadVlans()
    const rows = Array.isArray((data as any)?.rows) ? (data as any).rows : []

    // Raggruppa per ID_VLAN
    const grouped: Record<number, any> = {}
    for (const r of rows) {
      const idVlan = Number(r.ID_VLAN)
      if (!idVlan) continue

      if (!grouped[idVlan]) {
        grouped[idVlan] = {
          ID_VLAN: idVlan,
          NOME_VLAN: r.NOME_VLAN,
          SEDI: new Set(),
        }
      }
      grouped[idVlan].SEDI.add(r.DESCRIZIONE)
    }

    // Mappa in lista per la sidebar
    vlanList.value = Object.values(grouped).map((v: any) => ({
      ID_VLAN: v.ID_VLAN,
      NOME_VLAN: v.NOME_VLAN,
      SEDI: Array.from(v.SEDI),
    }))
  } catch (err) {
    console.error('Errore caricando VLAN:', err)
    vlanList.value = [
      { ID_VLAN: 335, NOME_VLAN: 'Medicina Nucleare', SEDI: ['Sant\'Andrea'] },
    ]
  }
}


/* ===== Selezione VLAN ===== */
async function selectVlan(v: any) {
  selectedVlan.value = v
  activeTab.value = 'grid'

  try {
    const { data } = await apiLoadVlanPanoramica(v.ID_VLAN)
    rawRows.value = (data as any)?.rows ?? []
  } catch {
    rawRows.value = [
      {
        ID_SEDE: 1,
        NOME_SEDE: 'Sant\'Andrea',
        NOME_INTERFACCIA: 'Vlan335',
        DEVICE_NAME: 'Router_SantAndrea',
        ACL_NUMERO: 135,
        SUBNET: '10.105.134.64/26',
        GATEWAY: '10.105.134.65',
        RULE_ID: 1,
        AZIONE: 'PERMIT',
        PROTOCOLLO: 'UDP',
        ORIGINE: '10.105.134.66',
        DESTINAZIONE: '224.0.0.2',
        PORTA_DESTINAZIONE: '1985',
      },
      {
        ID_SEDE: 1,
        NOME_SEDE: 'Sant\'Andrea',
        NOME_INTERFACCIA: 'Vlan335',
        DEVICE_NAME: 'Router_SantAndrea',
        ACL_NUMERO: 135,
        RULE_ID: 2,
        AZIONE: 'DENY',
        PROTOCOLLO: 'IP',
        ORIGINE: 'ANY',
        DESTINAZIONE: 'ANY',
        PORTA_DESTINAZIONE: '-',
      },
    ]
  }

  groupedRows.value = groupRowsForGrid(rawRows.value)
  buildTreeGraph(rawRows.value)
}

/* ===== Griglia ===== */
function groupRowsForGrid(rows: any[]) {
  const grouped: Record<string, any> = {}
  for (const r of rows) {
    const key = `${r.NOME_SEDE}-${r.NOME_INTERFACCIA}-${r.ACL_NUMERO}`
    if (!grouped[key]) {
      grouped[key] = {
        NOME_SEDE: r.NOME_SEDE,
        NOME_INTERFACCIA: r.NOME_INTERFACCIA,
        DEVICE_NAME: r.DEVICE_NAME,
        ACL_NUMERO: r.ACL_NUMERO,
        SUBNET: r.SUBNET,
        GATEWAY: r.GATEWAY,
        _children: [],
      }
    }
    grouped[key]._children.push(r)
  }
  return Object.values(grouped).map(g => ({ ...g, RULE_COUNT: g._children.length }))
}

/* ===== Heatmap ===== */
const sources = computed(() => [...new Set(rawRows.value.map(r => r.ORIGINE))])
const destinations = computed(() => [...new Set(rawRows.value.map(r => r.DESTINAZIONE))])
function getMatrixValue(src: string, dest: string) {
  const match = rawRows.value.find(r => r.ORIGINE === src && r.DESTINAZIONE === dest)
  return match ? match.AZIONE : '-'
}
function showRuleDetail(src: string, dest: string) {
  const rule = rawRows.value.find(r => r.ORIGINE === src && r.DESTINAZIONE === dest)
  if (rule) {
    selectedNode.value = rule
    detailTitle.value = `Regola ${rule.AZIONE}`
    showDetail.value = true
  }
}

/* ===== Topologia: layout ad albero ===== */
/* ===== Topologia: layout ad albero migliorato ===== */
function buildTreeGraph(rows: any[]) {
  const nodes: any[] = []
  const edges: any[] = []

  const yStep = 140
  const sede = rows[0]?.NOME_SEDE ?? 'Sede'
  const router = rows[0]?.DEVICE_NAME ?? 'Router'
  const vlan = selectedVlan.value?.NOME_VLAN ?? 'VLAN'
  const acl = `ACL ${rows[0]?.ACL_NUMERO ?? '-'}`

  // Nodo principale: sede
  nodes.push({
    id: sede,
    label: sede,
    position: { x: 0, y: 0 },
    style: { background: '#0ea5e9', color: '#fff' },
  })

  // Router
  nodes.push({
    id: router,
    label: router,
    position: { x: 0, y: yStep },
    style: { background: '#f59e0b', color: '#fff' },
  })
  edges.push({ id: `${sede}-${router}`, source: sede, target: router })

  // VLAN
  nodes.push({
    id: vlan,
    label: vlan,
    position: { x: 0, y: yStep * 2 },
    style: { background: '#3b82f6', color: '#fff' },
  })
  edges.push({ id: `${router}-${vlan}`, source: router, target: vlan })

  // ACL
  nodes.push({
    id: acl,
    label: acl,
    position: { x: 0, y: yStep * 3 },
    style: { background: '#ef4444', color: '#fff' },
  })
  edges.push({ id: `${vlan}-${acl}`, source: vlan, target: acl })

  // Regole (livello 4) — distribuite orizzontalmente
  const xStep = 220
  const baseY = yStep * 4
  const total = rows.length
  const startX = -((total - 1) * xStep) / 2

  for (let i = 0; i < total; i++) {
    const r = rows[i]
    const id = `rule-${r.RULE_ID}`
    const x = startX + i * xStep

    nodes.push({
      id,
      label: `${r.AZIONE} ${r.PROTOCOLLO}`,
      position: { x, y: baseY },
      style: {
        background: r.AZIONE === 'PERMIT' ? '#16a34a' : '#dc2626',
        color: '#fff',
      },
      data: {
        origine: r.ORIGINE,
        destinazione: r.DESTINAZIONE,
        porta: r.PORTA_DESTINAZIONE,
      },
    })

    edges.push({ id: `${acl}-${id}`, source: acl, target: id })

    // Aggiungi anche nodi origine e destinazione ai lati
    const srcId = `src-${r.RULE_ID}`
    const dstId = `dst-${r.RULE_ID}`

    nodes.push({
      id: srcId,
      label: r.ORIGINE,
      position: { x: x - 90, y: baseY + 100 },
      style: { background: '#10b981', color: '#fff' },
    })
    nodes.push({
      id: dstId,
      label: r.DESTINAZIONE,
      position: { x: x + 90, y: baseY + 100 },
      style: { background: '#fbbf24', color: '#fff' },
    })

    edges.push({ id: `${id}-${srcId}`, source: id, target: srcId })
    edges.push({ id: `${id}-${dstId}`, source: id, target: dstId })
  }

  elements.value = [...nodes, ...edges]
}

/* Init */
onMounted(() => loadVlans())
</script>

<style scoped>
.vue-flow__edge-path {
  stroke: #6b7280;
  stroke-width: 1.5;
}
.vue-flow__node {
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}
</style>
