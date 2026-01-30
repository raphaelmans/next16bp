"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const MIN_THUMB_WIDTH = 28;

interface MobileScrollThumbProps {
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

export function MobileScrollThumb({ scrollRef }: MobileScrollThumbProps) {
  const [thumbWidth, setThumbWidth] = React.useState(0);
  const [thumbLeft, setThumbLeft] = React.useState(0);
  const [visible, setVisible] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const dragStartX = React.useRef(0);
  const dragStartScrollTop = React.useRef(0);
  const trackRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const update = () => {
      const { scrollHeight, clientHeight, scrollTop } = el;
      const overflows = scrollHeight > clientHeight;
      setVisible(overflows);
      if (overflows) {
        const trackWidth = trackRef.current?.clientWidth ?? 0;
        const ratio = clientHeight / scrollHeight;
        const w = Math.max(MIN_THUMB_WIDTH, trackWidth * ratio);
        setThumbWidth(w);
        const maxScroll = scrollHeight - clientHeight;
        const maxThumbLeft = trackWidth - w;
        setThumbLeft(
          maxScroll > 0 ? (scrollTop / maxScroll) * maxThumbLeft : 0,
        );
      }
    };

    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);

    el.addEventListener("scroll", update, { passive: true });

    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", update);
    };
  }, [scrollRef]);

  const onPointerDown = React.useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(true);
      dragStartX.current = e.clientX;
      dragStartScrollTop.current = scrollRef.current?.scrollTop ?? 0;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [scrollRef],
  );

  const onPointerMove = React.useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const el = scrollRef.current;
      if (!el) return;

      const { scrollHeight, clientHeight } = el;
      const maxScroll = scrollHeight - clientHeight;
      const trackWidth = trackRef.current?.clientWidth ?? 0;
      const availableTrack = trackWidth - thumbWidth;
      if (availableTrack <= 0) return;

      const deltaX = e.clientX - dragStartX.current;
      const scrollDelta = (deltaX / availableTrack) * maxScroll;
      el.scrollTop = Math.max(
        0,
        Math.min(maxScroll, dragStartScrollTop.current + scrollDelta),
      );
    },
    [dragging, scrollRef, thumbWidth],
  );

  const onPointerUp = React.useCallback(() => {
    setDragging(false);
  }, []);

  if (!visible) return null;

  return (
    <div className="shrink-0 mx-5 mb-1 flex items-center gap-2">
      {/* Left label: up arrow */}
      <svg
        width="10"
        height="10"
        viewBox="0 0 10 10"
        aria-hidden="true"
        className="shrink-0 text-muted-foreground/50"
      >
        <title>Scroll up</title>
        <path d="M5 2 L8.5 7.5 L1.5 7.5 Z" fill="currentColor" />
      </svg>

      {/* Track */}
      <div
        ref={trackRef}
        className="relative h-3.5 flex-1 rounded-full bg-muted/60"
      >
        {/* Thumb */}
        <div
          className={cn(
            "absolute top-0.5 bottom-0.5 rounded-full transition-colors cursor-grab active:cursor-grabbing",
            "flex items-center justify-center",
            dragging
              ? "bg-primary/50 shadow-sm"
              : "bg-primary/25 hover:bg-primary/35",
          )}
          style={{
            width: thumbWidth,
            transform: `translateX(${thumbLeft}px)`,
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {/* Grip lines — vertical dashes hint at vertical scroll */}
          <div className="flex gap-px pointer-events-none">
            <span
              className={cn(
                "block w-px h-1.5 rounded-full",
                dragging ? "bg-primary-foreground/60" : "bg-primary/50",
              )}
            />
            <span
              className={cn(
                "block w-px h-1.5 rounded-full",
                dragging ? "bg-primary-foreground/60" : "bg-primary/50",
              )}
            />
            <span
              className={cn(
                "block w-px h-1.5 rounded-full",
                dragging ? "bg-primary-foreground/60" : "bg-primary/50",
              )}
            />
          </div>
        </div>
      </div>

      {/* Right label: down arrow */}
      <svg
        width="10"
        height="10"
        viewBox="0 0 10 10"
        aria-hidden="true"
        className="shrink-0 text-muted-foreground/50"
      >
        <title>Scroll down</title>
        <path d="M5 8 L1.5 2.5 L8.5 2.5 Z" fill="currentColor" />
      </svg>
    </div>
  );
}
