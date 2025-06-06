import { type OfferingsResponse } from "./responses/offerings-response";
import { performRequest } from "./http-client";
import {
  CheckoutCalculateTaxEndpoint,
  CheckoutCompleteEndpoint,
  CheckoutStartEndpoint,
  GetBrandingInfoEndpoint,
  GetCheckoutStatusEndpoint,
  GetCustomerInfoEndpoint,
  GetOfferingsEndpoint,
  GetProductsEndpoint,
} from "./endpoints";
import { type SubscriberResponse } from "./responses/subscriber-response";
import type { CheckoutStartResponse } from "./responses/checkout-start-response";
import { type ProductsResponse } from "./responses/products-response";
import { type BrandingInfoResponse } from "./responses/branding-response";
import { type CheckoutStatusResponse } from "./responses/checkout-status-response";
import { defaultHttpConfig, type HttpConfig } from "../entities/http-config";
import type {
  PresentedOfferingContext,
  PurchaseMetadata,
  PurchaseOption,
} from "../entities/offerings";
import type { CheckoutCompleteResponse } from "./responses/checkout-complete-response";
import type { CheckoutCalculateTaxResponse } from "./responses/checkout-calculate-tax-response";
import { isSandboxApiKey } from "../helpers/api-key-helper";
import { SetAttributesEndpoint } from "./endpoints";

export class Backend {
  private readonly API_KEY: string;
  private readonly httpConfig: HttpConfig;
  private readonly isSandbox: boolean;

  constructor(API_KEY: string, httpConfig: HttpConfig = defaultHttpConfig) {
    this.API_KEY = API_KEY;
    this.httpConfig = httpConfig;
    this.isSandbox = isSandboxApiKey(API_KEY);
  }

  getIsSandbox(): boolean {
    return this.isSandbox;
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

  async postCheckoutStart(
    appUserId: string,
    productId: string,
    presentedOfferingContext: PresentedOfferingContext,
    purchaseOption: PurchaseOption,
    traceId: string,
    email?: string,
    metadata: PurchaseMetadata | undefined = undefined,
  ): Promise<CheckoutStartResponse> {
    type CheckoutStartRequestBody = {
      app_user_id: string;
      product_id: string;
      presented_offering_identifier: string;
      price_id: string;
      presented_placement_identifier?: string;
      offer_id?: string;
      applied_targeting_rule?: {
        rule_id: string;
        revision: number;
      };
      email?: string;
      metadata?: PurchaseMetadata;
      trace_id: string;
    };

    const requestBody: CheckoutStartRequestBody = {
      app_user_id: appUserId,
      product_id: productId,
      email: email,
      price_id: purchaseOption.priceId,
      presented_offering_identifier:
        presentedOfferingContext.offeringIdentifier,
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

    return await performRequest<
      CheckoutStartRequestBody,
      CheckoutStartResponse
    >(new CheckoutStartEndpoint(), {
      apiKey: this.API_KEY,
      body: requestBody,
      httpConfig: this.httpConfig,
    });
  }

  async postCheckoutCalculateTax(
    operationSessionId: string,
    countryCode?: string,
    postalCode?: string,
    signal?: AbortSignal | null,
  ): Promise<CheckoutCalculateTaxResponse> {
    type CheckoutCalculateTaxRequestBody = {
      country_code?: string;
      postal_code?: string;
    };

    const requestBody: CheckoutCalculateTaxRequestBody = {
      country_code: countryCode,
      postal_code: postalCode,
    };

    return await performRequest<
      CheckoutCalculateTaxRequestBody,
      CheckoutCalculateTaxResponse
    >(
      new CheckoutCalculateTaxEndpoint(operationSessionId),
      {
        apiKey: this.API_KEY,
        body: requestBody,
        httpConfig: this.httpConfig,
      },
      signal,
    );
  }

  async postCheckoutComplete(
    operationSessionId: string,
    email?: string,
  ): Promise<CheckoutCompleteResponse> {
    type CheckoutCompleteRequestBody = {
      email?: string;
    };

    const requestBody: CheckoutCompleteRequestBody = {
      email: email,
    };

    return await performRequest<
      CheckoutCompleteRequestBody,
      CheckoutCompleteResponse
    >(new CheckoutCompleteEndpoint(operationSessionId), {
      apiKey: this.API_KEY,
      body: requestBody,
      httpConfig: this.httpConfig,
    });
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

  async setAttributes(
    appUserId: string,
    attributes: { [key: string]: string | null },
  ): Promise<void> {
    type AttributeValue = {
      value: string | null;
      updated_at_ms: number;
    };

    type SetAttributesRequestBody = {
      attributes: { [key: string]: AttributeValue };
    };

    const now = Date.now();
    const formattedAttributes: { [key: string]: AttributeValue } = {};

    for (const [key, value] of Object.entries(attributes)) {
      formattedAttributes[key] = {
        value,
        updated_at_ms: now,
      };
    }

    const requestBody: SetAttributesRequestBody = {
      attributes: formattedAttributes,
    };

    return await performRequest<SetAttributesRequestBody, void>(
      new SetAttributesEndpoint(appUserId),
      {
        apiKey: this.API_KEY,
        body: requestBody,
        httpConfig: this.httpConfig,
      },
    );
  }
}
