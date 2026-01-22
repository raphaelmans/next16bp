import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerCaller } from "@/shared/infra/trpc/server";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const caller = await createServerCaller(`/${slug}`);
    const result = await caller.organization.getBySlug({ slug });

    return {
      title: result.organization.name,
      alternates: {
        canonical: `/${slug}`,
      },
    };
  } catch {
    return {
      title: "Organization",
    };
  }
}

export default async function OrgSlugPage({ params }: Props) {
  const { slug } = await params;

  try {
    const caller = await createServerCaller(`/${slug}`);
    const result = await caller.organization.getBySlug({ slug });

    return (
      <main className="container py-10">
        <h1 className="font-heading text-3xl font-bold">
          {result.organization.name}
        </h1>
      </main>
    );
  } catch {
    return notFound();
  }
}
