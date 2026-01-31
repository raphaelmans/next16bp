import { MAX_BOOKING_WINDOW_DAYS } from "@/common/booking-window";

export const validationDatabase = {
  common: {
    string: {
      required: { message: "This field is required" },
      type: { message: "This field must be a string" },
    },
    nonEmpty: {
      min: { value: 1, message: "This field is required" },
    },
    email: {
      required: { message: "Email is required" },
      type: { message: "Email must be a string" },
      min: { value: 1, message: "Email is required" },
      max: { value: 255, message: "Email must be 255 characters or less" },
      invalid: { message: "Please enter a valid email address" },
    },
    url: {
      invalid: { message: "Please enter a valid URL" },
    },
    slug: {
      min: { value: 1, message: "Slug is required" },
      max: { value: 100, message: "Slug must be 100 characters or less" },
      pattern: {
        value: /^[a-z0-9-]+$/,
        message: "Slug must be lowercase alphanumeric with hyphens",
      },
    },
    phone: {
      max: { value: 20, message: "Phone number must be 20 characters or less" },
      pattern: {
        value: /^[0-9+\-() ]*$/,
        message: "Invalid phone number format",
      },
    },
    country: {
      length: { value: 2, message: "Country must be a 2-letter code" },
    },
    currency: {
      length: { value: 3, message: "Currency must be a 3-letter code" },
    },
    coordinate: {
      invalid: { message: "Coordinate must be a valid decimal number" },
      latitude: { message: "Latitude must be a valid decimal number" },
      longitude: { message: "Longitude must be a valid decimal number" },
      latitudeRequired: { message: "Latitude is required" },
      longitudeRequired: { message: "Longitude is required" },
    },
    isoDateTime: {
      invalid: { message: "Invalid datetime" },
    },
    date: {
      invalid: { message: "Invalid date" },
    },
    pagination: {
      limit: {
        min: { value: 1, message: "Limit must be at least 1" },
        max: { value: 100, message: "Limit must be 100 or less" },
      },
      offset: {
        min: { value: 0, message: "Offset must be 0 or greater" },
      },
    },
    displayOrder: {
      min: { value: 0, message: "Display order must be 0 or greater" },
    },
    items: {
      min: { value: 1, message: "At least one item is required" },
    },
  },
  ids: {
    generic: {
      required: { message: "ID is required" },
      invalid: { message: "ID must be a valid UUID" },
    },
    organizationId: {
      required: { message: "Organization is required" },
      invalid: { message: "Organization must be a valid ID" },
    },
    placeId: {
      required: { message: "Venue is required" },
      invalid: { message: "Venue must be a valid ID" },
    },
    courtId: {
      required: { message: "Court is required" },
      invalid: { message: "Court must be a valid ID" },
    },
    reservationId: {
      required: { message: "Reservation is required" },
      invalid: { message: "Reservation must be a valid ID" },
    },
    sportId: {
      required: { message: "Sport is required" },
      invalid: { message: "Sport must be a valid ID" },
    },
    paymentMethodId: {
      required: { message: "Payment method is required" },
      invalid: { message: "Payment method must be a valid ID" },
    },
    requestId: {
      required: { message: "Request is required" },
      invalid: { message: "Request must be a valid ID" },
    },
    blockId: {
      required: { message: "Block is required" },
      invalid: { message: "Block must be a valid ID" },
    },
    jobId: {
      required: { message: "Import job is required" },
      invalid: { message: "Import job must be a valid ID" },
    },
    rowId: {
      required: { message: "Row is required" },
      invalid: { message: "Row must be a valid ID" },
    },
    photoId: {
      required: { message: "Photo is required" },
      invalid: { message: "Photo must be a valid ID" },
    },
    amenityId: {
      required: { message: "Amenity is required" },
      invalid: { message: "Amenity must be a valid ID" },
    },
  },
  auth: {
    password: {
      min: { value: 8, message: "Password must be at least 8 characters" },
      max: { value: 100, message: "Password must be 100 characters or less" },
      required: { message: "Password is required" },
      type: { message: "Password must be a string" },
    },
  },
  organization: {
    name: {
      min: { value: 1, message: "Organization name is required" },
      max: {
        value: 150,
        message: "Organization name must be 150 characters or less",
      },
    },
    slug: {
      min: { value: 1, message: "Slug is required" },
      max: { value: 100, message: "Slug must be 100 characters or less" },
    },
    description: {
      max: {
        value: 500,
        message: "Description must be 500 characters or less",
      },
    },
    contactEmail: {
      max: { value: 255, message: "Email must be 255 characters or less" },
    },
    contactPhone: {
      max: { value: 20, message: "Phone must be 20 characters or less" },
    },
    address: {
      max: { value: 200, message: "Address must be 200 characters or less" },
    },
    search: {
      limit: {
        min: { value: 1, message: "Limit must be at least 1" },
        max: { value: 50, message: "Limit must be 50 or less" },
      },
      offset: {
        min: { value: 0, message: "Offset must be 0 or greater" },
      },
    },
  },
  place: {
    search: {
      min: { value: 1, message: "Search term must be at least 1 character" },
      max: {
        value: 100,
        message: "Search term must be 100 characters or less",
      },
    },
    idOrSlug: {
      min: { value: 1, message: "Place ID or slug is required" },
      max: {
        value: 200,
        message: "Place ID or slug must be 200 characters or less",
      },
    },
    name: {
      min: { value: 1, message: "Venue name is required" },
      max: { value: 200, message: "Venue name must be 200 characters or less" },
    },
    address: {
      min: { value: 1, message: "Address is required" },
      max: { value: 200, message: "Address must be 200 characters or less" },
    },
    city: {
      min: { value: 1, message: "City is required" },
      max: { value: 100, message: "City must be 100 characters or less" },
    },
    province: {
      min: { value: 1, message: "Province is required" },
      max: { value: 100, message: "Province must be 100 characters or less" },
    },
    timeZone: {
      min: { value: 1, message: "Time zone is required" },
      max: { value: 64, message: "Time zone must be 64 characters or less" },
    },
    phoneNumber: {
      max: { value: 20, message: "Phone number must be 20 characters or less" },
    },
    viberInfo: {
      max: { value: 100, message: "Viber info must be 100 characters or less" },
    },
    otherContactInfo: {
      max: {
        value: 500,
        message: "Contact info must be 500 characters or less",
      },
    },
    googlePlaceId: {
      max: {
        value: 128,
        message: "Google place ID must be 128 characters or less",
      },
    },
    amenity: {
      min: { value: 1, message: "Amenity name is required" },
      max: {
        value: 100,
        message: "Amenity name must be 100 characters or less",
      },
    },
    type: {
      invalid: { message: "Place type is invalid" },
    },
    photos: {
      min: { value: 1, message: "At least one photo is required" },
      max: { value: 10, message: "You can upload up to 10 photos" },
    },
  },
  court: {
    label: {
      min: { value: 1, message: "Court label is required" },
      max: {
        value: 100,
        message: "Court label must be 100 characters or less",
      },
    },
    tierLabel: {
      max: { value: 20, message: "Tier label must be 20 characters or less" },
    },
    name: {
      min: { value: 1, message: "Court name is required" },
      max: { value: 200, message: "Court name must be 200 characters or less" },
    },
    simpleName: {
      min: { value: 1, message: "Court name is required" },
      max: { value: 150, message: "Court name must be 150 characters or less" },
    },
    description: {
      max: {
        value: 1000,
        message: "Description must be 1000 characters or less",
      },
    },
    type: {
      invalid: { message: "Court type is invalid" },
    },
    list: {
      min: { value: 1, message: "At least one court is required" },
    },
  },
  contact: {
    name: {
      min: { value: 2, message: "Name must be at least 2 characters" },
      max: { value: 150, message: "Name must be 150 characters or less" },
    },
    subject: {
      min: { value: 2, message: "Subject must be at least 2 characters" },
      max: { value: 200, message: "Subject must be 200 characters or less" },
    },
    message: {
      min: { value: 10, message: "Message must be at least 10 characters" },
      max: { value: 2000, message: "Message must be 2000 characters or less" },
    },
  },
  profile: {
    displayName: {
      min: { value: 1, message: "Display name is required" },
      max: {
        value: 100,
        message: "Display name must be 100 characters or less",
      },
    },
  },
  paymentMethod: {
    accountName: {
      min: { value: 1, message: "Account name is required" },
      max: {
        value: 150,
        message: "Account name must be 150 characters or less",
      },
    },
    accountNumber: {
      min: { value: 1, message: "Account number is required" },
      max: {
        value: 50,
        message: "Account number must be 50 characters or less",
      },
    },
    instructions: {
      max: {
        value: 500,
        message: "Instructions must be 500 characters or less",
      },
    },
    displayOrder: {
      min: { value: 0, message: "Display order must be 0 or greater" },
    },
    type: {
      invalid: { message: "Payment method type is invalid" },
    },
    provider: {
      invalid: { message: "Payment method provider is invalid" },
    },
  },
  paymentProof: {
    referenceNumber: {
      max: {
        value: 100,
        message: "Reference number must be 100 characters or less",
      },
    },
    notes: {
      max: { value: 500, message: "Notes must be 500 characters or less" },
    },
  },
  claimRequest: {
    requestNotes: {
      min: { value: 10, message: "Please share more details" },
      max: { value: 1000, message: "Notes must be 1000 characters or less" },
    },
    guestName: {
      min: { value: 2, message: "Name must be at least 2 characters" },
      max: { value: 150, message: "Name must be 150 characters or less" },
    },
    reviewNotes: {
      min: { value: 1, message: "Review notes are required" },
      max: {
        value: 1000,
        message: "Review notes must be 1000 characters or less",
      },
    },
    reason: {
      min: { value: 1, message: "Reason is required" },
      max: { value: 500, message: "Reason must be 500 characters or less" },
    },
    removalReason: {
      min: {
        value: 10,
        message:
          "Please provide a more detailed reason (at least 10 characters)",
      },
      max: { value: 500, message: "Reason must be 500 characters or less" },
    },
    acknowledgeReservations: {
      message:
        "You must acknowledge that pending reservations will be cancelled",
    },
    acknowledgeApproval: {
      message: "You must acknowledge that this requires admin approval",
    },
  },
  placeVerification: {
    documents: {
      min: { value: 1, message: "Please attach at least one document" },
    },
  },
  reservation: {
    notes: {
      max: { value: 500, message: "Notes must be 500 characters or less" },
    },
    cancelReason: {
      max: { value: 500, message: "Reason must be 500 characters or less" },
    },
    rejectReason: {
      min: { value: 1, message: "Reason is required" },
      max: { value: 500, message: "Reason must be 500 characters or less" },
    },
    termsAccepted: {
      message: "Terms must be accepted",
    },
    disclaimerAcknowledged: {
      message: "You must acknowledge the payment disclaimer",
    },
    referenceNumber: {
      min: { value: 1, message: "Reference number is required" },
    },
    startTimeWithinWindow: {
      value: MAX_BOOKING_WINDOW_DAYS,
      message: `Start time must be within ${MAX_BOOKING_WINDOW_DAYS} days`,
    },
    status: {
      invalid: { message: "Status is invalid" },
    },
  },
  availability: {
    dateWithinWindow: {
      value: MAX_BOOKING_WINDOW_DAYS,
      message: `Date must be within ${MAX_BOOKING_WINDOW_DAYS} days`,
    },
    rangeWithinWindow: {
      value: MAX_BOOKING_WINDOW_DAYS,
      message: `Date range must be within ${MAX_BOOKING_WINDOW_DAYS} days`,
    },
    rangeEndAfterStart: {
      message: "End date must be after start date",
    },
    durationMinutes: {
      min: { value: 60, message: "Duration must be at least 60 minutes" },
      max: { value: 1440, message: "Duration must be 1440 minutes or less" },
      multipleOf: {
        value: 60,
        message: "Duration must be a multiple of 60 minutes",
      },
    },
    courtIds: {
      min: { value: 1, message: "At least one court is required" },
      max: { value: 50, message: "Too many courts requested" },
    },
  },
  courtBlock: {
    reason: {
      max: { value: 255, message: "Reason must be 255 characters or less" },
    },
  },
  bookingsImport: {
    sourceType: {
      invalid: { message: "Import source must be valid" },
    },
    normalizeMode: {
      invalid: { message: "Normalize mode must be valid" },
    },
    confirmAiOnce: {
      message:
        "confirmAiOnce must be true when using AI mode (one-time per venue)",
    },
    courtLabel: {
      max: {
        value: 100,
        message: "Court label must be 100 characters or less",
      },
    },
    reason: {
      max: { value: 500, message: "Reason must be 500 characters or less" },
    },
  },
  admin: {
    searchQuery: {
      max: { value: 150, message: "Query must be 150 characters or less" },
    },
    placeType: {
      invalid: { message: "Place type is invalid" },
    },
    claimStatus: {
      invalid: { message: "Claim status is invalid" },
    },
  },
  tracking: {
    event: {
      min: { value: 1, message: "Event is required" },
      max: { value: 120, message: "Event must be 120 characters or less" },
      pattern: {
        value: /^funnel\.[a-z0-9_.-]+$/,
        message: "Event must match funnel.<name>",
      },
    },
  },
  courtRateRule: {
    dayOfWeek: {
      min: { value: 0, message: "Day of week must be 0-6" },
      max: { value: 6, message: "Day of week must be 0-6" },
    },
    startMinute: {
      min: { value: 0, message: "Start minute must be 0-1439" },
      max: { value: 1439, message: "Start minute must be 0-1439" },
    },
    endMinute: {
      min: { value: 1, message: "End minute must be 1-1440" },
      max: { value: 1440, message: "End minute must be 1-1440" },
    },
    hourlyRateCents: {
      min: { value: 0, message: "Hourly rate must be 0 or greater" },
    },
    rules: {
      max: { value: 100, message: "Rules must be 100 items or less" },
    },
    startBeforeEnd: { message: "Start minute must be before end minute" },
  },
  pricing: {
    priceCents: {
      min: { value: 0, message: "Price must be 0 or greater" },
    },
  },
  courtHours: {
    windows: {
      max: { value: 50, message: "Windows must be 50 items or less" },
    },
  },
} as const;
