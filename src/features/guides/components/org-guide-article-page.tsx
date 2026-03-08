"use client";

import { InteractiveGuideArticlePage } from "@/features/guides/components/interactive-guide-article-page";
import { ORG_GUIDE_SECTIONS } from "@/features/guides/components/org-guide-content";
import { getSnippetForSection } from "@/features/guides/components/org-guide-snippets";

export function OrgGuideArticlePage({
  header,
  footer,
}: {
  header?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <InteractiveGuideArticlePage
      sections={ORG_GUIDE_SECTIONS}
      getSnippetForSection={getSnippetForSection}
      header={header}
      footer={footer}
    />
  );
}
