//SECURITTY DA RIVEDERE

import { http } from './http';
import { AUTH_BASE, QUERY_BASE } from '@/config/config';

// POST /auth/login
export async function loginRequest(username: string, password: string) {
  const res = await fetch(`${AUTH_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // <-- serve per refresh cookie HttpOnly
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Credenziali non valide');
  }
  return res.json() as Promise<{ access_token: string; token_type: string; expires_in: number }>;
}

export async function getUsers() {
  const { data } = await http.get('/api/users'); // http.ts ha già API_BASE come baseURL
  return data;
}

export async function spiLoadFlows(matricola: string) {
  return http.post(QUERY_BASE, {
    queryId: 1,
    params: [{ index: 1, value: matricola }],
    maxRows: 200,
  });
}

export async function spiLoadRequests() {
  return http.post(QUERY_BASE, {
    queryId: 23,
    params: [],
    maxRows: 200,
  });
}

export async function spiInsertRequest(
  idFlusso: number,
  periodo: string,
  anno: number
) {
  return http.post(QUERY_BASE, {
    queryId: 24,
    params: [
      { index: 1, value: idFlusso },
      { index: 2, value: periodo },
      { index: 3, value: anno },
    ],
  });
}

// DashboardFlows helpers
export async function apiLoadFlows(matricola: string) {
  return http.post(QUERY_BASE, {
    queryId: 1,
    params: [{ index: 1, value: matricola }],
    maxRows: 200,
  });
}

export async function apiLoadFlowQueries() {
  return http.post(QUERY_BASE, {
    queryId: 13,
    params: [],
    maxRows: 2000,
  });
}



export async function apiBatchCounts(queryId: number, paramLikes: string[]) {

  const batch = paramLikes.map((pl) => ({
    params: [
      { index: 1, value: pl },
      { index: 2, value: pl },
    ],
  }));
  return http.post(QUERY_BASE, {
    queryId,
    kind: "batchSelect",
    batch,
  });
}

// DashboardCount APIs
export async function apiLoadFlowsSimple(matricola: string) {
  return http.post(QUERY_BASE, {
    queryId: 1,
    params: [{ index: 1, value: matricola }],
    maxRows: 100,
  });
}

export async function apiLoadFlowQueriesSimple() {
  return http.post(QUERY_BASE, {
    queryId: 13,
    params: [],
    maxRows: 2000,
  });
}

// Rights APIs
export async function apiFetchRightsByMatricola(matricola: string) {
  return http.post(QUERY_BASE, {
    queryId: 1,
    params: [{ index: 1, value: matricola }],
    maxRows: 1000,
  });
}

// UsersSettings APIs
export async function apiDeleteUser(matricola: string) {
  // Calls 91 then 92 as in view
  await http.post(QUERY_BASE, { queryId: 91, params: [{ index: 1, value: matricola }] });
  return http.post(QUERY_BASE, { queryId: 92, params: [{ index: 1, value: matricola }] });
}

export async function apiLoadRoles() {
  return http.post(QUERY_BASE, { queryId: 7, params: [], maxRows: 100 });
}

export async function apiLoadUsers() {
  return http.post(QUERY_BASE, { queryId: 6, params: [], maxRows: 100 });
}

export async function apiLoadFlowsForSettings() {
  return http.post(QUERY_BASE, { queryId: 8, params: [], maxRows: 100 });
}


export async function apiFetchFlussiForSettings() {
  const { data } = await http.post(QUERY_BASE, {
    queryId: 8,
    params: [],
    maxRows: 100,
  });
  const rows = Array.isArray((data as any)?.rows) ? (data as any).rows : [];
  return rows.map((r: any) => ({
    id: r.ID,
    nome: r.DESCRIZIONE,
    descrizioneLunga: r.DESCRIZIONE_LUNGA,
    rangeType: r.ELABORAZIONE ?? "M",
  }));
}

export async function apiLoadFlowPermissions() {
  return http.post(QUERY_BASE, { queryId: 9, params: [], maxRows: 100 });
}

export async function apiLoadUserFlowRights(matricola: string) {
  return http.post(QUERY_BASE, { queryId: 10, params: [{ index: 1, value: matricola }], maxRows: 500 });
}

export async function apiSaveUserRole(roleId: number, who: string, device: string, name: string) {
  return http.post(QUERY_BASE, {
    queryId: 26,
    params: [
      { index: 1, value: roleId },
      { index: 2, value: who },
      { index: 3, value: device },
      { index: 4, value: name },
    ],
  });
}

export async function apiBatchInsertRights(batch: any[]) {
  if (!batch.length) return { data: null } as any;
  return http.post(QUERY_BASE, { queryId: 47, kind: "batchUpdate", batch });
}

export async function apiBatchUpdateRights(batch: any[]) {
  if (!batch.length) return { data: null } as any;
  return http.post(QUERY_BASE, { queryId: 27, kind: "batchUpdate", batch });
}

// FlowsSettings APIs
export async function apiUpdateFlow(
  id: number,
  nome: string,
  descrizioneLunga: string,
  rangeType: string
) {
  // Modifica flusso (queryId 30)
  return http.post(QUERY_BASE, {
    queryId: 30,
    params: [
      { index: 1, value: nome },
      { index: 2, value: descrizioneLunga },
      { index: 3, value: rangeType },
      { index: 4, value: id },
    ],
  });
}

export async function apiCreateFlow(
  nome: string,
  descrizioneLunga: string,
  rangeType: string
) {
  // Crea nuovo flusso (queryId 29)
  return http.post(QUERY_BASE, {
    queryId: 29,
    params: [
      { index: 1, value: nome },
      { index: 2, value: descrizioneLunga },
      { index: 3, value: rangeType },
    ],
  });
}

// Create new user with role (query 25)
export async function apiAddUser(
  matricola: string,
  roleId: number,
  who: string | null,
  device: string
) {
  return http.post(QUERY_BASE, {
    queryId: 25,
    params: [
      { index: 1, value: matricola },
      { index: 2, value: roleId },
      { index: 3, value: who },
      { index: 4, value: device },
    ],
  });
}

// DashboardError APIs
export async function apiLoadErrorTypes(flowId: number) {
  return http.post(QUERY_BASE, {
    queryId: 4,
    params: [{ index: 1, value: flowId }],
    maxRows: 100,
  });
}

export async function apiRunDynamicQuery(queryId: number, periodo1: string | null, periodo2: string | null) {

  return http.post(QUERY_BASE, {
    queryId,
    params: [
      { index: 1, value: periodo1 },
      { index: 2, value: periodo2 },
    ],
    maxRows: 5000,
  });
}

// SendReturnSetting APIs
export async function apiLoadInvii(matricola: string) {
  return http.post(QUERY_BASE, {
    queryId: 31,
    params: [{ index: 1, value: matricola }],
    maxRows: 100,
  });
}

export async function apiLoadRitorni(matricola: string) {
  return http.post(QUERY_BASE, {
    queryId: 32,
    params: [{ index: 1, value: matricola }],
  });
}

export async function apiBatchUpdateInvii(batch: any[]) {
  if (!batch.length) return { data: null } as any;
  return http.post(QUERY_BASE, { queryId: 35, kind: 'batchUpdate', batch });
}

export async function apiBatchInsertInvii(batch: any[]) {
  if (!batch.length) return { data: null } as any;
  return http.post(QUERY_BASE, { queryId: 33, kind: 'batch', batch });
}

export async function apiBatchUpdateRitorni(batch: any[]) {
  if (!batch.length) return { data: null } as any;
  // In origine usa headers espliciti; http.ts probabilmente imposta JSON. Li omettiamo qui.
  return http.post(QUERY_BASE, { queryId: 36, kind: 'batch', batch });
}

export async function apiBatchInsertRitorni(batch: any[]) {
  if (!batch.length) return { data: null } as any;
  return http.post(QUERY_BASE, { queryId: 34, kind: 'batch', batch });
}

// FlowsSettings APIs
export async function apiAddFlow(nome: string, descrizioneLunga: string, rangeType: string) {
  return http.post(QUERY_BASE, {
    queryId: 29,
    params: [
      { index: 1, value: nome },
      { index: 2, value: descrizioneLunga },
      { index: 3, value: rangeType },
    ],
  });
}

// // UsersSettings APIs
// export async function apiDeleteUser(matricola: string) {
//   await http.post(QUERY_BASE, {
//     queryId: 91,
//     params: [{ index: 1, value: matricola }],
//   });
//   await http.post(QUERY_BASE, {
//     queryId: 92,
//     params: [{ index: 1, value: matricola }],
//   });
// }

// export async function apiLoadRoles() {
//   return http.post(QUERY_BASE, { queryId: 7, params: [], maxRows: 100 });
// }

// export async function apiLoadUsers() {
//   return http.post(QUERY_BASE, { queryId: 6, params: [], maxRows: 100 });
// }

// export async function apiLoadFlows() {
//   return http.post(QUERY_BASE, { queryId: 8, params: [], maxRows: 1000 });
// }

// export async function apiLoadFlowPermissions() {
//   return http.post(QUERY_BASE, { queryId: 9, params: [], maxRows: 1000 });
// }

export async function apiLoadUserRights(matricola: string) {
  return http.post(QUERY_BASE, {
    queryId: 10,
    params: [{ index: 1, value: matricola }],
    maxRows: 1000,
  });
}

export async function apiBatchInsertUserRights(batch: any[]) {
  if (!batch.length) return { data: null } as any;
  return http.post(QUERY_BASE, { queryId: 47, kind: 'batchUpdate', batch });
}

export async function apiBatchUpdateUserRights(batch: any[]) {
  if (!batch.length) return { data: null } as any;
  return http.post(QUERY_BASE, { queryId: 27, kind: 'batchUpdate', batch });
}
