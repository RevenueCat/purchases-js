import type { ProductsResponse } from "../networking/responses/products-response";
import type { Backend } from "../networking/backend";
import type { BillingWrapper } from "./billing-wrapper";

/**
 * Web Billing (Stripe/Paddle/RC) implementation of BillingWrapper.
 * Handles product fetching and purchases via RevenueCat's web billing infrastructure.
 * @internal
 */
export class WebBillingBillingWrapper implements BillingWrapper {
  constructor(private readonly backend: Backend) {}

  async getProducts(
    appUserId: string,
    productIds: string[],
    currency?: string,
    discountCode?: string,
  ): Promise<ProductsResponse> {
    return await this.backend.getProducts(
      appUserId,
      productIds,
      currency,
      discountCode,
    );
  }
}
