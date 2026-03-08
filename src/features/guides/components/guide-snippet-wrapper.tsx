export function GuideSnippetWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border/60 bg-muted/30 p-4">
      <p className="mb-3 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60">
        What you will see
      </p>
      <div className="pointer-events-none select-none">{children}</div>
    </div>
  );
}
