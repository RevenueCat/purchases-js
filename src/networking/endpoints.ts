type HttpMethodType = "GET" | "POST";

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

export class CheckoutCalculateTaxEndpoint implements Endpoint {
  method: HttpMethodType = "POST";
  name: string = "postCheckoutCalculateTax";
  private readonly operationSessionId: string;

  constructor(operationSessionId: string) {
    this.operationSessionId = operationSessionId;
  }

  urlPath(): string {
    return `${RC_BILLING_PATH}/checkout/${this.operationSessionId}/calculate_taxes`;
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

export type SupportedEndpoint =
  | GetOfferingsEndpoint
  | PurchaseEndpoint
  | GetProductsEndpoint
  | GetCustomerInfoEndpoint
  | GetBrandingInfoEndpoint
  | GetCheckoutStatusEndpoint
  | SetAttributesEndpoint
  | PostReceiptEndpoint
  | GetVirtualCurrenciesEndpoint;
