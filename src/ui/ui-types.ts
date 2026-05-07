import type { TaxBreakdown } from "../networking/responses/checkout-pricing-response";

export type CurrentPage =
  | "payment-entry-loading"
  | "payment-entry"
  | "stripe-checkout"
  | "success"
  | "error";

export type TaxCalculationStatus =
  | "unavailable" // Tax collection status is not yet known
  | "pending"
  | "loading"
  | "calculated"
  | "disabled"
  | "miss-match"; // Billing details do not match the calculation;

export type AppliedDiscount = {
  identifier: string | null;
  displayName: string;
  discountedAmountInMicros: number;
  percentage: number | null;
  discountCode: string | null;
};

export type PriceBreakdown = {
  currency: string;
  originalAmountInMicros?: number;
  totalAmountInMicros: number;
  totalExcludingTaxInMicros: number;
  taxCalculationStatus: TaxCalculationStatus;
  taxAmountInMicros: number | null;
  taxBreakdown: TaxBreakdown[] | null;
  appliedDiscounts?: AppliedDiscount[];
};
