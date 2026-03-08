"use client";

import { Copy, Globe, Plus, Target, Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "@/common/toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  type AddonRuleGroup,
  collapseRulesToGroups,
  expandGroupsToRules,
  mapCourtAddonConfigsToForms,
  mapCourtAddonFormsToSetPayload,
  partitionAddonsByScope,
} from "@/features/court-addons/helpers";
import type { CourtAddonForm } from "@/features/court-addons/schemas";
import {
  useMutOwnerSaveCourtAddons,
  useMutOwnerSavePlaceAddons,
  useQueryOwnerCourtAddons,
  useQueryOwnerCourts,
  useQueryOwnerPlaceAddons,
} from "@/features/owner/hooks";
import {
  mapPlaceAddonConfigsToForms,
  mapPlaceAddonFormsToSetPayload,
} from "@/features/place-addon/helpers";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

type AddonScope = "GLOBAL" | "SPECIFIC";

// Editor-local form type: rules stored as groups (day pills), not flat per-day rows
type AddonEditorForm = Omit<CourtAddonForm, "rules"> & {
  groups: AddonRuleGroup[];
  scope: AddonScope;
};

// ── Constants ────────────────────────────────────────────────────────────────

const DAYS = [
  { value: 0, label: "Su" },
  { value: 1, label: "M" },
  { value: 2, label: "T" },
  { value: 3, label: "W" },
  { value: 4, label: "Th" },
  { value: 5, label: "F" },
  { value: 6, label: "Sa" },
] as const;

// ── Helper functions ─────────────────────────────────────────────────────────

function minuteToTime(minute: number) {
  const hours = Math.floor(minute / 60)
    .toString()
    .padStart(2, "0");
  const mins = (minute % 60).toString().padStart(2, "0");
  return `${hours}:${mins}`;
}

function timeToMinute(value: string) {
  const [hours, minutes] = value.split(":").map((part) => Number(part));
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return 0;
  }
  return Math.max(0, Math.min(1440, hours * 60 + minutes));
}

function createDefaultGroup(): AddonRuleGroup {
  return {
    _id: crypto.randomUUID(),
    days: [1],
    startMinute: 540,
    endMinute: 600,
    hourlyRateCents: 0,
  };
}

function createDefaultAddon(
  displayOrder: number,
  scope: AddonScope = "SPECIFIC",
): AddonEditorForm {
  return {
    label: "",
    isActive: true,
    mode: "OPTIONAL",
    pricingType: "HOURLY",
    displayOrder,
    groups: [createDefaultGroup()],
    scope,
  };
}

function hasOverlappingGroups(groups: AddonRuleGroup[]) {
  const byDay = new Map<number, AddonRuleGroup[]>();
  for (const group of groups) {
    for (const day of group.days) {
      const current = byDay.get(day) ?? [];
      byDay.set(day, [...current, group]);
    }
  }

  for (const dayGroups of byDay.values()) {
    const sorted = [...dayGroups].sort((a, b) => a.startMinute - b.startMinute);
    for (let index = 0; index < sorted.length - 1; index++) {
      const current = sorted[index];
      const next = sorted[index + 1];
      if (current && next && current.endMinute > next.startMinute) {
        return true;
      }
    }
  }
  return false;
}

// ── DayPills component ───────────────────────────────────────────────────────

function DayPills({
  selected,
  onChange,
}: {
  selected: number[];
  onChange: (days: number[]) => void;
}) {
  return (
    <div className="flex gap-1">
      {DAYS.map((d) => {
        const active = selected.includes(d.value);
        return (
          <button
            key={d.value}
            type="button"
            onClick={() =>
              onChange(
                active
                  ? selected.filter((x) => x !== d.value)
                  : [...selected, d.value],
              )
            }
            className={cn(
              "h-7 w-7 rounded-full text-xs font-semibold transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            {d.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Scope change confirmation dialog ─────────────────────────────────────────

function ScopeChangeDialog({
  open,
  direction,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  direction: "TO_GLOBAL" | "TO_SPECIFIC" | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {direction === "TO_GLOBAL"
              ? "Make venue-wide?"
              : "Make venue-specific?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {direction === "TO_GLOBAL"
              ? "This add-on will apply to all venues at this location."
              : "This add-on will be removed from other venues. Only this venue will have it."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

type CourtAddonEditorProps = {
  courtId: string;
  placeId?: string;
  organizationId?: string | null;
};

export function CourtAddonEditor({
  courtId,
  placeId,
  organizationId,
}: CourtAddonEditorProps) {
  const { data, isLoading } = useQueryOwnerCourtAddons(courtId, {
    enabled: !!courtId,
  });
  const saveMutation = useMutOwnerSaveCourtAddons(courtId);
  const { data: placeAddons } = useQueryOwnerPlaceAddons(placeId ?? "", {
    enabled: !!placeId,
  });
  const savePlaceMutation = useMutOwnerSavePlaceAddons(placeId ?? "");

  // Sibling courts for copy
  const { data: allCourts = [], isLoading: courtsLoading } =
    useQueryOwnerCourts(organizationId);
  const siblingCourts = React.useMemo(
    () => allCourts.filter((c) => c.placeId === placeId && c.id !== courtId),
    [allCourts, placeId, courtId],
  );
  const hasSiblingCourts = !courtsLoading && siblingCourts.length > 0;

  const [addons, setAddons] = React.useState<AddonEditorForm[]>([]);
  const [_isDirty, setIsDirty] = React.useState(false);
  const [saveAttempted, setSaveAttempted] = React.useState(false);

  // Scope change confirmation state
  const [scopeChange, setScopeChange] = React.useState<{
    addonIndex: number;
    direction: "TO_GLOBAL" | "TO_SPECIFIC";
  } | null>(null);

  // Copy from court state
  const [copySource, setCopySource] = React.useState<{
    courtId: string;
    label: string;
  } | null>(null);
  const { data: sourceCopyAddons } = useQueryOwnerCourtAddons(
    copySource?.courtId ?? "",
    { enabled: !!copySource },
  );

  // Wraps setAddons for user interactions — marks form dirty
  const updateAddons = React.useCallback(
    (updater: React.SetStateAction<AddonEditorForm[]>) => {
      setIsDirty(true);
      setAddons(updater);
    },
    [],
  );

  // Merge GLOBAL (place addons) + SPECIFIC (court addons) on load
  React.useEffect(() => {
    if (!data) return;

    // Map court addons → SPECIFIC
    const courtForms = mapCourtAddonConfigsToForms(data);
    const specificForms: AddonEditorForm[] = courtForms.map((form) => ({
      ...form,
      groups: collapseRulesToGroups(form.rules),
      scope: "SPECIFIC" as const,
    }));

    // Map place addons → GLOBAL (include ALL, not just active)
    const globalForms: AddonEditorForm[] = placeAddons
      ? mapPlaceAddonConfigsToForms(placeAddons).map((form) => ({
          ...form,
          groups: collapseRulesToGroups(form.rules),
          scope: "GLOBAL" as const,
        }))
      : [];

    setAddons([...globalForms, ...specificForms]);
    setIsDirty(false);
    setSaveAttempted(false);
  }, [data, placeAddons]);

  const hasBlockingIssues = React.useMemo(
    () =>
      addons.some(
        (addon) =>
          addon.label.trim().length === 0 ||
          (addon.pricingType !== "FLAT" &&
            (addon.groups.some((g) => g.days.length === 0) ||
              addon.groups.some((g) => g.startMinute >= g.endMinute) ||
              hasOverlappingGroups(addon.groups))),
      ),
    [addons],
  );

  const handleAddAddon = React.useCallback(
    (scope: AddonScope = "SPECIFIC") => {
      updateAddons((prev) => {
        const newAddon = createDefaultAddon(prev.length, scope);
        // Re-sort so globals always come first
        const updated = [...prev, newAddon];
        return [
          ...updated.filter((a) => a.scope === "GLOBAL"),
          ...updated.filter((a) => a.scope === "SPECIFIC"),
        ];
      });
    },
    [updateAddons],
  );

  const handleSave = React.useCallback(async () => {
    setSaveAttempted(true);
    if (hasBlockingIssues) {
      toast.error("Resolve add-on validation issues before saving.");
      return;
    }

    const toCourtAddonForm = (addon: AddonEditorForm): CourtAddonForm => ({
      id: addon.id,
      label: addon.label,
      isActive: addon.isActive,
      mode: addon.mode,
      pricingType: addon.pricingType,
      flatFeeCents: addon.flatFeeCents,
      displayOrder: addon.displayOrder,
      rules: expandGroupsToRules(addon.groups),
    });

    const { global: globalAddons, specific: specificAddons } =
      partitionAddonsByScope(addons);

    const specificForms = specificAddons.map(toCourtAddonForm);
    const globalForms = globalAddons.map(toCourtAddonForm);

    const mutations: Promise<unknown>[] = [
      saveMutation.mutateAsync(
        mapCourtAddonFormsToSetPayload(courtId, specificForms),
      ),
    ];

    if (placeId) {
      mutations.push(
        savePlaceMutation.mutateAsync(
          mapPlaceAddonFormsToSetPayload(placeId, globalForms),
        ),
      );
    }

    await Promise.all(mutations);
    setIsDirty(false);
    setSaveAttempted(false);
    toast.success("Add-ons saved");
  }, [
    addons,
    courtId,
    placeId,
    hasBlockingIssues,
    saveMutation,
    savePlaceMutation,
  ]);

  const handleScopeToggleRequest = (
    addonIndex: number,
    currentScope: AddonScope,
  ) => {
    setScopeChange({
      addonIndex,
      direction: currentScope === "GLOBAL" ? "TO_SPECIFIC" : "TO_GLOBAL",
    });
  };

  const handleScopeChangeConfirm = () => {
    if (!scopeChange) return;
    const { addonIndex, direction } = scopeChange;
    updateAddons((prev) => {
      const updated = prev.map((item, i) => {
        if (i !== addonIndex) return item;
        return {
          ...item,
          scope:
            direction === "TO_GLOBAL"
              ? ("GLOBAL" as const)
              : ("SPECIFIC" as const),
          // Clear id — it will be deleted from one table and recreated in the other
          id: undefined,
        };
      });
      // Re-sort so globals always come first
      return [
        ...updated.filter((a) => a.scope === "GLOBAL"),
        ...updated.filter((a) => a.scope === "SPECIFIC"),
      ];
    });
    setScopeChange(null);
  };

  // Copy from court: when source addons arrive, append them
  // biome-ignore lint/correctness/useExhaustiveDependencies: addons.length used for displayOrder calc
  React.useEffect(() => {
    if (!copySource || !sourceCopyAddons) return;
    const forms = mapCourtAddonConfigsToForms(sourceCopyAddons);
    const newAddons: AddonEditorForm[] = forms.map((form, i) => ({
      ...form,
      id: undefined,
      groups: collapseRulesToGroups(form.rules),
      scope: "SPECIFIC" as const,
      displayOrder: addons.length + i,
    }));
    if (newAddons.length > 0) {
      updateAddons((prev) => [...prev, ...newAddons]);
      toast.success(
        `Copied ${newAddons.length} add-on(s) from ${copySource.label}`,
      );
    } else {
      toast.info(`${copySource.label} has no add-ons to copy.`);
    }
    setCopySource(null);
  }, [sourceCopyAddons, copySource]);

  const handleCopyFromCourt = (court: { id: string; label: string }) => {
    setCopySource({ courtId: court.id, label: court.label });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[140px] items-center justify-center rounded-lg border">
        <Spinner className="h-5 w-5 text-muted-foreground" />
      </div>
    );
  }

  const isSaving = saveMutation.isPending || savePlaceMutation.isPending;

  return (
    <>
      <ScopeChangeDialog
        open={!!scopeChange}
        direction={scopeChange?.direction ?? null}
        onConfirm={handleScopeChangeConfirm}
        onCancel={() => setScopeChange(null)}
      />

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle>Add-ons</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure optional or auto-applied extras for this venue.
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Add add-on
                    {addons.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {addons.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>New add-on</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleAddAddon("SPECIFIC")}>
                    <Target className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p>Venue add-on</p>
                      <p className="text-xs text-muted-foreground">
                        Only this venue
                      </p>
                    </div>
                  </DropdownMenuItem>
                  {placeId && (
                    <DropdownMenuItem onClick={() => handleAddAddon("GLOBAL")}>
                      <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
                      <div>
                        <p>Venue-wide add-on</p>
                        <p className="text-xs text-muted-foreground">
                          All venues at this location
                        </p>
                      </div>
                    </DropdownMenuItem>
                  )}
                  {hasSiblingCourts && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <Copy className="mr-2 h-4 w-4 text-muted-foreground" />
                          Copy from venue
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          {siblingCourts.map((court) => (
                            <DropdownMenuItem
                              key={court.id}
                              onClick={() => handleCopyFromCourt(court)}
                            >
                              {court.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {saveAttempted && hasBlockingIssues && (
            <Alert variant="destructive">
              <AlertTitle>Validation issues found</AlertTitle>
              <AlertDescription>
                Check empty labels, no days selected, invalid time ranges, and
                overlapping rule windows.
              </AlertDescription>
            </Alert>
          )}

          {addons.length === 0 ? (
            <div className="rounded-lg border border-dashed py-10 text-center">
              <p className="text-sm text-muted-foreground">
                No add-ons configured yet.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Add extras like equipment rental or venue lighting.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => handleAddAddon("SPECIFIC")}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add your first add-on
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {(() => {
                const indexed = addons.map((a, i) => ({ ...a, _idx: i }));
                const globalGroup = indexed.filter((a) => a.scope === "GLOBAL");
                const specificGroup = indexed.filter(
                  (a) => a.scope === "SPECIFIC",
                );

                const renderAddonCard = (
                  addon: AddonEditorForm & { _idx: number },
                ) => {
                  const addonIndex = addon._idx;

                  const updateAddon = (patch: Partial<AddonEditorForm>) =>
                    updateAddons((prev) =>
                      prev.map((item, i) =>
                        i === addonIndex ? { ...item, ...patch } : item,
                      ),
                    );

                  const updateGroup = (
                    groupIndex: number,
                    patch: Partial<AddonRuleGroup>,
                  ) =>
                    updateAddons((prev) =>
                      prev.map((item, i) =>
                        i === addonIndex
                          ? {
                              ...item,
                              groups: item.groups.map((g, gi) =>
                                gi === groupIndex ? { ...g, ...patch } : g,
                              ),
                            }
                          : item,
                      ),
                    );

                  return (
                    <div
                      key={`${addon.id ?? "new"}-${addonIndex}`}
                      className="overflow-hidden rounded-xl border shadow-sm"
                    >
                      {/* ── Identity: label + mode + active + scope + remove ─── */}
                      <div className="flex flex-wrap items-center gap-2.5 p-4 sm:flex-nowrap sm:p-5">
                        <Input
                          placeholder="Add-on label…"
                          value={addon.label}
                          onChange={(e) =>
                            updateAddon({ label: e.target.value })
                          }
                          className="min-w-0 flex-1 font-medium"
                        />
                        <Select
                          value={addon.mode}
                          onValueChange={(value: "OPTIONAL" | "AUTO") =>
                            updateAddon({ mode: value })
                          }
                        >
                          <SelectTrigger className="w-36 shrink-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="OPTIONAL">Optional</SelectItem>
                            <SelectItem value="AUTO">Auto-applied</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <Switch
                            checked={addon.isActive}
                            onCheckedChange={(checked) =>
                              updateAddon({ isActive: checked })
                            }
                          />
                          <span className="text-xs text-muted-foreground">
                            Active
                          </span>
                        </div>
                        {placeId && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge
                                variant={
                                  addon.scope === "GLOBAL"
                                    ? "secondary"
                                    : "outline"
                                }
                                className="cursor-pointer select-none"
                                onClick={() =>
                                  handleScopeToggleRequest(
                                    addonIndex,
                                    addon.scope,
                                  )
                                }
                              >
                                {addon.scope === "GLOBAL"
                                  ? "Venue-wide"
                                  : "Venue"}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              {addon.scope === "GLOBAL"
                                ? "Applies to all venues. Click to make venue-specific."
                                : "Only this venue. Click to make venue-wide."}
                            </TooltipContent>
                          </Tooltip>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() =>
                            updateAddons((prev) =>
                              prev.filter((_, i) => i !== addonIndex),
                            )
                          }
                          aria-label="Remove add-on"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* ── Pricing ───────────────────────────────────── */}
                      <div className="border-t bg-muted/30 px-4 py-3 sm:px-5">
                        <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Pricing
                        </p>
                        <div className="flex flex-wrap items-end gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Type</Label>
                            <Select
                              value={addon.pricingType}
                              onValueChange={(value: "HOURLY" | "FLAT") =>
                                updateAddons((prev) =>
                                  prev.map((item, i) =>
                                    i === addonIndex
                                      ? {
                                          ...item,
                                          pricingType: value,
                                          flatFeeCents:
                                            value === "FLAT"
                                              ? (item.flatFeeCents ?? 0)
                                              : null,
                                          groups:
                                            value === "FLAT"
                                              ? []
                                              : item.groups.length > 0
                                                ? item.groups
                                                : [createDefaultGroup()],
                                        }
                                      : item,
                                  ),
                                )
                              }
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="HOURLY">
                                  Hourly add-on
                                </SelectItem>
                                <SelectItem value="FLAT">
                                  Flat add-on
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {addon.pricingType === "FLAT" && (
                            <div className="space-y-1">
                              <Label className="text-xs">Flat fee</Label>
                              <Input
                                type="number"
                                min={0}
                                step={0.01}
                                className="w-28"
                                value={
                                  addon.flatFeeCents != null
                                    ? addon.flatFeeCents / 100
                                    : ""
                                }
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  updateAddon({
                                    flatFeeCents:
                                      raw === ""
                                        ? null
                                        : Math.round(Number(raw) * 100),
                                  });
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* ── Schedule rules (HOURLY only) ──────────────── */}
                      {addon.pricingType !== "FLAT" && (
                        <div className="border-t px-4 pb-4 pt-3 sm:px-5">
                          <div className="mb-2.5 flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Schedule rules
                            </p>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() =>
                                updateAddons((prev) =>
                                  prev.map((item, i) =>
                                    i === addonIndex
                                      ? {
                                          ...item,
                                          groups: [
                                            ...item.groups,
                                            createDefaultGroup(),
                                          ],
                                        }
                                      : item,
                                  ),
                                )
                              }
                            >
                              <Plus className="mr-1 h-3 w-3" />
                              Add rule
                            </Button>
                          </div>

                          {addon.groups.length === 0 ? (
                            <p className="py-3 text-center text-xs text-muted-foreground">
                              No rules yet — add one to define when this add-on
                              applies.
                            </p>
                          ) : addon.groups.length > 0 ? (
                            <div className="space-y-2">
                              {/* Column headers (desktop only) */}
                              <div className="hidden grid-cols-[auto_1fr_1fr_1fr_36px] gap-2 px-1 md:grid">
                                <span className="text-xs text-muted-foreground">
                                  Days
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  From
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  To
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {addon.pricingType === "HOURLY"
                                    ? "Rate (₱/hr)"
                                    : ""}
                                </span>
                                <span />
                              </div>
                              {addon.groups.map((group, groupIndex) => {
                                const hasEmptyDays = group.days.length === 0;
                                return (
                                  <div key={group._id} className="space-y-1">
                                    <div className="grid gap-2 rounded-lg border bg-card p-2 md:grid-cols-[auto_1fr_1fr_1fr_36px] md:rounded-none md:border-0 md:bg-transparent md:p-0">
                                      <div className="flex flex-col gap-1">
                                        <DayPills
                                          selected={group.days}
                                          onChange={(days) =>
                                            updateGroup(groupIndex, { days })
                                          }
                                        />
                                      </div>
                                      <Input
                                        type="time"
                                        className="h-8 text-sm"
                                        aria-label="Start time"
                                        value={minuteToTime(group.startMinute)}
                                        onChange={(e) =>
                                          updateGroup(groupIndex, {
                                            startMinute: timeToMinute(
                                              e.target.value,
                                            ),
                                          })
                                        }
                                      />
                                      <Input
                                        type="time"
                                        className="h-8 text-sm"
                                        aria-label="End time"
                                        value={minuteToTime(
                                          Math.min(1439, group.endMinute - 1),
                                        )}
                                        onChange={(e) =>
                                          updateGroup(groupIndex, {
                                            endMinute: Math.max(
                                              1,
                                              Math.min(
                                                1440,
                                                timeToMinute(e.target.value) +
                                                  1,
                                              ),
                                            ),
                                          })
                                        }
                                      />
                                      {addon.pricingType === "HOURLY" ? (
                                        <Input
                                          type="number"
                                          min={0}
                                          step={0.01}
                                          className="h-8 text-sm"
                                          aria-label="Hourly rate (₱/hr)"
                                          placeholder="0"
                                          value={
                                            group.hourlyRateCents != null
                                              ? group.hourlyRateCents / 100
                                              : ""
                                          }
                                          onChange={(e) => {
                                            const raw = e.target.value;
                                            updateGroup(groupIndex, {
                                              hourlyRateCents:
                                                raw === ""
                                                  ? null
                                                  : Math.round(
                                                      Number(raw) * 100,
                                                    ),
                                            });
                                          }}
                                        />
                                      ) : (
                                        <div className="hidden items-center md:flex">
                                          <span className="text-xs text-muted-foreground">
                                            Flat fee
                                          </span>
                                        </div>
                                      )}
                                      <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                                        onClick={() =>
                                          updateAddons((prev) =>
                                            prev.map((item, i) =>
                                              i === addonIndex
                                                ? {
                                                    ...item,
                                                    groups: item.groups.filter(
                                                      (_, gi) =>
                                                        gi !== groupIndex,
                                                    ),
                                                  }
                                                : item,
                                            ),
                                          )
                                        }
                                        aria-label="Remove rule"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                    {hasEmptyDays && (
                                      <p className="px-1 text-xs text-destructive">
                                        Select at least one day
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  );
                };

                return (
                  <>
                    {globalGroup.length > 0 && (
                      <>
                        <div className="flex items-center gap-2 pt-1">
                          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground">
                            Venue-wide
                          </span>
                          <div className="h-px flex-1 bg-border" />
                        </div>
                        {globalGroup.map(renderAddonCard)}
                      </>
                    )}
                    {specificGroup.length > 0 && (
                      <>
                        <div className="flex items-center gap-2 pt-1">
                          <Target className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground">
                            This venue
                          </span>
                          <div className="h-px flex-1 bg-border" />
                        </div>
                        {specificGroup.map(renderAddonCard)}
                      </>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          <div className="flex justify-end pt-1">
            <Button type="button" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Saving…
                </>
              ) : (
                "Save add-ons"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
