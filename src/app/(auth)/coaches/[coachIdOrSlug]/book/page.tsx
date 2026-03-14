import CoachBookingPage from "@/features/coach-discovery/pages/coach-booking-page";

type CoachBookRoutePageProps = {
  params: Promise<{ coachIdOrSlug: string }>;
};

export default async function CoachBookRoutePage({
  params,
}: CoachBookRoutePageProps) {
  const { coachIdOrSlug } = await params;
  return <CoachBookingPage coachIdOrSlug={coachIdOrSlug} />;
}
