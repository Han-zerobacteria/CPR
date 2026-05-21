"use client";

import { create } from "zustand";

type AuthUser = {
  id: string;
  username: string;
  nickname: string;
  profileImageUrl?: string | null;
};

type AuthStatus = "idle" | "checking" | "authenticated" | "unauthenticated";

type AuthState = {
  status: AuthStatus;
  accessToken: string | null;
  user: AuthUser | null;
  startChecking: () => void;
  setSession: (session: { accessToken: string; user: AuthUser }) => void;
  setAccessToken: (accessToken: string | null) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  status: "idle",
  accessToken: null,
  user: null,
  startChecking: () => {
    set({ status: "checking" });
  },
  setSession: ({ accessToken, user }) => {
    set({ accessToken, user, status: "authenticated" });
  },
  setAccessToken: (accessToken) => {
    set({ accessToken });
  },
  clearSession: () => {
    set({
      accessToken: null,
      user: null,
      status: "unauthenticated",
    });
  },
}));
