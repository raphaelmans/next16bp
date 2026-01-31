import path from "node:path";
import { TZDate } from "@date-fns/tz";
import { addDays, differenceInMinutes } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { env } from "@/lib/env";
import type { ICourtRepository } from "@/lib/modules/court/repositories/court.repository";
import type { ICourtBlockRepository } from "@/lib/modules/court-block/repositories/court-block.repository";
import type { ICourtHoursRepository } from "@/lib/modules/court-hours/repositories/court-hours.repository";
import type { ICourtPriceOverrideRepository } from "@/lib/modules/court-price-override/repositories/court-price-override.repository";
import type { ICourtRateRuleRepository } from "@/lib/modules/court-rate-rule/repositories/court-rate-rule.repository";
import { GuestProfileNotFoundError } from "@/lib/modules/guest-profile/errors/guest-profile.errors";
import type { IGuestProfileRepository } from "@/lib/modules/guest-profile/repositories/guest-profile.repository";
import type { IOrganizationRepository } from "@/lib/modules/organization/repositories/organization.repository";
import type { IPlaceRepository } from "@/lib/modules/place/repositories/place.repository";
import type { IReservationRepository } from "@/lib/modules/reservation/repositories/reservation.repository";
import type { IReservationEventRepository } from "@/lib/modules/reservation/repositories/reservation-event.repository";
import {
  MAX_IMPORT_FILE_SIZE,
  STORAGE_BUCKETS,
} from "@/lib/modules/storage/dtos";
import type { IObjectStorageService } from "@/lib/modules/storage/services/object-storage.service";
import type {
  BookingsImportJobRecord,
  BookingsImportRowRecord,
  BookingsImportSourceRecord,
  InsertBookingsImportRow,
  InsertBookingsImportSource,
  ReservationRecord,
} from "@/lib/shared/infra/db/schema";
import { logger } from "@/lib/shared/infra/logger";
import type { RequestContext } from "@/lib/shared/kernel/context";
import type { TransactionManager } from "@/lib/shared/kernel/transaction";
import { computeSchedulePrice } from "@/lib/shared/lib/schedule-availability";
import type {
  CommitResult,
  CreateBookingsImportDTO,
  GetAiUsageDTO,
  ImportSource,
  NormalizeMode,
  NormalizeResult,
  ReplaceWithGuestDTO,
} from "../dtos";
import {
  BookingsImportAiAlreadyUsedError,
  BookingsImportAiNotConfiguredError,
  BookingsImportAiRequiredError,
  BookingsImportHasBlockingErrorsError,
  BookingsImportInvalidCourtError,
  BookingsImportInvalidFileTypeError,
  BookingsImportInvalidStatusError,
  BookingsImportJobNotFoundError,
  BookingsImportNotOwnerError,
  BookingsImportPlaceNotFoundError,
  BookingsImportRowAlreadyReplacedError,
  BookingsImportRowMissingBlockError,
  BookingsImportRowNotCommittedError,
  BookingsImportRowNotFoundError,
} from "../errors/bookings-import.errors";
import {
  buildIcsRowsFromSpec,
  buildTabularDataset,
  buildTabularRowsFromSpec,
  detectDuplicates,
  extractScreenshotBookings,
  generateIcsMappingSpec,
  generateTabularMappingSpec,
  parseCsv,
  parseIcs,
  parseImageTime,
  SCREENSHOT_MODEL_DEFAULT,
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
import type { IBookingsImportSourceRepository } from "../repositories/bookings-import-source.repository";

type ParsedImportRow = {
  courtLabel: string | null;
  startTime: Date | null;
  endTime: Date | null;
  reason: string | null;
  sourceData: Record<string, unknown>;
  sourceLineNumber: number | null;
};

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
  listSources(
    userId: string,
    jobId: string,
    ctx?: RequestContext,
  ): Promise<BookingsImportSourceRecord[]>;
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
  replaceWithGuest(
    userId: string,
    data: ReplaceWithGuestDTO,
  ): Promise<ReservationRecord>;
}

export class BookingsImportService implements IBookingsImportService {
  constructor(
    private placeRepository: IPlaceRepository,
    private organizationRepository: IOrganizationRepository,
    private storageService: IObjectStorageService,
    private jobRepository: IBookingsImportJobRepository,
    private rowRepository: IBookingsImportRowRepository,
    private sourceRepository: IBookingsImportSourceRepository,
    private courtRepository: ICourtRepository,
    private courtBlockRepository: ICourtBlockRepository,
    private reservationRepository: IReservationRepository,
    private transactionManager: TransactionManager,
    private guestProfileRepository: IGuestProfileRepository,
    private reservationEventRepository: IReservationEventRepository,
    private courtHoursRepository: ICourtHoursRepository,
    private courtRateRuleRepository: ICourtRateRuleRepository,
    private courtPriceOverrideRepository: ICourtPriceOverrideRepository,
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
    const { organizationId } = await this.verifyOwnership(
      userId,
      data.placeId,
      ctx,
    );

    const selectedCourtId =
      typeof data.selectedCourtId === "string" &&
      data.selectedCourtId.length > 0
        ? data.selectedCourtId
        : null;

    if (selectedCourtId) {
      const court = await this.courtRepository.findById(selectedCourtId, ctx);
      if (!court || court.placeId !== data.placeId) {
        throw new BookingsImportInvalidCourtError(
          selectedCourtId,
          data.placeId,
        );
      }
    }

    const jobId = uuidv4();
    const uploadedPaths: string[] = [];
    const sources: InsertBookingsImportSource[] = [];

    try {
      for (const [index, file] of data.files.entries()) {
        const fileName = file.name || `import-${index + 1}`;
        const { sourceType, resolvedExtension, allowedTypes, contentType } =
          this.resolveSourceType(file, fileName);
        const pathName = `imports/${data.placeId}/${jobId}/${index + 1}${resolvedExtension}`;

        const result = await this.storageService.upload({
          bucket: STORAGE_BUCKETS.ORGANIZATION_ASSETS,
          path: pathName,
          file,
          contentType,
          upsert: false,
          allowedTypes,
          maxSize: MAX_IMPORT_FILE_SIZE,
        });

        uploadedPaths.push(result.path);
        sources.push({
          jobId,
          sourceType,
          fileName,
          fileSize: file.size,
          filePath: result.path,
          sortOrder: index + 1,
        });
      }

      const primary = sources[0];
      const job = await this.transactionManager.run(async (tx) => {
        const txCtx = ctx ? { ...ctx, tx } : { tx };
        const createdJob = await this.jobRepository.create(
          {
            id: jobId,
            placeId: data.placeId,
            organizationId,
            userId,
            sourceType: primary.sourceType,
            status: "DRAFT",
            fileName: primary.fileName,
            fileSize: primary.fileSize,
            filePath: primary.filePath,
            metadata: selectedCourtId ? { selectedCourtId } : undefined,
          },
          txCtx,
        );

        await this.sourceRepository.createMany(sources, txCtx);
        return createdJob;
      });

      logger.info(
        {
          event: "bookings_import.draft_created",
          placeId: data.placeId,
          organizationId,
          jobId: job.id,
          sourceTypes: sources.map((source) => source.sourceType),
          userId,
        },
        "Bookings import draft created",
      );

      return job;
    } catch (error) {
      await this.cleanupUploads(uploadedPaths);
      throw error;
    }
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

  async listSources(
    userId: string,
    jobId: string,
    ctx?: RequestContext,
  ): Promise<BookingsImportSourceRecord[]> {
    await this.verifyJobOwnership(userId, jobId, ctx);
    return this.sourceRepository.findByJobId(jobId, ctx);
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

    const sources = await this.sourceRepository.findByJobId(jobId, ctx);
    const filePaths =
      sources.length > 0
        ? sources.map((source) => source.filePath)
        : [job.filePath];

    for (const filePath of filePaths) {
      try {
        await this.storageService.delete(
          STORAGE_BUCKETS.ORGANIZATION_ASSETS,
          filePath,
        );
      } catch (error) {
        logger.warn(
          {
            event: "bookings_import.file_delete_failed",
            jobId,
            filePath,
            error: error instanceof Error ? error.message : "Unknown error",
          },
          "Failed to delete import file on discard",
        );
      }
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

    const selectedCourtId =
      job.metadata &&
      typeof job.metadata === "object" &&
      typeof (job.metadata as Record<string, unknown>).selectedCourtId ===
        "string"
        ? ((job.metadata as Record<string, unknown>).selectedCourtId as string)
        : null;

    if (job.status !== "DRAFT") {
      throw new BookingsImportInvalidStatusError(job.status, ["DRAFT"]);
    }

    let sources = await this.sourceRepository.findByJobId(jobId, ctx);
    if (sources.length === 0) {
      sources = await this.sourceRepository.createMany(
        [
          {
            jobId,
            sourceType: job.sourceType as ImportSource,
            fileName: job.fileName,
            fileSize: job.fileSize,
            filePath: job.filePath,
            sortOrder: 1,
          },
        ],
        ctx,
      );
    }

    const hasImageSource = sources.some(
      (source) => source.sourceType === "image",
    );
    if (hasImageSource && mode !== "ai") {
      throw new BookingsImportAiRequiredError("image");
    }

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

    if (mode === "ai" && !env.OPENAI_API_KEY) {
      throw new BookingsImportAiNotConfiguredError();
    }

    await this.jobRepository.updateStatus(jobId, "NORMALIZING", ctx);

    try {
      const place = await this.placeRepository.findById(job.placeId, ctx);
      if (!place) {
        throw new BookingsImportPlaceNotFoundError(job.placeId);
      }
      const timeZone = place.timeZone;

      const courts = await this.courtRepository.findByPlaceId(job.placeId, ctx);

      if (
        selectedCourtId &&
        !courts.some((court) => court.id === selectedCourtId)
      ) {
        throw new BookingsImportInvalidCourtError(selectedCourtId, job.placeId);
      }

      const courtLabelMap = new Map<string, string>();
      for (const court of courts) {
        courtLabelMap.set(court.label.toLowerCase().trim(), court.id);
      }

      await this.rowRepository.deleteByJobId(jobId, ctx);

      const rowRecords: InsertBookingsImportRow[] = [];
      let lineNumber = 1;

      for (const source of sources) {
        const fileBuffer = await this.storageService.download(
          STORAGE_BUCKETS.ORGANIZATION_ASSETS,
          source.filePath,
        );

        if (source.sourceType === "image" && mode === "ai") {
          logger.info(
            {
              event: "bookings_import.image_extract_started",
              jobId,
              placeId: job.placeId,
              sourceId: source.id,
              model: SCREENSHOT_MODEL_DEFAULT,
            },
            "Bookings import image extraction started",
          );
        }

        const { rows: parsedRows, metadata } = await this.parseFile({
          buffer: fileBuffer,
          sourceType: source.sourceType as ImportSource,
          timeZone,
          mode,
          model: SCREENSHOT_MODEL_DEFAULT,
        });

        if (source.sourceType === "image" && mode === "ai") {
          logger.info(
            {
              event: "bookings_import.image_extract_completed",
              jobId,
              placeId: job.placeId,
              sourceId: source.id,
              eventCount: metadata?.screenshotEventCount ?? parsedRows.length,
            },
            "Bookings import image extraction completed",
          );
        }

        if (metadata) {
          await this.sourceRepository.update(
            source.id,
            { metadata: { ...(source.metadata ?? {}), ...metadata } },
            ctx,
          );
        }

        parsedRows.forEach((row, rowIndex) => {
          let courtId: string | null = selectedCourtId;
          if (!courtId && row.courtLabel) {
            courtId =
              courtLabelMap.get(row.courtLabel.toLowerCase().trim()) ?? null;
          }

          const validation = validateRow({
            courtId,
            courtLabel: row.courtLabel,
            startTime: row.startTime,
            endTime: row.endTime,
            timeZone,
          });

          const status: BookingsImportRowStatus =
            validation.errors.length > 0 ? "ERROR" : "VALID";

          rowRecords.push({
            jobId,
            sourceId: source.id,
            sourceLineNumber: row.sourceLineNumber ?? rowIndex + 1,
            lineNumber,
            status,
            sourceData: {
              ...row.sourceData,
              sourceFileName: source.fileName,
              sourceType: source.sourceType,
            },
            courtId,
            courtLabel: row.courtLabel,
            startTime: row.startTime,
            endTime: row.endTime,
            reason: row.reason,
            errors: validation.errors.length > 0 ? validation.errors : null,
            warnings:
              validation.warnings.length > 0 ? validation.warnings : null,
          });

          lineNumber += 1;
        });
      }

      const duplicateMap = detectDuplicates(
        rowRecords.map((row) => ({
          courtId: row.courtId ?? null,
          courtLabel: row.courtLabel ?? null,
          startTime: row.startTime ?? null,
          endTime: row.endTime ?? null,
        })),
      );

      for (const [index] of duplicateMap) {
        const row = rowRecords[index];
        const existingErrors = (row.errors as string[] | null) ?? [];
        row.errors = [...existingErrors, "Duplicate booking in this import"];
        row.status = "ERROR";
      }

      if (rowRecords.length > 0) {
        await this.rowRepository.createMany(rowRecords, ctx);
      }

      const validCount = rowRecords.filter(
        (row) => row.status === "VALID",
      ).length;
      const errorCount = rowRecords.filter(
        (row) => row.status === "ERROR",
      ).length;

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
      if (hasImageSource) {
        logger.warn(
          {
            event: "bookings_import.image_extract_failed",
            jobId,
            placeId: job.placeId,
            error: error instanceof Error ? error.message : "Unknown error",
          },
          "Bookings import image extraction failed",
        );
      }
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

    const selectedCourtId =
      job.metadata &&
      typeof job.metadata === "object" &&
      typeof (job.metadata as Record<string, unknown>).selectedCourtId ===
        "string"
        ? ((job.metadata as Record<string, unknown>).selectedCourtId as string)
        : null;

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

    if (
      selectedCourtId &&
      !courts.some((court) => court.id === selectedCourtId)
    ) {
      throw new BookingsImportInvalidCourtError(selectedCourtId, job.placeId);
    }

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
          let courtId = selectedCourtId ?? row.courtId;
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

  private resolveSourceType(
    file: File,
    fileName: string,
  ): {
    sourceType: ImportSource;
    resolvedExtension: string;
    allowedTypes: string[];
    contentType: string;
  } {
    const extension = path.extname(fileName).toLowerCase();
    const hasExtension = extension.length > 0;
    const entries = Object.entries(SOURCE_CONFIG) as Array<
      [ImportSource, SourceConfig]
    >;

    const byExtension = hasExtension
      ? entries.find(([, config]) => config.extensions.includes(extension))
      : undefined;
    const byMime = file.type
      ? entries.find(([, config]) => config.mimeTypes.includes(file.type))
      : undefined;

    const matched = byExtension ?? byMime;
    if (!matched) {
      const allowedTypes = entries.flatMap(([, config]) => config.mimeTypes);
      throw new BookingsImportInvalidFileTypeError(
        file.type || extension || "unknown",
        allowedTypes,
      );
    }

    const [sourceType, config] = matched;
    const resolvedExtension = hasExtension ? extension : config.extensions[0];
    const allowedTypes = file.type
      ? config.mimeTypes
      : [...config.mimeTypes, ""];
    const contentType = file.type || config.contentTypeFallback;

    return { sourceType, resolvedExtension, allowedTypes, contentType };
  }

  private async cleanupUploads(paths: string[]): Promise<void> {
    if (paths.length === 0) return;

    await Promise.all(
      paths.map(async (pathName) => {
        try {
          await this.storageService.delete(
            STORAGE_BUCKETS.ORGANIZATION_ASSETS,
            pathName,
          );
        } catch (error) {
          logger.warn(
            {
              event: "bookings_import.cleanup_failed",
              filePath: pathName,
              error: error instanceof Error ? error.message : "Unknown error",
            },
            "Failed to cleanup uploaded import file",
          );
        }
      }),
    );
  }

  private async parseFile(params: {
    buffer: Buffer;
    sourceType: ImportSource;
    timeZone: string;
    mode: NormalizeMode;
    model?: string;
  }): Promise<{ rows: ParsedImportRow[]; metadata?: Record<string, unknown> }> {
    const { buffer, sourceType, timeZone, mode, model } = params;

    switch (sourceType) {
      case "ics": {
        const content = buffer.toString("utf-8");
        const now = new Date();
        const rangeEnd = addDays(now, 365);
        const occurrences = parseIcs(content, now, rangeEnd);

        if (mode === "ai") {
          const sampleEvents = occurrences.slice(0, 20).map((event) => ({
            summary: event.summary ?? null,
            location: event.location ?? null,
            description: event.description ?? null,
            start: event.start.toISOString(),
            end: event.end.toISOString(),
            status: event.status ?? null,
          }));

          const mappingSpec = await generateIcsMappingSpec({
            sampleEvents,
            model,
          });

          const mappedRows = buildIcsRowsFromSpec({
            occurrences,
            spec: mappingSpec,
          });

          const rows = mappedRows.map((row) => ({
            courtLabel: row.courtLabel,
            startTime: row.startTime,
            endTime: row.endTime,
            reason: row.reason,
            sourceData: row.sourceData,
            sourceLineNumber: row.rowNumber,
          }));

          return {
            rows,
            metadata: {
              icsMappingSpec: mappingSpec,
            },
          };
        }

        const rows = occurrences.map((occ, index) => ({
          courtLabel: occ.location ?? occ.summary ?? null,
          startTime: occ.start,
          endTime: occ.end,
          reason: occ.summary ?? null,
          sourceData: {
            summary: occ.summary ?? null,
            location: occ.location ?? null,
            description: occ.description ?? null,
            uid: occ.uid ?? null,
          },
          sourceLineNumber: index + 1,
        }));

        return { rows };
      }

      case "csv": {
        const content = buffer.toString("utf-8");
        const dataset = buildTabularDataset(parseCsv(content));

        if (mode === "ai") {
          const mappingSpec = await generateTabularMappingSpec({
            dataset,
            timeZone,
            format: "csv",
            model,
          });
          const mappedRows = buildTabularRowsFromSpec({
            dataset,
            spec: mappingSpec,
            timeZone,
          });

          return {
            rows: mappedRows.map((row) => ({
              courtLabel: row.courtLabel,
              startTime: row.startTime,
              endTime: row.endTime,
              reason: row.reason,
              sourceData: row.sourceData,
              sourceLineNumber: row.rowNumber,
            })),
            metadata: {
              tabularMappingSpec: mappingSpec,
              tabularFormat: "csv",
            },
          };
        }

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

        const rows = dataset.rows.map((row) => {
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
            sourceLineNumber: row.rowNumber,
          };
        });

        return { rows };
      }

      case "xlsx": {
        const dataset = parseXlsx(buffer);

        if (mode === "ai") {
          const mappingSpec = await generateTabularMappingSpec({
            dataset,
            timeZone,
            format: "xlsx",
            model,
          });
          const mappedRows = buildTabularRowsFromSpec({
            dataset,
            spec: mappingSpec,
            timeZone,
          });

          return {
            rows: mappedRows.map((row) => ({
              courtLabel: row.courtLabel,
              startTime: row.startTime,
              endTime: row.endTime,
              reason: row.reason,
              sourceData: row.sourceData,
              sourceLineNumber: row.rowNumber,
            })),
            metadata: {
              tabularMappingSpec: mappingSpec,
              tabularFormat: "xlsx",
            },
          };
        }

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

        const rows = dataset.rows.map((row) => {
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
            sourceLineNumber: row.rowNumber,
          };
        });

        return { rows };
      }

      case "image": {
        const extraction = await extractScreenshotBookings({
          imageBuffer: buffer,
          model,
        });

        const rows = extraction.events.map((event, index) => {
          const time = parseImageTime(event.startTime);
          const startTime = time
            ? new TZDate(
                extraction.year,
                extraction.month - 1,
                event.day,
                time.hour,
                time.minute,
                timeZone,
              )
            : null;
          const endTime = startTime
            ? new Date(startTime.getTime() + 60 * 60 * 1000)
            : null;

          return {
            courtLabel: event.resourceLabel?.trim() || null,
            startTime,
            endTime,
            reason: event.title?.trim() || null,
            sourceData: {
              day: event.day,
              startTime: event.startTime,
              title: event.title ?? null,
              resourceLabel: event.resourceLabel ?? null,
              month: extraction.month,
              year: extraction.year,
              calendarTitle: extraction.calendarTitle ?? null,
              timeZone: extraction.timeZone ?? null,
            },
            sourceLineNumber: index + 1,
          };
        });

        const metadata: Record<string, unknown> = {
          screenshotEventCount: extraction.events.length,
          screenshotMonth: extraction.month,
          screenshotYear: extraction.year,
          screenshotTitle: extraction.calendarTitle ?? null,
          screenshotTimeZone: extraction.timeZone ?? null,
          screenshotModel: model ?? SCREENSHOT_MODEL_DEFAULT,
        };

        return { rows, metadata };
      }

      default:
        return { rows: [] };
    }
  }

  async replaceWithGuest(
    userId: string,
    data: ReplaceWithGuestDTO,
  ): Promise<ReservationRecord> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };

      // 1. Fetch row and verify ownership
      const { row, job } = await this.verifyRowOwnership(
        userId,
        data.rowId,
        ctx,
      );

      // 2. Guard: row must be committed
      if (row.status !== "COMMITTED") {
        throw new BookingsImportRowNotCommittedError(data.rowId);
      }

      // 3. Guard: not already replaced
      if (row.replacedWithReservationId) {
        throw new BookingsImportRowAlreadyReplacedError(
          data.rowId,
          row.replacedWithReservationId,
        );
      }

      // 4. Guard: must have active court block
      const courtBlockId = row.courtBlockId;
      if (!courtBlockId) {
        throw new BookingsImportRowMissingBlockError(data.rowId);
      }

      // 5. Verify block is active
      const block = await this.courtBlockRepository.findById(courtBlockId, ctx);
      if (!block || !block.isActive) {
        throw new BookingsImportRowMissingBlockError(data.rowId);
      }

      // 6. Validate time data
      if (!row.courtId || !row.startTime || !row.endTime) {
        throw new BookingsImportRowMissingBlockError(data.rowId);
      }

      const startTime = new Date(row.startTime);
      const endTime = new Date(row.endTime);
      const durationMinutes = differenceInMinutes(endTime, startTime);

      // 7. Get place for pricing + timezone
      const { place, organizationId } = await this.verifyOwnership(
        userId,
        job.placeId,
        ctx,
      );

      // 8. Resolve guest profile
      let guestProfileId: string;
      if (data.guestMode === "existing") {
        if (!data.guestProfileId) {
          throw new GuestProfileNotFoundError("");
        }
        const existingGuest = await this.guestProfileRepository.findById(
          data.guestProfileId,
          ctx,
        );
        if (!existingGuest || existingGuest.organizationId !== organizationId) {
          throw new GuestProfileNotFoundError(data.guestProfileId);
        }
        guestProfileId = data.guestProfileId;
      } else {
        if (!data.newGuestName) {
          throw new BookingsImportRowMissingBlockError(data.rowId);
        }
        const newGuest = await this.guestProfileRepository.create(
          {
            organizationId,
            displayName: data.newGuestName,
            phoneNumber: data.newGuestPhone ?? null,
            email: data.newGuestEmail ?? null,
            notes: null,
          },
          ctx,
        );
        guestProfileId = newGuest.id;
      }

      const guest = await this.guestProfileRepository.findById(
        guestProfileId,
        ctx,
      );
      if (!guest) {
        throw new GuestProfileNotFoundError(guestProfileId);
      }

      // 9. Compute pricing
      const [hours, rules, overrides] = await Promise.all([
        this.courtHoursRepository.findByCourtIds([row.courtId], ctx),
        this.courtRateRuleRepository.findByCourtIds([row.courtId], ctx),
        this.courtPriceOverrideRepository.findOverlappingByCourtIds(
          [row.courtId],
          startTime,
          endTime,
          ctx,
        ),
      ]);

      const pricing = computeSchedulePrice({
        startTime,
        durationMinutes,
        timeZone: place.timeZone,
        hoursWindows: hours,
        rateRules: rules,
        priceOverrides: overrides,
      });

      // 10. Check overlaps (excluding this block)
      const overlappingReservations =
        await this.reservationRepository.findOverlappingActiveByCourtIds(
          [row.courtId],
          startTime,
          endTime,
          ctx,
        );
      if (overlappingReservations.length > 0) {
        throw new BookingsImportInvalidCourtError(row.courtId, job.placeId);
      }

      const overlappingBlocks =
        await this.courtBlockRepository.findOverlappingByCourtIds(
          [row.courtId],
          startTime,
          endTime,
          {},
          ctx,
        );
      const otherBlocks = overlappingBlocks.filter(
        (b) => b.id !== courtBlockId,
      );
      if (otherBlocks.length > 0) {
        throw new BookingsImportInvalidCourtError(row.courtId, job.placeId);
      }

      // 11. Create reservation
      const now = new Date();
      const reservation = await this.reservationRepository.create(
        {
          courtId: row.courtId,
          startTime,
          endTime,
          totalPriceCents: pricing?.totalPriceCents ?? 0,
          currency: pricing?.currency ?? "BRL",
          playerId: null,
          guestProfileId,
          playerNameSnapshot: guest.displayName,
          playerEmailSnapshot: guest.email ?? null,
          playerPhoneSnapshot: guest.phoneNumber ?? null,
          status: "CONFIRMED",
          confirmedAt: now,
          expiresAt: null,
        },
        ctx,
      );

      // 12. Create reservation event
      await this.reservationEventRepository.create(
        {
          reservationId: reservation.id,
          fromStatus: null,
          toStatus: "CONFIRMED",
          triggeredByUserId: userId,
          triggeredByRole: "OWNER",
          notes: data.notes ?? "Replaced imported block with guest booking",
        },
        ctx,
      );

      // 13. Cancel the court block
      await this.courtBlockRepository.update(
        courtBlockId,
        { isActive: false, cancelledAt: now },
        ctx,
      );

      // 14. Update import row with replacement data
      await this.rowRepository.update(
        data.rowId,
        {
          replacedWithReservationId: reservation.id,
          replacedWithGuestProfileId: guestProfileId,
          replacedAt: now,
        },
        ctx,
      );

      logger.info(
        {
          event: "bookingsImport.row_replaced_with_guest",
          rowId: data.rowId,
          courtBlockId,
          reservationId: reservation.id,
          guestProfileId,
          ownerId: userId,
        },
        "Import row replaced with guest booking",
      );

      return reservation;
    });
  }
}
