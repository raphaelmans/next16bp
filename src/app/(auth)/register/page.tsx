import { RegisterForm } from "@/features/auth";

export const metadata = {
  title: "Create Account",
  description: "Create a new account",
};

type RegisterPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const queryParams = await searchParams;
  const redirect = Array.isArray(queryParams.redirect)
    ? queryParams.redirect[0]
    : queryParams.redirect;

  return <RegisterForm redirectParam={redirect} />;
}
