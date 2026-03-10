import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { KudosLogo } from "@/components/kudos";
import { Button } from "@/components/ui/button";
import { HomeNavbarAuthActionsLoader } from "./home-navbar-auth-actions-loader";

export function HomeNavbar() {
  return (
    <nav className="fixed top-[max(1rem,env(safe-area-inset-top))] left-4 right-4 z-50 rounded-xl border border-border/60 bg-background/95 px-4 shadow-md backdrop-blur-md">
      <div className="flex min-h-16 items-center gap-3">
        <Link href={appRoutes.index.base} className="flex items-center gap-2">
          <KudosLogo size={36} variant="full" />
        </Link>

        <form
          action={appRoutes.courts.base}
          method="GET"
          className="hidden md:flex flex-1 max-w-md mx-6 items-center gap-2"
        >
          <input
            name="q"
            type="text"
            placeholder="Search courts..."
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
          <Button type="submit" size="sm" className="h-10 rounded-lg px-4">
            Search
          </Button>
        </form>

        <div className="ml-auto hidden md:flex items-center gap-3">
          <HomeNavbarAuthActionsLoader variant="desktop" />
        </div>

        <div className="ml-auto flex md:hidden items-center gap-2">
          <HomeNavbarAuthActionsLoader variant="mobile" />
        </div>
      </div>
    </nav>
  );
}
