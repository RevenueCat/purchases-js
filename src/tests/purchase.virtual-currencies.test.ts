import { describe, expect, test } from "vitest";
import { StatusCodes } from "http-status-codes";
import { configurePurchases, server } from "./base.purchases_test";
import { APIGetRequest, type GetRequest } from "./test-responses";
import { expectPromiseToError } from "./test-helpers";
import type { VirtualCurrencies } from "../entities/virtual-currencies";
import { http, HttpResponse } from "msw";
import { PurchasesError, ErrorCode } from "../entities/errors";

describe("getVirtualCurrencies", () => {
  const appUserIDWith3Currencies = "test-app-user-id-with-3-currencies";
  const appUserIDWith0Currencies = "test-app-user-id-with-0-currencies";

  const createExpectedVirtualCurrenciesWith3Currencies: () => VirtualCurrencies =
    () => ({
      all: {
        GLD: {
          balance: 100,
          code: "GLD",
          name: "Gold",
          serverDescription: "It's gold",
        },
        SLV: {
          balance: 100,
          code: "SLV",
          name: "Silver",
          serverDescription: null,
        },
        BRNZ: {
          balance: -1,
          code: "BRNZ",
          name: "Bronze",
          serverDescription: "It's bronze",
        },
      },
    });

  const createExpectedVirtualCurrenciesWith0Currencies: () => VirtualCurrencies =
    () => ({
      all: {},
    });

  test("returns expected virtual currencies from network request when there are 3 currencies", async () => {
    const expectedVirtualCurrencies =
      createExpectedVirtualCurrenciesWith3Currencies();
    const expectedRequest: GetRequest = {
      url: `http://localhost:8000/v1/subscribers/${appUserIDWith3Currencies}/virtual_currencies`,
    };

    const purchases = configurePurchases(appUserIDWith3Currencies);
    const virtualCurrencies = await purchases.getVirtualCurrencies();

    expect(virtualCurrencies).toEqual(expectedVirtualCurrencies);
    expect(APIGetRequest).toHaveBeenCalledWith(expectedRequest);
  });

  test("returns 0 virtual currencies from network request when there are 0 currencies", async () => {
    const expectedVirtualCurrencies =
      createExpectedVirtualCurrenciesWith0Currencies();
    const expectedRequest: GetRequest = {
      url: `http://localhost:8000/v1/subscribers/${appUserIDWith0Currencies}/virtual_currencies`,
    };

    const purchases = configurePurchases(appUserIDWith0Currencies);
    const virtualCurrencies = await purchases.getVirtualCurrencies();

    expect(virtualCurrencies).toEqual(expectedVirtualCurrencies);
    expect(APIGetRequest).toHaveBeenCalledWith(expectedRequest);
  });

  test("returns cached virtual currencies when there are 3 currencies", async () => {
    const expectedVirtualCurrencies =
      createExpectedVirtualCurrenciesWith3Currencies();
    const expectedRequest: GetRequest = {
      url: `http://localhost:8000/v1/subscribers/${appUserIDWith3Currencies}/virtual_currencies`,
    };

    const purchases = configurePurchases(appUserIDWith3Currencies);

    // First call - should make API request
    const virtualCurrencies1 = await purchases.getVirtualCurrencies();
    expect(APIGetRequest).toHaveBeenCalledExactlyOnceWith(expectedRequest);

    // Second call - should use cache, no additional API request
    const virtualCurrencies2 = await purchases.getVirtualCurrencies();

    expect(APIGetRequest).toHaveBeenCalledTimes(1);
    expect(virtualCurrencies1).toEqual(expectedVirtualCurrencies);
    expect(virtualCurrencies2).toEqual(expectedVirtualCurrencies);
  });

  test("different users don't share virtual currencies cache", async () => {
    const user1ExpectedVirtualCurrencies =
      createExpectedVirtualCurrenciesWith3Currencies();
    const user2ExpectedVirtualCurrencies =
      createExpectedVirtualCurrenciesWith0Currencies();

    const purchases = configurePurchases(appUserIDWith3Currencies);

    // User 1: First call should fetch virtual currencies from the network and persist them in the cache.
    const expectedUser1Request: GetRequest = {
      url: `http://localhost:8000/v1/subscribers/${appUserIDWith3Currencies}/virtual_currencies`,
    };
    const user1VirtualCurrencies = await purchases.getVirtualCurrencies();
    expect(user1VirtualCurrencies).toEqual(user1ExpectedVirtualCurrencies);
    expect(APIGetRequest).toHaveBeenCalledExactlyOnceWith(expectedUser1Request);

    // Call the function again, ensuring that it returns the same value from the cache.
    const cachedVirtualCurrencies = await purchases.getVirtualCurrencies();
    expect(cachedVirtualCurrencies).toEqual(user1ExpectedVirtualCurrencies);
    expect(APIGetRequest).toHaveBeenCalledExactlyOnceWith(expectedUser1Request);

    // Switch to user 2
    await purchases.changeUser(appUserIDWith0Currencies);

    // User 2: Virtual currencies should be fetched from network (not from user 1's cache)
    const expectedUser2Request: GetRequest = {
      url: `http://localhost:8000/v1/subscribers/${appUserIDWith0Currencies}/virtual_currencies`,
    };
    const user2VirtualCurrencies = await purchases.getVirtualCurrencies();
    expect(user2VirtualCurrencies).toEqual(user2ExpectedVirtualCurrencies);

    // Verify we made both virtual currencies API calls
    expect(APIGetRequest).toHaveBeenCalledWith(expectedUser1Request);
    expect(APIGetRequest).toHaveBeenCalledWith(expectedUser2Request);
  });

  describe("error handling", () => {
    test("throws UnknownBackendError on 500 server error", async () => {
      const purchases = configurePurchases(appUserIDWith3Currencies);

      server.use(
        http.get(
          `http://localhost:8000/v1/subscribers/${appUserIDWith3Currencies}/virtual_currencies`,
          () => {
            return HttpResponse.json(null, {
              status: StatusCodes.INTERNAL_SERVER_ERROR,
            });
          },
        ),
      );

      await expectPromiseToError(
        purchases.getVirtualCurrencies(),
        new PurchasesError(
          ErrorCode.UnknownBackendError,
          "Unknown backend error.",
          "Request: getVirtualCurrencies. Status code: 500. Body: null.",
        ),
      );
    });

    test("throws NetworkError on connection failure", async () => {
      const purchases = configurePurchases(appUserIDWith3Currencies);

      server.use(
        http.get(
          `http://localhost:8000/v1/subscribers/${appUserIDWith3Currencies}/virtual_currencies`,
          () => {
            // Simulate connection failure by throwing a network error
            return HttpResponse.error();
          },
        ),
      );

      await expectPromiseToError(
        purchases.getVirtualCurrencies(),
        new PurchasesError(
          ErrorCode.NetworkError,
          "Error performing request. Please check your network connection and try again.",
          "Failed to fetch",
        ),
      );
    });
  });
});
