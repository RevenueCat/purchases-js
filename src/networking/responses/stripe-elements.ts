export enum StripeElementsMode {
  Payment = "payment",
  Setup = "setup",
}

export enum StripeElementsSetupFutureUsage {
  OffSession = "off_session",
  OnSession = "on_session",
}

export interface StripeElementsConfiguration {
  mode: StripeElementsMode;
  payment_method_types: string[];
  setup_future_usage: StripeElementsSetupFutureUsage;
  amount?: number;
  currency?: string;
}

export interface GatewayParams {
  stripe_account_id?: string;
  publishable_api_key?: string;
  elements_configuration?: StripeElementsConfiguration;
}
