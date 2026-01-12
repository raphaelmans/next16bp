"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CourtFormData } from "../schemas/court-form.schema";

interface CourtFormProps {
  defaultValues?: Partial<CourtFormData>;
  placeOptions: { id: string; name: string; city: string }[];
  sportOptions: { id: string; name: string }[];
  onSubmit: (data: CourtFormData) => void;
  onSaveDraft?: (data: Partial<CourtFormData>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  isEditing?: boolean;
  disablePlaceSelect?: boolean;
}

export function CourtForm({
  defaultValues,
  placeOptions,
  sportOptions,
  onSubmit,
  onSaveDraft,
  onCancel,
  isSubmitting = false,
  isEditing = false,
  disablePlaceSelect = false,
}: CourtFormProps) {
  const [placeId, setPlaceId] = useState(defaultValues?.placeId ?? "");
  const [sportId, setSportId] = useState(defaultValues?.sportId ?? "");
  const [label, setLabel] = useState(defaultValues?.label ?? "");
  const [tierLabel, setTierLabel] = useState(defaultValues?.tierLabel ?? "");
  const [isActive, setIsActive] = useState(defaultValues?.isActive ?? true);

  useEffect(() => {
    if (!defaultValues) return;
    setPlaceId(defaultValues.placeId ?? "");
    setSportId(defaultValues.sportId ?? "");
    setLabel(defaultValues.label ?? "");
    setTierLabel(defaultValues.tierLabel ?? "");
    setIsActive(defaultValues.isActive ?? true);
  }, [defaultValues]);

  useEffect(() => {
    if (!placeId && placeOptions.length > 0) {
      setPlaceId(placeOptions[0].id);
    }
  }, [placeId, placeOptions]);

  useEffect(() => {
    if (!sportId && sportOptions.length > 0) {
      setSportId(sportOptions[0].id);
    }
  }, [sportId, sportOptions]);

  const trimmedLabel = label.trim();
  const trimmedTier = tierLabel.trim();

  const canSubmit =
    placeId.length > 0 && sportId.length > 0 && trimmedLabel.length > 0;

  const placeHelper = useMemo(() => {
    if (placeOptions.length === 0) {
      return "Create a place first to add courts.";
    }
    return "Select the place where this court belongs.";
  }, [placeOptions.length]);

  const sportHelper = useMemo(() => {
    if (sportOptions.length === 0) {
      return "Add a sport before creating courts.";
    }
    return "Choose the sport for this court.";
  }, [sportOptions.length]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!canSubmit) return;

    onSubmit({
      placeId,
      sportId,
      label: trimmedLabel,
      tierLabel: trimmedTier.length > 0 ? trimmedTier : null,
      isActive,
    });
  };

  const handleSaveDraft = () => {
    onSaveDraft?.({
      placeId,
      sportId,
      label: trimmedLabel,
      tierLabel: trimmedTier.length > 0 ? trimmedTier : null,
      isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Court Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Place</Label>
            <Select
              value={placeId}
              onValueChange={setPlaceId}
              disabled={
                isEditing || disablePlaceSelect || placeOptions.length === 0
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a place" />
              </SelectTrigger>
              <SelectContent>
                {placeOptions.map((place) => (
                  <SelectItem key={place.id} value={place.id}>
                    {place.name} · {place.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{placeHelper}</p>
          </div>

          <div className="space-y-2">
            <Label>Sport</Label>
            <Select
              value={sportId}
              onValueChange={setSportId}
              disabled={sportOptions.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a sport" />
              </SelectTrigger>
              <SelectContent>
                {sportOptions.map((sport) => (
                  <SelectItem key={sport.id} value={sport.id}>
                    {sport.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{sportHelper}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="label">Court Label</Label>
            <Input
              id="label"
              placeholder="e.g., Court A"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tierLabel">Tier Label</Label>
            <Input
              id="tierLabel"
              placeholder="e.g., Premium"
              value={tierLabel}
              onChange={(event) => setTierLabel(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Optional label to distinguish premium or standard courts.
            </p>
          </div>

          {isEditing && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={isActive}
                onCheckedChange={(value) => setIsActive(value === true)}
              />
              <Label htmlFor="isActive" className="font-normal">
                Court is active
              </Label>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          {onSaveDraft && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleSaveDraft}
              disabled={isSubmitting}
            >
              Save as Draft
            </Button>
          )}
          <Button type="submit" disabled={!canSubmit || isSubmitting}>
            {isSubmitting
              ? isEditing
                ? "Saving..."
                : "Creating..."
              : isEditing
                ? "Save Changes"
                : "Create Court"}
          </Button>
        </div>
      </div>
    </form>
  );
}
