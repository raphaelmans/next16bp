"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PaymentMethodsManager } from "@/features/owner/components/payment-methods-manager";

interface ManagePaymentMethodsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId?: string;
  onSuccess: () => void;
}

export function ManagePaymentMethodsSheet({
  open,
  onOpenChange,
  organizationId,
  onSuccess,
}: ManagePaymentMethodsSheetProps) {
  if (!organizationId) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Payment Methods</SheetTitle>
          <SheetDescription>
            Manage your mobile wallets and bank accounts for booking payments.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <PaymentMethodsManager
            organizationId={organizationId}
            onMethodChanged={onSuccess}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
