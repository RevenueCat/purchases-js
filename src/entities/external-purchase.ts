import type { PurchasesError } from "./errors";
import type { PurchaseResult } from "./purchase-result";

/** Parameters for resuming an External purchase. @public */
export interface ResumeExternalPurchaseParams {
  /** Checkout token returned to your application. */
  checkoutToken: string;
  /** Maximum polling wait in milliseconds. Defaults to 15000; zero checks once.
   * In-flight requests may finish after this interval.
   */
  waitTimeoutMs?: number;
}

/** The latest result of an External checkout. @public */
export type ExternalPurchaseOutcome =
  | { status: "completed"; purchaseResult: PurchaseResult }
  | { status: "pending" }
  | { status: "failed"; error: PurchasesError }
  | { status: "expired" };
