export { }; // eslint-disable-line

declare global {
  interface Window {
    Stripe?: (apiKey: string, options?: { stripeAccount?: string }) => any;
    RCBilling: any;
  }
}
