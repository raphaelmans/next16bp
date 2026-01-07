"use client";

import Link from "next/link";
import {
  LogOut,
  User,
  Settings,
  ChevronDown,
  ArrowLeft,
  CalendarDays,
  Shield,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

interface OwnerNavbarProps {
  organizationName?: string;
  user?: {
    name?: string;
    email?: string;
    avatarUrl?: string;
  };
  onLogout?: () => void;
  // TODO: Replace with actual role check when auth is implemented
  isAdmin?: boolean;
}

export function OwnerNavbar({
  organizationName,
  user,
  onLogout,
  // For development, always show Admin Dashboard link
  isAdmin = true,
}: OwnerNavbarProps) {
  return (
    <div className="flex flex-1 items-center justify-between">
      {/* Left side - Logo and Organization name */}
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80">
          <KudosLogo size={28} variant="icon" />
        </Link>
        {organizationName && (
          <span className="text-sm font-medium text-muted-foreground hidden sm:inline">
            {organizationName}
          </span>
        )}
      </div>

      {/* Right side - User menu */}
      <div className="flex items-center gap-2">
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 gap-2 px-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage
                    src={user.avatarUrl}
                    alt={user.name || user.email}
                  />
                  <AvatarFallback className="text-xs">
                    {user.name?.charAt(0).toUpperCase() ||
                      user.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium md:inline-block">
                  {user.name || user.email}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  {user.name && (
                    <p className="text-sm font-medium leading-none">
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
                <Link href="/courts">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Player View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/reservations">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  My Reservations
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {/* TODO: Show conditionally based on user role being admin */}
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link href="/admin">
                    <Shield className="mr-2 h-4 w-4" />
                    Admin Dashboard
                  </Link>
                </DropdownMenuItem>
              )}
              {isAdmin && <DropdownMenuSeparator />}
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/owner/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onLogout}
                className="text-destructive focus:text-destructive"
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
