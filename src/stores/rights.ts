import { defineStore } from "pinia";
import type { RightsPayload, FlowRights } from "@/models/rights";
import { fetchRightsByMatricola } from "@/services/rights";

const SESSION_KEY = "auth.rights.v1";

type RightsState = {
  flows: FlowRights[];
  loading: boolean;
  matricola: string | null;
  generalRoles: number[];
};

type PersistedPayload = RightsPayload & { matricola: string | null };

export const useRightsStore = defineStore("rights", {
  state: (): RightsState => ({
    flows: [],
    loading: false,
    matricola: null,
    generalRoles: [],
  }),

  getters: {
    hasOnFlow: (s) => (flowId: number, code: number) =>
      s.flows.find((f) => f.flowId === flowId)?.rights.includes(code) ?? false,

    rightsForFlow: (s) => (flowId: number) =>
      s.flows.find((f) => f.flowId === flowId)?.rights ?? [],

    hasRole: (s) => (roleCode: number) => s.generalRoles.includes(roleCode),
    has: (s) => (roleCode: number) => s.generalRoles.includes(roleCode),
  },

  actions: {
    async bootstrap(matricola: string) {
      this.loading = true;
      try {
        this.matricola = matricola;
        const data: RightsPayload = await fetchRightsByMatricola(matricola);
        // DEBUG backend payload


        this.flows = data.flows ?? [];

        // Usa gli ID dei diritti generali come generalRoles
        this.generalRoles = (data.generalRoles ?? []) as number[];

        this.persist();
      } finally {
        this.loading = false;
      }
    },

    persist() {
      const payload: PersistedPayload = {
        matricola: this.matricola,

        flows: this.flows,
        generalRoles: (this as any).generalRoles ?? [],
      };

      sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
    },

    hydrateFromSession() {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return;
      try {
        const data = JSON.parse(raw) as PersistedPayload & { generalRoles?: number[] };

        this.matricola = data.matricola ?? null;

        this.flows = Array.isArray(data.flows) ? data.flows : [];
        (this as any).generalRoles = Array.isArray(data.generalRoles) ? (data.generalRoles as any) : [];

      } catch {
        this.clear();
      }
    },

    clear() {
      this.flows = [];
      this.matricola = null;
      (this as any).generalRoles = [];
      sessionStorage.removeItem(SESSION_KEY);
    },
  },
});
