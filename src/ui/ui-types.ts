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
  error?: PurchaseFlowError;
};

export type TaxCalculationStatus =
  | "pending"
  | "loading"
  | "calculated"
  | "disabled";

export type TaxCalculationPendingReason =
  | "needs_postal_code"
  | "needs_state_or_postal_code"
  | "invalid_postal_code";

export type PriceBreakdown = {
  currency: string;
  totalAmountInMicros: number;
  totalExcludingTaxInMicros: number;
  taxCalculationStatus: TaxCalculationStatus;
  pendingReason: TaxCalculationPendingReason | null;
  taxAmountInMicros: number | null;
  taxBreakdown: TaxBreakdown[] | null;
};

export type TaxCustomerDetails = {
  countryCode: string | undefined;
  postalCode: string | undefined;
};
