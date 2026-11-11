import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  test,
  vi,
} from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { performRequest } from "../../networking/http-client";
import { GetCustomerInfoEndpoint } from "../../networking/endpoints";
import type {
  IamCredentials,
  IamRequestAuthorizer,
} from "../../iam/iam-session-manager";
import { ErrorCode, PurchasesError } from "../../entities/errors";
import EventsTracker from "../../behavioural-events/events-tracker";
import { customerInfoResponse } from "../test-responses";

const API_KEY = "rcb_sb_test_api_key";
const CUSTOMER_URL = "http://localhost:8000/v1/subscribers/user-1";
const EVENTS_URL = "http://localhost:8000/v1/events";
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

/**
 * An authorizer whose session starts with `initialToken` (in memory unless
 * `sessionLoaded` is false) and moves to `refreshedToken` on refresh.
 */
function fakeAuthorizer(
  initialToken: string,
  refreshedToken: string | null,
  { sessionLoaded = true }: { sessionLoaded?: boolean } = {},
): IamRequestAuthorizer & {
  getCredentials: ReturnType<typeof vi.fn>;
  refreshAfterUnauthorized: ReturnType<typeof vi.fn>;
} {
  let current: IamCredentials = {
    accessToken: initialToken,
    appUserId: "user-1",
  };
  let loaded = sessionLoaded;
  return {
    getCurrentCredentials: () => (loaded ? current : null),
    getCredentials: vi.fn(async (): Promise<IamCredentials> => {
      loaded = true;
      return current;
    }),
    refreshAfterUnauthorized: vi.fn(async () => {
      if (!refreshedToken) {
        return null;
      }
      current = { accessToken: refreshedToken, appUserId: "user-1" };
      return current;
    }),
  };
}

function respondByToken(statusByToken: Record<string, number>, url: string) {
  const authorizations: string[] = [];
  server.use(
    http.all(url, ({ request }) => {
      const authorization = request.headers.get("Authorization") ?? "";
      authorizations.push(authorization);
      const token = authorization.replace("Bearer ", "");
      const status = statusByToken[token] ?? 200;
      return status === 200
        ? HttpResponse.json(customerInfoResponse, { status })
        : HttpResponse.json(
            { code: 7224, message: "Invalid token" },
            { status },
          );
    }),
  );
  return authorizations;
}

describe("performRequest with an IAM authorizer", () => {
  const endpoint = new GetCustomerInfoEndpoint("user-1");

  test("sends the access token instead of the API key", async () => {
    let request: Request | undefined;
    server.use(
      http.get(CUSTOMER_URL, ({ request: r }) => {
        request = r;
        return HttpResponse.json(customerInfoResponse);
      }),
    );

    await performRequest(endpoint, {
      apiKey: API_KEY,
      iamAuthorizer: fakeAuthorizer("token-1", null),
    });

    expect(request?.headers.get("Authorization")).toBe("Bearer token-1");
    // The environment still comes from the configured key.
    expect(request?.headers.get("X-Is-Sandbox")).toBe("true");
  });

  test("refreshes once after a 401 and retries with the new token", async () => {
    const authorizations = respondByToken({ "token-1": 401 }, CUSTOMER_URL);
    const authorizer = fakeAuthorizer("token-1", "token-2");

    const response = await performRequest(endpoint, {
      apiKey: API_KEY,
      iamAuthorizer: authorizer,
    });

    expect(response).toEqual(customerInfoResponse);
    expect(authorizations).toEqual(["Bearer token-1", "Bearer token-2"]);
    expect(authorizer.refreshAfterUnauthorized).toHaveBeenCalledWith({
      accessToken: "token-1",
      appUserId: "user-1",
    });
  });

  test("retries only once", async () => {
    const authorizations = respondByToken(
      { "token-1": 401, "token-2": 401 },
      CUSTOMER_URL,
    );
    const authorizer = fakeAuthorizer("token-1", "token-2");

    const error = await performRequest(endpoint, {
      apiKey: API_KEY,
      iamAuthorizer: authorizer,
    }).catch((e) => e);

    expect(error).toBeInstanceOf(PurchasesError);
    expect(authorizations).toHaveLength(2);
    expect(authorizer.refreshAfterUnauthorized).toHaveBeenCalledTimes(1);
  });

  test("does not retry when the session can't be refreshed", async () => {
    const authorizations = respondByToken({ "token-1": 401 }, CUSTOMER_URL);

    const error = await performRequest(endpoint, {
      apiKey: API_KEY,
      iamAuthorizer: fakeAuthorizer("token-1", null),
    }).catch((e) => e);

    expect((error as PurchasesError).errorCode).toBe(
      ErrorCode.InvalidCredentialsError,
    );
    expect(authorizations).toEqual(["Bearer token-1"]);
  });

  test("does not refresh after a 403", async () => {
    respondByToken({ "token-1": 403 }, CUSTOMER_URL);
    const authorizer = fakeAuthorizer("token-1", "token-2");

    await performRequest(endpoint, {
      apiKey: API_KEY,
      iamAuthorizer: authorizer,
    }).catch(() => undefined);

    expect(authorizer.refreshAfterUnauthorized).not.toHaveBeenCalled();
  });

  test("keeps the API key and never refreshes without an authorizer", async () => {
    const authorizations = respondByToken({ [API_KEY]: 401 }, CUSTOMER_URL);

    await performRequest(endpoint, { apiKey: API_KEY }).catch(() => undefined);

    expect(authorizations).toEqual([`Bearer ${API_KEY}`]);
  });
});

describe("EventsTracker with an IAM authorizer", () => {
  function createTracker(authorizer: IamRequestAuthorizer) {
    return new EventsTracker({
      apiKey: API_KEY,
      appUserId: "user-1",
      rcSource: null,
      iamAuthorizer: authorizer,
    });
  }

  test("flushes with the access token and retries a 401 with the refreshed one", async () => {
    const authorizations = respondByToken({ "token-1": 401 }, EVENTS_URL);
    const authorizer = fakeAuthorizer("token-1", "token-2");
    const tracker = createTracker(authorizer);

    tracker.trackExternalEvent({ eventName: "test", source: "sdk" });
    await vi.waitFor(() =>
      expect(authorizer.refreshAfterUnauthorized).toHaveBeenCalled(),
    );
    await tracker.flushAllEvents();

    expect(authorizations).toEqual(["Bearer token-1", "Bearer token-2"]);
    tracker.dispose();
  });

  test("starts the keepalive request in the tracking task when the session is loaded", () => {
    respondByToken({}, EVENTS_URL);
    const authorizer = fakeAuthorizer("token-1", null);
    const tracker = createTracker(authorizer);
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    tracker.trackExternalEvent({ eventName: "test", source: "sdk" });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(authorizer.getCredentials).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
    tracker.dispose();
  });

  test("waits for the session before flushing when none is loaded", async () => {
    const authorizations = respondByToken({}, EVENTS_URL);
    const authorizer = fakeAuthorizer("token-1", null, {
      sessionLoaded: false,
    });
    const tracker = createTracker(authorizer);

    tracker.trackExternalEvent({ eventName: "test", source: "sdk" });
    await tracker.flushAllEvents();

    expect(authorizer.getCredentials).toHaveBeenCalled();
    expect(authorizations).toEqual(["Bearer token-1"]);
    tracker.dispose();
  });
});
