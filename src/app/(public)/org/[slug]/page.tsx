import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicOrganizationPage } from "@/features/organization/pages/public-organization-page";
import {
  getOrganizationBySlugForMetadata,
  getOrganizationLandingBySlug,
} from "@/lib/modules/organization/server/public-organization-page";
import { getCanonicalOrigin } from "@/lib/shared/utils/canonical-origin";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const canonical = `/org/${slug}`;

  try {
    const result = await getOrganizationBySlugForMetadata(slug);
    const description =
      result.profile?.description ??
      "Explore our venues in the Philippines, see what sports we host, and book your next game in minutes.";

    return {
      title: result.organization.name,
      description,
      alternates: {
        canonical,
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
