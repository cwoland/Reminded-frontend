import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/auth";
import type { AuthResponse } from "@/types/api";

const baseURL = process.env.NEXT_PUBLIC_API_URL;

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
  timeout: 60_000,
});

const refreshClient = axios.create({ baseURL, withCredentials: true, timeout: 60_000 });

let refreshPromise: Promise<string> | null = null;

export async function refreshSession(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post<AuthResponse>("/auth/refresh")
      .then((response) => {
        useAuthStore.getState().setAuth(response.data.token, response.data.user);
        return response.data.token;
      })
      .catch((error) => {
        useAuthStore.getState().clear();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retried?: boolean };

    if (error.response?.status !== 401 || !original || original._retried) {
      return Promise.reject(error);
    }

    original._retried = true;

    try {
      const token = await refreshSession();
      original.headers.Authorization = `Bearer ${token}`;
      return api(original);
    } catch {
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }
  }
);