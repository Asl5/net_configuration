//SECURITTY DA RIVEDERE

import { clearToken, getToken, isExpiringSoon, setToken } from "@/services/auth";
import { createRouter, createWebHistory } from "vue-router";
import axios from "axios";
import { AUTH_BASE } from "@/config/config";
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
        public: true,
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
            public: true,
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
        public: true,
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
            public: true,
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
            public: true,
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
            public: true,
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
            public: true,
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
            public: true,
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
            public: true,
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
  const token = getToken();

  const rightsStore = useRightsStore();

  // Support requiredRole as number(s) (IDs) or legacy string(s)
  const req = to.meta.requiredRole as number | number[] | undefined;

  if (req) {
    const required = Array.isArray(req) ? req : [req];
    const ok = required.some((r) => rightsStore.hasRole(r));
    if (!ok) {
      return { name: "dashboard" }; // oppure pagina 403
    }
  }
  // Rotta pubblica -> ok
  if (to.meta.public) return true;

  // Nessun token -> vai a login
  if (!token) {
    return { name: "login", query: { redirect: to.fullPath } };
  }

  if (isExpiringSoon(token, 5)) {
    try {
      const res = await axios.post(`${AUTH_BASE}/refresh`, {}, { withCredentials: true });
      setToken(res.data.access_token);
      return true;
    } catch {
      clearToken();
      return { name: "login", query: { redirect: to.fullPath } };
    }
  }

  return true;
});

export default router;
