import type { ProductsResponse } from "../networking/responses/products-response";
import type { Backend } from "../networking/backend";
import type { IEventsTracker } from "../behavioural-events/events-tracker";
import type { PurchaseOperationHelper } from "./purchase-operation-helper";
import type { BrandingInfoResponse } from "../networking/responses/branding-response";
import type { FlagsConfig } from "../entities/flags-config";
import type { BillingWrapper } from "./billing-wrapper";

/**
 * Web Billing (Stripe/Paddle/RC) implementation of BillingWrapper.
 * Handles product fetching and purchases via RevenueCat's web billing infrastructure.
 * @internal
 */
export class WebBillingBillingWrapper implements BillingWrapper {
  private readonly context: WebBillingHandlerContext;

  constructor(context: WebBillingHandlerContext) {
    this.context = context;
  }

  async getProducts(
    appUserId: string,
    productIds: string[],
    currency?: string,
    discountCode?: string,
  ): Promise<ProductsResponse> {
    return await this.context.backend.getProducts(
      appUserId,
      productIds,
      currency,
      discountCode,
    );
  }
}

/**
 * Context object containing dependencies for WebBillingHandler.
 * @internal
 */
export interface WebBillingHandlerContext {
  backend: Backend;
  eventsTracker: IEventsTracker;
  purchaseOperationHelper: PurchaseOperationHelper;
  getBrandingInfo: () => BrandingInfoResponse | null;
  flags: FlagsConfig;
  isSandbox: boolean;
  onCacheInvalidate: () => void;
}
