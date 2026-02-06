import type { ComponentProps, ReactNode } from "react";
import type { Button } from "@/components/ui/button";

export interface InboxFloatingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unreadCount: number;
  triggerLabel: string;
  triggerVariant?: ComponentProps<typeof Button>["variant"];
  triggerClassName?: string;
  sheetTitle: string;
  sheetDescription: string;
  isSmall: boolean;
  isDesktop: boolean;
  authLoading: boolean;
  authErrorMessage?: string | null;
  clientErrorMessage?: string | null;
  mobilePane: "list" | "thread";
  listPane: ReactNode;
  threadPane: ReactNode;
}
