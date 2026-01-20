"use client";

import {
  ArrowLeft,
  Building2,
  CalendarDays,
  ChevronDown,
  LogOut,
  ShieldCheck,
  User,
} from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { KudosLogo } from "@/shared/components/kudos";
import { appRoutes } from "@/shared/lib/app-routes";

interface AdminNavbarProps {
  user?: {
    name?: string;
    email?: string;
    avatarUrl?: string;
  };
  onLogout?: () => void;
  isOwner?: boolean;
}

export function AdminNavbar({ user, onLogout, isOwner }: AdminNavbarProps) {
  return (
    <div className="flex flex-1 items-center justify-between">
      {/* Left side - Logo and Admin badge */}
      <div className="flex items-center gap-4">
        <Link
          href={appRoutes.home.base}
          className="flex items-center gap-2 hover:opacity-80"
        >
          <KudosLogo size={28} variant="icon" />
        </Link>
        <Badge
          variant="outline"
          className="bg-primary/10 text-primary border-primary/20 hidden sm:inline-flex font-heading"
        >
          Admin Dashboard
        </Badge>
      </div>

      {/* Right side - User menu */}
      <div className="flex items-center gap-2">
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-8 gap-2 px-2 font-heading"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage
                    src={user.avatarUrl}
                    alt={user.name || user.email}
                  />
                  <AvatarFallback className="text-xs">
                    {user.name?.charAt(0)?.toUpperCase() ||
                      user.email?.charAt(0)?.toUpperCase() ||
                      "A"}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium md:inline-block">
                  {user.name || user.email}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  {user.name && (
                    <p className="text-sm font-heading font-medium leading-none">
                      {user.name}
                    </p>
                  )}
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={appRoutes.courts.base}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Player View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={appRoutes.reservations.base}>
                  <CalendarDays className="mr-2 h-4 w-4" />
                  My Reservations
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={appRoutes.admin.placeVerification.base}>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Verification Queue
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {/* TODO: Show conditionally based on user having an organization */}
              {isOwner && (
                <DropdownMenuItem asChild>
                  <Link href={appRoutes.owner.base}>
                    <Building2 className="mr-2 h-4 w-4" />
                    Owner Dashboard
                  </Link>
                </DropdownMenuItem>
              )}
              {isOwner && <DropdownMenuSeparator />}
              <DropdownMenuItem asChild>
                <Link href={appRoutes.account.profile}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={onLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
