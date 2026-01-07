"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Building2 } from "lucide-react";

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

export function OrganizationForm({
  onSuccess,
  onCancel,
}: OrganizationFormProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [slugPreview, setSlugPreview] = useState<string>("");

  const createMutation = useMutation({
    ...trpc.organization.create.mutationOptions(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: trpc.organization.my.queryKey(),
      });
      onSuccess?.({ id: data.organization.id });
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  const nameValue = watch("name");
  const slugValue = watch("slug");

  // Generate slug preview from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const previewSlug =
    slugValue || (nameValue ? generateSlug(nameValue) : "your-org-slug");

  const onSubmit = (data: OrganizationFormValues) => {
    createMutation.mutate({
      name: data.name,
      slug: data.slug || undefined,
    });
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">
              Organization Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="My Pickleball Club"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Custom URL (optional)</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                kudoscourts.com/
              </span>
              <Input
                id="slug"
                placeholder={previewSlug}
                {...register("slug")}
              />
            </div>
            {errors.slug && (
              <p className="text-sm text-destructive">{errors.slug.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Preview: kudoscourts.com/{previewSlug}
            </p>
          </div>

          {createMutation.error && (
            <p className="text-sm text-destructive">
              {createMutation.error.message}
            </p>
          )}

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
              disabled={createMutation.isPending}
            >
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Organization
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
