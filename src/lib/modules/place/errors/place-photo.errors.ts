import { NotFoundError, ValidationError } from "@/lib/shared/kernel/errors";

export class MaxPlacePhotosExceededError extends ValidationError {
  readonly code = "MAX_PLACE_PHOTOS_EXCEEDED";

  constructor(maxPhotos: number) {
    super(`Maximum number of photos (${maxPhotos}) exceeded`, { maxPhotos });
  }
}

export class PlacePhotoNotFoundError extends NotFoundError {
  readonly code = "PLACE_PHOTO_NOT_FOUND";

  constructor(photoId: string) {
    super("Photo not found", { photoId });
  }
}

export class PlacePhotoOrderInvalidError extends ValidationError {
  readonly code = "PLACE_PHOTO_ORDER_INVALID";

  constructor() {
    super("Invalid photo order");
  }
}
