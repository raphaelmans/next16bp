"use client";

import { Check, Plus, X } from "lucide-react";
import * as React from "react";
import type { FieldPath, FieldValues } from "react-hook-form";
import { useFormContext } from "react-hook-form";
import {
  getAmenityDisplayLabel,
  getAmenityKey,
  mergeAmenityOptions,
  normalizeAmenityValues,
  trimAmenityLabel,
} from "@/common/amenities";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { useStandardFormContext } from "../context";
import type { FormLayout, StandardAmenitiesProps } from "../types";

const layoutStyles: Record<FormLayout, string> = {
  vertical: "flex flex-col space-y-2",
  horizontal:
    "flex flex-row items-start gap-4 [&>label]:w-[200px] [&>label]:pt-2 [&>label]:text-right",
  inline: "",
};

export function StandardFormAmenities<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  description,
  disabled,
  required,
  className,
  layout: layoutOverride,
  suggestions,
  quickPicks,
  searchPlaceholder = "Search or create an amenity...",
  emptyMessage = "No matching amenities.",
  createPrefix = "Create",
}: StandardAmenitiesProps<TFieldValues, TName>) {
  const { control } = useFormContext<TFieldValues>();
  const { layout: providerLayout } = useStandardFormContext();
  const layout = layoutOverride ?? providerLayout;
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const selectedValues = normalizeAmenityValues(
          Array.isArray(field.value) ? (field.value as readonly string[]) : [],
        );
        const selectedKeys = new Set(
          selectedValues.map((amenity) => getAmenityKey(amenity)),
        );
        const quickPickLabels = quickPicks ?? [];
        const quickPickKeys = new Set(
          quickPickLabels.map((amenity) => getAmenityKey(amenity)),
        );
        const quickPickLookup = new Map(
          quickPickLabels.map((amenity) => [getAmenityKey(amenity), amenity]),
        );
        const availableSuggestions = mergeAmenityOptions(
          suggestions,
          selectedValues,
        );
        const trimmedQuery = trimAmenityLabel(query);
        const queryKey = getAmenityKey(trimmedQuery);
        const filteredSuggestions =
          trimmedQuery.length === 0
            ? availableSuggestions
            : availableSuggestions.filter((amenity) =>
                amenity.toLowerCase().includes(trimmedQuery.toLowerCase()),
              );
        const hasExactMatch =
          trimmedQuery.length > 0 &&
          availableSuggestions.some(
            (amenity) => getAmenityKey(amenity) === queryKey,
          );
        const canCreate = trimmedQuery.length > 0 && !hasExactMatch;
        const selectedQuickPicks = Array.from(quickPickKeys).filter((key) =>
          selectedKeys.has(key),
        );

        const updateValues = (nextValues: readonly string[]) => {
          field.onChange(normalizeAmenityValues(nextValues));
        };

        const focusInput = () => {
          requestAnimationFrame(() => {
            inputRef.current?.focus();
          });
        };

        const addAmenity = (amenity: string) => {
          updateValues([...selectedValues, amenity]);
          setQuery("");
          setOpen(true);
          focusInput();
        };

        const removeAmenity = (amenity: string) => {
          const targetKey = getAmenityKey(amenity);
          updateValues(
            selectedValues.filter(
              (selectedAmenity) => getAmenityKey(selectedAmenity) !== targetKey,
            ),
          );
          focusInput();
        };

        const handleQuickPickChange = (nextKeys: string[]) => {
          const currentByKey = new Map(
            selectedValues.map((amenity) => [getAmenityKey(amenity), amenity]),
          );
          const customValues = selectedValues.filter(
            (amenity) => !quickPickKeys.has(getAmenityKey(amenity)),
          );
          const nextQuickPickValues = nextKeys
            .map(
              (key) =>
                currentByKey.get(key) ??
                quickPickLookup.get(key) ??
                getAmenityDisplayLabel(key),
            )
            .filter(Boolean);

          updateValues([...customValues, ...nextQuickPickValues]);
        };

        return (
          <FormItem className={cn(layoutStyles[layout], className)}>
            {label && layout !== "inline" && (
              <FormLabel>
                {label}
                {required && <span className="ml-1 text-destructive">*</span>}
              </FormLabel>
            )}
            <div className="flex-1 space-y-3">
              <Popover open={open && !disabled} onOpenChange={setOpen}>
                <div className="space-y-3">
                  <PopoverAnchor asChild>
                    <div className="relative">
                      <Input
                        ref={inputRef}
                        value={query}
                        disabled={disabled}
                        placeholder={searchPlaceholder}
                        onFocus={() => setOpen(true)}
                        onChange={(event) => {
                          setQuery(event.target.value);
                          setOpen(true);
                        }}
                        onKeyDown={(event) => {
                          if (
                            event.key === "Backspace" &&
                            query.length === 0 &&
                            selectedValues.length > 0
                          ) {
                            event.preventDefault();
                            removeAmenity(
                              selectedValues[selectedValues.length - 1],
                            );
                            return;
                          }

                          if (event.key === "Escape") {
                            setOpen(false);
                            return;
                          }

                          if (event.key !== "Enter") {
                            return;
                          }

                          event.preventDefault();

                          if (canCreate) {
                            addAmenity(trimmedQuery);
                            return;
                          }

                          const firstSuggestion = filteredSuggestions[0];
                          if (firstSuggestion) {
                            addAmenity(firstSuggestion);
                          }
                        }}
                        className="pr-10"
                      />
                      {trimmedQuery.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setQuery("");
                            focusInput();
                          }}
                          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                          aria-label="Clear amenity search"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </PopoverAnchor>

                  {selectedValues.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedValues.map((amenity) => (
                        <Badge
                          key={getAmenityKey(amenity)}
                          variant="secondary"
                          className="gap-1 rounded-full px-3 py-1 text-xs font-medium"
                        >
                          {getAmenityDisplayLabel(amenity)}
                          <button
                            type="button"
                            onClick={() => removeAmenity(amenity)}
                            className="rounded-full p-0.5 transition hover:bg-foreground/10"
                            aria-label={`Remove ${getAmenityDisplayLabel(amenity)}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {quickPickLabels.length > 0 && (
                    <ToggleGroup
                      type="multiple"
                      value={selectedQuickPicks}
                      onValueChange={handleQuickPickChange}
                      variant="outline"
                      spacing={2}
                      className="flex w-full flex-wrap gap-2"
                      disabled={disabled}
                    >
                      {quickPickLabels.map((amenity) => (
                        <ToggleGroupItem
                          key={getAmenityKey(amenity)}
                          value={getAmenityKey(amenity)}
                          size="sm"
                          className="h-auto rounded-full border-border/70 px-3 py-2 text-xs font-medium data-[state=on]:border-primary/30 data-[state=on]:bg-primary/8 data-[state=on]:text-primary"
                        >
                          {amenity}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  )}
                </div>

                <PopoverContent
                  align="start"
                  className="w-[var(--radix-popover-trigger-width)] p-0"
                  onOpenAutoFocus={(event) => {
                    event.preventDefault();
                  }}
                >
                  <Command shouldFilter={false}>
                    <CommandList className="max-h-64">
                      {canCreate && (
                        <CommandGroup heading="Create">
                          <CommandItem
                            value={trimmedQuery}
                            onSelect={() => addAmenity(trimmedQuery)}
                          >
                            <Plus className="h-4 w-4" />
                            <span>{createPrefix}</span>
                            <span className="font-medium text-foreground">
                              &quot;{trimmedQuery}&quot;
                            </span>
                          </CommandItem>
                        </CommandGroup>
                      )}
                      {filteredSuggestions.length > 0 ? (
                        <CommandGroup heading="Suggestions">
                          {filteredSuggestions.map((amenity) => {
                            const amenityKey = getAmenityKey(amenity);
                            const isSelected = selectedKeys.has(amenityKey);

                            return (
                              <CommandItem
                                key={amenityKey}
                                value={amenity}
                                onSelect={() => addAmenity(amenity)}
                              >
                                <Check
                                  className={cn(
                                    "h-4 w-4",
                                    isSelected ? "opacity-100" : "opacity-0",
                                  )}
                                />
                                <span>{amenity}</span>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      ) : (
                        !canCreate && (
                          <CommandEmpty>{emptyMessage}</CommandEmpty>
                        )
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {description && <FormDescription>{description}</FormDescription>}
              <FormMessage />
            </div>
          </FormItem>
        );
      }}
    />
  );
}
