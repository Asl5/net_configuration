// services/http.ts
import axios from "axios";
import { getToken, setToken, clearToken, isExpiringSoon } from "./auth";
import router from "@/router";
import { AUTH_BASE, API_BASE } from "@/config/config";
import { useRightsStore } from "@/stores/rights";

export const http = axios.create({
  baseURL: `${API_BASE}`,
  withCredentials: true,
});

const REFRESH_HEADERS = { "X-Requested-By": "webapp" };

let refreshing: Promise<void> | null = null;

async function refreshIfNeeded() {
  const t = getToken();
  if (!t || !isExpiringSoon(t)) return;
  if (!refreshing) {
    refreshing = axios
      .post(`${AUTH_BASE}/refresh`, {}, { withCredentials: true, headers: REFRESH_HEADERS })
      .then((res: { data: { access_token: string } }) => setToken(res.data.access_token))
      .finally(() => { refreshing = null; });
  }
  await refreshing;
}

http.interceptors.request.use(async (config: any) => {
  await refreshIfNeeded();
  const t = getToken();
  if (t) config.headers = { ...(config.headers || {}), Authorization: `Bearer ${t}` };
  return config;
});

http.interceptors.response.use(undefined, async (error: any) => {
  const original = error.config;
  if (error.response?.status === 401 && !original._retry) {
    original._retry = true;
    try {
      const res = await axios.post(`${AUTH_BASE}/refresh`, {}, { withCredentials: true, headers: REFRESH_HEADERS });
      setToken(res.data.access_token);
      original.headers = { ...(original.headers || {}), Authorization: `Bearer ${getToken()}` };
      return http(original);
    } catch {
      clearToken();
      try { useRightsStore().clear(); } catch {}
      const redirect = router.currentRoute.value.fullPath || "/";
      router.replace({ name: "login", query: { redirect } });
    }
  }
  return Promise.reject(error);
});
