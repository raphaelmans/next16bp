"use client";

import { ChevronRight } from "lucide-react";
import { PLACE_AMENITIES } from "@/common/amenities";
import {
  StandardFormCheckbox,
  StandardFormCombobox,
  StandardFormField,
  StandardFormInput,
  StandardFormProvider,
} from "@/components/form";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PlaceFormData } from "../schemas";
import { type PlaceFormValues, SAMPLE_GOOGLE_URL } from "./place-form-helpers";
import { usePlaceFormState } from "./place-form-hooks";
import { PlaceMapPicker } from "./place-map-picker";

interface PlaceFormProps {
  defaultValues?: Partial<PlaceFormValues>;
  onSubmit: (data: PlaceFormData) => Promise<void> | void;
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
  const {
    form,
    isFormReady,
    hasEmbedKey,
    googleUrl,
    setGoogleUrl,
    previewResult,
    previewErrorMessage,
    isPreviewing,
    handlePreview,
    provinceOptions,
    cityOptions,
    provincePlaceholder,
    cityPlaceholder,
    isProvinceDisabled,
    isCityDisabled,
    coordinateLabel,
    latitudeValue,
    longitudeValue,
    handleMapPinChange,
    handleSubmit,
    submitting,
    isSubmitDisabled,
  } = usePlaceFormState({
    defaultValues,
    onSubmit,
    isSubmitting,
    isEditing,
  });

  const shouldHydrateDefaults = Boolean(defaultValues);

  if (shouldHydrateDefaults && !isFormReady) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Spinner className="size-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <StandardFormProvider<PlaceFormValues>
      form={form}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle>Venue Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <StandardFormInput<PlaceFormValues>
            name="name"
            label="Venue Name"
            placeholder="e.g., Kudos Sports Complex"
            required
          />

          <StandardFormInput<PlaceFormValues>
            name="address"
            label="Street Address"
            placeholder="e.g., 123 Sports Avenue"
            required
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <StandardFormCombobox<PlaceFormValues>
              name="province"
              label="Province"
              options={provinceOptions}
              placeholder={provincePlaceholder}
              searchPlaceholder="Search province..."
              required
              disabled={isProvinceDisabled}
            />
            <StandardFormCombobox<PlaceFormValues>
              name="city"
              label="City"
              options={cityOptions}
              placeholder={cityPlaceholder}
              searchPlaceholder="Search city..."
              required
              disabled={isCityDisabled}
            />
          </div>

          {isEditing && (
            <StandardFormCheckbox<PlaceFormValues>
              name="isActive"
              label="Venue is active"
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
              name="phoneNumber"
              label="Phone Number"
              placeholder="0917 123 4567"
              type="tel"
              autoComplete="tel"
            />
            <StandardFormInput<PlaceFormValues>
              name="viberInfo"
              label="Viber Number"
              placeholder="0917 123 4567"
              type="tel"
              autoComplete="tel"
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
          <CardTitle>Amenities</CardTitle>
          <CardDescription>
            Select the amenities available at this venue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StandardFormField<PlaceFormValues> name="amenities">
            {({ field }) => {
              const current = Array.isArray(field.value)
                ? (field.value as string[])
                : [];

              return (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {PLACE_AMENITIES.map((amenity) => (
                    <div
                      key={amenity}
                      className="flex items-start gap-3 text-sm font-normal"
                    >
                      <Checkbox
                        checked={current.includes(amenity)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            field.onChange([...current, amenity]);
                          } else {
                            field.onChange(
                              current.filter((value) => value !== amenity),
                            );
                          }
                        }}
                      />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              );
            }}
          </StandardFormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Map (optional)</CardTitle>
          <CardDescription>
            Click on the map or search an address to set the venue location.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <PlaceMapPicker
            latitude={latitudeValue}
            longitude={longitudeValue}
            onChange={handleMapPinChange}
            searchEnabled={!isEditing}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <StandardFormField<PlaceFormValues>
              name="latitude"
              label="Latitude"
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
              label="Longitude"
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

          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="flex w-full items-center gap-2 text-sm text-muted-foreground"
              >
                <ChevronRight className="h-4 w-4 transition-transform [[data-state=open]>*>&]:rotate-90" />
                Or paste a Google Maps link
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-2">
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
                {isPreviewing && <Spinner />}
                Preview
              </Button>

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
                          rel="noopener noreferrer"
                          className="break-all text-primary hover:underline"
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
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitDisabled}>
          {submitting && <Spinner />}
          {isEditing ? "Save Changes" : "Create Venue"}
        </Button>
      </div>
    </StandardFormProvider>
  );
}
