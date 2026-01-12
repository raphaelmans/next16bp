"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLogout, useSession } from "@/features/auth";
import { OwnerNavbar, OwnerSidebar } from "@/features/owner";
import { ReservationAlertsPanel } from "@/features/owner/components";
import { BulkSlotModal } from "@/features/owner/components/bulk-slot-modal";
import { CalendarNavigation } from "@/features/owner/components/calendar-navigation";
import { RejectModal } from "@/features/owner/components/reject-modal";
import { SlotList } from "@/features/owner/components/slot-list";
import {
  useBlockSlot,
  useConfirmBooking,
  useCreateBulkSlots,
  useDeleteSlot,
  useRejectBooking,
  useSlots,
  useUnblockSlot,
} from "@/features/owner/hooks/use-slots";
import { AppShell } from "@/shared/components/layout";
import { appRoutes } from "@/shared/lib/app-routes";
import { useTRPC } from "@/trpc/client";

export default function ManageSlotsPage() {
  const params = useParams();
  const courtId = (params.courtId ?? params.id) as string;

  const { data: user } = useSession();
  const logoutMutation = useLogout();
  const trpc = useTRPC();

  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [bulkModalOpen, setBulkModalOpen] = React.useState(false);
  const [actionLoadingId, setActionLoadingId] = React.useState<string>();
  const [rejectModalOpen, setRejectModalOpen] = React.useState(false);
  const [rejectContext, setRejectContext] = React.useState<{
    reservationId: string;
    mode: "reject" | "cancel";
    playerName?: string | null;
  } | null>(null);

  // Fetch court data
  const { data: courtData, isLoading: courtLoading } = useQuery({
    ...trpc.courtManagement.getById.queryOptions({ courtId }),
    enabled: !!courtId,
  });

  // Fetch organization (for sidebar)
  const { data: organization } = useQuery({
    ...trpc.organization.my.queryOptions(),
  });

  const { data: slots = [], isLoading: slotsLoading } = useSlots({
    courtId,
    date: selectedDate,
  });

  const blockSlot = useBlockSlot();
  const unblockSlot = useUnblockSlot();
  const deleteSlot = useDeleteSlot();
  const confirmBooking = useConfirmBooking();
  const rejectBooking = useRejectBooking();
  const createBulkSlots = useCreateBulkSlots(courtId);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(
      appRoutes.owner.courts.slots(courtId),
    );
  };

  const handleBlockSlot = (slotId: string) => {
    setActionLoadingId(slotId);
    blockSlot.mutate(
      { slotId },
      {
        onSuccess: () => {
          toast.success("Slot blocked successfully");
          setActionLoadingId(undefined);
        },
        onError: () => {
          toast.error("Failed to block slot");
          setActionLoadingId(undefined);
        },
      },
    );
  };

  const handleUnblockSlot = (slotId: string) => {
    setActionLoadingId(slotId);
    unblockSlot.mutate(
      { slotId },
      {
        onSuccess: () => {
          toast.success("Slot unblocked successfully");
          setActionLoadingId(undefined);
        },
        onError: () => {
          toast.error("Failed to unblock slot");
          setActionLoadingId(undefined);
        },
      },
    );
  };

  const handleDeleteSlot = (slotId: string) => {
    setActionLoadingId(slotId);
    deleteSlot.mutate(
      { slotId },
      {
        onSuccess: () => {
          toast.success("Slot deleted successfully");
          setActionLoadingId(undefined);
        },
        onError: () => {
          toast.error("Failed to delete slot");
          setActionLoadingId(undefined);
        },
      },
    );
  };

  const openRejectModal = (
    reservationId: string,
    mode: "reject" | "cancel",
  ) => {
    const targetSlot = slots.find(
      (slot) => slot.reservationId === reservationId,
    );
    setRejectContext({
      reservationId,
      mode,
      playerName: targetSlot?.playerName ?? undefined,
    });
    setRejectModalOpen(true);
  };

  const handleConfirmBooking = (reservationId: string) => {
    setActionLoadingId(reservationId);
    confirmBooking.mutate(
      { reservationId },
      {
        onSuccess: () => {
          toast.success("Booking confirmed successfully");
          setActionLoadingId(undefined);
        },
        onError: () => {
          toast.error("Failed to confirm booking");
          setActionLoadingId(undefined);
        },
      },
    );
  };

  const handleRejectBooking = (reservationId: string) => {
    openRejectModal(reservationId, "reject");
  };

  const handleCancelBooking = (reservationId: string) => {
    openRejectModal(reservationId, "cancel");
  };

  const handleRejectSubmit = (reason: string) => {
    if (!rejectContext) return;
    setActionLoadingId(rejectContext.reservationId);
    rejectBooking.mutate(
      { reservationId: rejectContext.reservationId, reason },
      {
        onSuccess: () => {
          toast.success(
            rejectContext.mode === "cancel"
              ? "Reservation cancelled"
              : "Booking rejected",
          );
          setActionLoadingId(undefined);
          setRejectModalOpen(false);
          setRejectContext(null);
        },
        onError: () => {
          toast.error("Failed to update reservation");
          setActionLoadingId(undefined);
        },
      },
    );
  };

  const handleBulkCreate = (
    data: Parameters<typeof createBulkSlots.mutate>[0],
  ) => {
    createBulkSlots.mutate(data, {
      onSuccess: (result) => {
        toast.success(`Created ${result.slotsCreated} slots successfully`);
        setBulkModalOpen(false);
      },
      onError: () => {
        toast.error("Failed to create slots");
      },
    });
  };

  // Real organization and court data
  const currentOrg = organization?.[0];
  const orgDisplay = currentOrg
    ? { id: currentOrg.id, name: currentOrg.name }
    : undefined;
  const courtName = courtData?.court.label ?? "Loading...";
  const publicPlaceHref = courtData
    ? appRoutes.places.detail(courtData.court.placeId)
    : appRoutes.places.base;
  const defaultPriceCents = 0;

  // Generate mock dates with slots for calendar indicators
  const datesWithSlots = React.useMemo(() => {
    const dates: Date[] = [];
    const today = new Date();
    for (let i = 0; i < 20; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      if (Math.random() > 0.3) {
        dates.push(date);
      }
    }
    return dates;
  }, []);

  // Show loading state while court is loading
  if (courtLoading) {
    return (
      <AppShell
        sidebar={
          <OwnerSidebar
            currentOrganization={orgDisplay}
            organizations={orgDisplay ? [orgDisplay] : []}
            user={{
              name: user?.email?.split("@")[0],
              email: user?.email,
            }}
          />
        }
        navbar={
          <OwnerNavbar
            organizationName={orgDisplay?.name ?? ""}
            user={{
              name: user?.email?.split("@")[0],
              email: user?.email,
            }}
            onLogout={handleLogout}
          />
        }
        floatingPanel={
          <ReservationAlertsPanel organizationId={orgDisplay?.id ?? null} />
        }
      >
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading court...</p>
        </div>
      </AppShell>
    );
  }

  // Show error state if court not found
  if (!courtData && !courtLoading) {
    return (
      <AppShell
        sidebar={
          <OwnerSidebar
            currentOrganization={orgDisplay}
            organizations={orgDisplay ? [orgDisplay] : []}
            user={{
              name: user?.email?.split("@")[0],
              email: user?.email,
            }}
          />
        }
        navbar={
          <OwnerNavbar
            organizationName={orgDisplay?.name ?? ""}
            user={{
              name: user?.email?.split("@")[0],
              email: user?.email,
            }}
            onLogout={handleLogout}
          />
        }
        floatingPanel={
          <ReservationAlertsPanel organizationId={orgDisplay?.id ?? null} />
        }
      >
        <div className="text-center py-12">
          <p className="text-muted-foreground">Court not found</p>
          <Button asChild className="mt-4">
            <Link href={appRoutes.owner.courts.base}>Back to Courts</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      sidebar={
        <OwnerSidebar
          currentOrganization={orgDisplay}
          organizations={orgDisplay ? [orgDisplay] : []}
          user={{
            name: user?.email?.split("@")[0],
            email: user?.email,
          }}
        />
      }
      navbar={
        <OwnerNavbar
          organizationName={orgDisplay?.name ?? ""}
          user={{
            name: user?.email?.split("@")[0],
            email: user?.email,
          }}
          onLogout={handleLogout}
        />
      }
      floatingPanel={
        <ReservationAlertsPanel organizationId={orgDisplay?.id ?? null} />
      }
    >
      <div className="space-y-6">
        {/* Page header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" asChild className="-ml-2">
              <Link href={appRoutes.owner.courts.base}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Courts
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a
                href={publicPlaceHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Public Page
              </a>
            </Button>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-heading">
              Manage Time Slots - {courtName}
            </h1>
            <p className="text-muted-foreground">
              Create and manage time slots for your court
            </p>
          </div>
        </div>

        {/* Main content - two column layout on desktop */}
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* Calendar sidebar */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <CalendarNavigation
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              datesWithSlots={datesWithSlots}
            />
          </div>

          {/* Slots list */}
          <div className="space-y-6">
            <SlotList
              date={selectedDate}
              slots={slots}
              isLoading={slotsLoading}
              onAddSlot={() => setBulkModalOpen(true)}
              onBlockSlot={handleBlockSlot}
              onUnblockSlot={handleUnblockSlot}
              onDeleteSlot={handleDeleteSlot}
              onConfirmBooking={handleConfirmBooking}
              onRejectBooking={handleRejectBooking}
              onCancelBooking={handleCancelBooking}
              actionLoadingId={actionLoadingId}
            />
          </div>
        </div>
      </div>

      {/* Bulk slot creation modal */}
      <BulkSlotModal
        open={bulkModalOpen}
        onOpenChange={setBulkModalOpen}
        onSubmit={handleBulkCreate}
        isLoading={createBulkSlots.isPending}
        defaultPrice={defaultPriceCents}
        initialDate={selectedDate}
      />

      <RejectModal
        open={rejectModalOpen}
        onOpenChange={setRejectModalOpen}
        onReject={handleRejectSubmit}
        isLoading={rejectBooking.isPending}
        title={
          rejectContext?.mode === "cancel"
            ? "Cancel Reservation"
            : "Reject Reservation"
        }
        description={
          rejectContext?.mode === "cancel"
            ? "Provide a reason for cancelling this reservation."
            : undefined
        }
        playerName={rejectContext?.playerName ?? undefined}
        reasonLabel={
          rejectContext?.mode === "cancel"
            ? "Reason for cancellation"
            : undefined
        }
        submitLabel={
          rejectContext?.mode === "cancel"
            ? "Cancel Reservation"
            : "Reject Reservation"
        }
      />
    </AppShell>
  );
}
