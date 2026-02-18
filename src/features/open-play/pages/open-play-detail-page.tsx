import OpenPlayDetailPageView from "@/features/open-play/components/open-play-detail-page-view";

interface OpenPlayDetailPageProps {
  openPlayId: string;
}

export function OpenPlayDetailPage({ openPlayId }: OpenPlayDetailPageProps) {
  return <OpenPlayDetailPageView openPlayId={openPlayId} />;
}
