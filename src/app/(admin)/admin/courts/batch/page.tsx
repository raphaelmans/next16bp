"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
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
import { AppShell } from "@/shared/components/layout";
import { appRoutes } from "@/shared/lib/app-routes";
import { getClientErrorMessage } from "@/shared/lib/toast-errors";
import { trpc } from "@/trpc/client";

const DEFAULT_COURT_UNIT = {
  label: "Court 1",
  sportId: "",
  tierLabel: "",
};

const DEFAULT_COURT = {
  name: "",
  address: "",
  city: "",
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
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-medium">Courts</div>
        <Button
          type="button"
          variant="outline"
          size="sm"
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

      <div className="space-y-3">
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
    </div>
  );
}

export default function AdminCourtsBatchPage() {
  const { data: user } = useSession();
  const logoutMutation = useLogout();

  const { data: stats } = useAdminStats();
  const createBatchMutation = useCreateCuratedCourtsBatch();
  const { data: sports = [], isLoading: sportsLoading } =
    trpc.sport.list.useQuery({});
  const [batchResult, setBatchResult] =
    React.useState<CuratedCourtBatchResult | null>(null);

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
  };

  const handleSubmit = async (data: CuratedCourtBatchFormData) => {
    try {
      const items = data.courts.map((court) => {
        const photos = parsePhotoUrls(court.photoUrls);

        return {
          name: court.name,
          address: court.address,
          city: court.city,
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
  const courts = watch("courts");
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

          <div className="space-y-6">
            {fields.map((field, index) => (
              <Card key={field.id}>
                <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>{`Court ${index + 1}`}</CardTitle>
                    <CardDescription>
                      {courts?.[index]?.name?.trim() || "Enter court details"}
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <StandardFormInput<CuratedCourtBatchFormData>
                      name={`courts.${index}.name`}
                      label="Court Name"
                      placeholder="Makati Pickleball Club"
                      required
                    />
                    <StandardFormInput<CuratedCourtBatchFormData>
                      name={`courts.${index}.address`}
                      label="Address"
                      placeholder="123 Sports Avenue"
                      required
                    />
                    <StandardFormInput<CuratedCourtBatchFormData>
                      name={`courts.${index}.city`}
                      label="City"
                      placeholder="e.g., Makati"
                      required
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <StandardFormInput<CuratedCourtBatchFormData>
                        name={`courts.${index}.latitude`}
                        label="Latitude"
                        placeholder="14.5995"
                      />
                      <StandardFormInput<CuratedCourtBatchFormData>
                        name={`courts.${index}.longitude`}
                        label="Longitude"
                        placeholder="120.9842"
                      />
                    </div>
                  </div>

                  <CourtList
                    control={form.control}
                    placeIndex={index}
                    sportOptions={sportOptions}
                    sportsLoading={sportsLoading}
                  />

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

                  <StandardFormField<CuratedCourtBatchFormData>
                    name={`courts.${index}.amenities`}
                    label="Amenities"
                  >
                    {({ field }) => {
                      const current = Array.isArray(field.value)
                        ? (field.value as string[])
                        : [];
                      const updateAmenities = (values: string[]) => {
                        field.onChange(values as typeof field.value);
                      };

                      return (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                          {AMENITIES.map((amenity) => (
                            <div
                              key={amenity}
                              className="flex items-start gap-3 text-sm"
                            >
                              <Checkbox
                                checked={current.includes(amenity)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    updateAmenities([...current, amenity]);
                                  } else {
                                    updateAmenities(
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

                  <StandardFormTextarea<CuratedCourtBatchFormData>
                    name={`courts.${index}.photoUrls`}
                    label="Photo URLs"
                    placeholder="https://...\nhttps://..."
                    description="Add one URL per line or comma-separated"
                  />
                </CardContent>
              </Card>
            ))}
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
