# Documentazione funzionale (cartella `src`)

Questa guida illustra in dettaglio struttura, flussi d’uso, configurazioni e punti di estensione dell’app (Vue 3 + TypeScript). L’obiettivo è permettere di capire rapidamente come funziona e come aggiungere/variare funzionalità (es. nuovi flussi, colonne, permessi, export).

## Architettura

- Framework: Vue 3 con Single File Components (.vue) e Composition API.
- Routing: `src/router/index.ts` definisce le route e i metadati di navigazione.
- Stato/permessi: `src/stores/rights.ts` gestisce ruoli/diritti; `useCan` e la direttiva `v-can` abilitano controlli UI.
- Servizi HTTP: `src/services/http.ts` (client), `src/services/auth.ts` (login/logout), `src/services/api.ts` (endpoint app), `src/config/config.ts` (BASE URLs).
- UI base: componenti in `src/components/base` (griglia, header, input, modal, tooltip, ecc.).
- Griglie: modelli e registry colonne in `src/grids` per rendere le tabelle consistenti e componibili.

## Routing e Navigazione

- File: `src/router/index.ts`
  - Ogni rotta può avere `meta.title`, `meta.nav` (includi nel menu), `meta.order` (ordinamento), `meta.requiredRole` (permesso), `meta.navGroup`/`meta.parent` (gruppi).
- File: `src/router/useNav.ts`
  - Genera il menu leggendo le route e filtrando per permessi con `rightsStore.hasRole(...)`.
  - Per aggiungere una voce di menu: imposta `meta.nav: true` e opzionalmente `meta.requiredRole`.

Flusso d’uso menu
- All’avvio, le route vengono lette da Vue Router; `useNav` costruisce voci e gruppi.
- Se una rotta ha `meta.requiredRole` non presente nello store diritti, non appare nel menu.
- L’ordinamento è governato da `meta.order` (numero crescente). I gruppi esistono solo se hanno figli visibili.

## Permessi e ruoli

- File: `src/stores/rights.ts`
  - Metodi chiave: `load(matricola)`, `persist()`, `hydrateFromSession()`, `clear()`.
  - Dati: `general`, `flows`, `generalRoles` (ruoli stringa). Persistenza in `sessionStorage`.
- File: `src/models/rights.ts`, `src/services/rights.ts`
  - Tipi e fetch da backend (es. `fetchRightsByMatricola`).
- File: `src/composable/useCan.ts`, `src/directives/can.ts`
  - Helpers per controlli granulari in componenti e template.

Flusso d’uso permessi
- Login → lo store `rights` viene caricato con i diritti dell’utente via servizio.
- `hydrateFromSession()` ripristina la sessione se presente (refresh pagina).
- I componenti/rotte leggono i diritti per mostrare/nascondere elementi (`v-can`, `requiredRole`).

## Viste principali

- `src/views/DashboardFlows.vue`
  - Funzione: selezione flusso, caricamento dati, visualizzazione tabellare, tooltip dettagli, export, storico richieste.
  - Componenti: `BaseHeader`, `BaseSelect`, `BaseButton`, `BaseModal`, `RequestsGrid`, `BaseBusy`, `BaseGrid`, `BaseTooltip`.
  - Stato tipico: `selectedFlow`, `flowOptions`, `flowLoading`, `loading`, `rows`, `columns`, `currentPage`, `pageSize`, `showRequests`.
  - Azioni: `apply()` (carica dati), `onExport()`, `onExportRow(row)`, `loadRequests()`, `saveFilters()`.
  - UX: la tabella mostra gli ultimi 24 mesi disponibili; i dettagli (es. RIT) sono mostrati con tooltip on-hover.
  - Configurabile: classi header/righe/zebra tramite props di `BaseGrid`; attiva/disattiva export e pulsanti via condizionali/permessi.

- `src/views/DashboardCount.vue`
  - Funzione: mostra conteggi/metriche aggregate (tiles o griglia).
  - Estensione: aggiungi campi/metriche agli endpoint e mappali su card/colonne.
  - Configurabile: periodi e filtri, layout card vs grid usando componenti base.

- `src/views/DashboardError.vue`
  - Funzione: fallback/errore con possibilità di retry o navigazione.
  - Configurabile: messaggio personalizzato, bottone “Riprova” che richiama l’ultima action o torna alla dashboard.

- `src/views/LoginView.vue`
  - Funzione: autenticazione; integra `services/auth.ts` e aggiorna i diritti nello store.
  - Validazione: campi richiesti; mostra errori backend (“Credenziali non valide”).
  - Persistenza: `credentials: 'include'` abilita refresh cookie HttpOnly.

## Componenti base (estratto utile)

- `BaseGrid.vue`
  - Props principali: `items`, `columns`, `page`, `pageSize`, `showPagination`, `stickyHeader`, `scrollX/scrollY`, classi per header/righe/zebra, azioni opzionali.
  - Slot utili: `#cell-<key>` per custom render; `#cell-__row_export__` per pulsanti per-riga.
  - Paginazione interna con `Prev/Next` se `showPagination` è attivo.
  - Styling: `headerBgClass`, `headerTextClass`, `rowTextClass`, `zebraOddClass`, `zebraEvenClass`, `borderColorClass`, `dividerColorClass`.
  - Accessibilità: header sticky e scorrimento orizzontale con `scrollX` per tabelle larghe.

- `BaseHeader.vue`, `BaseLabel.vue`, `BaseButton.vue`, `BaseModal.vue`, `BaseTooltip.vue`, `BaseBusy.vue`
  - Forniscono struttura e UX coerente su tutta l’app.
  - `BaseModal`: slot `#footer` per azioni; `v-model` per visibilità.
  - `BaseTooltip`: esponi `ref` e metodi onEnter/onLeave per mostrare dati contestuali.

## Griglie: modelli e registry

- File: `src/grids/models.ts`
  - Tipi base per colonne: `GridColumn<T>` con `key`, `label`, `align`, `width`, classi e `formatter` opzionale.
  - Builder: `makeCol`, preset `idCol`, `textCol`, `dateCol` (con opzione `withTime`), formatter data `formatDateIt`/`formatDateTimeIt`.
  - Convenzioni: usa `key` coerenti con le proprietà della riga normalizzata; usa `formatter` per badge, date, numeri.

- File: `src/grids/columns.ts`
  - Colonne riutilizzabili e tipizzazione righe dashboard (esempio `DashboardRow`).
  - Esempi: `idCol('id')`, `textCol('descrizione','Descrizione')`, `dateCol('data_ins','Data')`.

- File: `src/grids/registry.ts`
  - Registry per mappare una chiave (`flowKey`) a un set di colonne: `columnsRegistry = { dashboard: dashboardColumns, ... }`.
  - Uso: in vista, risolvi colonne con `columnsRegistry[selectedFlow]`.

- File: `src/grids/dynamicColumnRegistry.ts`
  - Estensioni per comporre/rendere dinamiche le colonne a runtime (opzionale).
  - Pattern: genera colonne in base a feature flag, ruoli o dati preview del flusso.

## Servizi

- `src/services/http.ts`
  - Client HTTP comune (header, baseURL, gestione token e cookie) basato su `fetch` o libreria equivalente.
  - Config: legge `API_BASE`/`AUTH_BASE` da `src/config/config.ts` (.env supportato via Vite).
  - Error handling: centralizza status non 2xx, conversione JSON, gestione redirect su 401.

- `src/services/auth.ts`
  - Login/logout; usa `AUTH_BASE` da `config.ts`. Ritorna `{ access_token, token_type, expires_in }`. Usa cookie HttpOnly per refresh.
  - Integrazione: dopo login, carica diritti nello store e naviga alla dashboard.

- `src/services/api.ts`
  - Esempi:
    - `loginRequest(username, password)` → POST `${AUTH_BASE}/login` (con `credentials: 'include'`).
    - `getUsers()` → GET `/api/users` (usa `http.get`).
    - Colonne esempio per dashboard tramite import dei builders (`idCol`, `textCol`, `dateCol`).
  - Estensione tipica: `getFlows()`, `getFlowData(flowKey, params)`, `exportFlow(...)`, `exportFlowRow(...)`, `getHistoricalRequests(flowKey, params)`.

## Composables utili

- `src/composable/useQueryGrid.ts`
  - Gestione parametri di query per griglie: `page`, `pageSize`, sort, `refresh()` e mapping dei risultati `{ items, total }`.
  - Pattern fetcher: funzione asincrona che accetta `{ page, pageSize, sort, filters }` e ritorna `{ items, total }`.

- `src/composable/useCan.ts`
  - API per verificare permessi e integrare con UI/azioni.
  - Esempi: nascondi pulsanti per utenti senza ruolo; disabilita export se non permesso.

## Come aggiungere un nuovo “flusso”

1) Backend/API
- Aggiungi/estendi gli endpoint per:
  - elenco flussi (per popolare `flowOptions`),
  - dati del flusso (paginati/ordinati),
  - export griglia e export per riga,
  - eventuale storico richieste.

2) Colonne e tabella
- Definisci le colonne in `src/grids/columns.ts` usando i builder (`idCol`, `textCol`, `dateCol` o `makeCol`).
- Registra il set in `src/grids/registry.ts` mappando `columnsRegistry[flowKey] = [...]`.
- Se servono colonne condizionali, valuta `dynamicColumnRegistry.ts`.

Esempio sintetico
```
// columns.ts
export type MyFlowRow = { id: number; periodo: string; stato: string }
export const myFlowColumns: GridColumn<MyFlowRow>[] = [
  idCol('id'),
  textCol('periodo','Periodo'),
  textCol('stato','Stato')
]

// registry.ts
export const columnsRegistry = {
  ...,
  my_flow: myFlowColumns
} as const
```

3) Vista `DashboardFlows.vue`
- Opzioni: assicurati che `flowOptions` includa il nuovo flusso (via servizio). Il `value` deve combaciare con `flowKey` del registry.
- Caricamento dati: in `apply()` chiama il servizio con `selectedFlow`, pagina/ordinamento da `useQueryGrid` (se usato), poi assegna `rows`.
- Colonne: risolvi dal registry con `selectedFlow` e assegna a `columns`.
- Export: collega `onExport()` e `onExportRow(row)` ai nuovi endpoint.
- Storico: implementa/riusa `loadRequests()` per popolare `requestsRows` nella modal.
- Tooltip: se hai un campo `dettagli: { code, value }[]`, gestisci onEnter/onLeave verso `BaseTooltip`.

4) Routing/Menu (opzionale)
- Aggiungi una rotta dedicata o un sotto-menu impostando `meta.nav`, `meta.title`, `meta.order` e, se necessario, `meta.requiredRole`.
- Il menu verrà generato da `useNav` e filtrato in base ai ruoli.

5) Permessi (opzionale)
- Se il flusso è riservato, assicurati che lo store diritti includa il ruolo necessario.
- Applica `meta.requiredRole` alla rotta e/o `v-can` ai pulsanti critici.

6) Export e download
- Griglia: bottone “Export griglia” chiama `exportFlow` e scarica CSV/XLSX.
- Riga: nello slot `cell-__row_export__` usa `BaseIconButton` per `exportFlowRow(row)`.
- Errori: mostra toast/messaggio su failure e disabilita pulsante quando `rows.length === 0`.

## Checklist rapida per QA

- Flow presente in `flowOptions` e selezionabile.
- Colonne corrette e ordinamento/formatter coerenti.
- Paginazione funzionante (`page`, `pageSize`, `total`).
- Export griglia e per riga operativi (download file generato).
- Storico richieste si carica e pagina correttamente.
- Route/menu visibili correttamente in base ai ruoli.
- Persistenza diritti in sessione e re-hydrate all’avvio.
 - Tooltip e dettagli coerenti (niente hover “vuoti”).
 - Localizzazione date/numeri corretta.

## Note pratiche

- Tooltip dettagli: se hai campi “dettagli” simili a `RitVal[]` (code/value), riusa lo slot `cell-dettagli` e `BaseTooltip` come in `DashboardFlows.vue`.
- Styling coerente: sfrutta classi di `BaseGrid` (header, zebra, text) e i preset colonna per non duplicare CSS.
- Sicurezza: `services/api.ts` usa cookie HttpOnly per il refresh; mantieni `credentials: 'include'` dove richiesto.

## Riferimenti API (estratto utile)

- `BaseGrid` (props principali)
  - `items: object[]`, `columns: GridColumn[]`, `page?: number = 1`, `pageSize?: number = 20`, `showPagination?: boolean = false`
  - `stickyHeader?: boolean`, `scrollX?: boolean = true`, `yMaxHeight?: string`
  - Classi: `headerBgClass`, `headerTextClass`, `rowTextClass`, `zebraEvenClass`, `borderColorClass`, `dividerColorClass`
  - Slot: `cell-<key>`; azioni opz.: `showActions`, `showEdit`, `showRemove`, `actionsLabel`, `actionSize`

- `GridColumn<T>`
  - Campi: `key`, `label`, `align`, `width`, `headerClass`, `cellClass`, `formatter?(value,row): string`
  - Builder: `makeCol`, `idCol`, `textCol`, `dateCol({ withTime? })`

- `services/api.ts`
  - `loginRequest(username, password)`: POST `${AUTH_BASE}/login` con `credentials: 'include'`
  - `getUsers()`: GET `/api/users`
  - Estendibili: `getFlows()`, `getFlowData(flowKey, params)`, `exportFlow`, `exportFlowRow`, `getHistoricalRequests`

- `stores/rights.ts`
  - `load(matricola)`, `persist()`, `hydrateFromSession()`, `clear()`, `hasRole(role)`

## Esempi di codice pronti all’uso

### Vista: `DashboardFlows.vue` – wiring completo

Snippet per caricare colonne e dati in base al flusso selezionato, con paginazione e export.

```ts
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { columnsRegistry } from '@/grids/registry'
import type { GridColumn } from '@/grids/models'
import BaseGrid from '@/components/base/BaseGrid.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import { getFlows, getFlowData, exportFlow, exportFlowRow, getHistoricalRequests } from '@/services/api'

type RowLike = Record<string, unknown>

const selectedFlow = ref<string | null>(null)
const flowOptions = ref<{ label: string; value: string }[]>([])
const flowLoading = ref(false)

const columns = ref<GridColumn<RowLike>[]>([])
const rows = ref<RowLike[]>([])
const loading = ref(false)

// Paginazione
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

// Storico richieste (modal)
const showRequests = ref(false)
const requestsRows = ref<RowLike[]>([])

onMounted(async () => {
  await loadFlows()
})

async function loadFlows() {
  flowLoading.value = true
  try {
    const list = await getFlows() // → [{ label, value }]
    flowOptions.value = list
  } finally {
    flowLoading.value = false
  }
}

watch(selectedFlow, (val) => {
  if (!val) return
  // Imposta colonne dal registry in base al flowKey
  columns.value = (columnsRegistry as any)[val] ?? []
})

async function apply() {
  if (!selectedFlow.value) return
  loading.value = true
  try {
    const res = await getFlowData(selectedFlow.value, { page: page.value, pageSize: pageSize.value })
    rows.value = res.items
    total.value = res.total ?? res.items.length
  } finally {
    loading.value = false
  }
}

async function onExport() {
  if (!selectedFlow.value) return
  await exportFlow(selectedFlow.value, { page: page.value, pageSize: pageSize.value })
}

async function onExportRow(row: RowLike) {
  if (!selectedFlow.value) return
  await exportFlowRow(selectedFlow.value, row)
}

async function loadRequests() {
  if (!selectedFlow.value) return
  requestsRows.value = await getHistoricalRequests(selectedFlow.value, { page: 1, pageSize: 5 })
}

function openRequests() {
  showRequests.value = true
  void loadRequests()
}
</script>
```

### Servizi: `services/api.ts` – endpoint tipici del flusso

```ts
// services/api.ts
import { http } from '@/services/http'

export async function getFlows(): Promise<{ label: string; value: string }[]> {
  const { data } = await http.get('/api/flows')
  return data
}

export async function getFlowData(
  flowKey: string,
  params: { page?: number; pageSize?: number; sort?: string; filters?: Record<string, any> }
): Promise<{ items: any[]; total?: number }> {
  const { data } = await http.get(`/api/flows/${encodeURIComponent(flowKey)}`, { params })
  return data
}

export async function exportFlow(flowKey: string, params: Record<string, any> = {}) {
  const res = await http.get(`/api/flows/${encodeURIComponent(flowKey)}/export`, {
    params,
    responseType: 'blob',
  })
  downloadBlob(res.data, `export_${flowKey}.xlsx`)
}

export async function exportFlowRow(flowKey: string, row: Record<string, any>) {
  const res = await http.post(`/api/flows/${encodeURIComponent(flowKey)}/export-row`, row, {
    responseType: 'blob',
  })
  downloadBlob(res.data, `row_${flowKey}.xlsx`)
}

export async function getHistoricalRequests(flowKey: string, params: { page?: number; pageSize?: number }) {
  const { data } = await http.get(`/api/flows/${encodeURIComponent(flowKey)}/history`, { params })
  return data
}

function downloadBlob(data: Blob, filename: string) {
  const url = URL.createObjectURL(data)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
```

### Tooltip dettagli “RIT” (hover)

```vue
<template>
  <BaseGrid :columns="columns" :items="rows">
    <template #cell-dettagli="{ value }">
      <div class="flex flex-col text-xs text-gray-700">
        <template v-for="(rit, idx) in (value || [])" :key="rit.code">
          <span class="cursor-help hover:underline" @mouseenter="onEnter($event, rit)" @mouseleave="onLeave">
            {{ rit.code }}: <strong>{{ rit.value }}</strong>
          </span>
          <div v-if="idx < (value || []).length - 1" class="border-t border-gray-200 my-1" />
        </template>
      </div>
    </template>
  </BaseGrid>

  <BaseTooltip ref="tooltip" v-slot="{ data }">
    <div v-if="data">
      <div class="font-semibold mb-1">{{ data.descrizione || 'Nessuna descrizione' }}</div>
      <div class="text-xs text-gray-600">
        Codice: <strong>{{ data.code }}</strong>
      </div>
    </div>
  </BaseTooltip>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import BaseTooltip from '@/components/base/BaseTooltip.vue'

type RitVal = { code: string; value: string | number; descrizione?: string }
const tooltip = ref<InstanceType<typeof BaseTooltip> | null>(null)

function onEnter(evt: MouseEvent, data: RitVal) {
  tooltip.value?.show(evt, data)
}
function onLeave() {
  tooltip.value?.hide()
}
</script>
```



---

Se serve, si può estendere questo documento con una sezione “API Reference” auto-aggiornata (props/emit dei componenti principali) ricavata dal codice.
