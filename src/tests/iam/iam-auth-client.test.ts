import { afterAll, afterEach, beforeAll, describe, expect, test } from "vitest";
import { setupServer } from "msw/node";
import { IamAuthClient } from "../../iam/iam-auth-client";
import { ErrorCode, PurchasesError } from "../../entities/errors";
import {
  iamLoginHandler,
  iamRevokeHandler,
  iamTokenHandler,
  jsonResponse,
  makeTokensResponse,
} from "./iam-test-helpers";

const API_KEY = "rcb_sb_test_api_key";
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function captureAuthorization(): { value: string | null } {
  const captured: { value: string | null } = { value: null };
  server.events.on("request:start", ({ request }) => {
    captured.value = request.headers.get("Authorization");
  });
  return captured;
}

describe("IamAuthClient", () => {
  const client = new IamAuthClient(API_KEY);

  test("anonymous login asks for refresh and ID tokens with the public key", async () => {
    const authorization = captureAuthorization();
    let body: Record<string, unknown> | undefined;
    server.use(
      iamLoginHandler((requestBody) => {
        body = requestBody;
        return jsonResponse(makeTokensResponse("anon"));
      }),
    );

    const response = await client.logInAnonymously();

    expect(body).toEqual({
      method: "anonymous",
      scope: "openid offline_access",
    });
    expect(authorization.value).toBe(`Bearer ${API_KEY}`);
    expect(response).toEqual(makeTokensResponse("anon"));
  });

  test("identity login sends the ID token and links to the current user", async () => {
    let body: Record<string, unknown> | undefined;
    server.use(
      iamLoginHandler((requestBody) => {
        body = requestBody;
        return jsonResponse(makeTokensResponse("user", { amr: ["oidc"] }));
      }),
    );

    await client.logIn(
      { method: "oidc", idToken: "provider-id-token" },
      "current-id-token",
    );

    expect(body).toEqual({
      method: "oidc",
      id_token: "provider-id-token",
      scope: "openid offline_access",
      link_to_id: "current-id-token",
    });
  });

  test("identity login omits link_to_id without a current ID token", async () => {
    let body: Record<string, unknown> | undefined;
    server.use(
      iamLoginHandler((requestBody) => {
        body = requestBody;
        return jsonResponse(makeTokensResponse("user", { amr: ["firebase"] }));
      }),
    );

    await client.logIn({ method: "firebase", idToken: "firebase-token" }, null);

    expect(body).not.toHaveProperty("link_to_id");
  });

  test("refresh uses the refresh token grant", async () => {
    const authorization = captureAuthorization();
    let body: Record<string, unknown> | undefined;
    server.use(
      iamTokenHandler((requestBody) => {
        body = requestBody;
        return jsonResponse(makeTokensResponse("user", { tokenId: "2" }));
      }),
    );

    await client.refresh("refresh-token");

    expect(body).toEqual({
      grant_type: "refresh_token",
      refresh_token: "refresh-token",
    });
    expect(authorization.value).toBe(`Bearer ${API_KEY}`);
  });

  test("revoke sends the refresh token with its type hint", async () => {
    let body: Record<string, unknown> | undefined;
    server.use(
      iamRevokeHandler((requestBody) => {
        body = requestBody;
        return jsonResponse({});
      }),
    );

    await client.revokeRefreshToken("refresh-token");

    expect(body).toEqual({
      token: "refresh-token",
      token_type_hint: "refresh_token",
    });
  });

  test("surfaces the status code of a rejected refresh", async () => {
    server.use(
      iamTokenHandler(() =>
        jsonResponse(
          {
            type: "authorization_error",
            message: "An invalid IAM refresh token was provided.",
          },
          403,
        ),
      ),
    );

    const error = await client.refresh("revoked").catch((e) => e);

    expect(error).toBeInstanceOf(PurchasesError);
    expect((error as PurchasesError).errorCode).toBe(
      ErrorCode.UnknownBackendError,
    );
    expect((error as PurchasesError).extra?.statusCode).toBe(403);
  });
});
