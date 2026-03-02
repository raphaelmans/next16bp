import AccountOrganizationInvitationAcceptPage from "@/features/owner/pages/account-organization-invitation-accept-page";

type AccountInvitationAcceptRoutePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AccountInvitationAcceptRoutePage({
  searchParams,
}: AccountInvitationAcceptRoutePageProps) {
  const queryParams = await searchParams;
  const codeParam = queryParams.code;
  const invitationIdParam = queryParams.invitationId;
  const tokenParam = queryParams.token;

  const code = Array.isArray(codeParam) ? codeParam[0] : codeParam;
  const invitationId = Array.isArray(invitationIdParam)
    ? invitationIdParam[0]
    : invitationIdParam;
  const legacyToken = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;

  return (
    <AccountOrganizationInvitationAcceptPage
      initialCode={code ?? null}
      invitationId={invitationId ?? null}
      legacyToken={legacyToken ?? null}
    />
  );
}
