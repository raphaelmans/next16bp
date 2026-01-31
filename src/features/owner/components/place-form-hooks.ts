"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { useGoogleLocPreviewMutation } from "@/common/clients/google-loc-client";
import { usePHProvincesCitiesQuery } from "@/common/clients/ph-provinces-cities-client";
import { getClientErrorMessage } from "@/common/hooks/toast-errors";
import {
  buildCityOptions,
  buildProvinceOptions,
  findCityByName,
  findProvinceByName,
  resolveProvinceCityValues,
} from "@/common/ph-location-data";
import { env } from "@/lib/env";
import { PLACE_TIME_ZONES, placeFormSchema } from "../schemas";
import {
  buildFormDefaults,
  DEFAULT_COUNTRY,
  normalizeFormValues,
  type PlaceFormValues,
} from "./place-form-helpers";

type UsePlaceFormStateOptions = {
  defaultValues?: Partial<PlaceFormValues>;
  onSubmit: (
    data: ReturnType<typeof normalizeFormValues>,
  ) => Promise<void> | void;
  isSubmitting?: boolean;
  isEditing?: boolean;
};

export const usePlaceFormState = ({
  defaultValues,
  onSubmit,
  isSubmitting,
  isEditing,
}: UsePlaceFormStateOptions) => {
  const hasEmbedKey = Boolean(env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY);

  const provincesCitiesQuery = usePHProvincesCitiesQuery();
  const provincesCities = provincesCitiesQuery.data ?? null;

  const [googleUrl, setGoogleUrl] = useState("");

  const emptyDefaults = useMemo(() => buildFormDefaults(), []);

  const resolvedDefaults = useMemo<PlaceFormValues | null>(() => {
    if (!defaultValues || !provincesCities) {
      return null;
    }

    const baseDefaults = buildFormDefaults(defaultValues);
    const { province, city } = resolveProvinceCityValues(
      provincesCities,
      baseDefaults.province,
      baseDefaults.city,
    );

    return {
      ...baseDefaults,
      province,
      city,
    };
  }, [defaultValues, provincesCities]);

  const form = useForm<PlaceFormValues>({
    resolver: zodResolver(placeFormSchema),
    mode: "onChange",
    defaultValues: emptyDefaults,
  });

  const {
    control,
    reset,
    setValue,
    formState: { isDirty, isSubmitting: formSubmitting },
  } = form;

  const shouldHydrateDefaults = Boolean(defaultValues);
  const [isFormReady, setIsFormReady] = useState(!shouldHydrateDefaults);

  const countryValue = useWatch({ control, name: "country" });
  const provinceValue = useWatch({ control, name: "province" });
  const cityValue = useWatch({ control, name: "city" });
  const nameValue = useWatch({ control, name: "name" });

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
        setValue("latitude", data.lat, {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        });
      }

      if (data.lng !== undefined) {
        setValue("longitude", data.lng, {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        });
      }
    },
  });

  const previewResult = previewMutation.data;
  const previewError = previewMutation.error;
  const previewErrorMessage = previewError
    ? getClientErrorMessage(previewError, "Request failed")
    : null;
  const isPreviewing = previewMutation.isPending;

  useEffect(() => {
    if (!shouldHydrateDefaults) {
      setIsFormReady(true);
      return;
    }
    if (!resolvedDefaults) return;
    reset(resolvedDefaults);
    setIsFormReady(true);
  }, [reset, resolvedDefaults, shouldHydrateDefaults]);

  useEffect(() => {
    if (countryValue !== DEFAULT_COUNTRY) {
      setValue("country", DEFAULT_COUNTRY, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: true,
      });
    }
  }, [countryValue, setValue]);

  const provinceOptions = useMemo(() => {
    if (!provincesCities) return [];
    return buildProvinceOptions(provincesCities, "name");
  }, [provincesCities]);

  const selectedProvince = useMemo(
    () =>
      provincesCities
        ? findProvinceByName(provincesCities, provinceValue)
        : null,
    [provinceValue, provincesCities],
  );

  const cityOptions = useMemo(() => {
    if (!provincesCities || !selectedProvince) return [];
    return buildCityOptions(selectedProvince, "name");
  }, [provincesCities, selectedProvince]);

  const countryOptions = useMemo(
    () => [{ label: "Philippines (PH)", value: DEFAULT_COUNTRY }],
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

  useEffect(() => {
    if (!provincesCities) return;

    if (provinceValue && !selectedProvince) {
      setValue("province", "", {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      setValue("city", "", {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      return;
    }

    if (!provinceValue) {
      if (cityValue) {
        setValue("city", "", {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        });
      }
      return;
    }

    const selectedCity = findCityByName(selectedProvince, cityValue);
    if (cityValue && !selectedCity) {
      setValue("city", "", {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    }
  }, [cityValue, provinceValue, provincesCities, selectedProvince, setValue]);

  const coordinateLabel = useMemo(() => {
    if (previewResult?.lat === undefined || previewResult?.lng === undefined) {
      return "";
    }
    return `${previewResult.lat.toFixed(6)}, ${previewResult.lng.toFixed(6)}`;
  }, [previewResult?.lat, previewResult?.lng]);

  const timeZoneOptions = useMemo(
    () => PLACE_TIME_ZONES.map((zone) => ({ label: zone, value: zone })),
    [],
  );

  const handleSubmit = async (values: PlaceFormValues) => {
    const normalized = normalizeFormValues(values);

    try {
      await onSubmit(normalized);
      reset(buildFormDefaults(normalized));
    } catch (error) {
      toast.error(
        isEditing ? "Unable to save venue" : "Unable to create venue",
        {
          description: getClientErrorMessage(error, "Please try again"),
        },
      );
    }
  };

  const handlePreview = () => {
    if (!googleUrl.trim()) return;
    previewMutation.reset();
    previewMutation.mutate({ url: googleUrl });
  };

  const submitting = Boolean(isSubmitting || formSubmitting);
  const isSubmitDisabled = submitting || !isDirty;

  return {
    form,
    isFormReady,
    hasEmbedKey,
    googleUrl,
    setGoogleUrl,
    previewResult,
    previewErrorMessage,
    isPreviewing,
    handlePreview,
    provinceOptions,
    cityOptions,
    countryOptions,
    timeZoneOptions,
    provincePlaceholder,
    cityPlaceholder,
    isProvinceDisabled,
    isCityDisabled,
    coordinateLabel,
    handleSubmit,
    submitting,
    isSubmitDisabled,
  };
};
