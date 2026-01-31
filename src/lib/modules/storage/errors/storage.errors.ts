import { BusinessRuleError, InternalError } from "@/lib/shared/kernel/errors";

/**
 * Error thrown when file upload fails.
 */
export class StorageUploadError extends InternalError {
  readonly code = "STORAGE_UPLOAD_FAILED";
}

/**
 * Error thrown when file deletion fails.
 */
export class StorageDeleteError extends InternalError {
  readonly code = "STORAGE_DELETE_FAILED";

  constructor(path: string) {
    super("Failed to delete file", { path });
  }
}

/**
 * Error thrown when file type is not allowed.
 */
export class InvalidFileTypeError extends BusinessRuleError {
  readonly code = "INVALID_FILE_TYPE";

  constructor(fileType: string, allowedTypes: string[]) {
    super(
      `Invalid file type: ${fileType}. Allowed: ${allowedTypes.join(", ")}`,
      {
        fileType,
        allowedTypes,
      },
    );
  }
}

/**
 * Error thrown when file exceeds size limit.
 */
export class FileTooLargeError extends BusinessRuleError {
  readonly code = "FILE_TOO_LARGE";

  constructor(fileSize: number, maxSize: number) {
    super(`File too large: ${fileSize} bytes. Max: ${maxSize} bytes`, {
      fileSize,
      maxSize,
    });
  }
}

/**
 * Error thrown when signed URL generation fails.
 */
export class SignedUrlError extends InternalError {
  readonly code = "SIGNED_URL_FAILED";

  constructor(path: string) {
    super("Failed to generate signed URL", { path });
  }
}

/**
 * Error thrown when file download fails.
 */
export class StorageDownloadError extends InternalError {
  readonly code = "STORAGE_DOWNLOAD_FAILED";

  constructor(path: string, reason?: string) {
    super(`Failed to download file: ${reason ?? "unknown error"}`, { path });
  }
}
