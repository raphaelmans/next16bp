"use client";

import {
  Building2,
  Calendar,
  ChevronDown,
  LogOut,
  Shield,
  User,
} from "lucide-react";
import Link from "next/link";
import { appRoutes } from "@/common/app-routes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface UserDropdownUser {
  name: string;
  email: string;
  avatarUrl?: string | null;
}

interface UserDropdownProps {
  user: UserDropdownUser;
  isAdmin: boolean;
  defaultPortal?: "player" | "owner";
  ownerMenuHref?: string;
  ownerMenuLabel?: string;
  onSignOut?: () => void;
}

export function UserDropdown({
  user,
  isAdmin,
  defaultPortal = "player",
  ownerMenuHref,
  ownerMenuLabel = "Venue Dashboard",
  onSignOut,
}: UserDropdownProps) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const shouldShowOwnerShortcut =
    defaultPortal === "owner" && Boolean(ownerMenuHref);

  const handleSignOut = () => {
    // TODO: Implement real sign out with Supabase
    // await supabase.auth.signOut();
    // router.push("/");
    onSignOut?.();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 h-10 px-2 font-heading"
        >
          <Avatar className="h-8 w-8">
            {user.avatarUrl && (
              <AvatarImage src={user.avatarUrl} alt={user.name} />
            )}
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-heading font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        {/* User Info Header */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-heading font-medium leading-none">
              {user.name}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Player Links */}
        <DropdownMenuGroup>
          {shouldShowOwnerShortcut && ownerMenuHref ? (
            <DropdownMenuItem asChild>
              <Link href={ownerMenuHref} className="cursor-pointer">
                <Building2 className="mr-2 h-4 w-4" />
                <span>{ownerMenuLabel}</span>
              </Link>
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem asChild>
            <Link href={appRoutes.reservations.base} className="cursor-pointer">
              <Calendar className="mr-2 h-4 w-4" />
              <span>My Reservations</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={appRoutes.account.profile} className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href={appRoutes.admin.base} className="cursor-pointer">
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Admin Dashboard</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}

        {/* Sign Out */}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
