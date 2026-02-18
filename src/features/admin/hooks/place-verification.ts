"use client";

import {
  useFeatureMutation,
  useFeatureQuery,
} from "@/common/feature-api-hooks";
import { toast } from "@/common/toast";
import { trpc } from "@/trpc/client";
import { getAdminApi } from "../api.runtime";

const adminApi = getAdminApi();

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

export function useModPlaceVerificationQueue(options: {
  page?: number;
  limit?: number;
}) {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const offset = (page - 1) * limit;

  const query = useFeatureQuery(
    ["admin", "placeVerification", "getPending"],
    adminApi.queryAdminPlaceVerificationGetPending,
    {
      limit,
      offset,
    },
    {
      staleTime: 0,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
    },
  );

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

export function useQueryPlaceVerificationRequest(requestId: string) {
  const query = useFeatureQuery(
    ["admin", "placeVerification", "getById"],
    adminApi.queryAdminPlaceVerificationGetById,
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

export function useMutApprovePlaceVerification() {
  const utils = trpc.useUtils();

  return useFeatureMutation(adminApi.mutAdminPlaceVerificationApprove, {
    onSuccess: async () => {
      toast.success("Verification approved");
      await utils.admin.placeVerification.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to approve verification");
    },
  });
}

export function useMutRejectPlaceVerification() {
  const utils = trpc.useUtils();

  return useFeatureMutation(adminApi.mutAdminPlaceVerificationReject, {
    onSuccess: async () => {
      toast.success("Verification rejected");
      await utils.admin.placeVerification.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to reject verification");
    },
  });
}
