"use client";

import { useCallback, useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface FileUploadProps {
  value?: File | string;
  onChange?: (file: File | undefined) => void;
  onUpload?: (file: File) => Promise<string>;
  accept?: string;
  maxSize?: number;
  disabled?: boolean;
  className?: string;
}

export function FileUpload({
  value,
  onChange,
  onUpload,
  accept = "image/png,image/jpeg",
  maxSize = 5 * 1024 * 1024, // 5MB
  disabled = false,
  className,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(
    typeof value === "string" ? value : null,
  );
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      // Validate file size
      if (file.size > maxSize) {
        setError(
          `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`,
        );
        return;
      }

      // Validate file type
      const acceptedTypes = accept.split(",").map((t) => t.trim());
      if (!acceptedTypes.includes(file.type)) {
        setError("Invalid file type");
        return;
      }

      // Create preview
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      if (onUpload) {
        setIsUploading(true);
        try {
          await onUpload(file);
          onChange?.(file);
        } catch {
          setError("Failed to upload file");
          setPreview(null);
        } finally {
          setIsUploading(false);
        }
      } else {
        onChange?.(file);
      }
    },
    [accept, maxSize, onChange, onUpload],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragActive(false);

      if (disabled || isUploading) return;

      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [disabled, isUploading, handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    onChange?.(undefined);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  if (preview) {
    return (
      <div className={cn("relative", className)}>
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
          <Image src={preview} alt="Preview" fill className="object-cover" />
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
        </div>
        {!isUploading && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <button
        type="button"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        disabled={disabled || isUploading}
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer",
          isDragActive && "border-primary bg-primary/5",
          !isDragActive && "border-muted-foreground/25 hover:border-primary/50",
          disabled && "cursor-not-allowed opacity-50",
          error && "border-destructive",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          disabled={disabled || isUploading}
          className="hidden"
        />
        <div className="flex flex-col items-center text-center">
          {isDragActive ? (
            <Upload className="h-10 w-10 text-primary mb-2" />
          ) : (
            <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
          )}
          <p className="text-sm font-medium text-foreground">
            {isDragActive ? "Drop file here" : "Drag & drop or click to browse"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PNG, JPG up to {Math.round(maxSize / 1024 / 1024)}MB
          </p>
        </div>
      </button>
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </div>
  );
}
