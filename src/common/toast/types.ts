export type ToastLevel = "success" | "error" | "info" | "warning";

export type ToastOptions = {
  description?: string;
  duration?: number;
};

export type ToastPort = {
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
  warning: (message: string, options?: ToastOptions) => void;
};
