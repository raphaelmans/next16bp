import * as React from "react";

/**
 * Disambiguates touch-scroll from touch-interact by requiring a short hold
 * before committing to interaction. Mouse/pen events fire instantly.
 */
export function useTouchIntent(opts: {
  holdMs?: number;
  movePx?: number;
  onConfirm: (e: React.PointerEvent) => void;
}) {
  const { holdMs = 150, movePx = 10, onConfirm } = opts;
  const pending = React.useRef<{
    timer: ReturnType<typeof setTimeout>;
    startX: number;
    startY: number;
    event: React.PointerEvent;
  } | null>(null);

  const cancel = React.useCallback(() => {
    if (pending.current) {
      clearTimeout(pending.current.timer);
      pending.current = null;
    }
  }, []);

  const onPointerDown = React.useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType !== "touch") {
        onConfirm(e);
        return;
      }
      cancel();
      const timer = setTimeout(() => {
        if (pending.current) {
          const evt = pending.current.event;
          pending.current = null;
          onConfirm(evt);
        }
      }, holdMs);
      pending.current = {
        timer,
        startX: e.clientX,
        startY: e.clientY,
        event: e,
      };
    },
    [onConfirm, holdMs, cancel],
  );

  const onPointerMove = React.useCallback(
    (e: React.PointerEvent) => {
      if (!pending.current) return;
      const dx = e.clientX - pending.current.startX;
      const dy = e.clientY - pending.current.startY;
      if (dx * dx + dy * dy > movePx * movePx) {
        cancel();
      }
    },
    [movePx, cancel],
  );

  // Clean up on unmount
  React.useEffect(() => cancel, [cancel]);

  return { onPointerDown, onPointerMove, cancel };
}
