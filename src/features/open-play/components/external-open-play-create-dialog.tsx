"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { appRoutes } from "@/common/app-routes";
import { toast } from "@/common/toast";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import { useQueryAuthSession } from "@/features/auth";
import { cn } from "@/lib/utils";
import { useMutCreateExternalOpenPlay } from "../hooks";

interface ExternalOpenPlayCreateDialogProps {
  place: {
    id: string;
    sports: {
      id: string;
      name: string;
    }[];
  };
  triggerLabel?: string;
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const hour12 = i % 12 || 12;
  const amPm = i < 12 ? "AM" : "PM";
  return { value: String(i), label: `${hour12}:00 ${amPm}` };
});

type CourtField = {
  id: string;
  label: string;
};

const INITIAL_COURT_FIELD: CourtField = {
  id: "court-field-0",
  label: "",
};

export function ExternalOpenPlayCreateDialog({
  place,
  triggerLabel = "Host External Open Play",
}: ExternalOpenPlayCreateDialogProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useQueryAuthSession();
  const isAuthed = Boolean(session);
  const createExternal = useMutCreateExternalOpenPlay();
  const nextCourtFieldId = React.useRef(1);
  const createCourtField = React.useCallback(
    (label = ""): CourtField => ({
      id: `court-field-${nextCourtFieldId.current++}`,
      label,
    }),
    [],
  );

  const [open, setOpen] = React.useState(false);
  const [sportId, setSportId] = React.useState<string>(
    place.sports[0]?.id ?? "",
  );
  const [startDate, setStartDate] = React.useState<Date | undefined>();
  const [startHour, setStartHour] = React.useState<string>("");
  const [endDate, setEndDate] = React.useState<Date | undefined>();
  const [endHour, setEndHour] = React.useState<string>("");
  const [courtFields, setCourtFields] = React.useState<CourtField[]>([
    INITIAL_COURT_FIELD,
  ]);
  const [title, setTitle] = React.useState("");
  const [note, setNote] = React.useState("");
  const [maxPlayers, setMaxPlayers] = React.useState(4);
  const [joinPolicy, setJoinPolicy] = React.useState<"REQUEST" | "AUTO">(
    "REQUEST",
  );
  const [visibility, setVisibility] = React.useState<"PUBLIC" | "UNLISTED">(
    "PUBLIC",
  );
  const [sourcePlatform, setSourcePlatform] = React.useState<
    "RECLUB" | "OTHER"
  >("RECLUB");
  const [sourceReference, setSourceReference] = React.useState("");

  React.useEffect(() => {
    if (!open) {
      nextCourtFieldId.current = 1;
      setSportId(place.sports[0]?.id ?? "");
      setStartDate(undefined);
      setStartHour("");
      setEndDate(undefined);
      setEndHour("");
      setCourtFields([INITIAL_COURT_FIELD]);
      setTitle("");
      setNote("");
      setMaxPlayers(4);
      setJoinPolicy("REQUEST");
      setVisibility("PUBLIC");
      setSourcePlatform("RECLUB");
      setSourceReference("");
    }
  }, [open, place.sports]);

  if (!isAuthed) {
    return (
      <Button variant="outline" asChild>
        <Link href={appRoutes.login.from(pathname)}>{triggerLabel}</Link>
      </Button>
    );
  }

  const disabled = createExternal.isPending || place.sports.length === 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Host External Open Play</DialogTitle>
          <DialogDescription>
            Create an unverified Open Play from an external booking (for example
            Reclub). Players will see it under External Open Plays.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>Sport</Label>
            <Select value={sportId} onValueChange={setSportId}>
              <SelectTrigger>
                <SelectValue placeholder="Select sport" />
              </SelectTrigger>
              <SelectContent>
                {place.sports.map((sport) => (
                  <SelectItem key={sport.id} value={sport.id}>
                    {sport.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Start date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left text-base font-normal md:text-sm",
                      !startDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 size-4" />
                    {startDate ? format(startDate, "MMM d, yyyy") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(day) => {
                      setStartDate(day);
                      if (!endDate && day) setEndDate(day);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Start hour</Label>
              <Select value={startHour} onValueChange={setStartHour}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select hour" />
                </SelectTrigger>
                <SelectContent>
                  {HOUR_OPTIONS.map((h) => (
                    <SelectItem key={h.value} value={h.value}>
                      {h.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>End date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left text-base font-normal md:text-sm",
                      !endDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 size-4" />
                    {endDate ? format(endDate, "MMM d, yyyy") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>End hour</Label>
              <Select value={endHour} onValueChange={setEndHour}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select hour" />
                </SelectTrigger>
                <SelectContent>
                  {HOUR_OPTIONS.map((h) => (
                    <SelectItem key={h.value} value={h.value}>
                      {h.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <Label>Venues</Label>
                <p className="text-xs text-muted-foreground">
                  Add each venue included in this external session.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setCourtFields((current) => [...current, createCourtField()])
                }
              >
                Add venue
              </Button>
            </div>
            <div className="space-y-2">
              {courtFields.map((courtField, index) => (
                <div key={courtField.id} className="flex gap-2">
                  <Input
                    value={courtField.label}
                    onChange={(e) => {
                      setCourtFields((current) =>
                        current.map((item) =>
                          item.id === courtField.id
                            ? { ...item, label: e.target.value }
                            : item,
                        ),
                      );
                    }}
                    placeholder={`e.g. Venue ${String.fromCharCode(65 + index)}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={courtFields.length === 1}
                    onClick={() =>
                      setCourtFields((current) =>
                        current.filter((item) => item.id !== courtField.id),
                      )
                    }
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="externalTitle">Title (optional)</Label>
            <Input
              id="externalTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Saturday Doubles"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="externalNote">Note (optional)</Label>
            <Textarea
              id="externalNote"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Beginner-friendly group"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="externalMaxPlayers">Max players</Label>
              <Input
                id="externalMaxPlayers"
                type="number"
                min={2}
                max={32}
                value={maxPlayers}
                onChange={(e) => {
                  const next = Number.parseInt(e.target.value, 10);
                  setMaxPlayers(Number.isFinite(next) ? next : 4);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Join policy</Label>
              <Select
                value={joinPolicy}
                onValueChange={(value) =>
                  setJoinPolicy(value as "REQUEST" | "AUTO")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REQUEST">Request</SelectItem>
                  <SelectItem value="AUTO">Auto-join</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select
                value={visibility}
                onValueChange={(value) =>
                  setVisibility(value as "PUBLIC" | "UNLISTED")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">Public</SelectItem>
                  <SelectItem value="UNLISTED">Unlisted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Source platform</Label>
              <Select
                value={sourcePlatform}
                onValueChange={(value) =>
                  setSourcePlatform(value as "RECLUB" | "OTHER")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RECLUB">Reclub</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="externalSourceRef">
                Source reference (optional)
              </Label>
              <Input
                id="externalSourceRef"
                value={sourceReference}
                onChange={(e) => setSourceReference(e.target.value)}
                placeholder="e.g. share URL or booking code"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={disabled}
              onClick={async () => {
                if (!sportId) {
                  toast.error("Select a sport.");
                  return;
                }
                const normalizedCourts = courtFields
                  .map((courtField) => courtField.label.trim())
                  .filter((courtLabel) => courtLabel.length > 0);
                if (normalizedCourts.length === 0) {
                  toast.error("Add at least one venue.");
                  return;
                }
                if (!startDate || !startHour || !endDate || !endHour) {
                  toast.error("Provide start and end date/hour.");
                  return;
                }

                const startsAt = new Date(startDate);
                startsAt.setHours(Number(startHour), 0, 0, 0);
                const endsAt = new Date(endDate);
                endsAt.setHours(Number(endHour), 0, 0, 0);
                if (
                  Number.isNaN(startsAt.getTime()) ||
                  Number.isNaN(endsAt.getTime())
                ) {
                  toast.error("Invalid start or end time.");
                  return;
                }

                try {
                  const created = await createExternal.mutateAsync({
                    placeId: place.id,
                    sportId,
                    startsAtIso: startsAt.toISOString(),
                    endsAtIso: endsAt.toISOString(),
                    courts: normalizedCourts.map((label) => ({ label })),
                    maxPlayers: Math.max(2, Math.min(32, maxPlayers)),
                    joinPolicy,
                    visibility,
                    title: title.trim().length > 0 ? title.trim() : undefined,
                    note: note.trim().length > 0 ? note.trim() : undefined,
                    sourcePlatform,
                    sourceReference:
                      sourceReference.trim().length > 0
                        ? sourceReference.trim()
                        : undefined,
                  });
                  setOpen(false);
                  router.push(
                    appRoutes.openPlay.externalDetail(
                      created.externalOpenPlayId,
                    ),
                  );
                } catch {
                  // toast handled by hook
                }
              }}
            >
              Host External Open Play
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
