"use client";

import {
  Ban,
  CalendarDays,
  Clipboard,
  Clock,
  ExternalLink,
  MoreHorizontal,
  Pencil,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { appRoutes } from "@/shared/lib/app-routes";
import type { OwnerCourt } from "../hooks/use-owner-courts";

interface CourtsTableProps {
  courts: OwnerCourt[];
  onDeactivate?: (courtId: string) => void;
}

const statusBadgeVariant: Record<
  OwnerCourt["status"],
  "default" | "secondary" | "destructive"
> = {
  active: "default",
  inactive: "destructive",
};

export function CourtsTable({ courts, onDeactivate }: CourtsTableProps) {
  const router = useRouter();

  const handleRowClick = (courtId: string, placeId: string) => {
    router.push(
      appRoutes.owner.places.courts.setup(placeId, courtId, "details"),
    );
  };

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Open Slots</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {courts.map((court) => (
              <TableRow
                key={court.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleRowClick(court.id, court.placeId)}
              >
                <TableCell>
                  <div className="relative h-12 w-12 overflow-hidden rounded-md bg-muted">
                    {court.coverImageUrl ? (
                      <Image
                        src={court.coverImageUrl}
                        alt={court.label}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground text-[10px]">
                        No img
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{court.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {court.sportName}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {court.placeName} · {court.city}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={statusBadgeVariant[court.status]}
                    className="capitalize"
                  >
                    {court.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {court.openSlots}/{court.totalSlots}
                </TableCell>
                <TableCell
                  onClick={(event) => event.stopPropagation()}
                  onPointerDown={(event) => event.stopPropagation()}
                >
                  <CourtActionsDropdown
                    court={court}
                    onDeactivate={onDeactivate}
                    onContainerClick={(event) => event.stopPropagation()}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {courts.map((court) => (
          <Card
            key={court.id}
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => handleRowClick(court.id, court.placeId)}
          >
            <CardContent className="p-4">
              <div className="flex gap-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                  {court.coverImageUrl ? (
                    <Image
                      src={court.coverImageUrl}
                      alt={court.label}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground text-xs">
                      No img
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium truncate">{court.label}</h3>
                      <p className="text-sm text-muted-foreground">
                        {court.placeName} · {court.city}
                      </p>
                    </div>
                    {/* biome-ignore lint/a11y/useKeyWithClickEvents: wrapper only stops propagation */}
                    {/* biome-ignore lint/a11y/noStaticElementInteractions: wrapper only stops propagation */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <CourtActionsDropdown
                        court={court}
                        onDeactivate={onDeactivate}
                        onContainerClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge
                      variant={statusBadgeVariant[court.status]}
                      className="capitalize"
                    >
                      {court.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {court.openSlots}/{court.totalSlots} slots
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

interface CourtActionsDropdownProps {
  court: OwnerCourt;
  onDeactivate?: (courtId: string) => void;
  onContainerClick?: (e: React.MouseEvent) => void;
}

function CourtActionsDropdown({
  court,
  onDeactivate,
  onContainerClick,
}: CourtActionsDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onContainerClick}
          onPointerDown={onContainerClick}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link
            href={appRoutes.owner.places.courts.setup(
              court.placeId,
              court.id,
              "details",
            )}
          >
            <Clipboard className="mr-2 h-4 w-4" />
            Setup Wizard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href={appRoutes.owner.places.courts.edit(court.placeId, court.id)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit Details
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link
            href={appRoutes.owner.places.courts.setup(
              court.placeId,
              court.id,
              "schedule",
            )}
          >
            <Clock className="mr-2 h-4 w-4" />
            Schedule & Pricing
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href={appRoutes.owner.places.courts.availability(
              court.placeId,
              court.id,
            )}
          >
            <Clock className="mr-2 h-4 w-4" />
            Availability
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href={`${appRoutes.owner.reservations}?placeId=${court.placeId}&courtId=${court.id}`}
          >
            <CalendarDays className="mr-2 h-4 w-4" />
            View Bookings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href={appRoutes.places.detail(court.placeSlug ?? court.placeId)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            View Public Page
          </a>
        </DropdownMenuItem>

        {court.status === "active" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDeactivate?.(court.id)}
              className="text-destructive focus:text-destructive"
            >
              <Ban className="mr-2 h-4 w-4" />
              Deactivate
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
