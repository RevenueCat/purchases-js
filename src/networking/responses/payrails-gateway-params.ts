/**
 * Client init body returned by the RevenueCat backend.
 * Passed unchanged as the first argument to `Payrails.init`.
 */
export interface PayrailsInitPayload {
  version: string;
  data: string;
}

/**
 * Payrails parameters on a checkout start response.
 */
export interface PayrailsGatewayParams {
  always_store_instrument: boolean;
  init_payload: PayrailsInitPayload;
}
