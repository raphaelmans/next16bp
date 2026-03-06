"use client";

import { Image as ImageIcon, X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import Image from "next/image";
import { useRef } from "react";
import { useMutRemoveCourtPhoto, useMutUploadCourtPhoto } from "../hooks";

interface CourtPhoto {
  id: string;
  url: string;
  displayOrder: number;
}

interface CourtPhotoUploadProps {
  courtId: string;
  photos: CourtPhoto[];
  maxPhotos?: number;
}

export function CourtPhotoUpload({
  courtId,
  photos,
  maxPhotos = 10,
}: CourtPhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadPhoto = useMutUploadCourtPhoto(courtId);
  const removePhoto = useMutRemoveCourtPhoto(courtId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    uploadPhoto.mutate({ courtId, image: file });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemove = (photoId: string) => {
    removePhoto.mutate({ courtId, photoId });
  };

  const canAddMore = photos.length < maxPhotos;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {/* Existing photos */}
        {photos
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((photo, index) => (
            <div
              key={photo.id}
              className="relative aspect-square rounded-lg overflow-hidden group"
            >
              <Image
                src={photo.url}
                alt={`Court ${index + 1}`}
                fill
                className="object-cover"
              />
              {index === 0 && (
                <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                  Cover
                </span>
              )}
              <button
                type="button"
                onClick={() => handleRemove(photo.id)}
                disabled={removePhoto.isPending}
                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
              >
                {removePhoto.isPending ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </button>
            </div>
          ))}

        {/* Add photo button */}
        {canAddMore && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadPhoto.isPending}
              className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadPhoto.isPending ? (
                <Spinner className="h-8 w-8" />
              ) : (
                <ImageIcon className="h-8 w-8" />
              )}
              <span className="text-xs">Add Photo</span>
            </button>
          </>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Upload up to {maxPhotos} photos. First photo will be the cover image.
        {photos.length > 0 && ` (${photos.length}/${maxPhotos} uploaded)`}
      </p>
    </div>
  );
}
