import { type OfferingsResponse } from "./responses/offerings-response";
import { performRequest, performRequestWithStatus } from "./http-client";
import {
  CheckoutCalculateTaxEndpoint,
  CheckoutCompleteEndpoint,
  CheckoutStartEndpoint,
  GetBrandingInfoEndpoint,
  GetCheckoutStatusEndpoint,
  GetCustomerInfoEndpoint,
  GetOfferingsEndpoint,
  GetProductsEndpoint,
  PostReceiptEndpoint,
  GetVirtualCurrenciesEndpoint,
  IdentifyEndpoint,
} from "./endpoints";
import { type SubscriberResponse } from "./responses/subscriber-response";
import type { CheckoutStartResponse } from "./responses/checkout-start-response";
import { type ProductsResponse } from "./responses/products-response";
import { type BrandingInfoResponse } from "./responses/branding-response";
import { type CheckoutStatusResponse } from "./responses/checkout-status-response";
import { type VirtualCurrenciesResponse } from "./responses/virtual-currencies-response";
import { defaultHttpConfig, type HttpConfig } from "../entities/http-config";
import type {
  PresentedOfferingContext,
  PurchaseMetadata,
  PurchaseOption,
} from "../entities/offerings";
import type { PurchasesContext } from "../entities/purchases-config";
import type { CheckoutCompleteResponse } from "./responses/checkout-complete-response";
import type { CheckoutCalculateTaxResponse } from "./responses/checkout-calculate-tax-response";
import {
  SetAttributesEndpoint,
  PatchOperationSessionEndpoint,
} from "./endpoints";
import { isWebBillingSandboxApiKey } from "../helpers/api-key-helper";
import type { IdentifyResponse } from "./responses/identify-response";

export class Backend {
  private readonly API_KEY: string;
  private readonly httpConfig: HttpConfig;
  private readonly isSandbox: boolean;
  private readonly purchasesContext?: PurchasesContext;

  constructor(
    API_KEY: string,
    httpConfig: HttpConfig = defaultHttpConfig,
    purchasesContext?: PurchasesContext,
  ) {
    this.API_KEY = API_KEY;
    this.httpConfig = httpConfig;
    this.isSandbox = isWebBillingSandboxApiKey(API_KEY);
    this.purchasesContext = purchasesContext;
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

  async identify(
    oldAppUserId: string,
    newAppUserId: string,
  ): Promise<IdentifyResponse> {
    type IdentifyRequestBody = {
      app_user_id: string;
      new_app_user_id: string;
    };

    const body: IdentifyRequestBody = {
      app_user_id: oldAppUserId,
      new_app_user_id: newAppUserId,
    };

    const result = await performRequestWithStatus<
      IdentifyRequestBody,
      SubscriberResponse
    >(new IdentifyEndpoint(), {
      apiKey: this.API_KEY,
      body: body,
      httpConfig: this.httpConfig,
    });

    // HTTP 201 indicates the user was created, 200 indicates it already existed
    const was_created = result.statusCode === 201;

    return {
      ...result.data,
      was_created,
    };
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
      presented_workflow_id?: string;
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

    if (this.purchasesContext?.workflowContext?.workflowIdentifier) {
      requestBody.presented_workflow_id =
        this.purchasesContext.workflowContext.workflowIdentifier;
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

  async patchOperationSession(
    operationSessionId: string,
    appUserId: string,
    email?: string,
    metadata: PurchaseMetadata | undefined = undefined,
  ): Promise<{ operation_session_id: string }> {
    type PatchOperationSessionRequestBody = {
      app_user_id: string;
      email?: string;
      metadata?: PurchaseMetadata;
    };

    const requestBody: PatchOperationSessionRequestBody = {
      app_user_id: appUserId,
    };

    if (email !== undefined) {
      requestBody.email = email;
    }

    if (metadata) {
      requestBody.metadata = metadata;
    }

    return await performRequest<
      PatchOperationSessionRequestBody,
      { operation_session_id: string }
    >(new PatchOperationSessionEndpoint(operationSessionId), {
      apiKey: this.API_KEY,
      body: requestBody,
      httpConfig: this.httpConfig,
    });
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

  async postReceipt(
    appUserId: string,
    productId: string,
    currency: string,
    fetchToken: string,
    presentedOfferingContext: PresentedOfferingContext,
    initiationSource: string,
  ): Promise<SubscriberResponse> {
    type PostReceiptTargetingRule = {
      rule_id: string;
      revision: number;
    };
    type PostReceiptRequestBody = {
      fetch_token: string;
      product_id: string;
      currency: string;
      app_user_id: string;
      presented_offering_identifier: string;
      presented_placement_identifier: string | null;
      presented_workflow_id?: string | null;
      applied_targeting_rule?: PostReceiptTargetingRule | null;
      initiation_source: string;
    };

    let targetingInfo: PostReceiptTargetingRule | null = null;
    if (presentedOfferingContext.targetingContext) {
      targetingInfo = {
        rule_id: presentedOfferingContext.targetingContext.ruleId,
        revision: presentedOfferingContext.targetingContext.revision,
      };
    }

    const requestBody: PostReceiptRequestBody = {
      fetch_token: fetchToken,
      product_id: productId,
      currency: currency,
      app_user_id: appUserId,
      presented_offering_identifier:
        presentedOfferingContext.offeringIdentifier,
      presented_placement_identifier:
        presentedOfferingContext.placementIdentifier,
      presented_workflow_id:
        this.purchasesContext?.workflowContext?.workflowIdentifier,
      applied_targeting_rule: targetingInfo,
      initiation_source: initiationSource,
    };

    return await performRequest<PostReceiptRequestBody, SubscriberResponse>(
      new PostReceiptEndpoint(),
      {
        apiKey: this.API_KEY,
        body: requestBody,
        httpConfig: this.httpConfig,
      },
    );
  }

  async getVirtualCurrencies(
    appUserId: string,
  ): Promise<VirtualCurrenciesResponse> {
    return await performRequest<null, VirtualCurrenciesResponse>(
      new GetVirtualCurrenciesEndpoint(appUserId),
      {
        apiKey: this.API_KEY,
        httpConfig: this.httpConfig,
      },
    );
  }
}
