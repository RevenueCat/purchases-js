type HttpMethodType = "GET" | "POST" | "PATCH";

const SUBSCRIBERS_PATH = "/v1/subscribers";
const RC_BILLING_PATH = "/rcbilling/v1";

interface Endpoint {
  method: HttpMethodType;
  name: string;

  urlPath(): string;
}

export class GetOfferingsEndpoint implements Endpoint {
  private readonly appUserId: string;

  constructor(appUserId: string) {
    this.appUserId = appUserId;
  }

  method: HttpMethodType = "GET";
  name: string = "getOfferings";

  urlPath(): string {
    const encodedAppUserId = encodeURIComponent(this.appUserId);
    return `${SUBSCRIBERS_PATH}/${encodedAppUserId}/offerings`;
  }
}

export class PurchaseEndpoint implements Endpoint {
  method: HttpMethodType = "POST";
  name: string = "purchase";

  urlPath(): string {
    return `${RC_BILLING_PATH}/purchase`;
  }
}

export class GetProductsEndpoint implements Endpoint {
  method: HttpMethodType = "GET";
  name: string = "getProducts";
  private readonly appUserId: string;
  private readonly productIds: string[];
  private readonly currency: string | undefined;
  private readonly discountCode: string | undefined;

  constructor(
    appUserId: string,
    productIds: string[],
    currency?: string,
    discountCode?: string,
  ) {
    this.appUserId = appUserId;
    this.productIds = productIds;
    this.currency = currency;
    this.discountCode = discountCode;
  }

  urlPath(): string {
    const encodedAppUserId = encodeURIComponent(this.appUserId);
    const encodedProductIds = this.productIds
      .map(encodeURIComponent)
      .join("&id=");
    const currencyParam = this.currency ? `&currency=${this.currency}` : "";
    const discountCodeParam = this.discountCode
      ? `&discount_code=${encodeURIComponent(this.discountCode)}`
      : "";
    return `${RC_BILLING_PATH}/subscribers/${encodedAppUserId}/products?id=${encodedProductIds}${currencyParam}${discountCodeParam}`;
  }
}

export class GetCustomerInfoEndpoint implements Endpoint {
  method: HttpMethodType = "GET";
  name: string = "getCustomerInfo";
  private readonly appUserId: string;

  constructor(appUserId: string) {
    this.appUserId = appUserId;
  }

  urlPath(): string {
    const encodedAppUserId = encodeURIComponent(this.appUserId);
    return `${SUBSCRIBERS_PATH}/${encodedAppUserId}`;
  }
}

export class IdentifyEndpoint implements Endpoint {
  method: HttpMethodType = "POST";
  name: string = "identify";

  urlPath(): string {
    return `${SUBSCRIBERS_PATH}/identify`;
  }
}

export class GetBrandingInfoEndpoint implements Endpoint {
  method: HttpMethodType = "GET";
  name: string = "getBrandingInfo";

  urlPath(): string {
    return `${RC_BILLING_PATH}/branding`;
  }
}

export class CheckoutPrepareEndpoint implements Endpoint {
  method: HttpMethodType = "POST";
  name: string = "postCheckoutPrepare";

  urlPath(): string {
    return `${RC_BILLING_PATH}/checkout/prepare`;
  }
}

export class CheckoutStartEndpoint implements Endpoint {
  method: HttpMethodType = "POST";
  name: string = "postCheckoutStart";

  urlPath(): string {
    return `${RC_BILLING_PATH}/checkout/start`;
  }
}

export class CheckoutRefreshPricingEndpoint implements Endpoint {
  method: HttpMethodType = "PATCH";
  name: string = "patchCheckoutRefreshPricing";
  private readonly operationSessionId: string;

  constructor(operationSessionId: string) {
    this.operationSessionId = operationSessionId;
  }

  urlPath(): string {
    return `${RC_BILLING_PATH}/checkout/${this.operationSessionId}`;
  }
}

export class CheckoutCompleteEndpoint implements Endpoint {
  method: HttpMethodType = "POST";
  name: string = "postCheckoutComplete";
  private readonly operationSessionId: string;

  constructor(operationSessionId: string) {
    this.operationSessionId = operationSessionId;
  }

  urlPath(): string {
    return `${RC_BILLING_PATH}/checkout/${this.operationSessionId}/complete`;
  }
}

export class GetCheckoutStatusEndpoint implements Endpoint {
  method: HttpMethodType = "GET";
  name: string = "getCheckoutStatus";
  private readonly operationSessionId: string;

  constructor(operationSessionId: string) {
    this.operationSessionId = operationSessionId;
  }

  urlPath(): string {
    return `${RC_BILLING_PATH}/checkout/${this.operationSessionId}`;
  }
}

export class SetAttributesEndpoint implements Endpoint {
  method: HttpMethodType = "POST";
  name: string = "setAttributes";
  private readonly appUserId: string;

  constructor(appUserId: string) {
    this.appUserId = appUserId;
  }

  urlPath(): string {
    const encodedAppUserId = encodeURIComponent(this.appUserId);
    return `${SUBSCRIBERS_PATH}/${encodedAppUserId}/attributes`;
  }
}

export class PostReceiptEndpoint implements Endpoint {
  method: HttpMethodType = "POST";
  name: string = "postReceipt";

  urlPath(): string {
    return "/v1/receipts";
  }
}

export class GetVirtualCurrenciesEndpoint implements Endpoint {
  method: HttpMethodType = "GET";
  name: string = "getVirtualCurrencies";
  private readonly appUserId: string;

  constructor(appUserId: string) {
    this.appUserId = appUserId;
  }

  urlPath(): string {
    const encodedAppUserId = encodeURIComponent(this.appUserId);
    return `${SUBSCRIBERS_PATH}/${encodedAppUserId}/virtual_currencies`;
  }
}

/**
 * GET /v1/subscribers/{appUserId}/workflows — returns the list of published
 * workflows for an app, each with an optional offering_id for matching.
 */
export class GetWorkflowsEndpoint implements Endpoint {
  method: HttpMethodType = "GET";
  name: string = "getWorkflows";
  private readonly appUserId: string;

  constructor(appUserId: string) {
    this.appUserId = appUserId;
  }

  urlPath(): string {
    return `${SUBSCRIBERS_PATH}/${encodeURIComponent(this.appUserId)}/workflows?type=paywall`;
  }
}

/**
 * GET /v1/subscribers/{appUserId}/workflows/{workflowId} — returns the full
 * workflow payload, either inline or as a CDN redirect.
 */
export class GetWorkflowDataByIdEndpoint implements Endpoint {
  method: HttpMethodType = "GET";
  name: string = "getWorkflowData";
  private readonly appUserId: string;
  private readonly workflowId: string;

  constructor(appUserId: string, workflowId: string) {
    this.appUserId = appUserId;
    this.workflowId = workflowId;
  }

  urlPath(): string {
    return `${SUBSCRIBERS_PATH}/${encodeURIComponent(this.appUserId)}/workflows/${encodeURIComponent(this.workflowId)}`;
  }
}

const WORKFLOWS_PATH = "/workflows/v1";

/**
 * Step 1: fetch workflow metadata (public API key + workflow_url template).
 * No Authorization header is sent — this is a public endpoint.
 */
export class GetWorkflowMetadataEndpoint implements Endpoint {
  method: HttpMethodType = "GET";
  name: string = "getWorkflowMetadata";
  private readonly workflowLinkId: string;

  constructor(workflowLinkId: string) {
    this.workflowLinkId = workflowLinkId;
  }

  urlPath(): string {
    return `${WORKFLOWS_PATH}/workflow/${encodeURIComponent(this.workflowLinkId)}`;
  }
}

/**
 * Step 2: fetch the full workflow payload from the subscriber endpoint.
 * The path is taken verbatim from the workflow_url returned by step 1
 * (after substituting {app_user_id}), and is authenticated with the
 * api_key returned by step 1.
 */
export class GetWorkflowDataEndpoint implements Endpoint {
  method: HttpMethodType = "GET";
  name: string = "getWorkflowDataFromCdn";
  private readonly path: string;

  constructor(path: string) {
    this.path = path;
  }

  urlPath(): string {
    return this.path;
  }
}

export type SupportedEndpoint =
  | GetOfferingsEndpoint
  | PurchaseEndpoint
  | GetProductsEndpoint
  | GetCustomerInfoEndpoint
  | GetBrandingInfoEndpoint
  | GetCheckoutStatusEndpoint
  | SetAttributesEndpoint
  | PostReceiptEndpoint
  | GetVirtualCurrenciesEndpoint
  | GetWorkflowsEndpoint
  | GetWorkflowDataByIdEndpoint
  | GetWorkflowMetadataEndpoint
  | GetWorkflowDataEndpoint;
