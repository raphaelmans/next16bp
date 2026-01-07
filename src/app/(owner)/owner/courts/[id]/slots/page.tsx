"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { DashboardLayout } from "@/shared/components/layout/dashboard-layout";
import { OwnerSidebar, OwnerNavbar } from "@/features/owner";
import { CalendarNavigation } from "@/features/owner/components/calendar-navigation";
import { SlotList } from "@/features/owner/components/slot-list";
import { BulkSlotModal } from "@/features/owner/components/bulk-slot-modal";
import {
  useSlots,
  useBlockSlot,
  useUnblockSlot,
  useDeleteSlot,
  useConfirmBooking,
  useRejectBooking,
  useCreateBulkSlots,
} from "@/features/owner/hooks/use-slots";
import { useSession, useLogout } from "@/features/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ManageSlotsPage() {
  const params = useParams();
  const courtId = params.id as string;

  const { data: user } = useSession();
  const logoutMutation = useLogout();

  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [bulkModalOpen, setBulkModalOpen] = React.useState(false);
  const [actionLoadingId, setActionLoadingId] = React.useState<string>();

  const { data: slots = [], isLoading: slotsLoading } = useSlots({
    courtId,
    date: selectedDate,
  });

  const blockSlot = useBlockSlot();
  const unblockSlot = useUnblockSlot();
  const deleteSlot = useDeleteSlot();
  const confirmBooking = useConfirmBooking();
  const rejectBooking = useRejectBooking();
  const createBulkSlots = useCreateBulkSlots();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = "/login";
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

  const handleConfirmBooking = (slotId: string) => {
    setActionLoadingId(slotId);
    confirmBooking.mutate(
      { slotId },
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

  const handleRejectBooking = (slotId: string) => {
    setActionLoadingId(slotId);
    rejectBooking.mutate(
      { slotId, reason: "Rejected by owner" },
      {
        onSuccess: () => {
          toast.success("Booking rejected");
          setActionLoadingId(undefined);
        },
        onError: () => {
          toast.error("Failed to reject booking");
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

  // Mock organization and court data
  const mockOrg = { id: "1", name: "My Sports Complex" };
  const mockCourt = { id: courtId, name: "Court A" };

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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" asChild className="-ml-2">
              <Link href="/owner/courts">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Courts
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a
                href={`/courts/${courtId}`}
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
              Manage Time Slots - {mockCourt.name}
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
            actionLoadingId={actionLoadingId}
          />
        </div>
      </div>

      {/* Bulk slot creation modal */}
      <BulkSlotModal
        open={bulkModalOpen}
        onOpenChange={setBulkModalOpen}
        onSubmit={handleBulkCreate}
        isLoading={createBulkSlots.isPending}
        initialDate={selectedDate}
      />
    </DashboardLayout>
  );
}
