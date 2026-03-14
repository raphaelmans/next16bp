import CoachBookingPage from "@/features/coach-discovery/pages/coach-booking-page";

type CoachBookRoutePageProps = {
  params: Promise<{ id: string }>;
};

export default async function CoachBookRoutePage({
  params,
}: CoachBookRoutePageProps) {
  const { id } = await params;
  return <CoachBookingPage coachIdOrSlug={id} />;
}
