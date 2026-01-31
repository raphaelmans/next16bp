import { getContainer } from "@/lib/shared/infra/container";
import { AuditService } from "../services/audit.service";

let auditService: AuditService | null = null;

export function makeAuditService() {
  if (!auditService) {
    auditService = new AuditService(getContainer().db);
  }
  return auditService;
}
