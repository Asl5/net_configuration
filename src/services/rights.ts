import { apiFetchRightsByMatricola } from "@/services/api";
import type { RightsPayload, FlowRights } from "@/models/rights";

type RawRightRow = {
  ID_DIRITTO: number;
  ID_DIRITTO_FLUSSO?: number;
  ID_FLUSSO?: number;
};

export async function fetchRightsByMatricola(matricola: string): Promise<RightsPayload> {
  const { data } = await apiFetchRightsByMatricola(matricola);

  const generalRoles: number[] = [];
  const flowsMap = new Map<number, FlowRights>();
  const rows: RawRightRow[] = Array.isArray(data?.rows) ? data.rows : [];

  for (const r of rows) {
    // diritti generali (ID_DIRITTO)
    if (r.ID_DIRITTO && !generalRoles.includes(r.ID_DIRITTO)) {
      generalRoles.push(r.ID_DIRITTO!);
    }

    // diritti per flusso
    if (r.ID_FLUSSO) {
      if (!flowsMap.has(r.ID_FLUSSO)) {
        flowsMap.set(r.ID_FLUSSO, {
          flowId: r.ID_FLUSSO,
          flowCode: r.ID_DIRITTO_FLUSSO ?? undefined, // opzionale se serve
          rights: [],
        });
      }
      if (r.ID_DIRITTO_FLUSSO) {
        const rights = flowsMap.get(r.ID_FLUSSO)!.rights;
        if (!rights.includes(r.ID_DIRITTO_FLUSSO)) {
          rights.push(r.ID_DIRITTO_FLUSSO);
        }
      }
    }
  }

  return {  flows: Array.from(flowsMap.values()), generalRoles: generalRoles };
}
