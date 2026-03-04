"use client";

import { BookmarkButton } from "@/features/discovery/components/bookmark-button";
import { useModPlaceBookmark } from "@/features/discovery/hooks";

type PlaceDetailBookmarkSlotProps = {
  placeId: string;
};

export function PlaceDetailBookmarkSlot({
  placeId,
}: PlaceDetailBookmarkSlotProps) {
  const bookmark = useModPlaceBookmark(placeId);

  return (
    <BookmarkButton
      variant="inline"
      isBookmarked={bookmark.isBookmarked}
      isPending={bookmark.isPending}
      onToggle={bookmark.toggle}
    />
  );
}
