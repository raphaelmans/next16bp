import path from "node:path";
import { addDays } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import type { ICourtRepository } from "@/modules/court/repositories/court.repository";
import type { ICourtBlockRepository } from "@/modules/court-block/repositories/court-block.repository";
import type { IOrganizationRepository } from "@/modules/organization/repositories/organization.repository";
import type { IPlaceRepository } from "@/modules/place/repositories/place.repository";
import type { IReservationRepository } from "@/modules/reservation/repositories/reservation.repository";
import { MAX_IMPORT_FILE_SIZE, STORAGE_BUCKETS } from "@/modules/storage/dtos";
import type { IObjectStorageService } from "@/modules/storage/services/object-storage.service";
import type {
  BookingsImportJobRecord,
  BookingsImportRowRecord,
  InsertBookingsImportRow,
} from "@/shared/infra/db/schema";
import { logger } from "@/shared/infra/logger";
import type { RequestContext } from "@/shared/kernel/context";
import type { TransactionManager } from "@/shared/kernel/transaction";
import type {
  CommitResult,
  CreateBookingsImportDTO,
  GetAiUsageDTO,
  ImportSource,
  NormalizeMode,
  NormalizeResult,
} from "../dtos";
import {
  BookingsImportAiAlreadyUsedError,
  BookingsImportHasBlockingErrorsError,
  BookingsImportInvalidFileTypeError,
  BookingsImportInvalidSourceError,
  BookingsImportInvalidStatusError,
  BookingsImportJobNotFoundError,
  BookingsImportNotOwnerError,
  BookingsImportPlaceNotFoundError,
  BookingsImportRowNotFoundError,
} from "../errors/bookings-import.errors";
import {
  buildTabularDataset,
  detectDuplicates,
  parseCsv,
  parseIcs,
  validateRow,
} from "../lib";
import { parseXlsx } from "../lib/xlsx-parser";
import type {
  BookingsImportJobStatus,
  IBookingsImportJobRepository,
} from "../repositories/bookings-import-job.repository";
import type {
  BookingsImportRowStatus,
  IBookingsImportRowRepository,
} from "../repositories/bookings-import-row.repository";

type SourceConfig = {
  mimeTypes: string[];
  extensions: string[];
  contentTypeFallback: string;
};

const SOURCE_CONFIG: Record<ImportSource, SourceConfig> = {
  ics: {
    mimeTypes: ["text/calendar"],
    extensions: [".ics"],
    contentTypeFallback: "text/calendar",
  },
  csv: {
    mimeTypes: ["text/csv", "application/csv", "application/vnd.ms-excel"],
    extensions: [".csv"],
    contentTypeFallback: "text/csv",
  },
  xlsx: {
    mimeTypes: [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
    extensions: [".xlsx"],
    contentTypeFallback:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  },
  image: {
    mimeTypes: ["image/jpeg", "image/png"],
    extensions: [".jpg", ".jpeg", ".png"],
    contentTypeFallback: "image/jpeg",
  },
};

export interface BookingsImportAiUsage {
  usedAt: string | null;
}

export interface UpdateRowInput {
  courtId?: string | null;
  courtLabel?: string | null;
  startTime?: Date | null;
  endTime?: Date | null;
  reason?: string | null;
}

export interface IBookingsImportService {
  createDraft(
    userId: string,
    data: CreateBookingsImportDTO,
    ctx?: RequestContext,
  ): Promise<BookingsImportJobRecord>;
  getJob(
    userId: string,
    jobId: string,
    ctx?: RequestContext,
  ): Promise<BookingsImportJobRecord>;
  listJobs(
    userId: string,
    placeId: string,
    ctx?: RequestContext,
  ): Promise<BookingsImportJobRecord[]>;
  listRows(
    userId: string,
    jobId: string,
    ctx?: RequestContext,
  ): Promise<BookingsImportRowRecord[]>;
  updateRow(
    userId: string,
    rowId: string,
    data: UpdateRowInput,
    ctx?: RequestContext,
  ): Promise<BookingsImportRowRecord>;
  deleteRow(userId: string, rowId: string, ctx?: RequestContext): Promise<void>;
  discardJob(
    userId: string,
    jobId: string,
    ctx?: RequestContext,
  ): Promise<void>;
  getAiUsage(
    userId: string,
    data: GetAiUsageDTO,
    ctx?: RequestContext,
  ): Promise<BookingsImportAiUsage>;
  normalize(
    userId: string,
    jobId: string,
    mode: NormalizeMode,
    confirmAiOnce?: boolean,
    ctx?: RequestContext,
  ): Promise<NormalizeResult>;
  commit(
    userId: string,
    jobId: string,
    ctx?: RequestContext,
  ): Promise<CommitResult>;
}

export class BookingsImportService implements IBookingsImportService {
  constructor(
    private placeRepository: IPlaceRepository,
    private organizationRepository: IOrganizationRepository,
    private storageService: IObjectStorageService,
    private jobRepository: IBookingsImportJobRepository,
    private rowRepository: IBookingsImportRowRepository,
    private courtRepository: ICourtRepository,
    private courtBlockRepository: ICourtBlockRepository,
    private reservationRepository: IReservationRepository,
    _transactionManager: TransactionManager,
  ) {}

  private async verifyOwnership(
    userId: string,
    placeId: string,
    ctx?: RequestContext,
  ): Promise<{
    place: NonNullable<Awaited<ReturnType<IPlaceRepository["findById"]>>>;
    organizationId: string;
  }> {
    const place = await this.placeRepository.findById(placeId, ctx);
    if (!place) {
      throw new BookingsImportPlaceNotFoundError(placeId);
    }

    if (!place.organizationId) {
      throw new BookingsImportNotOwnerError();
    }

    const organization = await this.organizationRepository.findById(
      place.organizationId,
      ctx,
    );
    if (!organization || organization.ownerUserId !== userId) {
      throw new BookingsImportNotOwnerError();
    }

    return { place, organizationId: place.organizationId };
  }

  private async verifyJobOwnership(
    userId: string,
    jobId: string,
    ctx?: RequestContext,
  ): Promise<BookingsImportJobRecord> {
    const job = await this.jobRepository.findById(jobId, ctx);
    if (!job) {
      throw new BookingsImportJobNotFoundError(jobId);
    }

    if (job.userId !== userId) {
      throw new BookingsImportNotOwnerError();
    }

    return job;
  }

  private async verifyRowOwnership(
    userId: string,
    rowId: string,
    ctx?: RequestContext,
  ): Promise<{ row: BookingsImportRowRecord; job: BookingsImportJobRecord }> {
    const row = await this.rowRepository.findById(rowId, ctx);
    if (!row) {
      throw new BookingsImportRowNotFoundError(rowId);
    }

    const job = await this.verifyJobOwnership(userId, row.jobId, ctx);

    return { row, job };
  }

  async createDraft(
    userId: string,
    data: CreateBookingsImportDTO,
    ctx?: RequestContext,
  ): Promise<BookingsImportJobRecord> {
    const config = SOURCE_CONFIG[data.sourceType];
    if (!config) {
      throw new BookingsImportInvalidSourceError(data.sourceType);
    }

    const { organizationId } = await this.verifyOwnership(
      userId,
      data.placeId,
      ctx,
    );

    const fileName = data.file.name || "import";
    const extension = path.extname(fileName).toLowerCase();
    const hasExtension = extension.length > 0;

    const hasAllowedMime =
      data.file.type && config.mimeTypes.includes(data.file.type);
    const hasAllowedExtension = hasExtension
      ? config.extensions.includes(extension)
      : false;

    if (!hasAllowedMime && !hasAllowedExtension) {
      throw new BookingsImportInvalidFileTypeError(
        data.file.type,
        config.mimeTypes,
      );
    }

    const jobId = uuidv4();
    const resolvedExtension = hasExtension ? extension : config.extensions[0];
    const pathName = `imports/${data.placeId}/${jobId}${resolvedExtension}`;
    const contentType = data.file.type || config.contentTypeFallback;
    const allowedTypes = data.file.type
      ? config.mimeTypes
      : [...config.mimeTypes, ""];

    const result = await this.storageService.upload({
      bucket: STORAGE_BUCKETS.ORGANIZATION_ASSETS,
      path: pathName,
      file: data.file,
      contentType,
      upsert: false,
      allowedTypes,
      maxSize: MAX_IMPORT_FILE_SIZE,
    });

    // Persist the job to the database
    const job = await this.jobRepository.create(
      {
        id: jobId,
        placeId: data.placeId,
        organizationId,
        userId,
        sourceType: data.sourceType,
        status: "DRAFT",
        fileName: data.file.name,
        fileSize: data.file.size,
        filePath: result.path,
      },
      ctx,
    );

    logger.info(
      {
        event: "bookings_import.draft_created",
        placeId: data.placeId,
        organizationId,
        jobId: job.id,
        sourceType: data.sourceType,
        userId,
      },
      "Bookings import draft created",
    );

    return job;
  }

  async getJob(
    userId: string,
    jobId: string,
    ctx?: RequestContext,
  ): Promise<BookingsImportJobRecord> {
    return this.verifyJobOwnership(userId, jobId, ctx);
  }

  async listJobs(
    userId: string,
    placeId: string,
    ctx?: RequestContext,
  ): Promise<BookingsImportJobRecord[]> {
    await this.verifyOwnership(userId, placeId, ctx);
    return this.jobRepository.findByPlaceId(placeId, ctx);
  }

  async listRows(
    userId: string,
    jobId: string,
    ctx?: RequestContext,
  ): Promise<BookingsImportRowRecord[]> {
    await this.verifyJobOwnership(userId, jobId, ctx);
    return this.rowRepository.findByJobId(jobId, ctx);
  }

  async updateRow(
    userId: string,
    rowId: string,
    data: UpdateRowInput,
    ctx?: RequestContext,
  ): Promise<BookingsImportRowRecord> {
    const { row, job } = await this.verifyRowOwnership(userId, rowId, ctx);

    // Only allow updates when job is in NORMALIZED status
    const editableStatuses: BookingsImportJobStatus[] = ["NORMALIZED"];
    if (!editableStatuses.includes(job.status as BookingsImportJobStatus)) {
      throw new BookingsImportInvalidStatusError(job.status, editableStatuses);
    }

    // Only allow updates to rows that haven't been committed
    const editableRowStatuses: BookingsImportRowStatus[] = [
      "PENDING",
      "VALID",
      "ERROR",
      "WARNING",
    ];
    if (!editableRowStatuses.includes(row.status as BookingsImportRowStatus)) {
      throw new BookingsImportInvalidStatusError(
        row.status,
        editableRowStatuses,
      );
    }

    // Build update payload
    const updatePayload: Parameters<IBookingsImportRowRepository["update"]>[1] =
      {};

    if (data.courtId !== undefined) {
      updatePayload.courtId = data.courtId;
    }
    if (data.courtLabel !== undefined) {
      updatePayload.courtLabel = data.courtLabel;
    }
    if (data.startTime !== undefined) {
      updatePayload.startTime = data.startTime;
    }
    if (data.endTime !== undefined) {
      updatePayload.endTime = data.endTime;
    }
    if (data.reason !== undefined) {
      updatePayload.reason = data.reason;
    }

    // Revalidate the row after update
    const errors: string[] = [];
    const warnings: string[] = [];

    const startTime = data.startTime ?? row.startTime;
    const endTime = data.endTime ?? row.endTime;
    const courtId = data.courtId ?? row.courtId;

    // Hour-alignment validation
    if (startTime && startTime.getMinutes() !== 0) {
      errors.push("Start time must be on the hour");
    }
    if (endTime && endTime.getMinutes() !== 0) {
      errors.push("End time must be on the hour");
    }
    if (startTime && endTime) {
      const durationMinutes = (endTime.getTime() - startTime.getTime()) / 60000;
      if (durationMinutes % 60 !== 0) {
        errors.push("Duration must be a multiple of 60 minutes");
      }
      if (durationMinutes <= 0) {
        errors.push("End time must be after start time");
      }
    }

    // Court mapping validation
    if (!courtId) {
      errors.push("Court must be selected");
    }

    // Required fields
    if (!startTime) {
      errors.push("Start time is required");
    }
    if (!endTime) {
      errors.push("End time is required");
    }

    updatePayload.errors = errors.length > 0 ? errors : null;
    updatePayload.warnings = warnings.length > 0 ? warnings : null;
    updatePayload.status = errors.length > 0 ? "ERROR" : "VALID";

    const updatedRow = await this.rowRepository.update(
      rowId,
      updatePayload,
      ctx,
    );

    // Update job row counts
    const counts = await this.rowRepository.countByJobIdAndStatus(job.id, ctx);
    await this.jobRepository.update(
      job.id,
      {
        rowCount:
          counts.PENDING +
          counts.VALID +
          counts.ERROR +
          counts.WARNING +
          counts.COMMITTED +
          counts.SKIPPED,
        validRowCount: counts.VALID + counts.WARNING,
        errorRowCount: counts.ERROR,
        committedRowCount: counts.COMMITTED,
      },
      ctx,
    );

    logger.info(
      {
        event: "bookings_import.row_updated",
        jobId: job.id,
        rowId,
        userId,
        newStatus: updatedRow.status,
      },
      "Bookings import row updated",
    );

    return updatedRow;
  }

  async deleteRow(
    userId: string,
    rowId: string,
    ctx?: RequestContext,
  ): Promise<void> {
    const { row, job } = await this.verifyRowOwnership(userId, rowId, ctx);

    // Only allow deletes when job is in NORMALIZED status
    const editableStatuses: BookingsImportJobStatus[] = ["NORMALIZED"];
    if (!editableStatuses.includes(job.status as BookingsImportJobStatus)) {
      throw new BookingsImportInvalidStatusError(job.status, editableStatuses);
    }

    // Only allow deletes for uncommitted rows
    const deletableRowStatuses: BookingsImportRowStatus[] = [
      "PENDING",
      "VALID",
      "ERROR",
      "WARNING",
    ];
    if (!deletableRowStatuses.includes(row.status as BookingsImportRowStatus)) {
      throw new BookingsImportInvalidStatusError(
        row.status,
        deletableRowStatuses,
      );
    }

    await this.rowRepository.delete(rowId, ctx);

    // Update job row counts
    const counts = await this.rowRepository.countByJobIdAndStatus(job.id, ctx);
    await this.jobRepository.update(
      job.id,
      {
        rowCount:
          counts.PENDING +
          counts.VALID +
          counts.ERROR +
          counts.WARNING +
          counts.COMMITTED +
          counts.SKIPPED,
        validRowCount: counts.VALID + counts.WARNING,
        errorRowCount: counts.ERROR,
        committedRowCount: counts.COMMITTED,
      },
      ctx,
    );

    logger.info(
      {
        event: "bookings_import.row_deleted",
        jobId: job.id,
        rowId,
        userId,
      },
      "Bookings import row deleted",
    );
  }

  async discardJob(
    userId: string,
    jobId: string,
    ctx?: RequestContext,
  ): Promise<void> {
    const job = await this.verifyJobOwnership(userId, jobId, ctx);

    // Only allow discard for non-committed jobs
    const discardableStatuses: BookingsImportJobStatus[] = [
      "DRAFT",
      "NORMALIZING",
      "NORMALIZED",
      "FAILED",
    ];
    if (!discardableStatuses.includes(job.status as BookingsImportJobStatus)) {
      throw new BookingsImportInvalidStatusError(
        job.status,
        discardableStatuses,
      );
    }

    // Delete the uploaded file from storage
    try {
      await this.storageService.delete(
        STORAGE_BUCKETS.ORGANIZATION_ASSETS,
        job.filePath,
      );
    } catch (error) {
      // Log but don't fail if file deletion fails
      logger.warn(
        {
          event: "bookings_import.file_delete_failed",
          jobId,
          filePath: job.filePath,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        "Failed to delete import file on discard",
      );
    }

    await this.jobRepository.updateStatus(jobId, "DISCARDED", ctx);

    logger.info(
      {
        event: "bookings_import.job_discarded",
        jobId,
        userId,
        previousStatus: job.status,
      },
      "Bookings import job discarded",
    );
  }

  async getAiUsage(
    userId: string,
    data: GetAiUsageDTO,
    ctx?: RequestContext,
  ): Promise<BookingsImportAiUsage> {
    await this.verifyOwnership(userId, data.placeId, ctx);

    const usedAt = await this.jobRepository.findLatestAiUsageByPlaceId(
      data.placeId,
      ctx,
    );

    return { usedAt: usedAt?.toISOString() ?? null };
  }

  async normalize(
    userId: string,
    jobId: string,
    mode: NormalizeMode,
    confirmAiOnce?: boolean,
    ctx?: RequestContext,
  ): Promise<NormalizeResult> {
    const job = await this.verifyJobOwnership(userId, jobId, ctx);

    // Only allow normalization from DRAFT status
    if (job.status !== "DRAFT") {
      throw new BookingsImportInvalidStatusError(job.status, ["DRAFT"]);
    }

    // AI mode guard
    if (mode === "ai") {
      if (!confirmAiOnce) {
        throw new BookingsImportInvalidStatusError(
          "AI mode requires confirmation",
          ["confirmAiOnce must be true"],
        );
      }

      const existingAiUsage =
        await this.jobRepository.findLatestAiUsageByPlaceId(job.placeId, ctx);
      if (existingAiUsage) {
        throw new BookingsImportAiAlreadyUsedError(
          job.placeId,
          existingAiUsage.toISOString(),
        );
      }
    }

    // Update job status to NORMALIZING
    await this.jobRepository.updateStatus(jobId, "NORMALIZING", ctx);

    try {
      // Get place info for timezone
      const place = await this.placeRepository.findById(job.placeId, ctx);
      if (!place) {
        throw new BookingsImportPlaceNotFoundError(job.placeId);
      }
      const timeZone = place.timeZone;

      // Get courts for this place (for label matching)
      const courts = await this.courtRepository.findByPlaceId(job.placeId, ctx);
      const courtLabelMap = new Map<string, string>();
      for (const court of courts) {
        courtLabelMap.set(court.label.toLowerCase().trim(), court.id);
      }

      // Download and parse the file
      const fileBuffer = await this.storageService.download(
        STORAGE_BUCKETS.ORGANIZATION_ASSETS,
        job.filePath,
      );

      // Parse based on source type
      const parsedRows = await this.parseFile(
        fileBuffer,
        job.sourceType as ImportSource,
        timeZone,
      );

      // Delete existing rows for this job (in case of re-normalization)
      await this.rowRepository.deleteByJobId(jobId, ctx);

      // Build row records with validation
      const rowRecords: InsertBookingsImportRow[] = parsedRows.map(
        (row, index) => {
          // Try to match court by label
          let courtId: string | null = null;
          if (row.courtLabel) {
            courtId =
              courtLabelMap.get(row.courtLabel.toLowerCase().trim()) ?? null;
          }

          // Validate the row
          const validation = validateRow({
            courtId,
            courtLabel: row.courtLabel,
            startTime: row.startTime,
            endTime: row.endTime,
            timeZone,
          });

          const status: BookingsImportRowStatus =
            validation.errors.length > 0 ? "ERROR" : "VALID";

          return {
            jobId,
            lineNumber: index + 1,
            status,
            sourceData: row.sourceData,
            courtId,
            courtLabel: row.courtLabel,
            startTime: row.startTime,
            endTime: row.endTime,
            reason: row.reason,
            errors: validation.errors.length > 0 ? validation.errors : null,
            warnings:
              validation.warnings.length > 0 ? validation.warnings : null,
          };
        },
      );

      // Detect duplicates within the job
      const duplicateMap = detectDuplicates(
        rowRecords.map((r) => ({
          courtId: r.courtId ?? null,
          startTime: r.startTime ?? null,
          endTime: r.endTime ?? null,
        })),
      );

      // Add duplicate errors
      for (const [index, _duplicateIndices] of duplicateMap) {
        const row = rowRecords[index];
        const existingErrors = (row.errors as string[] | null) ?? [];
        row.errors = [...existingErrors, "Duplicate booking in this import"];
        row.status = "ERROR";
      }

      // Insert rows in batches
      if (rowRecords.length > 0) {
        await this.rowRepository.createMany(rowRecords, ctx);
      }

      // Count results
      const validCount = rowRecords.filter((r) => r.status === "VALID").length;
      const errorCount = rowRecords.filter((r) => r.status === "ERROR").length;

      // Update job with counts and status
      const updateData: Parameters<IBookingsImportJobRepository["update"]>[1] =
        {
          status: "NORMALIZED",
          rowCount: rowRecords.length,
          validRowCount: validCount,
          errorRowCount: errorCount,
          normalizedAt: new Date(),
        };

      if (mode === "ai") {
        updateData.aiUsedAt = new Date();
      }

      await this.jobRepository.update(jobId, updateData, ctx);

      logger.info(
        {
          event: "bookings_import.normalized",
          jobId,
          userId,
          mode,
          rowCount: rowRecords.length,
          validCount,
          errorCount,
        },
        "Bookings import normalized",
      );

      return {
        jobId,
        status: "NORMALIZED",
        rowCount: rowRecords.length,
        validRowCount: validCount,
        errorRowCount: errorCount,
      };
    } catch (error) {
      // Mark job as failed
      await this.jobRepository.update(
        jobId,
        {
          status: "FAILED",
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
        },
        ctx,
      );
      throw error;
    }
  }

  async commit(
    userId: string,
    jobId: string,
    ctx?: RequestContext,
  ): Promise<CommitResult> {
    const job = await this.verifyJobOwnership(userId, jobId, ctx);

    // Allow NORMALIZED or COMMITTING (for retry) or COMMITTED (for idempotent re-run)
    if (
      job.status !== "NORMALIZED" &&
      job.status !== "COMMITTING" &&
      job.status !== "COMMITTED"
    ) {
      throw new BookingsImportInvalidStatusError(job.status, [
        "NORMALIZED",
        "COMMITTING",
        "COMMITTED",
      ]);
    }

    // Get all rows and check for blocking errors
    const allRows = await this.rowRepository.findByJobId(jobId, ctx);
    const errorRows = allRows.filter((row) => row.status === "ERROR");

    if (errorRows.length > 0) {
      throw new BookingsImportHasBlockingErrorsError(errorRows.length);
    }

    // Get valid rows to commit (skip already committed for idempotency)
    const validRows = allRows.filter((row) => row.status === "VALID");
    const alreadyCommittedCount = allRows.filter(
      (row) => row.status === "COMMITTED",
    ).length;

    // Get courts for this place to map court labels
    const courts = await this.courtRepository.findByPlaceId(job.placeId, ctx);
    const courtMap = new Map(courts.map((c) => [c.label.toLowerCase(), c.id]));

    const failures: Array<{
      rowId: string;
      lineNumber: number;
      error: string;
    }> = [];
    let committedCount = 0;
    let skippedCount = 0;

    // Mark job as committing
    await this.jobRepository.updateStatus(jobId, "COMMITTING", ctx);

    try {
      // Process each valid row
      for (const row of validRows) {
        try {
          // Skip if missing required fields
          if (!row.startTime || !row.endTime) {
            failures.push({
              rowId: row.id,
              lineNumber: row.lineNumber,
              error: "Missing start or end time",
            });
            await this.rowRepository.update(
              row.id,
              { status: "SKIPPED", skipReason: "Missing start or end time" },
              ctx,
            );
            skippedCount++;
            continue;
          }

          // Try to match court
          let courtId = row.courtId;
          if (!courtId && row.courtLabel) {
            courtId = courtMap.get(row.courtLabel.toLowerCase()) ?? null;
          }

          if (!courtId) {
            failures.push({
              rowId: row.id,
              lineNumber: row.lineNumber,
              error: "Could not match court",
            });
            await this.rowRepository.update(
              row.id,
              { status: "SKIPPED", skipReason: "Could not match court" },
              ctx,
            );
            skippedCount++;
            continue;
          }

          // Check for overlapping blocks
          const overlappingBlocks =
            await this.courtBlockRepository.findByCourtIdInRange(
              courtId,
              row.startTime,
              row.endTime,
              { includeInactive: false },
              ctx,
            );

          if (overlappingBlocks.length > 0) {
            failures.push({
              rowId: row.id,
              lineNumber: row.lineNumber,
              error: "Overlaps with existing block",
            });
            await this.rowRepository.update(
              row.id,
              { status: "SKIPPED", skipReason: "Overlaps with existing block" },
              ctx,
            );
            skippedCount++;
            continue;
          }

          // Check for overlapping reservations
          const overlappingReservations =
            await this.reservationRepository.findOverlappingActiveByCourtIds(
              [courtId],
              row.startTime,
              row.endTime,
              ctx,
            );

          if (overlappingReservations.length > 0) {
            failures.push({
              rowId: row.id,
              lineNumber: row.lineNumber,
              error: "Overlaps with existing reservation",
            });
            await this.rowRepository.update(
              row.id,
              {
                status: "SKIPPED",
                skipReason: "Overlaps with existing reservation",
              },
              ctx,
            );
            skippedCount++;
            continue;
          }

          // Create the court block
          const block = await this.courtBlockRepository.create(
            {
              courtId,
              startTime: row.startTime,
              endTime: row.endTime,
              type: "MAINTENANCE",
              reason: row.reason ?? "Imported booking",
              isActive: true,
            },
            ctx,
          );

          // Update row with block reference
          await this.rowRepository.update(
            row.id,
            {
              status: "COMMITTED",
              courtBlockId: block.id,
              courtId,
              committedAt: new Date(),
            },
            ctx,
          );

          committedCount++;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          failures.push({
            rowId: row.id,
            lineNumber: row.lineNumber,
            error: errorMessage,
          });
          await this.rowRepository.update(
            row.id,
            { status: "SKIPPED", skipReason: errorMessage },
            ctx,
          );
          skippedCount++;
        }
      }

      // Total committed includes both new and previously committed
      const totalCommitted = committedCount + alreadyCommittedCount;

      // Determine final job status
      const finalStatus: BookingsImportJobStatus =
        totalCommitted > 0 ? "COMMITTED" : "NORMALIZED";

      // Update job with final counts
      await this.jobRepository.update(
        jobId,
        {
          status: finalStatus,
          committedRowCount: totalCommitted,
          committedAt: totalCommitted > 0 ? new Date() : undefined,
        },
        ctx,
      );

      logger.info(
        {
          event: "bookingsImport.committed",
          jobId,
          totalRows: allRows.length,
          validRows: validRows.length,
          newlyCommittedRows: committedCount,
          previouslyCommittedRows: alreadyCommittedCount,
          totalCommittedRows: totalCommitted,
          skippedRows: skippedCount,
          failedRows: failures.length,
        },
        "Bookings import committed",
      );

      return {
        jobId,
        status: finalStatus,
        totalRows: allRows.length,
        committedRows: totalCommitted,
        skippedRows: skippedCount,
        failedRows: failures.length,
        failures,
      };
    } catch (error) {
      // Mark job as failed
      await this.jobRepository.update(
        jobId,
        {
          status: "FAILED",
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
        },
        ctx,
      );
      throw error;
    }
  }

  private async parseFile(
    buffer: Buffer,
    sourceType: ImportSource,
    _timeZone: string,
  ): Promise<
    Array<{
      courtLabel: string | null;
      startTime: Date | null;
      endTime: Date | null;
      reason: string | null;
      sourceData: Record<string, unknown>;
    }>
  > {
    switch (sourceType) {
      case "ics": {
        const content = buffer.toString("utf-8");
        const now = new Date();
        const rangeEnd = addDays(now, 365);
        const occurrences = parseIcs(content, now, rangeEnd);

        return occurrences.map((occ) => ({
          courtLabel: occ.location ?? occ.summary ?? null,
          startTime: occ.start,
          endTime: occ.end,
          reason: occ.summary ?? null,
          sourceData: {
            summary: occ.summary,
            location: occ.location,
            description: occ.description,
            uid: occ.uid,
          },
        }));
      }

      case "csv": {
        const content = buffer.toString("utf-8");
        const dataset = buildTabularDataset(parseCsv(content));

        // Basic heuristic: look for common column names
        const headers = dataset.headers.map((h) => h.toLowerCase());
        const courtCol =
          headers.find((h) => h.includes("court") || h.includes("resource")) ??
          headers[0];
        const startCol =
          headers.find(
            (h) =>
              h.includes("start") || h.includes("begin") || h.includes("from"),
          ) ?? headers[1];
        const endCol =
          headers.find(
            (h) =>
              h.includes("end") || h.includes("finish") || h.includes("to"),
          ) ?? headers[2];
        const reasonCol = headers.find(
          (h) =>
            h.includes("reason") || h.includes("note") || h.includes("title"),
        );

        return dataset.rows.map((row) => {
          const courtLabel = courtCol
            ? (row.data[dataset.headers[headers.indexOf(courtCol)]] ?? null)
            : null;
          const startStr = startCol
            ? (row.data[dataset.headers[headers.indexOf(startCol)]] ?? null)
            : null;
          const endStr = endCol
            ? (row.data[dataset.headers[headers.indexOf(endCol)]] ?? null)
            : null;
          const reason = reasonCol
            ? (row.data[dataset.headers[headers.indexOf(reasonCol)]] ?? null)
            : null;

          return {
            courtLabel,
            startTime: startStr ? new Date(startStr) : null,
            endTime: endStr ? new Date(endStr) : null,
            reason,
            sourceData: row.data,
          };
        });
      }

      case "xlsx": {
        const dataset = parseXlsx(buffer);

        // Same heuristic as CSV
        const headers = dataset.headers.map((h) => h.toLowerCase());
        const courtCol =
          headers.find((h) => h.includes("court") || h.includes("resource")) ??
          headers[0];
        const startCol =
          headers.find(
            (h) =>
              h.includes("start") || h.includes("begin") || h.includes("from"),
          ) ?? headers[1];
        const endCol =
          headers.find(
            (h) =>
              h.includes("end") || h.includes("finish") || h.includes("to"),
          ) ?? headers[2];
        const reasonCol = headers.find(
          (h) =>
            h.includes("reason") || h.includes("note") || h.includes("title"),
        );

        return dataset.rows.map((row) => {
          const courtLabel = courtCol
            ? (row.data[dataset.headers[headers.indexOf(courtCol)]] ?? null)
            : null;
          const startStr = startCol
            ? (row.data[dataset.headers[headers.indexOf(startCol)]] ?? null)
            : null;
          const endStr = endCol
            ? (row.data[dataset.headers[headers.indexOf(endCol)]] ?? null)
            : null;
          const reason = reasonCol
            ? (row.data[dataset.headers[headers.indexOf(reasonCol)]] ?? null)
            : null;

          return {
            courtLabel,
            startTime: startStr ? new Date(startStr) : null,
            endTime: endStr ? new Date(endStr) : null,
            reason,
            sourceData: row.data,
          };
        });
      }

      case "image":
        // Image parsing requires AI - for now return empty
        // This would be handled via a separate AI extraction call
        return [];

      default:
        return [];
    }
  }
}
