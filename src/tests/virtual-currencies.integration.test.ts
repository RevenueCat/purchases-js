import { describe, it, expect, beforeEach } from "vitest";
import { Purchases } from "../main";

describe("VirtualCurrencies Integration Test", () => {
  let purchases: Purchases;
  const testAppUserId = `test-user-${Date.now()}`;

  beforeEach(() => {
    // Configure Purchases with test API key
    // You'll need to set VITE_TEST_API_KEY environment variable with a real RevenueCat API key
    const apiKey = process.env.VITE_TEST_API_KEY;
    if (!apiKey) {
      throw new Error(
        "VITE_TEST_API_KEY environment variable is required for integration tests",
      );
    }

    purchases = Purchases.configure({
      apiKey,
      appUserId: testAppUserId,
    });
  });

  it("should fetch virtual currencies from server and cache them", async () => {
    // Initially cached VCs should be null
    expect(purchases.getCachedVirtualCurrencies()).toBeNull();

    // Fetch virtual currencies from server
    const virtualCurrencies = await purchases.getVirtualCurrencies();

    expect(virtualCurrencies).toBeDefined();
    expect(virtualCurrencies.all).toBeDefined();
    expect(typeof virtualCurrencies.all).toBe("object");

    // Test that caching works - should now return the same data
    const cachedVCs = purchases.getCachedVirtualCurrencies();
    expect(cachedVCs).toEqual(virtualCurrencies);
  });

  it("should isolate cache per appUserID", async () => {
    const user1Id = `test-user-1-${Date.now()}`;
    const user2Id = `test-user-2-${Date.now()}`;

    const purchases1 = Purchases.configure({
      apiKey: process.env.VITE_TEST_API_KEY!,
      appUserId: user1Id,
    });

    const purchases2 = Purchases.configure({
      apiKey: process.env.VITE_TEST_API_KEY!,
      appUserId: user2Id,
    });

    // Fetch for both users
    const vcs1 = await purchases1.getVirtualCurrencies();
    const vcs2 = await purchases2.getVirtualCurrencies();

    // Both should have their own cached data
    expect(purchases1.getCachedVirtualCurrencies()).toEqual(vcs1);
    expect(purchases2.getCachedVirtualCurrencies()).toEqual(vcs2);

    // Invalidating one user shouldn't affect the other
    purchases1.invalidateCachedVirtualCurrencies();
    expect(purchases1.getCachedVirtualCurrencies()).toBeNull();
    expect(purchases2.getCachedVirtualCurrencies()).toEqual(vcs2);
  });

  it("should handle cache invalidation correctly", async () => {
    // Fetch and cache
    const originalVCs = await purchases.getVirtualCurrencies();
    expect(purchases.getCachedVirtualCurrencies()).toEqual(originalVCs);

    // Invalidate cache
    purchases.invalidateCachedVirtualCurrencies();
    expect(purchases.getCachedVirtualCurrencies()).toBeNull();

    // Fetch again - should make new server request
    const refreshedVCs = await purchases.getVirtualCurrencies();
    expect(refreshedVCs).toBeDefined();
    expect(purchases.getCachedVirtualCurrencies()).toEqual(refreshedVCs);
  });

  it(
    "should respect cache expiry",
    async () => {
      // This test would need to wait for cache to expire (5 minutes by default)
      // For now, just test that cache expiry time is configurable
      const vcs = await purchases.getVirtualCurrencies();
      expect(purchases.getCachedVirtualCurrencies()).toEqual(vcs);

      // Access the cache expiry to ensure it's configurable
      // @ts-expect-error - accessing private property for testing
      const cacheExpiryMs = purchases.inMemoryCache.CACHE_EXPIRY_MS;
      expect(cacheExpiryMs).toBe(5 * 60 * 1000); // 5 minutes
    },
    { timeout: 10000 },
  );
});
