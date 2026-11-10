import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";
import { setupServer } from "msw/node";
import { IamAuthClient } from "../../iam/iam-auth-client";
import { IamSessionManager } from "../../iam/iam-session-manager";
import { IamLock } from "../../iam/iam-lock";
import { MemoryIamStorage } from "../../iam/iam-storage";
import {
  serializeSession,
  sessionFromTokensResponse,
} from "../../iam/iam-session";
import { ErrorCode, PurchasesError } from "../../entities/errors";
import {
  iamLoginHandler,
  iamRevokeHandler,
  iamTokenHandler,
  jsonResponse,
  makeAccessToken,
  makeTokensResponse,
} from "./iam-test-helpers";

const API_KEY = "rcb_sb_test_api_key";
const STORAGE_KEY = "revenuecat.iam.session.test";
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

let storage: MemoryIamStorage;

beforeEach(() => {
  storage = new MemoryIamStorage();
});

function createManager(
  overrides: Partial<ConstructorParameters<typeof IamSessionManager>[0]> = {},
) {
  return new IamSessionManager({
    authClient: new IamAuthClient(API_KEY),
    storage,
    storageKey: STORAGE_KEY,
    syncAcrossTabs: false,
    lock: new IamLock(STORAGE_KEY, null),
    lockedRetryDelayMs: 0,
    ...overrides,
  });
}

function storeSession(
  appUserId: string,
  options: { amr?: string[]; tokenId?: string } = {},
) {
  const session = sessionFromTokensResponse(
    makeTokensResponse(appUserId, options),
  );
  storage.setItem(STORAGE_KEY, serializeSession(session));
  return session;
}

describe("ensureSession", () => {
  test("signs in anonymously once for concurrent callers and stores the session", async () => {
    const login = vi.fn(() => jsonResponse(makeTokensResponse("anon-1")));
    server.use(iamLoginHandler(login));
    const manager = createManager();

    const [first, second] = await Promise.all([
      manager.ensureSession(),
      manager.ensureSession(),
    ]);

    expect(login).toHaveBeenCalledTimes(1);
    expect(first.appUserId).toBe("anon-1");
    expect(second).toBe(first);
    expect(storage.getItem(STORAGE_KEY)).toBe(serializeSession(first));
  });

  test("uses the stored session without a network request", async () => {
    const stored = storeSession("user-1", { amr: ["oidc"] });
    const manager = createManager();

    const session = await manager.ensureSession();

    expect(session).toEqual(stored);
  });

  test("getCurrentCredentials is null until a session is loaded", async () => {
    const stored = storeSession("user-1", { amr: ["oidc"] });
    const manager = createManager();

    expect(manager.getCurrentCredentials()).toBeNull();
    await manager.ensureSession();

    expect(manager.getCurrentCredentials()).toEqual({
      accessToken: stored.accessToken,
      appUserId: "user-1",
    });
  });

  test("signs in anonymously when the stored session is unusable", async () => {
    storage.setItem(STORAGE_KEY, "garbage");
    server.use(
      iamLoginHandler(() => jsonResponse(makeTokensResponse("anon-2"))),
    );
    const manager = createManager();

    expect((await manager.ensureSession()).appUserId).toBe("anon-2");
  });
});

describe("refreshAfterUnauthorized", () => {
  test("refreshes once for concurrent 401s on the same token", async () => {
    const stored = storeSession("user-1");
    const refresh = vi.fn((body: Record<string, unknown>) => {
      expect(body.refresh_token).toBe(stored.refreshToken);
      return jsonResponse(makeTokensResponse("user-1", { tokenId: "2" }));
    });
    server.use(iamTokenHandler(refresh));
    const manager = createManager();
    const failed = await manager.getCredentials();

    const results = await Promise.all([
      manager.refreshAfterUnauthorized(failed),
      manager.refreshAfterUnauthorized(failed),
      manager.refreshAfterUnauthorized(failed),
    ]);

    expect(refresh).toHaveBeenCalledTimes(1);
    const expectedToken = makeAccessToken("user-1", { tokenId: "2" });
    for (const result of results) {
      expect(result).toEqual({
        accessToken: expectedToken,
        appUserId: "user-1",
      });
    }
    expect(manager.getCurrentSession()?.accessToken).toBe(expectedToken);
  });

  test("uses a token another tab already stored instead of refreshing", async () => {
    storeSession("user-1");
    const refresh = vi.fn(() => jsonResponse(makeTokensResponse("user-1")));
    server.use(iamTokenHandler(refresh));
    const manager = createManager();
    const failed = await manager.getCredentials();
    const otherTab = storeSession("user-1", { tokenId: "other-tab" });

    const result = await manager.refreshAfterUnauthorized(failed);

    expect(refresh).not.toHaveBeenCalled();
    expect(result?.accessToken).toBe(otherTab.accessToken);
  });

  test("does not retry once the stored session belongs to another user", async () => {
    storeSession("user-1");
    const manager = createManager();
    const failed = await manager.getCredentials();
    storeSession("user-2", { amr: ["oidc"] });

    const result = await manager.refreshAfterUnauthorized(failed);

    expect(result).toBeNull();
    expect(manager.getCurrentSession()?.appUserId).toBe("user-2");
  });

  test.each([401, 403])(
    "clears the session when the refresh token is rejected with %i",
    async (status) => {
      storeSession("user-1");
      server.use(
        iamTokenHandler(() =>
          jsonResponse({ type: "authorization_error" }, status),
        ),
      );
      const manager = createManager();
      const failed = await manager.getCredentials();

      const result = await manager.refreshAfterUnauthorized(failed);

      expect(result).toBeNull();
      expect(storage.getItem(STORAGE_KEY)).toBeNull();
      expect(manager.getCurrentSession()).toBeNull();
    },
  );

  test("keeps the session when the refresh fails for another reason", async () => {
    const stored = storeSession("user-1");
    server.use(iamTokenHandler(() => jsonResponse({}, 500)));
    const manager = createManager();
    const failed = await manager.getCredentials();

    await expect(
      manager.refreshAfterUnauthorized(failed),
    ).rejects.toBeInstanceOf(PurchasesError);
    expect(storage.getItem(STORAGE_KEY)).toBe(serializeSession(stored));
  });

  test("retries once after a concurrent-refresh 423", async () => {
    storeSession("user-1");
    let calls = 0;
    server.use(
      iamTokenHandler(() => {
        calls += 1;
        return calls === 1
          ? jsonResponse({ type: "resource_locked_error" }, 423)
          : jsonResponse(makeTokensResponse("user-1", { tokenId: "2" }));
      }),
    );
    const manager = createManager();
    const failed = await manager.getCredentials();

    const result = await manager.refreshAfterUnauthorized(failed);

    expect(calls).toBe(2);
    expect(result?.accessToken).toBe(
      makeAccessToken("user-1", { tokenId: "2" }),
    );
  });

  test("keeps a session another tab stored during the refresh", async () => {
    storeSession("user-1");
    let otherTabToken: string | undefined;
    server.use(
      iamTokenHandler(() => {
        otherTabToken = storeSession("user-1", {
          tokenId: "other-tab",
        }).accessToken;
        return jsonResponse(makeTokensResponse("user-1", { tokenId: "mine" }));
      }),
    );
    const manager = createManager();
    const failed = await manager.getCredentials();

    const result = await manager.refreshAfterUnauthorized(failed);

    expect(result?.accessToken).toBe(otherTabToken);
    expect(manager.getCurrentSession()?.accessToken).toBe(otherTabToken);
  });
});

describe("logIn", () => {
  test("links the identity to the current user and stores the new session", async () => {
    const anonymous = storeSession("anon-1");
    let body: Record<string, unknown> | undefined;
    server.use(
      iamLoginHandler((requestBody) => {
        body = requestBody;
        return jsonResponse(makeTokensResponse("user-1", { amr: ["oidc"] }));
      }),
    );
    const manager = createManager();
    await manager.ensureSession();
    const listener = vi.fn();
    manager.addListener(listener);

    const session = await manager.logIn({
      method: "oidc",
      idToken: "provider",
    });

    expect(body?.link_to_id).toBe(anonymous.idToken);
    expect(session.appUserId).toBe("user-1");
    expect(session.isAnonymous).toBe(false);
    expect(storage.getItem(STORAGE_KEY)).toBe(serializeSession(session));
    expect(listener).toHaveBeenCalledWith(session, anonymous);
  });

  test("keeps the current session when login fails", async () => {
    const anonymous = storeSession("anon-1");
    server.use(iamLoginHandler(() => jsonResponse({}, 401)));
    const manager = createManager();

    await expect(
      manager.logIn({ method: "google", idToken: "bad" }),
    ).rejects.toBeInstanceOf(PurchasesError);
    expect(storage.getItem(STORAGE_KEY)).toBe(serializeSession(anonymous));
  });
});

describe("logOut", () => {
  test("revokes the refresh token, then signs in anonymously", async () => {
    const user = storeSession("user-1", { amr: ["oidc"] });
    const order: string[] = [];
    server.use(
      iamRevokeHandler((body) => {
        order.push(`revoke:${body.token}`);
        return jsonResponse({});
      }),
      iamLoginHandler((body) => {
        order.push(`login:${body.method}`);
        return jsonResponse(makeTokensResponse("anon-2"));
      }),
    );
    const manager = createManager();

    const session = await manager.logOut();

    expect(order).toEqual([`revoke:${user.refreshToken}`, "login:anonymous"]);
    expect(session.appUserId).toBe("anon-2");
    expect(session.isAnonymous).toBe(true);
  });

  test("keeps the session when revocation fails", async () => {
    const user = storeSession("user-1", { amr: ["oidc"] });
    server.use(iamRevokeHandler(() => jsonResponse({}, 503)));
    const manager = createManager();

    await expect(manager.logOut()).rejects.toBeInstanceOf(PurchasesError);
    expect(storage.getItem(STORAGE_KEY)).toBe(serializeSession(user));
  });

  test("rejects logging out an anonymous user", async () => {
    storeSession("anon-1");
    const manager = createManager();

    const error = await manager.logOut().catch((e) => e);

    expect((error as PurchasesError).errorCode).toBe(
      ErrorCode.LogOutWithAnonymousUserError,
    );
  });
});

describe("setTokens", () => {
  test("replaces the stored session with the given tokens", async () => {
    storeSession("anon-1");
    const manager = createManager();
    const accessToken = makeAccessToken("user-1", { amr: ["firebase"] });

    const session = await manager.setTokens({
      accessToken,
      refreshToken: "server-refresh-token",
    });

    expect(session).toMatchObject({
      appUserId: "user-1",
      refreshToken: "server-refresh-token",
      isAnonymous: false,
    });
    expect(storage.getItem(STORAGE_KEY)).toBe(serializeSession(session));
  });

  test("a session request queued behind it uses the tokens", async () => {
    const login = vi.fn(() => jsonResponse(makeTokensResponse("anon-1")));
    server.use(iamLoginHandler(login));
    const failingStorage = new MemoryIamStorage();
    failingStorage.setItem = () => {
      throw new Error("quota");
    };
    const manager = createManager({ storage: failingStorage });

    const setting = manager.setTokens({
      accessToken: makeAccessToken("user-1"),
    });
    const ensured = manager.ensureSession();
    await setting;

    expect((await ensured).appUserId).toBe("user-1");
    expect(login).not.toHaveBeenCalled();
  });

  test("rejects a malformed access token without touching storage", () => {
    const stored = storeSession("anon-1");
    const manager = createManager();

    expect(() => manager.setTokens({ accessToken: "nope" })).toThrow();
    expect(storage.getItem(STORAGE_KEY)).toBe(serializeSession(stored));
  });
});

describe("cross-tab sync", () => {
  test("adopts a session another tab writes to localStorage", async () => {
    storeSession("anon-1");
    const manager = createManager({ syncAcrossTabs: true });
    await manager.ensureSession();
    const listener = vi.fn();
    manager.addListener(listener);
    const otherTab = sessionFromTokensResponse(
      makeTokensResponse("user-1", { amr: ["oidc"] }),
    );

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: STORAGE_KEY,
        newValue: serializeSession(otherTab),
      }),
    );

    expect(manager.getCurrentSession()).toEqual(otherTab);
    expect(listener).toHaveBeenCalledTimes(1);
    manager.dispose();
  });

  test("ignores storage events for other keys", async () => {
    const stored = storeSession("anon-1");
    const manager = createManager({ syncAcrossTabs: true });
    await manager.ensureSession();

    window.dispatchEvent(
      new StorageEvent("storage", { key: "other", newValue: "x" }),
    );

    expect(manager.getCurrentSession()).toEqual(stored);
    manager.dispose();
  });
});
