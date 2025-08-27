import type { VirtualCurrencies } from "../entities/virtual-currencies";

export class InMemoryCache {
  private virtualCurrenciesCache = new Map<string, VirtualCurrencies>();
  private virtualCurrenciesTimestamps = new Map<string, number>();
  readonly CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

  invalidateAllCaches(): void {
    this.virtualCurrenciesCache.clear();
    this.virtualCurrenciesTimestamps.clear();
  }

  cacheVirtualCurrencies(
    appUserID: string,
    virtualCurrencies: VirtualCurrencies,
  ): void {
    this.virtualCurrenciesCache.set(appUserID, virtualCurrencies);
    this.virtualCurrenciesTimestamps.set(appUserID, Date.now());
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
    const data = this.virtualCurrenciesCache.get(appUserID);
    const timestamp = this.virtualCurrenciesTimestamps.get(appUserID);

    if (!data || timestamp === undefined) {
      return null;
    }

    if (allowStaleCache) {
      return data;
    }

    const now = Date.now();
    const isExpired = now - timestamp >= this.CACHE_EXPIRY_MS;

    if (isExpired) {
      return null;
    }

    return data;
  }

  invalidateVirtualCurrenciesCache(appUserID: string): void {
    this.virtualCurrenciesCache.delete(appUserID);
    this.virtualCurrenciesTimestamps.delete(appUserID);
  }
}
