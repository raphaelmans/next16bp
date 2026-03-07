import { Container } from "@/components/layout";
import { ReservationDetailSkeleton } from "@/features/reservation/components/skeletons/reservation-detail-skeleton";

export default function ReservationDetailLoading() {
  return (
    <Container className="py-6">
      <ReservationDetailSkeleton />
    </Container>
  );
}
