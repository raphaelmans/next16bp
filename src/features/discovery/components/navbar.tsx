"use client";

import {
  Building,
  Calendar,
  LogOut,
  Menu,
  Search,
  Shield,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { appRoutes } from "@/common/app-routes";
import { trackEvent } from "@/common/clients/telemetry-client";
import { URLQueryBuilder } from "@/common/url-query-builder";
import { KudosLogo } from "@/components/kudos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  useMutAuthLogout,
  useQueryAuthMyOrganizations,
  useQueryAuthSession,
} from "@/features/auth/hooks";
import { cn } from "@/lib/utils";
import { UserDropdown } from "./user-dropdown";

interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  const router = useRouter();
  const [queryParam] = useQueryState("q", parseAsString);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(queryParam ?? "");

  useEffect(() => {
    setSearchQuery(queryParam ?? "");
  }, [queryParam]);

  const { data: sessionUser, isLoading: sessionLoading } =
    useQueryAuthSession();
  const { mutate: logout } = useMutAuthLogout();

  const { data: orgs } = useQueryAuthMyOrganizations(!!sessionUser);

  const isAuthenticated = !!sessionUser;
  const isResolvingSession = sessionLoading && !sessionUser;

  const user = sessionUser
    ? {
        name: sessionUser.email?.split("@")[0] || "User",
        email: sessionUser.email || "",
        avatarUrl: null,
      }
    : {
        name: "",
        email: "",
        avatarUrl: null,
      };

  const isOwner = (orgs?.length ?? 0) > 0;
  const isAdmin = sessionUser?.role === "admin";
  const ownerSetupRequired = !isOwner;
  const canAccessOwner = isOwner || ownerSetupRequired;

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const query = searchQuery.trim();
    trackEvent({
      event: "funnel.landing_search_submitted",
      properties: { query: query || undefined },
    });
    const search = new URLQueryBuilder().addParams({ q: query }).build();
    const destination = search
      ? `${appRoutes.courts.base}?${search}`
      : appRoutes.courts.base;

    router.push(destination);
    setIsOpen(false);
  };

  const handleSignOut = () => {
    logout(undefined, {
      onSuccess: () => {
        router.push(appRoutes.index.base);
        setIsOpen(false);
      },
    });
  };

  const handleListYourPlace = () => {
    trackEvent({
      event: "funnel.owner_list_your_venue_nav_clicked",
      properties: {
        authenticated: isAuthenticated,
        owner: isOwner,
      },
    });

    if (!isAuthenticated) {
      router.push(appRoutes.ownersGetStarted.base);
      return;
    }

    if (isOwner) {
      router.push(appRoutes.owner.places.new);
      return;
    }

    router.push(appRoutes.owner.getStarted);
  };

  return (
    <nav
      className={cn(
        "fixed top-4 left-4 right-4 z-50",
        "bg-background/95 backdrop-blur-md",
        "border border-border/60 rounded-xl",
        "h-16 px-4",
        "flex items-center justify-between",
        "shadow-md",
        className,
      )}
    >
      {/* Logo */}
      <Link href={appRoutes.index.base} className="flex items-center gap-2">
        <KudosLogo size={36} variant="full" />
      </Link>

      {/* Desktop Search */}
      <form
        action={appRoutes.courts.base}
        method="GET"
        onSubmit={handleSearch}
        className="hidden md:flex flex-1 max-w-md mx-8"
      >
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            name="q"
            type="search"
            placeholder="Search courts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 rounded-lg"
          />
        </div>
      </form>

      {/* Desktop Actions */}
      <div className="hidden md:flex items-center gap-3">
        <Button
          variant="ghost"
          onClick={handleListYourPlace}
          className="font-heading text-accent"
        >
          List Your Venue
        </Button>

        {isResolvingSession ? (
          <Button variant="outline" className="font-heading" disabled>
            Loading...
          </Button>
        ) : isAuthenticated ? (
          <UserDropdown
            user={user}
            isAdmin={isAdmin}
            onSignOut={handleSignOut}
          />
        ) : (
          <Button variant="outline" asChild className="font-heading">
            <Link href={appRoutes.login.base}>
              <User className="h-4 w-4 mr-2" />
              Sign In
            </Link>
          </Button>
        )}
      </div>

      {/* Mobile Menu */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open menu"
            className="md:hidden"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="w-[320px] sm:w-[360px] overflow-y-auto"
        >
          <div className="flex flex-col gap-4 mt-8 pb-8">
            {/* Mobile Search */}
            <form
              action={appRoutes.courts.base}
              method="GET"
              onSubmit={handleSearch}
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  name="q"
                  type="search"
                  placeholder="Search courts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </form>

            <Separator />

            {/* User Info (when authenticated) */}
            {isAuthenticated && (
              <>
                <div className="flex items-center gap-3 py-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-medium text-sm">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Mobile Navigation Links */}
            <Link
              href={appRoutes.index.base}
              className="py-2 text-lg font-heading font-semibold"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link
              href={appRoutes.courts.base}
              className="py-2 text-lg font-heading font-semibold"
              onClick={() => setIsOpen(false)}
            >
              Browse Courts
            </Link>

            {/* Authenticated User Links */}
            {isAuthenticated && (
              <>
                <Separator />
                <Link
                  href={appRoutes.reservations.base}
                  className="py-2 text-lg font-heading font-semibold flex items-center gap-2"
                  onClick={() => setIsOpen(false)}
                >
                  <Calendar className="h-5 w-5" />
                  My Reservations
                </Link>
                <Link
                  href={appRoutes.account.profile}
                  className="py-2 text-lg font-heading font-semibold flex items-center gap-2"
                  onClick={() => setIsOpen(false)}
                >
                  <User className="h-5 w-5" />
                  Profile
                </Link>
              </>
            )}

            {/* Dashboard Links */}
            {isAuthenticated && (canAccessOwner || isAdmin) && (
              <>
                <Separator />
                {canAccessOwner && (
                  <Link
                    href={
                      ownerSetupRequired
                        ? appRoutes.owner.getStarted
                        : appRoutes.owner.base
                    }
                    className="py-2 text-lg font-heading font-semibold flex items-center gap-2"
                    onClick={() => setIsOpen(false)}
                  >
                    <Building className="h-5 w-5" />
                    {ownerSetupRequired ? "Venue Setup" : "Venue Dashboard"}
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    href={appRoutes.admin.base}
                    className="py-2 text-lg font-heading font-semibold flex items-center gap-2"
                    onClick={() => setIsOpen(false)}
                  >
                    <Shield className="h-5 w-5" />
                    Admin Dashboard
                  </Link>
                )}
              </>
            )}

            <Separator />

            {/* List Your Venue */}
            <button
              type="button"
              onClick={() => {
                handleListYourPlace();
                setIsOpen(false);
              }}
              className="py-2 text-lg font-heading font-semibold text-accent hover:text-accent/80 text-left"
            >
              List Your Venue
            </button>

            <Separator />

            {/* Auth Actions */}
            {isResolvingSession ? (
              <Button variant="outline" className="w-full" disabled>
                Loading...
              </Button>
            ) : isAuthenticated ? (
              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            ) : (
              <>
                <Button asChild className="w-full font-heading">
                  <Link
                    href={appRoutes.login.base}
                    onClick={() => setIsOpen(false)}
                  >
                    Sign In
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="w-full font-heading"
                >
                  <Link
                    href={appRoutes.register.base}
                    onClick={() => setIsOpen(false)}
                  >
                    Create Account
                  </Link>
                </Button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
