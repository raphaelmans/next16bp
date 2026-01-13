"use client";

import { toast } from "sonner";
import { trpc } from "@/trpc/client";

export interface Profile {
  id: string;
  displayName: string;
  email?: string;
  phoneNumber?: string;
  avatarUrl?: string;
}

/**
 * Hook to fetch current user's profile
 */
export function useProfile() {
  return trpc.profile.me.useQuery();
}

/**
 * Hook to update current user's profile
 */
export function useUpdateProfile() {
  const utils = trpc.useUtils();

  return trpc.profile.update.useMutation({
    onSuccess: async () => {
      toast.success("Profile updated successfully");
      await utils.profile.me.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update profile");
    },
  });
}

/**
 * Hook to upload user avatar
 */
export function useUploadAvatar() {
  const utils = trpc.useUtils();

  return trpc.profile.uploadAvatar.useMutation({
    onSuccess: async () => {
      toast.success("Avatar uploaded successfully");
      await utils.profile.me.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload avatar");
    },
  });
}
