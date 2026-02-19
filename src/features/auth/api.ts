"use client";

import type { AppError } from "@/common/errors/app-error";
import { toAppError as defaultToAppError } from "@/common/errors/to-app-error";
import { callTrpcMutation, callTrpcQuery } from "@/common/trpc-client-call";
import { getClientApi, type TrpcClientApi } from "@/trpc/client-api";
import type { RouterInputs, RouterOutputs } from "@/trpc/types";

export type AuthLoginInput = RouterInputs["auth"]["login"];
export type AuthLoginOutput = RouterOutputs["auth"]["login"];
export type AuthLoginWithGoogleInput = RouterInputs["auth"]["loginWithGoogle"];
export type AuthLoginWithGoogleOutput =
  RouterOutputs["auth"]["loginWithGoogle"];
export type AuthLoginWithMagicLinkInput =
  RouterInputs["auth"]["loginWithMagicLink"];
export type AuthLoginWithMagicLinkOutput =
  RouterOutputs["auth"]["loginWithMagicLink"];
export type AuthLogoutInput = RouterInputs["auth"]["logout"];
export type AuthLogoutOutput = RouterOutputs["auth"]["logout"];
export type AuthRegisterInput = RouterInputs["auth"]["register"];
export type AuthRegisterOutput = RouterOutputs["auth"]["register"];
export type AuthRequestEmailOtpInput = RouterInputs["auth"]["requestEmailOtp"];
export type AuthRequestEmailOtpOutput =
  RouterOutputs["auth"]["requestEmailOtp"];
export type AuthResendSignUpOtpInput = RouterInputs["auth"]["resendSignUpOtp"];
export type AuthResendSignUpOtpOutput =
  RouterOutputs["auth"]["resendSignUpOtp"];
export type AuthVerifyEmailOtpInput = RouterInputs["auth"]["verifyEmailOtp"];
export type AuthVerifyEmailOtpOutput = RouterOutputs["auth"]["verifyEmailOtp"];
export type AuthVerifySignUpOtpInput = RouterInputs["auth"]["verifySignUpOtp"];
export type AuthVerifySignUpOtpOutput =
  RouterOutputs["auth"]["verifySignUpOtp"];
export type UserPreferenceSetDefaultPortalInput =
  RouterInputs["userPreference"]["setDefaultPortal"];
export type UserPreferenceSetDefaultPortalOutput =
  RouterOutputs["userPreference"]["setDefaultPortal"];
export type AuthMeInput = RouterInputs["auth"]["me"];
export type AuthMeOutput = RouterOutputs["auth"]["me"];
export type OrganizationMyInput = RouterInputs["organization"]["my"];
export type OrganizationMyOutput = RouterOutputs["organization"]["my"];

export interface IAuthApi {
  mutAuthLogin: (input: AuthLoginInput) => Promise<AuthLoginOutput>;
  mutAuthLoginWithGoogle: (
    input: AuthLoginWithGoogleInput,
  ) => Promise<AuthLoginWithGoogleOutput>;
  mutAuthLoginWithMagicLink: (
    input: AuthLoginWithMagicLinkInput,
  ) => Promise<AuthLoginWithMagicLinkOutput>;
  mutAuthLogout: (input?: AuthLogoutInput) => Promise<AuthLogoutOutput>;
  mutAuthRegister: (input: AuthRegisterInput) => Promise<AuthRegisterOutput>;
  mutAuthRequestEmailOtp: (
    input: AuthRequestEmailOtpInput,
  ) => Promise<AuthRequestEmailOtpOutput>;
  mutAuthResendSignUpOtp: (
    input: AuthResendSignUpOtpInput,
  ) => Promise<AuthResendSignUpOtpOutput>;
  mutAuthVerifyEmailOtp: (
    input: AuthVerifyEmailOtpInput,
  ) => Promise<AuthVerifyEmailOtpOutput>;
  mutAuthVerifySignUpOtp: (
    input: AuthVerifySignUpOtpInput,
  ) => Promise<AuthVerifySignUpOtpOutput>;
  mutUserPreferenceSetDefaultPortal: (
    input: UserPreferenceSetDefaultPortalInput,
  ) => Promise<UserPreferenceSetDefaultPortalOutput>;
  queryAuthMe: (input?: AuthMeInput) => Promise<AuthMeOutput>;
  queryOrganizationMy: (
    input?: OrganizationMyInput,
  ) => Promise<OrganizationMyOutput>;
}

export type AuthApiDeps = {
  clientApi?: TrpcClientApi;
  toAppError?: (err: unknown) => AppError;
};

export class AuthApi {
  readonly clientApi: TrpcClientApi;
  private readonly toAppError: (err: unknown) => AppError;

  constructor(deps: AuthApiDeps = {}) {
    this.clientApi = deps.clientApi ?? getClientApi();
    this.toAppError = deps.toAppError ?? defaultToAppError;
  }

  mutAuthLogin = async (input: AuthLoginInput) =>
    callTrpcMutation<AuthLoginInput, AuthLoginOutput>(
      this.clientApi,
      ["auth", "login"],
      (clientApi) => clientApi.auth.login.mutate,
      input,
      this.toAppError,
    );

  mutAuthLoginWithGoogle = async (input: AuthLoginWithGoogleInput) =>
    callTrpcMutation<AuthLoginWithGoogleInput, AuthLoginWithGoogleOutput>(
      this.clientApi,
      ["auth", "loginWithGoogle"],
      (clientApi) => clientApi.auth.loginWithGoogle.mutate,
      input,
      this.toAppError,
    );

  mutAuthLoginWithMagicLink = async (input: AuthLoginWithMagicLinkInput) =>
    callTrpcMutation<AuthLoginWithMagicLinkInput, AuthLoginWithMagicLinkOutput>(
      this.clientApi,
      ["auth", "loginWithMagicLink"],
      (clientApi) => clientApi.auth.loginWithMagicLink.mutate,
      input,
      this.toAppError,
    );

  mutAuthLogout = async (input: AuthLogoutInput = undefined) =>
    callTrpcMutation<AuthLogoutInput, AuthLogoutOutput>(
      this.clientApi,
      ["auth", "logout"],
      (clientApi) => clientApi.auth.logout.mutate,
      input,
      this.toAppError,
    );

  mutAuthRegister = async (input: AuthRegisterInput) =>
    callTrpcMutation<AuthRegisterInput, AuthRegisterOutput>(
      this.clientApi,
      ["auth", "register"],
      (clientApi) => clientApi.auth.register.mutate,
      input,
      this.toAppError,
    );

  mutAuthRequestEmailOtp = async (input: AuthRequestEmailOtpInput) =>
    callTrpcMutation<AuthRequestEmailOtpInput, AuthRequestEmailOtpOutput>(
      this.clientApi,
      ["auth", "requestEmailOtp"],
      (clientApi) => clientApi.auth.requestEmailOtp.mutate,
      input,
      this.toAppError,
    );

  mutAuthResendSignUpOtp = async (input: AuthResendSignUpOtpInput) =>
    callTrpcMutation<AuthResendSignUpOtpInput, AuthResendSignUpOtpOutput>(
      this.clientApi,
      ["auth", "resendSignUpOtp"],
      (clientApi) => clientApi.auth.resendSignUpOtp.mutate,
      input,
      this.toAppError,
    );

  mutAuthVerifyEmailOtp = async (input: AuthVerifyEmailOtpInput) =>
    callTrpcMutation<AuthVerifyEmailOtpInput, AuthVerifyEmailOtpOutput>(
      this.clientApi,
      ["auth", "verifyEmailOtp"],
      (clientApi) => clientApi.auth.verifyEmailOtp.mutate,
      input,
      this.toAppError,
    );

  mutAuthVerifySignUpOtp = async (input: AuthVerifySignUpOtpInput) =>
    callTrpcMutation<AuthVerifySignUpOtpInput, AuthVerifySignUpOtpOutput>(
      this.clientApi,
      ["auth", "verifySignUpOtp"],
      (clientApi) => clientApi.auth.verifySignUpOtp.mutate,
      input,
      this.toAppError,
    );

  mutUserPreferenceSetDefaultPortal = async (
    input: UserPreferenceSetDefaultPortalInput,
  ) =>
    callTrpcMutation<
      UserPreferenceSetDefaultPortalInput,
      UserPreferenceSetDefaultPortalOutput
    >(
      this.clientApi,
      ["userPreference", "setDefaultPortal"],
      (clientApi) => clientApi.userPreference.setDefaultPortal.mutate,
      input,
      this.toAppError,
    );

  queryAuthMe = async (input: AuthMeInput = undefined) =>
    callTrpcQuery<AuthMeInput, AuthMeOutput>(
      this.clientApi,
      ["auth", "me"],
      (clientApi) => clientApi.auth.me.query,
      input,
      this.toAppError,
    );

  queryOrganizationMy = async (input: OrganizationMyInput = undefined) =>
    callTrpcQuery<OrganizationMyInput, OrganizationMyOutput>(
      this.clientApi,
      ["organization", "my"],
      (clientApi) => clientApi.organization.my.query,
      input,
      this.toAppError,
    );
}

export const createAuthApi = (deps: AuthApiDeps = {}) => new AuthApi(deps);

const AUTH_API_SINGLETON = createAuthApi();

export const getAuthApi = () => AUTH_API_SINGLETON;
