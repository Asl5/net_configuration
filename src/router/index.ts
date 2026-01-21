//SECURITTY DA RIVEDERE

import { clearToken, getToken, isExpiringSoon } from "@/services/auth";
import { createRouter, createWebHistory } from "vue-router";
import { useRightsStore } from "@/stores/rights";

const router = createRouter({
  // History mode; assicurati di avere rewrite Apache configurati
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", redirect: { name: "login" } },
    {
      path: "/login",
      name: "login",
      component: () => import("@/views/LoginView.vue"),
      meta: { public: true, title: "Login" },
    },

    {
      path: "/dashboard",
      name: "dashboard",
      meta: {
        title: "Dashboard",
        nav: true,
        order: 2,
        navGroup: true,
        clickable: false,
        icon: "dashboard", // ⬅️ nuova chiave
      },
      children: [
        {
          path: "/dashboard-vlan",
          name: "dashboard-vlan",
          component: () => import("@/views/DashboardVlan.vue"),
          meta: {
            title: "Dashboard Vlan",
            nav: true,
            parent: "dashboard",
            order: 1,
            icon: "dashboard",
          },
        },

      ],
    },
    {
      path: "/settings",
      name: "settings",
      meta: {
        title: "Settings",
        nav: true,
        order: 2,
        navGroup: true,
        clickable: false,
        requiredRole: [1, 3],
        icon: "settings",
      },
      children: [
        {
          path: "/users",
          name: "settings.users",
          component: () => import("../views/settings/UsersSettings.vue"),
          meta: {
            title: "Users Settings",
            nav: true,
            order: 1,
            parent: "settings",
            requiredRole: [1, 3],
            icon: "user",
          },
        },
        {
          path: "/sedi",
          name: "settings.sedi",
          component: () => import("../views/settings/SediSettings.vue"),
          meta: {
            title: "Sedi Settings",
            nav: true,
            order: 2,
            parent: "settings",
            requiredRole: [1, 3],
            icon: "sedi",
          },
        },
        {
          path: "/vlan",
          name: "settings.vlan",
          component: () => import("../views/settings/VlanSettings.vue"),
          meta: {
            title: "Vlan Settings",
            nav: true,
            order: 3,
            parent: "settings",
            requiredRole: [1, 3],
            icon: "vlan",
          },
        },
        {
          path: "/vlan-devices",
          name: "settings.vlan-devices",
          component: () => import("../views/settings/VlanDeviceView.vue"),
          meta: {
            title: "VLAN Device Settings",
            nav: true,
            order: 4,
            parent: "settings",
            requiredRole: [1, 3],
            icon: "devices",
          },
        },
        {
          path: "/acl",
          name: "settings.acl",
          component: () => import("../views/settings/AclSettings.vue"),
          meta: {
            title: "Acl Settings",
            nav: true,
            order: 3,
            parent: "settings",
            requiredRole: [1, 3],
            icon: "acl",
          },
        },
        {
          path: "/router-interface",
          name: "settings.router-interface",
          component: () => import("../views/settings/RouterInterfaceSettings.vue"),
          meta: {
            title: "Router Interface Settings",
            nav: true,
            order: 3,
            parent: "settings",
            requiredRole: [1, 3],
            icon: "router",
          },
        },
      ],
    },
  ],
});

router.beforeEach(async (to) => {
  // Rotte pubbliche: sempre consentite
  if (to.meta.public) return true;

  const token = getToken();

  // Nessun token o token scaduto/non valido -> vai al login
  // isExpiringSoon(token, 0) è true quando exp <= now o token illeggibile
  if (!token || isExpiringSoon(token, 0)) {
    clearToken();
    return { name: "login" };
  }

  // Controllo ruoli richiesti (dopo validazione token)
  const rightsStore = useRightsStore();
  const req = to.meta.requiredRole as number | number[] | undefined;
  if (req) {
    const required = Array.isArray(req) ? req : [req];
    const ok = required.some((r) => rightsStore.hasRole(r));
    if (!ok) {
      return { name: "dashboard" }; // oppure pagina 403
    }
  }

  return true;
});

export default router;
