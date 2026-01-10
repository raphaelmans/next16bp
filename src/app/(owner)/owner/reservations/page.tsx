"use client";

import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  Search,
  XCircle,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLogout, useSession } from "@/features/auth";
import { OwnerNavbar, OwnerSidebar } from "@/features/owner";
import { ConfirmDialog } from "@/features/owner/components/confirm-dialog";
import { RejectModal } from "@/features/owner/components/reject-modal";
import { ReservationsTable } from "@/features/owner/components/reservations-table";
import { useOwnerCourts, useOwnerOrganization } from "@/features/owner/hooks";
import {
  type Reservation,
  type ReservationStatus,
  useConfirmReservation,
  useOwnerReservations,
  useRejectReservation,
  useReservationCounts,
} from "@/features/owner/hooks/use-owner-reservations";
import { cn } from "@/lib/utils";
import { DashboardLayout } from "@/shared/components/layout/dashboard-layout";

type TabValue = "pending" | "upcoming" | "past" | "cancelled";

/**
 * Format price in Philippine Peso
 */
function formatPrice(amountCents: number, currency: string = "PHP"): string {
  if (amountCents === 0) return "Free";
  const amount = amountCents / 100;
  if (currency === "PHP") {
    return `₱${amount.toLocaleString()}`;
  }
  return `${currency} ${amount.toLocaleString()}`;
}

/**
 * Empty state component
 */
function ReservationsEmptyState({ type }: { type: TabValue | "all" }) {
  const config = {
    all: {
      icon: CalendarIcon,
      title: "No reservations yet",
      description:
        "When players book your courts, reservations will appear here.",
    },
    pending: {
      icon: CheckCircle,
      title: "No pending reservations",
      description:
        "All caught up! No reservations need your attention right now.",
    },
    upcoming: {
      icon: CalendarIcon,
      title: "No upcoming reservations",
      description: "No confirmed bookings scheduled for the future.",
    },
    past: {
      icon: Clock,
      title: "No past reservations",
      description: "Completed bookings will appear here.",
    },
    cancelled: {
      icon: XCircle,
      title: "No cancelled reservations",
      description: "Cancelled or rejected bookings will appear here.",
    },
  };

  const { icon: Icon, title, description } = config[type];

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-heading font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-sm">{description}</p>
    </div>
  );
}

export default function OwnerReservationsPage() {
  const { data: user } = useSession();
  const logoutMutation = useLogout();

  // Get organization and courts from hooks
  const {
    organization,
    organizations,
    isLoading: orgLoading,
  } = useOwnerOrganization();
  const { data: courts = [] } = useOwnerCourts();

  // Filters state
  const [courtId, setCourtId] = React.useState<string>("");
  const [search, setSearch] = React.useState("");
  const [dateFrom, setDateFrom] = React.useState<Date>();
  const [dateTo, setDateTo] = React.useState<Date>();
  const [activeTab, setActiveTab] = React.useState<TabValue>("pending");

  // Dialog state
  const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false);
  const [rejectModalOpen, setRejectModalOpen] = React.useState(false);
  const [selectedReservation, setSelectedReservation] =
    React.useState<Reservation | null>(null);

  // Get status filter based on active tab
  const getStatusFilter = (tab: TabValue): ReservationStatus | "all" => {
    switch (tab) {
      case "pending":
        return "pending";
      case "cancelled":
        return "cancelled";
      default:
        return "all";
    }
  };

  const { data: reservations = [], isLoading } = useOwnerReservations(
    organization?.id ?? null,
    {
      courtId: courtId || undefined,
      status: getStatusFilter(activeTab),
      search: search || undefined,
      dateFrom,
      dateTo,
    },
  );

  const { data: counts } = useReservationCounts(organization?.id ?? null);
  const confirmMutation = useConfirmReservation();
  const rejectMutation = useRejectReservation();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = "/login";
  };

  // Filter reservations for upcoming/past tabs
  const filteredReservations = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (activeTab === "upcoming") {
      return reservations.filter((r) => {
        const reservationDate = new Date(r.date);
        return (
          reservationDate >= today &&
          (r.status === "confirmed" || r.status === "pending")
        );
      });
    }

    if (activeTab === "past") {
      return reservations.filter((r) => {
        const reservationDate = new Date(r.date);
        return reservationDate < today || r.status === "completed";
      });
    }

    return reservations;
  }, [reservations, activeTab]);

  const handleConfirmClick = (reservationId: string) => {
    const reservation = reservations.find((r) => r.id === reservationId);
    if (reservation) {
      setSelectedReservation(reservation);
      setConfirmDialogOpen(true);
    }
  };

  const handleRejectClick = (reservationId: string) => {
    const reservation = reservations.find((r) => r.id === reservationId);
    if (reservation) {
      setSelectedReservation(reservation);
      setRejectModalOpen(true);
    }
  };

  const handleConfirm = () => {
    if (!selectedReservation) return;
    confirmMutation.mutate(
      { reservationId: selectedReservation.id },
      {
        onSuccess: () => {
          toast.success("Booking confirmed successfully");
          setConfirmDialogOpen(false);
          setSelectedReservation(null);
        },
        onError: () => {
          toast.error("Failed to confirm booking");
        },
      },
    );
  };

  const handleReject = (reason: string) => {
    if (!selectedReservation) return;
    rejectMutation.mutate(
      { reservationId: selectedReservation.id, reason },
      {
        onSuccess: () => {
          toast.success("Booking rejected");
          setRejectModalOpen(false);
          setSelectedReservation(null);
        },
        onError: () => {
          toast.error("Failed to reject booking");
        },
      },
    );
  };

  // Show loading state while organization loads
  if (orgLoading) {
    return (
      <DashboardLayout
        sidebar={
          <OwnerSidebar
            currentOrganization={{ id: "", name: "Loading..." }}
            organizations={[]}
            user={{
              name: user?.email?.split("@")[0],
              email: user?.email,
            }}
          />
        }
        navbar={
          <OwnerNavbar
            organizationName="Loading..."
            user={{
              name: user?.email?.split("@")[0],
              email: user?.email,
            }}
            onLogout={handleLogout}
          />
        }
      >
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      sidebar={
        <OwnerSidebar
          currentOrganization={
            organization ?? { id: "", name: "No Organization" }
          }
          organizations={organizations}
          user={{
            name: user?.email?.split("@")[0],
            email: user?.email,
          }}
        />
      }
      navbar={
        <OwnerNavbar
          organizationName={organization?.name ?? "No Organization"}
          user={{
            name: user?.email?.split("@")[0],
            email: user?.email,
          }}
          onLogout={handleLogout}
        />
      }
    >
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-heading">
            Reservations
          </h1>
          <p className="text-muted-foreground">
            Manage bookings for your courts
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Select
            value={courtId}
            onValueChange={(value) => setCourtId(value === "all" ? "" : value)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Courts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courts</SelectItem>
              {courts.map((court) => (
                <SelectItem key={court.id} value={court.id}>
                  {court.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !dateFrom && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "MMM d") : "From"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !dateTo && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "MMM d") : "To"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  disabled={(date) => (dateFrom ? date < dateFrom : false)}
                />
              </PopoverContent>
            </Popover>

            {(dateFrom || dateTo) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDateFrom(undefined);
                  setDateTo(undefined);
                }}
              >
                Clear
              </Button>
            )}
          </div>

          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search player name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as TabValue)}
        >
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              Pending Action
              {counts?.pending ? (
                <Badge variant="secondary" className="ml-1">
                  {counts.pending}
                </Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : filteredReservations.length === 0 ? (
              <ReservationsEmptyState type={activeTab} />
            ) : (
              <ReservationsTable
                reservations={filteredReservations}
                onConfirm={handleConfirmClick}
                onReject={handleRejectClick}
                isLoading={
                  confirmMutation.isPending || rejectMutation.isPending
                }
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={handleConfirm}
        isLoading={confirmMutation.isPending}
        playerName={selectedReservation?.playerName}
        courtName={selectedReservation?.courtName}
        dateTime={
          selectedReservation
            ? `${format(new Date(selectedReservation.date), "MMM d, yyyy")} at ${selectedReservation.startTime} - ${selectedReservation.endTime} for ${formatPrice(selectedReservation.amountCents, selectedReservation.currency)}`
            : undefined
        }
      />

      {/* Reject Modal */}
      <RejectModal
        open={rejectModalOpen}
        onOpenChange={setRejectModalOpen}
        onReject={handleReject}
        isLoading={rejectMutation.isPending}
        playerName={selectedReservation?.playerName}
        courtName={selectedReservation?.courtName}
      />
    </DashboardLayout>
  );
}
