import { sonnerToastAdapter } from "./adapters/sonner";
import type { ToastPort } from "./types";

let toastProvider: ToastPort = sonnerToastAdapter;

export const setToastProvider = (provider: ToastPort) => {
  toastProvider = provider;
};

export const getToastProvider = (): ToastPort => toastProvider;
