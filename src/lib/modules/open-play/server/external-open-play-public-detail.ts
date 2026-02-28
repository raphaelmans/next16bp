import { publicCaller } from "@/trpc/server";

export const getExternalOpenPlayPublicDetail = async (
  externalOpenPlayId: string,
) => {
  return publicCaller.openPlay.getExternalPublicDetail({ externalOpenPlayId });
};
