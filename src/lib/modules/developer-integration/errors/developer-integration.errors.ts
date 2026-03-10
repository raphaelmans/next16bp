import {
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  NotFoundError,
} from "@/lib/shared/kernel/errors";

export class DeveloperIntegrationNotFoundError extends NotFoundError {
  readonly code = "DEVELOPER_INTEGRATION_NOT_FOUND";

  constructor(details?: Record<string, unknown>) {
    super("Developer integration not found", details);
  }
}

export class DeveloperApiKeyNotFoundError extends NotFoundError {
  readonly code = "DEVELOPER_API_KEY_NOT_FOUND";

  constructor(details?: Record<string, unknown>) {
    super("Developer API key not found", details);
  }
}

export class DeveloperApiKeyInvalidError extends AuthenticationError {
  readonly code = "DEVELOPER_API_KEY_INVALID";

  constructor(details?: Record<string, unknown>) {
    super("Invalid API key", details);
  }
}

export class DeveloperApiKeyScopeDeniedError extends AuthorizationError {
  readonly code = "DEVELOPER_API_KEY_SCOPE_DENIED";

  constructor(details?: Record<string, unknown>) {
    super("API key does not have the required scope", details);
  }
}

export class DeveloperApiKeyIpNotAllowedError extends AuthorizationError {
  readonly code = "DEVELOPER_API_KEY_IP_NOT_ALLOWED";

  constructor(details?: Record<string, unknown>) {
    super("Request IP is not allowed for this API key", details);
  }
}

export class DeveloperCourtMappingNotFoundError extends NotFoundError {
  readonly code = "DEVELOPER_COURT_MAPPING_NOT_FOUND";

  constructor(details?: Record<string, unknown>) {
    super("Developer court mapping not found", details);
  }
}

export class DeveloperCourtMappingConflictError extends ConflictError {
  readonly code = "DEVELOPER_COURT_MAPPING_CONFLICT";

  constructor(details?: Record<string, unknown>) {
    super("External court ID is already mapped to another court", details);
  }
}

export class DeveloperCourtMappingAccessDeniedError extends AuthorizationError {
  readonly code = "DEVELOPER_COURT_MAPPING_ACCESS_DENIED";

  constructor(details?: Record<string, unknown>) {
    super("Court does not belong to this organization", details);
  }
}

export class DeveloperExternalWindowConflictError extends ConflictError {
  readonly code = "DEVELOPER_EXTERNAL_WINDOW_CONFLICT";

  constructor(details?: Record<string, unknown>) {
    super("External window is already linked to another court", details);
  }
}
