import { getContainer } from "@/shared/infra/container";
import { CourtPriceOverrideRepository } from "../repositories/court-price-override.repository";

let courtPriceOverrideRepository: CourtPriceOverrideRepository | null = null;

export function makeCourtPriceOverrideRepository(): CourtPriceOverrideRepository {
  if (!courtPriceOverrideRepository) {
    courtPriceOverrideRepository = new CourtPriceOverrideRepository(
      getContainer().db,
    );
  }
  return courtPriceOverrideRepository;
}
