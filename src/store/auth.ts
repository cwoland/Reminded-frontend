import { create } from "zustand";
import type { User } from "@/types/api";
import { api } from "@/lib/axios";

type AuthStatus = "loading" | "authenticated" | "anonymous";

interface AuthState {
  token: string | null;
  user: User | null;
  status: AuthStatus;
  setAuth: (token: string, user: User) => void;
  clear: () => void;
  setAnonymous: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  status: "loading",
  setAuth: (token, user) => set({ token, user, status: "authenticated" }),
  clear: () => set({ token: null, user: null, status: "anonymous" }),
  setAnonymous: () => set({ status: "anonymous" }),
}));

export async function logout() {
  try {
    await api.post("/auth/logout");
  } finally {
    useAuthStore.getState().clear();
  }
}