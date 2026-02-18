"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  Loader2,
  Pencil,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { appRoutes } from "@/common/app-routes";
import {
  BANK_PROVIDERS,
  MOBILE_WALLET_PROVIDERS,
  PAYMENT_METHOD_TYPE_LABELS,
  PAYMENT_PROVIDER_LABELS,
  type PaymentMethodProvider,
  type PaymentMethodType,
} from "@/common/payment-methods";
import { SETTINGS_SECTION_IDS } from "@/common/section-hashes";
import { toast } from "@/common/toast";
import { getClientErrorMessage } from "@/common/toast/errors";
import {
  StandardFormField,
  StandardFormInput,
  StandardFormProvider,
  StandardFormSelect,
  StandardFormSwitch,
} from "@/components/form";
import { AppShell } from "@/components/layout";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useMutAuthLogout, useQueryAuthSession } from "@/features/auth";
import { WebPushSettingsCard } from "@/features/notifications/components/web-push-settings";
import { OwnerNavbar, OwnerSidebar } from "@/features/owner";
import {
  RemovalRequestModal,
  ReservationAlertsPanel,
} from "@/features/owner/components";
import {
  useMutCreateOrganizationPaymentMethod,
  useMutDeleteOrganizationPaymentMethod,
  useMutRequestRemoval,
  useMutSetDefaultOrganizationPaymentMethod,
  useMutUpdateOrganization,
  useMutUpdateOrganizationPaymentMethod,
  useQueryCurrentOrganization,
  useQueryOrganizationPaymentMethods,
  useQueryOwnerOrganization,
} from "@/features/owner/hooks";
import {
  type OrganizationFormData,
  type OrganizationPaymentMethodFormData,
  organizationPaymentMethodSchema,
  organizationSchema,
  type RemovalRequestFormData,
} from "@/features/owner/schemas";

interface OrganizationPaymentMethodItem {
  id: string;
  type: PaymentMethodType;
  provider: PaymentMethodProvider;
  accountName: string;
  accountNumber: string;
  instructions: string | null;
  isActive: boolean;
  isDefault: boolean;
  displayOrder: number;
}

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

  const paymentMethodsQuery = useQueryOrganizationPaymentMethods(
    organization?.id,
  );
  const createPaymentMethod = useMutCreateOrganizationPaymentMethod(
    organization?.id ?? "",
  );
  const updatePaymentMethod = useMutUpdateOrganizationPaymentMethod(
    organization?.id ?? "",
  );
  const deletePaymentMethod = useMutDeleteOrganizationPaymentMethod(
    organization?.id ?? "",
  );
  const setDefaultPaymentMethod = useMutSetDefaultOrganizationPaymentMethod(
    organization?.id ?? "",
  );

  const [paymentMethodDialogOpen, setPaymentMethodDialogOpen] =
    React.useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] =
    React.useState<OrganizationPaymentMethodItem | null>(null);
  const [paymentMethodToDelete, setPaymentMethodToDelete] =
    React.useState<OrganizationPaymentMethodItem | null>(null);

  const defaultPaymentMethodValues: OrganizationPaymentMethodFormData = {
    type: "MOBILE_WALLET",
    provider: MOBILE_WALLET_PROVIDERS[0],
    accountName: "",
    accountNumber: "",
    instructions: "",
    isDefault: false,
    isActive: true,
  };

  const paymentForm = useForm<OrganizationPaymentMethodFormData>({
    resolver: zodResolver(organizationPaymentMethodSchema),
    mode: "onChange",
    defaultValues: defaultPaymentMethodValues,
  });

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

  const {
    getValues: getPaymentValues,
    reset: resetPaymentForm,
    setValue: setPaymentValue,
    formState: { isDirty: isPaymentDirty, isSubmitting: isPaymentSubmitting },
  } = paymentForm;

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

  const selectedPaymentType = paymentForm.watch("type");
  const providerOptions: PaymentMethodProvider[] =
    selectedPaymentType === "BANK"
      ? [...BANK_PROVIDERS]
      : [...MOBILE_WALLET_PROVIDERS];

  React.useEffect(() => {
    const currentProvider = getPaymentValues("provider");
    if (!providerOptions.includes(currentProvider)) {
      setPaymentValue("provider", providerOptions[0], {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    }
  }, [getPaymentValues, providerOptions, setPaymentValue]);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(appRoutes.owner.settings);
  };

  const paymentMethods = (paymentMethodsQuery.data?.methods ??
    []) as OrganizationPaymentMethodItem[];
  const isSavingPaymentMethod =
    createPaymentMethod.isPending || updatePaymentMethod.isPending;
  const paymentSubmitting = isSavingPaymentMethod || isPaymentSubmitting;
  const isPaymentSubmitDisabled = paymentSubmitting || !isPaymentDirty;
  const orgSubmitting = updateOrg.isPending || isOrgSubmitting;
  const isOrgSubmitDisabled = orgSubmitting || !isOrgDirty;

  const resetPaymentMethodForm = () => {
    resetPaymentForm(defaultPaymentMethodValues);
    setEditingPaymentMethod(null);
  };

  const handlePaymentDialogChange = (open: boolean) => {
    setPaymentMethodDialogOpen(open);
    if (!open) {
      resetPaymentMethodForm();
    }
  };

  const handleCreatePaymentMethod = () => {
    resetPaymentMethodForm();
    setPaymentMethodDialogOpen(true);
  };

  const handleEditPaymentMethod = (method: OrganizationPaymentMethodItem) => {
    setEditingPaymentMethod(method);
    resetPaymentForm({
      type: method.type,
      provider: method.provider,
      accountName: method.accountName,
      accountNumber: method.accountNumber,
      instructions: method.instructions ?? "",
      isDefault: method.isDefault,
      isActive: method.isActive,
    });
    setPaymentMethodDialogOpen(true);
  };

  const handleSavePaymentMethod = async (
    values: OrganizationPaymentMethodFormData,
  ) => {
    if (!organization?.id) return;
    const payload = {
      type: values.type,
      provider: values.provider,
      accountName: values.accountName.trim(),
      accountNumber: values.accountNumber.trim(),
      instructions: values.instructions?.trim() || undefined,
      isDefault: values.isDefault,
      isActive: values.isActive,
    };

    try {
      if (editingPaymentMethod) {
        await updatePaymentMethod.mutateAsync({
          paymentMethodId: editingPaymentMethod.id,
          ...payload,
          instructions: values.instructions?.trim() || null,
        });
        toast.success("Payment method updated");
      } else {
        await createPaymentMethod.mutateAsync({
          organizationId: organization.id,
          ...payload,
        });
        toast.success("Payment method added");
      }
      resetPaymentMethodForm();
      setPaymentMethodDialogOpen(false);
    } catch (error) {
      toast.error("Failed to save payment method", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  const handleTogglePaymentMethod = async (
    method: OrganizationPaymentMethodItem,
  ) => {
    try {
      await updatePaymentMethod.mutateAsync({
        paymentMethodId: method.id,
        isActive: !method.isActive,
      });
      toast.success(
        method.isActive
          ? "Payment method deactivated"
          : "Payment method activated",
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update payment method";
      toast.error(message);
    }
  };

  const handleSetDefault = async (method: OrganizationPaymentMethodItem) => {
    try {
      await setDefaultPaymentMethod.mutateAsync({
        paymentMethodId: method.id,
      });
      toast.success("Default payment method updated");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to set default payment method";
      toast.error(message);
    }
  };

  const handleConfirmDelete = async () => {
    if (!paymentMethodToDelete) return;
    try {
      await deletePaymentMethod.mutateAsync({
        paymentMethodId: paymentMethodToDelete.id,
      });
      toast.success("Payment method deleted");
      setPaymentMethodToDelete(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to delete payment method";
      toast.error(message);
    }
  };

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

        <Card id={SETTINGS_SECTION_IDS.paymentMethods}>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>
                Add mobile wallets and bank accounts for booking payments.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleCreatePaymentMethod}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Payment Method
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {paymentMethodsQuery.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : paymentMethods.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No payment methods yet. Add at least one to receive payments.
              </div>
            ) : (
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="rounded-lg border p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">
                            {PAYMENT_PROVIDER_LABELS[method.provider]}
                          </span>
                          <Badge variant="outline">
                            {PAYMENT_METHOD_TYPE_LABELS[method.type]}
                          </Badge>
                          {method.isDefault && (
                            <Badge variant="secondary">Default</Badge>
                          )}
                          {!method.isActive && (
                            <Badge variant="outline">Inactive</Badge>
                          )}
                        </div>

                        <div className="text-sm">
                          <p className="text-muted-foreground">Account Name</p>
                          <p className="font-medium">{method.accountName}</p>
                        </div>
                        <div className="text-sm">
                          <p className="text-muted-foreground">
                            Account Number
                          </p>
                          <p className="font-mono font-medium">
                            {method.accountNumber}
                          </p>
                        </div>
                        {method.instructions && (
                          <p className="text-sm text-muted-foreground">
                            {method.instructions}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditPaymentMethod(method)}
                          disabled={isSavingPaymentMethod}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        {!method.isDefault && method.isActive && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefault(method)}
                            disabled={setDefaultPaymentMethod.isPending}
                          >
                            <Star className="h-4 w-4 mr-2" />
                            Set Default
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleTogglePaymentMethod(method)}
                          disabled={updatePaymentMethod.isPending}
                        >
                          {method.isActive ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => setPaymentMethodToDelete(method)}
                          disabled={deletePaymentMethod.isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog
          open={paymentMethodDialogOpen}
          onOpenChange={handlePaymentDialogChange}
        >
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle>
                {editingPaymentMethod
                  ? "Edit Payment Method"
                  : "Add Payment Method"}
              </DialogTitle>
              <DialogDescription>
                Add a mobile wallet or bank account for player payments.
              </DialogDescription>
            </DialogHeader>
            <StandardFormProvider
              form={paymentForm}
              onSubmit={handleSavePaymentMethod}
              className="space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <StandardFormSelect<OrganizationPaymentMethodFormData>
                  name="type"
                  label="Method Type"
                  placeholder="Select type"
                  options={Object.entries(PAYMENT_METHOD_TYPE_LABELS).map(
                    ([value, label]) => ({
                      value,
                      label,
                    }),
                  )}
                  required
                />
                <StandardFormSelect<OrganizationPaymentMethodFormData>
                  name="provider"
                  label="Provider"
                  placeholder="Select provider"
                  options={providerOptions.map((provider) => ({
                    value: provider,
                    label: PAYMENT_PROVIDER_LABELS[provider],
                  }))}
                  required
                />
              </div>
              <StandardFormInput<OrganizationPaymentMethodFormData>
                name="accountName"
                label="Account Name"
                placeholder="Juan Dela Cruz"
                required
              />
              <StandardFormInput<OrganizationPaymentMethodFormData>
                name="accountNumber"
                label="Account Number"
                placeholder="0917 123 4567"
                required
              />
              <StandardFormField<OrganizationPaymentMethodFormData>
                name="instructions"
                label="Instructions (optional)"
                description="Shown to players for this payment method."
              >
                {({ field }) => (
                  <Textarea
                    rows={3}
                    placeholder="Include reservation ID in the payment note."
                    value={typeof field.value === "string" ? field.value : ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                )}
              </StandardFormField>
              <div className="flex flex-wrap items-center gap-6">
                <StandardFormSwitch<OrganizationPaymentMethodFormData>
                  name="isDefault"
                  label="Set as default"
                />
                <StandardFormSwitch<OrganizationPaymentMethodFormData>
                  name="isActive"
                  label="Active"
                />
              </div>
              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handlePaymentDialogChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPaymentSubmitDisabled}>
                  {paymentSubmitting && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingPaymentMethod ? "Save Changes" : "Add Method"}
                </Button>
              </DialogFooter>
            </StandardFormProvider>
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={!!paymentMethodToDelete}
          onOpenChange={(open) => {
            if (!open) {
              setPaymentMethodToDelete(null);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Payment Method</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the payment method from player payment screens.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(event) => {
                  event.preventDefault();
                  handleConfirmDelete();
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deletePaymentMethod.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
