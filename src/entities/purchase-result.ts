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

  /**
   * The email of the customer who made the purchase.
   */
  readonly customerEmail: string | null;

  /**
   * The date when the subscription will renew.
   * This will be null for non-subscription purchases or lifetime subscriptions.
   */
  readonly renewalDate: Date | null;
}
