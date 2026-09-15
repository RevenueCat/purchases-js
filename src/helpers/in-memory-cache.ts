import type { VirtualCurrencies } from "../entities/virtual-currencies";
import type { OfferingsResponse } from "../networking/responses/offerings-response";

interface CacheEntry<T> {
  data: T;
  lastUpdatedAt: number;
}

export class InMemoryCache {
  private virtualCurrenciesCache = new Map<
    string,
    CacheEntry<VirtualCurrencies>
  >();
  private offeringsResponseCache = new Map<
    string,
    CacheEntry<OfferingsResponse>
  >();
  readonly VIRTUAL_CURRENCIES_CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
  readonly OFFERINGS_CACHE_EXPIRY_MS = 10 * 1000; // 10 seconds

  invalidateAllCaches(): void {
    this.virtualCurrenciesCache.clear();
    this.offeringsResponseCache.clear();
  }

  /**
   * Caches a raw offerings response for an app user.
   *
   * @param appUserID - The unique identifier for the app user
   * @param offeringsResponse - The raw offerings response to cache
   */
  cacheOfferingsResponse(
    appUserID: string,
    offeringsResponse: OfferingsResponse,
  ): void {
    this.offeringsResponseCache.set(appUserID, {
      data: offeringsResponse,
      lastUpdatedAt: Date.now(),
    });
  }

  getCachedOfferingsResponse(appUserID: string): OfferingsResponse | null {
    const entry = this.offeringsResponseCache.get(appUserID);
    return this.getCachedData(entry ?? null, this.OFFERINGS_CACHE_EXPIRY_MS);
  }

  invalidateOfferingsCache(appUserID?: string): void {
    if (appUserID === undefined) {
      this.offeringsResponseCache.clear();
      return;
    }
    this.offeringsResponseCache.delete(appUserID);
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
    return this.getCachedData(
      entry ?? null,
      this.VIRTUAL_CURRENCIES_CACHE_EXPIRY_MS,
      allowStaleCache,
    );
  }

  invalidateVirtualCurrenciesCache(appUserID: string): void {
    this.virtualCurrenciesCache.delete(appUserID);
  }

  /**
   * Generic method to retrieve cached data with expiry checking.
   *
   * @param entry - The cache entry containing the data and timestamp
   * @param cacheExpiryMs - The maximum age of the cache entry
   * @param allowStaleCache - If true, bypasses expiry checks and returns data regardless of age
   * @returns The cached data or null if not found or expired (when allowStaleCache is false)
   */
  private getCachedData<T>(
    entry: CacheEntry<T> | null,
    cacheExpiryMs: number,
    allowStaleCache: boolean = false,
  ): T | null {
    if (!entry) {
      return null;
    }

    if (allowStaleCache) {
      return entry.data;
    }

    const now = Date.now();
    const isExpired = now - entry.lastUpdatedAt >= cacheExpiryMs;

    if (isExpired) {
      return null;
    }

    return entry.data;
  }
}
