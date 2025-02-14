import { type OfferingsResponse } from "./responses/offerings-response";
import { performRequest } from "./http-client";
import {
  GetBrandingInfoEndpoint,
  GetCheckoutStatusEndpoint,
  GetCustomerInfoEndpoint,
  GetOfferingsEndpoint,
  GetProductsEndpoint,
  PurchaseEndpoint,
} from "./endpoints";
import { type SubscriberResponse } from "./responses/subscriber-response";
import { type PurchaseResponse } from "./responses/purchase-response";
import { type ProductsResponse } from "./responses/products-response";
import { type BrandingInfoResponse } from "./responses/branding-response";
import { type CheckoutStatusResponse } from "./responses/checkout-status-response";
import { defaultHttpConfig, type HttpConfig } from "../entities/http-config";
import type {
  PresentedOfferingContext,
  PurchaseMetadata,
  PurchaseOption,
} from "../entities/offerings";

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
        httpConfig: this.httpConfig,
      },
    );
  }

  async getCustomerInfo(appUserId: string): Promise<SubscriberResponse> {
    return await performRequest<null, SubscriberResponse>(
      new GetCustomerInfoEndpoint(appUserId),
      {
        apiKey: this.API_KEY,
        httpConfig: this.httpConfig,
      },
    );
  }

  async getProducts(
    appUserId: string,
    productIds: string[],
    currency?: string,
  ): Promise<ProductsResponse> {
    return await performRequest<null, ProductsResponse>(
      new GetProductsEndpoint(appUserId, productIds, currency),
      {
        apiKey: this.API_KEY,
        httpConfig: this.httpConfig,
      },
    );
  }

  async getBrandingInfo(): Promise<BrandingInfoResponse> {
    return await performRequest<null, BrandingInfoResponse>(
      new GetBrandingInfoEndpoint(),
      {
        apiKey: this.API_KEY,
        httpConfig: this.httpConfig,
      },
    );
  }

  async postPurchase(
    appUserId: string,
    productId: string,
    email: string,
    presentedOfferingContext: PresentedOfferingContext,
    purchaseOption: PurchaseOption,
    metadata: PurchaseMetadata | undefined = undefined,
    traceId: string,
  ): Promise<PurchaseResponse> {
    type PurchaseRequestBody = {
      app_user_id: string;
      product_id: string;
      email: string;
      presented_offering_identifier: string;
      presented_placement_identifier?: string;
      offer_id?: string;
      price_id: string;
      applied_targeting_rule?: {
        rule_id: string;
        revision: number;
      };
      supports_direct_payment: boolean;
      metadata?: PurchaseMetadata;
      trace_id: string;
    };

    const requestBody: PurchaseRequestBody = {
      app_user_id: appUserId,
      product_id: productId,
      email: email,
      price_id: purchaseOption.priceId,
      presented_offering_identifier:
        presentedOfferingContext.offeringIdentifier,
      supports_direct_payment: true,
      trace_id: traceId,
    };

    if (metadata) {
      requestBody.metadata = metadata;
    }

    if (purchaseOption.id !== "base_option") {
      requestBody.offer_id = purchaseOption.id;
    }

    if (presentedOfferingContext.targetingContext) {
      requestBody.applied_targeting_rule = {
        rule_id: presentedOfferingContext.targetingContext.ruleId,
        revision: presentedOfferingContext.targetingContext.revision,
      };
    }

    if (presentedOfferingContext.placementIdentifier) {
      requestBody.presented_placement_identifier =
        presentedOfferingContext.placementIdentifier;
    }

    return await performRequest<PurchaseRequestBody, PurchaseResponse>(
      new PurchaseEndpoint(),
      {
        apiKey: this.API_KEY,
        body: requestBody,
        httpConfig: this.httpConfig,
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
        httpConfig: this.httpConfig,
      },
    );
  }
}
