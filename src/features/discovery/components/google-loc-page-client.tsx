"use client";

import { useMemo, useState } from "react";
import { useGoogleLocPreviewMutation } from "@/common/clients/google-loc-client";
import { Container } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

const SAMPLE_URL = "https://maps.app.goo.gl/6AGA5vZkzKazGswRA";

export default function GoogleLocPocPage() {
  const [url, setUrl] = useState(SAMPLE_URL);
  const previewMutation = useGoogleLocPreviewMutation();
  const result = previewMutation.data;
  const errorMessage = previewMutation.error?.message ?? null;
  const isLoading = previewMutation.isPending;

  const canSubmit = url.trim().length > 0;

  const hasEmbed = !!result?.embedSrc;

  const coordinateLabel = useMemo(() => {
    if (!result?.lat || !result?.lng) return "";
    return `${result.lat.toFixed(6)}, ${result.lng.toFixed(6)}`;
  }, [result?.lat, result?.lng]);

  const handlePreview = () => {
    if (!url.trim()) return;
    previewMutation.reset();
    previewMutation.mutate({ url });
  };

  return (
    <Container className="py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            PoC: Google Maps URL → Coordinates → Embed
          </h1>
          <p className="text-sm text-muted-foreground">
            Paste a Google Maps URL (including short links). The server resolves
            redirects and extracts `lat/lng/zoom`, then renders an iframe embed.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Input</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">Google Maps URL</Label>
              <Input
                id="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://maps.app.goo.gl/..."
                inputMode="url"
              />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  If you don’t see a map preview, configure
                  `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY`.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setUrl(SAMPLE_URL)}
                  className="sm:self-end"
                >
                  Use sample
                </Button>
              </div>
            </div>

            <Button
              type="button"
              onClick={handlePreview}
              disabled={!canSubmit || isLoading}
              className="w-full"
            >
              {isLoading && <Spinner />}
              Preview
            </Button>

            {errorMessage && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                {errorMessage}
              </div>
            )}
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Result</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">
                    Resolved URL
                  </div>
                  {result.resolvedUrl ? (
                    <a
                      href={result.resolvedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-primary hover:underline"
                    >
                      {result.resolvedUrl}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">(none)</span>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Suggested name
                    </div>
                    <div>{result.suggestedName ?? "(none)"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Coordinates
                    </div>
                    <div>
                      {coordinateLabel ? (
                        <span className="font-mono">{coordinateLabel}</span>
                      ) : (
                        "(none)"
                      )}
                      {result.zoom !== undefined && (
                        <span className="text-muted-foreground">
                          {" "}
                          · z{result.zoom}
                        </span>
                      )}
                      {result.source && (
                        <span className="text-muted-foreground">
                          {" "}
                          · {result.source}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {result.warnings.length > 0 && (
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
                    <div className="text-xs font-medium">Warnings</div>
                    <ul className="mt-1 list-disc pl-5 text-xs text-muted-foreground">
                      {result.warnings.map((warning: string) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Embed preview</div>
                {hasEmbed ? (
                  <div className="aspect-video overflow-hidden rounded-xl border border-border/60 bg-muted">
                    <iframe
                      title="Google Maps Embed"
                      src={result.embedSrc}
                      className="h-full w-full"
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                ) : (
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-sm text-muted-foreground">
                    No embed available. Set `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY`
                    and try again.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Container>
  );
}
