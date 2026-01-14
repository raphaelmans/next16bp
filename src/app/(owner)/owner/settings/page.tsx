"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  Check,
  Loader2,
  Pencil,
  Plus,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useLogout, useSession } from "@/features/auth";
import { OwnerNavbar, OwnerSidebar } from "@/features/owner";
import {
  RemovalRequestModal,
  ReservationAlertsPanel,
} from "@/features/owner/components";
import {
  useCreateOrganizationPaymentMethod,
  useDeleteOrganizationPaymentMethod,
  useOrganizationPaymentMethods,
  useOwnerOrganization,
  useSetDefaultOrganizationPaymentMethod,
  useUpdateOrganizationPaymentMethod,
} from "@/features/owner/hooks";
import {
  useCheckSlug,
  useCurrentOrganization,
  useRequestRemoval,
  useUpdateOrganization,
  useUploadOrganizationLogo,
} from "@/features/owner/hooks/use-organization";
import {
  type OrganizationFormData,
  organizationSchema,
  type RemovalRequestFormData,
} from "@/features/owner/schemas/organization.schema";
import {
  type OrganizationPaymentMethodFormData,
  organizationPaymentMethodSchema,
} from "@/features/owner/schemas/organization-payment-method.schema";
import { cn } from "@/lib/utils";
import { AppShell } from "@/shared/components/layout";
import { appRoutes } from "@/shared/lib/app-routes";
import {
  BANK_PROVIDERS,
  MOBILE_WALLET_PROVIDERS,
  PAYMENT_METHOD_TYPE_LABELS,
  PAYMENT_PROVIDER_LABELS,
  type PaymentMethodProvider,
  type PaymentMethodType,
} from "@/shared/lib/payment-methods";
import { SETTINGS_SECTION_IDS } from "@/shared/lib/section-hashes";

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
  const { data: user } = useSession();
  const logoutMutation = useLogout();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [removalModalOpen, setRemovalModalOpen] = React.useState(false);
  const [slugStatus, setSlugStatus] = React.useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");

  // Use the shared organization hook for sidebar
  const { organization: navOrg, organizations } = useOwnerOrganization();

  // Use the current organization hook for the form data
  const { data: organization, isLoading: orgLoading } =
    useCurrentOrganization();
  const updateOrg = useUpdateOrganization();
  const requestRemoval = useRequestRemoval();
  const checkSlug = useCheckSlug();
  const uploadLogo = useUploadOrganizationLogo(organization?.id ?? "");

  const paymentMethodsQuery = useOrganizationPaymentMethods(organization?.id);
  const createPaymentMethod = useCreateOrganizationPaymentMethod(
    organization?.id ?? "",
  );
  const updatePaymentMethod = useUpdateOrganizationPaymentMethod(
    organization?.id ?? "",
  );
  const deletePaymentMethod = useDeleteOrganizationPaymentMethod(
    organization?.id ?? "",
  );
  const setDefaultPaymentMethod = useSetDefaultOrganizationPaymentMethod(
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
    defaultValues: defaultPaymentMethodValues,
  });

  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      email: "",
      phone: "",
      address: "",
    },
  });

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
    if (organizationFormValues) {
      form.reset(organizationFormValues);
    }
  }, [form.reset, organizationFormValues]);

  const selectedPaymentType = paymentForm.watch("type");
  const providerOptions: PaymentMethodProvider[] =
    selectedPaymentType === "BANK"
      ? [...BANK_PROVIDERS]
      : [...MOBILE_WALLET_PROVIDERS];

  React.useEffect(() => {
    const currentProvider = paymentForm.getValues("provider");
    if (!providerOptions.includes(currentProvider)) {
      paymentForm.setValue("provider", providerOptions[0]);
    }
  }, [paymentForm, providerOptions]);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = appRoutes.login.from(appRoutes.owner.settings);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const file = e.target.files?.[0];
    if (!file || !organization?.id) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Logo must be smaller than 5MB");
      return;
    }

    const formData = new FormData();
    formData.append("organizationId", organization.id);
    formData.append("image", file, file.name);
    uploadLogo.mutate(formData);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSlugChange = (slug: string) => {
    form.setValue("slug", slug);

    if (slug.length >= 3 && slug !== organization?.slug) {
      setSlugStatus("checking");
      checkSlug.mutate(slug, {
        onSuccess: (result) => {
          setSlugStatus(result.available ? "available" : "taken");
        },
        onError: () => {
          setSlugStatus("idle");
        },
      });
    } else {
      setSlugStatus("idle");
    }
  };

  const paymentMethods = (paymentMethodsQuery.data?.methods ??
    []) as OrganizationPaymentMethodItem[];
  const isSavingPaymentMethod =
    createPaymentMethod.isPending || updatePaymentMethod.isPending;

  const resetPaymentMethodForm = () => {
    paymentForm.reset(defaultPaymentMethodValues);
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
    paymentForm.reset({
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

  const handleSavePaymentMethod = paymentForm.handleSubmit(async (values) => {
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
      const message =
        error instanceof Error
          ? error.message
          : "Failed to save payment method";
      toast.error(message);
    }
  });

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

  const handleSubmit = form.handleSubmit((data) => {
    if (!organization?.id) return;
    updateOrg.mutate(
      {
        organizationId: organization.id,
        name: data.name,
        slug: data.slug,
        description: data.description,
        email: data.email,
        phone: data.phone,
        address: data.address,
      },
      {
        onSuccess: () => {
          toast.success("Settings saved successfully");
        },
        onError: () => {
          toast.error("Failed to save settings");
        },
      },
    );
  });

  const handleRemovalRequest = (data: RemovalRequestFormData) => {
    requestRemoval.mutate(data, {
      onSuccess: () => {
        toast.success("Removal request submitted successfully");
        setRemovalModalOpen(false);
      },
      onError: () => {
        toast.error("Failed to submit removal request");
      },
    });
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

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="contact@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="0917 123 4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="123 Sports Ave, Makati City"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={updateOrg.isPending || slugStatus === "taken"}
              >
                {updateOrg.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>

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
            <Form {...paymentForm}>
              <form onSubmit={handleSavePaymentMethod} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={paymentForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Method Type</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(PAYMENT_METHOD_TYPE_LABELS).map(
                              ([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={paymentForm.control}
                    name="provider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Provider</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select provider" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {providerOptions.map((provider) => (
                              <SelectItem key={provider} value={provider}>
                                {PAYMENT_PROVIDER_LABELS[provider]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={paymentForm.control}
                  name="accountName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Juan Dela Cruz" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={paymentForm.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number</FormLabel>
                      <FormControl>
                        <Input placeholder="0917 123 4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={paymentForm.control}
                  name="instructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instructions (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="Include reservation ID in the payment note."
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Shown to players for this payment method.
                      </FormDescription>
                    </FormItem>
                  )}
                />
                <div className="flex flex-wrap items-center gap-6">
                  <FormField
                    control={paymentForm.control}
                    name="isDefault"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                          <Switch
                            checked={field.value ?? false}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Set as default
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={paymentForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                          <Switch
                            checked={field.value ?? true}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">Active</FormLabel>
                      </FormItem>
                    )}
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
                  <Button type="submit" disabled={isSavingPaymentMethod}>
                    {isSavingPaymentMethod && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {editingPaymentMethod ? "Save Changes" : "Add Method"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
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

      {/* Removal Request Modal */}
      <RemovalRequestModal
        open={removalModalOpen}
        onOpenChange={setRemovalModalOpen}
        onSubmit={handleRemovalRequest}
        isLoading={requestRemoval.isPending}
      />
    </AppShell>
  );
}
