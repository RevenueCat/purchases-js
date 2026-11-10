type HttpMethodType = "GET" | "POST" | "PATCH";

const SUBSCRIBERS_PATH = "/v1/subscribers";
const RC_BILLING_PATH = "/rcbilling/v1";
const RC_BILLING_CUSTOMER_PATH = `${RC_BILLING_PATH}/customer`;
const CUSTOMER_PATH = "/v1/customer";
const IAM_AUTH_PATH = "/auth";

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
    return `${RC_BILLING_PATH}/subscribers/${encodedAppUserId}/products?${productsQuery(this.productIds, this.currency, this.discountCode)}`;
  }
}

function productsQuery(
  productIds: string[],
  currency?: string,
  discountCode?: string,
): string {
  const encodedProductIds = productIds.map(encodeURIComponent).join("&id=");
  const currencyParam = currency ? `&currency=${currency}` : "";
  const discountCodeParam = discountCode
    ? `&discount_code=${encodeURIComponent(discountCode)}`
    : "";
  return `id=${encodedProductIds}${currencyParam}${discountCodeParam}`;
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

export class CustomerCheckoutStartEndpoint implements Endpoint {
  method: HttpMethodType = "POST";
  name: string = "postCustomerCheckoutStart";

  urlPath(): string {
    return `${RC_BILLING_PATH}/customer/checkout/start`;
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

export class CustomerCheckoutCompleteEndpoint implements Endpoint {
  method: HttpMethodType = "POST";
  name: string = "postCustomerCheckoutComplete";
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

// IAM routes: the subject is the access token's user, so paths carry no
// app_user_id.

export class CustomerInfoEndpoint implements Endpoint {
  method: HttpMethodType = "GET";
  name: string = "getCustomerInfo";

  urlPath(): string {
    return CUSTOMER_PATH;
  }
}

export class CustomerOfferingsEndpoint implements Endpoint {
  method: HttpMethodType = "GET";
  name: string = "getOfferings";

  urlPath(): string {
    return `${CUSTOMER_PATH}/offerings`;
  }
}

export class CustomerAttributesEndpoint implements Endpoint {
  method: HttpMethodType = "POST";
  name: string = "setAttributes";

  urlPath(): string {
    return `${CUSTOMER_PATH}/attributes`;
  }
}

export class CustomerVirtualCurrenciesEndpoint implements Endpoint {
  method: HttpMethodType = "GET";
  name: string = "getVirtualCurrencies";

  urlPath(): string {
    return `${CUSTOMER_PATH}/virtual_currencies`;
  }
}

export class CustomerWorkflowsEndpoint implements Endpoint {
  method: HttpMethodType = "GET";
  name: string = "getWorkflows";

  urlPath(): string {
    return `${CUSTOMER_PATH}/workflows?type=paywall`;
  }
}

export class CustomerWorkflowDataByIdEndpoint implements Endpoint {
  method: HttpMethodType = "GET";
  name: string = "getWorkflowData";

  constructor(private readonly workflowId: string) {}

  urlPath(): string {
    return `${CUSTOMER_PATH}/workflows/${encodeURIComponent(this.workflowId)}`;
  }
}

export class CustomerProductsEndpoint implements Endpoint {
  method: HttpMethodType = "GET";
  name: string = "getProducts";

  constructor(
    private readonly productIds: string[],
    private readonly currency?: string,
    private readonly discountCode?: string,
  ) {}

  urlPath(): string {
    return `${RC_BILLING_CUSTOMER_PATH}/products?${productsQuery(this.productIds, this.currency, this.discountCode)}`;
  }
}

export class CustomerCheckoutRefreshPricingEndpoint implements Endpoint {
  method: HttpMethodType = "PATCH";
  name: string = "patchCustomerCheckoutRefreshPricing";

  constructor(private readonly operationSessionId: string) {}

  urlPath(): string {
    return `${RC_BILLING_CUSTOMER_PATH}/checkout/${this.operationSessionId}`;
  }
}

export class CustomerCheckoutStatusEndpoint implements Endpoint {
  method: HttpMethodType = "GET";
  name: string = "getCustomerCheckoutStatus";

  constructor(private readonly operationSessionId: string) {}

  urlPath(): string {
    return `${RC_BILLING_CUSTOMER_PATH}/checkout/${this.operationSessionId}`;
  }
}

export class IamLoginEndpoint implements Endpoint {
  method: HttpMethodType = "POST";
  name: string = "iamLogin";

  urlPath(): string {
    return `${IAM_AUTH_PATH}/login`;
  }
}

export class IamTokenEndpoint implements Endpoint {
  method: HttpMethodType = "POST";
  name: string = "iamToken";

  urlPath(): string {
    return `${IAM_AUTH_PATH}/token`;
  }
}

export class IamRevokeEndpoint implements Endpoint {
  method: HttpMethodType = "POST";
  name: string = "iamRevoke";

  urlPath(): string {
    return `${IAM_AUTH_PATH}/revoke`;
  }
}

export type SupportedEndpoint =
  | GetOfferingsEndpoint
  | PurchaseEndpoint
  | GetProductsEndpoint
  | GetCustomerInfoEndpoint
  | IdentifyEndpoint
  | GetBrandingInfoEndpoint
  | CheckoutPrepareEndpoint
  | CheckoutStartEndpoint
  | CustomerCheckoutStartEndpoint
  | CheckoutRefreshPricingEndpoint
  | CheckoutCompleteEndpoint
  | CustomerCheckoutCompleteEndpoint
  | GetCheckoutStatusEndpoint
  | SetAttributesEndpoint
  | PostReceiptEndpoint
  | GetVirtualCurrenciesEndpoint
  | GetWorkflowsEndpoint
  | GetWorkflowDataByIdEndpoint
  | CustomerInfoEndpoint
  | CustomerOfferingsEndpoint
  | CustomerAttributesEndpoint
  | CustomerVirtualCurrenciesEndpoint
  | CustomerWorkflowsEndpoint
  | CustomerWorkflowDataByIdEndpoint
  | CustomerProductsEndpoint
  | CustomerCheckoutRefreshPricingEndpoint
  | CustomerCheckoutStatusEndpoint
  | IamLoginEndpoint
  | IamTokenEndpoint
  | IamRevokeEndpoint;
