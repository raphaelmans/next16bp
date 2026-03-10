import { KudosLogo } from "@/components/kudos";

export default function RootLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <KudosLogo size={56} variant="icon" className="animate-pulse" />
    </div>
  );
}
