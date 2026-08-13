import type { ProductsResponse } from "../networking/responses/products-response";
import type { PurchaseResult } from "src/entities/purchase-result";
import type { PurchaseParams } from "src/entities/purchase-params";
import type { RestorePurchasesResult } from "src/entities/restore-purchases-result";
import type { SyncPurchasesResult } from "src/entities/sync-purchases-result";

/**
 * Abstract interface for store-specific billing operations.
 * Implementations handle product fetching, purchases, and purchase syncing
 * for different billing providers (Web Billing, Amazon, etc.).
 * @internal
 */
export interface BillingWrapper {
  /**
   * Fetches product details (prices) for the given product IDs from the store.
   * @param appUserId - The app user ID.
   * @param productIds - The product IDs to fetch.
   * @param currency - Optional currency code to fetch prices in.
   * @returns The products response containing product details.
   */
  getProducts(
    appUserId: string,
    productIds: string[],
    currency?: string,
    discountCode?: string,
  ): Promise<ProductsResponse>;

  /**
   * Executes a purchase for the given parameters.
   * @param params - The purchase parameters.
   * @param appUserId - The current appUserId.
   * @returns The result of the purchase operation.
   */
  purchase(params: PurchaseParams, appUserId: string): Promise<PurchaseResult>;

  restorePurchases(appUserId: string): Promise<RestorePurchasesResult>;

  syncPurchases(appUserId: string): Promise<SyncPurchasesResult>;
}
