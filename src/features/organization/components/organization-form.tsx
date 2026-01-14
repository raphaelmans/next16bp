"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Loader2 } from "lucide-react";
import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { StandardFormInput, StandardFormProvider } from "@/components/form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getClientErrorMessage } from "@/shared/lib/toast-errors";
import { trpc } from "@/trpc/client";

const organizationFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(150),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens")
    .optional()
    .or(z.literal("")),
});

type OrganizationFormValues = z.infer<typeof organizationFormSchema>;

interface OrganizationFormProps {
  onSuccess?: (org: { id: string }) => void;
  onCancel?: () => void;
}

const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export function OrganizationForm({
  onSuccess,
  onCancel,
}: OrganizationFormProps) {
  const utils = trpc.useUtils();

  const createMutation = trpc.organization.create.useMutation({
    onSuccess: async (data) => {
      await utils.organization.my.invalidate();
      onSuccess?.({ id: data.organization.id });
    },
  });

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationFormSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  const {
    control,
    reset,
    formState: { isDirty, isSubmitting, isValid },
  } = form;
  const nameValue = useWatch({ control, name: "name" });
  const slugValue = useWatch({ control, name: "slug" });

  const previewSlug = useMemo(
    () => slugValue || (nameValue ? generateSlug(nameValue) : "your-org-slug"),
    [nameValue, slugValue],
  );

  const submitting = createMutation.isPending || isSubmitting;
  const isSubmitDisabled = submitting || !isValid || !isDirty;

  const onSubmit = async (data: OrganizationFormValues) => {
    try {
      await createMutation.mutateAsync({
        name: data.name,
        slug: data.slug || undefined,
      });
      reset({ name: data.name, slug: data.slug ?? "" });
    } catch (error) {
      toast.error("Unable to create organization", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>Create Your Organization</CardTitle>
        <CardDescription>
          Set up your organization to start listing courts on Kudos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <StandardFormProvider
          form={form}
          onSubmit={onSubmit}
          className="space-y-6"
        >
          <StandardFormInput<OrganizationFormValues>
            name="name"
            label="Organization Name"
            placeholder="My Pickleball Club"
            required
          />

          <div className="space-y-2">
            <StandardFormInput<OrganizationFormValues>
              name="slug"
              label="Custom URL (optional)"
              placeholder={previewSlug}
            />
            <p className="text-xs text-muted-foreground">
              Preview: kudoscourts.com/{previewSlug}
            </p>
          </div>

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
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Organization
            </Button>
          </div>
        </StandardFormProvider>
      </CardContent>
    </Card>
  );
}
