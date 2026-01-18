"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Textarea } from "@/components/ui/textarea";
import { AdminNavbar, AdminSidebar } from "@/features/admin";
import { useCreateCuratedCourt } from "@/features/admin/hooks/use-admin-courts";
import { useAdminStats } from "@/features/admin/hooks/use-admin-dashboard";
import {
  AMENITIES,
  type CuratedCourtFormData,
  curatedCourtSchema,
} from "@/features/admin/schemas/curated-court.schema";
import { useLogout, useSession } from "@/features/auth";
import { env } from "@/lib/env";
import { AppShell } from "@/shared/components/layout";
import { appRoutes } from "@/shared/lib/app-routes";
import { useGoogleLocPreviewMutation } from "@/shared/lib/clients/google-loc-client";
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

export default function NewCuratedCourtPage() {
  const router = useRouter();
  const { data: user } = useSession();
  const logoutMutation = useLogout();

  const { data: stats } = useAdminStats();
  const createMutation = useCreateCuratedCourt();
  const { data: sports = [], isLoading: sportsLoading } =
    trpc.sport.list.useQuery({});

  const hasEmbedKey = Boolean(env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY);
  const [googleUrl, setGoogleUrl] = React.useState("");
  const provincesCitiesQuery = usePHProvincesCitiesQuery();

  const form = useForm<CuratedCourtFormData>({
    resolver: zodResolver(curatedCourtSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      address: "",
      city: "",
      province: "",
      country: DEFAULT_COUNTRY,
      facebookUrl: "",
      instagramUrl: "",
      viberContact: "",
      websiteUrl: "",
      otherContactInfo: "",
      amenities: [],
      courts: [{ label: "Court 1", sportId: "", tierLabel: "" }],
    },
  });

  const {
    fields: courtFields,
    append: appendCourt,
    remove: removeCourt,
  } = useFieldArray({
    control: form.control,
    name: "courts",
  });

  const {
    reset,
    setValue,
    watch,
    formState: { isDirty, isValid, isSubmitting },
  } = form;

  const nameValue = watch("name");
  const provinceValue = watch("province");
  const cityValue = watch("city");
  const countryValue = watch("country");

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
        setValue("lat", data.lat, {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        });
      }

      if (data.lng !== undefined) {
        setValue("lng", data.lng, {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        });
      }
    },
  });

  const previewResult = previewMutation.data;
  const previewError = previewMutation.error;
  const isPreviewing = previewMutation.isPending;
  const previewErrorMessage = previewError
    ? getClientErrorMessage(previewError, "Request failed")
    : null;

  React.useEffect(() => {
    if (countryValue !== DEFAULT_COUNTRY) {
      setValue("country", DEFAULT_COUNTRY, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: true,
      });
    }
  }, [countryValue, setValue]);

  const provincesCities = provincesCitiesQuery.data ?? null;

  const provinceOptions = React.useMemo(() => {
    if (!provincesCities) return [];

    return buildProvinceOptions(provincesCities, "name");
  }, [provincesCities]);

  const selectedProvince = React.useMemo(
    () =>
      provincesCities
        ? findProvinceByName(provincesCities, provinceValue)
        : null,
    [provinceValue, provincesCities],
  );

  const cityOptions = React.useMemo(() => {
    if (!provincesCities || !selectedProvince) return [];

    return buildCityOptions(selectedProvince, "name");
  }, [provincesCities, selectedProvince]);

  const countryOptions = React.useMemo(
    () => [{ label: "Philippines (PH)", value: DEFAULT_COUNTRY }],
    [],
  );

  const provincePlaceholder = provincesCitiesQuery.isLoading
    ? "Loading provinces..."
    : "Select province";

  const cityPlaceholder = !provinceValue
    ? "Select a province first"
    : provincesCitiesQuery.isLoading
      ? "Loading cities..."
      : "Select city";

  const isProvinceDisabled = provincesCitiesQuery.isLoading || !provincesCities;
  const isCityDisabled = isProvinceDisabled || !provinceValue;

  React.useEffect(() => {
    if (!provincesCities) return;

    if (provinceValue && !selectedProvince) {
      setValue("province", "", {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      setValue("city", "", {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      return;
    }

    if (!provinceValue) {
      if (cityValue) {
        setValue("city", "", {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        });
      }
      return;
    }

    const selectedCity = findCityByName(selectedProvince, cityValue);
    if (cityValue && !selectedCity) {
      setValue("city", "", {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    }
  }, [cityValue, provinceValue, provincesCities, selectedProvince, setValue]);

  const coordinateLabel = React.useMemo(() => {
    if (previewResult?.lat === undefined || previewResult?.lng === undefined) {
      return "";
    }
    return `${previewResult.lat.toFixed(6)}, ${previewResult.lng.toFixed(6)}`;
  }, [previewResult?.lat, previewResult?.lng]);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(appRoutes.admin.courts.new);
  };

  const handleSubmit = async (data: CuratedCourtFormData) => {
    try {
      await createMutation.mutateAsync({
        name: data.name,
        address: data.address,
        city: data.city,
        province: data.province,
        country: data.country,
        latitude: data.lat,
        longitude: data.lng,
        facebookUrl: data.facebookUrl || undefined,
        instagramUrl: data.instagramUrl || undefined,
        viberInfo: data.viberContact || undefined,
        websiteUrl: data.websiteUrl || undefined,
        otherContactInfo: data.otherContactInfo || undefined,
        amenities: data.amenities.length > 0 ? data.amenities : undefined,
        courts: data.courts.map((court) => ({
          label: court.label,
          sportId: court.sportId,
          tierLabel: court.tierLabel || undefined,
        })),
      });
      reset(data);
      toast.success("Court created successfully");
      router.push(appRoutes.admin.courts.base);
    } catch (error) {
      toast.error("Failed to create court", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  const handlePreview = () => {
    if (!googleUrl.trim()) return;
    previewMutation.reset();
    previewMutation.mutate({ url: googleUrl });
  };

  const sportOptions = sports.map((sport) => ({
    label: sport.name,
    value: sport.id,
  }));
  const submitting = createMutation.isPending || isSubmitting;
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
          title="Add Curated Court"
          description="Add a new curated court to the platform"
          breadcrumbs={[
            { label: "Courts", href: appRoutes.admin.courts.base },
            { label: "Create" },
          ]}
          backHref={appRoutes.admin.courts.base}
        />

        <StandardFormProvider
          form={form}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Enter the court&apos;s basic details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <StandardFormInput<CuratedCourtFormData>
                name="name"
                label="Court Name"
                placeholder="Makati Pickleball Club"
                required
              />

              <StandardFormInput<CuratedCourtFormData>
                name="address"
                label="Address"
                placeholder="123 Sports Avenue, Barangay San Lorenzo"
                required
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <StandardFormSelect<CuratedCourtFormData>
                  name="province"
                  label="Province"
                  options={provinceOptions}
                  placeholder={provincePlaceholder}
                  required
                  disabled={isProvinceDisabled}
                />
                <StandardFormSelect<CuratedCourtFormData>
                  name="city"
                  label="City"
                  options={cityOptions}
                  placeholder={cityPlaceholder}
                  required
                  disabled={isCityDisabled}
                />
              </div>

              <StandardFormSelect<CuratedCourtFormData>
                name="country"
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
                Paste a Google Maps link to auto-fill coordinates. Address and
                city still require confirmation.
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
                  "Locate"
                )}
              </Button>

              <div className="grid gap-4 sm:grid-cols-2">
                <StandardFormField<CuratedCourtFormData>
                  name="lat"
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
                        field.onChange(
                          Number.isNaN(parsed) ? undefined : parsed,
                        );
                      }}
                      placeholder="e.g., 14.5547"
                    />
                  )}
                </StandardFormField>

                <StandardFormField<CuratedCourtFormData>
                  name="lng"
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
                        field.onChange(
                          Number.isNaN(parsed) ? undefined : parsed,
                        );
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

          <Card>
            <CardHeader>
              <CardTitle>Court Inventory</CardTitle>
              <CardDescription>
                Define each court unit and its sport
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {courtFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="rounded-lg border border-border/60 bg-background p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-medium">{`Court ${index + 1}`}</div>
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
                      <StandardFormInput<CuratedCourtFormData>
                        name={`courts.${index}.label`}
                        label="Court Label"
                        placeholder="Court 1"
                        required
                      />
                      <StandardFormSelect<CuratedCourtFormData>
                        name={`courts.${index}.sportId`}
                        label="Sport"
                        placeholder="Select a sport"
                        options={sportOptions}
                        required
                        disabled={sportsLoading}
                      />
                      <StandardFormInput<CuratedCourtFormData>
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
                  appendCourt({
                    label: `Court ${courtFields.length + 1}`,
                    sportId: "",
                    tierLabel: "",
                  })
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Court
              </Button>
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
                <StandardFormInput<CuratedCourtFormData>
                  name="facebookUrl"
                  label="Facebook Page"
                  placeholder="https://facebook.com/..."
                />

                <StandardFormInput<CuratedCourtFormData>
                  name="instagramUrl"
                  label="Instagram"
                  placeholder="https://instagram.com/..."
                />

                <StandardFormInput<CuratedCourtFormData>
                  name="viberContact"
                  label="Viber Contact"
                  placeholder="0917 123 4567"
                />

                <StandardFormInput<CuratedCourtFormData>
                  name="websiteUrl"
                  label="Website"
                  placeholder="https://example.com"
                />
              </div>

              <StandardFormField<CuratedCourtFormData>
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
                Select the amenities available at this court
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StandardFormField<CuratedCourtFormData> name="amenities">
                {({ field }) => {
                  const current = Array.isArray(field.value)
                    ? (field.value as string[])
                    : [];

                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
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

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href={appRoutes.admin.courts.base}>Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitDisabled}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Court
            </Button>
          </div>
        </StandardFormProvider>
      </div>
    </AppShell>
  );
}
