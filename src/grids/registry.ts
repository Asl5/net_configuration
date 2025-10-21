import { idCol, textCol, dateCol, type GridColumn } from './columns'

// Tipizza la tua row “UI” di Dashboard
export type DashboardRow = { id: number; descrizione: string; data_ins: string }

export const dashboardColumns: GridColumn<DashboardRow>[] = [
  idCol<DashboardRow>('id'),
  textCol<DashboardRow>('descrizione', 'Descrizione'),
  dateCol<DashboardRow>('data_ins', 'Data'),
]

// Eventuale registry se vuoi risolvere per chiave
export const columnsRegistry = {
  dashboard: dashboardColumns,
  // altre: utenti, ordini, ecc.
} as const
