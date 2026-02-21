"use client";

import type { AppError } from "@/common/errors/app-error";
import { toAppError as defaultToAppError } from "@/common/errors/to-app-error";
import { callTrpcMutation } from "@/common/trpc-client-call";
import { getClientApi, type TrpcClientApi } from "@/trpc/client-api";

type ProcedureFn<TProcedure> = TProcedure extends (
  input: infer TInput,
  ...rest: infer _TRest
) => Promise<infer TResult>
  ? (input?: TInput) => Promise<TResult>
  : never;

export interface IContactApi {
  mutContactSubmit: ProcedureFn<TrpcClientApi["contact"]["submit"]["mutate"]>;
}

export type ContactApiDeps = {
  clientApi?: TrpcClientApi;
  toAppError?: (err: unknown) => AppError;
};

export class ContactApi {
  readonly clientApi: TrpcClientApi;
  private readonly toAppError: (err: unknown) => AppError;

  constructor(deps: ContactApiDeps = {}) {
    this.clientApi = deps.clientApi ?? getClientApi();
    this.toAppError = deps.toAppError ?? defaultToAppError;
  }

  mutContactSubmit: ProcedureFn<TrpcClientApi["contact"]["submit"]["mutate"]> =
    async (input) =>
      callTrpcMutation(
        this.clientApi,
        ["contact", "submit"],
        (clientApi) => clientApi.contact.submit.mutate,
        input,
        this.toAppError,
      );
}

export const createContactApi = (deps: ContactApiDeps = {}) =>
  new ContactApi(deps);

const CONTACT_API_SINGLETON = createContactApi();

export const getContactApi = () => CONTACT_API_SINGLETON;
