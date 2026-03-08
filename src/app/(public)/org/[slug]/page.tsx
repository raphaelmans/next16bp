import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isSeoIndexableOrganizationSurface } from "@/common/seo-indexability";
import { PublicOrganizationPage } from "@/features/organization/pages/public-organization-page";
import { getOrganizationLandingBySlug } from "@/lib/modules/organization/server/public-organization-page";
import { getCanonicalOrigin } from "@/lib/shared/utils/canonical-origin";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const canonical = `/org/${slug}`;

  try {
    const result = await getOrganizationLandingBySlug(slug);
    const description =
      result.profile?.description ??
      "Explore our venues in the Philippines, see what sports we host, and book your next game in minutes.";
    const hasProfileContent = Boolean(
      result.profile?.description?.trim() ||
        result.profile?.logoUrl?.trim() ||
        result.profile?.contactEmail?.trim() ||
        result.profile?.contactPhone?.trim() ||
        result.profile?.address?.trim(),
    );
    const shouldIndex = isSeoIndexableOrganizationSurface({
      slug: result.organization.slug,
      name: result.organization.name,
      venueCount: result.stats.venueCount,
      totalCourts: result.stats.totalCourts,
      hasProfileContent,
    });

    return {
      title: result.organization.name,
      description,
      alternates: {
        canonical,
      },
      robots: shouldIndex
        ? undefined
        : {
            index: false,
            follow: true,
          },
      openGraph: {
        title: result.organization.name,
        description,
        url: canonical,
        siteName: "KudosCourts",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: result.organization.name,
        description,
      },
    };
  } catch {
    return {
      title: "Organization",
      alternates: {
        canonical,
      },
      openGraph: {
        title: "Organization",
        description: "Discover venues and courts on KudosCourts — Philippines.",
        url: canonical,
        siteName: "KudosCourts",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: "Organization",
        description: "Discover venues and courts on KudosCourts — Philippines.",
      },
    };
  }
}

export default async function OrgSlugPage({ params }: Props) {
  const { slug } = await params;
  const appUrl = getCanonicalOrigin();

  try {
    const landing = await getOrganizationLandingBySlug(slug);

    return <PublicOrganizationPage appUrl={appUrl} landing={landing} />;
  } catch {
    return notFound();
  }
}
