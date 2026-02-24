import OwnerReservationGroupDetailPage from "@/features/owner/pages/owner-reservation-group-detail-page";

type OwnerReservationGroupDetailRoutePageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function OwnerReservationGroupDetailRoutePage({
  params,
}: OwnerReservationGroupDetailRoutePageProps) {
  const { groupId } = await params;
  return <OwnerReservationGroupDetailPage reservationGroupId={groupId} />;
}
