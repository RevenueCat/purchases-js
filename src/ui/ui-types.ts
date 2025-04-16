import type { TaxBreakdown } from "../networking/responses/checkout-calculate-tax-response";

export type CurrentPage =
  | "email-entry"
  | "email-entry-processing"
  | "payment-entry-loading"
  | "payment-entry"
  | "payment-entry-processing"
  | "success"
  | "error";

export type TaxCalculationStatus =
  | "unavailable" // Tax collection status is not yet known
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
