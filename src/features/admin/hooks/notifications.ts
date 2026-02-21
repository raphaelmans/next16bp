"use client";

import {
  useFeatureMutation,
  useFeatureQuery,
} from "@/common/feature-api-hooks";
import { getAdminApi } from "../api.runtime";

const adminApi = getAdminApi();

export function useMutAdminNotificationDispatchNow(
  options?: Record<string, unknown>,
) {
  return useFeatureMutation(
    adminApi.mutAdminNotificationDeliveryDispatchNow,
    options,
  );
}

export function useMutAdminNotificationEnqueueReservationCreatedTest(
  options?: Record<string, unknown>,
) {
  return useFeatureMutation(
    adminApi.mutAdminNotificationDeliveryEnqueueReservationCreatedTest,
    options,
  );
}

export function useMutAdminNotificationEnqueuePlaceVerificationReviewedTest(
  options?: Record<string, unknown>,
) {
  return useFeatureMutation(
    adminApi.mutAdminNotificationDeliveryEnqueuePlaceVerificationReviewedTest,
    options,
  );
}

export function useMutAdminNotificationEnqueueClaimReviewedTest(
  options?: Record<string, unknown>,
) {
  return useFeatureMutation(
    adminApi.mutAdminNotificationDeliveryEnqueueClaimReviewedTest,
    options,
  );
}

export function useQueryAdminNotificationMyWebPushSubscriptions(
  input?: Parameters<
    typeof adminApi.queryAdminNotificationDeliveryListMyWebPushSubscriptions
  >[0],
  options?: Record<string, unknown>,
) {
  return useFeatureQuery(
    ["admin", "notificationDelivery", "listMyWebPushSubscriptions"],
    adminApi.queryAdminNotificationDeliveryListMyWebPushSubscriptions,
    input,
    options,
  );
}

export function useMutAdminNotificationEnqueueWebPushTest(
  options?: Record<string, unknown>,
) {
  return useFeatureMutation(
    adminApi.mutAdminNotificationDeliveryEnqueueWebPushTest,
    options,
  );
}
