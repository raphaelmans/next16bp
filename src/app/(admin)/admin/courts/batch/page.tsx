"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { type Control, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  StandardFormField,
  StandardFormInput,
  StandardFormProvider,
  StandardFormSelect,
  StandardFormTextarea,
} from "@/components/form";
import { Badge } from "@/components/ui/badge";
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
import { PageHeader } from "@/components/ui/page-header";
import { AdminNavbar, AdminSidebar } from "@/features/admin";
import {
  type CuratedCourtBatchResult,
  useCreateCuratedCourtsBatch,
} from "@/features/admin/hooks/use-admin-courts";
import { useAdminStats } from "@/features/admin/hooks/use-admin-dashboard";
import {
  AMENITIES,
  type CuratedCourtBatchFormData,
  curatedCourtBatchSchema,
} from "@/features/admin/schemas/curated-court-batch.schema";
import { useLogout, useSession } from "@/features/auth";
import { env } from "@/lib/env";
import { AppShell } from "@/shared/components/layout";
import { appRoutes } from "@/shared/lib/app-routes";
import {
  type GoogleLocResult,
  useGoogleLocPreviewMutation,
} from "@/shared/lib/clients/google-loc-client";
import { usePHProvincesCitiesQuery } from "@/shared/lib/clients/ph-provinces-cities-client";
import {
  buildCityOptions,
  buildProvinceOptions,
  findCityByName,
  findProvinceByName,
} from "@/shared/lib/ph-location-data";
import { getClientErrorMessage } from "@/shared/lib/toast-errors";
import { trpc } from "@/trpc/client";

const DEFAULT_COUNTRY = "PH";
const SAMPLE_GOOGLE_URL = "https://maps.app.goo.gl/6AGA5vZkzKazGswRA";

const DEFAULT_COURT_UNIT = {
  label: "Court 1",
  sportId: "",
  tierLabel: "",
};

const DEFAULT_COURT = {
  name: "",
  address: "",
  city: "",
  province: "",
  country: DEFAULT_COUNTRY,
  latitude: "",
  longitude: "",
  facebookUrl: "",
  instagramUrl: "",
  viberContact: "",
  websiteUrl: "",
  otherContactInfo: "",
  amenities: [] as string[],
  photoUrls: "",
  courts: [DEFAULT_COURT_UNIT],
};

const statusLabels = {
  created: "Created",
  skipped_duplicate: "Skipped",
  error: "Failed",
};

const statusVariants = {
  created: "success",
  skipped_duplicate: "warning",
  error: "destructive",
} as const;

const parsePhotoUrls = (value?: string) => {
  if (!value) return [];

  return value
    .split(/[\n,]/)
    .map((url) => url.trim())
    .filter(Boolean)
    .map((url, index) => ({ url, displayOrder: index }));
};

interface CourtListProps {
  control: Control<CuratedCourtBatchFormData>;
  placeIndex: number;
  sportOptions: { label: string; value: string }[];
  sportsLoading: boolean;
}

function CourtList({
  control,
  placeIndex,
  sportOptions,
  sportsLoading,
}: CourtListProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `courts.${placeIndex}.courts` as const,
  });

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {fields.map((field, courtIndex) => (
          <div
            key={field.id}
            className="rounded-lg border border-border/60 bg-background p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-medium">{`Court ${courtIndex + 1}`}</div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(courtIndex)}
                disabled={fields.length === 1}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove
              </Button>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <StandardFormInput<CuratedCourtBatchFormData>
                name={`courts.${placeIndex}.courts.${courtIndex}.label`}
                label="Court Label"
                placeholder="Court 1"
                required
              />
              <StandardFormSelect<CuratedCourtBatchFormData>
                name={`courts.${placeIndex}.courts.${courtIndex}.sportId`}
                label="Sport"
                placeholder="Select a sport"
                options={sportOptions}
                required
                disabled={sportsLoading}
              />
              <StandardFormInput<CuratedCourtBatchFormData>
                name={`courts.${placeIndex}.courts.${courtIndex}.tierLabel`}
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
          append({
            label: `Court ${fields.length + 1}`,
            sportId: "",
            tierLabel: "",
          })
        }
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Court
      </Button>
    </div>
  );
}

export default function AdminCourtsBatchPage() {
  const { data: user } = useSession();
  const logoutMutation = useLogout();

  const { data: stats } = useAdminStats();
  const createBatchMutation = useCreateCuratedCourtsBatch();
  const previewMutation = useGoogleLocPreviewMutation();
  const { data: sports = [], isLoading: sportsLoading } =
    trpc.sport.list.useQuery({});
  const [batchResult, setBatchResult] =
    React.useState<CuratedCourtBatchResult | null>(null);
  const [googleUrls, setGoogleUrls] = React.useState<Record<string, string>>(
    {},
  );
  const [previewResults, setPreviewResults] = React.useState<
    Record<string, GoogleLocResult | null>
  >({});
  const [previewErrors, setPreviewErrors] = React.useState<
    Record<string, string | null>
  >({});
  const [previewingId, setPreviewingId] = React.useState<string | null>(null);
  const provincesCitiesQuery = usePHProvincesCitiesQuery();
  const hasEmbedKey = Boolean(env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY);

  const form = useForm<CuratedCourtBatchFormData>({
    resolver: zodResolver(curatedCourtBatchSchema),
    mode: "onChange",
    defaultValues: {
      courts: [DEFAULT_COURT],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "courts",
  });

  const {
    reset,
    setValue,
    watch,
    formState: { isDirty, isValid, isSubmitting },
  } = form;

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(appRoutes.admin.courts.batch);
  };

  const handleClear = () => {
    reset({ courts: [DEFAULT_COURT] });
    setBatchResult(null);
    setGoogleUrls({});
    setPreviewResults({});
    setPreviewErrors({});
    setPreviewingId(null);
  };

  const provincesCities = provincesCitiesQuery.data ?? null;

  const provinceOptions = React.useMemo(() => {
    if (!provincesCities) return [];

    return buildProvinceOptions(provincesCities, "name");
  }, [provincesCities]);

  const countryOptions = React.useMemo(
    () => [{ label: "Philippines (PH)", value: DEFAULT_COUNTRY }],
    [],
  );

  const provincePlaceholder = provincesCitiesQuery.isLoading
    ? "Loading provinces..."
    : "Select province";

  const isProvinceDisabled = provincesCitiesQuery.isLoading || !provincesCities;

  const getCityOptions = React.useCallback(
    (province?: string) => {
      if (!provincesCities || !province) return [];

      const selectedProvince = findProvinceByName(provincesCities, province);
      return selectedProvince ? buildCityOptions(selectedProvince, "name") : [];
    },
    [provincesCities],
  );

  const getCityPlaceholder = React.useCallback(
    (province?: string) => {
      if (!province) return "Select a province first";
      return provincesCitiesQuery.isLoading
        ? "Loading cities..."
        : "Select city";
    },
    [provincesCitiesQuery.isLoading],
  );

  const isCityDisabled = (province?: string) => isProvinceDisabled || !province;

  const courts = watch("courts");

  const handleRemoveCourt = (index: number, fieldId: string) => {
    remove(index);
    setGoogleUrls((prev) => {
      if (!prev[fieldId]) return prev;
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
    setPreviewResults((prev) => {
      if (!prev[fieldId]) return prev;
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
    setPreviewErrors((prev) => {
      if (!prev[fieldId]) return prev;
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
    setPreviewingId((current) => (current === fieldId ? null : current));
  };

  const handlePreview = (fieldId: string, index: number) => {
    const url = googleUrls[fieldId]?.trim();
    if (!url) return;
    setPreviewingId(fieldId);
    setPreviewErrors((prev) => ({ ...prev, [fieldId]: null }));

    previewMutation.mutate(
      { url },
      {
        onSuccess: (data) => {
          setPreviewResults((prev) => ({ ...prev, [fieldId]: data }));

          if (data.suggestedName && !courts?.[index]?.name?.trim()) {
            setValue(`courts.${index}.name`, data.suggestedName, {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            });
          }

          if (data.lat !== undefined) {
            setValue(`courts.${index}.latitude`, String(data.lat), {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            });
          }

          if (data.lng !== undefined) {
            setValue(`courts.${index}.longitude`, String(data.lng), {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            });
          }
        },
        onError: (error) => {
          setPreviewErrors((prev) => ({
            ...prev,
            [fieldId]: getClientErrorMessage(error, "Request failed"),
          }));
        },
        onSettled: () => {
          setPreviewingId((current) => (current === fieldId ? null : current));
        },
      },
    );
  };

  React.useEffect(() => {
    if (!courts) return;

    courts.forEach((court, index) => {
      if (court.country !== DEFAULT_COUNTRY) {
        setValue(`courts.${index}.country`, DEFAULT_COUNTRY, {
          shouldDirty: false,
          shouldTouch: false,
          shouldValidate: true,
        });
      }
    });
  }, [courts, setValue]);

  React.useEffect(() => {
    if (!courts || !provincesCities) return;

    courts.forEach((court, index) => {
      const province = court.province;
      const city = court.city;
      const selectedProvince = province
        ? findProvinceByName(provincesCities, province)
        : null;

      if (province && !selectedProvince) {
        setValue(`courts.${index}.province`, "", {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        });
        setValue(`courts.${index}.city`, "", {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        });
        return;
      }

      if (!province) {
        if (city) {
          setValue(`courts.${index}.city`, "", {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
          });
        }
        return;
      }

      const selectedCity = findCityByName(selectedProvince, city);
      if (city && !selectedCity) {
        setValue(`courts.${index}.city`, "", {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        });
      }
    });
  }, [courts, provincesCities, setValue]);

  const handleSubmit = async (data: CuratedCourtBatchFormData) => {
    try {
      const items = data.courts.map((court) => {
        const photos = parsePhotoUrls(court.photoUrls);

        return {
          name: court.name,
          address: court.address,
          city: court.city,
          province: court.province,
          country: court.country,
          latitude: court.latitude || undefined,
          longitude: court.longitude || undefined,
          facebookUrl: court.facebookUrl || undefined,
          instagramUrl: court.instagramUrl || undefined,
          viberInfo: court.viberContact || undefined,
          websiteUrl: court.websiteUrl || undefined,
          otherContactInfo: court.otherContactInfo || undefined,
          amenities: court.amenities.length > 0 ? court.amenities : undefined,
          photos: photos.length > 0 ? photos : undefined,
          courts: court.courts.map((courtItem) => ({
            label: courtItem.label,
            sportId: courtItem.sportId,
            tierLabel: courtItem.tierLabel || undefined,
          })),
        };
      });

      setBatchResult(null);
      const result = await createBatchMutation.mutateAsync({ items });
      setBatchResult(result);
      toast.success("Batch processed", {
        description: `${result.summary.created} created, ${result.summary.skipped} skipped, ${result.summary.failed} failed`,
      });
    } catch (error) {
      toast.error("Failed to process batch", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  const sportOptions = sports.map((sport) => ({
    label: sport.name,
    value: sport.id,
  }));
  const submitting = createBatchMutation.isPending || isSubmitting;
  const isSubmitDisabled = submitting || !isDirty || !isValid;

  return (
    <AppShell
      sidebar={
        <AdminSidebar
          user={{
            name: user?.email?.split("@")[0],
            email: user?.email,
          }}
          pendingClaimsCount={stats?.pendingClaims || 0}
        />
      }
      navbar={
        <AdminNavbar
          user={{
            name: user?.email?.split("@")[0],
            email: user?.email,
          }}
          onLogout={handleLogout}
        />
      }
    >
      <div className="space-y-6">
        <PageHeader
          title="Batch Add Curated Courts"
          description="Create multiple curated court listings in one submission"
          breadcrumbs={[
            { label: "Courts", href: appRoutes.admin.courts.base },
            { label: "Batch Add" },
          ]}
          backHref={appRoutes.admin.courts.base}
        />

        <StandardFormProvider
          form={form}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Courts in this batch</h2>
              <p className="text-sm text-muted-foreground">
                Add as many curated courts as you need before submitting.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={handleClear}>
                Clear Batch
              </Button>
              <Button
                type="button"
                onClick={() => append({ ...DEFAULT_COURT })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Row
              </Button>
            </div>
          </div>

          <div className="space-y-10">
            {fields.map((field, index) => {
              const provinceValue = courts?.[index]?.province;
              const cityOptions = getCityOptions(provinceValue);
              const cityPlaceholder = getCityPlaceholder(provinceValue);
              const cityDisabled = isCityDisabled(provinceValue);
              const googleUrlValue = googleUrls[field.id] ?? "";
              const previewResult = previewResults[field.id] ?? null;
              const previewErrorMessage = previewErrors[field.id] ?? null;
              const isPreviewing =
                previewMutation.isPending && previewingId === field.id;
              const coordinateLabel =
                previewResult?.lat !== undefined &&
                previewResult?.lng !== undefined
                  ? `${previewResult.lat.toFixed(6)}, ${previewResult.lng.toFixed(6)}`
                  : "";

              return (
                <div key={field.id} className="space-y-6">
                  <Card>
                    <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <CardTitle>{`Court ${index + 1}`}</CardTitle>
                        <CardDescription>
                          {courts?.[index]?.name?.trim() ||
                            "Enter court details"}
                        </CardDescription>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCourt(index, field.id)}
                        disabled={fields.length === 1}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    </CardHeader>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Basic Information</CardTitle>
                      <CardDescription>
                        Enter the court&apos;s basic details
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <StandardFormInput<CuratedCourtBatchFormData>
                        name={`courts.${index}.name`}
                        label="Court Name"
                        placeholder="Makati Pickleball Club"
                        required
                      />
                      <StandardFormInput<CuratedCourtBatchFormData>
                        name={`courts.${index}.address`}
                        label="Address"
                        placeholder="123 Sports Avenue, Barangay San Lorenzo"
                        required
                      />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <StandardFormSelect<CuratedCourtBatchFormData>
                          name={`courts.${index}.province`}
                          label="Province"
                          options={provinceOptions}
                          placeholder={provincePlaceholder}
                          required
                          disabled={isProvinceDisabled}
                        />
                        <StandardFormSelect<CuratedCourtBatchFormData>
                          name={`courts.${index}.city`}
                          label="City"
                          options={cityOptions}
                          placeholder={cityPlaceholder}
                          required
                          disabled={cityDisabled}
                        />
                      </div>
                      <StandardFormSelect<CuratedCourtBatchFormData>
                        name={`courts.${index}.country`}
                        label="Country"
                        options={countryOptions}
                        placeholder="Philippines (PH)"
                        required
                        disabled
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Map (optional)</CardTitle>
                      <CardDescription>
                        Paste a Google Maps link to auto-fill coordinates.
                        Address and city still require confirmation.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor={`googleUrl-${field.id}`}>
                          Google Maps URL
                        </Label>
                        <Input
                          id={`googleUrl-${field.id}`}
                          value={googleUrlValue}
                          onChange={(event) => {
                            const value = event.target.value;
                            setGoogleUrls((prev) => ({
                              ...prev,
                              [field.id]: value,
                            }));
                            setPreviewResults((prev) => ({
                              ...prev,
                              [field.id]: null,
                            }));
                            setPreviewErrors((prev) => ({
                              ...prev,
                              [field.id]: null,
                            }));
                          }}
                          placeholder={SAMPLE_GOOGLE_URL}
                          inputMode="url"
                        />
                        {hasEmbedKey ? null : (
                          <p className="text-xs text-muted-foreground">
                            Embed previews are disabled until a Google Maps key
                            is configured.
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Example: {SAMPLE_GOOGLE_URL}
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handlePreview(field.id, index)}
                        disabled={
                          !googleUrlValue.trim() || previewMutation.isPending
                        }
                        className="w-full"
                      >
                        {isPreviewing ? (
                          <span className="inline-flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Resolving…
                          </span>
                        ) : (
                          "Locate"
                        )}
                      </Button>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <StandardFormInput<CuratedCourtBatchFormData>
                          name={`courts.${index}.latitude`}
                          label="Latitude (optional)"
                          placeholder="e.g., 14.5547"
                        />
                        <StandardFormInput<CuratedCourtBatchFormData>
                          name={`courts.${index}.longitude`}
                          label="Longitude (optional)"
                          placeholder="e.g., 121.0244"
                        />
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
                                <span className="text-muted-foreground">
                                  (none)
                                </span>
                              )}
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                              <div>
                                <div className="text-xs text-muted-foreground">
                                  Suggested name
                                </div>
                                <div>
                                  {previewResult.suggestedName ?? "(none)"}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">
                                  Coordinates
                                </div>
                                <div>
                                  {coordinateLabel ? (
                                    <span className="font-mono">
                                      {coordinateLabel}
                                    </span>
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
                              <div className="text-xs font-medium">
                                Warnings
                              </div>
                              <ul className="mt-1 list-disc pl-5 text-xs text-muted-foreground">
                                {previewResult.warnings.map((warning) => (
                                  <li key={warning}>{warning}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {previewResult.embedSrc ? (
                            <div className="space-y-2">
                              <div className="text-sm font-medium">
                                Embed preview
                              </div>
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
                      <CardTitle>Court Inventory</CardTitle>
                      <CardDescription>
                        Define each court unit and its sport
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <CourtList
                        control={form.control}
                        placeIndex={index}
                        sportOptions={sportOptions}
                        sportsLoading={sportsLoading}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Contact Information</CardTitle>
                      <CardDescription>
                        How players can reach or find this court
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid gap-6 sm:grid-cols-2">
                        <StandardFormInput<CuratedCourtBatchFormData>
                          name={`courts.${index}.facebookUrl`}
                          label="Facebook Page"
                          placeholder="https://facebook.com/..."
                        />
                        <StandardFormInput<CuratedCourtBatchFormData>
                          name={`courts.${index}.instagramUrl`}
                          label="Instagram"
                          placeholder="https://instagram.com/..."
                        />
                        <StandardFormInput<CuratedCourtBatchFormData>
                          name={`courts.${index}.viberContact`}
                          label="Viber Contact"
                          placeholder="0917 123 4567"
                        />
                        <StandardFormInput<CuratedCourtBatchFormData>
                          name={`courts.${index}.websiteUrl`}
                          label="Website"
                          placeholder="https://example.com"
                        />
                      </div>

                      <StandardFormTextarea<CuratedCourtBatchFormData>
                        name={`courts.${index}.otherContactInfo`}
                        label="Other Contact Information"
                        placeholder="Any additional contact details..."
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Amenities</CardTitle>
                      <CardDescription>
                        Select the amenities available at this court
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <StandardFormField<CuratedCourtBatchFormData>
                        name={`courts.${index}.amenities`}
                      >
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
                                          current.filter(
                                            (value) => value !== amenity,
                                          ),
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
                      <CardDescription>
                        Add photo URLs for this listing
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <StandardFormTextarea<CuratedCourtBatchFormData>
                        name={`courts.${index}.photoUrls`}
                        label="Photo URLs"
                        placeholder="https://...\nhttps://..."
                        description="Add one URL per line or comma-separated"
                      />
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="outline" asChild>
              <Link href={appRoutes.admin.courts.base}>Back to Courts</Link>
            </Button>
            <Button type="submit" disabled={isSubmitDisabled}>
              {submitting ? "Submitting..." : "Submit Batch"}
            </Button>
          </div>
        </StandardFormProvider>

        {batchResult && (
          <Card>
            <CardHeader>
              <CardTitle>Batch Results</CardTitle>
              <CardDescription>
                Review created, skipped, and failed entries.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="rounded-md border p-3">
                  <div className="text-xs uppercase text-muted-foreground">
                    Total
                  </div>
                  <div className="text-2xl font-semibold">
                    {batchResult.summary.total}
                  </div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs uppercase text-muted-foreground">
                    Created
                  </div>
                  <div className="text-2xl font-semibold">
                    {batchResult.summary.created}
                  </div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs uppercase text-muted-foreground">
                    Skipped
                  </div>
                  <div className="text-2xl font-semibold">
                    {batchResult.summary.skipped}
                  </div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs uppercase text-muted-foreground">
                    Failed
                  </div>
                  <div className="text-2xl font-semibold">
                    {batchResult.summary.failed}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {batchResult.items.map((item) => (
                  <div
                    key={item.index}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        Court {item.index + 1}
                      </span>
                      <Badge variant={statusVariants[item.status]}>
                        {statusLabels[item.status]}
                      </Badge>
                    </div>
                    {item.message && (
                      <span className="text-muted-foreground">
                        {item.message}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
