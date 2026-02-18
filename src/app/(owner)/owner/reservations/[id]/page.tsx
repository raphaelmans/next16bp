import OwnerReservationDetailPage from "@/features/owner/pages/owner-reservation-detail-page";

type OwnerReservationDetailRoutePageProps = {
  params: Promise<{ id: string }>;
};

export default async function OwnerReservationDetailRoutePage({
  params,
}: OwnerReservationDetailRoutePageProps) {
  const { id } = await params;
  return <OwnerReservationDetailPage reservationId={id} />;
}
