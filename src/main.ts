import {
  type Offering,
  type Offerings,
  type Package,
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
import { type ProductResponse } from "./networking/responses/products-response";
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
  validateAdditionalHeaders,
  validateApiKey,
  validateAppUserId,
  validateProxyUrl,
} from "./helpers/configuration-validators";
import { type PurchaseParams } from "./entities/purchase-params";
import { defaultHttpConfig, type HttpConfig } from "./entities/http-config";
import {
  type GetOfferingsParams,
  OfferingKeyword,
} from "./entities/get-offerings-params";
import { validateCurrency } from "./helpers/validators";
import { type BrandingInfoResponse } from "./networking/responses/branding-response";
import { requiresLoadedResources } from "./helpers/decorators";
import {
  findOfferingByPlacementId,
  toOfferings,
} from "./helpers/offerings-parser";
import { type RedemptionInfo } from "./entities/redemption-info";
import { type PurchaseResult } from "./entities/purchase-result";
import { mount } from "svelte";

export { ProductType } from "./entities/offerings";
export type {
  NonSubscriptionOption,
  Offering,
  Offerings,
  Package,
  Product,
  PresentedOfferingContext,
  Price,
  PurchaseOption,
  SubscriptionOption,
  TargetingContext,
  PricingPhase,
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
export type { PurchasesErrorExtra } from "./entities/errors";
export type { Period, PeriodUnit } from "./helpers/duration-helper";
export type { HttpConfig } from "./entities/http-config";
export { LogLevel } from "./entities/log-level";
export type { GetOfferingsParams } from "./entities/get-offerings-params";
export { OfferingKeyword } from "./entities/get-offerings-params";
export type { PurchaseParams } from "./entities/purchase-params";
export type { RedemptionInfo } from "./entities/redemption-info";
export type { PurchaseResult } from "./entities/purchase-result";

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
  private _brandingInfo: BrandingInfoResponse | null = null;

  /** @internal */
  private _loadingResourcesPromise: Promise<void> | null = null;

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
   * @param httpConfig - Advanced http configuration to customise the SDK usage {@link HttpConfig}.
   * @throws {@link PurchasesError} if the API key or user id are invalid.
   */
  static configure(
    apiKey: string,
    appUserId: string,
    httpConfig: HttpConfig = defaultHttpConfig,
  ): Purchases {
    if (Purchases.instance !== undefined) {
      Logger.warnLog(
        "Purchases is already initialized. You normally should only configure Purchases once. " +
          "Creating and returning new instance.",
      );
    }
    validateApiKey(apiKey);
    validateAppUserId(appUserId);
    validateProxyUrl(httpConfig.proxyURL);
    validateAdditionalHeaders(httpConfig.additionalHeaders);
    Purchases.instance = new Purchases(apiKey, appUserId, httpConfig);
    return Purchases.getSharedInstance();
  }

  /**
   * Loads and caches some optional data in the Purchases SDK.
   * Currently only fetching branding information. You can call this method
   * after configuring the SDK to speed up the first call to
   * {@link Purchases.purchase}.
   */
  public async preload(): Promise<void> {
    if (this.hasLoadedResources()) {
      Logger.verboseLog("Purchases resources are loaded. Skipping.");
      return;
    }
    if (this._loadingResourcesPromise !== null) {
      Logger.verboseLog("Purchases resources are loading. Waiting.");
      await this._loadingResourcesPromise;
      return;
    }
    this._loadingResourcesPromise = this.backend
      .getBrandingInfo()
      .then((brandingInfo) => {
        this._brandingInfo = brandingInfo;
      })
      .catch((e) => {
        let errorMessage = `${e}`;
        if (e instanceof PurchasesError) {
          errorMessage = `${e.message}. ${e.underlyingErrorMessage ? `Underlying error: ${e.underlyingErrorMessage}` : ""}`;
        }
        Logger.errorLog(`Error fetching branding info: ${errorMessage}`);
      })
      .finally(() => {
        this._loadingResourcesPromise = null;
      });
    return this._loadingResourcesPromise;
  }

  private hasLoadedResources(): boolean {
    return this._brandingInfo !== null;
  }

  /** @internal */
  private constructor(
    apiKey: string,
    appUserId: string,
    httpConfig: HttpConfig = defaultHttpConfig,
  ) {
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
    this.backend = new Backend(this._API_KEY, httpConfig);
    this.purchaseOperationHelper = new PurchaseOperationHelper(this.backend);
  }

  /**
   * Fetch the configured offerings for this user. You can configure these
   * in the RevenueCat dashboard.
   * @param params - The parameters object to customise the offerings fetch. Check {@link GetOfferingsParams}
   */
  public async getOfferings(params?: GetOfferingsParams): Promise<Offerings> {
    validateCurrency(params?.currency);
    const appUserId = this._appUserId;
    const offeringsResponse = await this.backend.getOfferings(appUserId);

    const offeringIdFilter =
      params?.offeringIdentifier === OfferingKeyword.Current
        ? offeringsResponse.current_offering_id
        : params?.offeringIdentifier;

    if (offeringIdFilter) {
      offeringsResponse.offerings = offeringsResponse.offerings.filter(
        (offering: OfferingResponse) =>
          offering.identifier === offeringIdFilter,
      );
    }

    return await this.getAllOfferings(offeringsResponse, appUserId, params);
  }

  /**
   * Retrieves a specific offering by a placement identifier.
   * For more info see https://www.revenuecat.com/docs/tools/targeting
   * @param placementIdentifier - The placement identifier to retrieve the offering for.
   * @param params - The parameters object to customise the offerings fetch. Check {@link GetOfferingsParams}
   */
  public async getCurrentOfferingForPlacement(
    placementIdentifier: string,
    params?: GetOfferingsParams,
  ): Promise<Offering | null> {
    const appUserId = this._appUserId;
    const offeringsResponse = await this.backend.getOfferings(appUserId);

    const offerings = await this.getAllOfferings(
      offeringsResponse,
      appUserId,
      params,
    );
    const placementData = offeringsResponse.placements ?? null;
    if (placementData == null) {
      return null;
    }
    return findOfferingByPlacementId(
      placementData,
      offerings.all,
      placementIdentifier,
    );
  }

  private async getAllOfferings(
    offeringsResponse: OfferingsResponse,
    appUserId: string,
    params?: GetOfferingsParams,
  ): Promise<Offerings> {
    const productIds = offeringsResponse.offerings
      .flatMap((o: OfferingResponse) => o.packages)
      .map((p: PackageResponse) => p.platform_product_identifier);

    const productsResponse = await this.backend.getProducts(
      appUserId,
      productIds,
      params?.currency,
    );

    this.logMissingProductIds(productIds, productsResponse.product_details);
    return toOfferings(offeringsResponse, productsResponse);
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
   * @deprecated - please use .purchase
   * @param rcPackage - The package you want to purchase. Obtained from {@link Purchases.getOfferings}.
   * @param customerEmail - The email of the user. If undefined, RevenueCat will ask the customer for their email.
   * @param htmlTarget - The HTML element where the billing view should be added. If undefined, a new div will be created at the root of the page and appended to the body.
   * @returns a Promise for the customer info after the purchase is completed successfully.
   * @throws {@link PurchasesError} if there is an error while performing the purchase. If the {@link PurchasesError.errorCode} is {@link ErrorCode.UserCancelledError}, the user cancelled the purchase.
   */
  public purchasePackage(
    rcPackage: Package,
    customerEmail?: string,
    htmlTarget?: HTMLElement,
  ): Promise<PurchaseResult> {
    return this.purchase({
      rcPackage,
      customerEmail,
      htmlTarget,
    });
  }

  /**
   * Method to perform a purchase for a given package. You can obtain the
   * package from {@link Purchases.getOfferings}. This method will present the purchase
   * form on your site, using the given HTML element as the mount point, if
   * provided, or as a modal if not.
   * @param params - The parameters object to customise the purchase flow. Check {@link PurchaseParams}
   * @returns a Promise for the customer and redemption info after the purchase is completed successfully.
   * @throws {@link PurchasesError} if there is an error while performing the purchase. If the {@link PurchasesError.errorCode} is {@link ErrorCode.UserCancelledError}, the user cancelled the purchase.
   */
  @requiresLoadedResources
  public purchase(params: PurchaseParams): Promise<PurchaseResult> {
    const { rcPackage, purchaseOption, htmlTarget, customerEmail } = params;
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
      mount(RCPurchasesUI, {
        target: certainHTMLTarget,
        props: {
          appUserId,
          rcPackage,
          purchaseOption,
          customerEmail,
          onFinished: async (redemptionInfo: RedemptionInfo | null) => {
            Logger.debugLog("Purchase finished");
            certainHTMLTarget.innerHTML = "";
            // TODO: Add info about transaction in result.
            const purchaseResult: PurchaseResult = {
              customerInfo: await this._getCustomerInfoForUserId(appUserId),
              redemptionInfo: redemptionInfo,
            };
            resolve(purchaseResult);
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
          brandingInfo: this._brandingInfo,
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

  /**
   * Generates an anonymous app user ID that follows RevenueCat's format.
   * This can be used when you don't have a user identifier system in place.
   * The generated ID will be in the format: $RCAnonymousID:<UUID without dashes>
   * Example: $RCAnonymousID:123e4567e89b12d3a456426614174000
   * @returns A new anonymous app user ID string
   * @public
   */
  public static generateRevenueCatAnonymousAppUserId(): string {
    const uuid = crypto.randomUUID();
    return `$RCAnonymousID:${uuid.replace(/-/g, "")}`;
  }
}
