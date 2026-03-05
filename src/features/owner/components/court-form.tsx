"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { z } from "zod";
import { toast } from "@/common/toast";
import { getClientErrorMessage } from "@/common/toast/errors";
import {
  StandardFormCheckbox,
  StandardFormInput,
  StandardFormProvider,
  StandardFormSelect,
} from "@/components/form";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type CourtFormData,
  courtFormSchema,
  defaultCourtFormValues,
} from "../schemas";

type CourtFormValues = z.input<typeof courtFormSchema>;

interface CourtFormProps {
  defaultValues?: Partial<CourtFormData>;
  placeOptions: { id: string; name: string; city: string }[];
  sportOptions: { id: string; name: string }[];
  onSubmit: (data: CourtFormData) => Promise<void> | void;
  onSaveDraft?: (data: Partial<CourtFormData>) => void;
  onStateChange?: (data: Partial<CourtFormData>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  isEditing?: boolean;
  disablePlaceSelect?: boolean;
  allowPristineSubmit?: boolean;
  primaryActionLabel?: string;
  showCancel?: boolean;
}

const normalizeTierLabel = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
};

const buildFormDefaults = (
  defaultValues?: Partial<CourtFormValues>,
): CourtFormValues => ({
  placeId: defaultValues?.placeId ?? "",
  sportId: defaultValues?.sportId ?? "",
  label: defaultValues?.label ?? "",
  tierLabel: defaultValues?.tierLabel ?? "",
  isActive: defaultValues?.isActive ?? defaultCourtFormValues.isActive ?? true,
});

const normalizeFormValues = (values: CourtFormValues): CourtFormData => ({
  placeId: values.placeId,
  sportId: values.sportId,
  label: values.label.trim(),
  tierLabel: normalizeTierLabel(values.tierLabel),
  isActive: values.isActive ?? defaultCourtFormValues.isActive ?? true,
});

export function CourtForm({
  defaultValues,
  placeOptions,
  sportOptions,
  onSubmit,
  onSaveDraft,
  onStateChange,
  onCancel,
  isSubmitting,
  isEditing = false,
  disablePlaceSelect = false,
  allowPristineSubmit = false,
  primaryActionLabel,
  showCancel = true,
}: CourtFormProps) {
  const resolvedDefaults = useMemo(
    () => buildFormDefaults(defaultValues),
    [defaultValues],
  );

  const form = useForm<CourtFormValues>({
    resolver: zodResolver(courtFormSchema),
    mode: "onChange",
    defaultValues: resolvedDefaults,
  });

  const {
    control,
    reset,
    setValue,
    getValues,
    trigger,
    formState: { isDirty, isSubmitting: formSubmitting, isValid },
  } = form;

  const placeId = useWatch({ control, name: "placeId" });
  const sportId = useWatch({ control, name: "sportId" });
  const watchedValues = useWatch({ control });

  useEffect(() => {
    if (!defaultValues) return;
    if (isDirty) return;
    reset(resolvedDefaults);
    if (isEditing || allowPristineSubmit) {
      void trigger();
    }
  }, [
    allowPristineSubmit,
    defaultValues,
    isDirty,
    isEditing,
    reset,
    resolvedDefaults,
    trigger,
  ]);

  useEffect(() => {
    if (!placeId && placeOptions.length === 1) {
      setValue("placeId", placeOptions[0].id, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: true,
      });
    }
  }, [placeId, placeOptions, setValue]);

  useEffect(() => {
    if (!sportId && sportOptions.length === 1) {
      setValue("sportId", sportOptions[0].id, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: true,
      });
    }
  }, [setValue, sportId, sportOptions]);

  useEffect(() => {
    if (!onStateChange) return;

    const values = buildFormDefaults(watchedValues ?? {});

    onStateChange({
      ...values,
      label: values.label.trim(),
      tierLabel: normalizeTierLabel(values.tierLabel),
    });
  }, [onStateChange, watchedValues]);

  const placeHelper = useMemo(() => {
    if (placeOptions.length === 0) {
      return "Create a venue first to add courts.";
    }
    return "Select the venue where this court belongs.";
  }, [placeOptions.length]);

  const sportHelper = useMemo(() => {
    if (sportOptions.length === 0) {
      return "Add a sport before creating courts.";
    }
    return "Choose the sport for this court.";
  }, [sportOptions.length]);

  const placeSelectDisabled =
    isEditing || disablePlaceSelect || placeOptions.length === 0;
  const sportSelectDisabled = sportOptions.length === 0;
  const submitting = Boolean(isSubmitting || formSubmitting);

  const placeOptionItems = useMemo(
    () =>
      placeOptions.map((place) => ({
        label: `${place.name} · ${place.city}`,
        value: place.id,
      })),
    [placeOptions],
  );

  const sportOptionItems = useMemo(
    () =>
      sportOptions.map((sport) => ({
        label: sport.name,
        value: sport.id,
      })),
    [sportOptions],
  );

  const handleSubmit = async (values: CourtFormValues) => {
    const normalized = normalizeFormValues(values);

    try {
      await onSubmit(normalized);
      reset(buildFormDefaults(normalized));
    } catch (error) {
      toast.error(
        isEditing ? "Unable to save court" : "Unable to create court",
        {
          description: getClientErrorMessage(error, "Please try again"),
        },
      );
    }
  };

  const handleSaveDraft = () => {
    const values = normalizeFormValues(getValues());
    onSaveDraft?.(values);
  };

  const isSubmitDisabled =
    submitting || !isValid || (!allowPristineSubmit && !isDirty);

  return (
    <StandardFormProvider<CourtFormValues>
      form={form}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle>Court Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <StandardFormSelect<CourtFormValues>
            name="placeId"
            label="Venue"
            placeholder="Select a venue"
            options={placeOptionItems}
            description={placeHelper}
            disabled={placeSelectDisabled}
            required
          />

          <StandardFormSelect<CourtFormValues>
            name="sportId"
            label="Sport"
            placeholder="Select a sport"
            options={sportOptionItems}
            description={sportHelper}
            disabled={sportSelectDisabled}
            required
          />

          <StandardFormInput<CourtFormValues>
            name="label"
            label="Court Label"
            placeholder="e.g., Court A"
            required
          />

          <StandardFormInput<CourtFormValues>
            name="tierLabel"
            label="Tier Label"
            placeholder="e.g., Premium"
            description="Optional label to distinguish premium or standard courts."
          />

          {isEditing && (
            <StandardFormCheckbox<CourtFormValues>
              name="isActive"
              label="Court is active"
            />
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        {showCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : (
          <div />
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          {onSaveDraft && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleSaveDraft}
              disabled={submitting}
            >
              Save as Draft
            </Button>
          )}
          <Button type="submit" disabled={isSubmitDisabled}>
            {submitting && <Spinner />}
            {primaryActionLabel ??
              (isEditing ? "Save Changes" : "Create Court")}
          </Button>
        </div>
      </div>
    </StandardFormProvider>
  );
}
