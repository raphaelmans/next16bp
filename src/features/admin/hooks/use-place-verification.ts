"use client";

import { toast } from "sonner";
import { trpc } from "@/trpc/client";

export interface PlaceVerificationRequestListItem {
  id: string;
  placeId: string;
  placeName: string;
  organizationId: string | null;
  status: "pending" | "approved" | "rejected";
  requestedByUserId: string | null;
  requestNotes?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
  reviewerUserId?: string | null;
}

export function usePlaceVerificationQueue(options: {
  page?: number;
  limit?: number;
}) {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const offset = (page - 1) * limit;

  const query = trpc.admin.placeVerification.getPending.useQuery({
    limit,
    offset,
  });

  const data = query.data
    ? {
        items: query.data.items.map((item) => ({
          id: item.request.id,
          placeId: item.request.placeId,
          placeName: item.placeName,
          organizationId: item.request.organizationId,
          status: item.request.status.toLowerCase() as
            | "pending"
            | "approved"
            | "rejected",
          requestedByUserId: item.request.requestedByUserId,
          requestNotes: item.request.requestNotes,
          createdAt: item.request.createdAt,
          reviewedAt: item.request.reviewedAt,
          reviewerUserId: item.request.reviewerUserId,
        })),
        total: query.data.total,
        totalPages: Math.ceil(query.data.total / limit),
        page,
      }
    : undefined;

  return {
    ...query,
    data,
  };
}

export function usePlaceVerificationRequest(requestId: string) {
  const query = trpc.admin.placeVerification.getById.useQuery(
    { id: requestId },
    { enabled: !!requestId },
  );

  const data = query.data
    ? {
        request: query.data.request,
        place: query.data.place,
        organization: query.data.organization,
        documents: query.data.documents,
        events: query.data.events,
      }
    : undefined;

  return {
    ...query,
    data,
  };
}

export function useApprovePlaceVerification() {
  const utils = trpc.useUtils();

  return trpc.admin.placeVerification.approve.useMutation({
    onSuccess: async () => {
      toast.success("Verification approved");
      await utils.admin.placeVerification.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to approve verification");
    },
  });
}

export function useRejectPlaceVerification() {
  const utils = trpc.useUtils();

  return trpc.admin.placeVerification.reject.useMutation({
    onSuccess: async () => {
      toast.success("Verification rejected");
      await utils.admin.placeVerification.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to reject verification");
    },
  });
}
