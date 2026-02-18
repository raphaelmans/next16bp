"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CuratedCourtBatchResult } from "@/features/admin/hooks";

const STATUS_LABELS = {
  created: "Created",
  skipped_duplicate: "Skipped",
  error: "Failed",
} as const;

const STATUS_VARIANTS = {
  created: "success",
  skipped_duplicate: "warning",
  error: "destructive",
} as const;

type BatchResultsPanelProps = {
  batchResult: CuratedCourtBatchResult;
};

export function BatchResultsPanel({ batchResult }: BatchResultsPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Batch Results</CardTitle>
        <CardDescription>
          Review the result of each venue created from the batch submission.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg border p-4">
            <div className="text-2xl font-bold">
              {batchResult.summary.total}
            </div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-2xl font-bold text-green-600">
              {batchResult.summary.created}
            </div>
            <div className="text-sm text-muted-foreground">Created</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-2xl font-bold text-amber-600">
              {batchResult.summary.skipped}
            </div>
            <div className="text-sm text-muted-foreground">Skipped</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-2xl font-bold text-destructive">
              {batchResult.summary.failed}
            </div>
            <div className="text-sm text-muted-foreground">Failed</div>
          </div>
        </div>

        <div className="space-y-2">
          {batchResult.items.map((item) => (
            <div
              key={`${item.index}-${item.placeId ?? item.message ?? "result"}`}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium">{`Court ${item.index + 1}`}</p>
                {item.message ? (
                  <p className="text-sm text-muted-foreground">
                    {item.message}
                  </p>
                ) : null}
              </div>
              <Badge variant={STATUS_VARIANTS[item.status]}>
                {STATUS_LABELS[item.status]}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
