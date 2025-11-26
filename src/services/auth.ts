//SECURITTY DA RIVEDERE

// services/auth.ts
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { AUTH_BASE } from "@/config/config";

let accessToken: string | null = null;

export function setToken(t: string) {
  accessToken = t;
  localStorage.setItem('jwt', t); // persiste
}
export function getToken() {
  if (accessToken) return accessToken;
  const t = localStorage.getItem('jwt');
  accessToken = t;
  return t;
}
export function clearToken() {
  accessToken = null;
  localStorage.removeItem('jwt');
}

export function isExpiringSoon(token: string, skewSec = 30) {
  try {
    const { exp } = jwtDecode<{ exp: number }>(token);
    const now = Math.floor(Date.now() / 1000);
    return !exp || (exp - now) < skewSec;
  } catch { return true; }
}

export function authHeader(): HeadersInit {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

// Full logout: clears access token and invalidates refresh cookie (server side)
export async function logout(): Promise<void> {
  try {
    await axios.post(`${AUTH_BASE}/logout`, {}, {
      withCredentials: true,
      headers: { "X-Requested-By": "webapp" },
    });
  } catch {
    // ignore network/endpoint errors; still clear local state
  }
  clearToken();
}
