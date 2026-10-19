/**
 * Client init payload returned by the RevenueCat backend.
 * Passed unchanged as the first argument to `Payrails.init`.
 */
export interface PayrailsGatewayParams {
  version: string;
  data: string;
}
