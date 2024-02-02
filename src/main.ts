import {
  Offering as InnerOffering,
  Offerings as InnerOfferings,
  Package as InnerPackage,
  toOffering,
} from "./entities/offerings";
import { PaymentProviderSettings } from "./entities/types";
import RCPurchasesUI from "./ui/rcb-ui.svelte";

import {
  CustomerInfo as InnerCustomerInfo,
  toCustomerInfo,
} from "./entities/customer-info";
import { ErrorCode, PurchasesError } from "./entities/errors";
import {
  OfferingResponse,
  OfferingsResponse,
  PackageResponse,
} from "./networking/responses/offerings-response";
import {
  ProductResponse,
  ProductsResponse,
} from "./networking/responses/products-response";
import { EntitlementResponse } from "./networking/responses/entitlements-response";
import { RC_ENDPOINT } from "./helpers/constants";
import { Backend } from "./networking/backend";
import { isSandboxApiKey } from "./helpers/api-key-helper";
import { PurchaseHelper } from "./helpers/purchase-helper";

export type Offerings = InnerOfferings;
export type Offering = InnerOffering;
export type Package = InnerPackage;
export type CustomerInfo = InnerCustomerInfo;
export type {
  EntitlementInfos,
  EntitlementInfo,
  Store,
  PeriodType,
} from "./entities/customer-info";
export { ErrorCode, PurchasesError } from "./entities/errors";

export class Purchases {
  // @internal
  readonly _API_KEY: string;
  // @internal
  readonly _PAYMENT_PROVIDER_SETTINGS: PaymentProviderSettings | null = null;

  private readonly backend: Backend;
  private readonly purchaseHelper: PurchaseHelper;

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

    this.backend = new Backend(this._API_KEY);
    this.purchaseHelper = new PurchaseHelper(this.backend);
  }

  private toOfferings = (
    offeringsData: OfferingsResponse,
    productsData: ProductsResponse,
  ): Offerings => {
    const currentOfferingResponse =
      offeringsData.offerings.find(
        (o: OfferingResponse) =>
          o.identifier === offeringsData.current_offering_id,
      ) ?? null;

    const productsMap: { [productId: string]: ProductResponse } = {};
    productsData.product_details.forEach((p: ProductResponse) => {
      productsMap[p.identifier] = p;
    });

    const currentOffering: InnerOffering | null =
      currentOfferingResponse == null
        ? null
        : toOffering(currentOfferingResponse, productsMap);

    const allOfferings: { [offeringId: string]: Offering } = {};
    offeringsData.offerings.forEach((o: OfferingResponse) => {
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
    const offeringsResponse = await this.backend.getOfferings(appUserId);
    const productIds = offeringsResponse.offerings
      .flatMap((o: OfferingResponse) => o.packages)
      .map((p: PackageResponse) => p.platform_product_identifier);

    const productsResponse = await this.backend.getProducts(
      appUserId,
      productIds,
    );

    this.logMissingProductIds(productIds, productsResponse.product_details);
    return this.toOfferings(offeringsResponse, productsResponse);
  }

  public async isEntitledTo(
    appUserId: string,
    entitlementIdentifier: string,
  ): Promise<boolean> {
    const entitlementsResponse = await this.backend.getEntitlements(appUserId);

    const entitlements = entitlementsResponse.entitlements.map(
      (ent: EntitlementResponse) => ent.lookup_key,
    );
    return entitlements.includes(entitlementIdentifier);
  }

  public purchasePackage(
    appUserId: string,
    rcPackage: Package,
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
            await this.purchaseHelper.pollCurrentPurchaseForCompletion();
            certainHTMLTarget.innerHTML = "";
            // TODO: Add info about transaction in result.
            resolve({ customerInfo: await this.getCustomerInfo(appUserId) });
          },
          onClose: () => {
            certainHTMLTarget.innerHTML = "";
            reject(new PurchasesError(ErrorCode.UserCancelledError));
          },
          purchases: this,
          backend: this.backend,
          purchaseHelper: this.purchaseHelper,
          asModal,
        },
      });
    });
  }

  public async getCustomerInfo(appUserId: string): Promise<CustomerInfo> {
    const subscriberResponse = await this.backend.getCustomerInfo(appUserId);

    return toCustomerInfo(subscriberResponse);
  }

  private logMissingProductIds(
    productIds: string[],
    productDetails: ProductResponse[],
  ) {
    const foundProductIdsMap: { [productId: string]: ProductResponse } = {};
    productDetails.forEach(
      (ent: ProductResponse) => (foundProductIdsMap[ent.identifier] = ent),
    );
    const missingProductIds: string[] = [];
    productIds.forEach((productId: string) => {
      if (foundProductIdsMap[productId] === undefined) {
        missingProductIds.push(productId);
      }
    });
    if (missingProductIds.length > 0) {
      console.debug(
        "Could not find product data for product ids: ",
        missingProductIds,
        ". Please check that your product configuration is correct.",
      );
    }
  }

  public isSandbox(): boolean {
    return isSandboxApiKey(this._API_KEY);
  }
}
