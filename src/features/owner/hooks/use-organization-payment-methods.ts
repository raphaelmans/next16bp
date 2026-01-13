"use client";

import { trpc } from "@/trpc/client";

export function useOrganizationPaymentMethods(organizationId?: string) {
  return trpc.organizationPayment.listMethods.useQuery(
    { organizationId: organizationId ?? "" },
    { enabled: !!organizationId },
  );
}

export function useCreateOrganizationPaymentMethod(organizationId: string) {
  const utils = trpc.useUtils();
  return trpc.organizationPayment.createMethod.useMutation({
    onSuccess: async () => {
      await utils.organizationPayment.listMethods.invalidate({
        organizationId,
      });
    },
  });
}

export function useUpdateOrganizationPaymentMethod(organizationId: string) {
  const utils = trpc.useUtils();
  return trpc.organizationPayment.updateMethod.useMutation({
    onSuccess: async () => {
      await utils.organizationPayment.listMethods.invalidate({
        organizationId,
      });
    },
  });
}

export function useDeleteOrganizationPaymentMethod(organizationId: string) {
  const utils = trpc.useUtils();
  return trpc.organizationPayment.deleteMethod.useMutation({
    onSuccess: async () => {
      await utils.organizationPayment.listMethods.invalidate({
        organizationId,
      });
    },
  });
}

export function useSetDefaultOrganizationPaymentMethod(organizationId: string) {
  const utils = trpc.useUtils();
  return trpc.organizationPayment.setDefault.useMutation({
    onSuccess: async () => {
      await utils.organizationPayment.listMethods.invalidate({
        organizationId,
      });
    },
  });
}
