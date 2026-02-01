import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type HeadingProps = ComponentPropsWithoutRef<"h1">;
type TextProps = ComponentPropsWithoutRef<"p">;
type ListProps = ComponentPropsWithoutRef<"ul">;
type AnchorProps = ComponentPropsWithoutRef<"a">;

const components = {
  h1: ({ className, ...props }: HeadingProps) => (
    <h1
      className={cn(
        "font-heading text-3xl font-bold tracking-tight",
        className,
      )}
      {...props}
    />
  ),
  h2: ({ className, ...props }: ComponentPropsWithoutRef<"h2">) => (
    <h2
      className={cn(
        "font-heading text-lg font-semibold text-foreground mt-8 scroll-mt-24",
        className,
      )}
      {...props}
    />
  ),
  h3: ({ className, ...props }: ComponentPropsWithoutRef<"h3">) => (
    <h3
      className={cn(
        "font-heading text-base font-semibold text-foreground mt-6 scroll-mt-24",
        className,
      )}
      {...props}
    />
  ),
  p: ({ className, ...props }: TextProps) => (
    <p
      className={cn("text-sm leading-6 text-muted-foreground", className)}
      {...props}
    />
  ),
  ul: ({ className, ...props }: ListProps) => (
    <ul
      className={cn(
        "ml-5 list-disc space-y-2 text-sm text-muted-foreground",
        className,
      )}
      {...props}
    />
  ),
  ol: ({ className, ...props }: ComponentPropsWithoutRef<"ol">) => (
    <ol
      className={cn(
        "ml-5 list-decimal space-y-2 text-sm text-muted-foreground",
        className,
      )}
      {...props}
    />
  ),
  li: ({ className, ...props }: ComponentPropsWithoutRef<"li">) => (
    <li className={cn("pl-1", className)} {...props} />
  ),
  a: ({ className, href, ...props }: AnchorProps) => {
    const resolvedHref = href ?? "#";
    const isInternal = resolvedHref.startsWith("/");

    const classes = cn(
      "text-foreground underline underline-offset-4 decoration-muted-foreground/40 hover:decoration-muted-foreground",
      className,
    );

    if (isInternal) {
      return <Link className={classes} href={resolvedHref} {...props} />;
    }

    return (
      <a
        className={classes}
        href={resolvedHref}
        rel="noopener noreferrer"
        target="_blank"
        {...props}
      />
    );
  },
} satisfies MDXComponents;

export function useMDXComponents(): MDXComponents {
  return components;
}
