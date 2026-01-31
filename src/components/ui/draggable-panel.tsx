"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DraggablePanelProps {
  children: React.ReactNode;
  header: React.ReactNode;
  className?: string;
  storageKey?: string;
  defaultPosition?: { x: number; y: number };
}

const DEFAULT_POSITION = { x: 24, y: 120 };

export function DraggablePanel({
  children,
  header,
  className,
  storageKey,
  defaultPosition = DEFAULT_POSITION,
}: DraggablePanelProps) {
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = React.useState(defaultPosition);
  const [isDragging, setIsDragging] = React.useState(false);
  const dragOffsetRef = React.useRef({ x: 0, y: 0 });

  React.useEffect(() => {
    if (!storageKey) return;
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as { x: number; y: number };
      setPosition(parsed);
    } catch {
      // Ignore invalid storage
    }
  }, [storageKey]);

  React.useEffect(() => {
    if (!storageKey) return;
    window.localStorage.setItem(storageKey, JSON.stringify(position));
  }, [position, storageKey]);

  React.useEffect(() => {
    if (!isDragging) return;

    const handleMove = (event: PointerEvent) => {
      const panel = panelRef.current;
      if (!panel) return;
      const rect = panel.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width - 12;
      const maxY = window.innerHeight - rect.height - 12;
      const nextX = Math.min(
        Math.max(event.clientX - dragOffsetRef.current.x, 12),
        maxX,
      );
      const nextY = Math.min(
        Math.max(event.clientY - dragOffsetRef.current.y, 12),
        maxY,
      );
      setPosition({ x: nextX, y: nextY });
    };

    const handleUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [isDragging]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const panel = panelRef.current;
    if (!panel) return;
    dragOffsetRef.current = {
      x: event.clientX - position.x,
      y: event.clientY - position.y,
    };
    setIsDragging(true);
  };

  return (
    <div
      ref={panelRef}
      className={cn(
        "fixed z-50 max-w-[360px] w-[320px] bg-card border shadow-md rounded-lg",
        isDragging ? "cursor-grabbing" : "cursor-default",
        className,
      )}
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
    >
      <div
        className="flex items-center justify-between gap-2 border-b px-4 py-3 font-heading text-sm"
        onPointerDown={handlePointerDown}
      >
        {header}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
