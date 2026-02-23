"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { allowEmptyString, S } from "@/common/schemas";
import { toast } from "@/common/toast";
import { getClientErrorMessage } from "@/common/toast/errors";
import { StandardFormInput, StandardFormProvider } from "@/components/form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMutUpdateProfile } from "@/features/reservation/hooks";

const profileSetupSchema = z.object({
  displayName: S.profile.displayName,
  phoneNumber: allowEmptyString(S.profile.phoneNumber),
  email: allowEmptyString(S.common.email.optional()),
});

type ProfileSetupValues = z.infer<typeof profileSetupSchema>;

interface ProfileSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileSetupModal({
  open,
  onOpenChange,
}: ProfileSetupModalProps) {
  const updateProfile = useMutUpdateProfile();

  const form = useForm<ProfileSetupValues>({
    resolver: zodResolver(profileSetupSchema),
    mode: "onChange",
    defaultValues: {
      displayName: "",
      phoneNumber: "",
      email: "",
    },
  });

  const {
    formState: { isValid, isSubmitting },
  } = form;

  const onSubmit = async (data: ProfileSetupValues) => {
    const cleaned = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== "" && v !== undefined),
    ) as ProfileSetupValues;

    try {
      await updateProfile.mutateAsync(cleaned);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast.error("Unable to save profile", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  const submitting = updateProfile.isPending || isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Your Booking Profile</DialogTitle>
          <DialogDescription>
            Required to complete your reservation.
          </DialogDescription>
        </DialogHeader>

        <StandardFormProvider
          form={form}
          onSubmit={onSubmit}
          className="space-y-4"
        >
          <StandardFormInput<ProfileSetupValues>
            name="displayName"
            label="Display Name"
            placeholder="Enter your name"
            required
          />
          <StandardFormInput<ProfileSetupValues>
            name="phoneNumber"
            label="Phone Number"
            type="tel"
            placeholder="09XX XXX XXXX"
          />
          <StandardFormInput<ProfileSetupValues>
            name="email"
            label="Email"
            type="email"
            placeholder="your@email.com"
          />

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={submitting || !isValid}>
              {submitting ? "Saving..." : "Save & Continue"}
            </Button>
          </div>
        </StandardFormProvider>
      </DialogContent>
    </Dialog>
  );
}
