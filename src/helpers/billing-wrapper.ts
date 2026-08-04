import type { ProductsResponse } from "../networking/responses/products-response";

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
}
