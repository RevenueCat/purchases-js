import {
  type Offering,
  type Offerings,
  type Package,
  toOffering,
} from "./entities/offerings";
import RCPurchasesUI from "./ui/rcb-ui.svelte";

import { type CustomerInfo, toCustomerInfo } from "./entities/customer-info";
import {
  ErrorCode,
  PurchasesError,
  UninitializedPurchasesError,
} from "./entities/errors";
import {
  type OfferingResponse,
  type OfferingsResponse,
  type PackageResponse,
} from "./networking/responses/offerings-response";
import {
  type ProductResponse,
  type ProductsResponse,
} from "./networking/responses/products-response";
import { RC_ENDPOINT } from "./helpers/constants";
import { Backend } from "./networking/backend";
import { isSandboxApiKey } from "./helpers/api-key-helper";
import {
  type PurchaseFlowError,
  PurchaseOperationHelper,
} from "./helpers/purchase-operation-helper";
import { type LogLevel } from "./entities/log-level";
import { Logger } from "./helpers/logger";
import {
  validateApiKey,
  validateAppUserId,
} from "./helpers/configuration-validators";

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
export {
  ErrorCode,
  PurchasesError,
  UninitializedPurchasesError,
} from "./entities/errors";
export { LogLevel } from "./entities/log-level";

/**
 * Entry point for Purchases SDK. It should be instantiated as soon as your
 * app is started. Only one instance of Purchases should be instantiated
 * at a time!
 * @public
 */
export class Purchases {
  /** @internal */
  readonly _API_KEY: string;

  /** @internal */
  private _appUserId: string;

  /** @internal */
  private readonly backend: Backend;

  /** @internal */
  private readonly purchaseOperationHelper: PurchaseOperationHelper;

  /** @internal */
  private static instance: Purchases | undefined = undefined;

  /**
   * Set the log level. Logs of the given level and below will be printed
   * in the console.
   * Default is `LogLevel.Silent` so no logs will be printed in the console.
   * @param logLevel - LogLevel to set.
   */
  static setLogLevel(logLevel: LogLevel) {
    Logger.setLogLevel(logLevel);
  }

  /**
   * Get the singleton instance of Purchases. It's preferred to use the instance
   * obtained from the {@link Purchases.configure} method when possible.
   * @throws {@link UninitializedPurchasesError} if the instance has not been initialized yet.
   */
  static getSharedInstance(): Purchases {
    if (Purchases.isConfigured()) {
      return Purchases.instance!;
    }
    throw new UninitializedPurchasesError();
  }

  /**
   * Returns whether the Purchases SDK is configured or not.
   */
  static isConfigured(): boolean {
    return Purchases.instance !== undefined;
  }

  /**
   * Configures the Purchases SDK. This should be called as soon as your app
   * has a unique user id for your user. You should only call this once, and
   * keep the returned instance around for use throughout your application.
   * @param apiKey - RevenueCat API Key. Can be obtained from the RevenueCat dashboard.
   * @param appUserId - Your unique id for identifying the user.
   * @throws {@link PurchasesError} if the API key or user id are invalid.
   */
  static configure(apiKey: string, appUserId: string): Purchases {
    if (Purchases.instance !== undefined) {
      Logger.warnLog(
        "Purchases is already initialized. You normally should only configure Purchases once. " +
          "Creating and returning new instance.",
      );
    }
    validateApiKey(apiKey);
    validateAppUserId(appUserId);
    Purchases.instance = new Purchases(apiKey, appUserId);
    return Purchases.getSharedInstance();
  }

  /** @internal */
  private constructor(apiKey: string, appUserId: string) {
    this._API_KEY = apiKey;
    this._appUserId = appUserId;

    if (RC_ENDPOINT === undefined) {
      Logger.errorLog(
        "Project was build without some of the environment variables set",
      );
    }
    if (isSandboxApiKey(apiKey)) {
      Logger.debugLog("Initializing Purchases SDK with sandbox API Key");
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
      Logger.debugLog(
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
   */
  public async getOfferings(): Promise<Offerings> {
    const appUserId = this._appUserId;
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
   * entitlement. This will use {@link Purchases.getCustomerInfo} under the hood.
   * @param entitlementIdentifier - The entitlement identifier you want to check.
   * @returns Whether the user is entitled to the specified entitlement
   * @throws {@link PurchasesError} if there is an error while fetching the customer info.
   * @see {@link Purchases.getCustomerInfo}
   */
  public async isEntitledTo(entitlementIdentifier: string): Promise<boolean> {
    const customerInfo = await this.getCustomerInfo();
    return entitlementIdentifier in customerInfo.entitlements.active;
  }

  /**
   * Method to perform a purchase for a given package. You can obtain the
   * package from {@link Purchases.getOfferings}. This method will present the purchase
   * form on your site, using the given HTML element as the mount point, if
   * provided, or as a modal if not.
   * @param rcPackage - The package you want to purchase. Obtained from {@link Purchases.getOfferings}.
   * @param customerEmail - The email of the user. If null, RevenueCat will ask the customer for their email.
   * @param htmlTarget - The HTML element where the billing view should be added. If null, a new div will be created at the root of the page and appended to the body.
   @param purchaseOptionId - The ID for a specific purchase option. Used to purchase trials and other offers. Obtained from {@link Purchases.getOfferings}.
   * @returns The customer info after the purchase is completed successfuly.
   * @throws {@link PurchasesError} if there is an error while performing the purchase. If the {@link PurchasesError.errorCode} is {@link ErrorCode.UserCancelledError}, the user cancelled the purchase.
   */
  public purchasePackage(
    rcPackage: Package,
    purchaseOptionId: string, // WARNING: This is a breaking change
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
    const appUserId = this._appUserId;

    Logger.debugLog(
      `Presenting purchase form for package ${rcPackage.identifier}`,
    );

    return new Promise((resolve, reject) => {
      new RCPurchasesUI({
        target: certainHTMLTarget,
        props: {
          appUserId,
          rcPackage,
          purchaseOptionId,
          customerEmail,
          onFinished: async () => {
            Logger.debugLog("Purchase finished");
            certainHTMLTarget.innerHTML = "";
            // TODO: Add info about transaction in result.
            resolve({
              customerInfo: await this._getCustomerInfoForUserId(appUserId),
            });
          },
          onClose: () => {
            certainHTMLTarget.innerHTML = "";
            Logger.debugLog("Purchase cancelled by user");
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
   * @returns The latest {@link CustomerInfo}.
   * @throws {@link PurchasesError} if there is an error while fetching the customer info.
   */
  public async getCustomerInfo(): Promise<CustomerInfo> {
    return await this._getCustomerInfoForUserId(this._appUserId);
  }

  /**
   * Gets the current app user id.
   */
  public getAppUserId(): string {
    return this._appUserId;
  }

  /**
   * Change the current app user id. Returns the customer info for the new
   * user id.
   * @param newAppUserId - The user id to change to.
   */
  public async changeUser(newAppUserId: string): Promise<CustomerInfo> {
    this._appUserId = newAppUserId;
    // TODO: Cancel all pending requests if any.
    return await this.getCustomerInfo();
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
      Logger.debugLog(
        `Could not find product data for product ids: 
        ${missingProductIds.join()}. 
        Please check that your product configuration is correct.`,
      );
    }
  }

  /**
   * @returns Whether the SDK is using a sandbox API Key.
   */
  public isSandbox(): boolean {
    return isSandboxApiKey(this._API_KEY);
  }

  /**
   * Closes the Purchases instance. You should never have to do this normally.
   */
  public close() {
    if (Purchases.instance === this) {
      Purchases.instance = undefined;
    } else {
      Logger.warnLog(
        "Trying to close a Purchases instance that is not the current instance. Ignoring.",
      );
    }
  }

  /** @internal */
  private async _getCustomerInfoForUserId(
    appUserId: string,
  ): Promise<CustomerInfo> {
    const subscriberResponse = await this.backend.getCustomerInfo(appUserId);

    return toCustomerInfo(subscriberResponse);
  }
}
