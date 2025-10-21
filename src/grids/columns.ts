import { formatDateIt, formatDateTimeIt } from "@/utils/date"

// Tipi base usati da BaseGrid
export type Align = 'left' | 'center' | 'right'

export type GridColumn<T> = {
  key: keyof T & string
  label: string
  align: Align
  width: string
  headerClass: string
  cellClass: string
  formatter?: (value: any, row: T) => string
}

// creator con default e override
export function makeCol<T>(
  key: keyof T & string,
  label: string,
  opts: Partial<GridColumn<T>> = {}
): GridColumn<T> {
  return {
    key,
    label,
    align: opts.align ?? 'left',
    width: opts.width ?? 'w-auto',
    headerClass: opts.headerClass ?? 'text-gray-700 font-medium px-2 py-1',
    cellClass: opts.cellClass ?? 'text-gray-800 px-2 py-1',
    ...opts, // <-- override finale
  }
}

// preset ID
export function idCol<T>(
  key: keyof T & string = 'id' as any,
  label = 'ID',
  opts: Partial<GridColumn<T>> = {}
): GridColumn<T> {
  return makeCol<T>(key, label, {
    width: 'w-20',
    align: 'right',
    cellClass: 'tabular-nums text-gray-900 px-2 py-1',
    ...opts,
  })
}

// preset Testo
export function textCol<T>(
  key: keyof T & string,
  label: string,
  opts: Partial<GridColumn<T>> = {}
): GridColumn<T> {
  return makeCol<T>(key, label, {
    align: 'left',
    width: 'w-auto',
    cellClass: 'truncate text-gray-800 px-2 py-1',
    ...opts,
  })
}

export function dateCol<T>(
  key: keyof T & string,
  label = 'Data',
  opts: Partial<GridColumn<T> & { withTime?: boolean }> = {}
): GridColumn<T> {
  const withTime = (opts as any).withTime ?? false
  return makeCol<T>(key, label, {
    align: 'center',
    cellClass: 'whitespace-nowrap',
    formatter: (v) => withTime ? formatDateTimeIt(v) : formatDateIt(v),
    ...opts,
  })
}
