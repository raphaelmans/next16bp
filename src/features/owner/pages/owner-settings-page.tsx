"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Loader2 } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { appRoutes } from "@/common/app-routes";
import { SETTINGS_SECTION_IDS } from "@/common/section-hashes";
import { toast } from "@/common/toast";
import { getClientErrorMessage } from "@/common/toast/errors";
import { StandardFormInput, StandardFormProvider } from "@/components/form";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutAuthLogout, useQueryAuthSession } from "@/features/auth";
import { WebPushSettingsCard } from "@/features/notifications/components/web-push-settings";
import { OwnerNavbar, OwnerSidebar } from "@/features/owner";
import {
  RemovalRequestModal,
  ReservationAlertsPanel,
} from "@/features/owner/components";
import { PaymentMethodsManager } from "@/features/owner/components/payment-methods-manager";
import {
  useMutRequestRemoval,
  useMutUpdateOrganization,
  useQueryCurrentOrganization,
  useQueryOwnerOrganization,
} from "@/features/owner/hooks";
import {
  type OrganizationFormData,
  organizationSchema,
  type RemovalRequestFormData,
} from "@/features/owner/schemas";

export default function OwnerSettingsPage() {
  const { data: user } = useQueryAuthSession();
  const logoutMutation = useMutAuthLogout();
  const [removalModalOpen, setRemovalModalOpen] = React.useState(false);

  // Use the shared organization hook for sidebar
  const { organization: navOrg, organizations } = useQueryOwnerOrganization();

  // Use the current organization hook for the form data
  const { data: organization, isLoading: orgLoading } =
    useQueryCurrentOrganization();
  const updateOrg = useMutUpdateOrganization();
  const requestRemoval = useMutRequestRemoval();

  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      email: "",
      phone: "",
      address: "",
    },
  });

  const {
    reset: resetOrgForm,
    formState: { isDirty: isOrgDirty, isSubmitting: isOrgSubmitting },
  } = form;

  const organizationId = organization?.id;
  const organizationName = organization?.name ?? "";
  const organizationSlug = organization?.slug ?? "";
  const organizationDescription = organization?.description ?? "";
  const organizationEmail = organization?.email ?? "";
  const organizationPhone = organization?.phone ?? "";
  const organizationAddress = organization?.address ?? "";

  const organizationFormValues = React.useMemo(() => {
    if (!organizationId) return null;
    return {
      name: organizationName,
      slug: organizationSlug,
      description: organizationDescription,
      email: organizationEmail,
      phone: organizationPhone,
      address: organizationAddress,
    };
  }, [
    organizationId,
    organizationName,
    organizationSlug,
    organizationDescription,
    organizationEmail,
    organizationPhone,
    organizationAddress,
  ]);

  // Update form when organization data loads
  React.useEffect(() => {
    if (!organizationFormValues) return;
    if (isOrgDirty) return;
    resetOrgForm(organizationFormValues);
  }, [isOrgDirty, organizationFormValues, resetOrgForm]);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(appRoutes.owner.settings);
  };

  const orgSubmitting = updateOrg.isPending || isOrgSubmitting;
  const isOrgSubmitDisabled = orgSubmitting || !isOrgDirty;

  const handleSubmit = async (data: OrganizationFormData) => {
    if (!organization?.id) return;

    try {
      await updateOrg.mutateAsync({
        organizationId: organization.id,
        name: data.name,
        slug: data.slug,
        description: data.description,
        email: data.email,
        phone: data.phone,
        address: data.address,
      });
      resetOrgForm(data);
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  const handleRemovalRequest = async (data: RemovalRequestFormData) => {
    try {
      await requestRemoval.mutateAsync(data);
      toast.success("Removal request submitted successfully");
      setRemovalModalOpen(false);
    } catch (error) {
      toast.error("Failed to submit removal request", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  if (orgLoading) {
    return (
      <AppShell
        sidebar={
          <OwnerSidebar
            currentOrganization={navOrg ?? { id: "", name: "Loading..." }}
            organizations={organizations}
            user={{ name: user?.email?.split("@")[0], email: user?.email }}
          />
        }
        navbar={
          <OwnerNavbar
            organizationName={navOrg?.name ?? "Loading..."}
            user={{ name: user?.email?.split("@")[0], email: user?.email }}
            onLogout={handleLogout}
          />
        }
        floatingPanel={<ReservationAlertsPanel organizationId={null} />}
      >
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      sidebar={
        <OwnerSidebar
          currentOrganization={navOrg ?? { id: "", name: "No Organization" }}
          organizations={organizations}
          user={{ name: user?.email?.split("@")[0], email: user?.email }}
        />
      }
      navbar={
        <OwnerNavbar
          organizationName={navOrg?.name ?? "No Organization"}
          user={{ name: user?.email?.split("@")[0], email: user?.email }}
          onLogout={handleLogout}
        />
      }
      floatingPanel={
        <ReservationAlertsPanel organizationId={navOrg?.id ?? null} />
      }
    >
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-heading">
            Organization Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your organization profile and preferences
          </p>
        </div>

        <StandardFormProvider
          form={form}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Contact Information Card */}
          <Card id={SETTINGS_SECTION_IDS.contactInformation}>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                How players can reach your organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <StandardFormInput<OrganizationFormData>
                  name="email"
                  label="Email"
                  type="email"
                  placeholder="contact@example.com"
                />

                <StandardFormInput<OrganizationFormData>
                  name="phone"
                  label="Phone"
                  placeholder="0917 123 4567"
                />
              </div>

              <StandardFormInput<OrganizationFormData>
                name="address"
                label="Address"
                placeholder="123 Sports Ave, Makati City"
              />
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isOrgSubmitDisabled}>
              {orgSubmitting && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Save Changes
            </Button>
          </div>
        </StandardFormProvider>

        <WebPushSettingsCard id={SETTINGS_SECTION_IDS.browserNotifications} />

        {organization?.id && (
          <PaymentMethodsManager
            organizationId={organization.id}
            sectionId={SETTINGS_SECTION_IDS.paymentMethods}
          />
        )}

        {/* Danger Zone */}
        <Card
          id={SETTINGS_SECTION_IDS.dangerZone}
          className="border-destructive"
        >
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions that affect your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="font-medium">Request Listing Removal</h4>
                <p className="text-sm text-muted-foreground">
                  Remove your courts from public search and cancel all pending
                  reservations
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => setRemovalModalOpen(true)}
              >
                Request Removal
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <RemovalRequestModal
        open={removalModalOpen}
        onOpenChange={setRemovalModalOpen}
        onSubmit={handleRemovalRequest}
        isLoading={requestRemoval.isPending}
      />
    </AppShell>
  );
}
