"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";

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
  const trpc = useTRPC();

  return useQuery(trpc.profile.me.queryOptions());
}

/**
 * Hook to update current user's profile
 */
export function useUpdateProfile() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.profile.update.mutationOptions({
      onSuccess: () => {
        toast.success("Profile updated successfully");
        queryClient.invalidateQueries({ queryKey: ["profile"] });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update profile");
      },
    }),
  );
}

/**
 * Hook to upload user avatar
 */
export function useUploadAvatar() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.profile.uploadAvatar.mutationOptions({
      onSuccess: () => {
        toast.success("Avatar uploaded successfully");
        queryClient.invalidateQueries({ queryKey: ["profile"] });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to upload avatar");
      },
    }),
  );
}
