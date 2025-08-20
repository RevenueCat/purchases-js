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

  getCachedVirtualCurrencies(appUserID: string): VirtualCurrencies | null {
    const entry = this.virtualCurrenciesCache.get(appUserID);
    return this.getCachedData(entry ?? null);
  }

  invalidateVirtualCurrenciesCache(appUserID: string): void {
    this.virtualCurrenciesCache.delete(appUserID);
  }

  private getCachedData<T>(entry: CacheEntry<T> | null): T | null {
    if (!entry) {
      return null;
    }

    const now = Date.now();
    const isExpired = now - entry.lastUpdatedAt >= this.CACHE_EXPIRY_MS;

    if (isExpired) {
      return null;
    }

    return entry.data;
  }
}
