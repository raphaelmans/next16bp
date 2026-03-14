import { requireOwnedCoach } from "@/lib/modules/coach/helpers";
import type { ICoachRepository } from "@/lib/modules/coach/repositories/coach.repository";
import type { CoachBlockRecord } from "@/lib/shared/infra/db/schema";
import { logger } from "@/lib/shared/infra/logger";
import type { RequestContext } from "@/lib/shared/kernel/context";
import type { TransactionManager } from "@/lib/shared/kernel/transaction";
import type {
  CreateCoachBlockDTO,
  DeleteCoachBlockDTO,
  ListCoachBlocksDTO,
} from "../dtos";
import {
  CoachBlockNotFoundError,
  CoachBlockOverlapError,
  CoachBlockTimeRangeInvalidError,
} from "../errors/coach-block.errors";
import type { ICoachBlockRepository } from "../repositories/coach-block.repository";

export interface ICoachBlockService {
  list(userId: string, data: ListCoachBlocksDTO): Promise<CoachBlockRecord[]>;
  create(userId: string, data: CreateCoachBlockDTO): Promise<CoachBlockRecord>;
  delete(userId: string, data: DeleteCoachBlockDTO): Promise<void>;
}

export class CoachBlockService implements ICoachBlockService {
  constructor(
    private coachBlockRepository: ICoachBlockRepository,
    private coachRepository: ICoachRepository,
    private transactionManager: TransactionManager,
  ) {}

  async list(
    userId: string,
    data: ListCoachBlocksDTO,
  ): Promise<CoachBlockRecord[]> {
    const { startTime, endTime } = this.parseRange(
      data.startTime,
      data.endTime,
    );

    await requireOwnedCoach({
      userId,
      coachId: data.coachId,
      findByUserId: this.coachRepository.findByUserId.bind(
        this.coachRepository,
      ),
    });

    return this.coachBlockRepository.findByCoachIdInRange(
      data.coachId,
      startTime,
      endTime,
    );
  }

  async create(
    userId: string,
    data: CreateCoachBlockDTO,
  ): Promise<CoachBlockRecord> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      const { startTime, endTime } = this.parseRange(
        data.startTime,
        data.endTime,
      );
      const ownedCoach = await requireOwnedCoach({
        userId,
        coachId: data.coachId,
        findByUserId: this.coachRepository.findByUserId.bind(
          this.coachRepository,
        ),
        ctx,
      });

      await this.assertNoOverlaps(ownedCoach.id, startTime, endTime, ctx);

      const created = await this.coachBlockRepository.create(
        {
          coachId: ownedCoach.id,
          startTime,
          endTime,
          reason: this.normalizeReason(data.reason),
          blockType: data.blockType ?? "PERSONAL",
        },
        ctx,
      );

      logger.info(
        {
          event: "coach_block.created",
          coachId: ownedCoach.id,
          blockId: created.id,
          userId,
          startTime: created.startTime.toISOString(),
          endTime: created.endTime.toISOString(),
          blockType: created.blockType,
        },
        "Coach block created",
      );

      return created;
    });
  }

  async delete(userId: string, data: DeleteCoachBlockDTO): Promise<void> {
    await this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      const ownedCoach = await requireOwnedCoach({
        userId,
        coachId: data.coachId,
        findByUserId: this.coachRepository.findByUserId.bind(
          this.coachRepository,
        ),
        ctx,
      });

      const block = await this.coachBlockRepository.findById(data.blockId, ctx);
      if (!block || block.coachId !== ownedCoach.id) {
        throw new CoachBlockNotFoundError(data.blockId);
      }

      await this.coachBlockRepository.deleteById(block.id, ctx);

      logger.info(
        {
          event: "coach_block.deleted",
          coachId: ownedCoach.id,
          blockId: block.id,
          userId,
        },
        "Coach block deleted",
      );
    });
  }

  private parseRange(startIso: string, endIso: string) {
    const startTime = new Date(startIso);
    const endTime = new Date(endIso);

    if (
      Number.isNaN(startTime.getTime()) ||
      Number.isNaN(endTime.getTime()) ||
      startTime >= endTime
    ) {
      throw new CoachBlockTimeRangeInvalidError({
        startTime: startIso,
        endTime: endIso,
      });
    }

    return { startTime, endTime };
  }

  private normalizeReason(reason?: string): string | null {
    const normalized = reason?.trim();
    return normalized ? normalized : null;
  }

  private async assertNoOverlaps(
    coachId: string,
    startTime: Date,
    endTime: Date,
    ctx?: RequestContext,
  ): Promise<void> {
    const overlaps = await this.coachBlockRepository.findOverlappingByCoachId(
      coachId,
      startTime,
      endTime,
      ctx,
    );

    if (overlaps.length > 0) {
      throw new CoachBlockOverlapError(coachId, {
        overlappingBlockId: overlaps[0]?.id,
      });
    }
  }
}
