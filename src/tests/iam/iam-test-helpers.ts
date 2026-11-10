import { http, HttpResponse } from "msw";
import type { IamTokensResponse } from "../../iam/iam-session";

export const AUTH_BASE_URL = "http://localhost:8000/auth";

function base64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** An unsigned JWT; the SDK only reads claims, it never verifies them. */
export function makeAccessToken(
  appUserId: string,
  {
    amr = ["anonymous"],
    tokenId = "1",
  }: { amr?: string[]; tokenId?: string } = {},
): string {
  const header = base64Url(JSON.stringify({ alg: "ES256", typ: "JWT" }));
  const payload = base64Url(
    JSON.stringify({
      "rc.app_user_id": appUserId,
      amr,
      jti: `${appUserId}-${tokenId}`,
    }),
  );
  return `${header}.${payload}.signature`;
}

export function makeTokensResponse(
  appUserId: string,
  {
    amr = ["anonymous"],
    tokenId = "1",
  }: { amr?: string[]; tokenId?: string } = {},
): IamTokensResponse {
  return {
    access_token: makeAccessToken(appUserId, { amr, tokenId }),
    token_type: "Bearer",
    expires_in: 3600,
    scope: "openid offline_access",
    id_token: `id-token-${appUserId}-${tokenId}`,
    refresh_token: `refresh-token-${appUserId}-${tokenId}`,
  };
}

export function iamLoginHandler(
  respond: (body: Record<string, unknown>) => Response | Promise<Response>,
) {
  return http.post(`${AUTH_BASE_URL}/login`, async ({ request }) => {
    return respond((await request.json()) as Record<string, unknown>);
  });
}

export function iamTokenHandler(
  respond: (body: Record<string, unknown>) => Response | Promise<Response>,
) {
  return http.post(`${AUTH_BASE_URL}/token`, async ({ request }) => {
    return respond((await request.json()) as Record<string, unknown>);
  });
}

export function iamRevokeHandler(
  respond: (body: Record<string, unknown>) => Response | Promise<Response>,
) {
  return http.post(`${AUTH_BASE_URL}/revoke`, async ({ request }) => {
    return respond((await request.json()) as Record<string, unknown>);
  });
}

export function jsonResponse(body: unknown, status: number = 200): Response {
  return HttpResponse.json(body as Record<string, unknown>, { status });
}
