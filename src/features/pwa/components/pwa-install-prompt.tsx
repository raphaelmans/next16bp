"use client";

import { Download, Share, SquarePlus, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/features/pwa/hooks/use-install-prompt";

const DISMISS_KEY = "kudos.pwa-install-dismissed";
const SHOW_DELAY_MS = 5000;

export function PwaInstallPrompt() {
  const { canInstall, isInstalled, isIOS, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(true);
  const [delayPassed, setDelayPassed] = useState(false);
  const [showIOSSteps, setShowIOSSteps] = useState(false);

  useEffect(() => {
    const wasDismissed = localStorage.getItem(DISMISS_KEY);
    if (!wasDismissed) {
      setDismissed(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDelayPassed(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, "true");
  }, []);

  const handleInstall = useCallback(async () => {
    const accepted = await promptInstall();
    if (accepted) {
      handleDismiss();
    }
  }, [promptInstall, handleDismiss]);

  const isVisible =
    !isInstalled && !dismissed && delayPassed && (canInstall || isIOS);

  return (
    <>
      {isVisible && (
        <div
          className="fixed bottom-14 left-0 right-0 z-40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:bottom-0 animate-in slide-in-from-bottom-20 fade-in duration-300"
        >
          <div className="mx-auto max-w-md rounded-xl border border-border/60 bg-background/80 shadow-lg shadow-black/5 backdrop-blur-xl">
            <div className="relative flex items-start gap-3 p-3">
              {/* Dismiss */}
              <button
                type="button"
                onClick={handleDismiss}
                className="absolute top-2 right-2 grid h-6 w-6 place-items-center rounded-full text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
                <span className="sr-only">Dismiss</span>
              </button>

              {/* App icon */}
              <div className="shrink-0 overflow-hidden rounded-xl border border-border/40 shadow-sm">
                <Image
                  src="/icons/icon-192x192.png"
                  alt="KudosCourts"
                  width={48}
                  height={48}
                  className="block"
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pr-5">
                <p className="font-heading text-sm font-semibold leading-tight">
                  Install KudosCourts
                </p>
                <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                  Get instant access from your home screen
                </p>

                {isIOS ? (
                  <IOSContent
                    showSteps={showIOSSteps}
                    onShowSteps={() => setShowIOSSteps(true)}
                    onDismiss={handleDismiss}
                  />
                ) : (
                  <div className="mt-2.5 flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      onClick={handleInstall}
                      className="h-8 rounded-lg px-4 text-xs font-semibold"
                    >
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                      Install App
                    </Button>
                    <button
                      type="button"
                      onClick={handleDismiss}
                      className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Not now
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function IOSContent({
  showSteps,
  onShowSteps,
  onDismiss,
}: {
  showSteps: boolean;
  onShowSteps: () => void;
  onDismiss: () => void;
}) {
  if (!showSteps) {
    return (
      <div className="mt-2.5 flex items-center justify-end gap-2">
        <Button
          size="sm"
          onClick={onShowSteps}
          className="h-8 rounded-lg px-4 text-xs font-semibold"
        >
          Show Me How
        </Button>
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Not now
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2.5 space-y-2.5">
      <ol className="space-y-1.5">
        <li className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
            <Share className="h-3.5 w-3.5" />
          </span>
          <span>
            Tap <strong className="font-semibold text-foreground">Share</strong>{" "}
            in the toolbar
          </span>
        </li>
        <li className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
            <SquarePlus className="h-3.5 w-3.5" />
          </span>
          <span>
            Select{" "}
            <strong className="font-semibold text-foreground">
              Add to Home Screen
            </strong>
          </span>
        </li>
        <li className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
            <span className="text-[11px] font-bold leading-none">+</span>
          </span>
          <span>
            Tap <strong className="font-semibold text-foreground">Add</strong>{" "}
            to confirm
          </span>
        </li>
      </ol>
      <button
        type="button"
        onClick={onDismiss}
        className="text-xs font-medium text-primary transition-colors hover:text-primary/80"
      >
        Got it, thanks
      </button>
    </div>
  );
}
