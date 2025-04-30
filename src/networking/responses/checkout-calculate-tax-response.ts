import type { StripeElementsConfiguration } from "./stripe-elements";

export interface TaxBreakdown {
  tax_amount_in_micros: number;
  display_name: string;
}

export interface CheckoutCalculateTaxResponse {
  operation_session_id: string;
  currency: string;
  total_amount_in_micros: number;
  tax_amount_in_micros: number;
  total_excluding_tax_in_micros: number;
  pricing_phases: {
    base: {
      tax_breakdown: TaxBreakdown[];
    };
  };
  gateway_params: {
    elements_configuration: StripeElementsConfiguration;
  };
}
