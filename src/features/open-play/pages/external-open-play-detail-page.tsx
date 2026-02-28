import ExternalOpenPlayDetailPageView from "@/features/open-play/components/external-open-play-detail-page-view";

interface ExternalOpenPlayDetailPageProps {
  externalOpenPlayId: string;
}

export function ExternalOpenPlayDetailPage({
  externalOpenPlayId,
}: ExternalOpenPlayDetailPageProps) {
  return (
    <ExternalOpenPlayDetailPageView externalOpenPlayId={externalOpenPlayId} />
  );
}
