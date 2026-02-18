import { createServerCaller } from "@/lib/shared/infra/trpc/server";

export const getOwnerCourtByIdForAlias = async (
  pathname: string,
  courtId: string,
) => {
  const caller = await createServerCaller(pathname);
  return caller.courtManagement.getById({ courtId });
};
