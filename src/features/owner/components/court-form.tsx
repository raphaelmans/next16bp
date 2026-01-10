"use client";

import {
  CreditCard,
  Image as ImageIcon,
  Info,
  MapPin,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  CITIES,
  type CourtFormData,
  STANDARD_AMENITIES,
} from "../schemas/court-form.schema";

interface CourtFormProps {
  defaultValues?: Partial<CourtFormData>;
  onSubmit: (data: CourtFormData) => void;
  onSaveDraft?: (data: Partial<CourtFormData>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  isEditing?: boolean;
}

export function CourtForm({
  defaultValues,
  onSubmit,
  onSaveDraft,
  onCancel,
  isSubmitting = false,
  isEditing = false,
}: CourtFormProps) {
  const [activeTab, setActiveTab] = useState("basic");

  // Form state
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [numberOfCourts, setNumberOfCourts] = useState(
    defaultValues?.numberOfCourts ?? 1,
  );
  const [operatingHoursStart, setOperatingHoursStart] = useState(
    defaultValues?.operatingHoursStart ?? "06:00",
  );
  const [operatingHoursEnd, setOperatingHoursEnd] = useState(
    defaultValues?.operatingHoursEnd ?? "22:00",
  );
  const [address, setAddress] = useState(defaultValues?.address ?? "");
  const [city, setCity] = useState(defaultValues?.city ?? "");
  const [latitude, setLatitude] = useState(defaultValues?.latitude);
  const [longitude, setLongitude] = useState(defaultValues?.longitude);
  const [amenities, setAmenities] = useState<string[]>(
    defaultValues?.amenities ?? [],
  );
  const [isFree, setIsFree] = useState(defaultValues?.isFree ?? false);
  const [defaultHourlyRate, setDefaultHourlyRate] = useState(
    defaultValues?.defaultHourlyRate,
  );
  const [currency, setCurrency] = useState(defaultValues?.currency ?? "PHP");
  const [paymentInstructions, setPaymentInstructions] = useState(
    defaultValues?.paymentInstructions ?? "",
  );
  const [gcashEnabled, setGcashEnabled] = useState(
    defaultValues?.gcashEnabled ?? false,
  );
  const [gcashNumber, setGcashNumber] = useState(
    defaultValues?.gcashNumber ?? "",
  );
  const [bankTransferEnabled, setBankTransferEnabled] = useState(
    defaultValues?.bankTransferEnabled ?? false,
  );
  const [bankName, setBankName] = useState(defaultValues?.bankName ?? "");
  const [bankAccountNumber, setBankAccountNumber] = useState(
    defaultValues?.bankAccountNumber ?? "",
  );
  const [bankAccountName, setBankAccountName] = useState(
    defaultValues?.bankAccountName ?? "",
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      numberOfCourts,
      operatingHoursStart,
      operatingHoursEnd,
      address,
      city,
      latitude,
      longitude,
      photos: [],
      amenities,
      customAmenities: [],
      isFree,
      defaultHourlyRate,
      currency,
      paymentInstructions,
      gcashEnabled,
      gcashNumber,
      bankTransferEnabled,
      bankName,
      bankAccountNumber,
      bankAccountName,
    });
  };

  const handleSaveDraft = () => {
    onSaveDraft?.({
      name,
      numberOfCourts,
      operatingHoursStart,
      operatingHoursEnd,
      address,
      city,
    });
  };

  const toggleAmenity = (amenity: string) => {
    setAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity],
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic" className="gap-2">
            <Info className="h-4 w-4 hidden sm:inline" />
            Basic
          </TabsTrigger>
          <TabsTrigger value="location" className="gap-2">
            <MapPin className="h-4 w-4 hidden sm:inline" />
            Location
          </TabsTrigger>
          <TabsTrigger value="photos" className="gap-2">
            <ImageIcon className="h-4 w-4 hidden sm:inline" />
            Photos
          </TabsTrigger>
          <TabsTrigger value="amenities" className="gap-2">
            <Sparkles className="h-4 w-4 hidden sm:inline" />
            Amenities
          </TabsTrigger>
          <TabsTrigger value="payment" className="gap-2">
            <CreditCard className="h-4 w-4 hidden sm:inline" />
            Payment
          </TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Court Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Court A - Main Building"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numberOfCourts">Number of Courts</Label>
                <Input
                  id="numberOfCourts"
                  type="number"
                  min={1}
                  max={20}
                  value={numberOfCourts}
                  onChange={(e) =>
                    setNumberOfCourts(parseInt(e.target.value, 10) || 1)
                  }
                />
                <p className="text-sm text-muted-foreground">
                  How many individual courts at this location?
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="operatingHoursStart">Opening Time</Label>
                  <Input
                    id="operatingHoursStart"
                    type="time"
                    value={operatingHoursStart}
                    onChange={(e) => setOperatingHoursStart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="operatingHoursEnd">Closing Time</Label>
                  <Input
                    id="operatingHoursEnd"
                    type="time"
                    value={operatingHoursEnd}
                    onChange={(e) => setOperatingHoursEnd(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Location Tab */}
        <TabsContent value="location" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Location Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  placeholder="e.g., 123 Sports Street, Barangay Example"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a city" />
                  </SelectTrigger>
                  <SelectContent>
                    {CITIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Map placeholder */}
              <div className="space-y-2">
                <Label>Pin Location on Map</Label>
                <div className="h-64 rounded-lg border bg-muted flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <MapPin className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Map integration coming soon</p>
                    <p className="text-xs">Click to set pin location</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      placeholder="e.g., 14.5995"
                      value={latitude ?? ""}
                      onChange={(e) =>
                        setLatitude(parseFloat(e.target.value) || undefined)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      placeholder="e.g., 120.9842"
                      value={longitude ?? ""}
                      onChange={(e) =>
                        setLongitude(parseFloat(e.target.value) || undefined)
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Photos Tab */}
        <TabsContent value="photos" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Court Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  <button
                    type="button"
                    className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    <ImageIcon className="h-8 w-8" />
                    <span className="text-xs">Add Photo</span>
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Upload up to 10 photos. First photo will be the cover image.
                  Drag to reorder.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Amenities Tab */}
        <TabsContent value="amenities" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Amenities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                {STANDARD_AMENITIES.map((amenity) => (
                  <div key={amenity} className="flex items-center space-x-2">
                    <Checkbox
                      id={amenity}
                      checked={amenities.includes(amenity)}
                      onCheckedChange={() => toggleAmenity(amenity)}
                    />
                    <Label htmlFor={amenity} className="text-sm font-normal">
                      {amenity}
                    </Label>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t">
                <Label>Custom Amenities</Label>
                <div className="flex gap-2 mt-2">
                  <Input placeholder="Add custom amenity" />
                  <Button type="button" variant="outline">
                    Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Tab */}
        <TabsContent value="payment" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Pricing Type</Label>
                <RadioGroup
                  value={isFree ? "free" : "paid"}
                  onValueChange={(v) => setIsFree(v === "free")}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="free" id="free" />
                    <Label htmlFor="free">Free Court</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="paid" id="paid" />
                    <Label htmlFor="paid">Paid Court</Label>
                  </div>
                </RadioGroup>
              </div>

              {!isFree && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PHP">PHP</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="defaultHourlyRate">
                        Default Hourly Rate
                      </Label>
                      <Input
                        id="defaultHourlyRate"
                        type="number"
                        min={0}
                        placeholder="e.g., 500"
                        value={defaultHourlyRate ?? ""}
                        onChange={(e) =>
                          setDefaultHourlyRate(
                            parseFloat(e.target.value) || undefined,
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentInstructions">
                      Payment Instructions
                    </Label>
                    <Textarea
                      id="paymentInstructions"
                      placeholder="Provide instructions for players on how to pay..."
                      rows={3}
                      value={paymentInstructions}
                      onChange={(e) => setPaymentInstructions(e.target.value)}
                    />
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Payment Methods</h4>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="gcash"
                          checked={gcashEnabled}
                          onCheckedChange={(c) => setGcashEnabled(c === true)}
                        />
                        <Label htmlFor="gcash" className="font-normal">
                          GCash
                        </Label>
                      </div>

                      {gcashEnabled && (
                        <div className="ml-6 space-y-2">
                          <Label htmlFor="gcashNumber">GCash Number</Label>
                          <Input
                            id="gcashNumber"
                            placeholder="e.g., 09171234567"
                            value={gcashNumber}
                            onChange={(e) => setGcashNumber(e.target.value)}
                          />
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="bankTransfer"
                          checked={bankTransferEnabled}
                          onCheckedChange={(c) =>
                            setBankTransferEnabled(c === true)
                          }
                        />
                        <Label htmlFor="bankTransfer" className="font-normal">
                          Bank Transfer
                        </Label>
                      </div>

                      {bankTransferEnabled && (
                        <div className="ml-6 space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="bankName">Bank Name</Label>
                            <Input
                              id="bankName"
                              placeholder="e.g., BDO"
                              value={bankName}
                              onChange={(e) => setBankName(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="bankAccountNumber">
                              Account Number
                            </Label>
                            <Input
                              id="bankAccountNumber"
                              placeholder="e.g., 1234567890"
                              value={bankAccountNumber}
                              onChange={(e) =>
                                setBankAccountNumber(e.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="bankAccountName">
                              Account Name
                            </Label>
                            <Input
                              id="bankAccountName"
                              placeholder="e.g., Juan Dela Cruz"
                              value={bankAccountName}
                              onChange={(e) =>
                                setBankAccountName(e.target.value)
                              }
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Form actions */}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        {onSaveDraft && (
          <Button
            type="button"
            variant="secondary"
            onClick={handleSaveDraft}
            disabled={isSubmitting}
          >
            Save as Draft
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? isEditing
              ? "Saving..."
              : "Publishing..."
            : isEditing
              ? "Save Changes"
              : "Publish Court"}
        </Button>
      </div>
    </form>
  );
}
