import { defineStore } from "pinia";
import type { RightsPayload, Right } from "@/models/rights";
import { fetchRightsByMatricola } from "@/services/rights";

const SESSION_KEY = "auth.rights.v1";

type RightsState = {
  rights: Right[];
  loading: boolean;
  matricola: string | null;
  generalRoles: number[];
};

type PersistedPayload = RightsPayload & { matricola: string | null };

export const useRightsStore = defineStore("rights", {
  state: (): RightsState => ({
    rights: [],
    loading: false,
    matricola: null,
    generalRoles: [],
  }),

  getters: {
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
console.log(data)

        this.rights = data.rights ?? [];

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
        rights: this.rights,
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

        this.rights = Array.isArray((data as any).rights) ? (data as any).rights : [];
        (this as any).generalRoles = Array.isArray(data.generalRoles) ? (data.generalRoles as any) : [];

      } catch {
        this.clear();
      }
    },

    clear() {
      this.rights = [];
      this.matricola = null;
      (this as any).generalRoles = [];
      sessionStorage.removeItem(SESSION_KEY);
    },
  },
});
