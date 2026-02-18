import { Suspense } from "react";
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
  const authError = Array.isArray(queryParams.auth_error)
    ? queryParams.auth_error[0]
    : queryParams.auth_error;

  return (
    <Suspense fallback={<LoginFormSkeleton />}>
      <LoginForm redirectParam={redirect} authErrorParam={authError} />
    </Suspense>
  );
}

function LoginFormSkeleton() {
  return (
    <div className="w-full max-w-md">
      <div className="bg-card border rounded-lg p-6 space-y-4">
        <div className="h-6 w-24 bg-muted rounded animate-pulse" />
        <div className="h-4 w-48 bg-muted rounded animate-pulse" />
        <div className="space-y-4 pt-4">
          <div className="h-10 bg-muted rounded animate-pulse" />
          <div className="h-10 bg-muted rounded animate-pulse" />
          <div className="h-10 bg-muted rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
