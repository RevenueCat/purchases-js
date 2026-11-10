const APP_USER_ID_CLAIM = "rc.app_user_id";
const AUTHENTICATION_METHODS_CLAIM = "amr";
const ANONYMOUS_AUTHENTICATION_METHOD = "anonymous";

/**
 * Tokens issued by `/auth/login` and `/auth/token`.
 * @internal
 */
export interface IamTokensResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  id_token?: string;
  refresh_token?: string;
}

/**
 * IAM tokens obtained outside the SDK, e.g. by a server that called
 * `/auth/login` itself.
 * @internal
 */
export interface IamTokens {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
}

/** @internal */
export interface IamSession {
  readonly accessToken: string;
  readonly refreshToken: string | null;
  readonly idToken: string | null;
  readonly appUserId: string;
  readonly isAnonymous: boolean;
}

interface StoredIamSession {
  access_token: string;
  refresh_token: string | null;
  id_token: string | null;
}

export class InvalidIamTokenError extends Error {}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new InvalidIamTokenError("IAM access token is not a JWT.");
  }
  const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );
  try {
    const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
    const payload: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (payload === null || typeof payload !== "object") {
      throw new InvalidIamTokenError(
        "IAM access token payload is not an object.",
      );
    }
    return payload as Record<string, unknown>;
  } catch (error) {
    if (error instanceof InvalidIamTokenError) {
      throw error;
    }
    throw new InvalidIamTokenError("IAM access token payload is malformed.");
  }
}

export function sessionFromTokens(tokens: IamTokens): IamSession {
  const claims = decodeJwtPayload(tokens.accessToken);
  const appUserId = claims[APP_USER_ID_CLAIM];
  if (typeof appUserId !== "string" || appUserId.length === 0) {
    throw new InvalidIamTokenError(
      `IAM access token has no ${APP_USER_ID_CLAIM} claim.`,
    );
  }
  const methods = claims[AUTHENTICATION_METHODS_CLAIM];
  // Matches the mobile SDKs: anonymous only when every listed method is.
  const isAnonymous =
    Array.isArray(methods) &&
    methods.length > 0 &&
    methods.every((method) => method === ANONYMOUS_AUTHENTICATION_METHOD);

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken ?? null,
    idToken: tokens.idToken ?? null,
    appUserId,
    isAnonymous,
  };
}

export function sessionFromTokensResponse(
  response: IamTokensResponse,
  previous?: IamSession | null,
): IamSession {
  return sessionFromTokens({
    accessToken: response.access_token,
    // A refresh may not rotate every token; keep the ones it didn't reissue.
    refreshToken: response.refresh_token ?? previous?.refreshToken ?? undefined,
    idToken: response.id_token ?? previous?.idToken ?? undefined,
  });
}

export function serializeSession(session: IamSession): string {
  const stored: StoredIamSession = {
    access_token: session.accessToken,
    refresh_token: session.refreshToken,
    id_token: session.idToken,
  };
  return JSON.stringify(stored);
}

/** Returns null for anything that isn't a usable stored session. */
export function deserializeSession(raw: string | null): IamSession | null {
  if (raw === null) {
    return null;
  }
  try {
    const stored = JSON.parse(raw) as Partial<StoredIamSession> | null;
    if (!stored || typeof stored.access_token !== "string") {
      return null;
    }
    return sessionFromTokens({
      accessToken: stored.access_token,
      refreshToken: stored.refresh_token ?? undefined,
      idToken: stored.id_token ?? undefined,
    });
  } catch {
    return null;
  }
}
