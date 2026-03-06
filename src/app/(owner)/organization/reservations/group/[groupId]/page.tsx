import { TRPCError } from "@trpc/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { appRoutes } from "@/common/app-routes";
import { createServerCaller } from "@/lib/shared/infra/trpc/server";

export const dynamic = "force-dynamic";

type OwnerReservationGroupDetailRoutePageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function OwnerReservationGroupDetailRoutePage({
  params,
}: OwnerReservationGroupDetailRoutePageProps) {
  const { groupId } = await params;
  const headerStore = await headers();
  const pathname =
    headerStore.get("x-pathname") ??
    appRoutes.organization.reservationGroupDetail(groupId);

  const groupDetail = await (async () => {
    const caller = await createServerCaller(pathname);
    return caller.reservationOwner.resolveLegacyGroup({
      reservationGroupId: groupId,
    });
  })().catch((error) => {
    if (error instanceof TRPCError && error.code === "UNAUTHORIZED") {
      redirect(appRoutes.login.from(pathname));
    }
    return null;
  });

  const representativeReservationId = groupDetail?.reservationId;
  if (!representativeReservationId) {
    redirect(appRoutes.organization.reservations);
  }

  redirect(
    appRoutes.organization.reservationDetail(representativeReservationId),
  );
}
