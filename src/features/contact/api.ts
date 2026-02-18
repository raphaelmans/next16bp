"use client";

import type { AppError } from "@/common/errors/app-error";
import { toAppError as defaultToAppError } from "@/common/errors/to-app-error";
import { callTrpcMutation } from "@/common/trpc-client-call";
import { getClientApi, type TrpcClientApi } from "@/trpc/client-api";

export interface IContactApi {
  mutContactSubmit: (input?: unknown) => Promise<unknown>;
}

export type ContactApiDeps = {
  clientApi?: TrpcClientApi;
  toAppError?: (err: unknown) => AppError;
};

export class ContactApi implements IContactApi {
  readonly clientApi: TrpcClientApi;
  private readonly toAppError: (err: unknown) => AppError;

  constructor(deps: ContactApiDeps = {}) {
    this.clientApi = deps.clientApi ?? getClientApi();
    this.toAppError = deps.toAppError ?? defaultToAppError;
  }

  mutContactSubmit = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["contact", "submit"],
      input,
      this.toAppError,
    );
}

export const createContactApi = (deps: ContactApiDeps = {}): IContactApi =>
  new ContactApi(deps);

const CONTACT_API_SINGLETON = createContactApi();

export const getContactApi = (): IContactApi => CONTACT_API_SINGLETON;
