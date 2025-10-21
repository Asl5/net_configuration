//SECURITTY DA RIVEDERE

import { clearToken, getToken, isExpiringSoon, setToken } from "@/services/auth";
import { createRouter, createWebHistory } from "vue-router";
import axios from "axios";
import { AUTH_BASE } from "@/config/config";
import { useRightsStore } from "@/stores/rights";

const router = createRouter({
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
          path: "/dashboard-count",
          name: "dashboard-count",
          component: () => import("@/views/DashboardCount.vue"),
          meta: {
            public: true,
            title: "Dashboard Invii",
            nav: true,
            parent: "dashboard",
            order: 1,
            icon: "dashboard",
          },
        },
        {
          path: "/dashboard-flows",
          name: "dashboard-flows",
          component: () => import("@/views/DashboardFlows.vue"),
          meta: {
            public: true,
            title: "Dashboard Flussi",
            nav: true,
            parent: "dashboard",
            order: 2,
            icon: "trends",
          },
        },
        {
          path: "/dashboard-error",
          name: "dashboard-error",
          component: () => import("@/views/DashboardError.vue"),
          meta: {
            public: true,
            title: "Dashboard Errori",
            nav: true,
            parent: "dashboard",
            order: 3,
            icon: "error",
          },
        },
        {
          path: "/dashboard-request",
          name: "dashboard-request",
          component: () => import("@/views/DashboardRequests.vue"),
          meta: {
            public: true,
            title: "Dashboard Richieste",
            nav: true,
            parent: "dashboard",
            order: 4,
            icon: "grid",
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
          path: "/flows",
          name: "settings.flows",
          component: () => import("../views/settings/FlowsSettings.vue"),
          meta: {
            public: true,
            title: "Flows Settings",
            nav: true,
            order: 2,
            parent: "settings",
            requiredRole: [1, 3],
            icon: "settings",
          },
        },
        {
          path: "/send-returns",
          name: "settings.send-returns",
          component: () => import("../views/settings/SendReturnSetting.vue"),
          meta: {
            public: true,
            title: "Send/Return Settings",
            nav: true,
            order: 3,
            parent: "settings",
            requiredRole: [1, 3],
            icon: "flow",
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
