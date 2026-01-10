"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Info } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useProfile,
  useUpdateProfile,
  useUploadAvatar,
} from "../hooks/use-profile";
import {
  type ProfileFormValues,
  profileSchema,
} from "../schemas/profile.schema";
import { AvatarUpload } from "./avatar-upload";
import { ProfileFormSkeleton } from "./skeletons";

export function ProfileForm() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
      email: "",
      phoneNumber: "",
      avatarUrl: "",
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = form;

  // Sync profile data to form (only when profile ID changes)
  useEffect(() => {
    if (profile) {
      reset({
        displayName: profile.displayName || "",
        email: profile.email || "",
        phoneNumber: profile.phoneNumber || "",
        avatarUrl: profile.avatarUrl || "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    profile?.id,
    profile.avatarUrl,
    profile.displayName,
    profile.email,
    profile.phoneNumber,
    profile,
    reset,
  ]); // Only reset when profile ID changes, not on every profile update

  const onSubmit = (data: ProfileFormValues) => {
    // Filter out empty strings to avoid validation errors
    const cleanedData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== ""),
    ) as ProfileFormValues;

    updateProfile.mutate(cleanedData, {
      onSuccess: () => {
        // Form will be reset when profile refetches via useEffect
      },
    });
  };

  const handleAvatarSelect = (file: File) => {
    uploadAvatar.mutate({ image: file });
  };

  if (isLoading) {
    return <ProfileFormSkeleton />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>
          Update your profile information. This will be shared with court owners
          when you make a reservation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Avatar section */}
          <AvatarUpload
            currentAvatarUrl={profile?.avatarUrl ?? undefined}
            displayName={profile?.displayName ?? undefined}
            onFileSelect={handleAvatarSelect}
            isUploading={uploadAvatar.isPending}
          />

          {/* Form fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">
                Display Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="displayName"
                placeholder="Enter your name"
                {...register("displayName")}
              />
              {errors.displayName && (
                <p className="text-sm text-destructive">
                  {errors.displayName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="09XX XXX XXXX"
                {...register("phoneNumber")}
              />
              {errors.phoneNumber && (
                <p className="text-sm text-destructive">
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>
          </div>

          {/* Info note */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Your contact information will be shared with court owners when you
              make a reservation to help them contact you if needed.
            </AlertDescription>
          </Alert>

          {/* Submit button */}
          <div className="flex flex-col items-end gap-2">
            {process.env.NODE_ENV === "development" && (
              <p className="text-xs text-muted-foreground">
                Form dirty: {isDirty ? "Yes" : "No"}
              </p>
            )}
            <Button
              type="submit"
              disabled={!isDirty || updateProfile.isPending}
            >
              {updateProfile.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
