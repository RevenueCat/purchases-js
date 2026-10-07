import { describe, expect, it, vi } from "vitest";
import { InMemoryCache } from "../../helpers/in-memory-cache";
import type { VirtualCurrencies } from "../../entities/virtual-currencies";
import type { OfferingsResponse } from "../../networking/responses/offerings-response";

describe("InMemoryCache", () => {
  const mockVirtualCurrencies: VirtualCurrencies = {
    all: {
      GLD: {
        balance: 100,
        name: "Gold",
        code: "GLD",
        serverDescription: "It's gold",
      },
      SLV: {
        balance: 50,
        name: "Silver",
        code: "SLV",
        serverDescription: null,
      },
    },
  };

  const appUserID = "user123";
  const appUserID2 = "user456";
  const offeringsResponse: OfferingsResponse = {
    current_offering_id: "default",
    offerings: [],
  };

  it("should invalidate all caches", () => {
    const cache = new InMemoryCache();

    cache.cacheVirtualCurrencies(appUserID, mockVirtualCurrencies);
    cache.cacheVirtualCurrencies(appUserID2, mockVirtualCurrencies);
    cache.cacheOfferingsResponse(appUserID, offeringsResponse);

    cache.invalidateAllCaches();

    expect(cache.getCachedVirtualCurrencies(appUserID)).toBeNull();
    expect(cache.getCachedVirtualCurrencies(appUserID2)).toBeNull();
    expect(cache.getCachedOfferingsResponse(appUserID)).toBeNull();
  });

  it("should cache offerings responses separately for each user", () => {
    const cache = new InMemoryCache();
    const otherOfferingsResponse: OfferingsResponse = {
      current_offering_id: "other",
      offerings: [],
    };

    cache.cacheOfferingsResponse(appUserID, offeringsResponse);
    cache.cacheOfferingsResponse(appUserID2, otherOfferingsResponse);

    expect(cache.getCachedOfferingsResponse(appUserID)).toEqual(
      offeringsResponse,
    );
    expect(cache.getCachedOfferingsResponse(appUserID2)).toEqual(
      otherOfferingsResponse,
    );
  });

  it("should expire offerings responses after their cache duration", () => {
    vi.useFakeTimers();
    const cache = new InMemoryCache();

    cache.cacheOfferingsResponse(appUserID, offeringsResponse);
    vi.advanceTimersByTime(cache.OFFERINGS_CACHE_EXPIRY_MS);

    expect(cache.getCachedOfferingsResponse(appUserID)).toBeNull();
    vi.useRealTimers();
  });

  it("should invalidate only the requested user's offerings response", () => {
    const cache = new InMemoryCache();

    cache.cacheOfferingsResponse(appUserID, offeringsResponse);
    cache.cacheOfferingsResponse(appUserID2, offeringsResponse);
    cache.invalidateOfferingsCache(appUserID);

    expect(cache.getCachedOfferingsResponse(appUserID)).toBeNull();
    expect(cache.getCachedOfferingsResponse(appUserID2)).toEqual(
      offeringsResponse,
    );
  });

  it("should cache and retrieve virtual currencies", () => {
    const cache = new InMemoryCache();

    cache.cacheVirtualCurrencies(appUserID, mockVirtualCurrencies);
    const cached = cache.getCachedVirtualCurrencies(appUserID);

    expect(cached).toEqual(mockVirtualCurrencies);
  });

  it("should return null virtual currencies when no virtual currencies are cached", () => {
    const cache = new InMemoryCache();

    const cached = cache.getCachedVirtualCurrencies(appUserID);

    expect(cached).toBeNull();
  });

  it("should return null virtual currencies when the cache is expired", () => {
    vi.useFakeTimers();
    const cache = new InMemoryCache();

    cache.cacheVirtualCurrencies(appUserID, mockVirtualCurrencies);

    // Fast-forward time by more than the cache expiry
    vi.advanceTimersByTime(cache.VIRTUAL_CURRENCIES_CACHE_EXPIRY_MS + 100);

    const cached = cache.getCachedVirtualCurrencies(appUserID);

    expect(cached).toBeNull();

    vi.useRealTimers();
  });

  it("should return cached virtual currencies when not expired", () => {
    vi.useFakeTimers();
    const cache = new InMemoryCache();

    cache.cacheVirtualCurrencies(appUserID, mockVirtualCurrencies);

    // Fast-forward time by less than the cache expiry
    vi.advanceTimersByTime(cache.VIRTUAL_CURRENCIES_CACHE_EXPIRY_MS - 100);

    const cached = cache.getCachedVirtualCurrencies(appUserID);

    expect(cached).toEqual(mockVirtualCurrencies);

    vi.useRealTimers();
  });

  it("should invalidate virtual currencies cache", () => {
    const cache = new InMemoryCache();

    cache.cacheVirtualCurrencies(appUserID, mockVirtualCurrencies);
    cache.invalidateVirtualCurrenciesCache(appUserID);
    const cached = cache.getCachedVirtualCurrencies(appUserID);

    expect(cached).toBeNull();
  });

  it("invalidating one user's cached VCs should not affect other users' cache", () => {
    const cache = new InMemoryCache();

    cache.cacheVirtualCurrencies(appUserID, mockVirtualCurrencies);
    cache.cacheVirtualCurrencies(appUserID2, mockVirtualCurrencies);

    cache.invalidateVirtualCurrenciesCache(appUserID);

    expect(cache.getCachedVirtualCurrencies(appUserID)).toBeNull();
    expect(cache.getCachedVirtualCurrencies(appUserID2)).toEqual(
      mockVirtualCurrencies,
    );
  });

  it("should cache VCs separately for different appUserIDs", () => {
    const cache = new InMemoryCache();
    const user1Data = { ...mockVirtualCurrencies };
    const user2Data = {
      all: {
        GLD: {
          balance: -1,
          name: "Gold",
          code: "GLD",
          serverDescription: "User 2 gold",
        },
      },
    };

    cache.cacheVirtualCurrencies(appUserID, user1Data);
    cache.cacheVirtualCurrencies(appUserID2, user2Data);

    expect(cache.getCachedVirtualCurrencies(appUserID)).toEqual(user1Data);
    expect(cache.getCachedVirtualCurrencies(appUserID2)).toEqual(user2Data);
  });

  describe("getCachedVirtualCurrencies with allowStaleCache parameter", () => {
    it("should return expired cache when allowStaleCache is true", () => {
      vi.useFakeTimers();
      const cache = new InMemoryCache();

      cache.cacheVirtualCurrencies(appUserID, mockVirtualCurrencies);

      vi.advanceTimersByTime(cache.VIRTUAL_CURRENCIES_CACHE_EXPIRY_MS + 100);

      // Should return null with default behavior (allowStaleCache = false)
      expect(cache.getCachedVirtualCurrencies(appUserID, false)).toBeNull();

      // Should return cached data when allowStaleCache is true
      expect(cache.getCachedVirtualCurrencies(appUserID, true)).toEqual(
        mockVirtualCurrencies,
      );

      vi.useRealTimers();
    });

    it("should return cached data when allowStaleCache is true and cache is not expired", () => {
      vi.useFakeTimers();
      const cache = new InMemoryCache();

      cache.cacheVirtualCurrencies(appUserID, mockVirtualCurrencies);
      vi.advanceTimersByTime(cache.VIRTUAL_CURRENCIES_CACHE_EXPIRY_MS - 100);

      // Should return cached data in both cases
      expect(cache.getCachedVirtualCurrencies(appUserID, false)).toEqual(
        mockVirtualCurrencies,
      );
      expect(cache.getCachedVirtualCurrencies(appUserID, true)).toEqual(
        mockVirtualCurrencies,
      );

      vi.useRealTimers();
    });

    it("should return null when allowStaleCache is true but no cache entry exists", () => {
      const cache = new InMemoryCache();

      // Should return null when no cache exists, regardless of allowStaleCache value
      expect(cache.getCachedVirtualCurrencies(appUserID, false)).toBeNull();
      expect(cache.getCachedVirtualCurrencies(appUserID, true)).toBeNull();
    });

    it("should respect allowStaleCache false (default behavior)", () => {
      vi.useFakeTimers();
      const cache = new InMemoryCache();

      cache.cacheVirtualCurrencies(appUserID, mockVirtualCurrencies);
      vi.advanceTimersByTime(cache.VIRTUAL_CURRENCIES_CACHE_EXPIRY_MS + 100);

      expect(cache.getCachedVirtualCurrencies(appUserID, false)).toBeNull();

      vi.useRealTimers();
    });
  });
});
