"use client";

import type { AppError } from "@/common/errors/app-error";
import { toAppError as defaultToAppError } from "@/common/errors/to-app-error";
import { callTrpcMutation, callTrpcQuery } from "@/common/trpc-client-call";
import { getClientApi, type TrpcClientApi } from "@/trpc/client-api";

type ProcedureFn<TProcedure> = TProcedure extends (
  input: infer TInput,
  ...rest: infer _TRest
) => Promise<infer TResult>
  ? (input?: TInput) => Promise<TResult>
  : never;

export type CourtSubmissionApiDeps = {
  clientApi?: TrpcClientApi;
  toAppError?: (err: unknown) => AppError;
};

export class CourtSubmissionApi {
  readonly clientApi: TrpcClientApi;
  private readonly toAppError: (err: unknown) => AppError;

  constructor(deps: CourtSubmissionApiDeps = {}) {
    this.clientApi = deps.clientApi ?? getClientApi();
    this.toAppError = deps.toAppError ?? defaultToAppError;
  }

  mutSubmitCourt: ProcedureFn<
    TrpcClientApi["courtSubmission"]["submit"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["courtSubmission", "submit"],
      (clientApi) => clientApi.courtSubmission.submit.mutate,
      input,
      this.toAppError,
    );

  queryMySubmissions: ProcedureFn<
    TrpcClientApi["courtSubmission"]["getMySubmissions"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["courtSubmission", "getMySubmissions"],
      (clientApi) => clientApi.courtSubmission.getMySubmissions.query,
      input,
      this.toAppError,
    );

  mutUploadSubmissionPhoto: ProcedureFn<
    TrpcClientApi["courtSubmission"]["uploadSubmissionPhoto"]["mutate"]
  > = async (input) =>
    callTrpcMutation(
      this.clientApi,
      ["courtSubmission", "uploadSubmissionPhoto"],
      (clientApi) => clientApi.courtSubmission.uploadSubmissionPhoto.mutate,
      input,
      this.toAppError,
    );

  queryParseGoogleMapsLink: ProcedureFn<
    TrpcClientApi["courtSubmission"]["parseGoogleMapsLink"]["query"]
  > = async (input) =>
    callTrpcQuery(
      this.clientApi,
      ["courtSubmission", "parseGoogleMapsLink"],
      (clientApi) => clientApi.courtSubmission.parseGoogleMapsLink.query,
      input,
      this.toAppError,
    );
}

export const createCourtSubmissionApi = (deps: CourtSubmissionApiDeps = {}) =>
  new CourtSubmissionApi(deps);

const COURT_SUBMISSION_API_SINGLETON = createCourtSubmissionApi();

export const getCourtSubmissionApi = () => COURT_SUBMISSION_API_SINGLETON;
