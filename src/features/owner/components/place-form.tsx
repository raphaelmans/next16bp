"use client";

import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
import { env } from "@/lib/env";
import { cn } from "@/lib/utils";
import {
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

interface CountryOption {
  name: string;
  cca2: string;
}

interface CountriesResponse {
  data: CountryOption[];
}

interface GoogleLocResult {
  inputUrl: string;
  resolvedUrl?: string;
  suggestedName?: string;
  lat?: number;
  lng?: number;
  zoom?: number;
  source?: "marker" | "center";
  embedSrc?: string;
  warnings: string[];
}

const DEFAULT_COUNTRY = "PH";
const SAMPLE_GOOGLE_URL = "https://maps.app.goo.gl/6AGA5vZkzKazGswRA";

export function PlaceForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  isEditing = false,
}: PlaceFormProps) {
  const hasEmbedKey = Boolean(env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY);

  const [name, setName] = useState(defaultValues?.name ?? "");
  const [address, setAddress] = useState(defaultValues?.address ?? "");
  const [city, setCity] = useState(defaultValues?.city ?? "");
  const [province, setProvince] = useState(defaultValues?.province ?? "");
  const [country, setCountry] = useState(
    defaultValues?.country ?? DEFAULT_COUNTRY,
  );
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

  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [isCountriesLoading, setIsCountriesLoading] = useState(false);
  const [countriesError, setCountriesError] = useState<string | null>(null);
  const [isCountryOpen, setIsCountryOpen] = useState(false);

  const [googleUrl, setGoogleUrl] = useState("");
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<GoogleLocResult | null>(
    null,
  );

  useEffect(() => {
    if (!defaultValues) return;
    setName(defaultValues.name ?? "");
    setAddress(defaultValues.address ?? "");
    setCity(defaultValues.city ?? "");
    setProvince(defaultValues.province ?? "");
    setCountry(defaultValues.country ?? DEFAULT_COUNTRY);
    setLatitude(defaultValues.latitude ?? "");
    setLongitude(defaultValues.longitude ?? "");
    setTimeZone(defaultValues.timeZone ?? "Asia/Manila");
    setIsActive(defaultValues.isActive ?? true);
  }, [defaultValues]);

  useEffect(() => {
    const controller = new AbortController();

    const loadCountries = async () => {
      setIsCountriesLoading(true);
      setCountriesError(null);

      try {
        const response = await fetch("/api/public/countries", {
          signal: controller.signal,
        });
        const payload = (await response.json()) as CountriesResponse;

        if (!response.ok) {
          throw new Error("Failed to load countries");
        }

        if (!payload?.data) {
          throw new Error("Invalid countries response");
        }

        setCountries(payload.data);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setCountriesError(
          error instanceof Error ? error.message : "Unable to load countries",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsCountriesLoading(false);
        }
      }
    };

    loadCountries();

    return () => controller.abort();
  }, []);

  const selectedCountry = useMemo(
    () => countries.find((item) => item.cca2 === country),
    [countries, country],
  );

  const countryLabel = selectedCountry
    ? `${selectedCountry.name} (${selectedCountry.cca2})`
    : country || "Select a country";

  const coordinateLabel = useMemo(() => {
    if (previewResult?.lat === undefined || previewResult?.lng === undefined) {
      return "";
    }
    return `${previewResult.lat.toFixed(6)}, ${previewResult.lng.toFixed(6)}`;
  }, [previewResult?.lat, previewResult?.lng]);

  const canSubmit =
    name.trim().length > 0 &&
    address.trim().length > 0 &&
    city.trim().length > 0 &&
    country.trim().length > 0;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    const normalizedCountry = country.trim().toUpperCase();
    const trimmedProvince = province.trim();

    const data: PlaceFormData = {
      name: name.trim(),
      address: address.trim(),
      city: city.trim(),
      country: normalizedCountry,
      timeZone,
      isActive,
    };

    if (trimmedProvince.length > 0) {
      data.province = trimmedProvince;
    }

    if (latitude !== "") {
      data.latitude = Number(latitude);
    }

    if (longitude !== "") {
      data.longitude = Number(longitude);
    }

    onSubmit(data);
  };

  const handlePreview = async () => {
    setPreviewError(null);
    setIsPreviewing(true);
    setPreviewResult(null);

    try {
      const response = await fetch("/api/poc/google-loc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: googleUrl }),
      });

      const json = (await response.json()) as
        | GoogleLocResult
        | { error?: string };

      if (!response.ok) {
        setPreviewError(
          "error" in json && typeof json.error === "string"
            ? json.error
            : "Request failed",
        );
      }

      if ("warnings" in json) {
        setPreviewResult(json);
        if (json.suggestedName) {
          setName((current) =>
            current.trim().length > 0
              ? current
              : (json.suggestedName ?? current),
          );
        }
        if (json.lat !== undefined) {
          setLatitude(json.lat);
        }
        if (json.lng !== undefined) {
          setLongitude(json.lng);
        }
      }
    } catch (error) {
      setPreviewError(
        error instanceof Error ? error.message : "Request failed",
      );
    } finally {
      setIsPreviewing(false);
    }
  };

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
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="e.g., Cebu City"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="province">Province / State</Label>
              <Input
                id="province"
                value={province}
                onChange={(event) => setProvince(event.target.value)}
                placeholder="e.g., Cebu"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Popover open={isCountryOpen} onOpenChange={setIsCountryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    id="country"
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                    aria-expanded={isCountryOpen}
                  >
                    <span className="truncate text-left">{countryLabel}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Search country..." />
                    <CommandList>
                      {isCountriesLoading ? (
                        <CommandEmpty>Loading countries...</CommandEmpty>
                      ) : countries.length === 0 ? (
                        <CommandEmpty>No countries found.</CommandEmpty>
                      ) : (
                        countries.map((item) => (
                          <CommandItem
                            key={item.cca2}
                            value={`${item.name} ${item.cca2}`}
                            onSelect={() => {
                              setCountry(item.cca2);
                              setIsCountryOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                item.cca2 === country
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            <span className="flex-1 truncate">{item.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {item.cca2}
                            </span>
                          </CommandItem>
                        ))
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {countriesError && (
                <p className="text-xs text-destructive">{countriesError}</p>
              )}
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

      <Card>
        <CardHeader>
          <CardTitle>Map (optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Paste a Google Maps link to auto-fill coordinates. Address and city
            still require confirmation.
          </p>

          <div className="space-y-2">
            <Label htmlFor="googleUrl">Google Maps URL</Label>
            <Input
              id="googleUrl"
              value={googleUrl}
              onChange={(event) => setGoogleUrl(event.target.value)}
              placeholder={SAMPLE_GOOGLE_URL}
              inputMode="url"
            />
            {hasEmbedKey ? null : (
              <p className="text-xs text-muted-foreground">
                Embed previews are disabled until a Google Maps key is
                configured.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Example: {SAMPLE_GOOGLE_URL}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handlePreview}
            disabled={googleUrl.trim().length === 0 || isPreviewing}
            className="w-full"
          >
            {isPreviewing ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Resolving…
              </span>
            ) : (
              "Preview"
            )}
          </Button>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude (optional)</Label>
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
              <Label htmlFor="longitude">Longitude (optional)</Label>
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

          {previewError && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              {previewError}
            </div>
          )}

          {previewResult && (
            <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">
                    Resolved URL
                  </div>
                  {previewResult.resolvedUrl ? (
                    <a
                      href={previewResult.resolvedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all text-accent hover:underline"
                    >
                      {previewResult.resolvedUrl}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">(none)</span>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Suggested name
                    </div>
                    <div>{previewResult.suggestedName ?? "(none)"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Coordinates
                    </div>
                    <div>
                      {coordinateLabel ? (
                        <span className="font-mono">{coordinateLabel}</span>
                      ) : (
                        "(none)"
                      )}
                      {previewResult.zoom !== undefined && (
                        <span className="text-muted-foreground">
                          {` · z${previewResult.zoom}`}
                        </span>
                      )}
                      {previewResult.source && (
                        <span className="text-muted-foreground">
                          {` · ${previewResult.source}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {previewResult.warnings.length > 0 && (
                <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
                  <div className="text-xs font-medium">Warnings</div>
                  <ul className="mt-1 list-disc pl-5 text-xs text-muted-foreground">
                    {previewResult.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {previewResult.embedSrc ? (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Embed preview</div>
                  <div className="aspect-video overflow-hidden rounded-xl border border-border/60 bg-muted">
                    <iframe
                      title="Google Maps Embed"
                      src={previewResult.embedSrc}
                      className="h-full w-full"
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-border/60 bg-muted/40 p-3 text-sm text-muted-foreground">
                  {hasEmbedKey
                    ? "No embed preview available for this link."
                    : "Embed preview unavailable (missing Google Maps key)."}
                </div>
              )}
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
