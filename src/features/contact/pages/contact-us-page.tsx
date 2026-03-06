import {
  Clock,
  HeartHandshake,
  MapPinned,
  MessageSquareText,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { ContactUsForm } from "../components/contact-us-form";

const HIGHLIGHTS = [
  {
    title: "Response time",
    description: "We reply within 1-2 business days.",
    icon: Clock,
  },
  {
    title: "Venue partnerships",
    description: "Get help listing courts or managing bookings.",
    icon: MapPinned,
  },
  {
    title: "Player support",
    description: "Ask about reservations, availability, or rates.",
    icon: MessageSquareText,
  },
  {
    title: "Community first",
    description: "We build with owners and players in mind.",
    icon: HeartHandshake,
  },
];

export function ContactUsPageView() {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-20 left-1/2 h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-32 -left-20 h-[320px] w-[320px] rounded-full bg-primary/10 blur-3xl" />
      </div>

      <section className="py-10 sm:py-14">
        <Container size="xl">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur">
                <span className="font-heading font-semibold text-foreground">
                  Contact KudosCourts
                </span>
                <span>·</span>
                <span>Support & partnerships</span>
              </div>

              <div className="space-y-3">
                <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                  Let&apos;s talk about your courts
                </h1>
                <p className="text-base text-muted-foreground sm:text-lg">
                  Send us a message and our team will follow up with next steps
                  on listings, partnerships, or booking support.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {HIGHLIGHTS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="rounded-xl border border-border/60 bg-card/80 p-4 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-heading text-sm font-semibold">
                            {item.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <ContactUsForm />
          </div>
        </Container>
      </section>
    </div>
  );
}
