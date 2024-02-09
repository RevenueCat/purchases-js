import { Offering, Offerings, Package, toOffering } from "./entities/offerings";
import RCPurchasesUI from "./ui/rcb-ui.svelte";

import { CustomerInfo, toCustomerInfo } from "./entities/customer-info";
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
import { RC_ENDPOINT } from "./helpers/constants";
import { Backend } from "./networking/backend";
import { isSandboxApiKey } from "./helpers/api-key-helper";
import {
  PurchaseFlowError,
  PurchaseOperationHelper,
} from "./helpers/purchase-operation-helper";

export type {
  Offering,
  Offerings,
  Package,
  Product,
  Price,
} from "./entities/offerings";
export { PackageType } from "./entities/offerings";
export type { CustomerInfo } from "./entities/customer-info";
export type {
  EntitlementInfos,
  EntitlementInfo,
  Store,
  PeriodType,
} from "./entities/customer-info";
export { ErrorCode, PurchasesError } from "./entities/errors";

/**
 * Entry point for Purchases SDK. It should be instantiated as soon as your
 * app is started.
 * @warning Only one instance of Purchases should be instantiated at a time!
 */
export class Purchases {
  /** @internal */
  readonly _API_KEY: string;

  /** @internal */
  private readonly backend: Backend;

  /** @internal */
  private readonly purchaseOperationHelper: PurchaseOperationHelper;

  /**
   * Constructor for Purchases.
   * @param apiKey RevenueCat API Key. Can be obtained from the RevenueCat dashboard.
   */
  constructor(apiKey: string) {
    this._API_KEY = apiKey;

    if (RC_ENDPOINT === undefined) {
      console.error(
        "Project was build without some of the environment variables set",
      );
    }

    this.backend = new Backend(this._API_KEY);
    this.purchaseOperationHelper = new PurchaseOperationHelper(this.backend);
  }

  /** @internal */
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

    const currentOffering: Offering | null =
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

  /**
   * Fetch the configured offerings for this user. You can configure these
   * in the RevenueCat dashboard.
   * @param appUserId Your app's user id in your system.
   */
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

  /**
   * Convenience method to check whether a user is entitled to a specific
   * entitlement. This will use {@link getCustomerInfo} under the hood.
   * @param appUserId Your app's user id in your system.
   * @param entitlementIdentifier The entitlement identifier you want to check.
   * @returns Whether the user is entitled to the specified entitlement
   * @throws {@link PurchasesError} if there is an error while fetching the customer info.
   * @see {@link getCustomerInfo}
   */
  public async isEntitledTo(
    appUserId: string,
    entitlementIdentifier: string,
  ): Promise<boolean> {
    const customerInfo = await this.getCustomerInfo(appUserId);
    return entitlementIdentifier in customerInfo.entitlements.active;
  }

  /**
   * Method to perform a purchase for a given package. You can obtain the
   * package from {@link getOfferings}. This method will present the purchase
   * form on your site, using the given HTML element as the mount point, if
   * provided, or as a modal if not.
   * @param appUserId Your app's user id in your system.
   * @param rcPackage The package you want to purchase. Obtained from {@link getOfferings}.
   * @param customerEmail The email of the user. If null, RevenueCat will ask the customer for their email.
   * @param htmlTarget The HTML element where the billing view should be added. If null, a new div will be created at the root of the page and appended to the body.
   * @returns The customer info after the purchase is completed successfuly.
   * @throws {@link PurchasesError} if there is an error while performing the purchase. If the {@link PurchasesError.errorCode} is {@link ErrorCode.UserCancelledError}, the user cancelled the purchase.
   */
  public purchasePackage(
    appUserId: string,
    rcPackage: Package,
    customerEmail?: string,
    htmlTarget?: HTMLElement,
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
            certainHTMLTarget.innerHTML = "";
            // TODO: Add info about transaction in result.
            resolve({ customerInfo: await this.getCustomerInfo(appUserId) });
          },
          onClose: () => {
            certainHTMLTarget.innerHTML = "";
            reject(new PurchasesError(ErrorCode.UserCancelledError));
          },
          onError: (e: PurchaseFlowError) => {
            certainHTMLTarget.innerHTML = "";
            reject(PurchasesError.getForPurchasesFlowError(e));
          },
          purchases: this,
          backend: this.backend,
          purchaseOperationHelper: this.purchaseOperationHelper,
          asModal,
        },
      });
    });
  }

  /**
   * Gets latest available {@link CustomerInfo}.
   * @param appUserId Your app's user id in your system.
   * @returns The latest {@link CustomerInfo}.
   * @throws {@link PurchasesError} if there is an error while fetching the customer info.
   */
  public async getCustomerInfo(appUserId: string): Promise<CustomerInfo> {
    const subscriberResponse = await this.backend.getCustomerInfo(appUserId);

    return toCustomerInfo(subscriberResponse);
  }

  /** @internal */
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

  /**
   * @returns Whether the SDK is using a sandbox API Key.
   */
  public isSandbox(): boolean {
    return isSandboxApiKey(this._API_KEY);
  }
}
