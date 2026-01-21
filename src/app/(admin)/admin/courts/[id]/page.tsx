"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Check,
  ChevronsUpDown,
  Copy,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  StandardFormField,
  StandardFormInput,
  StandardFormProvider,
  StandardFormSelect,
} from "@/components/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { AdminNavbar, AdminSidebar } from "@/features/admin";
import {
  useAdminCourt,
  useRemoveAdminCourtPhoto,
  useTransferPlaceToOrganization,
  useUpdateCuratedCourt,
  useUploadAdminCourtPhoto,
} from "@/features/admin/hooks/use-admin-courts";
import { useAdminStats } from "@/features/admin/hooks/use-admin-dashboard";
import {
  type AdminCourtEditFormData,
  adminCourtEditSchema,
} from "@/features/admin/schemas/admin-court-edit.schema";
import { AMENITIES } from "@/features/admin/schemas/curated-court.schema";
import { useLogout, useSession } from "@/features/auth";
import { PLACE_TIME_ZONES } from "@/features/owner/schemas/place-form.schema";
import { env } from "@/lib/env";
import { AppShell } from "@/shared/components/layout";
import { appRoutes } from "@/shared/lib/app-routes";
import { useGoogleLocPreviewMutation } from "@/shared/lib/clients/google-loc-client";
import { usePHProvincesCitiesQuery } from "@/shared/lib/clients/ph-provinces-cities-client";
import {
  buildCityOptions,
  buildProvinceOptions,
  findCityByName,
  findCityByNameAcrossProvinces,
  findProvinceByName,
} from "@/shared/lib/ph-location-data";

import { getClientErrorMessage } from "@/shared/lib/toast-errors";
import { trpc } from "@/trpc/client";

const DEFAULT_COUNTRY = "PH";
const SAMPLE_GOOGLE_URL = "https://maps.app.goo.gl/6AGA5vZkzKazGswRA";
const DEFAULT_COURT_UNIT = { label: "Court 1", sportId: "", tierLabel: "" };

type OrganizationSearchItem = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
};

export default function AdminCourtEditPage() {
  const params = useParams();
  const router = useRouter();
  const courtId = params.id as string;

  const { data: user } = useSession();
  const logoutMutation = useLogout();

  const { data: stats } = useAdminStats();
  const { data: courtData, isLoading: courtLoading } = useAdminCourt(courtId);
  const updateMutation = useUpdateCuratedCourt();
  const uploadPhotoMutation = useUploadAdminCourtPhoto(courtId);
  const removePhotoMutation = useRemoveAdminCourtPhoto(courtId);
  const transferMutation = useTransferPlaceToOrganization();

  const [pendingPhotoId, setPendingPhotoId] = React.useState<string | null>(
    null,
  );
  const [isTransferOpen, setIsTransferOpen] = React.useState(false);
  const [isOrgPopoverOpen, setIsOrgPopoverOpen] = React.useState(false);
  const [orgSearch, setOrgSearch] = React.useState("");
  const [selectedOrganization, setSelectedOrganization] = React.useState<
    OrganizationSearchItem | undefined
  >(undefined);
  const [autoVerifyAndEnable, setAutoVerifyAndEnable] = React.useState(true);

  const { data: sports = [], isLoading: sportsLoading } =
    trpc.sport.list.useQuery({});

  const deferredOrgSearch = React.useDeferredValue(orgSearch);
  const orgSearchQuery = trpc.admin.organization.search.useQuery(
    {
      query: deferredOrgSearch.trim() || undefined,
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
      country: DEFAULT_COUNTRY,
      latitude: "",
      longitude: "",
      timeZone: "Asia/Manila",
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

    let resolvedProvince = courtData.place.province;
    let resolvedCity = courtData.place.city;

    const matchedProvince = findProvinceByName(
      provincesCities,
      courtData.place.province,
    );
    if (matchedProvince) {
      resolvedProvince = matchedProvince.name;
      const matchedCity = findCityByName(matchedProvince, courtData.place.city);
      if (matchedCity) {
        resolvedCity = matchedCity.name;
      }
    }
    if (!resolvedCity && courtData.place.city) {
      const acrossMatch = findCityByNameAcrossProvinces(
        provincesCities,
        courtData.place.city,
      );
      if (acrossMatch) {
        resolvedCity = acrossMatch.city.name;
      }
    }

    return {
      name: courtData.place.name,
      address: courtData.place.address,
      city: resolvedCity,
      province: resolvedProvince,
      country: courtData.place.country ?? DEFAULT_COUNTRY,
      latitude: courtData.place.latitude ?? "",
      longitude: courtData.place.longitude ?? "",
      timeZone: courtData.place.timeZone ?? "Asia/Manila",
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
    register,
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
  const countryValue = watch("country");

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
    },
  });

  const previewResult = previewMutation.data;
  const previewError = previewMutation.error;
  const isPreviewing = previewMutation.isPending;
  const previewErrorMessage = previewError
    ? getClientErrorMessage(previewError, "Request failed")
    : null;

  const organizationOptions = orgSearchQuery.data?.items ?? [];

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
    if (countryValue !== DEFAULT_COUNTRY) {
      setValue("country", DEFAULT_COUNTRY, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: true,
      });
    }
  }, [countryValue, setValue]);

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

  const countryOptions = React.useMemo(
    () => [{ label: "Philippines (PH)", value: DEFAULT_COUNTRY }],
    [],
  );

  const timeZoneOptions = React.useMemo(
    () => PLACE_TIME_ZONES.map((zone) => ({ label: zone, value: zone })),
    [],
  );

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
    if (previewResult?.lat === undefined || previewResult?.lng === undefined) {
      return "";
    }
    return `${previewResult.lat.toFixed(6)}, ${previewResult.lng.toFixed(6)}`;
  }, [previewResult?.lat, previewResult?.lng]);

  React.useEffect(() => {
    if (!courtLoading && !courtData) {
      router.push(appRoutes.admin.courts.base);
    }
  }, [courtData, courtLoading, router]);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
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

  const handleTransfer = async () => {
    if (!selectedOrganization) return;
    try {
      await transferMutation.mutateAsync({
        placeId: courtId,
        targetOrganizationId: selectedOrganization.id,
        autoVerifyAndEnable,
      });
      toast.success("Ownership transferred", {
        description: `${courtData?.place.name ?? "Place"} now belongs to ${selectedOrganization.name}.`,
      });
      setIsTransferOpen(false);
    } catch (error) {
      toast.error("Failed to transfer ownership", {
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
        country: data.country,
        latitude: data.latitude?.trim() || undefined,
        longitude: data.longitude?.trim() || undefined,
        timeZone: data.timeZone || undefined,
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
  const orgSearchLoading =
    orgSearchQuery.isLoading || orgSearchQuery.isFetching;

  return (
    <AppShell
      sidebar={
        <AdminSidebar
          user={{
            name: user?.email?.split("@")[0],
            email: user?.email,
          }}
          pendingClaimsCount={stats?.pendingClaims || 0}
          pendingVerificationsCount={stats?.pendingVerifications || 0}
        />
      }
      navbar={
        <AdminNavbar
          user={{
            name: user?.email?.split("@")[0],
            email: user?.email,
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

        <Card>
          <CardHeader>
            <CardTitle>Ownership & Transfer</CardTitle>
            <CardDescription>
              Assign this place to an organization and enable reservations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  Current organization
                </p>
                <p className="text-sm font-medium">
                  {currentOrganization?.name ?? "Unassigned"}
                </p>
                {currentOrganization?.slug ? (
                  <p className="text-xs text-muted-foreground">
                    {currentOrganization.slug}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Status</p>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={
                      courtData.place.placeType === "RESERVABLE"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {courtData.place.placeType}
                  </Badge>
                  <Badge
                    variant={
                      courtData.place.claimStatus === "CLAIMED"
                        ? "success"
                        : "warning"
                    }
                  >
                    {courtData.place.claimStatus}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
                <DialogTrigger asChild>
                  <Button type="button">Transfer</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Transfer to organization</DialogTitle>
                    <DialogDescription>
                      Move this place and its courts to another organization.
                      Reservations stay intact.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Organization</Label>
                      <Popover
                        open={isOrgPopoverOpen}
                        onOpenChange={setIsOrgPopoverOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={isOrgPopoverOpen}
                            className="w-full justify-between"
                          >
                            <span className="truncate">
                              {selectedOrganization
                                ? selectedOrganization.name
                                : "Select organization"}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[320px] p-0" align="start">
                          <Command>
                            <CommandInput
                              placeholder="Search organizations..."
                              value={orgSearch}
                              onValueChange={setOrgSearch}
                            />
                            <CommandList>
                              <CommandEmpty>
                                {orgSearchLoading
                                  ? "Loading organizations..."
                                  : "No organizations found."}
                              </CommandEmpty>
                              <CommandGroup>
                                {organizationOptions.map((org) => (
                                  <CommandItem
                                    key={org.id}
                                    value={`${org.name} ${org.slug}`}
                                    onSelect={() => {
                                      setSelectedOrganization(org);
                                      setIsOrgPopoverOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={
                                        selectedOrganization?.id === org.id
                                          ? "mr-2 h-4 w-4 opacity-100"
                                          : "mr-2 h-4 w-4 opacity-0"
                                      }
                                    />
                                    <div className="flex flex-col text-left">
                                      <span className="text-sm font-medium">
                                        {org.name}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {org.slug}
                                      </span>
                                    </div>
                                    {!org.isActive ? (
                                      <Badge
                                        variant="warning"
                                        className="ml-auto"
                                      >
                                        Inactive
                                      </Badge>
                                    ) : null}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {isSameOrganization ? (
                        <p className="text-xs text-destructive">
                          Select a different organization to transfer.
                        </p>
                      ) : null}
                    </div>

                    <div className="flex items-start gap-3 rounded-lg border border-border/60 p-3">
                      <Checkbox
                        id="auto-verify"
                        checked={autoVerifyAndEnable}
                        onCheckedChange={(checked) =>
                          setAutoVerifyAndEnable(Boolean(checked))
                        }
                      />
                      <div className="space-y-1">
                        <Label htmlFor="auto-verify" className="text-sm">
                          Auto-verify and enable reservations
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Marks the place as VERIFIED and enables booking
                          immediately.
                        </p>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsTransferOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleTransfer}
                      disabled={transferDisabled}
                    >
                      {transferMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Transfer
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button
                type="button"
                variant="outline"
                onClick={handleCopyOwnerLink}
                disabled={!currentOrganization}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy owner link
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Transfers keep existing reservations and move all courts under
              this place.
            </p>
          </CardContent>
        </Card>

        <StandardFormProvider
          form={form}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <AlertDialog
            open={!!pendingPhotoId}
            onOpenChange={(open) => {
              if (!open) {
                setPendingPhotoId(null);
              }
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove Photo</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove the photo from this court and cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel
                  type="button"
                  disabled={removePhotoMutation.isPending}
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    if (!pendingPhotoId) return;
                    removePhotoMutation.mutate(
                      { placeId: courtId, photoId: pendingPhotoId },
                      {
                        onSuccess: () => {
                          toast.success("Photo removed");
                          setPendingPhotoId(null);
                        },
                        onError: (error) => {
                          toast.error(
                            error.message || "Failed to remove court photo",
                          );
                        },
                      },
                    );
                  }}
                  disabled={removePhotoMutation.isPending || !pendingPhotoId}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {removePhotoMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Remove Photo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Update the court&apos;s basic details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <StandardFormInput<AdminCourtEditFormData>
                name="name"
                label="Court Name"
                placeholder="Makati Pickleball Club"
                required
              />

              <StandardFormInput<AdminCourtEditFormData>
                name="address"
                label="Address"
                placeholder="123 Sports Avenue, Barangay San Lorenzo"
                required
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <StandardFormSelect<AdminCourtEditFormData>
                  name="province"
                  label="Province"
                  options={provinceOptions}
                  placeholder={provincePlaceholder}
                  required
                  disabled={isProvinceDisabled}
                />
                <StandardFormSelect<AdminCourtEditFormData>
                  name="city"
                  label="City"
                  options={cityOptions}
                  placeholder={cityPlaceholder}
                  required
                  disabled={isCityDisabled}
                />
              </div>

              <StandardFormSelect<AdminCourtEditFormData>
                name="country"
                label="Country"
                options={countryOptions}
                placeholder="Philippines (PH)"
                required
                disabled
              />

              <StandardFormSelect<AdminCourtEditFormData>
                name="timeZone"
                label="Time Zone"
                options={timeZoneOptions}
                placeholder="Select a time zone"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Map (optional)</CardTitle>
              <CardDescription>
                Paste a Google Maps link to auto-fill coordinates. Address and
                city still require confirmation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="googleUrl">Google Maps URL</Label>
                <Input
                  id="googleUrl"
                  value={googleUrl}
                  onChange={(event) => setGoogleUrl(event.target.value)}
                  placeholder={SAMPLE_GOOGLE_URL}
                  inputMode="url"
                />
                {hasEmbedKey ? null : (
                  <p className="text-xs text-muted-foreground">
                    Embed previews are disabled until a Google Maps key is
                    configured.
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Example: {SAMPLE_GOOGLE_URL}
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handlePreview}
                disabled={googleUrl.trim().length === 0 || isPreviewing}
                className="w-full"
              >
                {isPreviewing ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Resolving…
                  </span>
                ) : (
                  "Locate"
                )}
              </Button>

              <div className="grid gap-4 sm:grid-cols-2">
                <StandardFormInput<AdminCourtEditFormData>
                  name="latitude"
                  label="Latitude (optional)"
                  placeholder="e.g., 14.5547"
                />
                <StandardFormInput<AdminCourtEditFormData>
                  name="longitude"
                  label="Longitude (optional)"
                  placeholder="e.g., 121.0244"
                />
              </div>

              {previewErrorMessage && (
                <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                  {previewErrorMessage}
                </div>
              )}

              {previewResult && (
                <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Resolved URL
                      </div>
                      {previewResult.resolvedUrl ? (
                        <a
                          href={previewResult.resolvedUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="break-all text-accent hover:underline"
                        >
                          {previewResult.resolvedUrl}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">(none)</span>
                      )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Suggested name
                        </div>
                        <div>{previewResult.suggestedName ?? "(none)"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Coordinates
                        </div>
                        <div>
                          {coordinateLabel ? (
                            <span className="font-mono">{coordinateLabel}</span>
                          ) : (
                            "(none)"
                          )}
                          {previewResult.zoom !== undefined && (
                            <span className="text-muted-foreground">
                              {` · z${previewResult.zoom}`}
                            </span>
                          )}
                          {previewResult.source && (
                            <span className="text-muted-foreground">
                              {` · ${previewResult.source}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {previewResult.warnings.length > 0 && (
                    <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
                      <div className="text-xs font-medium">Warnings</div>
                      <ul className="mt-1 list-disc pl-5 text-xs text-muted-foreground">
                        {previewResult.warnings.map((warning: string) => (
                          <li key={warning}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {previewResult.embedSrc ? (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Embed preview</div>
                      <div className="aspect-video overflow-hidden rounded-xl border border-border/60 bg-muted">
                        <iframe
                          title="Google Maps Embed"
                          src={previewResult.embedSrc}
                          className="h-full w-full"
                          loading="lazy"
                          allowFullScreen
                          referrerPolicy="no-referrer-when-downgrade"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-border/60 bg-muted/40 p-3 text-sm text-muted-foreground">
                      {hasEmbedKey
                        ? "No embed preview available for this link."
                        : "Embed preview unavailable (missing Google Maps key)."}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Court Inventory</CardTitle>
              <CardDescription>
                Define each court unit and its sport
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {courtFields.map((field, index) => (
                  <div
                    key={field.fieldId}
                    className="rounded-lg border border-border/60 bg-background p-4 shadow-sm"
                  >
                    <input
                      type="hidden"
                      {...register(`courts.${index}.id` as const)}
                    />
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-medium">
                        {`Court ${index + 1}`}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCourt(index)}
                        disabled={courtFields.length === 1}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                      <StandardFormInput<AdminCourtEditFormData>
                        name={`courts.${index}.label`}
                        label="Court Label"
                        placeholder="Court 1"
                        required
                      />
                      <StandardFormSelect<AdminCourtEditFormData>
                        name={`courts.${index}.sportId`}
                        label="Sport"
                        placeholder="Select a sport"
                        options={sportOptions}
                        required
                        disabled={sportsLoading}
                      />
                      <StandardFormInput<AdminCourtEditFormData>
                        name={`courts.${index}.tierLabel`}
                        label="Tier Label"
                        placeholder="VIP"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => appendCourt({ ...DEFAULT_COURT_UNIT })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Court
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                How players can reach or find this court
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <StandardFormInput<AdminCourtEditFormData>
                  name="facebookUrl"
                  label="Facebook Page"
                  placeholder="https://facebook.com/..."
                />

                <StandardFormInput<AdminCourtEditFormData>
                  name="instagramUrl"
                  label="Instagram"
                  placeholder="https://instagram.com/..."
                />

                <StandardFormInput<AdminCourtEditFormData>
                  name="phoneNumber"
                  label="Phone Number"
                  placeholder="0917 123 4567"
                  type="tel"
                  autoComplete="tel"
                />

                <StandardFormInput<AdminCourtEditFormData>
                  name="viberInfo"
                  label="Viber Number"
                  placeholder="0917 123 4567"
                  type="tel"
                  autoComplete="tel"
                />

                <StandardFormInput<AdminCourtEditFormData>
                  name="websiteUrl"
                  label="Website"
                  placeholder="https://example.com"
                />
              </div>

              <StandardFormField<AdminCourtEditFormData>
                name="otherContactInfo"
                label="Other Contact Information"
              >
                {({ field }) => (
                  <Textarea
                    placeholder="Any additional contact information..."
                    rows={3}
                    value={typeof field.value === "string" ? field.value : ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                )}
              </StandardFormField>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Amenities</CardTitle>
              <CardDescription>
                Select the amenities available at this court
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StandardFormField<AdminCourtEditFormData> name="amenities">
                {({ field }) => {
                  const current = Array.isArray(field.value)
                    ? (field.value as string[])
                    : [];

                  return (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                      {AMENITIES.map((amenity) => (
                        <div
                          key={amenity}
                          className="flex items-start gap-3 text-sm font-normal"
                        >
                          <Checkbox
                            checked={current.includes(amenity)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                field.onChange([...current, amenity]);
                              } else {
                                field.onChange(
                                  current.filter((value) => value !== amenity),
                                );
                              }
                            }}
                          />
                          <span>{amenity}</span>
                        </div>
                      ))}
                    </div>
                  );
                }}
              </StandardFormField>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Photos</CardTitle>
              <CardDescription>Upload court photos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  First photo is used as the cover image.
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      const formData = new FormData();
                      formData.append("placeId", courtId);
                      formData.append("image", file, file.name);
                      uploadPhotoMutation.mutate(formData, {
                        onError: (error) => {
                          toast.error(
                            error.message || "Failed to upload court photo",
                          );
                        },
                      });
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadPhotoMutation.isPending}
                  >
                    {uploadPhotoMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    <span className="ml-2">
                      {uploadPhotoMutation.isPending
                        ? "Uploading..."
                        : "Add photo"}
                    </span>
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {courtData.photos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="relative aspect-square overflow-hidden rounded-lg border bg-muted/20"
                  >
                    <Image
                      src={photo.url}
                      alt="Court photo"
                      fill
                      className="object-cover"
                    />
                    {index === 0 && (
                      <span className="absolute top-2 left-2 rounded bg-primary px-2 py-1 text-xs text-primary-foreground">
                        Cover
                      </span>
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute right-2 top-2 h-8 w-8 rounded-full"
                      onClick={() => setPendingPhotoId(photo.id)}
                      disabled={removePhotoMutation.isPending}
                      aria-label="Remove photo"
                    >
                      {removePhotoMutation.isPending &&
                      pendingPhotoId === photo.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href={appRoutes.admin.courts.base}>Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitDisabled}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </StandardFormProvider>
      </div>
    </AppShell>
  );
}
