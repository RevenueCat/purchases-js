import type { CustomerInfo } from "./customer-info";

/**
 * The result of restoring purchases.
 * @public
 */
export interface RestorePurchasesResult {
  customerInfo: CustomerInfo;
}
