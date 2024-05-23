import { type OfferingsResponse } from "./responses/offerings-response";
import { performRequest } from "./http-client";
import {
  GetBrandingInfoEndpoint,
  GetCheckoutStatusEndpoint,
  GetCustomerInfoEndpoint,
  GetOfferingsEndpoint,
  GetProductsEndpoint,
  SubscribeEndpoint,
} from "./endpoints";
import { type SubscriberResponse } from "./responses/subscriber-response";
import { type SubscribeResponse } from "./responses/subscribe-response";
import { type ProductsResponse } from "./responses/products-response";
import { type BrandingInfoResponse } from "./responses/branding-response";
import { type CheckoutStatusResponse } from "./responses/checkout-status-response";

export class Backend {
  private readonly API_KEY: string;

  constructor(API_KEY: string) {
    this.API_KEY = API_KEY;
  }

  async getOfferings(appUserId: string): Promise<OfferingsResponse> {
    return await performRequest<null, OfferingsResponse>(
      new GetOfferingsEndpoint(appUserId),
      this.API_KEY,
    );
  }

  async getCustomerInfo(appUserId: string): Promise<SubscriberResponse> {
    return await performRequest<null, SubscriberResponse>(
      new GetCustomerInfoEndpoint(appUserId),
      this.API_KEY,
    );
  }

  async getProducts(
    appUserId: string,
    productIds: string[],
  ): Promise<ProductsResponse> {
    return await performRequest<null, ProductsResponse>(
      new GetProductsEndpoint(appUserId, productIds),
      this.API_KEY,
    );
  }

  async getBrandingInfo(): Promise<BrandingInfoResponse> {
    return await performRequest<null, BrandingInfoResponse>(
      new GetBrandingInfoEndpoint(),
      this.API_KEY,
    );
  }

  async postSubscribe(
    appUserId: string,
    productId: string,
    purchaseOptionId: string | undefined,
    email: string,
    offeringIdentifier: string,
  ): Promise<SubscribeResponse> {
    type SubscribeRequestBody = {
      app_user_id: string;
      product_id: string;
      email: string;
      presented_offering_identifier: string;
      offer_id: string | undefined;
    };

    const offer_id =
      purchaseOptionId === undefined || purchaseOptionId !== "base_offer"
        ? purchaseOptionId
        : undefined;

    return await performRequest<SubscribeRequestBody, SubscribeResponse>(
      new SubscribeEndpoint(),
      this.API_KEY,
      {
        app_user_id: appUserId,
        product_id: productId,
        email: email,
        presented_offering_identifier: offeringIdentifier,
        offer_id: offer_id,
      },
    );
  }

  async getCheckoutStatus(
    operationSessionId: string,
  ): Promise<CheckoutStatusResponse> {
    return await performRequest<null, CheckoutStatusResponse>(
      new GetCheckoutStatusEndpoint(operationSessionId),
      this.API_KEY,
    );
  }
}
