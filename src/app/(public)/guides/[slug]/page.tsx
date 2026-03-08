import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { appRoutes } from "@/common/app-routes";
import {
  GUIDE_ENTRIES,
  getGuideBySlug,
} from "@/features/guides/content/guides";
import { GuideArticlePage } from "@/features/guides/pages/guide-article-page";
import { getCanonicalOrigin } from "@/lib/shared/utils/canonical-origin";

type GuidePageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDE_ENTRIES.map((guide) => ({
    slug: guide.slug,
  }));
}

export async function generateMetadata({
  params,
}: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    return {
      title: "Guide",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const appUrl = getCanonicalOrigin();
  const canonicalUrl = new URL(appRoutes.guides.detail(guide.slug), appUrl);

  return {
    title: guide.title,
    description: guide.description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "article",
      title: guide.title,
      description: guide.description,
      url: canonicalUrl,
      publishedTime: guide.publishedAt,
      modifiedTime: guide.updatedAt,
    },
    twitter: {
      title: guide.title,
      description: guide.description,
    },
  };
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    return notFound();
  }

  return <GuideArticlePage guide={guide} />;
}
