"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { getClientErrorMessage } from "@/common/hooks/toast-errors";
import { useSession } from "@/features/auth";
import { PlaceDetailListingHelpCard } from "@/features/discovery/place-detail/components/place-detail-listing-help-card";
import {
  type ClaimFormData,
  claimFormSchema,
  type RemovalFormData,
  removalFormSchema,
} from "@/features/discovery/place-detail/forms/schemas";
import { usePlaceDetailUiStore } from "@/features/discovery/place-detail/state/place-detail-ui-store";
import { trpc } from "@/trpc/client";

type PlaceDetailListingHelpSectionProps = {
  placeId: string;
  placeIdOrSlug: string;
  isCurated: boolean;
  claimStatus: "UNCLAIMED" | "CLAIM_PENDING" | "CLAIMED" | "REMOVAL_REQUESTED";
};

export function PlaceDetailListingHelpSection({
  placeId,
  placeIdOrSlug,
  isCurated,
  claimStatus,
}: PlaceDetailListingHelpSectionProps) {
  const { data: session } = useSession();
  const isAuthenticated = !!session;
  const utils = trpc.useUtils();

  const { data: organizations = [] } = trpc.organization.my.useQuery(
    undefined,
    {
      enabled: isAuthenticated,
    },
  );
  const isOwner = organizations.length > 0;
  const canSubmitClaim =
    isCurated && claimStatus === "UNCLAIMED" && isAuthenticated && isOwner;

  const defaultOrganizationId = organizations[0]?.id ?? "";
  const organizationOptions = React.useMemo(
    () =>
      organizations.map((organization) => ({
        label: organization.name,
        value: organization.id,
      })),
    [organizations],
  );

  const claimForm = useForm<ClaimFormData>({
    resolver: zodResolver(claimFormSchema),
    mode: "onChange",
    defaultValues: {
      organizationId: defaultOrganizationId,
      requestNotes: "",
    },
  });
  const removalForm = useForm<RemovalFormData>({
    resolver: zodResolver(removalFormSchema),
    mode: "onChange",
    defaultValues: {
      guestName: "",
      guestEmail: "",
      requestNotes: "",
    },
  });

  const {
    setValue: setClaimValue,
    reset: resetClaimForm,
    getValues: getClaimValues,
    formState: { isValid: isClaimValid, isSubmitting: isClaimSubmitting },
  } = claimForm;
  const {
    reset: resetRemovalForm,
    formState: { isValid: isRemovalValid, isSubmitting: isRemovalSubmitting },
  } = removalForm;

  const isClaimOpen = usePlaceDetailUiStore((s) => s.isClaimOpen);
  const setIsClaimOpen = usePlaceDetailUiStore((s) => s.setIsClaimOpen);
  const isRemovalOpen = usePlaceDetailUiStore((s) => s.isRemovalOpen);
  const setIsRemovalOpen = usePlaceDetailUiStore((s) => s.setIsRemovalOpen);

  const claimMutation = trpc.claimRequest.submitClaim.useMutation();
  const removalMutation = trpc.claimRequest.submitGuestRemoval.useMutation();

  React.useEffect(() => {
    if (!defaultOrganizationId) return;
    const currentOrgId = getClaimValues("organizationId");
    if (currentOrgId) return;
    setClaimValue("organizationId", defaultOrganizationId, {
      shouldDirty: false,
      shouldValidate: true,
    });
  }, [defaultOrganizationId, getClaimValues, setClaimValue]);

  React.useEffect(() => {
    if (isClaimOpen) return;
    const currentOrgId = getClaimValues("organizationId") ?? "";
    const currentNotes = getClaimValues("requestNotes") ?? "";
    if (currentOrgId === defaultOrganizationId && currentNotes === "") {
      return;
    }
    resetClaimForm({
      organizationId: defaultOrganizationId,
      requestNotes: "",
    });
  }, [defaultOrganizationId, getClaimValues, isClaimOpen, resetClaimForm]);

  const claimStatusMessage =
    claimStatus === "CLAIM_PENDING"
      ? "A claim request is pending admin review."
      : claimStatus === "CLAIMED"
        ? "This venue has already been claimed."
        : claimStatus === "REMOVAL_REQUESTED"
          ? "This venue is pending removal review."
          : null;

  const claimHelperText = !isAuthenticated
    ? "Sign in to claim this venue."
    : !isOwner
      ? "Create an organization to claim this venue."
      : "This venue is not currently available to claim.";
  const removalHelperText =
    claimStatus === "REMOVAL_REQUESTED"
      ? "A removal request is already pending review."
      : "Flag incorrect info or request removal.";

  const handleClaimSubmit = async (data: ClaimFormData) => {
    try {
      await claimMutation.mutateAsync({
        placeId,
        organizationId: data.organizationId,
        requestNotes: data.requestNotes?.trim() || undefined,
      });
      toast.success("Claim submitted", {
        description: "We will review your request within 48 hours.",
      });
      resetClaimForm({
        organizationId: defaultOrganizationId,
        requestNotes: "",
      });
      setIsClaimOpen(false);
      await utils.place.getByIdOrSlug.invalidate({ placeIdOrSlug });
    } catch (error) {
      toast.error("Unable to submit claim", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  const handleRemovalSubmit = async (data: RemovalFormData) => {
    try {
      await removalMutation.mutateAsync({
        placeId,
        guestName: data.guestName.trim(),
        guestEmail: data.guestEmail.trim(),
        requestNotes: data.requestNotes.trim(),
      });
      toast.success("Removal request submitted", {
        description: "We will review your request shortly.",
      });
      resetRemovalForm({ guestName: "", guestEmail: "", requestNotes: "" });
      setIsRemovalOpen(false);
      await utils.place.getByIdOrSlug.invalidate({ placeIdOrSlug });
    } catch (error) {
      toast.error("Unable to submit removal request", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  const claimSubmitting = claimMutation.isPending || isClaimSubmitting;
  const claimDisabled = claimSubmitting || !isClaimValid;
  const removalSubmitting = removalMutation.isPending || isRemovalSubmitting;
  const removalDisabled = removalSubmitting || !isRemovalValid;

  return (
    <PlaceDetailListingHelpCard
      canSubmitClaim={canSubmitClaim}
      claimStatus={claimStatus}
      claimStatusMessage={claimStatusMessage}
      claimHelperText={claimHelperText}
      removalHelperText={removalHelperText}
      isClaimOpen={isClaimOpen}
      setIsClaimOpen={setIsClaimOpen}
      isRemovalOpen={isRemovalOpen}
      setIsRemovalOpen={setIsRemovalOpen}
      claimForm={claimForm}
      removalForm={removalForm}
      organizationOptions={organizationOptions}
      onClaimSubmit={handleClaimSubmit}
      onRemovalSubmit={handleRemovalSubmit}
      claimSubmitting={claimSubmitting}
      claimDisabled={claimDisabled}
      removalSubmitting={removalSubmitting}
      removalDisabled={removalDisabled}
    />
  );
}
