"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLogout, useSession } from "@/features/auth";
import { OwnerNavbar, OwnerSidebar } from "@/features/owner";
import { ReservationAlertsPanel } from "@/features/owner/components";
import {
  useCourtHours,
  useOwnerOrganization,
  useSaveCourtHours,
} from "@/features/owner/hooks";
import { AppShell } from "@/shared/components/layout";
import { appRoutes } from "@/shared/lib/app-routes";
import { useTRPC } from "@/trpc/client";

const DAY_OPTIONS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const getDayLabel = (dayOfWeek: number) =>
  DAY_OPTIONS.find((option) => option.value === dayOfWeek)?.label ?? "Day";

const toTimeString = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

const toMinutes = (value: string) => {
  const [hours, mins] = value.split(":").map(Number);
  return hours * 60 + mins;
};

type HoursRow = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

export default function CourtHoursPage() {
  const params = useParams();
  const placeId = params.placeId as string;
  const courtId = params.courtId as string;
  const router = useRouter();
  const trpc = useTRPC();

  const { data: user } = useSession();
  const logoutMutation = useLogout();
  const {
    organization,
    organizations,
    isLoading: orgLoading,
  } = useOwnerOrganization();

  const { data: courtData, isLoading: courtLoading } = useQuery({
    ...trpc.courtManagement.getById.queryOptions({ courtId }),
    enabled: !!courtId,
  });

  const { data: hours = [], isLoading: hoursLoading } = useCourtHours(courtId);
  const saveHours = useSaveCourtHours(courtId);

  const [rows, setRows] = React.useState<HoursRow[]>([]);

  React.useEffect(() => {
    if (!hours) return;
    setRows(
      hours.map((window) => ({
        dayOfWeek: window.dayOfWeek,
        startTime: toTimeString(window.startMinute),
        endTime: toTimeString(window.endMinute),
      })),
    );
  }, [hours]);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(
      appRoutes.owner.places.courts.hours(placeId, courtId),
    );
  };

  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      { dayOfWeek: 1, startTime: "08:00", endTime: "20:00" },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    setRows((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleRowChange = (
    index: number,
    field: keyof HoursRow,
    value: string | number,
  ) => {
    setRows((prev) =>
      prev.map((row, idx) =>
        idx === index ? { ...row, [field]: value } : row,
      ),
    );
  };

  const handleSave = () => {
    const windows = rows.flatMap((row) => {
      const startMinute = toMinutes(row.startTime);
      const endMinute = toMinutes(row.endTime);
      if (endMinute <= startMinute) {
        const nextDay = (row.dayOfWeek + 1) % 7;
        const overnightWindows = [
          {
            dayOfWeek: row.dayOfWeek,
            startMinute,
            endMinute: 1440,
          },
        ];
        if (endMinute > 0) {
          overnightWindows.push({
            dayOfWeek: nextDay,
            startMinute: 0,
            endMinute,
          });
        }
        return overnightWindows;
      }
      return [
        {
          dayOfWeek: row.dayOfWeek,
          startMinute,
          endMinute,
        },
      ];
    });

    saveHours.mutate(
      {
        courtId,
        windows,
      },
      {
        onSuccess: () => {
          toast.success("Court hours saved");
        },
        onError: (error) => {
          toast.error(error.message || "Failed to save hours");
        },
      },
    );
  };

  const hasOvernight = rows.some((row) => {
    const startMinute = toMinutes(row.startTime);
    const endMinute = toMinutes(row.endTime);
    return endMinute <= startMinute;
  });

  if (orgLoading || courtLoading || hoursLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!courtData) {
    router.push(appRoutes.owner.places.courts.base(placeId));
    return null;
  }

  return (
    <AppShell
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
      floatingPanel={
        <ReservationAlertsPanel organizationId={organization?.id ?? null} />
      }
    >
      <div className="space-y-6">
        <PageHeader
          title={`Court Hours · ${courtData.court.label}`}
          description="Set daily operating hours for bookings"
          breadcrumbs={[
            { label: "My Places", href: appRoutes.owner.places.base },
            {
              label: "Courts",
              href: appRoutes.owner.places.courts.base(placeId),
            },
            { label: "Hours" },
          ]}
          backHref={appRoutes.owner.places.courts.base(placeId)}
        />

        <Card>
          <CardContent className="p-6 space-y-4">
            {hasOvernight && (
              <p className="text-sm text-muted-foreground">
                Overnight windows (end before start) are split into two days.
              </p>
            )}
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hours yet. Add a window to start.
              </p>
            ) : (
              <div className="space-y-3">
                {rows.map((row, index) => {
                  const startMinute = toMinutes(row.startTime);
                  const endMinute = toMinutes(row.endTime);
                  const isOvernight = endMinute <= startMinute;
                  const nextDayLabel = getDayLabel((row.dayOfWeek + 1) % 7);
                  const splitSummary =
                    endMinute > 0
                      ? `${getDayLabel(row.dayOfWeek)} ${row.startTime}-24:00 · ${nextDayLabel} 00:00-${row.endTime}`
                      : `${getDayLabel(row.dayOfWeek)} ${row.startTime}-24:00`;

                  return (
                    <div
                      key={`hour-${row.dayOfWeek}-${index}`}
                      className="space-y-2"
                    >
                      <div className="grid gap-3 md:grid-cols-[180px_160px_160px_auto] items-end">
                        <div className="space-y-2">
                          <Label>Day</Label>
                          <Select
                            value={String(row.dayOfWeek)}
                            onValueChange={(value) =>
                              handleRowChange(index, "dayOfWeek", Number(value))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select day" />
                            </SelectTrigger>
                            <SelectContent>
                              {DAY_OPTIONS.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={String(option.value)}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Start</Label>
                          <Input
                            type="time"
                            value={row.startTime}
                            onChange={(event) =>
                              handleRowChange(
                                index,
                                "startTime",
                                event.target.value,
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>End</Label>
                          <Input
                            type="time"
                            value={row.endTime}
                            onChange={(event) =>
                              handleRowChange(
                                index,
                                "endTime",
                                event.target.value,
                              )
                            }
                          />
                        </div>
                        <div className="flex md:justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveRow(index)}
                            aria-label="Remove window"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {isOvernight && (
                        <p className="text-xs text-muted-foreground">
                          Overnight window splits into {splitSummary}.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={handleAddRow}>
                <Plus className="mr-2 h-4 w-4" />
                Add window
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={saveHours.isPending}
              >
                {saveHours.isPending ? "Saving..." : "Save hours"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
