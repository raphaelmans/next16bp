import { getContainer } from "@/shared/infra/container";
import { CourtBlockRepository } from "../repositories/court-block.repository";

let courtBlockRepository: CourtBlockRepository | null = null;

export function makeCourtBlockRepository(): CourtBlockRepository {
  if (!courtBlockRepository) {
    courtBlockRepository = new CourtBlockRepository(getContainer().db);
  }
  return courtBlockRepository;
}
