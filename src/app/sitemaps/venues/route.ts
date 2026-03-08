import { NextResponse } from "next/server";
import { getSitemapBuckets } from "@/lib/shared/lib/sitemap-data";
import { buildSitemapXml } from "@/lib/shared/lib/sitemap-xml";

export const revalidate = 3600;

export async function GET() {
  const buckets = await getSitemapBuckets();
  return new NextResponse(buildSitemapXml(buckets.venues), {
    headers: {
      "content-type": "application/xml; charset=utf-8",
    },
  });
}
