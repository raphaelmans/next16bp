"use client";

import { usePathname } from "next/navigation";
import { useCallback } from "react";
import { appRoutes } from "@/common/app-routes";
import { useQueryAuthSession } from "@/features/auth/hooks";
import { trpc } from "@/trpc/client";

/**
 * Single-place bookmark state + toggle (for detail page).
 */
export function useModPlaceBookmark(placeId: string | undefined) {
  const { data: session } = useQueryAuthSession();
  const isAuthenticated = !!session;
  const pathname = usePathname();
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.placeBookmark.isBookmarked.useQuery(
    { placeId: placeId ?? "" },
    { enabled: isAuthenticated && !!placeId },
  );

  const toggleMutation = trpc.placeBookmark.toggle.useMutation({
    onMutate: async ({ placeId: mutPlaceId }) => {
      await utils.placeBookmark.isBookmarked.cancel({ placeId: mutPlaceId });
      const previous = utils.placeBookmark.isBookmarked.getData({
        placeId: mutPlaceId,
      });
      utils.placeBookmark.isBookmarked.setData(
        { placeId: mutPlaceId },
        (old) => ({
          bookmarked: !(old?.bookmarked ?? false),
        }),
      );
      return { previous };
    },
    onError: (_err, { placeId: mutPlaceId }, context) => {
      if (context?.previous) {
        utils.placeBookmark.isBookmarked.setData(
          { placeId: mutPlaceId },
          context.previous,
        );
      }
    },
    onSettled: (_data, _err, { placeId: mutPlaceId }) => {
      utils.placeBookmark.isBookmarked.invalidate({ placeId: mutPlaceId });
      utils.placeBookmark.getBookmarkedPlaceIds.invalidate();
      utils.placeBookmark.list.invalidate();
    },
  });

  const toggle = useCallback(() => {
    if (!placeId) return;
    if (!isAuthenticated) {
      window.location.href = appRoutes.login.from(pathname);
      return;
    }
    toggleMutation.mutate({ placeId });
  }, [placeId, isAuthenticated, pathname, toggleMutation]);

  return {
    isBookmarked: data?.bookmarked ?? false,
    isLoading,
    isPending: toggleMutation.isPending,
    toggle,
  };
}

/**
 * Batch bookmark check for discovery lists.
 */
export function useModPlaceBookmarkBatch(placeIds: string[]) {
  const { data: session } = useQueryAuthSession();
  const isAuthenticated = !!session;
  const pathname = usePathname();
  const utils = trpc.useUtils();

  const { data } = trpc.placeBookmark.getBookmarkedPlaceIds.useQuery(
    { placeIds },
    { enabled: isAuthenticated && placeIds.length > 0 },
  );

  const bookmarkedSet = new Set(data?.placeIds ?? []);

  const toggleMutation = trpc.placeBookmark.toggle.useMutation({
    onMutate: async ({ placeId }) => {
      await utils.placeBookmark.getBookmarkedPlaceIds.cancel({ placeIds });
      const previous = utils.placeBookmark.getBookmarkedPlaceIds.getData({
        placeIds,
      });
      utils.placeBookmark.getBookmarkedPlaceIds.setData({ placeIds }, (old) => {
        if (!old) return { placeIds: [placeId] };
        const currentSet = new Set(old.placeIds);
        if (currentSet.has(placeId)) {
          currentSet.delete(placeId);
        } else {
          currentSet.add(placeId);
        }
        return { placeIds: [...currentSet] };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        utils.placeBookmark.getBookmarkedPlaceIds.setData(
          { placeIds },
          context.previous,
        );
      }
    },
    onSettled: () => {
      utils.placeBookmark.getBookmarkedPlaceIds.invalidate();
      utils.placeBookmark.isBookmarked.invalidate();
      utils.placeBookmark.list.invalidate();
    },
  });

  const toggleBookmark = useCallback(
    (placeId: string) => {
      if (!isAuthenticated) {
        window.location.href = appRoutes.login.from(pathname);
        return;
      }
      toggleMutation.mutate({ placeId });
    },
    [isAuthenticated, pathname, toggleMutation],
  );

  return {
    bookmarkedSet,
    toggleBookmark,
    isPending: toggleMutation.isPending,
    pendingPlaceId: toggleMutation.variables?.placeId,
  };
}

/**
 * Paginated list of bookmarked places (for saved venues page).
 */
export function useModPlaceBookmarkList(params: {
  limit: number;
  offset: number;
}) {
  const { data: session } = useQueryAuthSession();
  const isAuthenticated = !!session;

  return trpc.placeBookmark.list.useQuery(params, {
    enabled: isAuthenticated,
  });
}
