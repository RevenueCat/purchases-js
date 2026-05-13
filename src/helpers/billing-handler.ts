import type { ProductsResponse } from "../networking/responses/products-response";
import type { PurchaseResult } from "../entities/purchase-result";
import type {
  Package,
  PurchaseMetadata,
  PurchaseOption,
} from "../entities/offerings";

/**
 * Internal parameters for purchase operations passed to BillingHandler.
 * @internal
 */
export interface InternalPurchaseParams {
  /**
   * The app user ID for the purchase.
   */
  appUserId: string;
  /**
   * The package to purchase.
   */
  rcPackage: Package;
  /**
   * The purchase option to use. If not specified, the default option is used.
   */
  purchaseOption: PurchaseOption;
  /**
   * The customer's email address.
   */
  customerEmail?: string;
  /**
   * Metadata to associate with the purchase.
   */
  metadata?: PurchaseMetadata;
  /**
   * The HTML element to mount the purchase UI (for Web Billing).
   */
  htmlTarget?: HTMLElement;
  /**
   * The locale to use for the purchase flow.
   */
  selectedLocale?: string;
  /**
   * The default locale fallback.
   */
  defaultLocale?: string;
  /**
   * If true, skip the success page after purchase.
   */
  skipSuccessPage?: boolean;
}

/**
 * Represents a receipt from the store.
 * @internal
 */
export interface StoreReceipt {
  /**
   * The unique identifier for the receipt.
   */
  receiptId: string;
  /**
   * The product SKU.
   */
  sku: string;
  /**
   * The date of purchase.
   */
  purchaseDate: Date;
  /**
   * The date of cancellation, if cancelled.
   */
  cancelDate: Date | null;
  /**
   * Whether the receipt represents a cancelled purchase.
   */
  isCancelled: boolean;
}

/**
 * Result of syncing purchases from the store.
 * @internal
 */
export interface SyncPurchasesResult {
  /**
   * The receipts retrieved from the store.
   */
  receipts: StoreReceipt[];
  /**
   * Whether there are more receipts to fetch.
   */
  hasMore: boolean;
}

/**
 * Abstract interface for store-specific billing operations.
 * Implementations handle product fetching, purchases, and purchase syncing
 * for different billing providers (Web Billing, Amazon, etc.).
 * @internal
 */
export interface BillingHandler {
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
  ): Promise<ProductsResponse>;

  /**
   * Executes a purchase for the given parameters.
   * @param params - The purchase parameters.
   * @returns The result of the purchase operation.
   */
  purchase(params: InternalPurchaseParams): Promise<PurchaseResult>;

  /**
   * Syncs purchases from the store. For Amazon, this fetches purchase updates
   * and posts receipts to RevenueCat. For Web Billing, this is a no-op.
   * @param appUserId - The app user ID.
   * @param reset - If true, fetches all purchases. If false, fetches only updates since last call.
   * @returns The result containing synced receipts.
   */
  syncPurchases(
    appUserId: string,
    reset: boolean,
  ): Promise<SyncPurchasesResult>;
}
