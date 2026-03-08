"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "@/common/toast";
import { getClientErrorMessage } from "@/common/toast/errors";
import { StandardFormInput, StandardFormProvider } from "@/components/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  useMutUpdateProfile,
  useMutUploadAvatar,
  useQueryProfile,
} from "../hooks";
import { type ProfileFormValues, profileSchema } from "../schemas";
import { AvatarUpload } from "./avatar-upload";
import { ProfileFormSkeleton } from "./skeletons";

export function ProfileForm() {
  const router = useRouter();
  const { data: profile, isLoading } = useQueryProfile();
  const [redirect] = useQueryState("redirect", parseAsString);
  const updateProfile = useMutUpdateProfile();
  const uploadAvatar = useMutUploadAvatar();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    mode: "onChange",
    defaultValues: {
      displayName: "",
      email: "",
      phoneNumber: "",
      avatarUrl: "",
    },
  });

  const {
    reset,
    formState: { isDirty, isValid, isSubmitting },
  } = form;

  useEffect(() => {
    if (profile) {
      reset({
        displayName: profile.displayName || "",
        email: profile.email || "",
        phoneNumber: profile.phoneNumber || "",
        avatarUrl: profile.avatarUrl || "",
      });
    }
  }, [profile, reset]);

  const onSubmit = async (data: ProfileFormValues) => {
    const cleanedData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== ""),
    ) as ProfileFormValues;

    try {
      await updateProfile.mutateAsync(cleanedData);
      reset(cleanedData);

      if (redirect) {
        router.push(redirect);
        return;
      }
    } catch (error) {
      toast.error("Unable to update profile", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  const handleAvatarSelect = (file: File) => {
    const formData = new FormData();
    formData.append("image", file, file.name);
    uploadAvatar.mutate(formData);
  };

  if (isLoading) {
    return <ProfileFormSkeleton />;
  }

  const submitting = updateProfile.isPending || isSubmitting;
  const isSubmitDisabled = submitting || !isDirty || !isValid;

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
        <StandardFormProvider
          form={form}
          onSubmit={onSubmit}
          className="space-y-6"
        >
          <AvatarUpload
            currentAvatarUrl={profile?.avatarUrl ?? undefined}
            displayName={profile?.displayName ?? undefined}
            onFileSelect={handleAvatarSelect}
            isUploading={uploadAvatar.isPending}
          />

          <div className="space-y-4">
            <StandardFormInput<ProfileFormValues>
              name="displayName"
              label="Display Name"
              placeholder="Enter your name"
              required
            />

            <StandardFormInput<ProfileFormValues>
              name="email"
              label="Email"
              type="email"
              placeholder="your@email.com"
            />

            <StandardFormInput<ProfileFormValues>
              name="phoneNumber"
              label="Phone Number"
              type="tel"
              placeholder="09XX XXX XXXX"
            />
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Your contact information will be shared with court owners when you
              make a reservation to help them contact you if needed.
            </AlertDescription>
          </Alert>

          <div className="flex flex-col items-end gap-2">
            {process.env.NODE_ENV === "development" && (
              <p className="text-xs text-muted-foreground">
                Form dirty: {isDirty ? "Yes" : "No"}
              </p>
            )}
            <Button type="submit" disabled={isSubmitDisabled}>
              {submitting && <Spinner />}
              Save Changes
            </Button>
          </div>
        </StandardFormProvider>
      </CardContent>
    </Card>
  );
}
