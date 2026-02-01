import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import {
  ALLOWED_IMAGE_TYPES,
  isPublicStorageBucket,
  MAX_FILE_SIZE,
  type StorageBucket,
  type UploadOptions,
  type UploadResult,
} from "../dtos";
import {
  FileTooLargeError,
  InvalidFileTypeError,
  SignedUrlError,
  StorageDeleteError,
  StorageDownloadError,
  StorageUploadError,
} from "../errors/storage.errors";

/**
 * Interface for object storage operations.
 */
export interface IObjectStorageService {
  /**
   * Upload a file to storage.
   */
  upload(options: UploadOptions): Promise<UploadResult>;

  /**
   * Download a file from storage.
   */
  download(bucket: StorageBucket, path: string): Promise<Buffer>;

  /**
   * Delete a file from storage.
   */
  delete(bucket: StorageBucket, path: string): Promise<void>;

  /**
   * Get the public URL for a file.
   * Note: Only works for public buckets.
   */
  getPublicUrl(bucket: StorageBucket, path: string): string;

  /**
   * Create a signed URL for temporary access.
   * Use for private buckets.
   */
  createSignedUrl(
    bucket: StorageBucket,
    path: string,
    expiresIn: number,
  ): Promise<string>;
}

/**
 * Supabase Storage implementation of object storage.
 * Uses service role key to bypass RLS for server-side uploads.
 */
export class ObjectStorageService implements IObjectStorageService {
  private readonly client: SupabaseClient;

  constructor() {
    // Use service role key for server-side uploads (bypasses RLS)
    this.client = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY);
  }

  async upload(options: UploadOptions): Promise<UploadResult> {
    const { bucket, path, file, contentType, upsert = false } = options;

    const maxSize = options.maxSize ?? MAX_FILE_SIZE;
    const allowedTypes = options.allowedTypes ?? ALLOWED_IMAGE_TYPES;

    // Validate file size
    if (file.size > maxSize) {
      throw new FileTooLargeError(file.size, maxSize);
    }

    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      throw new InvalidFileTypeError(file.type, [...allowedTypes]);
    }

    // Convert File to ArrayBuffer for server-side upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await this.client.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType: contentType ?? file.type,
        upsert,
      });

    if (error) {
      throw new StorageUploadError(error.message, { bucket, path });
    }

    const url = isPublicStorageBucket(bucket)
      ? this.getPublicUrl(bucket, data.path)
      : null;

    return { url, path: data.path };
  }

  async download(bucket: StorageBucket, path: string): Promise<Buffer> {
    const { data, error } = await this.client.storage
      .from(bucket)
      .download(path);

    if (error) {
      throw new StorageDownloadError(path, error.message);
    }

    if (!data) {
      throw new StorageDownloadError(path, "No data returned");
    }

    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async delete(bucket: StorageBucket, path: string): Promise<void> {
    const { error } = await this.client.storage.from(bucket).remove([path]);

    if (error) {
      throw new StorageDeleteError(path);
    }
  }

  getPublicUrl(bucket: StorageBucket, path: string): string {
    const { data } = this.client.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async createSignedUrl(
    bucket: StorageBucket,
    path: string,
    expiresIn: number,
  ): Promise<string> {
    const { data, error } = await this.client.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      throw new SignedUrlError(path);
    }

    return data.signedUrl;
  }
}
