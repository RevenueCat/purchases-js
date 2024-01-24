import {
  Offering as InnerOffering,
  Offerings as InnerOfferings,
  Package as InnerPackage,
  toOffering,
} from "./entities/offerings";
import { PaymentProviderSettings, ServerResponse } from "./entities/types";
import RCPurchasesUI from "./ui/rcb-ui.svelte";

import {
  CustomerInfo as InnerCustomerInfo,
  toCustomerInfo,
} from "./entities/customer-info";
import { waitForEntitlement } from "./helpers/entitlement-checking-helper";
import { ErrorCode, PurchasesError } from "./entities/errors";
import { performRequest } from "./networking/http-client";
import {
  GetCustomerInfoEndpoint,
  GetEntitlementsEndpoint,
  GetOfferingsEndpoint,
  GetProductsEndpoint,
} from "./networking/endpoints";
import {
  OfferingResponse,
  OfferingsResponse,
  PackageResponse,
} from "./networking/responses/offerings-response";
import { ProductsResponse } from "./networking/responses/products-response";
import { SubscriberResponse } from "./networking/responses/subscriber-response";
import {
  EntitlementResponse,
  EntitlementsResponse,
} from "./networking/responses/entitlements-response";
import { RC_ENDPOINT } from "./helpers/constants";

export type Offerings = InnerOfferings;
export type Offering = InnerOffering;
export type Package = InnerPackage;
export type CustomerInfo = InnerCustomerInfo;
export type {
  EntitlementInfos,
  EntitlementInfo,
} from "./entities/customer-info";
export { ErrorCode, PurchasesError } from "./entities/errors";

export class Purchases {
  // @internal
  _API_KEY: string;
  // @internal
  _APP_USER_ID: string | null = null;
  // @internal
  _PAYMENT_PROVIDER_SETTINGS: PaymentProviderSettings | null = null;

  constructor(
    apiKey: string,
    paymentProviderSettings: PaymentProviderSettings,
  ) {
    this._API_KEY = apiKey;
    this._PAYMENT_PROVIDER_SETTINGS = paymentProviderSettings;

    if (RC_ENDPOINT === undefined) {
      console.error(
        "Project was build without some of the environment variables set",
      );
    }

    // Will need to change this to something more flexible
    // if/when we end up supporting more payment gateways
    if (
      !this._PAYMENT_PROVIDER_SETTINGS.stripe ||
      !this._PAYMENT_PROVIDER_SETTINGS.stripe?.accountId ||
      !this._PAYMENT_PROVIDER_SETTINGS.stripe?.publishableKey
    ) {
      console.error(
        "Project was build without the stripe payment provider settings set",
      );
    }
  }

  private toOfferings = (
    offeringsData: OfferingsResponse,
    productsData: ProductsResponse,
  ): Offerings => {
    const currentOfferingServerResponse =
      offeringsData.offerings.find(
        (o: OfferingResponse) =>
          o.identifier === offeringsData.current_offering_id,
      ) ?? null;

    const productsMap: ServerResponse = {};
    productsData.product_details.forEach((p: ServerResponse) => {
      productsMap[p.identifier] = p;
    });

    const currentOffering: InnerOffering | null =
      currentOfferingServerResponse == null
        ? null
        : toOffering(currentOfferingServerResponse, productsMap);

    const allOfferings: { [offeringId: string]: Offering } = {};
    offeringsData.offerings.forEach((o: ServerResponse) => {
      const offering = toOffering(o, productsMap);
      if (offering != null) {
        allOfferings[o.identifier] = offering;
      }
    });

    if (Object.keys(allOfferings).length == 0) {
      console.debug(
        "Empty offerings. Please make sure you've configured offerings correctly in the " +
          "RevenueCat dashboard and that the products are properly configured.",
      );
    }

    return {
      all: allOfferings,
      current: currentOffering,
    };
  };

  public async getOfferings(appUserId: string): Promise<Offerings> {
    const offeringsResponse = await performRequest<null, OfferingsResponse>(
      new GetOfferingsEndpoint(appUserId),
      this._API_KEY,
    );
    const productIds = offeringsResponse.offerings
      .flatMap((o: OfferingResponse) => o.packages)
      .map((p: PackageResponse) => p.platform_product_identifier);

    const productsResponse = await performRequest<null, ProductsResponse>(
      new GetProductsEndpoint(appUserId, productIds),
      this._API_KEY,
    );

    this.logMissingProductIds(productIds, productsResponse.product_details);
    return this.toOfferings(offeringsResponse, productsResponse);
  }

  public async isEntitledTo(
    appUserId: string,
    entitlementIdentifier: string,
  ): Promise<boolean> {
    const entitlementsResponse = await performRequest<
      null,
      EntitlementsResponse
    >(new GetEntitlementsEndpoint(appUserId), this._API_KEY);

    const entitlements = entitlementsResponse.entitlements.map(
      (ent: EntitlementResponse) => ent.lookup_key,
    );
    return entitlements.includes(entitlementIdentifier);
  }

  public purchasePackage(
    appUserId: string,
    rcPackage: Package,
    entitlementId: string, // TODO: Remove this parameter once we don't have to poll for entitlements
    {
      customerEmail,
      htmlTarget,
    }: {
      customerEmail?: string;
      htmlTarget?: HTMLElement;
    } = {},
  ): Promise<{ customerInfo: CustomerInfo }> {
    let resolvedHTMLTarget =
      htmlTarget ?? document.getElementById("rcb-ui-root");

    if (resolvedHTMLTarget === null) {
      const element = document.createElement("div");
      element.className = "rcb-ui-root";
      document.body.appendChild(element);
      resolvedHTMLTarget = element;
    }

    if (resolvedHTMLTarget === null) {
      throw new Error(
        "Could not generate a mount point for the billing widget",
      );
    }

    const certainHTMLTarget = resolvedHTMLTarget as unknown as HTMLElement;

    const asModal = !Boolean(htmlTarget);

    return new Promise((resolve, reject) => {
      new RCPurchasesUI({
        target: certainHTMLTarget,
        props: {
          appUserId,
          rcPackage,
          customerEmail,
          onFinished: async () => {
            const hasEntitlement = await waitForEntitlement(
              this,
              appUserId,
              entitlementId,
            );
            certainHTMLTarget.innerHTML = "";
            if (hasEntitlement) {
              // TODO: Add info about transaction in result.
              resolve({ customerInfo: await this.getCustomerInfo(appUserId) });
            } else {
              reject(
                new PurchasesError(
                  ErrorCode.UnknownError,
                  "Did not get entitlement after polling.",
                ),
              );
            }
          },
          onClose: () => {
            certainHTMLTarget.innerHTML = "";
            reject(new PurchasesError(ErrorCode.UserCancelledError));
          },
          purchases: this,
          asModal,
        },
      });
    });
  }

  public async getCustomerInfo(appUserId: string): Promise<CustomerInfo> {
    // TODO: Abstract network requests to avoid duplication
    const subscriberResponse = await performRequest<null, SubscriberResponse>(
      new GetCustomerInfoEndpoint(appUserId),
      this._API_KEY,
    );

    return toCustomerInfo(subscriberResponse);
  }

  private logMissingProductIds(
    productIds: string[],
    productDetails: ServerResponse[],
  ) {
    const foundProductIdsMap: { [productId: string]: ServerResponse } = {};
    productDetails.forEach(
      (ent: ServerResponse) => (foundProductIdsMap[ent.identifier] = ent),
    );
    const missingProductIds: string[] = [];
    productIds.forEach((productId: string) => {
      if (foundProductIdsMap[productId] === undefined) {
        missingProductIds.push(productId);
      }
    });
    if (missingProductIds.length > 0) {
      console.log(
        "Could not find product data for product ids: ",
        missingProductIds,
        ". Please check that your product configuration is correct.",
      );
    }
  }

  public isSandbox(): boolean {
    return this._API_KEY ? this._API_KEY.startsWith("rcb_sb_") : false;
  }
}
