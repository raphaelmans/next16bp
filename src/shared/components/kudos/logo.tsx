"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface KudosLogoProps
  extends Omit<
    React.ComponentProps<typeof Image>,
    "alt" | "height" | "src" | "width"
  > {
  size?: number;
  variant?: "full" | "icon";
  alt?: string;
}

export function KudosLogo({
  size = 48,
  variant = "icon",
  className,
  ...props
}: KudosLogoProps) {
  if (variant === "full") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <KudosLogoIcon size={size} />
        <span
          className="font-heading font-bold text-foreground"
          style={{ fontSize: size * 0.5 }}
        >
          KudosCourts
        </span>
      </div>
    );
  }

  return <KudosLogoIcon size={size} className={className} {...props} />;
}

function KudosLogoIcon({
  size = 48,
  className,
  alt,
  unoptimized = true,
  ...props
}: Omit<KudosLogoProps, "variant">) {
  return (
    <Image
      src="/logo-svg.svg"
      width={size}
      height={size}
      alt={alt ?? "KudosCourts"}
      unoptimized={unoptimized}
      className={cn("shrink-0", className)}
      {...props}
    />
  );
}

export { KudosLogoIcon };
