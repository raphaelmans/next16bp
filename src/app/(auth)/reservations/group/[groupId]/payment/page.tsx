import ReservationGroupPaymentPage from "@/features/reservation/pages/reservation-group-payment-page";

type ReservationGroupPaymentRoutePageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function ReservationGroupPaymentRoutePage({
  params,
}: ReservationGroupPaymentRoutePageProps) {
  const { groupId } = await params;
  return <ReservationGroupPaymentPage reservationGroupId={groupId} />;
}
