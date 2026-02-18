import { publicCaller } from "@/trpc/server";

export const getOpenPlayPublicDetail = async (openPlayId: string) => {
  return publicCaller.openPlay.getPublicDetail({ openPlayId });
};
