import { LoginForm } from "@/features/auth";

export const metadata = {
  title: "Sign In",
  description: "Sign in to your account",
};

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const queryParams = await searchParams;
  const redirect = Array.isArray(queryParams.redirect)
    ? queryParams.redirect[0]
    : queryParams.redirect;

  return <LoginForm redirectParam={redirect} />;
}
