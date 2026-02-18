import ReservationDetailPage from "@/features/reservation/pages/reservation-detail-page";

type ReservationDetailRoutePageProps = {
  params: Promise<{ id: string }>;
};

export default async function ReservationDetailRoutePage({
  params,
}: ReservationDetailRoutePageProps) {
  const { id } = await params;
  return <ReservationDetailPage reservationId={id} />;
}
