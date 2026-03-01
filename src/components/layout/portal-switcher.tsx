"use client";

import { Building2, ChevronDown, Home, Shield } from "lucide-react";
import { KudosLogo } from "@/components/kudos";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type Portal = "player" | "organization" | "admin";

type PortalSwitcherProps = {
  variant: "sidebar" | "menu-items";
  currentPortal: Portal;
  portalOptions: Portal[];
  organizationSetupRequired?: boolean;
  onSwitchPortal: (portal: Portal) => void;
  className?: string;
};

const portalConfig = {
  player: {
    label: "Player View",
    icon: Home,
  },
  organization: {
    label: "Organization View",
    icon: Building2,
  },
  admin: {
    label: "Admin View",
    icon: Shield,
  },
} as const;

export function PortalSwitcher({
  variant,
  currentPortal,
  portalOptions,
  organizationSetupRequired = false,
  onSwitchPortal,
  className,
}: PortalSwitcherProps) {
  if (variant === "menu-items") {
    return (
      <>
        {portalOptions.map((portal) => {
          const option = portalConfig[portal];
          const Icon = option.icon;

          return (
            <DropdownMenuItem
              key={portal}
              onSelect={() => onSwitchPortal(portal)}
              className={
                portal === currentPortal
                  ? "bg-accent text-accent-foreground [&_svg:not([class*='text-'])]:text-accent-foreground"
                  : ""
              }
            >
              <Icon className="mr-2 h-4 w-4" />
              <span>{option.label}</span>
              {portal === "organization" && organizationSetupRequired && (
                <span className="ml-auto text-[11px] text-muted-foreground">
                  Setup
                </span>
              )}
            </DropdownMenuItem>
          );
        })}
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`flex w-full items-center gap-2 rounded-md p-2 text-left hover:bg-sidebar-accent ${className ?? ""}`.trim()}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <KudosLogo size={18} variant="icon" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-heading font-semibold truncate">
              {currentPortal === "organization" && organizationSetupRequired
                ? "Venue Setup"
                : portalConfig[currentPortal].label}
            </p>
            <p className="text-xs text-muted-foreground">KudosCourts</p>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {portalOptions.map((portal) => {
          const option = portalConfig[portal];
          const Icon = option.icon;

          return (
            <DropdownMenuItem
              key={portal}
              onSelect={() => onSwitchPortal(portal)}
              className={
                portal === currentPortal
                  ? "bg-sidebar-accent text-sidebar-accent-foreground [&_svg:not([class*='text-'])]:text-sidebar-accent-foreground"
                  : ""
              }
            >
              <Icon className="h-4 w-4" />
              <span>{option.label}</span>
              {portal === "organization" && organizationSetupRequired && (
                <span className="ml-auto text-[11px] text-muted-foreground">
                  Setup
                </span>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
