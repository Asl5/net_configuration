/**
 * Converte una stringa in oggetto Date o null.
 */
export function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
}

/**
 * Ritorna data in formato italiano (gg/mm/aaaa).
 */
export function formatDateIt(value: string | Date | null | undefined): string {
  const d = typeof value === 'string' ? parseDate(value) : value
  if (!d) return ''
  return d.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

/**
 * Ritorna data+ora in formato italiano (gg/mm/aaaa hh:mm).
 */
export function formatDateTimeIt(value: string | Date | null | undefined): string {
  const d = typeof value === 'string' ? parseDate(value) : value
  if (!d) return ''
  return d.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }) + ' ' + d.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit'
  })
}


// src/utils/date.ts
export function pad2(value: number | string | null | undefined): string {
  if (value == null) return ""; // oppure "00" se preferisci
  const n = typeof value === "string" ? parseInt(value, 10) : value;
  if (isNaN(n)) return String(value);
  return n < 10 ? `0${n}` : String(n);
}
