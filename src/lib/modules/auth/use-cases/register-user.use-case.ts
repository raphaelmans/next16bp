import { appRoutes } from "@/common/app-routes";
import type { IUserPreferenceService } from "@/lib/modules/user-preference/services/user-preference.service";
import type { IUserRoleService } from "@/lib/modules/user-role/services/user-role.service";
import type { TransactionManager } from "@/lib/shared/kernel/transaction";
import type { RegisterDTO } from "../dtos/register.dto";
import { AuthRegistrationFailedError } from "../errors/auth.errors";
import type { IAuthService } from "../services/auth.service";

/**
 * RegisterUserUseCase orchestrates user registration.
 * Multi-service operation:
 * 1. Create user in Supabase Auth (external service)
 * 2. Create user_roles record in our database (transaction)
 */
export class RegisterUserUseCase {
  constructor(
    private authService: IAuthService,
    private userRoleService: IUserRoleService,
    private userPreferenceService: IUserPreferenceService,
    private transactionManager: TransactionManager,
  ) {}

  async execute(input: RegisterDTO, baseUrl: string) {
    // 1. Create user in Supabase (outside transaction - external service)
    const result = await this.authService.signUp(
      input.email,
      input.password,
      baseUrl,
      input.redirect,
    );

    const user = result.user;

    if (!user) {
      throw new AuthRegistrationFailedError(input.email);
    }

    const ownerIntent = this.hasOwnerIntent(input.redirect);

    // 2. Create user role in our database (within transaction)
    await this.transactionManager.run(async (tx) => {
      await this.userRoleService.create(
        { userId: user.id, role: "member" },
        { tx },
      );

      if (ownerIntent) {
        await this.userPreferenceService.setDefaultPortal(user.id, "owner", {
          tx,
        });
      }
    });

    return {
      user: { id: user.id, email: user.email },
      session: result.session,
    };
  }

  private hasOwnerIntent(redirect?: string): boolean {
    if (!redirect) {
      return false;
    }

    const pathname = redirect.split("?")[0];
    return (
      pathname === appRoutes.owner.base ||
      pathname.startsWith(`${appRoutes.owner.base}/`)
    );
  }
}
