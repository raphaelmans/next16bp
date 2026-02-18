import { getToastProvider } from "./provider";
import type { ToastOptions } from "./types";

export const toast = {
  success: (message: string, options?: ToastOptions) => {
    getToastProvider().success(message, options);
  },
  error: (message: string, options?: ToastOptions) => {
    getToastProvider().error(message, options);
  },
  info: (message: string, options?: ToastOptions) => {
    getToastProvider().info(message, options);
  },
  warning: (message: string, options?: ToastOptions) => {
    getToastProvider().warning(message, options);
  },
};

export { getToastProvider, setToastProvider } from "./provider";
export type { ToastLevel, ToastOptions, ToastPort } from "./types";
