"use client";

import { Camera } from "lucide-react";
import { useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  displayName?: string;
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
}

export function AvatarUpload({
  currentAvatarUrl,
  displayName,
  onFileSelect,
  isUploading,
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials =
    displayName
      ?.split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return;
      }
      onFileSelect(file);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar className="h-20 w-20">
          {currentAvatarUrl ? (
            <AvatarImage
              src={currentAvatarUrl}
              alt={displayName || "Profile"}
            />
          ) : null}
          <AvatarFallback className="text-xl font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-1 -right-1 rounded-full bg-background p-0.5">
          <div className="rounded-full bg-primary p-1.5 text-primary-foreground">
            <Camera className="h-3 w-3" />
          </div>
        </div>
      </div>

      <div className="space-y-1">
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
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? "Uploading..." : "Change Avatar"}
        </Button>
        <p className="text-xs text-muted-foreground">
          JPG, PNG, or GIF. Max 5MB.
        </p>
      </div>
    </div>
  );
}
