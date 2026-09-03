import type { CustomerInfo } from "./customer-info";
import type { PurchaseResponseAttributionMetadata } from "./purchase-params";
import type { RedemptionInfo } from "./redemption-info";
import type { StoreTransaction } from "./store-transaction";
import type { Package } from "./offerings";

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
   * The store transaction associated with the purchase.
   */
  readonly storeTransaction: StoreTransaction;

  /**
   * The email used for this purchase (checkout form or wallet).
   * Undefined when the SDK did not collect one (e.g. some hosted/Paddle paths).
   */
  readonly customerEmail?: string;

  /**
   * Attribution metadata returned by the checkout status response.
   * @internal
   */
  readonly attributionMetadata?: PurchaseResponseAttributionMetadata;

  /**
   * Only present if the purchase was a RevenueCat Billing product change
   * ({@link PurchaseParams.productChangeInfo}).
   * @internal
   */
  readonly productChange?: {
    changeType: "immediate" | "deferred";
  };
}

/**
 * Represents the result of a purchase operation initiated from a paywall.
 * @public
 */
export interface PaywallPurchaseResult extends PurchaseResult {
  /**
   * The package selected by the customer while interacting with the paywall.
   */
  selectedPackage: Package;
}
