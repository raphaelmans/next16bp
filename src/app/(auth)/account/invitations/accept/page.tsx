import AccountOrganizationInvitationAcceptPage from "@/features/owner/pages/account-organization-invitation-accept-page";

type AccountInvitationAcceptRoutePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AccountInvitationAcceptRoutePage({
  searchParams,
}: AccountInvitationAcceptRoutePageProps) {
  const queryParams = await searchParams;
  const tokenParam = queryParams.token;
  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;

  return <AccountOrganizationInvitationAcceptPage token={token ?? null} />;
}
