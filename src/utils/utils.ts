

export function getDeviceName(): string {
  try {
    // If running in a browser, this is the safest available value.
    if (typeof window !== "undefined" && window.location?.hostname) {
      // If served via file:// or localhost with no hostname, fall back to navigator info.
      const host = window.location.hostname;
      if (host && host !== "" && host !== "localhost") return host;
    }

    // Avoid using require/import to keep this sync and browser-safe.
    // Real system hostname is not accessible in browser for security reasons.
    // If you need the actual machine name, obtain it via backend API or Electron preload.

    // Fallbacks in the browser: try to derive something meaningful
    if (typeof navigator !== "undefined") {
      // network-only device name is not exposed; build a readable label
      const ua = navigator.userAgent || "";
      // Try to get domain from location as a last resort
      const host = (typeof window !== "undefined" && window.location?.hostname) ? window.location.hostname : "";
      return host || (ua.includes("Windows") ? "Windows Device" : ua.includes("Mac") ? "Mac Device" : ua.includes("Linux") ? "Linux Device" : "Unknown Device");
    }

    return "Unknown Device";
  } catch {
    return "Unknown Device";
  }
}



import type { WorkBook, WorkSheet } from "xlsx";
import { utils as XLSXUtils, writeFileXLSX } from "xlsx";

export type ExportColumn = {
key: string;
label?: string;
formatter?: (val: any, row?: any) => string | number | null | undefined;
};

function stripHtml(input: unknown): string {
if (input == null) return "";
const s = String(input);
const noTags = s.replace(/<[^>]*>/g, "");
return noTags.replace(/ /g, " ").replace(/&/g, "&").trim();
}

export function exportGridToExcel(opts: {
columns: ExportColumn[];
items: any[];
filename?: string; // es. "report.xlsx"
sheetName?: string; // default "Dati"
}) {
const { columns, items, filename = "export.xlsx", sheetName = "Dati" } = opts;

if (!Array.isArray(columns) || columns.length === 0) {
throw new Error("exportGridToExcel: columns è vuoto");
}
if (!Array.isArray(items)) {
throw new Error("exportGridToExcel: items deve essere un array");
}

const headers = columns.map((c) => c.label || c.key);

const data = items.map((row) =>
columns.map((c) => {
let raw = row?.[c.key];
if (typeof c.formatter === "function") {
try {
raw = c.formatter(raw, row);
} catch {}
}
if (typeof raw === "string") return stripHtml(raw);
if (raw == null) return "";
if (Array.isArray(raw)) return JSON.stringify(raw);
if (typeof raw === "object") return JSON.stringify(raw);
return raw;
})
);

const sheetData = [headers, ...data];
const ws: WorkSheet = XLSXUtils.aoa_to_sheet(sheetData);

// Larghezze colonne di base
const colWidths = headers.map((h) => ({ wch: Math.min(Math.max(String(h).length + 4, 12), 40) }));
for (let colIdx = 0; colIdx < columns.length; colIdx++) {
let maxLen = headers[colIdx].length;
for (let r = 0; r < Math.min(data.length, 500); r++) {
const val = data[r][colIdx];
const len = val == null ? 0 : String(val).length;
if (len > maxLen) maxLen = len;
}
colWidths[colIdx].wch = Math.min(Math.max(maxLen + 2, colWidths[colIdx].wch), 60);
}
(ws as any)["!cols"] = colWidths;

const wb: WorkBook = XLSXUtils.book_new();
XLSXUtils.book_append_sheet(wb, ws, sheetName);
writeFileXLSX(wb, filename);
}




// HTML-based Excel export with styling (header color + zebra rows)
export function exportGridToExcelStyled(opts: {
  columns: ExportColumn[];
  items: any[];
  filename?: string; // e.g. "report.xls"
  headerBg?: string; // e.g. "#e5e7eb" (Tailwind gray-200)
  headerText?: string; // e.g. "#1f2937" (gray-800)
  zebraEven?: string; // even row bg
  zebraOdd?: string; // odd row bg
  borderColor?: string; // cell borders
}) {
  const {
    columns,
    items,
    filename = "export.xls",
    headerBg = "#e5e7eb",
    headerText = "#1f2937",
    zebraEven = "#f9fafb",
    zebraOdd = "#ffffff",
    borderColor = "#e5e7eb",
  } = opts;

  if (!Array.isArray(columns) || columns.length === 0)
    throw new Error("exportGridToExcelStyled: columns è vuoto");
  if (!Array.isArray(items))
    throw new Error("exportGridToExcelStyled: items deve essere un array");

  const escape = (v: any) => {
    if (v == null) return "";
    return String(v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;");
  };

  const cols = columns.map((c) => ({ key: c.key, label: c.label || c.key, fmt: c.formatter }));
  const header = cols
    .map(
      (c) =>
        `<th style="background:${headerBg};color:${headerText};border:1px solid ${borderColor};padding:6px 8px;text-align:left;font-weight:600">${escape(
          c.label
        )}</th>`
    )
    .join("");

  const rowsHtml = items
    .map((row, i) => {
      const isEven = i % 2 === 1; // even (1-based) rows styled, odd left default
      const trStyle = isEven ? ` style=\"background:${zebraEven}\"` : "";
      const tds = cols
        .map((c) => {
          let raw = row?.[c.key as any];
          if (typeof c.fmt === "function") {
            try { raw = c.fmt(raw, row); } catch {}
          }
          if (Array.isArray(raw) || (raw && typeof raw === "object")) raw = JSON.stringify(raw);
          return `<td style=\"border:1px solid ${borderColor};padding:6px 8px;\">${escape(raw)}</td>`;
        })
        .join("");
      return `<tr${trStyle}>${tds}</tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Export</title>
  <style>
    table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 12px; }
  </style>
</head>
<body>
  <table>
    <thead><tr>${header}</tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <!-- Excel HTML Export -->
</body>
</html>`;

  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename.endsWith(".xls") || filename.endsWith(".xlsx") ? filename : `${filename}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(a.href), 0);
}

export function exportToExcelAoA(opts: {
  aoa: any[][];
  filename: string;
  sheetName?: string;
  merges?: Array<{ s: { r: number; c: number }; e: { r: number; c: number } }>;
  colWidthAuto?: boolean;
}) {
  const { aoa, filename, sheetName = "Dati", merges = [], colWidthAuto = true } = opts;
  if (!Array.isArray(aoa) || aoa.length === 0) throw new Error("exportToExcelAoA: aoa vuoto");
  const ws: WorkSheet = XLSXUtils.aoa_to_sheet(aoa);
  if (merges && merges.length) (ws as any)["!merges"] = merges as any;
  if (colWidthAuto) {
    const headers = (aoa[1] ?? aoa[0]).map((v: any, i: number) => String((v ?? aoa[0][i] ?? "")));
    const data = aoa.slice(2);
    const colWidths = headers.map((h: string) => ({ wch: Math.min(Math.max(String(h).length + 4, 12), 40) }));
    for (let colIdx = 0; colIdx < headers.length; colIdx++) {
      let maxLen = headers[colIdx].length;
      for (let r = 0; r < Math.min(data.length, 1000); r++) {
        const val = data[r]?.[colIdx];
        const len = val == null ? 0 : String(val).length;
        if (len > maxLen) maxLen = len;
      }
      colWidths[colIdx].wch = Math.min(Math.max(maxLen + 2, colWidths[colIdx].wch), 60);
    }
    (ws as any)["!cols"] = colWidths as any;
  }
  const wb: WorkBook = XLSXUtils.book_new();
  XLSXUtils.book_append_sheet(wb, ws, sheetName);
  writeFileXLSX(wb, filename);
}
