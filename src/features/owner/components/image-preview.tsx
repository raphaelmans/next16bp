"use client";

import { ImageIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface ImagePreviewProps {
  src: string;
  alt: string;
}

export function ImagePreview({ src, alt }: ImagePreviewProps) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="flex h-20 w-20 items-center justify-center rounded border bg-muted">
        <ImageIcon className="h-6 w-6 text-muted-foreground" />
      </div>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="relative h-20 w-20 overflow-hidden rounded border transition-opacity hover:opacity-80"
        >
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
            onError={() => setError(true)}
          />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl p-0">
        <div className="relative aspect-video">
          <Image
            src={src}
            alt={alt}
            fill
            className="object-contain"
            onError={() => setError(true)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
