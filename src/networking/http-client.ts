import { type SupportedEndpoint } from "./endpoints";
import type { BackendErrorCode } from "../entities/errors";
import { ErrorCode, ErrorCodeUtils, PurchasesError } from "../entities/errors";
import { RC_ENDPOINT, VERSION } from "../helpers/constants";
import { StatusCodes } from "http-status-codes";
import { isWebBillingSandboxApiKey } from "../helpers/api-key-helper";
import type { HttpConfig } from "../entities/http-config";
import { Purchases } from "../main";

interface HttpRequestConfig<RequestBody> {
  apiKey: string;
  body?: RequestBody;
  headers?: { [key: string]: string };
  httpConfig?: HttpConfig;
}

export async function performRequest<RequestBody, ResponseType>(
  endpoint: SupportedEndpoint,
  config: HttpRequestConfig<RequestBody>,
  signal?: AbortSignal | null,
): Promise<ResponseType> {
  const { apiKey, body, headers, httpConfig } = config;
  const baseUrl = httpConfig?.proxyURL ?? RC_ENDPOINT;
  const url = `${baseUrl}${endpoint.urlPath()}`;

  try {
    const response = await fetch(url, {
      method: endpoint.method,
      headers: getHeaders(apiKey, headers, httpConfig?.additionalHeaders),
      body: getBody(body),
      signal,
    });

    await handleErrors(response, endpoint);

    return (await response.json()) as ResponseType; // TODO: Validate response is correct.
  } catch (error) {
    if (error instanceof TypeError) {
      throw new PurchasesError(
        ErrorCode.NetworkError,
        ErrorCodeUtils.getPublicMessage(ErrorCode.NetworkError),
        error.message,
      );
    } else {
      throw error;
    }
  }
}

async function handleErrors(response: Response, endpoint: SupportedEndpoint) {
  const statusCode = response.status;
  if (statusCode >= StatusCodes.INTERNAL_SERVER_ERROR) {
    throwUnknownError(endpoint, statusCode, await response.text());
  } else if (statusCode >= StatusCodes.BAD_REQUEST) {
    const errorBody = await response.json();
    const errorBodyString = errorBody ? JSON.stringify(errorBody) : null;
    const backendErrorCodeNumber: number | null = errorBody?.code;
    const backendErrorMessage: string | null = errorBody?.message;
    if (backendErrorCodeNumber != null) {
      const backendErrorCode: BackendErrorCode | null =
        ErrorCodeUtils.convertCodeToBackendErrorCode(backendErrorCodeNumber);
      if (backendErrorCode == null) {
        throwUnknownError(
          endpoint,
          statusCode,
          errorBodyString,
          backendErrorCodeNumber,
        );
      } else {
        throw PurchasesError.getForBackendError(
          backendErrorCode,
          backendErrorMessage,
        );
      }
    } else {
      throwUnknownError(endpoint, statusCode, errorBodyString);
    }
  }
}

function throwUnknownError(
  endpoint: SupportedEndpoint,
  statusCode: number,
  errorBody: string | null,
  backendErrorCode?: number,
) {
  throw new PurchasesError(
    ErrorCode.UnknownBackendError,
    `Unknown backend error.`,
    `Request: ${endpoint.name}. Status code: ${statusCode}. Body: ${errorBody}.`,
    { backendErrorCode: backendErrorCode },
  );
}

function getBody<RequestBody>(body?: RequestBody): string | null {
  if (body == null) {
    return null;
  } else {
    return JSON.stringify(body);
  }
}

const AUTHORIZATION_HEADER = "Authorization";
const CONTENT_TYPE_HEADER = "Content-Type";
const ACCEPT_HEADER = "Accept";
const PLATFORM_HEADER = "X-Platform";
const VERSION_HEADER = "X-Version";
const FLAVOR_HEADER = "X-Platform-Flavor";
const FLAVOR_VERSION_HEADER = "X-Platform-Flavor-Version";
const IS_SANDBOX_HEADER = "X-Is-Sandbox";

export const SDK_HEADERS = new Set([
  AUTHORIZATION_HEADER,
  CONTENT_TYPE_HEADER,
  ACCEPT_HEADER,
  PLATFORM_HEADER,
  VERSION_HEADER,
  IS_SANDBOX_HEADER,
  FLAVOR_HEADER,
  FLAVOR_VERSION_HEADER,
]);

export function getHeaders(
  apiKey: string,
  headers?: { [key: string]: string },
  additionalHeaders?: { [key: string]: string },
): { [key: string]: string } {
  let all_headers = {
    [AUTHORIZATION_HEADER]: `Bearer ${apiKey}`,
    [CONTENT_TYPE_HEADER]: "application/json",
    [ACCEPT_HEADER]: "application/json",
    [PLATFORM_HEADER]: "web",
    [VERSION_HEADER]: VERSION,
    [IS_SANDBOX_HEADER]: `${isWebBillingSandboxApiKey(apiKey)}`,
  };
  const platformInfo = Purchases.getPlatformInfo();
  if (platformInfo) {
    const platform_info_headers = {
      [FLAVOR_HEADER]: platformInfo.flavor,
      [FLAVOR_VERSION_HEADER]: platformInfo.version,
    };
    all_headers = { ...all_headers, ...platform_info_headers };
  }
  if (headers) {
    all_headers = { ...all_headers, ...headers };
  }
  if (additionalHeaders) {
    // The order here is intentional, so we don't allow overriding the SDK
    // headers with additional headers.
    all_headers = { ...additionalHeaders, ...all_headers };
  }
  return all_headers;
}
