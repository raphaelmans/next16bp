"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, MapPin, Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { PLACE_AMENITIES } from "@/common/amenities";
import { useGoogleLocPreviewMutation } from "@/common/clients/google-loc-client";
import { usePHProvincesCitiesQuery } from "@/common/clients/ph-provinces-cities-client";
import {
  buildCityOptions,
  buildProvinceOptions,
  findProvinceByName,
} from "@/common/ph-location-data";
import { S } from "@/common/schemas";
import { toast } from "@/common/toast";
import { getClientErrorMessage } from "@/common/toast/errors";
import { toAppError } from "@/common/errors/to-app-error";
import {
  StandardFormCombobox,
  StandardFormInput,
  StandardFormProvider,
} from "@/components/form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useQueryDiscoverySports } from "@/features/discovery/hooks/search";
import { env } from "@/lib/env";
import { useMutSubmitCourt } from "../hooks";

const optionalUrl = z
  .string()
  .trim()
  .check(z.url())
  .optional()
  .or(z.literal(""));

const courtEntrySchema = z.object({
  sportId: S.ids.sportId,
  count: z.number().int().min(1).max(20),
});

const submitVenueFormSchema = z
  .object({
    name: S.place.name,
    courts: z
      .array(courtEntrySchema)
      .min(1, { error: "At least one sport is required" })
      .refine(
        (courts) => {
          const sportIds = courts.map((c) => c.sportId);
          return new Set(sportIds).size === sportIds.length;
        },
        { message: "Each sport can only be added once" },
      ),
    city: S.place.city,
    province: S.place.province,
    locationMode: z.enum(["link", "manual"]),
    googleMapsLink: z.string().trim().optional().or(z.literal("")),
    latitude: z.string().optional().or(z.literal("")),
    longitude: z.string().optional().or(z.literal("")),
    address: z.string().optional().or(z.literal("")),
    amenities: z.array(z.string()),
    facebookUrl: optionalUrl,
    instagramUrl: optionalUrl,
    phoneNumber: z.string().optional().or(z.literal("")),
    websiteUrl: optionalUrl,
  })
  .refine(
    (data) => {
      // Location is optional — only validate if user started filling it in
      const hasLink = !!data.googleMapsLink;
      const hasCoords = !!data.latitude && !!data.longitude;
      if (!hasLink && !hasCoords) return true;
      if (data.locationMode === "link") return hasLink;
      return hasCoords;
    },
    {
      message: "Provide a Google Maps link or both coordinates",
      path: ["googleMapsLink"],
    },
  );

type SubmitVenueFormData = z.infer<typeof submitVenueFormSchema>;

const getSubmitVenueErrorCopy = (error: unknown) => {
  const appError = toAppError(error);

  if (appError.kind === "unauthorized") {
    return {
      title: "Sign in required",
      description:
        "Only authenticated users can submit a venue. Sign in and try again.",
    };
  }

  return {
    title: "Unable to submit venue",
    description: getClientErrorMessage(error, "Please try again."),
  };
};

export function SubmitVenueForm() {
  const submitMutation = useMutSubmitCourt();
  const { data: sports = [], isLoading: sportsLoading } =
    useQueryDiscoverySports();
  const provincesCitiesQuery = usePHProvincesCitiesQuery();
  const googleLocPreview = useGoogleLocPreviewMutation();
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const hasEmbedKey = Boolean(env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY);

  const form = useForm<SubmitVenueFormData>({
    resolver: zodResolver(submitVenueFormSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      courts: [{ sportId: "", count: 1 }],
      city: "",
      province: "",
      locationMode: "link",
      googleMapsLink: "",
      latitude: "",
      longitude: "",
      address: "",
      amenities: [],
      facebookUrl: "",
      instagramUrl: "",
      phoneNumber: "",
      websiteUrl: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "courts",
  });

  const locationMode = form.watch("locationMode");
  const selectedProvince = form.watch("province");
  const watchedCourts = form.watch("courts");

  const selectedSportIds = React.useMemo(
    () => new Set(watchedCourts.map((c) => c.sportId).filter(Boolean)),
    [watchedCourts],
  );

  const provincesCities = provincesCitiesQuery.data ?? null;
  const provinceOptions = React.useMemo(() => {
    if (!provincesCities) return [];
    return buildProvinceOptions(provincesCities, "name");
  }, [provincesCities]);

  const province = React.useMemo(
    () =>
      provincesCities && selectedProvince
        ? findProvinceByName(provincesCities, selectedProvince)
        : null,
    [provincesCities, selectedProvince],
  );

  const cityOptions = React.useMemo(() => {
    if (!province) return [];
    return buildCityOptions(province, "name");
  }, [province]);

  // Reset city when province changes
  const prevProvinceRef = React.useRef(selectedProvince);
  React.useEffect(() => {
    if (prevProvinceRef.current !== selectedProvince) {
      form.setValue("city", "");
      prevProvinceRef.current = selectedProvince;
    }
  }, [selectedProvince, form]);

  const handleParseLink = () => {
    const url = form.getValues("googleMapsLink");
    if (!url) return;

    googleLocPreview.mutate(
      { url },
      {
        onSuccess: (data) => {
          if (data.lat && data.lng) {
            form.setValue("latitude", String(data.lat));
            form.setValue("longitude", String(data.lng));
            if (data.suggestedName && !form.getValues("name")) {
              form.setValue("name", data.suggestedName);
            }
            toast.success("Location extracted from link");
          }
        },
        onError: (error) => {
          toast.error(getClientErrorMessage(error));
        },
      },
    );
  };

  const handleSubmit = (data: SubmitVenueFormData) => {
    submitMutation.mutate(
      {
        name: data.name,
        courts: data.courts.map((c) => ({
          sportId: c.sportId,
          count: c.count,
        })),
        city: data.city,
        province: data.province,
        locationMode: data.locationMode,
        googleMapsLink: data.googleMapsLink || undefined,
        latitude: data.latitude || undefined,
        longitude: data.longitude || undefined,
        address: data.address || undefined,
        amenities: data.amenities.length > 0 ? data.amenities : undefined,
        facebookUrl: data.facebookUrl || undefined,
        instagramUrl: data.instagramUrl || undefined,
        phoneNumber: data.phoneNumber || undefined,
        websiteUrl: data.websiteUrl || undefined,
      },
      {
        onSuccess: () => {
          setIsSubmitted(true);
        },
        onError: (error) => {
          const { title, description } = getSubmitVenueErrorCopy(error);
          toast.error(title, { description });
        },
      },
    );
  };

  const amenities = form.watch("amenities");

  const toggleAmenity = (amenity: string) => {
    const current = form.getValues("amenities");
    if (current.includes(amenity)) {
      form.setValue(
        "amenities",
        current.filter((a) => a !== amenity),
      );
    } else {
      form.setValue("amenities", [...current, amenity]);
    }
  };

  const sportOptions = React.useMemo(
    () =>
      sportsLoading
        ? []
        : (sports as { id: string; name: string }[]).map((s) => ({
            label: s.name,
            value: s.id,
          })),
    [sports, sportsLoading],
  );

  if (isSubmitted) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 text-center py-8">
            <CheckCircle className="h-12 w-12 text-success" />
            <h2 className="text-xl font-heading font-bold">Venue Submitted!</h2>
            <p className="text-muted-foreground">
              Your venue submission is now pending admin review. Once approved,
              it will appear in the directory.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setIsSubmitted(false);
                form.reset();
              }}
            >
              Submit Another
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <StandardFormProvider form={form} onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Venue Details</CardTitle>
          <CardDescription>
            Tell us about the venue you want to add.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <StandardFormInput name="name" label="Venue Name" required />

          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_5rem_2rem] items-center gap-2">
              <Label>
                Sport<span className="ml-1 text-destructive">*</span>
              </Label>
              <Label>
                Courts<span className="ml-1 text-destructive">*</span>
              </Label>
              <span />
            </div>
            {fields.map((field, index) => {
              const availableOptions = sportOptions.filter(
                (opt) =>
                  opt.value === watchedCourts[index]?.sportId ||
                  !selectedSportIds.has(opt.value),
              );

              return (
                <div
                  key={field.id}
                  className="grid grid-cols-[1fr_5rem_2rem] items-center gap-2"
                >
                  <Controller
                    control={form.control}
                    name={`courts.${index}.sportId`}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={sportsLoading}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a sport" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    {...form.register(`courts.${index}.count`, {
                      valueAsNumber: true,
                    })}
                  />
                  {fields.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-8"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : (
                    <span />
                  )}
                </div>
              );
            })}
            {sportOptions.length > fields.length && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ sportId: "", count: 1 })}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add Sport
              </Button>
            )}
            {form.formState.errors.courts?.root && (
              <p className="text-sm text-destructive">
                {form.formState.errors.courts.root.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <StandardFormCombobox
              name="province"
              label="Province"
              required
              disabled={provincesCitiesQuery.isLoading}
              options={provinceOptions}
              placeholder="Select province"
              searchPlaceholder="Search province..."
              emptyMessage="No province found."
            />
            <StandardFormCombobox
              name="city"
              label="City"
              required
              disabled={!selectedProvince}
              options={cityOptions}
              placeholder={
                !selectedProvince ? "Select province first" : "Select city"
              }
              searchPlaceholder="Search city..."
              emptyMessage="No city found."
            />
          </div>

          <StandardFormInput name="address" label="Address (optional)" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Location (optional)</CardTitle>
          <CardDescription>
            Help us pinpoint the exact location.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={locationMode === "link" ? "default" : "outline"}
              size="sm"
              onClick={() => form.setValue("locationMode", "link")}
            >
              <MapPin className="mr-1 h-4 w-4" />
              Google Maps Link
            </Button>
            <Button
              type="button"
              variant={locationMode === "manual" ? "default" : "outline"}
              size="sm"
              onClick={() => form.setValue("locationMode", "manual")}
            >
              Manual Coordinates
            </Button>
          </div>

          {locationMode === "link" ? (
            <div className="space-y-2">
              <Label>Google Maps Share Link</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://maps.app.goo.gl/..."
                  {...form.register("googleMapsLink")}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleParseLink}
                  disabled={
                    googleLocPreview.isPending || !form.watch("googleMapsLink")
                  }
                >
                  {googleLocPreview.isPending ? <Spinner /> : "Parse"}
                </Button>
              </div>
              {form.watch("latitude") && form.watch("longitude") && (
                <p className="text-sm text-muted-foreground">
                  Coordinates: {form.watch("latitude")},{" "}
                  {form.watch("longitude")}
                </p>
              )}
              {hasEmbedKey &&
                form.watch("latitude") &&
                form.watch("longitude") && (
                  <div className="rounded-md overflow-hidden border">
                    <iframe
                      title="Map Preview"
                      width="100%"
                      height="200"
                      style={{ border: 0 }}
                      loading="lazy"
                      src={`https://www.google.com/maps/embed/v1/place?key=${env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY}&q=${form.watch("latitude")},${form.watch("longitude")}`}
                    />
                  </div>
                )}
              {form.formState.errors.googleMapsLink && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.googleMapsLink.message}
                </p>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <StandardFormInput
                name="latitude"
                label="Latitude"
                placeholder="e.g. 14.5995"
              />
              <StandardFormInput
                name="longitude"
                label="Longitude"
                placeholder="e.g. 120.9842"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Amenities (optional)</CardTitle>
          <CardDescription>
            Select the amenities available at this venue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PLACE_AMENITIES.map((amenity) => (
              // biome-ignore lint/a11y/noLabelWithoutControl: label wraps input
              <label
                key={amenity}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <Checkbox
                  checked={amenities.includes(amenity)}
                  onCheckedChange={() => toggleAmenity(amenity)}
                />
                {amenity}
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Info (optional)</CardTitle>
          <CardDescription>
            Help others reach out to this venue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <StandardFormInput name="facebookUrl" label="Facebook URL" />
            <StandardFormInput name="instagramUrl" label="Instagram URL" />
            <StandardFormInput name="phoneNumber" label="Phone Number" />
            <StandardFormInput name="websiteUrl" label="Website URL" />
          </div>
        </CardContent>
      </Card>

      <Button
        type="submit"
        className="w-full"
        disabled={submitMutation.isPending}
      >
        {submitMutation.isPending ? <Spinner /> : "Submit Venue"}
      </Button>
    </StandardFormProvider>
  );
}
