"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Photo {
  id: string;
  url: string;
  alt?: string;
}

interface PhotoGalleryProps {
  photos: Photo[];
  courtName: string;
  className?: string;
}

export function PhotoGallery({
  photos,
  courtName,
  className,
}: PhotoGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const hasPhotos = photos.length > 0;
  const visibleThumbnails = photos.slice(0, 4);
  const extraCount = photos.length - 4;

  const handlePrevious = () => {
    setActiveIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  if (!hasPhotos) {
    return (
      <div
        className={cn(
          "aspect-[4/3] md:aspect-[16/9] rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5",
          "flex items-center justify-center",
          className,
        )}
      >
        <div className="text-center">
          <div className="text-primary/40 font-heading text-6xl mb-2">KC</div>
          <p className="text-muted-foreground text-sm">{courtName}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={cn("space-y-2", className)}>
        {/* Main Photo */}
        <button
          type="button"
          onClick={() => {
            setActiveIndex(0);
            setLightboxOpen(true);
          }}
          className="relative w-full aspect-[4/3] md:aspect-[16/9] rounded-xl overflow-hidden bg-muted cursor-pointer"
        >
          <Image
            src={photos[0].url}
            alt={photos[0].alt || courtName}
            fill
            className="object-cover transition-transform hover:scale-105"
            priority
          />
        </button>

        {/* Thumbnails */}
        {photos.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {visibleThumbnails.slice(1).map((photo, index) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => {
                  setActiveIndex(index + 1);
                  setLightboxOpen(true);
                }}
                className="relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer"
              >
                <Image
                  src={photo.url}
                  alt={photo.alt || `${courtName} photo ${index + 2}`}
                  fill
                  className="object-cover transition-transform hover:scale-105"
                />
              </button>
            ))}

            {/* Extra count overlay on last thumbnail */}
            {extraCount > 0 && visibleThumbnails.length === 4 && (
              <button
                type="button"
                onClick={() => {
                  setActiveIndex(3);
                  setLightboxOpen(true);
                }}
                className="relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer"
              >
                <Image
                  src={photos[3].url}
                  alt={`${courtName} photo 4`}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white font-medium">+{extraCount}</span>
                </div>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-5xl w-full p-0 bg-black/95 border-none">
          <div className="relative w-full aspect-[16/9]">
            <Image
              src={photos[activeIndex].url}
              alt={photos[activeIndex].alt || `${courtName} photo`}
              fill
              className="object-contain"
            />

            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Navigation */}
            {photos.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={handleNext}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
              {activeIndex + 1} / {photos.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
