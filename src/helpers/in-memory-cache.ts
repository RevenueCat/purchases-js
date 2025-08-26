import type { VirtualCurrencies } from "../entities/virtual-currencies";

interface CacheEntry<T> {
  data: T;
  lastUpdatedAt: number;
}

export class InMemoryCache {
  private virtualCurrenciesCache = new Map<
    string,
    CacheEntry<VirtualCurrencies>
  >();
  readonly CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

  invalidateAllCaches(): void {
    this.virtualCurrenciesCache.clear();
  }

  cacheVirtualCurrencies(
    appUserID: string,
    virtualCurrencies: VirtualCurrencies,
  ): void {
    this.virtualCurrenciesCache.set(appUserID, {
      data: virtualCurrencies,
      lastUpdatedAt: Date.now(),
    });
  }

  /**
   * Retrieves cached virtual currencies for a given app user.
   *
   * @param appUserID - The unique identifier for the app user
   * @param allowStaleCache - If true, returns cached data regardless of age; if false, respects cache expiry
   * @returns The cached virtual currencies or null if not found or expired
   */
  getCachedVirtualCurrencies(
    appUserID: string,
    allowStaleCache: boolean = false,
  ): VirtualCurrencies | null {
    const entry = this.virtualCurrenciesCache.get(appUserID);
    return this.getCachedData(entry ?? null, allowStaleCache);
  }

  invalidateVirtualCurrenciesCache(appUserID: string): void {
    this.virtualCurrenciesCache.delete(appUserID);
  }

  /**
   * Generic method to retrieve cached data with expiry checking.
   *
   * @param entry - The cache entry containing the data and timestamp
   * @param allowStaleCache - If true, bypasses expiry checks and returns data regardless of age
   * @returns The cached data or null if not found or expired (when allowStaleCache is false)
   */
  private getCachedData<T>(
    entry: CacheEntry<T> | null,
    allowStaleCache: boolean = false,
  ): T | null {
    if (!entry) {
      return null;
    }

    if (allowStaleCache) {
      return entry.data;
    }

    const now = Date.now();
    const isExpired = now - entry.lastUpdatedAt >= this.CACHE_EXPIRY_MS;

    if (isExpired) {
      return null;
    }

    return entry.data;
  }
}
