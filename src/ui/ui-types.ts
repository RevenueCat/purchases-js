import type { TaxBreakdown } from "../networking/responses/checkout-calculate-tax-response";
import type { PurchaseFlowError } from "../helpers/purchase-operation-helper";

export type CurrentPage =
  | "email-entry"
  | "email-entry-processing"
  | "payment-entry-loading"
  | "payment-entry"
  | "payment-entry-processing"
  | "success"
  | "error";

export type ContinueHandlerParams = {
  authInfo?: { email: string };
  error?: PurchaseFlowError;
};

export type TaxCalculationStatus = "pending" | "loading" | "calculated";

export type TaxCalculationPendingReason =
  | "needs_postal_code"
  | "needs_state_or_postal_code"
  | "needs_complete_billing_address";

export type PriceBreakdown = {
  currency: string;
  totalAmountInMicros: number;
  taxCollectionEnabled: boolean;
  taxCalculationBasedOnFullAddress: boolean;
  totalExcludingTaxInMicros: number;
  taxCalculationStatus: TaxCalculationStatus | null;
  pendingReason: TaxCalculationPendingReason | null;
  taxAmountInMicros: number | null;
  taxBreakdown: TaxBreakdown[] | null;
};

export type TaxCustomerDetails = {
  countryCode: string | undefined;
  postalCode: string | undefined;
};
