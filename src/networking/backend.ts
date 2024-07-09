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
import { defaultHttpConfig, type HttpConfig } from "../entities/http-config";

export class Backend {
  private readonly API_KEY: string;
  private readonly httpConfig: HttpConfig;

  constructor(API_KEY: string, httpConfig: HttpConfig = defaultHttpConfig) {
    this.API_KEY = API_KEY;
    this.httpConfig = httpConfig;
  }

  async getOfferings(appUserId: string): Promise<OfferingsResponse> {
    return await performRequest<null, OfferingsResponse>(
      new GetOfferingsEndpoint(appUserId),
      {
        apiKey: this.API_KEY,
        includeCredentials: this.httpConfig.includeCredentials,
      },
    );
  }

  async getCustomerInfo(appUserId: string): Promise<SubscriberResponse> {
    return await performRequest<null, SubscriberResponse>(
      new GetCustomerInfoEndpoint(appUserId),
      {
        apiKey: this.API_KEY,
        includeCredentials: this.httpConfig.includeCredentials,
      },
    );
  }

  async getProducts(
    appUserId: string,
    productIds: string[],
  ): Promise<ProductsResponse> {
    return await performRequest<null, ProductsResponse>(
      new GetProductsEndpoint(appUserId, productIds),
      {
        apiKey: this.API_KEY,
        includeCredentials: this.httpConfig.includeCredentials,
      },
    );
  }

  async getBrandingInfo(): Promise<BrandingInfoResponse> {
    return await performRequest<null, BrandingInfoResponse>(
      new GetBrandingInfoEndpoint(),
      {
        apiKey: this.API_KEY,
        includeCredentials: this.httpConfig.includeCredentials,
      },
    );
  }

  async postSubscribe(
    appUserId: string,
    productId: string,
    email: string,
    offeringIdentifier: string,
    purchaseOptionId?: string,
  ): Promise<SubscribeResponse> {
    type SubscribeRequestBody = {
      app_user_id: string;
      product_id: string;
      email: string;
      presented_offering_identifier: string;
      offer_id?: string;
    };

    const requestBody: SubscribeRequestBody = {
      app_user_id: appUserId,
      product_id: productId,
      email: email,
      presented_offering_identifier: offeringIdentifier,
    };

    if (purchaseOptionId && purchaseOptionId !== "base_option") {
      requestBody.offer_id = purchaseOptionId;
    }

    return await performRequest<SubscribeRequestBody, SubscribeResponse>(
      new SubscribeEndpoint(),
      {
        apiKey: this.API_KEY,
        body: requestBody,
        includeCredentials: this.httpConfig.includeCredentials,
      },
    );
  }

  async getCheckoutStatus(
    operationSessionId: string,
  ): Promise<CheckoutStatusResponse> {
    return await performRequest<null, CheckoutStatusResponse>(
      new GetCheckoutStatusEndpoint(operationSessionId),
      {
        apiKey: this.API_KEY,
        includeCredentials: this.httpConfig.includeCredentials,
      },
    );
  }
}
