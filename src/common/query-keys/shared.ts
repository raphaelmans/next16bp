"use client";

type Primitive = string | number | boolean | null | undefined;

export type AddonSelectionInput = {
  addonId: string;
  quantity: number;
};

export const normalizeString = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

export const normalizePrimitiveArray = <T extends Primitive>(values?: T[]) =>
  [...(values ?? [])]
    .filter(
      (value): value is Exclude<T, undefined> => typeof value !== "undefined",
    )
    .sort((left, right) => String(left).localeCompare(String(right)));

export const normalizeAddonSelections = (
  selectedAddons?: AddonSelectionInput[],
) =>
  [...(selectedAddons ?? [])]
    .map((selection) => ({
      addonId: selection.addonId.trim(),
      quantity: selection.quantity,
    }))
    .filter(
      (selection) =>
        selection.addonId.length > 0 && Number.isFinite(selection.quantity),
    )
    .sort((left, right) =>
      left.addonId === right.addonId
        ? left.quantity - right.quantity
        : left.addonId.localeCompare(right.addonId),
    );

export const normalizeBoolean = (
  value: boolean | undefined,
  fallback: boolean,
) => (typeof value === "boolean" ? value : fallback);

export const serializeStableScope = (value: unknown) =>
  JSON.stringify(value, (_key, currentValue) => {
    if (Array.isArray(currentValue)) {
      return currentValue;
    }

    if (
      currentValue &&
      typeof currentValue === "object" &&
      Object.getPrototypeOf(currentValue) === Object.prototype
    ) {
      return Object.fromEntries(
        Object.entries(currentValue as Record<string, unknown>).sort(
          ([left], [right]) => left.localeCompare(right),
        ),
      );
    }

    return currentValue;
  });
