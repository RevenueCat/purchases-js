import type { CheckoutStatusResponse } from "../networking/responses/checkout-status-response";

/**
 * This object gives you access to the purchase redemption data when
 * the purchase can be redeemed to a mobile user, like in the case of anonymous users.
 * @public
 */
export interface RedemptionInfo {
  /**
   * The redeem url.
   */
  readonly redeemUrl: string | null;

  /**
   * The HTTPS URL that redirects to the redeem URL.
   * Use this URL when a browser-compatible URL is required, such as for QR codes.
   */
  readonly redeemUrlRedirect: string | null;
}

export function toRedemptionInfo(
  operationResponse: CheckoutStatusResponse,
): RedemptionInfo | null {
  if (!operationResponse.operation.redemption_info) {
    return null;
  }
  return {
    redeemUrl: operationResponse.operation.redemption_info?.redeem_url ?? null,
    redeemUrlRedirect:
      operationResponse.operation.redemption_info?.redeem_url_redirect ?? null,
  };
}
