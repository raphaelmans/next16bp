import { requireOwnedCoach } from "@/lib/modules/coach/helpers";
import type { ICoachRepository } from "@/lib/modules/coach/repositories/coach.repository";
import type { CoachHoursWindowRecord } from "@/lib/shared/infra/db/schema";
import { logger } from "@/lib/shared/infra/logger";
import type { RequestContext } from "@/lib/shared/kernel/context";
import type { TransactionManager } from "@/lib/shared/kernel/transaction";
import type { SetCoachHoursDTO } from "../dtos";
import { CoachHoursOverlapError } from "../errors/coach-hours.errors";
import type { ICoachHoursRepository } from "../repositories/coach-hours.repository";

export interface ICoachHoursService {
  getHours(userId: string, coachId: string): Promise<CoachHoursWindowRecord[]>;
  setHours(
    userId: string,
    data: SetCoachHoursDTO,
  ): Promise<CoachHoursWindowRecord[]>;
}

export class CoachHoursService implements ICoachHoursService {
  constructor(
    private coachHoursRepository: ICoachHoursRepository,
    private coachRepository: ICoachRepository,
    private transactionManager: TransactionManager,
  ) {}

  async getHours(
    userId: string,
    coachId: string,
  ): Promise<CoachHoursWindowRecord[]> {
    await requireOwnedCoach({
      userId,
      coachId,
      findByUserId: this.coachRepository.findByUserId.bind(
        this.coachRepository,
      ),
    });

    return this.coachHoursRepository.findByCoachId(coachId);
  }

  async setHours(
    userId: string,
    data: SetCoachHoursDTO,
  ): Promise<CoachHoursWindowRecord[]> {
    return this.transactionManager.run(async (tx) => {
      const ctx: RequestContext = { tx };
      const ownedCoach = await requireOwnedCoach({
        userId,
        coachId: data.coachId,
        findByUserId: this.coachRepository.findByUserId.bind(
          this.coachRepository,
        ),
        ctx,
      });

      this.assertNoOverlaps(ownedCoach.id, data.windows);

      await this.coachHoursRepository.deleteByCoachId(ownedCoach.id, ctx);

      const created = await this.coachHoursRepository.createMany(
        data.windows.map((window) => ({
          coachId: ownedCoach.id,
          dayOfWeek: window.dayOfWeek,
          startMinute: window.startMinute,
          endMinute: window.endMinute,
          isAvailable: true,
        })),
        ctx,
      );

      logger.info(
        {
          event: "coach_hours.updated",
          coachId: ownedCoach.id,
          userId,
          windowCount: created.length,
        },
        "Coach hours updated",
      );

      return created;
    });
  }

  private assertNoOverlaps(
    coachId: string,
    windows: { dayOfWeek: number; startMinute: number; endMinute: number }[],
  ): void {
    const byDay = new Map<
      number,
      { startMinute: number; endMinute: number }[]
    >();

    for (const window of windows) {
      const list = byDay.get(window.dayOfWeek) ?? [];
      list.push({
        startMinute: window.startMinute,
        endMinute: window.endMinute,
      });
      byDay.set(window.dayOfWeek, list);
    }

    for (const [dayOfWeek, dayWindows] of byDay.entries()) {
      const sorted = dayWindows.sort((a, b) => a.startMinute - b.startMinute);
      for (let i = 1; i < sorted.length; i += 1) {
        if (sorted[i].startMinute < sorted[i - 1].endMinute) {
          throw new CoachHoursOverlapError(coachId, dayOfWeek);
        }
      }
    }
  }
}
