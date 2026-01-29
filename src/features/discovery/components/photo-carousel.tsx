"use client";

import { Camera, ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Photo {
  id: string;
  url: string;
  alt?: string;
}

interface PhotoCarouselProps {
  photos: Photo[];
  courtName: string;
  className?: string;
}

export function PhotoCarousel({
  photos,
  courtName,
  className,
}: PhotoCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const hasPhotos = photos.length > 0;
  const hasMultiple = photos.length > 1;

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex(((index % photos.length) + photos.length) % photos.length);
    },
    [photos.length],
  );

  const handlePrev = useCallback(
    () => goTo(activeIndex - 1),
    [activeIndex, goTo],
  );
  const handleNext = useCallback(
    () => goTo(activeIndex + 1),
    [activeIndex, goTo],
  );

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleLightboxPrev = () => {
    setLightboxIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleLightboxNext = () => {
    setLightboxIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
    touchStartX.current = null;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") handlePrev();
    else if (e.key === "ArrowRight") handleNext();
  };

  // No photos — gradient placeholder
  if (!hasPhotos) {
    return (
      <div
        className={cn(
          "relative aspect-[16/10] rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5",
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
      {/* Carousel */}
      <section
        className={cn(
          "relative aspect-[16/10] rounded-xl overflow-hidden bg-muted",
          className,
        )}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onKeyDown={handleKeyDown}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: carousel needs focus for keyboard nav
        tabIndex={0}
        aria-label="Photo carousel"
      >
        {/* Slides */}
        <div
          className="flex h-full transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {photos.map((photo, i) => (
            <button
              key={photo.id}
              type="button"
              className="relative h-full w-full shrink-0 border-0 p-0 cursor-pointer"
              onClick={() => openLightbox(i)}
              aria-label={`View ${photo.alt || `${courtName} photo ${i + 1}`}`}
            >
              <Image
                src={photo.url}
                alt={photo.alt || `${courtName} photo ${i + 1}`}
                fill
                className="object-cover"
                priority={i === 0}
              />
            </button>
          ))}
        </div>

        {/* Prev / Next buttons */}
        {hasMultiple && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 text-white hover:bg-black/60"
              onClick={handlePrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 text-white hover:bg-black/60"
              onClick={handleNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Counter pill */}
        {hasMultiple && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-white text-xs font-medium backdrop-blur-sm pointer-events-none">
            <Camera className="h-3 w-3" />
            {activeIndex + 1} / {photos.length}
          </div>
        )}
      </section>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-5xl w-full p-0 bg-black/95 border-none">
          <div className="relative w-full aspect-[16/9]">
            <Image
              src={photos[lightboxIndex].url}
              alt={photos[lightboxIndex].alt || `${courtName} photo`}
              fill
              className="object-contain"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
            {hasMultiple && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={handleLightboxPrev}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={handleLightboxNext}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
              {lightboxIndex + 1} / {photos.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
