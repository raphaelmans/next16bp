export type SelectedAddonLike = {
  addonId: string;
};

export function getInvalidSelectedAddonIds(options: {
  selectedAddons?: SelectedAddonLike[];
  allowedAddonIds: Iterable<string>;
}): string[] {
  const { selectedAddons, allowedAddonIds } = options;
  if (!selectedAddons || selectedAddons.length === 0) {
    return [];
  }

  const allowed = new Set(allowedAddonIds);
  const invalid = new Set<string>();

  for (const addon of selectedAddons) {
    if (!allowed.has(addon.addonId)) {
      invalid.add(addon.addonId);
    }
  }

  return Array.from(invalid);
}
