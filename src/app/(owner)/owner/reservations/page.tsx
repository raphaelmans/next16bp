"use client";

import * as React from "react";
import { Search, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DashboardLayout } from "@/shared/components/layout/dashboard-layout";
import { OwnerSidebar, OwnerNavbar } from "@/features/owner";
import { ReservationsTable } from "@/features/owner/components/reservations-table";
import { ConfirmDialog } from "@/features/owner/components/confirm-dialog";
import { RejectModal } from "@/features/owner/components/reject-modal";
import {
  useOwnerReservations,
  useConfirmReservation,
  useRejectReservation,
  useReservationCounts,
  type ReservationStatus,
  type Reservation,
} from "@/features/owner/hooks/use-owner-reservations";
import { useSession, useLogout } from "@/features/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type TabValue = "pending" | "upcoming" | "past" | "cancelled";

export default function OwnerReservationsPage() {
  const { data: user } = useSession();
  const logoutMutation = useLogout();

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

  const { data: reservations = [], isLoading } = useOwnerReservations({
    courtId: courtId || undefined,
    status: getStatusFilter(activeTab),
    search: search || undefined,
    dateFrom,
    dateTo,
  });

  const { data: counts } = useReservationCounts();
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

  // Mock data
  const mockOrg = { id: "1", name: "My Sports Complex" };
  const mockCourts = [
    { id: "court-1", name: "Court A" },
    { id: "court-2", name: "Court B" },
    { id: "court-3", name: "Court C" },
  ];

  return (
    <DashboardLayout
      sidebar={
        <OwnerSidebar
          currentOrganization={mockOrg}
          organizations={[mockOrg]}
          user={{
            name: user?.email?.split("@")[0],
            email: user?.email,
          }}
        />
      }
      navbar={
        <OwnerNavbar
          organizationName={mockOrg.name}
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
          <Select value={courtId} onValueChange={setCourtId}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Courts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courts</SelectItem>
              {mockCourts.map((court) => (
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
              <div className="text-center py-12">
                <p className="text-muted-foreground">No reservations found</p>
              </div>
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
            ? `${format(new Date(selectedReservation.date), "MMM d, yyyy")} at ${selectedReservation.startTime}`
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
