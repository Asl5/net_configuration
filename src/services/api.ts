//SECURITTY DA RIVEDERE

import { http } from "./http";
import { AUTH_BASE, QUERY_BASE } from "@/config/config";

// POST /auth/login
export async function loginRequest(username: string, password: string) {
  const res = await fetch(`${AUTH_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // <-- serve per refresh cookie HttpOnly
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Credenziali non valide");
  }
  return res.json() as Promise<{ access_token: string; token_type: string; expires_in: number }>;
}

export async function getUsers() {
  const { data } = await http.get("/api/users"); // http.ts ha già API_BASE come baseURL
  return data;
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
  return http.post(QUERY_BASE, { queryId: 3, params: [], maxRows: 100 });
}


// Update user basic data + role
// Required params: matricola, nome, cognome, roelid (roleId)
export async function apiSaveUser(matricola: string, nome: string, cognome: string, roleId: number) {
  await http.post(QUERY_BASE, {
    queryId: 7,
    params: [
      { index: 1, value: matricola },
      { index: 2, value: nome },
      { index: 3, value: cognome },
      { index: 4, value: matricola },
    ],
  });
  return http.post(QUERY_BASE, {
    queryId: 8,
    params: [
      { index: 1, value: roleId },
      { index: 2, value: matricola },

    ],
  });
}



// Create new user with role (query 25)
export async function apiAddUser(
  matricola: string,
  nome: string,
  cognome: string | null,
  roleId: number
) {
  await http.post(QUERY_BASE, {
    queryId: 4,
    params: [
      { index: 1, value: matricola },
      { index: 2, value: nome },
      { index: 3, value: cognome },
    ],
  });
  return http.post(QUERY_BASE, {
    queryId: 5,
    params: [
      { index: 1, value: matricola },
      { index: 2, value: roleId },
    ],
  });
}


// SediSettings APIs
// Estrazione sedi (queryId 9)
export async function apiLoadSedi() {
  return http.post(QUERY_BASE, { queryId: 11, params: [], maxRows: 1000 });
}

// Inserimento sede (queryId 10)
export async function apiCreateSede(payload: {
  NOME: string;
  COMUNE: string;
  INDIRIZZO: string;
  ORARIO_SEDE: string;
  COD_UNIVOCO_INFRATEL: string;
  CONNETTIVITA: string;
  NOTE: string | null;
  ATTIVA: number; // 1/0
  DATA_AGGIORNAMENTO: string; // ISO date string
}) {
  const p = payload;

  return http.post(QUERY_BASE, {
    queryId: 9,
    params: [
      { index: 1, value: p.NOME },
      { index: 2, value: p.COMUNE },
      { index: 3, value: p.INDIRIZZO },
      { index: 4, value: p.ORARIO_SEDE },
      { index: 5, value: p.COD_UNIVOCO_INFRATEL },
      { index: 6, value: p.CONNETTIVITA },
      { index: 7, value: p.NOTE },
      { index: 8, value: p.ATTIVA },
      { index: 9, value: p.DATA_AGGIORNAMENTO },
    ],
  });
}

// VlanSettings APIs
// Estrazione VLAN (queryId 12)
export async function apiLoadVlans() {
  return http.post(QUERY_BASE, { queryId: 12, params: [], maxRows: 1000 });
}

// Inserimento VLAN (queryId 13)
export async function apiCreateVlan(payload: {
  ID_VLAN: string;
  NOME_VLAN: string;
  DESCRIZIONE: string;
}) {
  const p = payload;
  return http.post(QUERY_BASE, {
    queryId: 13,
    params: [
      { index: 1, value: p.ID_VLAN },
      { index: 2, value: p.NOME_VLAN },
      { index: 3, value: p.DESCRIZIONE },
    ],
  });
}

// Modifica VLAN (queryId 14)
export async function apiUpdateVlan(id: number, payload: {
  NOME_VLAN: string;
  DESCRIZIONE: string;
}) {
  const p = payload;
  return http.post(QUERY_BASE, {
    queryId: 14,
    params: [
      { index: 1, value: p.NOME_VLAN },
      { index: 2, value: p.DESCRIZIONE },
      { index: 3, value: id },
    ],
  });
}

// Associazioni VLAN-Sedi
// Select associazioni per VLAN (queryId 16)
export async function apiLoadVlanSedi(idVlan: number | string) {

  return http.post(QUERY_BASE, {
    queryId: 16,
    params: [{ index: 1, value: String(idVlan) }],
    maxRows: 1000,
  });
}

// Insert associazione VLAN->Sede (queryId 15)
export async function apiInsertVlanSede(payload: {
  ID_VLAN: string; // string per compatibilità con backend
  ID_SEDE: string;
  SUBNET: string;
  MASK: string;
  GATEWAY: string;
  IP_START: string;
  IP_END: string;
  BROADCAST: string;
  ID_ACL: string; // accetta '' se null
  NOTE: string;
}) {
  const p = payload;

  return http.post(QUERY_BASE, {
    queryId: 15,
    params: [
      { index: 1, value: p.ID_VLAN },
      { index: 2, value: p.ID_SEDE },
      { index: 3, value: p.SUBNET },
      { index: 4, value: p.MASK },
      { index: 5, value: p.GATEWAY },
      { index: 6, value: p.IP_START },
      { index: 7, value: p.IP_END },
      { index: 8, value: p.BROADCAST },
      { index: 9, value: p.ID_ACL },
      { index: 10, value: p.NOTE },
    ],
  });
}

// Update associazione VLAN->Sede (queryId 17)
// SQL:
// UPDATE VLAN_SEDI
// SET SUBNET=?, MASK=?, GATEWAY=?, IP_START=?, IP_END=?, BROADCAST=?, ID_ACL=?, NOTE=?
// WHERE ID_VLAN=? AND ID_SEDE=?
export async function apiUpdateVlanSede(payload: {
  ID_VLAN: string | number;
  ID_SEDE: string | number; // mapped to ID_SEDE
  SUBNET: string;
  MASK: string;
  GATEWAY: string;
  IP_START: string;
  IP_END: string;
  BROADCAST: string;
  ID_ACL: string | number | null; // allow null/''
  NOTE: string | null;
}) {
  const p = payload as any;
  return http.post(QUERY_BASE, {
    queryId: 17,
    params: [
      { index: 1, value: p.SUBNET },
      { index: 2, value: p.MASK },
      { index: 3, value: p.GATEWAY },
      { index: 4, value: p.IP_START },
      { index: 5, value: p.IP_END },
      { index: 6, value: p.BROADCAST },
      { index: 7, value: p.ID_ACL },
      { index: 8, value: p.NOTE },
      { index: 9, value: String(p.ID_VLAN) },
      { index: 10, value: String(p.ID_SEDE) },
    ],
  });
}

// Delete associazione VLAN->Sede (queryId 18)
// DELETE FROM VLAN_SEDI WHERE ID_VLAN=? AND ID_SEDE=?
export async function apiDeleteVlanSede(idVlan: string | number, idSede: string | number) {
  return http.post(QUERY_BASE, {
    queryId: 18,
    params: [
      { index: 1, value: String(idVlan) },
      { index: 2, value: String(idSede) },
    ],
  });
}
// Modifica sede (queryId 11)
export async function apiUpdateSede(id: number, payload: {
  NOME: string;
  COMUNE: string;
  INDIRIZZO: string;
  ORARIO_SEDE: string;
  COD_UNIVOCO_INFRATEL: string;
  CONNETTIVITA: string;
  NOTE: string | null;
  ATTIVA: number; // 1/0
  DATA_AGGIORNAMENTO: string; // ISO date string
}) {
  const p = payload;
  return http.post(QUERY_BASE, {
    queryId: 10,
    params: [
      { index: 1, value: p.NOME },
      { index: 2, value: p.COMUNE },
      { index: 3, value: p.INDIRIZZO },
      { index: 4, value: p.ORARIO_SEDE },
      { index: 5, value: p.COD_UNIVOCO_INFRATEL },
      { index: 6, value: p.CONNETTIVITA },
      { index: 7, value: p.NOTE },
      { index: 8, value: p.ATTIVA },
      { index: 9, value: p.DATA_AGGIORNAMENTO },
      { index: 10, value: id },
    ],
  });
}



export async function apiLoadUsers() {
  return http.post(QUERY_BASE, { queryId: 6, params: [], maxRows: 100 });
}


export async function apiLoadUserRights(matricola: string) {
  return http.post(QUERY_BASE, {
    queryId: 10,
    params: [{ index: 1, value: matricola }],
    maxRows: 1000,
  });
}



/* ================== Router Interfaces & ACL (queryId 19+) ================== */

type QParam = { index: number; value: any };
const toParams = (arr: any[]): QParam[] => arr.map((v, i) => ({ index: i + 1, value: v }));

// Router Interfaces
export async function apiLoadRouterInterfaces() {
  // Select all router interfaces (queryId 19)
  return http.post(QUERY_BASE, { queryId: 19, params: [], maxRows: 1000 });
}

// Lookup per associazione VLAN-SEDE da usare nella creazione interfaccia router
export async function apiLoadRouterInterfaceAssociations() {
  // Estrae ID, ID_VLAN, ID_SEDE, NOME_SEDE, NOME_VLAN, DESCRIZIONE_VLAN (queryId 30)
  return http.post(QUERY_BASE, { queryId: 27, params: [], maxRows: 1000 });
}


// Panoramica VLAN (queryId 26)
// Mostra per una VLAN tutte le sedi associate, le interfacce router e le ACL collegate
export async function apiLoadVlanPanoramica(idVlan: number | string) {
  return http.post(QUERY_BASE, {
    queryId: 26,
    params: [{ index: 1, value: String(idVlan) }],
    maxRows: 5000,
  });
}


export async function apiCreateRouterInterface(
  payloadOrParams:
    | QParam[]
    | {
        VLAN_SEDE_ID?: number | string; // preferito
        ASSOC_ID?: number | string | null; // fallback dal form
        NOME_INTERFACCIA: string;
        DESCRIZIONE: string;
        IP_ADDRESS: string;
        SUBNET_MASK: string;
        ID: number | string;
        DEVICE_NAME: string;
        CONFIG_TESTO: string;
      }
) {
  // Insert router interface (queryId 20)
  if (Array.isArray(payloadOrParams)) {
    return http.post(QUERY_BASE, { queryId: 21, params: payloadOrParams });
  }
  const p = payloadOrParams;
  const assocId = (p as any).VLAN_SEDE_ID ?? (p as any).ASSOC_ID;
  const params = toParams([
    assocId,
    p.NOME_INTERFACCIA,
    p.DESCRIZIONE,
    p.IP_ADDRESS,
    p.SUBNET_MASK,
    p.ID,
    p.DEVICE_NAME,
    p.CONFIG_TESTO,
  ]);
  return http.post(QUERY_BASE, { queryId: 21, params });
}

export async function apiUpdateRouterInterface(
  idOrParams: number | QParam[],
  payload?: {
    VLAN_SEDE_ID?: number | string | null;
    ASSOC_ID?: number | string | null; // alias possibile dal client
    NOME_INTERFACCIA: string;
    DESCRIZIONE: string;
    IP_ADDRESS: string;
    SUBNET_MASK: string;
    ID_ACL: string | number | null; // presente nel modello ma NON usato per update
    DEVICE_NAME: string;
    DATA_AGGIORNAMENTO?: string; // opzionale; se assente mettiamo now
    CONFIG_TESTO: string;
  }
) {
  // Update router interface (queryId 21)
  if (Array.isArray(idOrParams)) {
    return http.post(QUERY_BASE, { queryId: 25, params: idOrParams });
  }
  if (payload == null) throw new Error("apiUpdateRouterInterface: payload required");
  const p = payload;
  const vlanSedeId = (p as any).VLAN_SEDE_ID ?? (p as any).ASSOC_ID ?? null;

  // Ordine richiesto senza ID_ACL:
  // VLAN_SEDE_ID, NOME_INTERFACCIA, DESCRIZIONE, IP_ADDRESS, SUBNET_MASK,
  // DEVICE_NAME, CONFIG_TESTO, ID
  const params = toParams([
    vlanSedeId,
    p.NOME_INTERFACCIA,
    p.DESCRIZIONE,
    p.IP_ADDRESS,
    p.SUBNET_MASK,
    p.DEVICE_NAME,
    p.CONFIG_TESTO,
    idOrParams,
  ]);
  return http.post(QUERY_BASE, { queryId: 25, params });
}

// ACLs
export async function apiLoadAcl() {
  // Select ACLs or single ACL by number (queryId 22)

  return http.post(QUERY_BASE, { queryId: 22, params: [], maxRows: 1000 });
}

export async function apiUpdateAcl(
  payloadOrParams:
    | QParam[]
    | { ID: number; NUMERO: number | string; DESCRIZIONE: string; DIREZIONE: string; TESTO_CONFIG: string }
) {
  // Update ACL (queryId 23)
  if (Array.isArray(payloadOrParams)) {
    return http.post(QUERY_BASE, { queryId: 24, params: payloadOrParams });
  }
  const p = payloadOrParams;
  const params = toParams([ p.DESCRIZIONE, p.DIREZIONE, p.TESTO_CONFIG,p.NUMERO]);
  return http.post(QUERY_BASE, { queryId: 24, params });
}

export async function apiCreateAcl(

  payloadOrParams:
    | QParam[]
    | { NUMERO: number | string; DESCRIZIONE: string; DIREZIONE: string; TESTO_CONFIG: string }
) {
  // Insert ACL (queryId 24)
  if (Array.isArray(payloadOrParams)) {
    return http.post(QUERY_BASE, { queryId: 23, params: payloadOrParams });
  }
  const p = payloadOrParams;
  const params = toParams([p.NUMERO, p.DESCRIZIONE, p.DIREZIONE, p.TESTO_CONFIG]);
  return http.post(QUERY_BASE, { queryId: 23, params });
}

export async function apiLoadAclRules(aclId: number | string) {
  // Select rules by ACL (queryId 25)
  return http.post(QUERY_BASE, {
    queryId: 29,
    params: [{ index: 1, value: String(aclId) }],
    maxRows: 2000,
  });
}

export async function apiUpdateAclRule(
  payloadOrParams:
    | QParam[]
    | {
        ID: number | string;
        ACL_ID: number | string;
        AZIONE: string;
        PROTOCOLLO: string;
        ORIGINE: string;
        DESTINAZIONE: string;
        PORTA_DESTINAZIONE: string;
      }
) {
  // Update single ACL rule (queryId 26)
  if (Array.isArray(payloadOrParams)) {
    return http.post(QUERY_BASE, { queryId: 26, params: payloadOrParams });
  }
  const r = payloadOrParams;
  const params = toParams([
    r.ACL_ID,
    r.AZIONE,
    r.PROTOCOLLO,
    r.ORIGINE,
    r.DESTINAZIONE,
    r.PORTA_DESTINAZIONE,
    r.ID,
  ]);
  return http.post(QUERY_BASE, { queryId: 26, params });
}

export async function apiCreateAclRule(
  payloadOrParams:
    | QParam[]
    | {
        ACL_ID: number | string;
        AZIONE: string;
        PROTOCOLLO: string;
        ORIGINE: string;
        DESTINAZIONE: string;
        PORTA_DESTINAZIONE: string;
      }
) {
  // Insert single ACL rule (queryId 27)
  if (Array.isArray(payloadOrParams)) {
    return http.post(QUERY_BASE, { queryId: 27, params: payloadOrParams });
  }
  const r = payloadOrParams;
  const params = toParams([
    r.ACL_ID,
    r.AZIONE,
    r.PROTOCOLLO,
    r.ORIGINE,
    r.DESTINAZIONE,
    r.PORTA_DESTINAZIONE,
  ]);
  return http.post(QUERY_BASE, { queryId: 27, params });
}

// Simple ESTESA-based endpoints (insert=30, update=31)
// Insert ESTESA: supports single or batch [{ numeroAcl, estesa }]
export function apiCreateAclRuleEstesa(numeroAcl: string | number, estesa: string): Promise<any>;
export function apiCreateAclRuleEstesa(batch: Array<{ numeroAcl: string | number; estesa: string }>): Promise<any>;
export function apiCreateAclRuleEstesa(arg1: any, arg2?: any) {
  if (Array.isArray(arg1)) {
    const batch = arg1.map((item) => ({
      params: [
        { index: 1, value: item.numeroAcl },
        { index: 2, value: item.estesa },
      ],
    })) as any[];
    return http.post(QUERY_BASE, { queryId: 30, kind: "batch", batch });
  }
  const params = toParams([arg1, arg2]);
  return http.post(QUERY_BASE, { queryId: 30, params });
}

// Update ESTESA: supports single or batch [{ id, estesa }]
export function apiUpdateAclRuleEstesa(id: string | number, estesa: string): Promise<any>;
export function apiUpdateAclRuleEstesa(batch: Array<{ id: string | number; estesa: string }>): Promise<any>;
export function apiUpdateAclRuleEstesa(arg1: any, arg2?: any) {
  if (Array.isArray(arg1)) {
    const batchUpdate = arg1.map((item) => ({
      params: [
        { index: 1, value: item.estesa },
        { index: 2, value: item.id },
      ],
    })) as any[];
    return http.post(QUERY_BASE, { queryId: 31, kind: "batchUpdate", batch: batchUpdate });
  }
  const params = toParams([arg1, arg2]);
  return http.post(QUERY_BASE, { queryId: 31, params });
}

export async function apiDeleteAclRule(ruleId: number | string) {
  // Delete rule by id (queryId 28)
  return http.post(QUERY_BASE, {
    queryId: 28,
    params: [{ index: 1, value: String(ruleId) }],
  });
}

// Dispositivi per VLAN (e opzionalmente per sede)
export async function apiLoadDevicesForVlan(idVlan: number | string) {
  const params = [{ index: 1, value: String(idVlan) }] as { index: number; value: any }[];
  // if (sede && String(sede).trim().length) params.push({ index: 2, value: String(sede) });
  // NOTE: imposta il queryId lato backend per questa select

  return http.post(QUERY_BASE, {
    queryId: 28,
    params,
    maxRows: 5000,
  });
}
