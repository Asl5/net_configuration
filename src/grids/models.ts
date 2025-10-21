// Righe così come arrivano dal DB
export type DashboardDbRow = {
  ID: number
  DESCRIZIONE: string
  DATA_INS?: string
}

// Righe normalizzate per la UI
export type DashboardRow = {
  id: number
  descrizione: string
  data_ins: string
}


