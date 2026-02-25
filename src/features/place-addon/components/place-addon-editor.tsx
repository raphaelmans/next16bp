"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "@/common/toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { CourtAddonForm } from "@/features/court-addons/schemas";
import {
  useMutOwnerSavePlaceAddons,
  useQueryOwnerPlaceAddons,
} from "@/features/owner/hooks";
import {
  type AddonRuleGroup,
  collapseRulesToGroups,
  expandGroupsToRules,
  mapPlaceAddonConfigsToForms,
  mapPlaceAddonFormsToSetPayload,
} from "@/features/place-addon/helpers";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

type AddonEditorForm = Omit<CourtAddonForm, "rules"> & {
  groups: AddonRuleGroup[];
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

function createDefaultAddon(displayOrder: number): AddonEditorForm {
  return {
    label: "",
    isActive: true,
    mode: "OPTIONAL",
    pricingType: "HOURLY",
    displayOrder,
    groups: [createDefaultGroup()],
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

// ── Component ────────────────────────────────────────────────────────────────

type PlaceAddonEditorProps = {
  placeId: string;
};

export function PlaceAddonEditor({ placeId }: PlaceAddonEditorProps) {
  const { data, isLoading } = useQueryOwnerPlaceAddons(placeId, {
    enabled: !!placeId,
  });
  const saveMutation = useMutOwnerSavePlaceAddons(placeId);

  const [addons, setAddons] = React.useState<AddonEditorForm[]>([]);
  const [_isDirty, setIsDirty] = React.useState(false);
  const [saveAttempted, setSaveAttempted] = React.useState(false);

  const updateAddons = React.useCallback(
    (updater: React.SetStateAction<AddonEditorForm[]>) => {
      setIsDirty(true);
      setAddons(updater);
    },
    [],
  );

  React.useEffect(() => {
    if (!data) return;
    const forms = mapPlaceAddonConfigsToForms(data);
    setAddons(
      forms.map((form) => ({
        ...form,
        groups: collapseRulesToGroups(form.rules),
      })),
    );
    setIsDirty(false);
    setSaveAttempted(false);
  }, [data]);

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

  const handleAddAddon = React.useCallback(() => {
    setAddons((prev) => [...prev, createDefaultAddon(prev.length)]);
  }, []);

  const handleSave = React.useCallback(async () => {
    setSaveAttempted(true);
    if (hasBlockingIssues) {
      toast.error("Resolve add-on validation issues before saving.");
      return;
    }

    const addonForms: CourtAddonForm[] = addons.map((addon) => ({
      id: addon.id,
      label: addon.label,
      isActive: addon.isActive,
      mode: addon.mode,
      pricingType: addon.pricingType,
      flatFeeCents: addon.flatFeeCents,
      displayOrder: addon.displayOrder,
      rules: expandGroupsToRules(addon.groups),
    }));

    await saveMutation.mutateAsync(
      mapPlaceAddonFormsToSetPayload(placeId, addonForms),
    );
    setIsDirty(false);
    setSaveAttempted(false);
    toast.success("Venue add-ons saved");
  }, [addons, placeId, hasBlockingIssues, saveMutation]);

  if (isLoading) {
    return (
      <div className="flex min-h-[140px] items-center justify-center rounded-lg border">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>Venue-wide add-ons</CardTitle>
            <p className="text-sm text-muted-foreground">
              Configure extras that apply to all courts at this venue.
            </p>
            <p className="text-xs text-muted-foreground">
              Venue-wide add-ons can also be managed from any court's add-on
              editor.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddAddon}
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
              No venue-wide add-ons configured yet.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Add extras like equipment rental that apply to every court.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={handleAddAddon}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add your first add-on
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {addons.map((addon, addonIndex) => {
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
                  {/* ── Identity: label + mode + active + remove ─── */}
                  <div className="flex flex-wrap items-center gap-2.5 p-4 sm:flex-nowrap sm:p-5">
                    <Input
                      placeholder="Add-on label…"
                      value={addon.label}
                      onChange={(e) => updateAddon({ label: e.target.value })}
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
                            <SelectItem value="FLAT">Flat add-on</SelectItem>
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
                                            timeToMinute(e.target.value) + 1,
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
                                              : Math.round(Number(raw) * 100),
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
                                                  (_, gi) => gi !== groupIndex,
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
            })}
          </div>
        )}

        <div className="flex justify-end pt-1">
          <Button
            type="button"
            onClick={handleSave}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save add-ons"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
