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
    return `${RC_ENDPOINT}${SUBSCRIBERS_PATH}/${this.appUserId}/offerings`;
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
    return `${RC_ENDPOINT}${RC_BILLING_PATH}/subscribers/${this.appUserId}/products?id=${this.productIds.join("&id=")}`;
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
    return `${RC_ENDPOINT}${SUBSCRIBERS_PATH}/${this.appUserId}`;
  }
}

export class GetEntitlementsEndpoint implements Endpoint {
  method: HttpMethodType = "GET";
  name: string = "getEntitlements";
  private readonly appUserId: string;

  constructor(appUserId: string) {
    this.appUserId = appUserId;
  }

  url(): string {
    return `${RC_ENDPOINT}${RC_BILLING_PATH}/entitlements/${this.appUserId}`;
  }
}

export class GetBrandingInfoEndpoint implements Endpoint {
  method: HttpMethodType = "GET";
  name: string = "getBrandingInfo";

  url(): string {
    return `${RC_ENDPOINT}${RC_BILLING_PATH}/branding`;
  }
}

export class GetOperationEndpoint implements Endpoint {
  method: HttpMethodType = "GET";
  name: string = "getOperation";
  private readonly operationSessionId: number;

  constructor(operationSessionId: number) {
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
  | GetEntitlementsEndpoint
  | GetBrandingInfoEndpoint
  | GetOperationEndpoint;
