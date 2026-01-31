import { redirect } from "next/navigation";
import { appRoutes } from "@/common/app-routes";

export const dynamic = "force-dynamic";

const getSafeNextHref = (nextHref: string | undefined): string | null => {
  if (!nextHref) {
    return null;
  }

  if (!nextHref.startsWith("/") || nextHref.startsWith("//")) {
    return null;
  }

  if (
    nextHref === appRoutes.owner.getStarted ||
    nextHref === appRoutes.owner.onboarding
  ) {
    return null;
  }

  const ownerBase = appRoutes.owner.base;
  const isOwnerPath =
    nextHref === ownerBase || nextHref.startsWith(`${ownerBase}/`);
  if (!isOwnerPath) {
    return null;
  }

  return nextHref;
};

type OnboardingPageProps = {
  searchParams?: {
    next?: string | string[];
  };
};

export default async function OnboardingPage({
  searchParams,
}: OnboardingPageProps) {
  const nextParam = Array.isArray(searchParams?.next)
    ? searchParams?.next[0]
    : searchParams?.next;

  const safeNextHref = getSafeNextHref(nextParam);
  const redirectHref = safeNextHref
    ? `${appRoutes.owner.getStarted}?next=${encodeURIComponent(safeNextHref)}`
    : appRoutes.owner.getStarted;

  redirect(redirectHref);
}
