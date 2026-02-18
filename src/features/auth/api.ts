"use client";

import type { AppError } from "@/common/errors/app-error";
import { toAppError as defaultToAppError } from "@/common/errors/to-app-error";
import { callTrpcMutation, callTrpcQuery } from "@/common/trpc-client-call";
import { getClientApi, type TrpcClientApi } from "@/trpc/client-api";

export interface IAuthApi {
  mutAuthLogin: (input?: unknown) => Promise<unknown>;
  mutAuthLoginWithGoogle: (input?: unknown) => Promise<unknown>;
  mutAuthLoginWithMagicLink: (input?: unknown) => Promise<unknown>;
  mutAuthLogout: (input?: unknown) => Promise<unknown>;
  mutAuthRegister: (input?: unknown) => Promise<unknown>;
  mutAuthRequestEmailOtp: (input?: unknown) => Promise<unknown>;
  mutAuthResendSignUpOtp: (input?: unknown) => Promise<unknown>;
  mutAuthVerifyEmailOtp: (input?: unknown) => Promise<unknown>;
  mutAuthVerifySignUpOtp: (input?: unknown) => Promise<unknown>;
  mutUserPreferenceSetDefaultPortal: (input?: unknown) => Promise<unknown>;
  queryAuthMe: (input?: unknown) => Promise<unknown>;
  queryOrganizationMy: (input?: unknown) => Promise<unknown>;
}

export type AuthApiDeps = {
  clientApi?: TrpcClientApi;
  toAppError?: (err: unknown) => AppError;
};

export class AuthApi implements IAuthApi {
  readonly clientApi: TrpcClientApi;
  private readonly toAppError: (err: unknown) => AppError;

  constructor(deps: AuthApiDeps = {}) {
    this.clientApi = deps.clientApi ?? getClientApi();
    this.toAppError = deps.toAppError ?? defaultToAppError;
  }

  mutAuthLogin = async (input?: unknown) =>
    callTrpcMutation(this.clientApi, ["auth", "login"], input, this.toAppError);

  mutAuthLoginWithGoogle = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["auth", "loginWithGoogle"],
      input,
      this.toAppError,
    );

  mutAuthLoginWithMagicLink = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["auth", "loginWithMagicLink"],
      input,
      this.toAppError,
    );

  mutAuthLogout = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["auth", "logout"],
      input,
      this.toAppError,
    );

  mutAuthRegister = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["auth", "register"],
      input,
      this.toAppError,
    );

  mutAuthRequestEmailOtp = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["auth", "requestEmailOtp"],
      input,
      this.toAppError,
    );

  mutAuthResendSignUpOtp = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["auth", "resendSignUpOtp"],
      input,
      this.toAppError,
    );

  mutAuthVerifyEmailOtp = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["auth", "verifyEmailOtp"],
      input,
      this.toAppError,
    );

  mutAuthVerifySignUpOtp = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["auth", "verifySignUpOtp"],
      input,
      this.toAppError,
    );

  mutUserPreferenceSetDefaultPortal = async (input?: unknown) =>
    callTrpcMutation(
      this.clientApi,
      ["userPreference", "setDefaultPortal"],
      input,
      this.toAppError,
    );

  queryAuthMe = async (input?: unknown) =>
    callTrpcQuery(this.clientApi, ["auth", "me"], input, this.toAppError);

  queryOrganizationMy = async (input?: unknown) =>
    callTrpcQuery(
      this.clientApi,
      ["organization", "my"],
      input,
      this.toAppError,
    );
}

export const createAuthApi = (deps: AuthApiDeps = {}): IAuthApi =>
  new AuthApi(deps);

const AUTH_API_SINGLETON = createAuthApi();

export const getAuthApi = (): IAuthApi => AUTH_API_SINGLETON;
