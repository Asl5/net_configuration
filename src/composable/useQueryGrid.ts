import { ref, computed, type Ref, shallowRef } from 'vue'
import { http } from '@/services/http'
import { QUERY_BASE } from '@/config/config'

export type QueryParam = { name: string; value: unknown }
export type QueryOptions<TDbRow, TRow> = {
  queryId: number
  params?: Ref<QueryParam[]> | QueryParam[]
  maxRows?: number
  tx?: 'none' | 'read' | 'write'
  mapRow: (db: TDbRow) => TRow
  filterFn?: (row: TRow, q: string) => boolean
}

export function useQueryGrid<TDbRow extends Record<string, unknown>, TRow>(
  opts: QueryOptions<TDbRow, TRow>
) {
  const rows = shallowRef<TRow[]>([])  // ⬅️ invece di ref<TRow[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const q = ref('')

  const paramsResolved = computed<QueryParam[]>(() =>
    Array.isArray(opts.params) ? opts.params : (opts.params?.value ?? [])
  )

  async function load() {
    if (loading.value) return
    loading.value = true
    try {
      const { data } = await http.post(QUERY_BASE, {
        queryId: opts.queryId,
        params: paramsResolved.value,
        maxRows: opts.maxRows ?? 100,
      })

      const dbRows = (data.rows ?? []) as TDbRow[]
      rows.value = dbRows.map(opts.mapRow)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Errore caricamento dati'
    } finally {
      loading.value = false
    }
  }

  const filteredRows = computed(() => {
    const term = q.value.trim().toLowerCase()
    if (!term) return rows.value
    const fn =
      opts.filterFn ??
      ((r: TRow, t: string) => JSON.stringify(r).toLowerCase().includes(t))
    return rows.value.filter(r => fn(r, term))
  })

  return { rows, filteredRows, loading, error, q, load, refresh: load }
}
