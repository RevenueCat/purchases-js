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
  name = "getOfferings";

  urlPath(): string {
    const encodedAppUserId = encodeURIComponent(this.appUserId);
    return `${SUBSCRIBERS_PATH}/${encodedAppUserId}/offerings`;
  }
}

export class PurchaseEndpoint implements Endpoint {
  method: HttpMethodType = "POST";
  name = "purchase";

  urlPath(): string {
    return `${RC_BILLING_PATH}/purchase`;
  }
}

export class GetProductsEndpoint implements Endpoint {
  method: HttpMethodType = "GET";
  name = "getProducts";
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
  name = "getCustomerInfo";
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
  name = "identify";

  urlPath(): string {
    return `${SUBSCRIBERS_PATH}/identify`;
  }
}

export class GetBrandingInfoEndpoint implements Endpoint {
  method: HttpMethodType = "GET";
  name = "getBrandingInfo";

  urlPath(): string {
    return `${RC_BILLING_PATH}/branding`;
  }
}

export class CheckoutPrepareEndpoint implements Endpoint {
  method: HttpMethodType = "POST";
  name = "postCheckoutPrepare";

  urlPath(): string {
    return `${RC_BILLING_PATH}/checkout/prepare`;
  }
}

export class CheckoutStartEndpoint implements Endpoint {
  method: HttpMethodType = "POST";
  name = "postCheckoutStart";

  urlPath(): string {
    return `${RC_BILLING_PATH}/checkout/start`;
  }
}

export class CustomerCheckoutStartEndpoint implements Endpoint {
  method: HttpMethodType = "POST";
  name = "postCustomerCheckoutStart";

  urlPath(): string {
    return `${RC_BILLING_PATH}/customer/checkout/start`;
  }
}

export class CheckoutRefreshPricingEndpoint implements Endpoint {
  method: HttpMethodType = "PATCH";
  name = "patchCheckoutRefreshPricing";
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
  name = "postCheckoutComplete";
  private readonly operationSessionId: string;

  constructor(operationSessionId: string) {
    this.operationSessionId = operationSessionId;
  }

  urlPath(): string {
    return `${RC_BILLING_PATH}/checkout/${this.operationSessionId}/complete`;
  }
}

export class CustomerCheckoutCompleteEndpoint implements Endpoint {
  method: HttpMethodType = "POST";
  name = "postCustomerCheckoutComplete";
  private readonly operationSessionId: string;

  constructor(operationSessionId: string) {
    this.operationSessionId = operationSessionId;
  }

  urlPath(): string {
    return `${RC_BILLING_PATH}/customer/checkout/${this.operationSessionId}/complete`;
  }
}

export class GetCheckoutStatusEndpoint implements Endpoint {
  method: HttpMethodType = "GET";
  name = "getCheckoutStatus";
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
  name = "setAttributes";
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
  name = "postReceipt";

  urlPath(): string {
    return "/v1/receipts";
  }
}

export class GetVirtualCurrenciesEndpoint implements Endpoint {
  method: HttpMethodType = "GET";
  name = "getVirtualCurrencies";
  private readonly appUserId: string;

  constructor(appUserId: string) {
    this.appUserId = appUserId;
  }

  urlPath(): string {
    const encodedAppUserId = encodeURIComponent(this.appUserId);
    return `${SUBSCRIBERS_PATH}/${encodedAppUserId}/virtual_currencies`;
  }
}

export class GetWorkflowsEndpoint implements Endpoint {
  method: HttpMethodType = "GET";
  name = "getWorkflows";
  private readonly appUserId: string;

  constructor(appUserId: string) {
    this.appUserId = appUserId;
  }

  urlPath(): string {
    return `${SUBSCRIBERS_PATH}/${encodeURIComponent(this.appUserId)}/workflows?type=paywall`;
  }
}

export class GetWorkflowDataByIdEndpoint implements Endpoint {
  method: HttpMethodType = "GET";
  name = "getWorkflowData";
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
  | GetWorkflowDataByIdEndpoint;
