import { performRequest } from "../networking/http-client";
import {
  IamLoginEndpoint,
  IamRevokeEndpoint,
  IamTokenEndpoint,
} from "../networking/endpoints";
import type { HttpConfig } from "../entities/http-config";
import type { IamTokensResponse } from "./iam-session";

// Both tokens are needed: the refresh token keeps the session alive and the
// ID token links the next identity login to the current user.
const LOGIN_SCOPE = "openid offline_access";

/**
 * An identity to sign in with, verified by khepri with the project's
 * configured authentication method.
 * @internal
 */
export type IamIdentity =
  | { method: "oidc"; idToken: string }
  | { method: "google"; idToken: string }
  | { method: "apple"; idToken: string }
  | { method: "firebase"; idToken: string };

type AnonymousLoginBody = {
  method: "anonymous";
  scope: string;
};

type IdentityLoginBody = {
  method: IamIdentity["method"];
  id_token: string;
  scope: string;
  link_to_id?: string;
};

type RefreshBody = {
  grant_type: "refresh_token";
  refresh_token: string;
};

type RevokeBody = {
  token: string;
  token_type_hint: "refresh_token";
};

/** Calls the `/auth` endpoints, which always take the public API key. */
export class IamAuthClient {
  constructor(
    private readonly apiKey: string,
    private readonly httpConfig?: HttpConfig,
  ) {}

  async logInAnonymously(): Promise<IamTokensResponse> {
    return await performRequest<AnonymousLoginBody, IamTokensResponse>(
      new IamLoginEndpoint(),
      {
        apiKey: this.apiKey,
        body: { method: "anonymous", scope: LOGIN_SCOPE },
        httpConfig: this.httpConfig,
      },
    );
  }

  /**
   * @param linkToIdToken - The current user's ID token, so khepri links the
   * identity to that user (e.g. an anonymous user signing in) instead of
   * resolving it to a new one. Same as the mobile SDKs' `link_to_id`.
   */
  async logIn(
    identity: IamIdentity,
    linkToIdToken: string | null,
  ): Promise<IamTokensResponse> {
    const body: IdentityLoginBody = {
      method: identity.method,
      id_token: identity.idToken,
      scope: LOGIN_SCOPE,
    };
    if (linkToIdToken) {
      body.link_to_id = linkToIdToken;
    }
    return await performRequest<IdentityLoginBody, IamTokensResponse>(
      new IamLoginEndpoint(),
      { apiKey: this.apiKey, body, httpConfig: this.httpConfig },
    );
  }

  async refresh(refreshToken: string): Promise<IamTokensResponse> {
    return await performRequest<RefreshBody, IamTokensResponse>(
      new IamTokenEndpoint(),
      {
        apiKey: this.apiKey,
        body: { grant_type: "refresh_token", refresh_token: refreshToken },
        httpConfig: this.httpConfig,
      },
    );
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    await performRequest<RevokeBody, unknown>(new IamRevokeEndpoint(), {
      apiKey: this.apiKey,
      body: { token: refreshToken, token_type_hint: "refresh_token" },
      httpConfig: this.httpConfig,
    });
  }
}
