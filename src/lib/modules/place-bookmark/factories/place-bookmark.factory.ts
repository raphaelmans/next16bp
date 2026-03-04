import { makeProfileRepository } from "@/lib/modules/profile/factories/profile.factory";
import { getContainer } from "@/lib/shared/infra/container";
import { PlaceBookmarkRepository } from "../repositories/place-bookmark.repository";
import { PlaceBookmarkService } from "../services/place-bookmark.service";

let repo: PlaceBookmarkRepository | null = null;
let service: PlaceBookmarkService | null = null;

export function makePlaceBookmarkRepository(): PlaceBookmarkRepository {
  if (!repo) {
    repo = new PlaceBookmarkRepository(getContainer().db);
  }
  return repo;
}

export function makePlaceBookmarkService(): PlaceBookmarkService {
  if (!service) {
    service = new PlaceBookmarkService(
      makePlaceBookmarkRepository(),
      makeProfileRepository(),
    );
  }
  return service;
}
