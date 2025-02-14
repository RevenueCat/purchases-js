import type { CustomerInfo } from "./customer-info";
import type { RedemptionInfo } from "./redemption-info";

/**
 * Represents the result of a purchase operation.
 * @public
 */
export interface PurchaseResult {
  /**
   * The customer information after the purchase.
   */
  readonly customerInfo: CustomerInfo;
  /**
   * The redemption information after the purchase if available.
   */
  readonly redemptionInfo: RedemptionInfo | null;

  /**
   * The operation session id of the purchase.
   */
  readonly operationSessionId: string;
}
