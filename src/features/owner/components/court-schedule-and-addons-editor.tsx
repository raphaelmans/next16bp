"use client";

import { ChevronDown } from "lucide-react";
import * as React from "react";
import { toast } from "@/common/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { type AddonSaveHandle, CourtAddonEditor } from "./court-addon-editor";
import {
  CourtScheduleEditor,
  type ScheduleSaveHandle,
} from "./court-schedule-editor";

// ── Component ────────────────────────────────────────────────────────────────

interface CourtScheduleAndAddonsEditorProps {
  courtId: string;
  placeId?: string;
  organizationId?: string | null;
  primaryActionLabel?: string;
  onSaved?: () => void;
}

export function CourtScheduleAndAddonsEditor({
  courtId,
  placeId,
  organizationId,
  primaryActionLabel = "Save schedule",
  onSaved,
}: CourtScheduleAndAddonsEditorProps) {
  const scheduleRef = React.useRef<ScheduleSaveHandle | null>(null);
  const addonRef = React.useRef<AddonSaveHandle | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  // Collapsible add-ons section
  const [addonsOpen, setAddonsOpen] = React.useState(false);
  const [addonCount, setAddonCount] = React.useState<number | null>(null);
  const hasSetInitialOpen = React.useRef(false);

  // Auto-expand collapsible when addons are first loaded
  React.useEffect(() => {
    if (addonCount !== null && !hasSetInitialOpen.current) {
      setAddonsOpen(addonCount > 0);
      hasSetInitialOpen.current = true;
    }
  }, [addonCount]);

  const handleSave = React.useCallback(async () => {
    if (!scheduleRef.current || !addonRef.current) return;

    setIsSaving(true);
    const results = await Promise.allSettled([
      scheduleRef.current.save(),
      addonRef.current.save(),
    ]);
    setIsSaving(false);

    const scheduleOk =
      results[0].status === "fulfilled" && results[0].value !== false;
    const addonOk =
      results[1].status === "fulfilled" && results[1].value !== false;

    if (scheduleOk && addonOk) {
      toast.success("Schedule saved");
      onSaved?.();
    }
  }, [onSaved]);

  return (
    <Card>
      <CardContent className="p-6 space-y-5">
        {/* Schedule section */}
        <CourtScheduleEditor
          embedded
          saveHandle={scheduleRef}
          courtId={courtId}
          organizationId={organizationId}
        />

        {/* Collapsible add-ons divider */}
        <Collapsible open={addonsOpen} onOpenChange={setAddonsOpen}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-3 py-2 group cursor-pointer"
            >
              <div className="h-px flex-1 bg-border" />
              <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                Add-ons
                {addonCount !== null && addonCount > 0 && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">
                    {addonCount}
                  </Badge>
                )}
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    addonsOpen && "rotate-180",
                  )}
                />
              </span>
              <div className="h-px flex-1 bg-border" />
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-4 pt-2">
            <CourtAddonEditor
              embedded
              saveHandle={addonRef}
              courtId={courtId}
              placeId={placeId}
              organizationId={organizationId}
              onAddonCountChange={setAddonCount}
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Single save button */}
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto"
            loading={isSaving}
          >
            {primaryActionLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
