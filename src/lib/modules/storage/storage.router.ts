import { router } from "@/lib/shared/infra/trpc/trpc";

/**
 * Storage module router.
 *
 * Note: File upload endpoints are typically defined in their respective
 * domain routers (e.g., profile.uploadAvatar, court.uploadPhotos).
 * This router may contain admin/utility endpoints if needed.
 */
export const storageRouter = router({
  // Health check or admin endpoints could go here
});
