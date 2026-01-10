import {
  type IObjectStorageService,
  ObjectStorageService,
} from "../services/object-storage.service";

let objectStorageService: IObjectStorageService | null = null;

/**
 * Creates or returns the singleton ObjectStorageService instance.
 * Uses service role key for server-side uploads.
 */
export function makeObjectStorageService(): IObjectStorageService {
  if (!objectStorageService) {
    objectStorageService = new ObjectStorageService();
  }
  return objectStorageService;
}
