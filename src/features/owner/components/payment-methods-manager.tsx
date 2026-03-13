"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import {
  BANK_PROVIDERS,
  MOBILE_WALLET_PROVIDERS,
  PAYMENT_METHOD_TYPE_LABELS,
  PAYMENT_PROVIDER_LABELS,
  type PaymentMethodProvider,
  type PaymentMethodType,
} from "@/common/payment-methods";
import { toast } from "@/common/toast";
import { getClientErrorMessage } from "@/common/toast/errors";
import {
  StandardFormField,
  StandardFormInput,
  StandardFormProvider,
  StandardFormSelect,
  StandardFormSwitch,
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
import {
  useMutCreateOrganizationPaymentMethod,
  useMutDeleteOrganizationPaymentMethod,
  useMutSetDefaultOrganizationPaymentMethod,
  useMutUpdateOrganizationPaymentMethod,
  useQueryOrganizationPaymentMethods,
} from "@/features/owner/hooks";
import {
  type OrganizationPaymentMethodFormData,
  organizationPaymentMethodSchema,
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

interface PaymentMethodsManagerProps {
  organizationId: string;
  sectionId?: string;
  onMethodChanged?: () => void;
}

export function PaymentMethodsManager({
  organizationId,
  sectionId,
  onMethodChanged,
}: PaymentMethodsManagerProps) {
  const paymentMethodsQuery =
    useQueryOrganizationPaymentMethods(organizationId);
  const createPaymentMethod =
    useMutCreateOrganizationPaymentMethod(organizationId);
  const updatePaymentMethod =
    useMutUpdateOrganizationPaymentMethod(organizationId);
  const deletePaymentMethod =
    useMutDeleteOrganizationPaymentMethod(organizationId);
  const setDefaultPaymentMethod =
    useMutSetDefaultOrganizationPaymentMethod(organizationId);

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

  const {
    getValues: getPaymentValues,
    reset: resetPaymentForm,
    setValue: setPaymentValue,
    formState: { isDirty: isPaymentDirty, isSubmitting: isPaymentSubmitting },
  } = paymentForm;

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

  const paymentMethods = (paymentMethodsQuery.data?.methods ??
    []) as OrganizationPaymentMethodItem[];
  const isSavingPaymentMethod =
    createPaymentMethod.isPending || updatePaymentMethod.isPending;
  const paymentSubmitting = isSavingPaymentMethod || isPaymentSubmitting;
  const isPaymentSubmitDisabled = paymentSubmitting || !isPaymentDirty;

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
          organizationId,
          ...payload,
        });
        toast.success("Payment method added");
      }
      resetPaymentMethodForm();
      setPaymentMethodDialogOpen(false);
      onMethodChanged?.();
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
      onMethodChanged?.();
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
      onMethodChanged?.();
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
      onMethodChanged?.();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to delete payment method";
      toast.error(message);
    }
  };

  return (
    <>
      <Card id={sectionId}>
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
                        <p className="text-muted-foreground">Account Number</p>
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
              <Button
                type="submit"
                disabled={isPaymentSubmitDisabled}
                loading={paymentSubmitting}
              >
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
              loading={deletePaymentMethod.isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
