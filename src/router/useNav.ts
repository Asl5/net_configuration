import { computed } from "vue";
import { useRouter, type RouteLocationRaw } from "vue-router";
import { useRightsStore } from "@/stores/rights";

/**
 * Struttura di un item di navigazione (usato nel menu laterale)
 */
export type NavItem = {
  label: string;
  to?: RouteLocationRaw;
  order?: number;
  group?: boolean;
  clickable?: boolean;
  icon?: string;                // ← icona FontAwesome (es. "fa-solid fa-gear")
  children?: NavItem[];
  requiredRole?: number | number[];
};

export function useNav() {
  const router = useRouter();
  const rightsStore = useRightsStore();

  const items = computed<NavItem[]>(() => {
    const routes = router.getRoutes();
    const groups: Record<string, NavItem> = {};
    const flat: NavItem[] = [];

    // 1️⃣ Crea i gruppi principali
    routes.forEach((r) => {
      if (r.meta?.nav && r.meta?.navGroup) {
        groups[r.name as string] = {
          label: r.meta?.title as string,
          group: true,
          order: (r.meta?.order as number) ?? 999,
          clickable: r.meta?.clickable !== false,
          icon: r.meta?.icon as string | undefined,          // 👈 aggiunta icona
          children: [],
          requiredRole: r.meta?.requiredRole as number | number[] | undefined,
        };
      }
    });

    // 2️⃣ Crea le voci (figli e voci flat)
    routes.forEach((r) => {
      if (!r.meta?.nav) return;

      // Controlla i ruoli richiesti
      const req = r.meta?.requiredRole as number | number[] | undefined;
      if (req) {
        const list = Array.isArray(req) ? req : [req];
        const ok = list.some((id) => rightsStore.hasRole(id));
        if (!ok) return;
      }

      // Se la rotta ha un parent → aggiungi come figlio del gruppo
      if (r.meta?.parent && groups[r.meta.parent as string]) {
        groups[r.meta.parent as string].children!.push({
          label: r.meta?.title as string,
          to: r.name ? { name: String(r.name) } : { path: r.path },
          order: (r.meta?.order as number) ?? 999,
          icon: r.meta?.icon as string | undefined,          // 👈 aggiunta icona
          requiredRole: r.meta?.requiredRole as number | number[] | undefined,
        });
      }
      // Altrimenti è una voce singola “flat”
      else if (!r.meta?.navGroup) {
        flat.push({
          label: r.meta?.title as string,
          to: r.name ? { name: String(r.name) } : { path: r.path },
          order: (r.meta?.order as number) ?? 999,
          icon: r.meta?.icon as string | undefined,          // 👈 aggiunta icona
          requiredRole: r.meta?.requiredRole as number | number[] | undefined,
        });
      }
    });

    // 3️⃣ Mantieni solo i gruppi con figli visibili e ordina
    const groupsArr = Object.values(groups)
      .map((g) => ({
        ...g,
        children: g.children?.sort((a, b) => a.order! - b.order!),
      }))
      .filter((g) => g.children && g.children.length > 0);

    // 4️⃣ Restituisci il menu finale ordinato
    return [...flat, ...groupsArr].sort((a, b) => a.order! - b.order!);
  });

  return { items };
}
