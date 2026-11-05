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
 * `always_store_instrument` is applied as `alwaysStoreInstrument` on the drop-in.
 */
export interface PayrailsGatewayParams {
  always_store_instrument: boolean;
  init_payload: PayrailsInitPayload;
}
