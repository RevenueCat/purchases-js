import type { CheckoutStatusResponse } from "../networking/responses/checkout-status-response";

/**
 * This object gives you access to all purchase redemption data.
 * @public
 */
export interface RedemptionInfo {
  /**
   * The redeem url.
   */
  readonly redeemUrl: string | undefined | null;
}

export function toRedemptionInfo(
  operationResponse: CheckoutStatusResponse,
): RedemptionInfo | null | undefined {
  if (!operationResponse.operation.redemptionInfo) {
    return null;
  }
  return {
    redeemUrl: operationResponse.operation.redemptionInfo?.redeemUrl,
  };
}
