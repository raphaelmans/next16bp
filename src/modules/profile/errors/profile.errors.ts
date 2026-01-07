import { NotFoundError } from "@/shared/kernel/errors";

export class ProfileNotFoundError extends NotFoundError {
  constructor(identifier: string) {
    super(`Profile not found: ${identifier}`);
  }
}
