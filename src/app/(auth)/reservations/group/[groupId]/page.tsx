import ReservationGroupDetailPage from "@/features/reservation/pages/reservation-group-detail-page";

type ReservationGroupDetailRoutePageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function ReservationGroupDetailRoutePage({
  params,
}: ReservationGroupDetailRoutePageProps) {
  const { groupId } = await params;
  return <ReservationGroupDetailPage reservationGroupId={groupId} />;
}
