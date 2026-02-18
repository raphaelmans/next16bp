"use client";

import { format } from "date-fns";
import { Check, Copy, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "@/common/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ImagePreview } from "./image-preview";

interface PaymentProofCardProps {
  proof: {
    referenceNumber: string | null;
    notes: string | null;
    fileUrl: string | null;
    createdAt: string;
  } | null;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <Button type="button" variant="ghost" size="sm" onClick={handleCopy}>
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
}

export function PaymentProofCard({ proof }: PaymentProofCardProps) {
  if (!proof) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-medium">Payment Proof</h4>
          </div>
          <p className="text-sm text-muted-foreground">No proof provided</p>
        </CardContent>
      </Card>
    );
  }

  const hasContent = proof.referenceNumber || proof.notes || proof.fileUrl;

  if (!hasContent) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-medium">Payment Proof</h4>
          </div>
          <p className="text-sm text-muted-foreground">No proof provided</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-muted/50">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h4 className="font-medium">Payment Proof</h4>
        </div>

        <div className="space-y-3">
          {proof.referenceNumber && (
            <div className="flex items-center justify-between">
              <span className="text-sm">
                Reference:{" "}
                <span className="font-mono font-medium">
                  {proof.referenceNumber}
                </span>
              </span>
              <CopyButton value={proof.referenceNumber} />
            </div>
          )}

          {proof.notes && (
            <p className="text-sm text-muted-foreground">{proof.notes}</p>
          )}

          {proof.fileUrl && (
            <ImagePreview src={proof.fileUrl} alt="Payment screenshot" />
          )}

          <p className="text-xs text-muted-foreground">
            Submitted {format(new Date(proof.createdAt), "MMM d, h:mm a")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
