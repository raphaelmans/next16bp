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
import {
  mapCourtAddonConfigsToForms,
  mapCourtAddonFormsToSetPayload,
} from "@/features/court-addons/helpers";
import type {
  CourtAddonForm,
  CourtAddonRuleForm,
} from "@/features/court-addons/schemas";
import {
  useMutOwnerSaveCourtAddons,
  useQueryOwnerCourtAddons,
} from "@/features/owner/hooks";

const DAY_OPTIONS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
] as const;

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

function createDefaultRule(): CourtAddonRuleForm {
  return {
    dayOfWeek: 1,
    startMinute: 540,
    endMinute: 600,
    hourlyRateCents: 0,
    currency: "PHP",
  };
}

function createDefaultAddon(displayOrder: number): CourtAddonForm {
  return {
    label: "",
    isActive: true,
    mode: "OPTIONAL",
    pricingType: "HOURLY",
    displayOrder,
    rules: [createDefaultRule()],
  };
}

function hasOverlappingRules(addon: CourtAddonForm) {
  const byDay = new Map<number, CourtAddonRuleForm[]>();
  for (const rule of addon.rules) {
    const current = byDay.get(rule.dayOfWeek) ?? [];
    byDay.set(rule.dayOfWeek, [...current, rule]);
  }

  for (const dayRules of byDay.values()) {
    const sorted = [...dayRules].sort((a, b) => a.startMinute - b.startMinute);
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

type CourtAddonEditorProps = {
  courtId: string;
};

export function CourtAddonEditor({ courtId }: CourtAddonEditorProps) {
  const { data, isLoading } = useQueryOwnerCourtAddons(courtId, {
    enabled: !!courtId,
  });
  const saveMutation = useMutOwnerSaveCourtAddons(courtId);

  const [addons, setAddons] = React.useState<CourtAddonForm[]>([]);

  React.useEffect(() => {
    if (!data) return;
    setAddons(mapCourtAddonConfigsToForms(data));
  }, [data]);

  const hasBlockingIssues = React.useMemo(
    () =>
      addons.some(
        (addon) =>
          addon.label.trim().length === 0 ||
          addon.rules.some((rule) => rule.startMinute >= rule.endMinute) ||
          hasOverlappingRules(addon),
      ),
    [addons],
  );

  const handleAddAddon = React.useCallback(() => {
    setAddons((prev) => [...prev, createDefaultAddon(prev.length)]);
  }, []);

  const handleSave = React.useCallback(async () => {
    if (hasBlockingIssues) {
      toast.error("Resolve add-on validation issues before saving.");
      return;
    }

    await saveMutation.mutateAsync(
      mapCourtAddonFormsToSetPayload(courtId, addons),
    );
    toast.success("Add-ons saved");
  }, [addons, courtId, hasBlockingIssues, saveMutation]);

  if (isLoading) {
    return (
      <div className="flex min-h-[140px] items-center justify-center rounded-lg border">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle>Add-ons</CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure optional or auto-applied extras for this court.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasBlockingIssues && (
          <Alert variant="destructive">
            <AlertTitle>Fix add-on validation issues</AlertTitle>
            <AlertDescription>
              Check empty labels, invalid time ranges, and overlapping rule
              windows.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={handleAddAddon}>
            <Plus className="mr-2 h-4 w-4" />
            Add add-on
          </Button>
          <Badge variant="secondary">{addons.length} configured</Badge>
        </div>

        {addons.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No add-ons configured yet. Add one to enable extras during booking.
          </p>
        ) : (
          <div className="space-y-4">
            {addons.map((addon, addonIndex) => (
              <div
                key={`${addon.id ?? "new"}-${addonIndex}`}
                className="rounded-md border p-3"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Label</Label>
                    <Input
                      value={addon.label}
                      onChange={(event) => {
                        const value = event.target.value;
                        setAddons((prev) =>
                          prev.map((item, index) =>
                            index === addonIndex
                              ? { ...item, label: value }
                              : item,
                          ),
                        );
                      }}
                    />
                  </div>

                  <div className="flex items-end gap-2">
                    <div className="space-y-1 flex-1">
                      <Label>Mode</Label>
                      <Select
                        value={addon.mode}
                        onValueChange={(value: "OPTIONAL" | "AUTO") => {
                          setAddons((prev) =>
                            prev.map((item, index) =>
                              index === addonIndex
                                ? { ...item, mode: value }
                                : item,
                            ),
                          );
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OPTIONAL">Optional</SelectItem>
                          <SelectItem value="AUTO">Auto-applied</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2 pb-2">
                      <Switch
                        checked={addon.isActive}
                        onCheckedChange={(checked) => {
                          setAddons((prev) =>
                            prev.map((item, index) =>
                              index === addonIndex
                                ? { ...item, isActive: checked }
                                : item,
                            ),
                          );
                        }}
                      />
                      <span className="text-xs text-muted-foreground">
                        Active
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Pricing type</Label>
                    <Select
                      value={addon.pricingType}
                      onValueChange={(value: "HOURLY" | "FLAT") => {
                        setAddons((prev) =>
                          prev.map((item, index) =>
                            index === addonIndex
                              ? {
                                  ...item,
                                  pricingType: value,
                                  flatFeeCents:
                                    value === "FLAT"
                                      ? (item.flatFeeCents ?? 0)
                                      : null,
                                  flatFeeCurrency:
                                    value === "FLAT"
                                      ? (item.flatFeeCurrency ?? "PHP")
                                      : null,
                                }
                              : item,
                          ),
                        );
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HOURLY">Hourly add-on</SelectItem>
                        <SelectItem value="FLAT">Flat add-on</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {addon.pricingType === "FLAT" ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label>Flat fee</Label>
                        <Input
                          type="number"
                          min={0}
                          value={addon.flatFeeCents ?? 0}
                          onChange={(event) => {
                            const value = Number(event.target.value);
                            setAddons((prev) =>
                              prev.map((item, index) =>
                                index === addonIndex
                                  ? {
                                      ...item,
                                      flatFeeCents: Number.isFinite(value)
                                        ? value
                                        : 0,
                                    }
                                  : item,
                              ),
                            );
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Currency</Label>
                        <Input
                          value={addon.flatFeeCurrency ?? "PHP"}
                          onChange={(event) => {
                            const value = event.target.value.toUpperCase();
                            setAddons((prev) =>
                              prev.map((item, index) =>
                                index === addonIndex
                                  ? { ...item, flatFeeCurrency: value }
                                  : item,
                              ),
                            );
                          }}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">Rule windows</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setAddons((prev) =>
                          prev.map((item, index) =>
                            index === addonIndex
                              ? {
                                  ...item,
                                  rules: [...item.rules, createDefaultRule()],
                                }
                              : item,
                          ),
                        );
                      }}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Rule
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {addon.rules.map((rule, ruleIndex) => (
                      <div
                        key={`${rule.dayOfWeek}-${rule.startMinute}-${rule.endMinute}`}
                        className="grid gap-2 rounded border p-2 md:grid-cols-5"
                      >
                        <Select
                          value={String(rule.dayOfWeek)}
                          onValueChange={(value) => {
                            setAddons((prev) =>
                              prev.map((item, index) =>
                                index === addonIndex
                                  ? {
                                      ...item,
                                      rules: item.rules.map(
                                        (itemRule, indexRule) =>
                                          indexRule === ruleIndex
                                            ? {
                                                ...itemRule,
                                                dayOfWeek: Number(value),
                                              }
                                            : itemRule,
                                      ),
                                    }
                                  : item,
                              ),
                            );
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DAY_OPTIONS.map((day) => (
                              <SelectItem
                                key={day.value}
                                value={String(day.value)}
                              >
                                {day.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="time"
                          value={minuteToTime(rule.startMinute)}
                          onChange={(event) => {
                            const nextMinute = timeToMinute(event.target.value);
                            setAddons((prev) =>
                              prev.map((item, index) =>
                                index === addonIndex
                                  ? {
                                      ...item,
                                      rules: item.rules.map(
                                        (itemRule, indexRule) =>
                                          indexRule === ruleIndex
                                            ? {
                                                ...itemRule,
                                                startMinute: nextMinute,
                                              }
                                            : itemRule,
                                      ),
                                    }
                                  : item,
                              ),
                            );
                          }}
                        />
                        <Input
                          type="time"
                          value={minuteToTime(
                            Math.min(1439, rule.endMinute - 1),
                          )}
                          onChange={(event) => {
                            const nextMinute = Math.max(
                              1,
                              Math.min(
                                1440,
                                timeToMinute(event.target.value) + 1,
                              ),
                            );
                            setAddons((prev) =>
                              prev.map((item, index) =>
                                index === addonIndex
                                  ? {
                                      ...item,
                                      rules: item.rules.map(
                                        (itemRule, indexRule) =>
                                          indexRule === ruleIndex
                                            ? {
                                                ...itemRule,
                                                endMinute: nextMinute,
                                              }
                                            : itemRule,
                                      ),
                                    }
                                  : item,
                              ),
                            );
                          }}
                        />
                        {addon.pricingType === "HOURLY" ? (
                          <Input
                            type="number"
                            min={0}
                            placeholder="Hourly cents"
                            value={rule.hourlyRateCents ?? 0}
                            onChange={(event) => {
                              const value = Number(event.target.value);
                              setAddons((prev) =>
                                prev.map((item, index) =>
                                  index === addonIndex
                                    ? {
                                        ...item,
                                        rules: item.rules.map(
                                          (itemRule, indexRule) =>
                                            indexRule === ruleIndex
                                              ? {
                                                  ...itemRule,
                                                  hourlyRateCents:
                                                    Number.isFinite(value)
                                                      ? value
                                                      : 0,
                                                }
                                              : itemRule,
                                        ),
                                      }
                                    : item,
                                ),
                              );
                            }}
                          />
                        ) : (
                          <div className="text-xs text-muted-foreground self-center">
                            Flat pricing
                          </div>
                        )}
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setAddons((prev) =>
                              prev.map((item, index) =>
                                index === addonIndex
                                  ? {
                                      ...item,
                                      rules: item.rules.filter(
                                        (_item, indexRule) =>
                                          indexRule !== ruleIndex,
                                      ),
                                    }
                                  : item,
                              ),
                            );
                          }}
                          aria-label="Remove rule"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setAddons((prev) =>
                        prev.filter((_item, index) => index !== addonIndex),
                      );
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove add-on
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={handleSave}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? "Saving..." : "Save add-ons"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
