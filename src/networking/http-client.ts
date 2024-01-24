import { SupportedEndpoint } from "./endpoints";
import { ServerError } from "../entities/errors";
import { VERSION } from "../helpers/constants";

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

  // TODO: Improve error handling
  if (response.status >= 400) {
    throw new ServerError(response.status, await response.text());
  }

  return (await response.json()) as ResponseType; // TODO: Validate response is correct.
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
