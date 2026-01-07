"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ProfileFormValues } from "../schemas/profile.schema";

export interface Profile {
  id: string;
  displayName: string;
  email?: string;
  phoneNumber?: string;
  avatarUrl?: string;
}

/**
 * Hook to fetch current user's profile
 * TODO: Connect to actual tRPC endpoint when backend is ready
 */
export function useProfile() {
  return useQuery({
    queryKey: ["profile", "current"],
    queryFn: async () => {
      // This will be replaced with actual API call
      return null as Profile | null;
    },
  });
}

/**
 * Hook to update current user's profile
 * TODO: Connect to actual tRPC endpoint when backend is ready
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      // This will be replaced with actual API call
      // await trpc.profile.update.mutate(data);
      throw new Error("Not implemented");
    },
    onSuccess: () => {
      toast.success("Profile updated successfully");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error) => {
      toast.error("Failed to update profile", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    },
  });
}
