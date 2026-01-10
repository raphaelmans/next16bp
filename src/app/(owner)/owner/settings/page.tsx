"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Check, Loader2, Upload } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useLogout, useSession } from "@/features/auth";
import { OwnerNavbar, OwnerSidebar } from "@/features/owner";
import { RemovalRequestModal } from "@/features/owner/components/removal-request-modal";
import { useOwnerOrganization } from "@/features/owner/hooks";
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
import { cn } from "@/lib/utils";
import { AppShell } from "@/shared/components/layout";

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

  // Update form when organization data loads
  React.useEffect(() => {
    if (organization) {
      form.reset({
        name: organization.name,
        slug: organization.slug,
        description: organization.description || "",
        email: organization.email || "",
        phone: organization.phone || "",
        address: organization.address || "",
      });
    }
  }, [organization, form]);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = "/login";
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

    uploadLogo.mutate({ organizationId: organization.id, image: file });

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
            {/* Organization Details Card */}
            <Card>
              <CardHeader>
                <CardTitle>Organization Profile</CardTitle>
                <CardDescription>
                  Update your organization&apos;s public information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo Upload */}
                <div className="space-y-2">
                  <Label>Logo</Label>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={organization?.logoUrl} />
                      <AvatarFallback className="text-2xl">
                        {organization?.name?.charAt(0) || "O"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadLogo.isPending}
                      >
                        {uploadLogo.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        {uploadLogo.isPending ? "Uploading..." : "Upload Logo"}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">
                        Recommended: 200x200px, max 5MB
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Organization Name{" "}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="My Sports Complex" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Slug */}
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        URL Slug <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground">
                            kudoscourts.com/org/
                          </span>
                          <div className="relative flex-1">
                            <Input
                              className={cn(
                                "rounded-l-none",
                                slugStatus === "available" &&
                                  "border-green-500 focus-visible:ring-green-500",
                                slugStatus === "taken" &&
                                  "border-red-500 focus-visible:ring-red-500",
                              )}
                              placeholder="my-sports-complex"
                              {...field}
                              onChange={(e) =>
                                handleSlugChange(
                                  e.target.value
                                    .toLowerCase()
                                    .replace(/[^a-z0-9-]/g, "-"),
                                )
                              }
                            />
                            {slugStatus === "checking" && (
                              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                            {slugStatus === "available" && (
                              <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                            )}
                          </div>
                        </div>
                      </FormControl>
                      <FormDescription>
                        {slugStatus === "taken"
                          ? "This URL is already taken"
                          : "This will be your organization's unique URL"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell visitors about your organization..."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value?.length || 0}/500 characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Contact Information Card */}
            <Card>
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

        {/* Danger Zone */}
        <Card className="border-destructive">
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
