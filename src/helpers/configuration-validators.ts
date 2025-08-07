import { ErrorCode, PurchasesError } from "../entities/errors";
import { SDK_HEADERS } from "../networking/http-client";
import {
  isPaddleApiKey,
  isSimulatedStoreApiKey,
  isWebBillingApiKey,
} from "./api-key-helper";

export function validateApiKey(apiKey: string) {
  if (
    !isWebBillingApiKey(apiKey) &&
    !isPaddleApiKey(apiKey) &&
    !isSimulatedStoreApiKey(apiKey)
  ) {
    throw new PurchasesError(
      ErrorCode.InvalidCredentialsError,
      "Invalid API key. Use your Web Billing or Paddle API key.",
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

  if (
    !appUserId ||
    invalidAppUserIds.has(appUserId) ||
    appUserId.includes("/")
  ) {
    throw new PurchasesError(
      ErrorCode.InvalidAppUserIdError,
      'Provided user id: "' +
        (appUserId ?? "[Not provided]") +
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
