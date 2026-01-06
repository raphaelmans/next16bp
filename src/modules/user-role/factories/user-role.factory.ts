import { getContainer } from "@/shared/infra/container";
import { UserRoleRepository } from "../repositories/user-role.repository";
import { UserRoleService } from "../services/user-role.service";

let userRoleRepository: UserRoleRepository | null = null;
let userRoleService: UserRoleService | null = null;

export function makeUserRoleRepository() {
  if (!userRoleRepository) {
    userRoleRepository = new UserRoleRepository(getContainer().db);
  }
  return userRoleRepository;
}

export function makeUserRoleService() {
  if (!userRoleService) {
    userRoleService = new UserRoleService(
      makeUserRoleRepository(),
      getContainer().transactionManager,
    );
  }
  return userRoleService;
}
