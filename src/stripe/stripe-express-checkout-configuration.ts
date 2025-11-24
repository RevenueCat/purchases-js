// TODO: We can use the ApplePayUpdateOption from Stripe for this.
export interface StripeExpressCheckoutConfiguration {
  applePay?: {
    recurringPaymentRequest?: {
      paymentDescription: string;
      managementURL: string;
      regularBilling: {
        amount: number;
        label: string;
        recurringPaymentStartDate?: Date;
        recurringPaymentEndDate?: Date;
        recurringPaymentIntervalUnit?:
          | "year"
          | "month"
          | "day"
          | "hour"
          | "minute";
        recurringPaymentIntervalCount?: number;
      };
      trialBilling?: {
        amount: number;
        label?: string;
        recurringPaymentStartDate?: Date;
        recurringPaymentEndDate?: Date;
        recurringPaymentIntervalUnit?:
          | "year"
          | "month"
          | "day"
          | "hour"
          | "minute";
        recurringPaymentIntervalCount?: number;
      };
      billingAgreement?: string;
    };
  };
}
