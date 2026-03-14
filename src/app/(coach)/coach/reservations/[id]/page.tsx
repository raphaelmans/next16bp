import { CoachReservationDetailPage } from "@/features/coach/pages/coach-reservation-detail-page";

export default async function CoachReservationDetailRoutePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  return <CoachReservationDetailPage reservationId={id} />;
}
