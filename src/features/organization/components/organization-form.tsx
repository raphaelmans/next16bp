"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { S } from "@/common/schemas";
import { toast } from "@/common/toast";
import { getClientErrorMessage } from "@/common/toast/errors";
import { StandardFormInput, StandardFormProvider } from "@/components/form";
import { Button } from "@/components/ui/button";
import { useMutOrganizationCreate } from "@/features/organization/hooks";

const organizationFormSchema = z.object({
  name: S.organization.name,
});

type OrganizationFormValues = z.infer<typeof organizationFormSchema>;

interface OrganizationFormProps {
  onSuccess?: (org: { id: string }) => void;
  onCancel?: () => void;
}

export function OrganizationForm({
  onSuccess,
  onCancel,
}: OrganizationFormProps) {
  const createMutation = useMutOrganizationCreate(onSuccess);

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationFormSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
    },
  });

  const {
    reset,
    formState: { isDirty, isSubmitting, isValid },
  } = form;
  const submitting = createMutation.isPending || isSubmitting;
  const isSubmitDisabled = submitting || !isValid || !isDirty;

  const onSubmit = async (data: OrganizationFormValues) => {
    try {
      await createMutation.mutateAsync({
        name: data.name,
      });
      reset({ name: data.name });
    } catch (error) {
      toast.error("Unable to create organization", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-lg font-heading font-semibold">
          Create Your Organization
        </h2>
        <p className="text-sm text-muted-foreground">
          Set up your organization to start listing courts on Kudos
        </p>
      </div>

      <StandardFormProvider
        form={form}
        onSubmit={onSubmit}
        className="space-y-6"
      >
        <StandardFormInput<OrganizationFormValues>
          name="name"
          label="Organization Name"
          placeholder="My Sports Club (Pickleball)"
          required
        />

        <div className="flex gap-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            className="flex-1"
            disabled={isSubmitDisabled}
            loading={submitting}
          >
            Create Organization
          </Button>
        </div>
      </StandardFormProvider>
    </div>
  );
}
