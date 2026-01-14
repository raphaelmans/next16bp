"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
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
import { PageHeader } from "@/components/ui/page-header";
import { Textarea } from "@/components/ui/textarea";
import { AdminNavbar, AdminSidebar } from "@/features/admin";
import { useCreateCuratedCourt } from "@/features/admin/hooks/use-admin-courts";
import { useAdminStats } from "@/features/admin/hooks/use-admin-dashboard";
import {
  AMENITIES,
  CITIES,
  type CuratedCourtFormData,
  curatedCourtSchema,
} from "@/features/admin/schemas/curated-court.schema";
import { useLogout, useSession } from "@/features/auth";
import { AppShell } from "@/shared/components/layout";
import { appRoutes } from "@/shared/lib/app-routes";
import { getClientErrorMessage } from "@/shared/lib/toast-errors";

export default function NewCuratedCourtPage() {
  const router = useRouter();
  const { data: user } = useSession();
  const logoutMutation = useLogout();

  const { data: stats } = useAdminStats();
  const createMutation = useCreateCuratedCourt();

  const form = useForm<CuratedCourtFormData>({
    resolver: zodResolver(curatedCourtSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      address: "",
      city: "",
      facebookUrl: "",
      instagramUrl: "",
      viberContact: "",
      websiteUrl: "",
      otherContactInfo: "",
      amenities: [],
    },
  });

  const {
    reset,
    formState: { isDirty, isValid, isSubmitting },
  } = form;

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(appRoutes.admin.courts.new);
  };

  const handleSubmit = async (data: CuratedCourtFormData) => {
    try {
      await createMutation.mutateAsync({
        ...data,
        facebookUrl: data.facebookUrl || undefined,
        instagramUrl: data.instagramUrl || undefined,
        viberContact: data.viberContact || undefined,
        websiteUrl: data.websiteUrl || undefined,
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

  const cityOptions = CITIES.map((city) => ({ label: city, value: city }));
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

              <StandardFormSelect<CuratedCourtFormData>
                name="city"
                label="City"
                placeholder="Select a city"
                options={cityOptions}
                required
              />

              <div className="space-y-2">
                <div className="text-sm font-medium">Map Location</div>
                <div className="h-48 rounded-lg border bg-muted flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <MapPin className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Map picker coming soon</p>
                    <p className="text-xs">Click to set location</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Click on the map to set the exact location
                </p>
              </div>
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
                  const current = Array.isArray(field.value) ? field.value : [];

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
