"use client";

import { useSyncExternalStore } from "react";

type ToastVariant = "success" | "error" | "info";

type ToastState = {
  message: string;
  variant: ToastVariant;
} | null;

type UiState = {
  toast: ToastState;
  isMobileNavOpen: boolean;
  showToast: (toast: NonNullable<ToastState>) => void;
  clearToast: () => void;
  setMobileNavOpen: (isOpen: boolean) => void;
};

type UiListener = () => void;

type UiStoreHook = {
  <T>(selector: (state: UiState) => T): T;
  getState: () => UiState;
};

const listeners = new Set<UiListener>();

let uiState: UiState = {
  toast: null,
  isMobileNavOpen: false,
  showToast: (toast) => {
    setUiState({ toast });
  },
  clearToast: () => {
    setUiState({ toast: null });
  },
  setMobileNavOpen: (isMobileNavOpen) => {
    setUiState({ isMobileNavOpen });
  },
};

function setUiState(nextState: Partial<UiState>) {
  uiState = { ...uiState, ...nextState };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: UiListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const useUiStore: UiStoreHook = <T,>(selector: (state: UiState) => T) => {
  return useSyncExternalStore(
    subscribe,
    () => selector(uiState),
    () => selector(uiState),
  );
};

useUiStore.getState = () => uiState;
