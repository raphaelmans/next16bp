"use client";

import { Copy, Download, MapPin, QrCode, Share2 } from "lucide-react";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import { useEffect, useMemo, useRef, useState } from "react";
import { appRoutes } from "@/common/app-routes";
import { toast } from "@/common/toast";
import { copyToClipboard } from "@/common/utils/clipboard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { env } from "@/lib/env";

type VenueQrCodeDialogProps = {
  venueName: string;
  venueSlugOrId: string;
  venueAddress?: string;
  venueCity?: string;
  venueSports?: string[];
  venueCourtCount?: number;
};

const QR_SIZE = 280;
const LOGO_SIZE = 48;
const QR_IMAGE_SETTINGS = {
  src: "/logo.png",
  height: LOGO_SIZE,
  width: LOGO_SIZE,
  excavate: true,
} as const;

const createBaseFileName = (venueName: string) => {
  const normalized = venueName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return normalized ? `${normalized}-venue-qr` : "venue-qr";
};

const triggerBlobDownload = (blob: Blob, fileName: string) => {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = fileName;
  link.rel = "noopener noreferrer";

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 2000);
};

const isShareAbortError = (error: unknown) =>
  error instanceof Error && error.name === "AbortError";

const canvasToPngBlob = (canvas: HTMLCanvasElement) => {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, "image/png");
  });
};

export function VenueQrCodeDialog({
  venueName,
  venueSlugOrId,
  venueAddress,
  venueCity,
  venueSports,
  venueCourtCount,
}: VenueQrCodeDialogProps) {
  const canvasWrapperRef = useRef<HTMLDivElement | null>(null);
  const svgWrapperRef = useRef<HTMLDivElement | null>(null);
  const [clientOrigin, setClientOrigin] = useState<string | null>(null);

  useEffect(() => {
    setClientOrigin(window.location.origin);
  }, []);

  const publicPath = appRoutes.places.detail(venueSlugOrId);

  const publicUrl = useMemo(() => {
    const baseUrl = env.NEXT_PUBLIC_APP_URL ?? clientOrigin;

    if (!baseUrl) {
      return publicPath;
    }

    try {
      return new URL(publicPath, baseUrl).toString();
    } catch {
      return publicPath;
    }
  }, [clientOrigin, publicPath]);

  const baseFileName = createBaseFileName(venueName);
  const qrTitle = `QR code for ${venueName}`;

  const getCanvasElement = () => {
    return canvasWrapperRef.current?.querySelector("canvas") ?? null;
  };

  const getSvgElement = () => {
    return svgWrapperRef.current?.querySelector("svg") ?? null;
  };

  const getPngBlob = async () => {
    const canvasElement = getCanvasElement();

    if (!canvasElement) {
      return null;
    }

    return canvasToPngBlob(canvasElement);
  };

  const handleCopyLink = async () => {
    await copyToClipboard(publicUrl, "Venue link");
  };

  const handleDownloadPng = async () => {
    const pngBlob = await getPngBlob();

    if (!pngBlob) {
      toast.error("Unable to download PNG right now");
      return;
    }

    try {
      triggerBlobDownload(pngBlob, `${baseFileName}.png`);
    } catch {
      const fallbackUrl = URL.createObjectURL(pngBlob);
      window.open(fallbackUrl, "_blank", "noopener,noreferrer");
      window.setTimeout(() => {
        URL.revokeObjectURL(fallbackUrl);
      }, 2000);
    }
  };

  const handleDownloadSvg = () => {
    const svgElement = getSvgElement();

    if (!svgElement) {
      toast.error("Unable to download SVG right now");
      return;
    }

    const serialized = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([serialized], {
      type: "image/svg+xml;charset=utf-8",
    });

    try {
      triggerBlobDownload(svgBlob, `${baseFileName}.svg`);
    } catch {
      const fallbackUrl = URL.createObjectURL(svgBlob);
      window.open(fallbackUrl, "_blank", "noopener,noreferrer");
      window.setTimeout(() => {
        URL.revokeObjectURL(fallbackUrl);
      }, 2000);
    }
  };

  const handleShare = async () => {
    if (typeof navigator.share !== "function") {
      await copyToClipboard(publicUrl, "Venue link");
      return;
    }

    const shareText = `View ${venueName} on Kudos Courts`;
    const pngBlob = await getPngBlob();

    if (pngBlob) {
      const pngFile = new File([pngBlob], `${baseFileName}.png`, {
        type: "image/png",
      });

      if (
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [pngFile] })
      ) {
        try {
          await navigator.share({
            title: venueName,
            text: shareText,
            files: [pngFile],
            url: publicUrl,
          });
          return;
        } catch (error) {
          if (isShareAbortError(error)) {
            return;
          }
        }
      }
    }

    try {
      await navigator.share({
        title: venueName,
        text: shareText,
        url: publicUrl,
      });
    } catch (error) {
      if (isShareAbortError(error)) {
        return;
      }

      await copyToClipboard(publicUrl, "Venue link");
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <QrCode className="mr-2 h-4 w-4" />
          QR Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{venueName}</DialogTitle>
          <DialogDescription>
            Scan this QR code to open the public venue page.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="overflow-hidden rounded-lg border bg-white">
            <div className="h-1.5 bg-gradient-to-r from-teal-700 to-teal-500" />

            <div className="px-4 pt-4 pb-3">
              <div ref={canvasWrapperRef} className="mx-auto w-fit">
                <QRCodeCanvas
                  value={publicUrl}
                  size={QR_SIZE}
                  level="H"
                  marginSize={4}
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                  title={qrTitle}
                  imageSettings={QR_IMAGE_SETTINGS}
                />
              </div>
              <div ref={svgWrapperRef} className="hidden" aria-hidden>
                <QRCodeSVG
                  value={publicUrl}
                  size={QR_SIZE}
                  level="H"
                  marginSize={4}
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                  title={qrTitle}
                  imageSettings={QR_IMAGE_SETTINGS}
                />
              </div>
            </div>

            <div className="space-y-1.5 border-t bg-stone-50 px-4 py-3">
              <p className="font-heading text-sm font-semibold text-stone-900">
                {venueName}
              </p>
              {venueAddress && (
                <p className="flex items-start gap-1 text-xs text-stone-500">
                  <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                  <span>
                    {venueAddress}
                    {venueCity ? `, ${venueCity}` : ""}
                  </span>
                </p>
              )}
              {((venueSports && venueSports.length > 0) ||
                (venueCourtCount != null && venueCourtCount > 0)) && (
                <p className="text-xs text-stone-400">
                  {venueSports && venueSports.length > 0
                    ? venueSports.join(", ")
                    : ""}
                  {venueSports &&
                    venueSports.length > 0 &&
                    venueCourtCount != null &&
                    venueCourtCount > 0 &&
                    " · "}
                  {venueCourtCount != null && venueCourtCount > 0
                    ? `${venueCourtCount} ${venueCourtCount === 1 ? "court" : "courts"}`
                    : ""}
                </p>
              )}
              <div className="flex items-center justify-center gap-1.5 pt-1">
                <div className="h-px flex-1 bg-stone-200" />
                <span className="font-heading text-[10px] font-semibold tracking-wider text-stone-300 uppercase">
                  KudosCourts
                </span>
                <div className="h-px flex-1 bg-stone-200" />
              </div>
            </div>
          </div>

          <div className="rounded-md border bg-muted/20 p-3">
            <p className="text-xs font-medium text-muted-foreground">
              Public link
            </p>
            <p className="mt-1 break-all text-xs font-mono text-foreground">
              {publicUrl}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Link
            </Button>

            <div className="flex flex-wrap gap-2 sm:justify-end">
              <Button variant="outline" size="sm" onClick={handleDownloadPng}>
                <Download className="mr-2 h-4 w-4" />
                PNG
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadSvg}>
                <Download className="mr-2 h-4 w-4" />
                SVG
              </Button>
              <Button size="sm" onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
