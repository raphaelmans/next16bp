"use client";

import {
  ArrowLeft,
  ArrowRight,
  Image as ImageIcon,
  Star,
  X,
} from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { toast } from "@/common/toast";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import {
  useMutRemovePlacePhoto,
  useMutReorderPlacePhotos,
  useMutUploadPlacePhoto,
} from "../hooks";

interface PlacePhoto {
  id: string;
  url: string;
  displayOrder: number;
}

interface PlacePhotoUploadProps {
  placeId: string;
  photos: PlacePhoto[];
  maxPhotos?: number;
}

export function PlacePhotoUpload({
  placeId,
  photos,
  maxPhotos = 10,
}: PlacePhotoUploadProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const uploadPhoto = useMutUploadPlacePhoto(placeId);
  const removePhoto = useMutRemovePlacePhoto(placeId);
  const reorderPhotos = useMutReorderPlacePhotos(placeId);

  const sortedPhotos = React.useMemo(
    () => [...photos].sort((a, b) => a.displayOrder - b.displayOrder),
    [photos],
  );

  const canAddMore = sortedPhotos.length < maxPhotos;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo must be smaller than 5MB");
      return;
    }

    const formData = new FormData();
    formData.append("placeId", placeId);
    formData.append("image", file, file.name);
    uploadPhoto.mutate(formData);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemove = (photoId: string) => {
    removePhoto.mutate({ placeId, photoId });
  };

  const commitOrder = (orderedIds: string[]) => {
    reorderPhotos.mutate({ placeId, orderedIds });
  };

  const handleSetCover = (photoId: string) => {
    const ordered = [
      photoId,
      ...sortedPhotos.map((p) => p.id).filter((id) => id !== photoId),
    ];
    commitOrder(ordered);
  };

  const handleMove = (photoId: string, direction: "left" | "right") => {
    const index = sortedPhotos.findIndex((photo) => photo.id === photoId);
    if (index === -1) return;

    const nextIndex = direction === "left" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= sortedPhotos.length) return;

    const next = [...sortedPhotos];
    const temp = next[index];
    next[index] = next[nextIndex];
    next[nextIndex] = temp;

    commitOrder(next.map((photo) => photo.id));
  };

  const isBusy =
    uploadPhoto.isPending || removePhoto.isPending || reorderPhotos.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="font-medium">Photos</div>
          <div className="text-sm text-muted-foreground">
            First photo is used as the cover image.
          </div>
        </div>

        {canAddMore ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadPhoto.isPending}
              loading={uploadPhoto.isPending}
            >
              <ImageIcon className="h-4 w-4" />
              <span className="ml-2">Add photo</span>
            </Button>
          </>
        ) : (
          <div className="text-sm text-muted-foreground">
            Max {maxPhotos} photos.
          </div>
        )}
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {sortedPhotos.map((photo, index) => {
          const isCover = index === 0;
          const canMoveLeft = index > 0;
          const canMoveRight = index < sortedPhotos.length - 1;

          return (
            <div
              key={photo.id}
              className="relative aspect-square rounded-lg overflow-hidden border bg-muted/20"
            >
              <Image
                src={photo.url}
                alt="Venue photo"
                fill
                className="object-cover"
              />

              {isCover ? (
                <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded bg-primary px-2 py-1 text-xs text-primary-foreground">
                  <Star className="h-3 w-3" />
                  Cover
                </span>
              ) : (
                <button
                  type="button"
                  className={cn(
                    "absolute top-2 left-2 inline-flex items-center gap-1 rounded bg-background/90 px-2 py-1 text-xs shadow",
                    isBusy && "opacity-60",
                  )}
                  disabled={isBusy}
                  onClick={() => handleSetCover(photo.id)}
                >
                  <Star className="h-3 w-3" />
                  Set cover
                </button>
              )}

              <div className="absolute bottom-2 left-2 flex gap-1">
                <button
                  type="button"
                  className={cn(
                    "rounded bg-background/90 p-1 shadow",
                    !canMoveLeft && "opacity-40",
                  )}
                  aria-label="Move photo left"
                  disabled={isBusy || !canMoveLeft}
                  onClick={() => handleMove(photo.id, "left")}
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className={cn(
                    "rounded bg-background/90 p-1 shadow",
                    !canMoveRight && "opacity-40",
                  )}
                  aria-label="Move photo right"
                  disabled={isBusy || !canMoveRight}
                  onClick={() => handleMove(photo.id, "right")}
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleRemove(photo.id)}
                disabled={removePhoto.isPending}
                className="absolute top-2 right-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow disabled:opacity-60"
                aria-label="Remove photo"
              >
                {removePhoto.isPending ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </button>
            </div>
          );
        })}

        {canAddMore ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadPhoto.isPending}
            className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
          >
            {uploadPhoto.isPending ? (
              <Spinner className="h-8 w-8" />
            ) : (
              <ImageIcon className="h-8 w-8" />
            )}
            <span className="text-xs">Add</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
