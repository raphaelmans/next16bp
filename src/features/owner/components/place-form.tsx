"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import {
  StandardFormCheckbox,
  StandardFormField,
  StandardFormInput,
  StandardFormProvider,
  StandardFormSelect,
} from "@/components/form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { env } from "@/lib/env";
import { cn } from "@/lib/utils";
import { useGoogleLocPreviewMutation } from "@/shared/lib/clients/google-loc-client";
import { getClientErrorMessage } from "@/shared/lib/toast-errors";
import {
  defaultPlaceFormValues,
  PLACE_TIME_ZONES,
  type PlaceFormData,
  placeFormSchema,
} from "../schemas/place-form.schema";

type PlaceFormValues = z.input<typeof placeFormSchema>;

interface PlaceFormProps {
  defaultValues?: Partial<PlaceFormValues>;
  onSubmit: (data: PlaceFormData) => Promise<void> | void;
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

const DEFAULT_COUNTRY = "PH";
const SAMPLE_GOOGLE_URL = "https://maps.app.goo.gl/6AGA5vZkzKazGswRA";

const buildFormDefaults = (
  values?: Partial<PlaceFormValues>,
): PlaceFormValues => ({
  name: values?.name ?? "",
  address: values?.address ?? "",
  city: values?.city ?? "",
  province: values?.province ?? "",
  country: values?.country ?? defaultPlaceFormValues.country ?? DEFAULT_COUNTRY,
  latitude: values?.latitude,
  longitude: values?.longitude,
  timeZone:
    values?.timeZone ?? defaultPlaceFormValues.timeZone ?? "Asia/Manila",
  isActive: values?.isActive ?? defaultPlaceFormValues.isActive ?? true,
  websiteUrl: values?.websiteUrl ?? "",
  facebookUrl: values?.facebookUrl ?? "",
  instagramUrl: values?.instagramUrl ?? "",
  viberInfo: values?.viberInfo ?? "",
  otherContactInfo: values?.otherContactInfo ?? "",
});

const normalizeFormValues = (values: PlaceFormValues): PlaceFormData => ({
  name: values.name.trim(),
  address: values.address.trim(),
  city: values.city.trim(),
  country: (values.country ?? DEFAULT_COUNTRY).trim().toUpperCase(),
  province: values.province?.trim() ? values.province.trim() : undefined,
  latitude:
    values.latitude === undefined || Number.isNaN(values.latitude)
      ? undefined
      : values.latitude,
  longitude:
    values.longitude === undefined || Number.isNaN(values.longitude)
      ? undefined
      : values.longitude,
  timeZone: values.timeZone ?? defaultPlaceFormValues.timeZone ?? "Asia/Manila",
  isActive: values.isActive ?? defaultPlaceFormValues.isActive ?? true,
  websiteUrl: values.websiteUrl?.trim() ? values.websiteUrl.trim() : undefined,
  facebookUrl: values.facebookUrl?.trim()
    ? values.facebookUrl.trim()
    : undefined,
  instagramUrl: values.instagramUrl?.trim()
    ? values.instagramUrl.trim()
    : undefined,
  viberInfo: values.viberInfo?.trim() ? values.viberInfo.trim() : undefined,
  otherContactInfo: values.otherContactInfo?.trim()
    ? values.otherContactInfo.trim()
    : undefined,
});

export function PlaceForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  isEditing = false,
}: PlaceFormProps) {
  const hasEmbedKey = Boolean(env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY);

  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [isCountriesLoading, setIsCountriesLoading] = useState(false);
  const [countriesError, setCountriesError] = useState<string | null>(null);
  const [isCountryOpen, setIsCountryOpen] = useState(false);

  const [googleUrl, setGoogleUrl] = useState("");

  const resolvedDefaults = useMemo(
    () => buildFormDefaults(defaultValues),
    [defaultValues],
  );

  const form = useForm<PlaceFormValues>({
    resolver: zodResolver(placeFormSchema),
    mode: "onChange",
    defaultValues: resolvedDefaults,
  });

  const {
    control,
    reset,
    setValue,
    formState: { isDirty, isSubmitting: formSubmitting, isValid },
  } = form;

  const countryValue = useWatch({ control, name: "country" });
  const nameValue = useWatch({ control, name: "name" });

  const previewMutation = useGoogleLocPreviewMutation({
    onSuccess: (data) => {
      if (data.suggestedName && !nameValue.trim()) {
        setValue("name", data.suggestedName, {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        });
      }

      if (data.lat !== undefined) {
        setValue("latitude", data.lat, {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        });
      }

      if (data.lng !== undefined) {
        setValue("longitude", data.lng, {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        });
      }
    },
  });

  const previewResult = previewMutation.data;
  const previewError = previewMutation.error;
  const previewErrorMessage = previewError
    ? getClientErrorMessage(previewError, "Request failed")
    : null;
  const isPreviewing = previewMutation.isPending;

  useEffect(() => {
    if (!defaultValues) return;
    if (isDirty) return;
    reset(resolvedDefaults);
  }, [defaultValues, isDirty, reset, resolvedDefaults]);

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
    () => countries.find((item) => item.cca2 === countryValue),
    [countries, countryValue],
  );

  const countryLabel = selectedCountry
    ? `${selectedCountry.name} (${selectedCountry.cca2})`
    : countryValue || "Select a country";

  const coordinateLabel = useMemo(() => {
    if (previewResult?.lat === undefined || previewResult?.lng === undefined) {
      return "";
    }
    return `${previewResult.lat.toFixed(6)}, ${previewResult.lng.toFixed(6)}`;
  }, [previewResult?.lat, previewResult?.lng]);

  const timeZoneOptions = useMemo(
    () => PLACE_TIME_ZONES.map((zone) => ({ label: zone, value: zone })),
    [],
  );

  const handleSubmit = async (values: PlaceFormValues) => {
    const normalized = normalizeFormValues(values);

    try {
      await onSubmit(normalized);
      reset(buildFormDefaults(normalized));
    } catch (error) {
      toast.error(
        isEditing ? "Unable to save place" : "Unable to create place",
        {
          description: getClientErrorMessage(error, "Please try again"),
        },
      );
    }
  };

  const handlePreview = () => {
    if (!googleUrl.trim()) return;
    previewMutation.reset();
    previewMutation.mutate({ url: googleUrl });
  };

  const submitting = Boolean(isSubmitting || formSubmitting);
  const isSubmitDisabled = submitting || !isValid || !isDirty;

  return (
    <StandardFormProvider<PlaceFormValues>
      form={form}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle>Place Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <StandardFormInput<PlaceFormValues>
            name="name"
            label="Place Name"
            placeholder="e.g., Kudos Sports Complex"
            required
          />

          <StandardFormInput<PlaceFormValues>
            name="address"
            label="Street Address"
            placeholder="e.g., 123 Sports Avenue"
            required
          />

          <StandardFormInput<PlaceFormValues>
            name="city"
            label="City"
            placeholder="e.g., Cebu City"
            required
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <StandardFormInput<PlaceFormValues>
              name="province"
              label="Province / State"
              placeholder="e.g., Cebu"
            />

            <StandardFormField<PlaceFormValues>
              name="country"
              label="Country"
              required
            >
              {({ field }) => (
                <div className="space-y-2">
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
                        <span className="truncate text-left">
                          {countryLabel}
                        </span>
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
                                  field.onChange(item.cca2);
                                  setIsCountryOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    item.cca2 === field.value
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                <span className="flex-1 truncate">
                                  {item.name}
                                </span>
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
              )}
            </StandardFormField>
          </div>

          <StandardFormSelect<PlaceFormValues>
            name="timeZone"
            label="Time Zone"
            options={timeZoneOptions}
            placeholder="Select a time zone"
            required
          />

          {isEditing && (
            <StandardFormCheckbox<PlaceFormValues>
              name="isActive"
              label="Place is active"
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <StandardFormInput<PlaceFormValues>
              name="websiteUrl"
              label="Website"
              placeholder="https://example.com"
            />
            <StandardFormInput<PlaceFormValues>
              name="facebookUrl"
              label="Facebook"
              placeholder="https://facebook.com/..."
            />
            <StandardFormInput<PlaceFormValues>
              name="instagramUrl"
              label="Instagram"
              placeholder="https://instagram.com/..."
            />
            <StandardFormInput<PlaceFormValues>
              name="viberInfo"
              label="Viber Info"
              placeholder="0917 123 4567"
            />
          </div>

          <StandardFormField<PlaceFormValues>
            name="otherContactInfo"
            label="Other Contact Info"
          >
            {({ field }) => (
              <Textarea
                rows={3}
                placeholder="Any additional contact details..."
                value={typeof field.value === "string" ? field.value : ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
              />
            )}
          </StandardFormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Map (optional)</CardTitle>
          <CardDescription>
            Paste a Google Maps link to auto-fill coordinates. Address and city
            still require confirmation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
            <StandardFormField<PlaceFormValues>
              name="latitude"
              label="Latitude (optional)"
            >
              {({ field }) => (
                <Input
                  type="number"
                  step="any"
                  value={typeof field.value === "number" ? field.value : ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (!value) {
                      field.onChange(undefined);
                      return;
                    }
                    const parsed = Number(value);
                    field.onChange(Number.isNaN(parsed) ? undefined : parsed);
                  }}
                  placeholder="e.g., 14.5547"
                />
              )}
            </StandardFormField>

            <StandardFormField<PlaceFormValues>
              name="longitude"
              label="Longitude (optional)"
            >
              {({ field }) => (
                <Input
                  type="number"
                  step="any"
                  value={typeof field.value === "number" ? field.value : ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (!value) {
                      field.onChange(undefined);
                      return;
                    }
                    const parsed = Number(value);
                    field.onChange(Number.isNaN(parsed) ? undefined : parsed);
                  }}
                  placeholder="e.g., 121.0244"
                />
              )}
            </StandardFormField>
          </div>

          {previewErrorMessage && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              {previewErrorMessage}
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
                    {previewResult.warnings.map((warning: string) => (
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
        <Button type="submit" disabled={isSubmitDisabled}>
          {submitting
            ? isEditing
              ? "Saving..."
              : "Creating..."
            : isEditing
              ? "Save Changes"
              : "Create Place"}
        </Button>
      </div>
    </StandardFormProvider>
  );
}
