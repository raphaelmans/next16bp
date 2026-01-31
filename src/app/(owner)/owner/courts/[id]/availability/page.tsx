import { TRPCError } from "@trpc/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { appRoutes } from "@/common/app-routes";
import { createServerCaller } from "@/lib/shared/infra/trpc/server";

export const dynamic = "force-dynamic";

type OwnerCourtAvailabilityAliasPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OwnerCourtAvailabilityAliasPage({
  params,
}: OwnerCourtAvailabilityAliasPageProps) {
  const { id } = await params;

  const headerStore = await headers();
  const pathname =
    headerStore.get("x-pathname") ?? appRoutes.owner.courts.availability(id);
  const caller = await createServerCaller(pathname);

  const courtData = await caller.courtManagement
    .getById({ courtId: id })
    .catch((error) => {
      if (error instanceof TRPCError && error.code === "UNAUTHORIZED") {
        redirect(appRoutes.login.from(pathname));
      }

      return null;
    });

  const placeId = courtData?.court.placeId;
  if (!placeId) {
    redirect(appRoutes.owner.courts.base);
  }

  redirect(appRoutes.owner.places.courts.availability(placeId, id));
}
