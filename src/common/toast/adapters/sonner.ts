import { toast as sonnerToast } from "sonner";
import type { ToastPort } from "../types";

export const sonnerToastAdapter: ToastPort = {
  success: (message, options) => {
    sonnerToast.success(message, options);
  },
  error: (message, options) => {
    sonnerToast.error(message, options);
  },
  info: (message, options) => {
    sonnerToast.info(message, options);
  },
  warning: (message, options) => {
    sonnerToast.warning(message, options);
  },
};
