import type { TaxBreakdown } from "../networking/responses/checkout-calculate-tax-response";

export type CurrentPage =
  | "payment-entry-loading"
  | "payment-entry"
  | "success"
  | "error";

export type TaxCalculationStatus =
  | "unavailable" // Tax collection status is not yet known
  | "pending"
  | "loading"
  | "calculated"
  | "disabled"
  | "miss-match"; // Billing details do not match the calculation;

export type PriceBreakdown = {
  currency: string;
  totalAmountInMicros: number;
  totalExcludingTaxInMicros: number;
  taxCalculationStatus: TaxCalculationStatus;
  taxAmountInMicros: number | null;
  taxBreakdown: TaxBreakdown[] | null;
};
