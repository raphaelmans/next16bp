import { MagicLinkForm } from "@/features/auth";

export const metadata = {
  title: "Magic Link Sign In",
  description: "Sign in with a magic link",
};

type MagicLinkPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MagicLinkPage({
  searchParams,
}: MagicLinkPageProps) {
  const queryParams = await searchParams;
  const redirect = Array.isArray(queryParams.redirect)
    ? queryParams.redirect[0]
    : queryParams.redirect;

  return <MagicLinkForm redirectParam={redirect} />;
}
