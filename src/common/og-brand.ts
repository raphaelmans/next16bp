/**
 * Brand hex constants for OG image generation.
 *
 * OG images are server-rendered via Satori (next/og ImageResponse) and cannot
 * use CSS variables. Hex constants here are the documented exception (AC-2).
 */
export const OG_BRAND = {
  /** Primary teal — gradient start */
  teal: "#0D9488",
  /** Primary teal dark — gradient end */
  tealDark: "#0F766E",
  /** Accent orange — CTA / accent bar start */
  orange: "#F97316",
  /** Accent orange light — accent bar end */
  orangeLight: "#FB923C",
  /** Warm off-white — background / SVG text fill */
  background: "#FAF9F7",
  /** Stone dark — foreground text */
  foreground: "#1C1917",
} as const;

/** Reusable gradient strings built from brand tokens. */
export const OG_GRADIENTS = {
  /** Teal gradient for hero backgrounds */
  tealBg: `linear-gradient(135deg, ${OG_BRAND.tealDark} 0%, ${OG_BRAND.teal} 100%)`,
  /** Orange accent bar */
  accentBar: `linear-gradient(90deg, ${OG_BRAND.orangeLight} 0%, ${OG_BRAND.orange} 100%)`,
} as const;
