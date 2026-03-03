"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Loader2 } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useForm } from "react-hook-form";
import { appRoutes } from "@/common/app-routes";
import {
  isSettingsSectionId,
  SETTINGS_SECTION_IDS,
  type SettingsSectionId,
} from "@/common/section-hashes";
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
import { PortalPreferenceCard } from "@/features/auth/components";
import { WebPushSettingsCard } from "@/features/notifications/components/web-push-settings";
import { OwnerNavbar, OwnerSidebar } from "@/features/owner";
import {
  NoAccessView,
  RemovalRequestModal,
  ReservationAlertsPanel,
  ReservationNotificationRoutingSettings,
} from "@/features/owner/components";
import { PaymentMethodsManager } from "@/features/owner/components/payment-methods-manager";
import { canAccessPage } from "@/features/owner/helpers";
import {
  useMutRequestRemoval,
  useMutSetMyReservationNotificationPreference,
  useMutUpdateOrganization,
  useQueryCurrentOrganization,
  useQueryMyReservationNotificationPreference,
  useQueryOwnerOrganization,
} from "@/features/owner/hooks";
import { useModOwnerPermissionContext } from "@/features/owner/hooks/organization";
import {
  type OrganizationFormData,
  organizationSchema,
  type RemovalRequestFormData,
} from "@/features/owner/schemas";
import { isOwnerRole } from "@/lib/modules/organization-member/shared/permissions";

export default function OwnerSettingsPage() {
  const { data: user } = useQueryAuthSession();
  const logoutMutation = useMutAuthLogout();
  const [removalModalOpen, setRemovalModalOpen] = React.useState(false);
  const [activeSectionHash, setActiveSectionHash] = React.useState("");

  // Use the shared organization hook for sidebar
  const { organization: navOrg, organizations } = useQueryOwnerOrganization();
  const { permissionContext, isLoading: permissionContextLoading } =
    useModOwnerPermissionContext();

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

  const notifPrefQuery =
    useQueryMyReservationNotificationPreference(organizationId);
  const setNotifPref = useMutSetMyReservationNotificationPreference(
    organizationId ?? "",
  );

  const onPushEnabled = React.useCallback(async () => {
    if (!organizationId) return;
    if (notifPrefQuery.data?.enabled) return;
    try {
      await setNotifPref.mutateAsync({ organizationId, enabled: true });
      toast.success("Reservation notifications also enabled for this venue.");
    } catch {
      // Silently ignore — the user can still toggle routing manually
    }
  }, [organizationId, notifPrefQuery.data?.enabled, setNotifPref]);

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
    window.location.href = appRoutes.login.from(
      appRoutes.organization.settings,
    );
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

  React.useEffect(() => {
    const syncHash = () => {
      setActiveSectionHash(window.location.hash.replace("#", ""));
    };

    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  const canAccessSettings = permissionContext
    ? canAccessPage(permissionContext, { type: "owner-or-manager" })
    : false;
  const isOwner = permissionContext ? isOwnerRole(permissionContext) : false;
  const ownerOnlySectionIds = new Set<SettingsSectionId>([
    SETTINGS_SECTION_IDS.organizationProfile,
    SETTINGS_SECTION_IDS.contactInformation,
    SETTINGS_SECTION_IDS.paymentMethods,
    SETTINGS_SECTION_IDS.dangerZone,
  ]);
  const showOwnerOnlySectionHint =
    canAccessSettings &&
    !isOwner &&
    isSettingsSectionId(activeSectionHash) &&
    ownerOnlySectionIds.has(activeSectionHash);

  if (orgLoading) {
    return (
      <AppShell
        sidebar={
          <OwnerSidebar
            currentOrganization={navOrg ?? { id: "", name: "Loading..." }}
            organizations={organizations}
            user={{ name: user?.email?.split("@")[0], email: user?.email }}
            isAdmin={user?.role === "admin"}
          />
        }
        navbar={
          <OwnerNavbar
            organizationName={navOrg?.name ?? "Loading..."}
            user={{ name: user?.email?.split("@")[0], email: user?.email }}
            onLogout={handleLogout}
            isAdmin={user?.role === "admin"}
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

  if (permissionContextLoading || !permissionContext) {
    return (
      <AppShell
        sidebar={
          <OwnerSidebar
            currentOrganization={navOrg ?? { id: "", name: "Loading..." }}
            organizations={organizations}
            user={{ name: user?.email?.split("@")[0], email: user?.email }}
            isAdmin={user?.role === "admin"}
          />
        }
        navbar={
          <OwnerNavbar
            organizationName={navOrg?.name ?? "Loading..."}
            user={{ name: user?.email?.split("@")[0], email: user?.email }}
            onLogout={handleLogout}
            isAdmin={user?.role === "admin"}
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
          isAdmin={user?.role === "admin"}
        />
      }
      navbar={
        <OwnerNavbar
          organizationName={navOrg?.name ?? "No Organization"}
          user={{ name: user?.email?.split("@")[0], email: user?.email }}
          onLogout={handleLogout}
          isAdmin={user?.role === "admin"}
        />
      }
      floatingPanel={
        <ReservationAlertsPanel organizationId={navOrg?.id ?? null} />
      }
    >
      {!canAccessSettings ? (
        <NoAccessView
          title="Access Restricted"
          message="Organization settings are available only to owners and managers."
          actionLabel="Open Team & Access"
          actionHref={appRoutes.organization.team}
        />
      ) : (
        <div className="space-y-6">
          {/* Page header */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-heading">
              Organization Settings
            </h1>
            <p className="text-muted-foreground">
              {isOwner
                ? "Manage your organization profile and preferences"
                : "Manage your notification and personal preferences"}
            </p>
          </div>

          {showOwnerOnlySectionHint ? (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
              <div className="font-medium">
                That section is only available to organization owners.
              </div>
              <p className="mt-1">
                Ask an owner to update it or manage team permissions from Team
                &amp; Access.
              </p>
              <Button asChild className="mt-3" size="sm" variant="outline">
                <Link href={appRoutes.organization.team}>
                  Open Team &amp; Access
                </Link>
              </Button>
            </div>
          ) : null}

          {isOwner ? (
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
          ) : null}

          <PortalPreferenceCard id={SETTINGS_SECTION_IDS.defaultPortal} />

          <WebPushSettingsCard
            id={SETTINGS_SECTION_IDS.browserNotifications}
            onEnabled={onPushEnabled}
          />

          {organization?.id && (
            <ReservationNotificationRoutingSettings
              organizationId={organization.id}
              sectionId={SETTINGS_SECTION_IDS.reservationNotificationRouting}
              teamAccessHref={appRoutes.organization.team}
            />
          )}

          {isOwner && organization?.id ? (
            <PaymentMethodsManager
              organizationId={organization.id}
              sectionId={SETTINGS_SECTION_IDS.paymentMethods}
            />
          ) : null}

          {isOwner ? (
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
                      Remove your courts from public search and cancel all
                      pending reservations
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
          ) : null}
        </div>
      )}
      {isOwner ? (
        <RemovalRequestModal
          open={removalModalOpen}
          onOpenChange={setRemovalModalOpen}
          onSubmit={handleRemovalRequest}
          isLoading={requestRemoval.isPending}
        />
      ) : null}
    </AppShell>
  );
}
