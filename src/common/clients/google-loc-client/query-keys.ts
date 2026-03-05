import { createQueryKeys } from "@lukemorales/query-key-factory";

export const googleLocQueryKeys = createQueryKeys("googleLoc", {
  all: null,
  preview: (url: string) => [url],
  nearby: (args: {
    lat: number;
    lng: number;
    radius?: number;
    max?: number;
  }) => [args.lat, args.lng, args.radius, args.max],
  geocode: (address: string) => [address],
});
