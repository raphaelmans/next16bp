import { handleGoogleLocGeocode } from "@/lib/modules/google-loc/http/google-loc-route-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return handleGoogleLocGeocode(req);
}
