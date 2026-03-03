import { redirect } from "next/navigation";
import { appRoutes } from "@/common/app-routes";
import OwnerGetStartedPage from "@/features/owner/pages/owner-get-started-page";
import { makeOwnerSetupStatusUseCase } from "@/lib/modules/owner-setup/factories/owner-setup.factory";
import { requireSession } from "@/lib/shared/infra/auth/server-session";

export default async function GetStartedPage() {
  const session = await requireSession(appRoutes.organization.getStarted);
  const useCase = makeOwnerSetupStatusUseCase();
  const status = await useCase.execute(session.userId);

  if (status.isSetupComplete) {
    redirect(appRoutes.organization.base);
  }

  return <OwnerGetStartedPage />;
}
