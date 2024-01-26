import { SupportedEndpoint } from "./endpoints";
import {
  BackendErrorCode,
  ErrorCode,
  ErrorCodeUtils,
  PurchasesError,
} from "../entities/errors";
import { VERSION } from "../helpers/constants";
import { StatusCodes } from "http-status-codes";

export async function performRequest<RequestBody, ResponseType>(
  endpoint: SupportedEndpoint,
  apiKey: string,
  body?: RequestBody,
  headers?: { [key: string]: string },
): Promise<ResponseType> {
  const response = await fetch(endpoint.url(), {
    method: endpoint.method,
    headers: getHeaders(apiKey, headers),
    body: getBody(body),
  });

  await handleErrors(response, endpoint);

  return (await response.json()) as ResponseType; // TODO: Validate response is correct.
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
        throwBackendErrorCode(backendErrorCode, backendErrorMessage);
      }
    } else {
      throwUnknownError(endpoint, statusCode, errorBodyString);
    }
  }
}

function throwBackendErrorCode(
  backendErrorCode: BackendErrorCode,
  backendErrorMessage: string | null,
) {
  const errorCode =
    ErrorCodeUtils.getErrorCodeForBackendErrorCode(backendErrorCode);
  throw new PurchasesError(
    errorCode,
    ErrorCodeUtils.getPublicMessage(errorCode),
    backendErrorMessage,
  );
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
): { [key: string]: string } {
  let all_headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Platform": "web",
    "X-Version": VERSION,
  };
  if (headers != null) {
    all_headers = { ...all_headers, ...headers };
  }
  return all_headers;
}
