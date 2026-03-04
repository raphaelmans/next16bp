import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6">
      <div className="w-full space-y-8">
        <div className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight">
            Next.js Boilerplate with Supabase Auth
          </h1>
          <p className="text-muted-foreground">
            Auth-ready setup with email/password, magic links, Google OAuth,
            route guards, and a profile module backed by Drizzle.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href={appRoutes.login.base}>Login</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={appRoutes.register.base}>Register</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={appRoutes.dashboard.base}>Dashboard</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href={appRoutes.account.profile}>Profile</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
