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
import {
  PLACE_CITIES,
  PLACE_TIME_ZONES,
  type PlaceFormData,
} from "../schemas/place-form.schema";

interface PlaceFormProps {
  defaultValues?: Partial<PlaceFormData>;
  onSubmit: (data: PlaceFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  isEditing?: boolean;
}

export function PlaceForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  isEditing = false,
}: PlaceFormProps) {
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [address, setAddress] = useState(defaultValues?.address ?? "");
  const [city, setCity] = useState(defaultValues?.city ?? "");
  const [latitude, setLatitude] = useState<number | "">(
    defaultValues?.latitude ?? "",
  );
  const [longitude, setLongitude] = useState<number | "">(
    defaultValues?.longitude ?? "",
  );
  const [timeZone, setTimeZone] = useState(
    defaultValues?.timeZone ?? "Asia/Manila",
  );
  const [isActive, setIsActive] = useState(defaultValues?.isActive ?? true);

  useEffect(() => {
    if (!defaultValues) return;
    setName(defaultValues.name ?? "");
    setAddress(defaultValues.address ?? "");
    setCity(defaultValues.city ?? "");
    setLatitude(defaultValues.latitude ?? "");
    setLongitude(defaultValues.longitude ?? "");
    setTimeZone(defaultValues.timeZone ?? "Asia/Manila");
    setIsActive(defaultValues.isActive ?? true);
  }, [defaultValues]);

  const canSubmit =
    name.trim().length > 0 &&
    address.trim().length > 0 &&
    city.trim().length > 0 &&
    latitude !== "" &&
    longitude !== "";

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    onSubmit({
      name: name.trim(),
      address: address.trim(),
      city,
      latitude: Number(latitude),
      longitude: Number(longitude),
      timeZone,
      isActive,
    });
  };

  const cityHelper = useMemo(
    () => "Select the primary city for this place.",
    [],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Place Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Place Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g., Kudos Sports Complex"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Street Address</Label>
            <Input
              id="address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="e.g., 123 Sports Avenue"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>City</Label>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger>
                <SelectValue placeholder="Select a city" />
              </SelectTrigger>
              <SelectContent>
                {PLACE_CITIES.map((placeCity) => (
                  <SelectItem key={placeCity} value={placeCity}>
                    {placeCity}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{cityHelper}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={latitude}
                onChange={(event) =>
                  setLatitude(
                    event.target.value ? Number(event.target.value) : "",
                  )
                }
                placeholder="e.g., 14.5547"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={longitude}
                onChange={(event) =>
                  setLongitude(
                    event.target.value ? Number(event.target.value) : "",
                  )
                }
                placeholder="e.g., 121.0244"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Time Zone</Label>
            <Select value={timeZone} onValueChange={setTimeZone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLACE_TIME_ZONES.map((zone) => (
                  <SelectItem key={zone} value={zone}>
                    {zone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isEditing && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={isActive}
                onCheckedChange={(value) => setIsActive(value === true)}
              />
              <Label htmlFor="isActive" className="font-normal">
                Place is active
              </Label>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!canSubmit || isSubmitting}>
          {isSubmitting
            ? isEditing
              ? "Saving..."
              : "Creating..."
            : isEditing
              ? "Save Changes"
              : "Create Place"}
        </Button>
      </div>
    </form>
  );
}
