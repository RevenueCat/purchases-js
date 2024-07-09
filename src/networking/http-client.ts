import { type SupportedEndpoint } from "./endpoints";
import {
  type BackendErrorCode,
  ErrorCode,
  ErrorCodeUtils,
  PurchasesError,
} from "../entities/errors";
import { RC_ENDPOINT, VERSION } from "../helpers/constants";
import { StatusCodes } from "http-status-codes";
import { isSandboxApiKey } from "../helpers/api-key-helper";
import type { HttpConfig } from "../entities/http-config";

interface HttpRequestConfig<RequestBody> {
  apiKey: string;
  body?: RequestBody;
  headers?: { [key: string]: string };
  httpConfig?: HttpConfig;
}

export async function performRequest<RequestBody, ResponseType>(
  endpoint: SupportedEndpoint,
  config: HttpRequestConfig<RequestBody>,
): Promise<ResponseType> {
  const { apiKey, body, headers, httpConfig } = config;
  const baseUrl = httpConfig?.proxyURL ?? RC_ENDPOINT;
  const url = `${baseUrl}${endpoint.urlPath()}`;

  try {
    const response = await fetch(url, {
      method: endpoint.method,
      headers: getHeaders(apiKey, headers, httpConfig?.additionalHeaders),
      body: getBody(body),
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
        throwUnknownError(endpoint, statusCode, errorBodyString);
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
) {
  throw new PurchasesError(
    ErrorCode.UnknownBackendError,
    `Unknown backend error. Request: ${endpoint.name}. Status code: ${statusCode}. Body: ${errorBody}.`,
  );
}

function getBody<RequestBody>(body?: RequestBody): string | null {
  if (body == null) {
    return null;
  } else {
    return JSON.stringify(body);
  }
}

function getHeaders(
  apiKey: string,
  headers?: { [key: string]: string },
  additionalHeaders?: { [key: string]: string },
): { [key: string]: string } {
  let all_headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Platform": "web",
    "X-Version": VERSION,
    "X-Is-Sandbox": `${isSandboxApiKey(apiKey)}`,
  };
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
