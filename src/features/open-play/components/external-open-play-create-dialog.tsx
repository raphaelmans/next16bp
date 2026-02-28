"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { appRoutes } from "@/common/app-routes";
import { toast } from "@/common/toast";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQueryAuthSession } from "@/features/auth";
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

const LOCAL_DATETIME_STEP_SECONDS = 60;

export function ExternalOpenPlayCreateDialog({
  place,
  triggerLabel = "Host External Open Play",
}: ExternalOpenPlayCreateDialogProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useQueryAuthSession();
  const isAuthed = Boolean(session);
  const createExternal = useMutCreateExternalOpenPlay();

  const [open, setOpen] = React.useState(false);
  const [sportId, setSportId] = React.useState<string>(
    place.sports[0]?.id ?? "",
  );
  const [startsAtLocal, setStartsAtLocal] = React.useState("");
  const [endsAtLocal, setEndsAtLocal] = React.useState("");
  const [courtLabel, setCourtLabel] = React.useState("");
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
      setSportId(place.sports[0]?.id ?? "");
      setStartsAtLocal("");
      setEndsAtLocal("");
      setCourtLabel("");
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
              <Label htmlFor="externalStartsAt">Start time</Label>
              <Input
                id="externalStartsAt"
                type="datetime-local"
                step={LOCAL_DATETIME_STEP_SECONDS}
                value={startsAtLocal}
                onChange={(e) => setStartsAtLocal(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="externalEndsAt">End time</Label>
              <Input
                id="externalEndsAt"
                type="datetime-local"
                step={LOCAL_DATETIME_STEP_SECONDS}
                value={endsAtLocal}
                onChange={(e) => setEndsAtLocal(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="externalCourtLabel">Court label (optional)</Label>
            <Input
              id="externalCourtLabel"
              value={courtLabel}
              onChange={(e) => setCourtLabel(e.target.value)}
              placeholder="e.g. Court A"
            />
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
                if (!startsAtLocal || !endsAtLocal) {
                  toast.error("Provide start and end times.");
                  return;
                }

                const startsAt = new Date(startsAtLocal);
                const endsAt = new Date(endsAtLocal);
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
                    courtLabel:
                      courtLabel.trim().length > 0
                        ? courtLabel.trim()
                        : undefined,
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
