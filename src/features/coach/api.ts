"use client";

import type { AppError } from "@/common/errors/app-error";
import { toAppError as defaultToAppError } from "@/common/errors/to-app-error";
import { callTrpcQuery } from "@/common/trpc-client-call";
import { getClientApi, type TrpcClientApi } from "@/trpc/client-api";

type ProcedureFn<TProcedure> = TProcedure extends (
  input: infer TInput,
  ...rest: infer _TRest
) => Promise<infer TResult>
  ? (input?: TInput) => Promise<TResult>
  : never;

export interface ICoachApi {
  queryCoachGetSetupStatus: ProcedureFn<
    TrpcClientApi["coach"]["getSetupStatus"]["query"]
  >;
}

export type CoachApiDeps = {
  clientApi?: TrpcClientApi;
  toAppError?: (err: unknown) => AppError;
};

export class CoachApi implements ICoachApi {
  readonly clientApi: TrpcClientApi;
  private readonly toAppError: (err: unknown) => AppError;

  constructor(deps: CoachApiDeps = {}) {
    this.clientApi = deps.clientApi ?? getClientApi();
    this.toAppError = deps.toAppError ?? defaultToAppError;
  }

  queryCoachGetSetupStatus: ProcedureFn<
    TrpcClientApi["coach"]["getSetupStatus"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["coach", "getSetupStatus"],
      (clientApi) => clientApi.coach.getSetupStatus.query,
      input,
      this.toAppError,
    );
}

export const createCoachApi = (deps: CoachApiDeps = {}) => new CoachApi(deps);

const COACH_API_SINGLETON = createCoachApi();

export const getCoachApi = () => COACH_API_SINGLETON;
