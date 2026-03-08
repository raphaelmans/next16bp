"use client";

import { Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { UseFormReturn } from "react-hook-form";
import { appRoutes } from "@/common/app-routes";
import {
  StandardFormField,
  StandardFormInput,
  StandardFormProvider,
  StandardFormSelect,
} from "@/components/form";
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
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  type AdminCourtEditFormData,
  AMENITIES,
} from "@/features/admin/schemas";

type AdminCourtEditFormProps = {
  courtData: {
    place: { name: string };
    photos: { id: string; url: string }[];
  };
  form: UseFormReturn<AdminCourtEditFormData>;
  onSubmit: (data: AdminCourtEditFormData) => Promise<void> | void;
  pendingPhotoId: string | null;
  setPendingPhotoId: (value: string | null) => void;
  removePhotoPending: boolean;
  removePhotoTargetId: string | null;
  onRemovePhoto: (photoId: string) => void;
  onUploadPhoto: (file: File) => void;
  uploadPhotoPending: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  googleUrl: string;
  setGoogleUrl: (value: string) => void;
  hasEmbedKey: boolean;
  isPreviewing: boolean;
  previewErrorMessage: string | null;
  previewResult: {
    suggestedName?: string | null;
    resolvedUrl?: string | null;
    lat?: number | null;
    lng?: number | null;
    zoom?: number | null;
    source?: string | null;
    placeId?: string | null;
    warnings: string[];
    embedSrc?: string | null;
  } | null;
  coordinateLabel: string;
  placeIdLabel: string;
  onPreview: () => void;
  provinceOptions: { label: string; value: string }[];
  cityOptions: { label: string; value: string }[];
  provincePlaceholder: string;
  cityPlaceholder: string;
  isProvinceDisabled: boolean;
  isCityDisabled: boolean;
  sportOptions: { label: string; value: string }[];
  sportsLoading: boolean;
  courtFields: { fieldId: string }[];
  appendCourt: (court: {
    label: string;
    sportId: string;
    tierLabel: string;
  }) => void;
  removeCourt: (index: number) => void;
  isSubmitDisabled: boolean;
  submitting: boolean;
  sampleGoogleUrl: string;
};

export function AdminCourtEditForm({
  courtData,
  form,
  onSubmit,
  pendingPhotoId,
  setPendingPhotoId,
  removePhotoPending,
  removePhotoTargetId,
  onRemovePhoto,
  onUploadPhoto,
  uploadPhotoPending,
  fileInputRef,
  googleUrl,
  setGoogleUrl,
  hasEmbedKey,
  isPreviewing,
  previewErrorMessage,
  previewResult,
  coordinateLabel,
  placeIdLabel,
  onPreview,
  provinceOptions,
  cityOptions,
  provincePlaceholder,
  cityPlaceholder,
  isProvinceDisabled,
  isCityDisabled,
  sportOptions,
  sportsLoading,
  courtFields,
  appendCourt,
  removeCourt,
  isSubmitDisabled,
  submitting,
  sampleGoogleUrl,
}: AdminCourtEditFormProps) {
  const { register } = form;

  return (
    <StandardFormProvider form={form} onSubmit={onSubmit} className="space-y-6">
      <AlertDialog
        open={!!pendingPhotoId}
        onOpenChange={(open) => {
          if (!open) {
            setPendingPhotoId(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Photo</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the photo from this venue and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={removePhotoPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              type="button"
              onClick={(event) => {
                event.preventDefault();
                if (!pendingPhotoId) return;
                onRemovePhoto(pendingPhotoId);
              }}
              disabled={removePhotoPending || !pendingPhotoId}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removePhotoPending && pendingPhotoId === removePhotoTargetId ? (
                <Spinner className="mr-2" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Remove Photo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Update the venue&apos;s basic details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <StandardFormInput<AdminCourtEditFormData>
            name="name"
            label="Venue Name"
            placeholder="Makati Sports Club (Pickleball)"
            required
          />

          <StandardFormInput<AdminCourtEditFormData>
            name="address"
            label="Address"
            placeholder="123 Sports Avenue, Barangay San Lorenzo"
            required
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <StandardFormSelect<AdminCourtEditFormData>
              name="province"
              label="Province"
              options={provinceOptions}
              placeholder={provincePlaceholder}
              required
              disabled={isProvinceDisabled}
            />
            <StandardFormSelect<AdminCourtEditFormData>
              name="city"
              label="City"
              options={cityOptions}
              placeholder={cityPlaceholder}
              required
              disabled={isCityDisabled}
            />
          </div>
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
              placeholder={sampleGoogleUrl}
              inputMode="url"
            />
            {hasEmbedKey ? null : (
              <p className="text-xs text-muted-foreground">
                Embed previews are disabled until a Google Maps key is
                configured.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Example: {sampleGoogleUrl}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={onPreview}
            disabled={googleUrl.trim().length === 0 || isPreviewing}
            className="w-full"
          >
            {isPreviewing && <Spinner />}
            Locate
          </Button>

          <input type="hidden" {...register("latitude")} />
          <input type="hidden" {...register("longitude")} />
          <input type="hidden" {...register("extGPlaceId")} />

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
                      {previewResult.zoom !== undefined &&
                        previewResult.zoom !== null && (
                          <span className="text-muted-foreground">{` · z${previewResult.zoom}`}</span>
                        )}
                      {previewResult.source && (
                        <span className="text-muted-foreground">{` · ${previewResult.source}`}</span>
                      )}
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="text-xs text-muted-foreground">
                      Place ID
                    </div>
                    <div className="break-all font-mono text-xs">
                      {placeIdLabel || "(none)"}
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

      <Card>
        <CardHeader>
          <CardTitle>Venue Inventory</CardTitle>
          <CardDescription>
            Define each venue unit and its sport
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            {courtFields.map((field, index) => (
              <div
                key={field.fieldId}
                className="rounded-lg border border-border/60 bg-background p-4 shadow-sm"
              >
                <input
                  type="hidden"
                  {...register(`courts.${index}.id` as const)}
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-medium">{`Venue ${index + 1}`}</div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCourt(index)}
                    disabled={courtFields.length === 1}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <StandardFormInput<AdminCourtEditFormData>
                    name={`courts.${index}.label`}
                    label="Venue Label"
                    placeholder="Venue 1"
                    required
                  />
                  <StandardFormSelect<AdminCourtEditFormData>
                    name={`courts.${index}.sportId`}
                    label="Sport"
                    placeholder="Select a sport"
                    options={sportOptions}
                    required
                    disabled={sportsLoading}
                  />
                  <StandardFormInput<AdminCourtEditFormData>
                    name={`courts.${index}.tierLabel`}
                    label="Tier Label"
                    placeholder="VIP"
                  />
                </div>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              appendCourt({ label: "Venue 1", sportId: "", tierLabel: "" })
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Venue
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>
            How players can reach or find this venue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <StandardFormInput<AdminCourtEditFormData>
              name="facebookUrl"
              label="Facebook Page"
              placeholder="https://facebook.com/..."
            />

            <StandardFormInput<AdminCourtEditFormData>
              name="instagramUrl"
              label="Instagram"
              placeholder="https://instagram.com/..."
            />

            <StandardFormInput<AdminCourtEditFormData>
              name="phoneNumber"
              label="Phone Number"
              placeholder="0917 123 4567"
              type="tel"
              autoComplete="tel"
            />

            <StandardFormInput<AdminCourtEditFormData>
              name="viberInfo"
              label="Viber Number"
              placeholder="0917 123 4567"
              type="tel"
              autoComplete="tel"
            />

            <StandardFormInput<AdminCourtEditFormData>
              name="websiteUrl"
              label="Website"
              placeholder="https://example.com"
            />
          </div>

          <StandardFormField<AdminCourtEditFormData>
            name="otherContactInfo"
            label="Other Contact Information"
          >
            {({ field }) => (
              <Textarea
                placeholder="Any additional contact information..."
                rows={3}
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
            Select the amenities available at this venue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StandardFormField<AdminCourtEditFormData> name="amenities">
            {({ field }) => {
              const current = Array.isArray(field.value)
                ? (field.value as string[])
                : [];

              return (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {AMENITIES.map((amenity) => (
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
          <CardTitle>Photos</CardTitle>
          <CardDescription>Upload venue photos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              First photo is used as the cover image.
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  onUploadPhoto(file);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadPhotoPending}
              >
                {uploadPhotoPending ? (
                  <Spinner />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span className="ml-2">Add photo</span>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {courtData.photos.map((photo, index) => (
              <div
                key={photo.id}
                className="relative aspect-square overflow-hidden rounded-lg border bg-muted/20"
              >
                <Image
                  src={photo.url}
                  alt="Venue photo"
                  fill
                  className="object-cover"
                />
                {index === 0 && (
                  <span className="absolute top-2 left-2 rounded bg-primary px-2 py-1 text-xs text-primary-foreground">
                    Cover
                  </span>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute right-2 top-2 h-8 w-8 rounded-full"
                  onClick={() => setPendingPhotoId(photo.id)}
                  disabled={removePhotoPending}
                  aria-label="Remove photo"
                >
                  {removePhotoPending && pendingPhotoId === photo.id ? (
                    <Spinner />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" asChild>
          <Link href={appRoutes.admin.courts.base}>Cancel</Link>
        </Button>
        <Button type="submit" disabled={isSubmitDisabled}>
          {submitting && <Spinner />}
          Save Changes
        </Button>
      </div>
    </StandardFormProvider>
  );
}
