import type { VirtualCurrencyResponse } from "src/networking/responses/virtual-currencies-response";

/**
 * The VirtualCurrency object represents information about a virtual currency in the app.
 * Use this object to access information about a virtual currency, such as its current balance.
 *
 * @public
 */
export interface VirtualCurrency {
  /**
   * The virtual currency's balance.
   */
  readonly balance: number;

  /**
   * The virtual currency's name.
   */
  readonly name: string;

  /**
   * The virtual currency's code.
   */
  readonly code: string;

  /**
   * The virtual currency's description defined in the RevenueCat dashboard.
   */
  readonly serverDescription: string | null;
}

export function toVirtualCurrency(
  virtualCurrencyResponse: VirtualCurrencyResponse,
): VirtualCurrency {
  return {
    balance: virtualCurrencyResponse.balance,
    name: virtualCurrencyResponse.name,
    code: virtualCurrencyResponse.code,
    serverDescription: virtualCurrencyResponse.description,
  };
}
