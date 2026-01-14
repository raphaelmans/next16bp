"use client";

import { FileText, Upload, X } from "lucide-react";
import { useRef } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { z } from "zod";
import {
  StandardFormField,
  StandardFormInput,
  StandardFormTextarea,
} from "@/components/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const paymentProofFormSchema = z.object({
  referenceNumber: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
  proofFile: z.instanceof(File).optional().nullable(),
});

export type PaymentProofFormValues = z.infer<typeof paymentProofFormSchema>;

export function PaymentProofForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setValue, control } = useFormContext<PaymentProofFormValues>();
  const proofFile = useWatch({ control, name: "proofFile" });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      return;
    }

    setValue("proofFile", selectedFile, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const handleClear = () => {
    setValue("proofFile", null, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const selectedFile = proofFile instanceof File ? proofFile : null;

  return (
    <Card className="bg-muted/30">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2">
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

        <StandardFormField<PaymentProofFormValues>
          name="proofFile"
          label="Screenshot (optional)"
        >
          {() => (
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                id="payment-proof-file"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {selectedFile ? (
                <div className="flex items-center justify-between rounded-lg border bg-background p-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium truncate max-w-[200px]">
                      {selectedFile.name}
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
          )}
        </StandardFormField>

        <StandardFormInput<PaymentProofFormValues>
          name="referenceNumber"
          label="Reference Number"
          placeholder="e.g., GC-12345678"
        />

        <StandardFormTextarea<PaymentProofFormValues>
          name="notes"
          label="Notes"
          placeholder="e.g., Paid via GCash at 2:30pm"
        />
      </CardContent>
    </Card>
  );
}
