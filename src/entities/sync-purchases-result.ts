import type { CustomerInfo } from "./customer-info";

/**
 * The result of syncing purchases.
 * @public
 */
export interface SyncPurchasesResult {
  customerInfo: CustomerInfo;
}
