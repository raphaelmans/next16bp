"use client";

import { Calendar, FileText, Receipt, ZoomIn } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatRelative } from "@/shared/lib/format";

interface PaymentProofDisplayProps {
  paymentProof: {
    id: string;
    referenceNumber?: string;
    fileUrl?: string;
    notes?: string;
    createdAt: string;
  };
}

export function PaymentProofDisplay({
  paymentProof,
}: PaymentProofDisplayProps) {
  const [isImageOpen, setIsImageOpen] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Payment Proof
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Reference number */}
        {paymentProof.referenceNumber && (
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">
              Reference Number
            </div>
            <p className="font-mono font-medium">
              {paymentProof.referenceNumber}
            </p>
          </div>
        )}

        {/* Upload timestamp */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Submitted {formatRelative(paymentProof.createdAt)}</span>
        </div>

        {/* Notes */}
        {paymentProof.notes && (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wide">
              <FileText className="h-3.5 w-3.5" />
              Notes
            </div>
            <p className="text-sm text-muted-foreground">
              {paymentProof.notes}
            </p>
          </div>
        )}

        {/* View image button */}
        {paymentProof.fileUrl && (
          <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <ZoomIn className="mr-2 h-4 w-4" />
                View Receipt Image
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Payment Receipt</DialogTitle>
              </DialogHeader>
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted">
                <Image
                  src={paymentProof.fileUrl}
                  alt="Payment receipt"
                  fill
                  className="object-contain"
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}
