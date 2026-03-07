"use client";

import { Clock, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryMySubmissions } from "../hooks";

type SubmissionStatus = "PENDING" | "APPROVED" | "REJECTED";

const statusConfig: Record<
  SubmissionStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive";
    icon: typeof Clock;
  }
> = {
  PENDING: { label: "Pending", variant: "secondary", icon: Clock },
  APPROVED: { label: "Approved", variant: "default", icon: CheckCircle },
  REJECTED: { label: "Rejected", variant: "destructive", icon: XCircle },
};

export function MySubmissionsList() {
  const { data, isLoading } = useQueryMySubmissions({ limit: 50 });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  const submissions =
    (
      data as
        | {
            items: Array<{
              id: string;
              status: SubmissionStatus;
              rejectionReason: string | null;
              createdAt: string;
              place: { name: string; city: string };
            }>;
            total: number;
          }
        | undefined
    )?.items ?? [];

  if (submissions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            You haven&apos;t submitted any courts yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {submissions.map((submission) => {
        const config = statusConfig[submission.status];
        const Icon = config.icon;

        return (
          <Card key={submission.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {submission.place.name}
                </CardTitle>
                <Badge variant={config.variant}>
                  <Icon className="mr-1 h-3 w-3" />
                  {config.label}
                </Badge>
              </div>
              <CardDescription>
                {submission.place.city} &middot;{" "}
                {new Date(submission.createdAt).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            {submission.status === "REJECTED" && submission.rejectionReason && (
              <CardContent className="pt-0">
                <p className="text-sm text-destructive">
                  Reason: {submission.rejectionReason}
                </p>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
