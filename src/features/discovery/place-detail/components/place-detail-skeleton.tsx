"use client";

import { Container } from "@/components/layout";

export function PlaceDetailSkeleton() {
  return (
    <Container className="pt-4 sm:pt-6">
      <div className="space-y-2 border-b border-border/60 pb-4">
        <div className="flex items-start gap-3.5">
          <div className="h-11 w-11 shrink-0 rounded-full bg-muted animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-7 w-48 rounded bg-muted animate-pulse" />
            <div className="h-4 w-32 rounded bg-muted animate-pulse" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-36 rounded-md bg-muted animate-pulse" />
          <div className="h-8 w-24 rounded-md bg-muted animate-pulse" />
        </div>
      </div>
      <div className="mt-4 lg:hidden">
        <div className="aspect-[16/10] rounded-xl bg-muted animate-pulse" />
      </div>
      <div className="mt-4 grid gap-6 lg:mt-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="hidden h-48 rounded-xl bg-muted animate-pulse lg:block" />
        </div>
        <div className="space-y-4">
          <div className="hidden aspect-[16/10] rounded-xl bg-muted animate-pulse lg:block" />
          <div className="hidden h-64 rounded-xl bg-muted animate-pulse lg:block" />
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-[60] space-y-3 rounded-t-3xl bg-background p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-10px_40px_oklch(0_0_0/0.15)] lg:hidden">
        <div className="flex justify-center pb-1">
          <div className="h-1 w-9 rounded-full bg-muted" />
        </div>
        <div className="h-5 w-40 rounded bg-muted animate-pulse" />
        <div className="flex gap-2">
          <div className="h-9 w-24 rounded-full bg-muted animate-pulse" />
          <div className="h-9 w-20 rounded-full bg-muted animate-pulse" />
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={`day-skel-${String(i)}`}
              className="h-14 w-12 rounded-xl bg-muted animate-pulse"
            />
          ))}
        </div>
        <div className="space-y-2">
          <div className="h-14 rounded-xl bg-muted/50 animate-pulse" />
          <div className="h-14 rounded-xl bg-muted/50 animate-pulse" />
          <div className="h-14 rounded-xl bg-muted/50 animate-pulse" />
        </div>
      </div>
    </Container>
  );
}
