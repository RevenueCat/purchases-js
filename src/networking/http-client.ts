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
    throw new PurchasesError(
      ErrorCode.UnknownBackendError,
      `Server responded with status code: ${statusCode} in request: ${endpoint.name}.`,
    );
  } else if (statusCode >= StatusCodes.BAD_REQUEST) {
    const errorBody = await response.json();
    const backendErrorCodeNumber: number | null = errorBody.code;
    const backendErrorMessage: string | null = errorBody.message;
    if (backendErrorCodeNumber != null) {
      const backendErrorCode: BackendErrorCode | null =
        ErrorCodeUtils.convertCodeToBackendErrorCode(backendErrorCodeNumber);
      if (backendErrorCode == null) {
        throw new PurchasesError(
          ErrorCode.UnknownBackendError,
          `Unknown backend error code. Request: ${endpoint.name}. Status code: ${statusCode}. Body: ${await response.text()}.`,
        );
      } else {
        const errorCode =
          ErrorCodeUtils.getErrorCodeForBackendErrorCode(backendErrorCode);
        throw new PurchasesError(
          errorCode,
          ErrorCodeUtils.getPublicMessage(errorCode),
          backendErrorMessage,
        );
      }
    } else {
      throw new PurchasesError(
        ErrorCode.UnknownBackendError,
        `Unknown backend error. Request: ${endpoint.name}. Status code: ${statusCode}. Body: ${await response.text()}.`,
      );
    }
  }
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
