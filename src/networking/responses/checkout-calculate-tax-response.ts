import type { StripeElementsConfiguration } from "./stripe-elements";

export interface TaxBreakdown {
  taxable_amount_in_micros: number;
  tax_amount_in_micros: number;
  tax_rate_in_micros: number | null;
  country: string | null;
  state: string | null;
  tax_type: string | null;
}

export interface CheckoutCalculateTaxResponse {
  operation_session_id: string;
  currency: string;
  tax_inclusive: boolean;
  pricing_phases: {
    base: {
      tax_breakdown: TaxBreakdown[];
    };
  };
  gateway_params: {
    elements_configuration: StripeElementsConfiguration;
  };
}
