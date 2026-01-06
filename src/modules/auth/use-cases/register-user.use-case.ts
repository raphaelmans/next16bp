import type { AuthService } from "../services/auth.service";
import type { IUserRoleService } from "@/modules/user-role/services/user-role.service";
import type { TransactionManager } from "@/shared/kernel/transaction";
import type { RegisterDTO } from "../dtos/register.dto";

/**
 * RegisterUserUseCase orchestrates user registration.
 * Multi-service operation:
 * 1. Create user in Supabase Auth (external service)
 * 2. Create user_roles record in our database (transaction)
 */
export class RegisterUserUseCase {
  constructor(
    private authService: AuthService,
    private userRoleService: IUserRoleService,
    private transactionManager: TransactionManager,
  ) {}

  async execute(input: RegisterDTO, baseUrl: string) {
    // 1. Create user in Supabase (outside transaction - external service)
    const result = await this.authService.signUp(
      input.email,
      input.password,
      baseUrl,
    );

    if (!result.user) {
      throw new Error("Failed to create user");
    }

    // 2. Create user role in our database (within transaction)
    await this.transactionManager.run(async (tx) => {
      await this.userRoleService.create(
        { userId: result.user!.id, role: "member" },
        { tx },
      );
    });

    return {
      user: { id: result.user.id, email: result.user.email },
      session: result.session,
    };
  }
}
