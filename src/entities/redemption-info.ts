import type { CheckoutStatusResponse } from "../networking/responses/checkout-status-response";

/**
 * This object gives you access to the purchase redemption data.
 * @public
 */
export interface RedemptionInfo {
  /**
   * The redeem url.
   */
  readonly redeemUrl: string | null;
}

export function toRedemptionInfo(
  operationResponse: CheckoutStatusResponse,
): RedemptionInfo | null {
  if (!operationResponse.operation.redemption_info) {
    return null;
  }
  return {
    redeemUrl: operationResponse.operation.redemption_info?.redeem_url ?? null,
  };
}
