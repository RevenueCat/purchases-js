import { RC_ENDPOINT } from "../helpers/constants";

type HttpMethodType = "GET" | "POST";

const SUBSCRIBERS_PATH = "/v1/subscribers";
const RC_BILLING_PATH = "/rcbilling/v1";

interface Endpoint {
  method: HttpMethodType;
  name: string;
  url(): string;
}

export class GetOfferingsEndpoint implements Endpoint {
  private readonly appUserId: string;

  constructor(appUserId: string) {
    this.appUserId = appUserId;
  }

  method: HttpMethodType = "GET";
  name: string = "getOfferings";

  url(): string {
    const encodedAppUserId = encodeURIComponent(this.appUserId);
    return `${RC_ENDPOINT}${SUBSCRIBERS_PATH}/${encodedAppUserId}/offerings`;
  }
}

export class SubscribeEndpoint implements Endpoint {
  method: HttpMethodType = "POST";
  name: string = "subscribe";

  url(): string {
    return `${RC_ENDPOINT}${RC_BILLING_PATH}/subscribe`;
  }
}

export class GetProductsEndpoint implements Endpoint {
  method: HttpMethodType = "GET";
  name: string = "getProducts";
  private readonly appUserId: string;
  private readonly productIds: string[];

  constructor(appUserId: string, productIds: string[]) {
    this.appUserId = appUserId;
    this.productIds = productIds;
  }

  url(): string {
    const encodedAppUserId = encodeURIComponent(this.appUserId);
    const encodedProductIds = this.productIds
      .map(encodeURIComponent)
      .join("&id=");
    return `${RC_ENDPOINT}${RC_BILLING_PATH}/subscribers/${encodedAppUserId}/products?id=${encodedProductIds}`;
  }
}

export class GetCustomerInfoEndpoint implements Endpoint {
  method: HttpMethodType = "GET";
  name: string = "getCustomerInfo";
  private readonly appUserId: string;

  constructor(appUserId: string) {
    this.appUserId = appUserId;
  }

  url(): string {
    const encodedAppUserId = encodeURIComponent(this.appUserId);
    return `${RC_ENDPOINT}${SUBSCRIBERS_PATH}/${encodedAppUserId}`;
  }
}

export class GetBrandingInfoEndpoint implements Endpoint {
  method: HttpMethodType = "GET";
  name: string = "getBrandingInfo";

  url(): string {
    return `${RC_ENDPOINT}${RC_BILLING_PATH}/branding`;
  }
}

export class GetCheckoutStatusEndpoint implements Endpoint {
  method: HttpMethodType = "GET";
  name: string = "getCheckoutStatus";
  private readonly operationSessionId: string;

  constructor(operationSessionId: string) {
    this.operationSessionId = operationSessionId;
  }

  url(): string {
    return `${RC_ENDPOINT}${RC_BILLING_PATH}/checkout/${this.operationSessionId}`;
  }
}

export type SupportedEndpoint =
  | GetOfferingsEndpoint
  | SubscribeEndpoint
  | GetProductsEndpoint
  | GetCustomerInfoEndpoint
  | GetBrandingInfoEndpoint
  | GetCheckoutStatusEndpoint;
