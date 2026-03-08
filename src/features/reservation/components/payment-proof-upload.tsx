"use client";

import { FileImage, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useMutUploadPaymentProof } from "../hooks";

interface PaymentProofUploadProps {
  reservationId: string;
  onSuccess?: () => void;
}

export function PaymentProofUpload({
  reservationId,
  onSuccess,
}: PaymentProofUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const uploadPaymentProof = useMutUploadPaymentProof();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return;
    }

    // Validate file size (max 10MB for payment proofs)
    if (file.size > 10 * 1024 * 1024) {
      return;
    }

    setSelectedFile(file);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("reservationId", reservationId);
    formData.append("image", selectedFile, selectedFile.name);
    if (referenceNumber) {
      formData.append("referenceNumber", referenceNumber);
    }
    if (notes) {
      formData.append("notes", notes);
    }

    uploadPaymentProof.mutate(formData, {
      onSuccess: () => {
        setSelectedFile(null);
        setReferenceNumber("");
        setNotes("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        onSuccess?.();
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Payment Proof
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File upload area */}
          <div className="space-y-2">
            <Label htmlFor="payment-proof-file">
              Receipt Image <span className="text-destructive">*</span>
            </Label>
            <input
              ref={fileInputRef}
              id="payment-proof-file"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            {selectedFile ? (
              <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/50">
                <div className="flex items-center gap-2">
                  <FileImage className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium truncate max-w-[200px]">
                    {selectedFile.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-lg border-2 border-dashed p-8 text-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <Upload className="h-8 w-8 mx-auto mb-2" />
                <span className="text-sm font-medium">
                  Click to upload payment receipt
                </span>
                <span className="block text-xs mt-1">
                  JPG, PNG, or WebP. Max 10MB.
                </span>
              </button>
            )}
          </div>

          {/* Reference number */}
          <div className="space-y-2">
            <Label htmlFor="reference-number">
              Reference Number (optional)
            </Label>
            <Input
              id="reference-number"
              placeholder="e.g., GCash transaction ID"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information..."
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            className="w-full"
            disabled={!selectedFile || uploadPaymentProof.isPending}
          >
            {uploadPaymentProof.isPending && <Spinner />}
            Submit Payment Proof
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
