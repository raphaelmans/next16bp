import { Container } from "@/components/layout";

export default function CoachesLoading() {
  return (
    <Container className="space-y-4 pt-6">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(340px,0.95fr)]">
        <div className="h-64 rounded-2xl border bg-card" />
        <div className="h-64 rounded-2xl border bg-card" />
      </div>
      <div className="h-44 rounded-2xl border bg-card" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
            key={index}
            className="h-[420px] rounded-2xl border bg-card"
          />
        ))}
      </div>
    </Container>
  );
}
