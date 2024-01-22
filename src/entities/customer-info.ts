import { ServerResponse } from "./types";

export interface EntitlementInfo {
  identifier: string;
  isActive: boolean;
  originalPurchaseDate: Date;
  expirationDate: Date;
  productIdentifier: string;
}

export interface EntitlementInfos {
  all: { [entitlementId: string]: EntitlementInfo };
  active: { [entitlementId: string]: EntitlementInfo };
}

export interface CustomerInfo {
  entitlements: EntitlementInfos;
  managementURL: string | null;
  requestDate: Date;
  firstSeenDate: Date;
  originalPurchaseDate: Date | null;
}

function isActive(entitlementInfoResponse: ServerResponse): boolean {
  const expirationDate = new Date(entitlementInfoResponse.expires_date);
  const currentDate = new Date();
  // TODO: Consider giving a grace period if we end up caching this object.
  return expirationDate > currentDate;
}

function toEntitlementInfo(
  entitlementIdentifier: string,
  entitlementInfoResponse: ServerResponse,
): EntitlementInfo {
  return {
    identifier: entitlementIdentifier,
    isActive: isActive(entitlementInfoResponse),
    originalPurchaseDate: new Date(entitlementInfoResponse.purchase_date),
    expirationDate: new Date(entitlementInfoResponse.expires_date),
    productIdentifier: entitlementInfoResponse.product_identifier,
  };
}

function toEntitlementInfos(
  entitlementsResponse: ServerResponse,
): EntitlementInfos {
  const allEntitlementInfo: { [entitlementId: string]: EntitlementInfo } = {};
  const activeEntitlementInfo: { [entitlementId: string]: EntitlementInfo } =
    {};
  for (const key in entitlementsResponse) {
    const entitlementInfo = toEntitlementInfo(key, entitlementsResponse[key]);
    allEntitlementInfo[key] = entitlementInfo;
    if (entitlementInfo.isActive) {
      activeEntitlementInfo[key] = entitlementInfo;
    }
  }
  return {
    all: allEntitlementInfo,
    active: activeEntitlementInfo,
  };
}

function toDateIfNotNull(value: string | null): Date | null {
  if (value == null) return null;
  return new Date(value);
}

export function toCustomerInfo(customerInfoResponse: ServerResponse) {
  return {
    entitlements: toEntitlementInfos(
      customerInfoResponse.subscriber.entitlements,
    ),
    managementURL: customerInfoResponse.subscriber.management_url,
    requestDate: new Date(customerInfoResponse.request_date),
    firstSeenDate: new Date(customerInfoResponse.subscriber.first_seen),
    originalPurchaseDate: toDateIfNotNull(
      customerInfoResponse.subscriber.original_purchase_date,
    ),
  };
}
