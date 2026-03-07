"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, MapPin } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
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
import {
  StandardFormInput,
  StandardFormProvider,
  StandardFormSelect,
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

const submitCourtFormSchema = z
  .object({
    name: S.place.name,
    sportId: S.ids.sportId,
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
      if (data.locationMode === "link") {
        return !!data.googleMapsLink;
      }
      return !!data.latitude && !!data.longitude;
    },
    {
      message:
        "Google Maps link is required for link mode, coordinates are required for manual mode",
      path: ["googleMapsLink"],
    },
  );

type SubmitCourtFormData = z.infer<typeof submitCourtFormSchema>;

export function SubmitCourtForm() {
  const submitMutation = useMutSubmitCourt();
  const { data: sports = [], isLoading: sportsLoading } =
    useQueryDiscoverySports();
  const provincesCitiesQuery = usePHProvincesCitiesQuery();
  const googleLocPreview = useGoogleLocPreviewMutation();
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const hasEmbedKey = Boolean(env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY);

  const form = useForm<SubmitCourtFormData>({
    resolver: zodResolver(submitCourtFormSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      sportId: "",
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

  const locationMode = form.watch("locationMode");
  const selectedProvince = form.watch("province");

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

  const handleSubmit = (data: SubmitCourtFormData) => {
    submitMutation.mutate(
      {
        name: data.name,
        sportId: data.sportId,
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
          toast.error(getClientErrorMessage(error));
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

  if (isSubmitted) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 text-center py-8">
            <CheckCircle className="h-12 w-12 text-success" />
            <h2 className="text-xl font-heading font-bold">Court Submitted!</h2>
            <p className="text-muted-foreground">
              Your court submission is now pending admin review. Once approved,
              it will appear in the courts directory.
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
          <CardTitle>Court Details</CardTitle>
          <CardDescription>
            Tell us about the court you want to add.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <StandardFormInput name="name" label="Court Name" required />

          <StandardFormSelect
            name="sportId"
            label="Sport"
            required
            options={
              sportsLoading
                ? []
                : (sports as { id: string; name: string }[]).map((s) => ({
                    label: s.name,
                    value: s.id,
                  }))
            }
            placeholder="Select a sport"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <StandardFormSelect
              name="province"
              label="Province"
              required
              disabled={provincesCitiesQuery.isLoading}
              options={provinceOptions}
              placeholder={
                provincesCitiesQuery.isLoading
                  ? "Loading..."
                  : "Select province"
              }
            />
            <StandardFormSelect
              name="city"
              label="City"
              required
              disabled={!selectedProvince}
              options={cityOptions}
              placeholder={
                !selectedProvince ? "Select province first" : "Select city"
              }
            />
          </div>

          <StandardFormInput name="address" label="Address (optional)" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Location</CardTitle>
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
                required
                placeholder="e.g. 14.5995"
              />
              <StandardFormInput
                name="longitude"
                label="Longitude"
                required
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
            Select the amenities available at this court.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PLACE_AMENITIES.map((amenity) => (
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
            Help others reach out to this court.
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
        {submitMutation.isPending ? <Spinner /> : "Submit Court"}
      </Button>
    </StandardFormProvider>
  );
}
