"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { appRoutes } from "@/common/app-routes";
import { useGoogleLocPreviewMutation } from "@/common/clients/google-loc-client";
import { usePHProvincesCitiesQuery } from "@/common/clients/ph-provinces-cities-client";
import { useDebouncedValue } from "@/common/hooks/use-debounced-value";
import {
  buildCityOptions,
  buildProvinceOptions,
  findCityByName,
  findProvinceByName,
  resolveProvinceCityValues,
} from "@/common/ph-location-data";
import { toast } from "@/common/toast";
import { getClientErrorMessage } from "@/common/toast/errors";
import { AppShell } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { AdminNavbar, AdminSidebar } from "@/features/admin";
import { AdminCourtEditForm } from "@/features/admin/components/admin-court-edit-form";
import { AdminCourtFeaturedPlacementCard } from "@/features/admin/components/admin-court-featured-placement-card";
import {
  AdminCourtOwnershipTransferCard,
  type OrganizationSearchItem,
} from "@/features/admin/components/admin-court-ownership-transfer-card";
import { AdminVenueOnboardingStatusCard } from "@/features/admin/components/admin-venue-onboarding-status-card";
import {
  useMutRecuratePlace,
  useMutRemoveAdminCourtPhoto,
  useMutTransferPlaceToOrganization,
  useMutUpdateCuratedCourt,
  useMutUploadAdminCourtPhoto,
  useQueryAdminCourt,
  useQueryAdminOrganizationSearch,
  useQueryAdminSidebarStats,
  useQueryAdminSports,
} from "@/features/admin/hooks";
import {
  type AdminCourtEditFormData,
  adminCourtEditSchema,
} from "@/features/admin/schemas";
import { useMutAuthLogout, useQueryAuthSession } from "@/features/auth";
import { env } from "@/lib/env";

const SAMPLE_GOOGLE_URL = "https://maps.app.goo.gl/6AGA5vZkzKazGswRA";
const DEFAULT_COURT_UNIT = { label: "Court 1", sportId: "", tierLabel: "" };

type AdminCourtEditViewProps = {
  courtId: string;
};

export function AdminCourtEditView({ courtId }: AdminCourtEditViewProps) {
  const router = useRouter();

  const { data: rawUser } = useQueryAuthSession();
  const logoutMutation = useMutAuthLogout();
  const user = rawUser as { email?: string | null } | undefined;

  const { data: stats } = useQueryAdminSidebarStats();
  const { data: courtData, isLoading: courtLoading } =
    useQueryAdminCourt(courtId);
  const updateMutation = useMutUpdateCuratedCourt();
  const uploadPhotoMutation = useMutUploadAdminCourtPhoto(courtId);
  const removePhotoMutation = useMutRemoveAdminCourtPhoto(courtId);
  const transferMutation = useMutTransferPlaceToOrganization();
  const recurateMutation = useMutRecuratePlace();

  const [pendingPhotoId, setPendingPhotoId] = React.useState<string | null>(
    null,
  );
  const [isTransferOpen, setIsTransferOpen] = React.useState(false);
  const [isRecurateOpen, setIsRecurateOpen] = React.useState(false);
  const [isOrgPopoverOpen, setIsOrgPopoverOpen] = React.useState(false);
  const [orgSearch, setOrgSearch] = React.useState("");
  const [selectedOrganization, setSelectedOrganization] = React.useState<
    OrganizationSearchItem | undefined
  >(undefined);
  const [autoVerifyAndEnable, setAutoVerifyAndEnable] = React.useState(true);
  const [recurateReason, setRecurateReason] = React.useState("");
  const [featuredRankInput, setFeaturedRankInput] = React.useState("0");
  const [provinceRankInput, setProvinceRankInput] = React.useState("0");
  const [isSavingFeaturedRank, setIsSavingFeaturedRank] = React.useState(false);
  const [isSavingProvinceRank, setIsSavingProvinceRank] = React.useState(false);

  const { data: rawSports, isLoading: sportsLoading } = useQueryAdminSports({});
  const sports = (rawSports ?? []) as Array<{ id: string; name: string }>;

  const debouncedOrgSearch = useDebouncedValue(orgSearch, 2000);
  const orgSearchQuery = useQueryAdminOrganizationSearch(
    {
      query: debouncedOrgSearch.trim() || undefined,
      limit: 20,
      offset: 0,
    },
    {
      enabled: isTransferOpen,
    },
  );

  const hasEmbedKey = Boolean(env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY);
  const [googleUrl, setGoogleUrl] = React.useState("");
  const provincesCitiesQuery = usePHProvincesCitiesQuery();
  const provincesCities = provincesCitiesQuery.data ?? null;

  const emptyDefaults = React.useMemo<AdminCourtEditFormData>(
    () => ({
      name: "",
      address: "",
      city: "",
      province: "",
      latitude: "",
      longitude: "",
      extGPlaceId: "",
      facebookUrl: "",
      instagramUrl: "",
      phoneNumber: "",
      viberInfo: "",
      websiteUrl: "",
      otherContactInfo: "",
      amenities: [],
      courts: [{ ...DEFAULT_COURT_UNIT }],
    }),
    [],
  );

  const resolvedDefaults = React.useMemo<AdminCourtEditFormData | null>(() => {
    if (!courtData || !provincesCities) {
      return null;
    }

    const courts = courtData.courts.map((court) => ({
      id: court.court.id,
      label: court.court.label,
      sportId: court.court.sportId,
      tierLabel: court.court.tierLabel ?? "",
    }));

    const { province: resolvedProvince, city: resolvedCity } =
      resolveProvinceCityValues(
        provincesCities,
        courtData.place.province,
        courtData.place.city,
      );

    return {
      name: courtData.place.name,
      address: courtData.place.address,
      city: resolvedCity,
      province: resolvedProvince,
      latitude: courtData.place.latitude ?? "",
      longitude: courtData.place.longitude ?? "",
      extGPlaceId: courtData.place.extGPlaceId ?? "",
      facebookUrl: courtData.contactDetail?.facebookUrl ?? "",
      instagramUrl: courtData.contactDetail?.instagramUrl ?? "",
      phoneNumber: courtData.contactDetail?.phoneNumber ?? "",
      viberInfo: courtData.contactDetail?.viberInfo ?? "",
      websiteUrl: courtData.contactDetail?.websiteUrl ?? "",
      otherContactInfo: courtData.contactDetail?.otherContactInfo ?? "",
      amenities: courtData.amenities.map((amenity) => amenity.name),
      courts: courts.length > 0 ? courts : [{ ...DEFAULT_COURT_UNIT }],
    };
  }, [courtData, provincesCities]);

  const form = useForm<AdminCourtEditFormData>({
    resolver: zodResolver(adminCourtEditSchema),
    mode: "onChange",
    defaultValues: emptyDefaults,
  });

  const {
    fields: courtFields,
    append: appendCourt,
    remove: removeCourt,
  } = useFieldArray<AdminCourtEditFormData, "courts", "fieldId">({
    control: form.control,
    name: "courts",
    keyName: "fieldId",
  });

  const {
    reset,
    setValue,
    watch,
    formState: { isDirty, isSubmitting },
  } = form;

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isFormReady, setIsFormReady] = React.useState(false);

  React.useEffect(() => {
    if (!resolvedDefaults) return;
    reset(resolvedDefaults);
    setIsFormReady(true);
  }, [reset, resolvedDefaults]);

  const nameValue = watch("name");
  const provinceValue = watch("province");
  const cityValue = watch("city");
  const latitudeValue = watch("latitude");
  const longitudeValue = watch("longitude");
  const extGPlaceIdValue = watch("extGPlaceId");

  const previewMutation = useGoogleLocPreviewMutation({
    onSuccess: (data) => {
      if (data.suggestedName && !nameValue.trim()) {
        setValue("name", data.suggestedName, {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        });
      }

      if (data.lat !== undefined) {
        setValue("latitude", data.lat.toString(), {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        });
      }

      if (data.lng !== undefined) {
        setValue("longitude", data.lng.toString(), {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        });
      }

      if (data.placeId) {
        setValue("extGPlaceId", data.placeId, {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        });
      }
    },
  });

  const previewResult = previewMutation.data;
  const previewError = previewMutation.error;
  const isPreviewing = previewMutation.isPending;
  const previewErrorMessage = previewError
    ? getClientErrorMessage(previewError, "Request failed")
    : null;

  const organizationOptions =
    (orgSearchQuery.data as { items?: OrganizationSearchItem[] } | undefined)
      ?.items ?? [];

  React.useEffect(() => {
    if (!isTransferOpen) {
      setIsOrgPopoverOpen(false);
      return;
    }
    setOrgSearch("");
    setSelectedOrganization(undefined);
    setAutoVerifyAndEnable(true);
  }, [isTransferOpen]);

  React.useEffect(() => {
    if (!isRecurateOpen) {
      setRecurateReason("");
    }
  }, [isRecurateOpen]);

  const provinceOptions = React.useMemo(() => {
    if (!provincesCities) return [];

    return buildProvinceOptions(provincesCities, "name");
  }, [provincesCities]);

  const selectedProvince = React.useMemo(
    () =>
      provincesCities
        ? findProvinceByName(provincesCities, provinceValue)
        : null,
    [provinceValue, provincesCities],
  );

  const _resolvedProvinceValue = React.useMemo(() => {
    if (!provinceValue) return "";
    if (!selectedProvince) return provinceValue;
    return selectedProvince.name;
  }, [provinceValue, selectedProvince]);

  const cityOptions = React.useMemo(() => {
    if (!provincesCities || !selectedProvince) return [];

    return buildCityOptions(selectedProvince, "name");
  }, [provincesCities, selectedProvince]);

  const provincePlaceholder = provincesCitiesQuery.isLoading
    ? "Loading provinces..."
    : "Select province";

  const cityPlaceholder = !provinceValue
    ? "Select a province first"
    : provincesCitiesQuery.isLoading
      ? "Loading cities..."
      : "Select city";

  const isProvinceDisabled = provincesCitiesQuery.isLoading || !provincesCities;
  const isCityDisabled = isProvinceDisabled || !provinceValue;

  // Sync city when province changes (user interaction)
  React.useEffect(() => {
    if (!provincesCities || !provinceValue) return;

    const freshSelectedProvince = findProvinceByName(
      provincesCities,
      provinceValue,
    );
    if (!freshSelectedProvince) return;

    // If city is set but not valid for the selected province, clear it
    if (cityValue) {
      const freshSelectedCity = findCityByName(
        freshSelectedProvince,
        cityValue,
      );
      if (!freshSelectedCity) {
        setValue("city", "", {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        });
      }
    }
  }, [cityValue, provinceValue, provincesCities, setValue]);

  const coordinateLabel = React.useMemo(() => {
    const lat =
      previewResult?.lat ??
      (latitudeValue ? Number.parseFloat(latitudeValue) : undefined);
    const lng =
      previewResult?.lng ??
      (longitudeValue ? Number.parseFloat(longitudeValue) : undefined);

    if (lat === undefined || lng === undefined) return "";
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return "";
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }, [latitudeValue, longitudeValue, previewResult?.lat, previewResult?.lng]);

  const placeIdLabel = previewResult?.placeId ?? extGPlaceIdValue ?? "";

  React.useEffect(() => {
    if (!courtLoading && !courtData) {
      router.push(appRoutes.admin.courts.base);
    }
  }, [courtData, courtLoading, router]);

  React.useEffect(() => {
    if (courtData?.place.featuredRank === undefined) return;
    setFeaturedRankInput(courtData.place.featuredRank.toString());
  }, [courtData?.place.featuredRank]);

  React.useEffect(() => {
    if (courtData?.place.provinceRank === undefined) return;
    setProvinceRankInput(courtData.place.provinceRank.toString());
  }, [courtData?.place.provinceRank]);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync(undefined);
    window.location.href = appRoutes.login.from(
      appRoutes.admin.courts.detail(courtId),
    );
  };

  const handleCopyOwnerLink = async () => {
    try {
      const ownerPath = appRoutes.login.from(
        appRoutes.owner.places.edit(courtId),
      );
      const url = `${window.location.origin}${ownerPath}`;
      await navigator.clipboard.writeText(url);
      toast.success("Owner link copied", {
        description: "Share this to open the owner portal after login.",
      });
    } catch (error) {
      toast.error("Unable to copy owner link", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  const handleRemovePhoto = React.useCallback(
    (photoId: string) => {
      removePhotoMutation.mutate(
        { placeId: courtId, photoId },
        {
          onSuccess: () => {
            toast.success("Photo removed");
            setPendingPhotoId(null);
          },
          onError: (error) => {
            toast.error(error.message || "Failed to remove court photo");
          },
        },
      );
    },
    [courtId, removePhotoMutation],
  );

  const handleUploadPhoto = React.useCallback(
    (file: File) => {
      const formData = new FormData();
      formData.append("placeId", courtId);
      formData.append("image", file, file.name);
      uploadPhotoMutation.mutate(formData, {
        onError: (error) => {
          toast.error(error.message || "Failed to upload court photo");
        },
      });
    },
    [courtId, uploadPhotoMutation],
  );

  const handleTransfer = async () => {
    if (!selectedOrganization) return;
    try {
      await transferMutation.mutateAsync({
        placeId: courtId,
        targetOrganizationId: selectedOrganization.id,
        autoVerifyAndEnable,
      });
      toast.success("Ownership transferred", {
        description: `${courtData?.place.name ?? "Venue"} now belongs to ${selectedOrganization.name}.`,
      });
      setIsTransferOpen(false);
    } catch (error) {
      toast.error("Failed to transfer ownership", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  const handleRecurate = async () => {
    const reason = recurateReason.trim();
    if (!reason) {
      toast.error("Reason is required to return venue to curated");
      return;
    }

    try {
      await recurateMutation.mutateAsync({
        placeId: courtId,
        reason,
      });
      toast.success("Venue returned to curated", {
        description: `${courtData?.place.name ?? "Venue"} is now unclaimed and curated.`,
      });
      setIsRecurateOpen(false);
    } catch (error) {
      toast.error("Failed to return venue to curated", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  const handleSubmit = async (data: AdminCourtEditFormData) => {
    try {
      await updateMutation.mutateAsync({
        placeId: courtId,
        name: data.name,
        address: data.address,
        city: data.city,
        province: data.province,
        latitude: data.latitude?.trim() || undefined,
        longitude: data.longitude?.trim() || undefined,
        extGPlaceId: data.extGPlaceId?.trim() || undefined,
        facebookUrl: data.facebookUrl || undefined,
        instagramUrl: data.instagramUrl || undefined,
        phoneNumber: data.phoneNumber || undefined,
        viberInfo: data.viberInfo || undefined,
        websiteUrl: data.websiteUrl || undefined,
        otherContactInfo: data.otherContactInfo || undefined,
        amenities: data.amenities,
        courts: data.courts.map((court) => ({
          id: court.id,
          label: court.label,
          sportId: court.sportId,
          tierLabel: court.tierLabel || undefined,
        })),
      });

      reset(data);
      toast.success("Court updated successfully");
    } catch (error) {
      toast.error("Failed to update court", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    }
  };

  const handlePreview = () => {
    if (!googleUrl.trim()) return;
    previewMutation.reset();
    previewMutation.mutate({ url: googleUrl });
  };

  const handleSaveFeaturedRank = async () => {
    const trimmed = featuredRankInput.trim();
    const parsed = Number(trimmed);
    if (!Number.isInteger(parsed) || parsed < 0) {
      toast.error("Featured rank must be a whole number of 0 or more");
      return;
    }

    try {
      setIsSavingFeaturedRank(true);
      await updateMutation.mutateAsync({
        placeId: courtId,
        latitude: undefined,
        longitude: undefined,
        featuredRank: parsed,
      });
      setFeaturedRankInput(parsed.toString());
      toast.success("Featured rank updated");
    } catch (error) {
      toast.error("Failed to update featured rank", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    } finally {
      setIsSavingFeaturedRank(false);
    }
  };

  const handleSaveProvinceRank = async () => {
    const trimmed = provinceRankInput.trim();
    const parsed = Number(trimmed);
    if (!Number.isInteger(parsed) || parsed < 0) {
      toast.error("Province rank must be a whole number of 0 or more");
      return;
    }

    try {
      setIsSavingProvinceRank(true);
      await updateMutation.mutateAsync({
        placeId: courtId,
        latitude: undefined,
        longitude: undefined,
        provinceRank: parsed,
      });
      setProvinceRankInput(parsed.toString());
      toast.success("Province rank updated");
    } catch (error) {
      toast.error("Failed to update province rank", {
        description: getClientErrorMessage(error, "Please try again"),
      });
    } finally {
      setIsSavingProvinceRank(false);
    }
  };

  const sportOptions = sports.map((sport) => ({
    label: sport.name,
    value: sport.id,
  }));

  const submitting = updateMutation.isPending || isSubmitting;
  const isSubmitDisabled = submitting || !isDirty;

  if (courtLoading || provincesCitiesQuery.isLoading || !isFormReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!courtData) {
    return null;
  }

  const currentOrganization = courtData.organization;
  const selectedOrganizationId = selectedOrganization?.id;
  const isSameOrganization =
    !!selectedOrganizationId &&
    selectedOrganizationId === currentOrganization?.id;
  const transferDisabled =
    !selectedOrganization || isSameOrganization || transferMutation.isPending;
  const isAlreadyCuratedState =
    courtData.place.placeType === "CURATED" &&
    courtData.place.claimStatus === "UNCLAIMED" &&
    !currentOrganization;
  const recurateDisabled =
    recurateMutation.isPending ||
    isAlreadyCuratedState ||
    recurateReason.trim().length === 0;
  const orgSearchLoading =
    orgSearchQuery.isLoading || orgSearchQuery.isFetching;

  return (
    <AppShell
      sidebar={
        <AdminSidebar
          user={{
            name: user?.email?.split("@")[0],
            email: user?.email ?? undefined,
          }}
          pendingClaimsCount={stats?.pendingClaims || 0}
          pendingVerificationsCount={stats?.pendingVerifications || 0}
        />
      }
      navbar={
        <AdminNavbar
          user={{
            name: user?.email?.split("@")[0],
            email: user?.email ?? undefined,
          }}
          onLogout={handleLogout}
        />
      }
    >
      <div className="space-y-6">
        <PageHeader
          title={`Edit Court: ${courtData.place.name}`}
          description="Update curated court details"
          breadcrumbs={[
            { label: "Courts", href: appRoutes.admin.courts.base },
            { label: courtData.place.name },
            { label: "Edit" },
          ]}
          backHref={appRoutes.admin.courts.base}
        />

        <AdminCourtOwnershipTransferCard
          placeType={courtData.place.placeType}
          claimStatus={courtData.place.claimStatus}
          currentOrganization={currentOrganization}
          selectedOrganization={selectedOrganization}
          setSelectedOrganization={setSelectedOrganization}
          isTransferOpen={isTransferOpen}
          setIsTransferOpen={setIsTransferOpen}
          isOrgPopoverOpen={isOrgPopoverOpen}
          setIsOrgPopoverOpen={setIsOrgPopoverOpen}
          orgSearch={orgSearch}
          setOrgSearch={setOrgSearch}
          organizationOptions={organizationOptions}
          orgSearchLoading={orgSearchLoading}
          autoVerifyAndEnable={autoVerifyAndEnable}
          setAutoVerifyAndEnable={setAutoVerifyAndEnable}
          isSameOrganization={isSameOrganization}
          transferDisabled={transferDisabled}
          transferPending={transferMutation.isPending}
          onTransfer={handleTransfer}
          isRecurateOpen={isRecurateOpen}
          setIsRecurateOpen={setIsRecurateOpen}
          recurateReason={recurateReason}
          setRecurateReason={setRecurateReason}
          recurateDisabled={recurateDisabled}
          recuratePending={recurateMutation.isPending}
          onRecurate={handleRecurate}
          onCopyOwnerLink={handleCopyOwnerLink}
          copyOwnerLinkDisabled={!currentOrganization}
        />

        <AdminVenueOnboardingStatusCard
          placeId={courtId}
          placeIsActive={courtData.place.isActive}
          courtLabels={courtData.courts.map((c) => ({
            courtId: c.court.id,
            label: c.court.label,
          }))}
        />

        <AdminCourtFeaturedPlacementCard
          featuredRankInput={featuredRankInput}
          setFeaturedRankInput={setFeaturedRankInput}
          provinceRankInput={provinceRankInput}
          setProvinceRankInput={setProvinceRankInput}
          onSaveFeaturedRank={handleSaveFeaturedRank}
          onSaveProvinceRank={handleSaveProvinceRank}
          isSavingFeaturedRank={isSavingFeaturedRank}
          isSavingProvinceRank={isSavingProvinceRank}
          isUpdating={updateMutation.isPending}
        />

        <AdminCourtEditForm
          courtData={courtData}
          form={form}
          onSubmit={handleSubmit}
          pendingPhotoId={pendingPhotoId}
          setPendingPhotoId={setPendingPhotoId}
          removePhotoPending={removePhotoMutation.isPending}
          removePhotoTargetId={pendingPhotoId}
          onRemovePhoto={handleRemovePhoto}
          onUploadPhoto={handleUploadPhoto}
          uploadPhotoPending={uploadPhotoMutation.isPending}
          fileInputRef={fileInputRef}
          googleUrl={googleUrl}
          setGoogleUrl={setGoogleUrl}
          hasEmbedKey={hasEmbedKey}
          isPreviewing={isPreviewing}
          previewErrorMessage={previewErrorMessage}
          previewResult={previewResult ?? null}
          coordinateLabel={coordinateLabel}
          placeIdLabel={placeIdLabel}
          onPreview={handlePreview}
          provinceOptions={provinceOptions}
          cityOptions={cityOptions}
          provincePlaceholder={provincePlaceholder}
          cityPlaceholder={cityPlaceholder}
          isProvinceDisabled={isProvinceDisabled}
          isCityDisabled={isCityDisabled}
          sportOptions={sportOptions}
          sportsLoading={sportsLoading}
          courtFields={courtFields}
          appendCourt={(court) => appendCourt(court)}
          removeCourt={removeCourt}
          isSubmitDisabled={isSubmitDisabled}
          submitting={submitting}
          sampleGoogleUrl={SAMPLE_GOOGLE_URL}
        />
      </div>
    </AppShell>
  );
}

export default AdminCourtEditView;
