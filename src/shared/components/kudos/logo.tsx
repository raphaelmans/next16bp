"use client";

import { cn } from "@/lib/utils";

interface KudosLogoProps extends React.ComponentProps<"svg"> {
  size?: number;
  variant?: "full" | "icon";
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
  ...props
}: Omit<KudosLogoProps, "variant">) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      {...props}
    >
      <title>KudosCourts Logo</title>
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "#0F766E" }} />
          <stop offset="100%" style={{ stopColor: "#0D9488" }} />
        </linearGradient>
        <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "#FB923C" }} />
          <stop offset="100%" style={{ stopColor: "#F97316" }} />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="96" fill="url(#bgGrad)" />
      <g transform="translate(96, 96)">
        <rect
          x="0"
          y="0"
          width="320"
          height="320"
          rx="24"
          stroke="white"
          strokeWidth="16"
          fill="rgba(255,255,255,0.1)"
        />
        <line
          x1="0"
          y1="160"
          x2="320"
          y2="160"
          stroke="white"
          strokeWidth="14"
        />
        <line
          x1="0"
          y1="96"
          x2="320"
          y2="96"
          stroke="white"
          strokeWidth="10"
          opacity="0.85"
        />
        <line
          x1="0"
          y1="224"
          x2="320"
          y2="224"
          stroke="white"
          strokeWidth="10"
          opacity="0.85"
        />
        <line
          x1="160"
          y1="0"
          x2="160"
          y2="320"
          stroke="white"
          strokeWidth="8"
          opacity="0.5"
        />
        <circle cx="160" cy="160" r="48" fill="url(#orangeGrad)" />
        <circle cx="160" cy="160" r="24" fill="white" />
      </g>
    </svg>
  );
}

export { KudosLogoIcon };
