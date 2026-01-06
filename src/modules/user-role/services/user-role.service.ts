import type { TransactionManager } from "@/shared/kernel/transaction";
import type { RequestContext } from "@/shared/kernel/context";
import type { IUserRoleRepository } from "../repositories/user-role.repository";
import type { UserRoleRecord, InsertUserRole } from "@/shared/infra/db/schema";
import { UserRoleAlreadyExistsError } from "../errors/user-role.errors";
import { logger } from "@/shared/infra/logger";

export interface IUserRoleService {
  findByUserId(
    userId: string,
    ctx?: RequestContext,
  ): Promise<UserRoleRecord | null>;
  create(data: InsertUserRole, ctx?: RequestContext): Promise<UserRoleRecord>;
}

export class UserRoleService implements IUserRoleService {
  constructor(
    private userRoleRepository: IUserRoleRepository,
    private transactionManager: TransactionManager,
  ) {}

  async findByUserId(
    userId: string,
    ctx?: RequestContext,
  ): Promise<UserRoleRecord | null> {
    return this.userRoleRepository.findByUserId(userId, ctx);
  }

  async create(
    data: InsertUserRole,
    ctx?: RequestContext,
  ): Promise<UserRoleRecord> {
    if (ctx?.tx) {
      return this.createInternal(data, ctx);
    }
    return this.transactionManager.run((tx) =>
      this.createInternal(data, { tx }),
    );
  }

  private async createInternal(
    data: InsertUserRole,
    ctx: RequestContext,
  ): Promise<UserRoleRecord> {
    // Check if user role already exists
    const existing = await this.userRoleRepository.findByUserId(
      data.userId,
      ctx,
    );
    if (existing) {
      throw new UserRoleAlreadyExistsError(data.userId);
    }

    const userRole = await this.userRoleRepository.create(data, ctx);

    // Business event: user role created
    logger.info(
      {
        event: "user_role.created",
        userId: userRole.userId,
        role: userRole.role,
      },
      "User role created",
    );

    return userRole;
  }
}
