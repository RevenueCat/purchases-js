import {
  AppUserIDProvider,
  type ConfigureAppUserIDParams,
} from "../entities/app-user-id-provider";
import { ErrorCode, PurchasesError } from "../entities/errors";
import { SDK_HEADERS } from "../networking/http-client";

export function validateApiKey(apiKey: string) {
  const api_key_regex = /^rcb_[a-zA-Z0-9_.-]+$/;
  if (!api_key_regex.test(apiKey)) {
    throw new PurchasesError(
      ErrorCode.InvalidCredentialsError,
      "Invalid API key. Use your RevenueCat Billing API key.",
    );
  }
}

export function validateAppUserIdConfigParams(
  appUserIdConfigParams: ConfigureAppUserIDParams,
  appUserId?: string,
) {
  if (
    !appUserId &&
    appUserIdConfigParams.appUserIDsAreProvidedBy !==
      AppUserIDProvider.RevenueCat
  ) {
    throw new PurchasesError(
      ErrorCode.ConfigurationError,
      "App user id is required when using app-provided identifiers",
    );
  }

  if (
    appUserId &&
    appUserIdConfigParams.appUserIDsAreProvidedBy !== AppUserIDProvider.MyApp
  ) {
    throw new PurchasesError(
      ErrorCode.ConfigurationError,
      "App user id is not allowed when using RevenueCat-provided identifiers",
    );
  }
}

export function validateAppUserId(appUserId: string) {
  const invalidAppUserIds = new Set([
    "no_user",
    "null",
    "none",
    "nil",
    "(null)",
    "NaN",
    "\\x00",
    "",
    "unidentified",
    "undefined",
    "unknown",
  ]);
  if (invalidAppUserIds.has(appUserId) || appUserId.includes("/")) {
    throw new PurchasesError(
      ErrorCode.InvalidAppUserIdError,
      'Provided user id: "' +
        appUserId +
        '" is not valid. See https://www.revenuecat.com/docs/customers/user-ids#tips-for-setting-app-user-ids for more information.',
    );
  }
}

export function validateProxyUrl(proxyUrl?: string) {
  if (proxyUrl?.endsWith("/")) {
    throw new PurchasesError(
      ErrorCode.ConfigurationError,
      "Invalid proxy URL. The proxy URL should not end with a trailing slash.",
    );
  }
}

export function validateAdditionalHeaders(
  additionalHeaders?: Record<string, string>,
) {
  if (additionalHeaders) {
    for (const header in additionalHeaders) {
      if (SDK_HEADERS.has(header)) {
        throw new PurchasesError(
          ErrorCode.ConfigurationError,
          `Invalid additional headers. Some headers are reserved for internal use.`,
        );
      }
    }
  }
}
