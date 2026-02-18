import { Suspense } from "react";
import { RegisterWithRoleChooser } from "@/features/auth";

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

  return (
    <Suspense fallback={<RegisterFormSkeleton />}>
      <RegisterWithRoleChooser redirectParam={redirect} />
    </Suspense>
  );
}

function RegisterFormSkeleton() {
  return (
    <div className="w-full max-w-md">
      <div className="bg-card border rounded-lg p-6 space-y-4">
        <div className="h-6 w-32 bg-muted rounded animate-pulse" />
        <div className="h-4 w-56 bg-muted rounded animate-pulse" />
        <div className="space-y-4 pt-4">
          <div className="h-10 bg-muted rounded animate-pulse" />
          <div className="h-10 bg-muted rounded animate-pulse" />
          <div className="h-10 bg-muted rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
