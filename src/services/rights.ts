import { apiFetchRightsByMatricola } from "@/services/api";
import type { RightsPayload, Right } from "@/models/rights";

type RawRightRow = {
  ID_DIRITTO?: number;
  DESCRIZIONE_BREVE?: string;
  DESCRIZIONE_LUNGA?: string;
};

export async function fetchRightsByMatricola(matricola: string): Promise<RightsPayload> {
  const { data } = await apiFetchRightsByMatricola(matricola);
console.log("data",data)
  const generalRoles: number[] = [];
  const rights: Right[] = [];
  const rows: RawRightRow[] = Array.isArray((data as any)?.rows) ? (data as any).rows : [];

  for (const r of rows) {
    if (typeof r.ID_DIRITTO === 'number' && !generalRoles.includes(r.ID_DIRITTO)) {
      generalRoles.push(r.ID_DIRITTO);
    }
    if (typeof r.ID_DIRITTO === 'number') {
      rights.push({
        id_diritto: r.ID_DIRITTO,
        descrizione_breve: String(r.DESCRIZIONE_BREVE ?? ''),
        descrizione_lunga: String(r.DESCRIZIONE_LUNGA ?? ''),
      });
    }
  }

  return { rights, generalRoles };
}
