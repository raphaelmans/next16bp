"use client";

import { Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { toast } from "@/common/toast";
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
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import {
  COACH_DAY_OPTIONS,
  createLocalEditorId,
  minutesToTimeString,
  timeStringToMinutes,
} from "@/features/coach/helpers";
import {
  useMutCoachSetAddons,
  useQueryCoachAddons,
} from "@/features/coach/hooks";

type AddonRuleForm = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  hourlyRate: string;
};

type AddonForm = {
  id: string;
  label: string;
  isActive: boolean;
  mode: "OPTIONAL" | "AUTO";
  pricingType: "HOURLY" | "FLAT";
  flatFee: string;
  rules: AddonRuleForm[];
};

function createDefaultRule(): AddonRuleForm {
  return {
    id: createLocalEditorId(),
    dayOfWeek: 1,
    startTime: "08:00",
    endTime: "09:00",
    hourlyRate: "0",
  };
}

function createDefaultAddon(): AddonForm {
  return {
    id: createLocalEditorId(),
    label: "",
    isActive: true,
    mode: "OPTIONAL",
    pricingType: "HOURLY",
    flatFee: "",
    rules: [createDefaultRule()],
  };
}

function hasOverlappingRules(rules: AddonRuleForm[]) {
  const sorted = [...rules]
    .map((rule) => ({
      ...rule,
      startMinute: timeStringToMinutes(rule.startTime),
      endMinute: timeStringToMinutes(rule.endTime),
    }))
    .sort(
      (left, right) =>
        left.dayOfWeek - right.dayOfWeek ||
        left.startMinute - right.startMinute,
    );

  for (let index = 0; index < sorted.length - 1; index += 1) {
    const current = sorted[index];
    const next = sorted[index + 1];

    if (current.dayOfWeek !== next.dayOfWeek) {
      continue;
    }

    if (
      current.endMinute <= current.startMinute ||
      next.endMinute <= next.startMinute
    ) {
      continue;
    }

    if (current.endMinute > next.startMinute) {
      return true;
    }
  }

  return false;
}

export function CoachAddonEditor({ coachId }: { coachId: string }) {
  const { data: addons = [], isLoading } = useQueryCoachAddons(coachId);
  const saveAddons = useMutCoachSetAddons(coachId);
  const [forms, setForms] = React.useState<AddonForm[]>([]);

  React.useEffect(() => {
    setForms(
      addons.map((config) => ({
        id: createLocalEditorId(),
        label: config.addon.label,
        isActive: config.addon.isActive,
        mode: config.addon.mode,
        pricingType: config.addon.pricingType,
        flatFee:
          config.addon.flatFeeCents === null
            ? ""
            : (config.addon.flatFeeCents / 100).toFixed(2),
        rules:
          config.rules.length > 0
            ? config.rules.map((rule) => ({
                id: createLocalEditorId(),
                dayOfWeek: rule.dayOfWeek,
                startTime: minutesToTimeString(rule.startMinute),
                endTime: minutesToTimeString(rule.endMinute),
                hourlyRate:
                  rule.hourlyRateCents === null ||
                  typeof rule.hourlyRateCents === "undefined"
                    ? ""
                    : (rule.hourlyRateCents / 100).toFixed(2),
              }))
            : [createDefaultRule()],
      })),
    );
  }, [addons]);

  const invalidAddonIndex = React.useMemo(
    () =>
      forms.findIndex((addon) => {
        const hasBlankLabel = addon.label.trim().length === 0;
        const hasInvalidRanges = addon.rules.some(
          (rule) =>
            timeStringToMinutes(rule.endTime) <=
            timeStringToMinutes(rule.startTime),
        );
        const hasMissingFlatFee =
          addon.pricingType === "FLAT" && addon.flatFee.trim().length === 0;
        const hasMissingHourlyRule =
          addon.pricingType === "HOURLY" && addon.rules.length === 0;

        return (
          hasBlankLabel ||
          hasInvalidRanges ||
          hasMissingFlatFee ||
          hasMissingHourlyRule ||
          hasOverlappingRules(addon.rules)
        );
      }),
    [forms],
  );

  const hasErrors = invalidAddonIndex !== -1;

  const updateAddon = (
    addonId: string,
    updater: (addon: AddonForm) => AddonForm,
  ) => {
    setForms((current) =>
      current.map((addon) => (addon.id === addonId ? updater(addon) : addon)),
    );
  };

  const handleSave = () => {
    if (hasErrors) {
      toast.error("Fix the highlighted addon issues before saving.");
      return;
    }

    saveAddons.mutate(
      {
        coachId,
        addons: forms.map((addon, index) => ({
          label: addon.label.trim(),
          isActive: addon.isActive,
          mode: addon.mode,
          pricingType: addon.pricingType,
          flatFeeCents:
            addon.pricingType === "FLAT"
              ? Math.round(Number(addon.flatFee || 0) * 100)
              : undefined,
          displayOrder: index,
          rules: addon.rules.map((rule) => ({
            dayOfWeek: rule.dayOfWeek,
            startMinute: timeStringToMinutes(rule.startTime),
            endMinute: timeStringToMinutes(rule.endTime),
            ...(addon.pricingType === "HOURLY"
              ? {
                  hourlyRateCents: Math.round(
                    Number(rule.hourlyRate || 0) * 100,
                  ),
                }
              : {}),
          })),
        })),
      },
      {
        onSuccess: () => {
          toast.success("Coach add-ons saved");
        },
        onError: (error) => {
          toast.error(error.message || "Failed to save coach add-ons");
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center rounded-2xl border bg-card">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b">
        <CardTitle className="font-heading text-xl">Add-ons</CardTitle>
        <p className="text-sm text-muted-foreground">
          Offer equipment, video review, travel coverage, or other extras with
          either a flat fee or time-based rate windows.
        </p>
      </CardHeader>

      <CardContent className="space-y-4 pt-6">
        {hasErrors ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            Add-ons need valid labels, non-overlapping rule windows, and the
            required pricing fields before they can be saved.
          </p>
        ) : null}

        {forms.length === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-6 text-sm text-muted-foreground">
            No add-ons yet. Add one if you want optional upsells or automatic
            fees on top of your base coaching rate.
          </p>
        ) : (
          <div className="space-y-4">
            {forms.map((addon, addonIndex) => {
              const addonHasOverlap = hasOverlappingRules(addon.rules);
              const addonHasInvalidRule = addon.rules.some(
                (rule) =>
                  timeStringToMinutes(rule.endTime) <=
                  timeStringToMinutes(rule.startTime),
              );
              const addonHasBlankLabel = addon.label.trim().length === 0;
              const addonHasMissingFlatFee =
                addon.pricingType === "FLAT" &&
                addon.flatFee.trim().length === 0;
              const addonHasError =
                addonHasOverlap ||
                addonHasInvalidRule ||
                addonHasBlankLabel ||
                addonHasMissingFlatFee;

              return (
                <div key={addon.id} className="rounded-2xl border p-4">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground">
                        {addon.label.trim() || `Add-on ${addonIndex + 1}`}
                      </h3>
                      <Badge variant={addon.isActive ? "success" : "outline"}>
                        {addon.isActive ? "Active" : "Hidden"}
                      </Badge>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setForms((current) =>
                          current.filter((item) => item.id !== addon.id),
                        )
                      }
                      aria-label="Remove add-on"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Add-on label</Label>
                      <Input
                        value={addon.label}
                        onChange={(event) =>
                          updateAddon(addon.id, (current) => ({
                            ...current,
                            label: event.target.value,
                          }))
                        }
                        className={
                          addonHasBlankLabel ? "border-destructive" : undefined
                        }
                        placeholder="Ball machine, travel fee, video review"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Mode</Label>
                        <Select
                          value={addon.mode}
                          onValueChange={(value) =>
                            updateAddon(addon.id, (current) => ({
                              ...current,
                              mode: value as AddonForm["mode"],
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select mode" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="OPTIONAL">Optional</SelectItem>
                            <SelectItem value="AUTO">Automatic</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Pricing type</Label>
                        <Select
                          value={addon.pricingType}
                          onValueChange={(value) =>
                            updateAddon(addon.id, (current) => ({
                              ...current,
                              pricingType: value as AddonForm["pricingType"],
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="HOURLY">Hourly</SelectItem>
                            <SelectItem value="FLAT">Flat fee</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
                    <div className="space-y-2">
                      <Label className="flex items-center justify-between gap-3">
                        <span>Visible to players</span>
                        <Switch
                          checked={addon.isActive}
                          onCheckedChange={(checked) =>
                            updateAddon(addon.id, (current) => ({
                              ...current,
                              isActive: checked,
                            }))
                          }
                        />
                      </Label>
                      {addon.pricingType === "FLAT" ? (
                        <div className="space-y-2">
                          <Label>Flat fee (PHP)</Label>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={addon.flatFee}
                            onChange={(event) =>
                              updateAddon(addon.id, (current) => ({
                                ...current,
                                flatFee: event.target.value,
                              }))
                            }
                            className={
                              addonHasMissingFlatFee
                                ? "border-destructive"
                                : undefined
                            }
                          />
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-3 rounded-xl border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">
                            Rule windows
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {addon.pricingType === "HOURLY"
                              ? "Each rule sets an hourly surcharge for that window."
                              : "Each rule limits when this flat-fee add-on applies."}
                          </p>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateAddon(addon.id, (current) => ({
                              ...current,
                              rules: [...current.rules, createDefaultRule()],
                            }))
                          }
                        >
                          <Plus className="mr-2 size-4" />
                          Add rule
                        </Button>
                      </div>

                      {addon.rules.map((rule) => {
                        const hasInvalidRange =
                          timeStringToMinutes(rule.endTime) <=
                          timeStringToMinutes(rule.startTime);

                        return (
                          <div key={rule.id} className="rounded-xl border p-3">
                            <div className="grid gap-3 md:grid-cols-[minmax(0,170px)_130px_130px_150px_auto] md:items-end">
                              <div className="space-y-2">
                                <Label>Day</Label>
                                <Select
                                  value={String(rule.dayOfWeek)}
                                  onValueChange={(value) =>
                                    updateAddon(addon.id, (current) => ({
                                      ...current,
                                      rules: current.rules.map((currentRule) =>
                                        currentRule.id === rule.id
                                          ? {
                                              ...currentRule,
                                              dayOfWeek: Number(value),
                                            }
                                          : currentRule,
                                      ),
                                    }))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select day" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {COACH_DAY_OPTIONS.map((option) => (
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
                                  value={rule.startTime}
                                  onChange={(event) =>
                                    updateAddon(addon.id, (current) => ({
                                      ...current,
                                      rules: current.rules.map((currentRule) =>
                                        currentRule.id === rule.id
                                          ? {
                                              ...currentRule,
                                              startTime: event.target.value,
                                            }
                                          : currentRule,
                                      ),
                                    }))
                                  }
                                  className={
                                    hasInvalidRange
                                      ? "border-destructive"
                                      : undefined
                                  }
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>End</Label>
                                <Input
                                  type="time"
                                  value={rule.endTime}
                                  onChange={(event) =>
                                    updateAddon(addon.id, (current) => ({
                                      ...current,
                                      rules: current.rules.map((currentRule) =>
                                        currentRule.id === rule.id
                                          ? {
                                              ...currentRule,
                                              endTime: event.target.value,
                                            }
                                          : currentRule,
                                      ),
                                    }))
                                  }
                                  className={
                                    hasInvalidRange
                                      ? "border-destructive"
                                      : undefined
                                  }
                                />
                              </div>

                              {addon.pricingType === "HOURLY" ? (
                                <div className="space-y-2">
                                  <Label>Hourly add-on (PHP)</Label>
                                  <Input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={rule.hourlyRate}
                                    onChange={(event) =>
                                      updateAddon(addon.id, (current) => ({
                                        ...current,
                                        rules: current.rules.map(
                                          (currentRule) =>
                                            currentRule.id === rule.id
                                              ? {
                                                  ...currentRule,
                                                  hourlyRate:
                                                    event.target.value,
                                                }
                                              : currentRule,
                                        ),
                                      }))
                                    }
                                  />
                                </div>
                              ) : (
                                <div className="self-end text-sm text-muted-foreground">
                                  Applies without an hourly surcharge.
                                </div>
                              )}

                              <div className="flex justify-end">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    updateAddon(addon.id, (current) => ({
                                      ...current,
                                      rules: current.rules.filter(
                                        (currentRule) =>
                                          currentRule.id !== rule.id,
                                      ),
                                    }))
                                  }
                                  aria-label="Remove add-on rule"
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {addonHasOverlap ? (
                        <p className="text-sm text-destructive">
                          One or more {addon.label || "add-on"} windows overlap
                          on the same day.
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {addonHasError ? (
                    <p className="mt-4 text-sm text-destructive">
                      {addonHasBlankLabel
                        ? "Add a label so players can understand this add-on."
                        : addonHasMissingFlatFee
                          ? "Flat-fee add-ons require a price."
                          : addonHasInvalidRule
                            ? "Each rule end time must be after its start time."
                            : "Rule windows cannot overlap on the same day."}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setForms((current) => [...current, createDefaultAddon()])
            }
          >
            <Plus className="mr-2 size-4" />
            Add add-on
          </Button>

          <Button
            type="button"
            onClick={handleSave}
            disabled={saveAddons.isPending}
          >
            {saveAddons.isPending ? (
              <Spinner className="mr-2 size-4 text-current" />
            ) : null}
            Save add-ons
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
