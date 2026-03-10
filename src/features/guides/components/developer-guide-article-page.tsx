"use client";

import { DEVELOPER_GUIDE_SECTIONS } from "@/features/guides/components/developer-guide-content";
import { getDeveloperGuideSnippetForSection } from "@/features/guides/components/developer-guide-snippets";
import { InteractiveGuideArticlePage } from "@/features/guides/components/interactive-guide-article-page";

export function DeveloperGuideArticlePage({
  header,
  footer,
}: {
  header?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <InteractiveGuideArticlePage
      sections={DEVELOPER_GUIDE_SECTIONS}
      getSnippetForSection={getDeveloperGuideSnippetForSection}
      header={header}
      footer={footer}
    />
  );
}
