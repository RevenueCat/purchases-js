import { RC_ENDPOINT } from "../helpers/constants";

type HttpMethodType = "GET" | "POST";

const SUBSCRIBERS_PATH = "/v1/subscribers";
const RC_BILLING_PATH = "/rcbilling/v1";

interface Endpoint {
  method: HttpMethodType;
  url(): string;
}

export class GetOfferingsEndpoint implements Endpoint {
  private readonly appUserId: string;

  constructor(appUserId: string) {
    this.appUserId = appUserId;
  }

  method: HttpMethodType = "GET";

  url(): string {
    return `${RC_ENDPOINT}${SUBSCRIBERS_PATH}/${this.appUserId}/offerings`;
  }
}

export class SubscribeEndpoint implements Endpoint {
  method: HttpMethodType = "POST";

  url(): string {
    return `${RC_ENDPOINT}${RC_BILLING_PATH}/subscribe`;
  }
}

export class GetProductsEndpoint implements Endpoint {
  method: HttpMethodType = "GET";
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
  private readonly appUserId: string;

  constructor(appUserId: string) {
    this.appUserId = appUserId;
  }

  url(): string {
    return `${RC_ENDPOINT}${RC_BILLING_PATH}/entitlements/${this.appUserId}`;
  }
}

export type SupportedEndpoint =
  | GetOfferingsEndpoint
  | SubscribeEndpoint
  | GetProductsEndpoint
  | GetCustomerInfoEndpoint
  | GetEntitlementsEndpoint;
