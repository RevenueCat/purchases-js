import { OfferingsResponse } from "./responses/offerings-response";
import { performRequest } from "./http-client";
import {
  GetBrandingInfoEndpoint,
  GetCustomerInfoEndpoint,
  GetEntitlementsEndpoint,
  GetOfferingsEndpoint,
  GetProductsEndpoint,
  SubscribeEndpoint,
} from "./endpoints";
import { SubscriberResponse } from "./responses/subscriber-response";
import { SubscribeResponse } from "./responses/subscribe-response";
import { ProductsResponse } from "./responses/products-response";
import { EntitlementsResponse } from "./responses/entitlements-response";
import { BrandingInfoResponse } from "../entities/types";

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

  async getEntitlements(appUserId: string): Promise<EntitlementsResponse> {
    return await performRequest<null, EntitlementsResponse>(
      new GetEntitlementsEndpoint(appUserId),
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
    email: string,
  ): Promise<SubscribeResponse> {
    type SubscribeRequestBody = {
      app_user_id: string;
      product_id: string;
      email: string;
    };

    return await performRequest<SubscribeRequestBody, SubscribeResponse>(
      new SubscribeEndpoint(),
      this.API_KEY,
      {
        app_user_id: appUserId,
        product_id: productId,
        email: email,
      },
    );
  }
}
