import type { StripeElementsConfiguration } from "./stripe-elements";

export interface TaxBreakdown {
  tax_amount_in_micros: number;
  display_name: string;
}

export enum CheckoutCalculateTaxFailedReason {
  tax_collection_disabled = "tax_collection_disabled",
  invalid_tax_location = "invalid_tax_location",
  rate_limit_exceeded = "rate_limit_exceeded",
  missing_required_permission = "missing_required_permission",
  invalid_origin_address = "invalid_origin_address",
  taxes_not_active = "taxes_not_active",
  unexpected_gateway_error = "unexpected_gateway_error",
}

export interface CheckoutCalculateTaxResponse {
  operation_session_id: string;
  currency: string;
  total_amount_in_micros: number;
  tax_amount_in_micros: number;
  total_excluding_tax_in_micros: number;
  tax_inclusive: boolean;
  tax_breakdown: TaxBreakdown[];
  gateway_params: {
    elements_configuration: StripeElementsConfiguration;
  };
  failed_reason?: CheckoutCalculateTaxFailedReason | string;
}
