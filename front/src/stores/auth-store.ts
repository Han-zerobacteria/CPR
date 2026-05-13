"use client";

import { useSyncExternalStore } from "react";

type AuthUser = {
  id: string;
  username: string;
  nickname: string;
  profileImageUrl?: string | null;
};

type AuthState = {
  accessToken: string | null;
  user: AuthUser | null;
  setSession: (session: { accessToken: string; user: AuthUser }) => void;
  setAccessToken: (accessToken: string | null) => void;
  clearSession: () => void;
};

type AuthListener = () => void;

type AuthStoreHook = {
  <T>(selector: (state: AuthState) => T): T;
  getState: () => AuthState;
};

const listeners = new Set<AuthListener>();

let authState: AuthState = {
  accessToken: null,
  user: null,
  setSession: ({ accessToken, user }) => {
    setAuthState({ accessToken, user });
  },
  setAccessToken: (accessToken) => {
    setAuthState({ accessToken });
  },
  clearSession: () => {
    setAuthState({ accessToken: null, user: null });
  },
};

function setAuthState(nextState: Partial<AuthState>) {
  authState = { ...authState, ...nextState };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: AuthListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const useAuthStore: AuthStoreHook = <T,>(
  selector: (state: AuthState) => T,
) => {
  return useSyncExternalStore(
    subscribe,
    () => selector(authState),
    () => selector(authState),
  );
};

useAuthStore.getState = () => authState;
