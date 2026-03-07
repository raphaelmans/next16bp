import {
  type PlayerReservationStep,
  parsePlayerReservationStep,
} from "@/common/reservation-links";
import ReservationDetailPage from "@/features/reservation/pages/reservation-detail-page";

type ReservationDetailRoutePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ReservationDetailRoutePage({
  params,
  searchParams,
}: ReservationDetailRoutePageProps) {
  const { id } = await params;
  const queryParams = await searchParams;
  const rawStep = Array.isArray(queryParams.step)
    ? queryParams.step[0]
    : queryParams.step;
  const initialStep: PlayerReservationStep | undefined =
    parsePlayerReservationStep(rawStep);

  return <ReservationDetailPage reservationId={id} initialStep={initialStep} />;
}
