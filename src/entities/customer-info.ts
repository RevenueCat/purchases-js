import {
  SubscriberEntitlementResponse,
  SubscriberResponse,
} from "../networking/responses/subscriber-response";

export interface EntitlementInfo {
  readonly identifier: string;
  readonly isActive: boolean;
  readonly originalPurchaseDate: Date;
  readonly expirationDate: Date | null;
  readonly productIdentifier: string;
}

export interface EntitlementInfos {
  readonly all: { [entitlementId: string]: EntitlementInfo };
  readonly active: { [entitlementId: string]: EntitlementInfo };
}

export interface CustomerInfo {
  readonly entitlements: EntitlementInfos;
  readonly managementURL: string | null;
  readonly requestDate: Date;
  readonly firstSeenDate: Date;
  readonly originalPurchaseDate: Date | null;
}

function isActive(
  entitlementInfoResponse: SubscriberEntitlementResponse,
): boolean {
  if (entitlementInfoResponse.expires_date == null) return true;
  const expirationDate = new Date(entitlementInfoResponse.expires_date);
  const currentDate = new Date();
  return expirationDate > currentDate;
}

function toEntitlementInfo(
  entitlementIdentifier: string,
  entitlementInfoResponse: SubscriberEntitlementResponse,
): EntitlementInfo {
  return {
    identifier: entitlementIdentifier,
    isActive: isActive(entitlementInfoResponse),
    originalPurchaseDate: new Date(entitlementInfoResponse.purchase_date),
    expirationDate: entitlementInfoResponse.expires_date
      ? new Date(entitlementInfoResponse.expires_date)
      : null,
    productIdentifier: entitlementInfoResponse.product_identifier,
  };
}

function toEntitlementInfos(entitlementsResponse: {
  [entitlementId: string]: SubscriberEntitlementResponse;
}): EntitlementInfos {
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

export function toCustomerInfo(
  customerInfoResponse: SubscriberResponse,
): CustomerInfo {
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
