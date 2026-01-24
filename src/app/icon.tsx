import { ImageResponse } from "next/og";

// Icon metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

// Icon generation - KudosCourts logo
export default function Icon() {
  return new ImageResponse(
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 375 375"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>KudosCourts</title>
      <rect width="375" height="375" fill="#0d9488" />
      <g fill="#fafaf9" transform="translate(99.06738 280.162856)">
        <path d="M 124.1875 0 L 52.4375 -92.328125 L 121.921875 -177.125 L 170.59375 -177.125 L 92.328125 -85.046875 L 92.328125 -101.109375 L 173.109375 0 Z M 17.0625 0 L 17.0625 -177.125 L 56.453125 -177.125 L 56.453125 0 Z M 17.0625 0 " />
      </g>
    </svg>,
    {
      ...size,
    },
  );
}
