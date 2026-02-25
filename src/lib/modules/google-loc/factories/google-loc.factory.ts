import { GoogleLocService } from "../services/google-loc.service";

let googleLocService: GoogleLocService | null = null;

export function makeGoogleLocService(): GoogleLocService {
  if (!googleLocService) {
    googleLocService = new GoogleLocService();
  }
  return googleLocService;
}
