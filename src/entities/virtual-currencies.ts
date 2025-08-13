import type { VirtualCurrenciesResponse } from "src/networking/responses/virtual-currencies-response";
import type { VirtualCurrency } from "./virtual-currency";
import { toVirtualCurrency } from "./virtual-currency";

/**
 * The VirtualCurrencies object contains all the virtual currencies associated to the user.
 *
 * @public
 */
export interface VirtualCurrencies {
  /**
   * Map of all {@link VirtualCurrency} objects keyed by virtual currency code.
   */
  readonly all: { [key: string]: VirtualCurrency };
}

export function toVirtualCurrencies(
  virtualCurrenciesResponse: VirtualCurrenciesResponse,
): VirtualCurrencies {
  const virtualCurrencies: { [key: string]: VirtualCurrency } = {};

  for (const [code, response] of Object.entries(
    virtualCurrenciesResponse.virtual_currencies,
  )) {
    virtualCurrencies[code] = toVirtualCurrency(response);
  }

  return {
    all: virtualCurrencies,
  };
}
