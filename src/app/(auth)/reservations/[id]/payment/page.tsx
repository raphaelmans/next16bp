import ReservationPaymentPage from "@/features/reservation/pages/reservation-payment-page";

type ReservationPaymentRoutePageProps = {
  params: Promise<{ id: string }>;
};

export default async function ReservationPaymentRoutePage({
  params,
}: ReservationPaymentRoutePageProps) {
  const { id } = await params;
  return <ReservationPaymentPage reservationId={id} />;
}
