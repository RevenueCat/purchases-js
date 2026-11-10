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
import { http, HttpResponse } from "msw";
import { Purchases } from "../../main";
import { ErrorCode, PurchasesError } from "../../entities/errors";
import { MemoryIamStorage } from "../../iam/iam-storage";
import {
  serializeSession,
  sessionFromTokensResponse,
} from "../../iam/iam-session";
import { customerInfoResponse } from "../test-responses";
import {
  iamLoginHandler,
  iamTokenHandler,
  jsonResponse,
  makeAccessToken,
  makeTokensResponse,
} from "./iam-test-helpers";

const API_KEY = "rcb_sb_test_api_key";
const STORAGE_KEY = `revenuecat.iam.session.${API_KEY}`;
const BASE_URL = "http://localhost:8000";
const server = setupServer();

interface RecordedRequest {
  path: string;
  authorization: string | null;
  body: unknown;
}

let requests: RecordedRequest[];

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());

beforeEach(() => {
  requests = [];
  server.events.removeAllListeners();
  server.events.on("request:start", async ({ request }) => {
    const text = await request.clone().text();
    requests.push({
      path: new URL(request.url).pathname,
      authorization: request.headers.get("Authorization"),
      body: text ? JSON.parse(text) : null,
    });
  });
  server.use(
    http.get(`${BASE_URL}/v1/customer`, () =>
      HttpResponse.json(customerInfoResponse),
    ),
    http.post(`${BASE_URL}/v1/events`, () => HttpResponse.json({})),
  );
});

afterEach(() => {
  if (Purchases.isConfigured()) {
    Purchases.getSharedInstance().close();
  }
  server.resetHandlers();
  window.localStorage.clear();
});

function configureWithIam(storage?: MemoryIamStorage): Purchases {
  return Purchases.configure({
    apiKey: API_KEY,
    iamEnabled: true,
    iamStorage: storage,
  });
}

function storeSession(appUserId: string, amr: string[] = ["anonymous"]) {
  const session = sessionFromTokensResponse(
    makeTokensResponse(appUserId, { amr }),
  );
  window.localStorage.setItem(STORAGE_KEY, serializeSession(session));
  return session;
}

describe("Purchases configured with IAM", () => {
  test("signs in anonymously and fetches the customer with the access token", async () => {
    const login = vi.fn(() => jsonResponse(makeTokensResponse("anon-1")));
    server.use(iamLoginHandler(login));
    const purchases = configureWithIam();

    const customerInfo = await purchases.getCustomerInfo();

    expect(customerInfo).toBeDefined();
    expect(login).toHaveBeenCalledTimes(1);
    expect(purchases.getAppUserId()).toBe("anon-1");
    expect(purchases.isAnonymous()).toBe(true);
    const customerRequest = requests.find((r) => r.path === "/v1/customer");
    expect(customerRequest?.authorization).toBe(
      `Bearer ${makeAccessToken("anon-1")}`,
    );
  });

  test("persists the session in localStorage by default", async () => {
    server.use(
      iamLoginHandler(() => jsonResponse(makeTokensResponse("anon-1"))),
    );
    const purchases = configureWithIam();

    await purchases.getCustomerInfo();

    const stored = window.localStorage.getItem(STORAGE_KEY);
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored!).access_token).toBe(makeAccessToken("anon-1"));
  });

  test("restores a stored session without signing in again", async () => {
    storeSession("user-1", ["oidc"]);
    const login = vi.fn(() => jsonResponse(makeTokensResponse("other")));
    server.use(iamLoginHandler(login));
    const purchases = configureWithIam();

    await purchases.getCustomerInfo();

    expect(login).not.toHaveBeenCalled();
    expect(purchases.getAppUserId()).toBe("user-1");
    expect(purchases.isAnonymous()).toBe(false);
  });

  test("uses custom storage instead of localStorage", async () => {
    const storage = new MemoryIamStorage();
    server.use(
      iamLoginHandler(() => jsonResponse(makeTokensResponse("anon-1"))),
    );
    const purchases = configureWithIam(storage);

    await purchases.getCustomerInfo();

    expect(storage.getItem(STORAGE_KEY)).not.toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  test("getAppUserId throws until the session has loaded", async () => {
    let releaseLogin!: () => void;
    const loginReleased = new Promise<void>((r) => (releaseLogin = r));
    server.use(
      iamLoginHandler(async () => {
        await loginReleased;
        return jsonResponse(makeTokensResponse("anon-1"));
      }),
    );
    const purchases = configureWithIam();

    expect(() => purchases.getAppUserId()).toThrow(PurchasesError);
    expect(purchases.isAnonymous()).toBe(true);
    releaseLogin();
    await purchases.getCustomerInfo();
    expect(purchases.getAppUserId()).toBe("anon-1");
  });

  test("refreshes the token after a 401 and retries the request", async () => {
    storeSession("user-1", ["oidc"]);
    const expiredToken = makeAccessToken("user-1", { amr: ["oidc"] });
    server.use(
      http.get(`${BASE_URL}/v1/customer`, ({ request }) =>
        request.headers.get("Authorization") === `Bearer ${expiredToken}`
          ? HttpResponse.json({ code: 7224 }, { status: 401 })
          : HttpResponse.json(customerInfoResponse),
      ),
      iamTokenHandler(() =>
        jsonResponse(
          makeTokensResponse("user-1", { amr: ["oidc"], tokenId: "2" }),
        ),
      ),
    );
    const purchases = configureWithIam();

    await purchases.getCustomerInfo();

    const customerRequests = requests.filter((r) => r.path === "/v1/customer");
    expect(customerRequests.map((r) => r.authorization)).toEqual([
      `Bearer ${expiredToken}`,
      `Bearer ${makeAccessToken("user-1", { amr: ["oidc"], tokenId: "2" })}`,
    ]);
  });

  test("follows a session another tab signed in to", async () => {
    storeSession("anon-1");
    const purchases = configureWithIam();
    await purchases.getCustomerInfo();
    const otherTab = sessionFromTokensResponse(
      makeTokensResponse("user-1", { amr: ["oidc"] }),
    );

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: STORAGE_KEY,
        newValue: serializeSession(otherTab),
      }),
    );

    expect(purchases.getAppUserId()).toBe("user-1");
    expect(purchases.isAnonymous()).toBe(false);
  });

  test("sends events queued before the session loaded with its user", async () => {
    server.use(
      iamLoginHandler(() => jsonResponse(makeTokensResponse("anon-1"))),
    );
    const purchases = configureWithIam();
    await purchases.getCustomerInfo();

    await purchases._flushAllEvents();

    const eventRequests = requests.filter((r) => r.path === "/v1/events");
    expect(eventRequests.length).toBeGreaterThan(0);
    const events = eventRequests.flatMap(
      (r) => (r.body as { events: Array<{ app_user_id: string }> }).events,
    );
    expect(events.length).toBeGreaterThan(0);
    for (const event of events) {
      expect(event.app_user_id).toBe("anon-1");
    }
    expect(eventRequests[0].authorization).toBe(
      `Bearer ${makeAccessToken("anon-1")}`,
    );
  });

  test.each(["identifyUser", "changeUser"] as const)(
    "rejects %s",
    async (method) => {
      server.use(
        iamLoginHandler(() => jsonResponse(makeTokensResponse("anon-1"))),
      );
      const purchases = configureWithIam();

      const error = await purchases[method]("some-user").catch((e) => e);

      expect((error as PurchasesError).errorCode).toBe(
        ErrorCode.UnsupportedError,
      );
    },
  );

  test("logIn links the identity to the anonymous user and switches to it", async () => {
    const loginBodies: Array<Record<string, unknown>> = [];
    server.use(
      iamLoginHandler((body) => {
        loginBodies.push(body);
        return body.method === "anonymous"
          ? jsonResponse(makeTokensResponse("anon-1"))
          : jsonResponse(makeTokensResponse("user-1", { amr: ["oidc"] }));
      }),
    );
    const purchases = configureWithIam();
    await purchases.getCustomerInfo();

    const customerInfo = await purchases.logIn({
      method: "oidc",
      idToken: "provider-id-token",
    });

    expect(customerInfo).toBeDefined();
    expect(loginBodies[1]).toMatchObject({
      method: "oidc",
      id_token: "provider-id-token",
      link_to_id: makeTokensResponse("anon-1").id_token,
    });
    expect(purchases.getAppUserId()).toBe("user-1");
    expect(purchases.isAnonymous()).toBe(false);
    const lastCustomerRequest = requests
      .filter((r) => r.path === "/v1/customer")
      .at(-1);
    expect(lastCustomerRequest?.authorization).toBe(
      `Bearer ${makeAccessToken("user-1", { amr: ["oidc"] })}`,
    );
  });

  test("logIn waits for the startup anonymous sign-in", async () => {
    const order: string[] = [];
    server.use(
      iamLoginHandler((body) => {
        order.push(body.method as string);
        return body.method === "anonymous"
          ? jsonResponse(makeTokensResponse("anon-1"))
          : jsonResponse(makeTokensResponse("user-1", { amr: ["google"] }));
      }),
    );
    const purchases = configureWithIam();

    await purchases.logIn({ method: "google", idToken: "google-token" });

    expect(order).toEqual(["anonymous", "google"]);
    expect(purchases.getAppUserId()).toBe("user-1");
  });

  test("logOut revokes and signs in as a new anonymous user", async () => {
    storeSession("user-1", ["oidc"]);
    const revoked: unknown[] = [];
    server.use(
      http.post(`${BASE_URL}/auth/revoke`, async ({ request }) => {
        revoked.push(await request.json());
        return HttpResponse.json({});
      }),
      iamLoginHandler(() => jsonResponse(makeTokensResponse("anon-2"))),
    );
    const purchases = configureWithIam();
    await purchases.getCustomerInfo();

    await purchases.logOut();

    expect(revoked).toEqual([
      {
        token: makeTokensResponse("user-1", { amr: ["oidc"] }).refresh_token,
        token_type_hint: "refresh_token",
      },
    ]);
    expect(purchases.getAppUserId()).toBe("anon-2");
    expect(purchases.isAnonymous()).toBe(true);
  });

  test("logOut rejects an anonymous user", async () => {
    server.use(
      iamLoginHandler(() => jsonResponse(makeTokensResponse("anon-1"))),
    );
    const purchases = configureWithIam();
    await purchases.getCustomerInfo();

    const error = await purchases.logOut().catch((e) => e);

    expect((error as PurchasesError).errorCode).toBe(
      ErrorCode.LogOutWithAnonymousUserError,
    );
  });

  test("uses tokens passed at configure time instead of signing in", async () => {
    storeSession("anon-old");
    const login = vi.fn(() => jsonResponse(makeTokensResponse("anon-new")));
    server.use(iamLoginHandler(login));
    const accessToken = makeAccessToken("user-1", { amr: ["firebase"] });

    const purchases = Purchases.configure({
      apiKey: API_KEY,
      iamEnabled: true,
      iamTokens: { accessToken, refreshToken: "server-refresh-token" },
    });
    await purchases.getCustomerInfo();

    expect(login).not.toHaveBeenCalled();
    expect(purchases.getAppUserId()).toBe("user-1");
    expect(requests.find((r) => r.path === "/v1/customer")?.authorization).toBe(
      `Bearer ${accessToken}`,
    );
  });

  test("rejects malformed tokens at configure time", () => {
    expect(() =>
      Purchases.configure({
        apiKey: API_KEY,
        iamEnabled: true,
        iamTokens: { accessToken: "not-a-jwt" },
      }),
    ).toThrow(PurchasesError);
  });

  test("_setIamTokens switches to the tokens' user", async () => {
    server.use(
      iamLoginHandler(() => jsonResponse(makeTokensResponse("anon-1"))),
    );
    const purchases = configureWithIam();
    await purchases.getCustomerInfo();

    await purchases._setIamTokens({
      accessToken: makeAccessToken("user-1", { amr: ["oidc"] }),
      refreshToken: "server-refresh-token",
    });

    expect(purchases.getAppUserId()).toBe("user-1");
    expect(purchases.isAnonymous()).toBe(false);
  });

  test("rejects Amazon API keys", () => {
    expect(() =>
      Purchases.configure({ apiKey: "amzn_test_key", iamEnabled: true }),
    ).toThrow(PurchasesError);
  });
});

describe("Purchases configured without IAM", () => {
  test.each(["logIn", "logOut"] as const)("%s requires IAM", async (method) => {
    const purchases = Purchases.configure({
      apiKey: API_KEY,
      appUserId: "user-1",
    });

    const error = await (
      method === "logIn"
        ? purchases.logIn({ method: "oidc", idToken: "token" })
        : purchases.logOut()
    ).catch((e) => e);

    expect((error as PurchasesError).errorCode).toBe(
      ErrorCode.ConfigurationError,
    );
  });
});
