"use client";

import { FileText, Upload, X } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PaymentProofFormProps {
  referenceNumber: string;
  notes: string;
  file: File | null;
  onReferenceChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onFileChange: (file: File | null) => void;
}

export function PaymentProofForm({
  referenceNumber,
  notes,
  file,
  onReferenceChange,
  onNotesChange,
  onFileChange,
}: PaymentProofFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      return;
    }

    onFileChange(selectedFile);
  };

  const handleClear = () => {
    onFileChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card className="bg-muted/30">
      <CardContent className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <div>
            <h3 className="font-heading text-base font-semibold">
              Payment Proof (Optional)
            </h3>
            <p className="text-sm text-muted-foreground">
              Help the owner verify your payment faster
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="payment-proof-file">Screenshot (optional)</Label>
            <input
              ref={fileInputRef}
              id="payment-proof-file"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            {file ? (
              <div className="flex items-center justify-between rounded-lg border bg-background p-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium truncate max-w-[200px]">
                    {file.name}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Screenshot
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              JPG, PNG, or WebP up to 10MB
            </p>
          </div>

          <div>
            <Label htmlFor="reference">Reference Number</Label>
            <Input
              id="reference"
              placeholder="e.g., GC-12345678"
              value={referenceNumber}
              onChange={(event) => onReferenceChange(event.target.value)}
              maxLength={100}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="e.g., Paid via GCash at 2:30pm"
              value={notes}
              onChange={(event) => onNotesChange(event.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
