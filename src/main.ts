import type { Offering, Offerings, Package } from "./entities/offerings";
import PurchasesUi from "./ui/purchases-ui.svelte";

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
import { mount, unmount } from "svelte";
import { type RenderPaywallParams } from "./entities/render-paywall-params";
import { Paywall } from "@revenuecat/purchases-ui-js";
import { PaywallDefaultContainerZIndex } from "./ui/theme/constants";
import { parseOfferingIntoVariables } from "./helpers/paywall-variables-helpers";
import { Translator } from "./ui/localization/translator";
import { englishLocale } from "./ui/localization/constants";
import type { TrackEventProps } from "./behavioural-events/events-tracker";
import EventsTracker, {
  type IEventsTracker,
} from "./behavioural-events/events-tracker";
import {
  createCheckoutSessionEndClosedEvent,
  createCheckoutSessionEndErroredEvent,
  createCheckoutSessionEndFinishedEvent,
  createCheckoutSessionStartEvent,
} from "./behavioural-events/sdk-event-helpers";
import { SDKEventName } from "./behavioural-events/sdk-events";
import { autoParseUTMParams } from "./helpers/utm-params";
import { defaultFlagsConfig, type FlagsConfig } from "./entities/flags-config";
import { generateUUID } from "./helpers/uuid-helper";

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
  PurchaseMetadata,
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
export type { FlagsConfig } from "./entities/flags-config";
export { LogLevel } from "./entities/log-level";
export type { GetOfferingsParams } from "./entities/get-offerings-params";
export { OfferingKeyword } from "./entities/get-offerings-params";
export type { PurchaseParams } from "./entities/purchase-params";
export type { RedemptionInfo } from "./entities/redemption-info";
export type { PurchaseResult } from "./entities/purchase-result";
export type { BrandingAppearance } from "./entities/branding";

const ANONYMOUS_PREFIX = "$RCAnonymousID:";

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
  private readonly _flags: FlagsConfig;

  /** @internal */
  private readonly backend: Backend;

  /** @internal */
  private readonly purchaseOperationHelper: PurchaseOperationHelper;

  /** @internal */
  private readonly eventsTracker: IEventsTracker;

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
   * @param flags - Advanced functionality configuration {@link FlagsConfig}.
   * @throws {@link PurchasesError} if the API key or user id are invalid.
   */
  static configure(
    apiKey: string,
    appUserId: string,
    httpConfig: HttpConfig = defaultHttpConfig,
    flags: FlagsConfig = defaultFlagsConfig,
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
    Purchases.instance = new Purchases(apiKey, appUserId, httpConfig, flags);
    return Purchases.getSharedInstance();
  }

  /**
   * Loads and caches some optional data in the Purchases SDK.
   * Currently only fetching branding information.
   * You can call this method after configuring the SDK to speed
   * up the first call to {@link Purchases.purchase}.
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
    this._loadingResourcesPromise = this.fetchAndCacheBrandingInfo()
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

  /** @internal */
  private fetchAndCacheBrandingInfo(): Promise<void> {
    return this.backend.getBrandingInfo().then((brandingInfo) => {
      this._brandingInfo = brandingInfo;
    });
  }

  /** @internal */
  private hasLoadedResources(): boolean {
    return this._brandingInfo !== null;
  }

  /** @internal */
  private constructor(
    apiKey: string,
    appUserId: string,
    httpConfig: HttpConfig = defaultHttpConfig,
    flags: FlagsConfig = defaultFlagsConfig,
  ) {
    this._API_KEY = apiKey;
    this._appUserId = appUserId;
    this._flags = { ...defaultFlagsConfig, ...flags };
    if (RC_ENDPOINT === undefined) {
      Logger.errorLog(
        "Project was build without some of the environment variables set",
      );
    }
    if (isSandboxApiKey(apiKey)) {
      Logger.debugLog("Initializing Purchases SDK with sandbox API Key");
    }
    this.eventsTracker = new EventsTracker({
      apiKey: this._API_KEY,
      appUserId: this._appUserId,
      silent: !this._flags.collectAnalyticsEvents,
    });
    this.backend = new Backend(this._API_KEY, httpConfig);
    this.purchaseOperationHelper = new PurchaseOperationHelper(
      this.backend,
      this.eventsTracker,
    );
    this.eventsTracker.trackSDKEvent({
      eventName: SDKEventName.SDKInitialized,
    });
  }

  /**
   * Renders an RC Paywall and allows the user to purchase from it using Web Billing.
   * @experimental
   * @internal
   * @param paywallParams - The parameters object to customise the paywall render. Check {@link RenderPaywallParams}
   * @returns Promise<PurchaseResult>
   */
  public async renderPaywall(
    paywallParams: RenderPaywallParams,
  ): Promise<PurchaseResult> {
    console.warn(
      "This method is @experimental, Paywalls are not generally available but they will come soon!",
    );
    const htmlTarget = paywallParams.htmlTarget;

    let resolvedHTMLTarget =
      htmlTarget ?? document.getElementById("rcb-ui-pw-root");

    if (resolvedHTMLTarget === null) {
      const element = document.createElement("div");
      element.id = "rcb-ui-pw-root";
      element.className = "rcb-ui-pw-root";
      // one point less than the purchase flow modal.
      element.style.zIndex = `${PaywallDefaultContainerZIndex}`;
      document.body.appendChild(element);
      resolvedHTMLTarget = element;
    }

    if (resolvedHTMLTarget === null) {
      throw new Error(
        "Could not generate a mount point for the billing widget",
      );
    }

    const certainHTMLTarget = resolvedHTMLTarget as unknown as HTMLElement;
    // cleanup whatever is already there.
    certainHTMLTarget.innerHTML = "";

    const offering = paywallParams.offering;
    if (!offering.paywall_components) {
      throw new Error("You cannot use paywalls yet, they are coming soon!");
    }

    const selectedLocale = paywallParams.selectedLocale || navigator.language;

    const translator = new Translator(
      {},
      selectedLocale,
      offering.paywall_components.default_locale,
    );

    const startPurchaseFlow = (
      selectedPackageId: string,
    ): Promise<PurchaseResult> => {
      const pkg = offering.availablePackages.find(
        (p) => p.identifier === selectedPackageId,
      );

      if (pkg === undefined) {
        throw new Error(`No package found for ${selectedPackageId}`);
      }

      return this.purchase({
        rcPackage: pkg,
        htmlTarget: paywallParams.purchaseHtmlTarget,
        customerEmail: paywallParams.customerEmail,
        selectedLocale: selectedLocale,
        defaultLocale:
          offering.paywall_components?.default_locale || englishLocale,
      });
    };

    const navigateToUrl = (url: string) => {
      if (paywallParams.onNavigateToUrl) {
        paywallParams.onNavigateToUrl(url);
        return;
      }

      // Opinionated approach:
      // navigating to the URL in a new tab.
      window.open(url, "_blank")?.focus();
    };

    const onRestorePurchasesClicked = () => {
      // DO NOTHING
    };

    const onVisitCustomerCenterClicked = () => {
      if (paywallParams.onVisitCustomerCenter) {
        paywallParams.onVisitCustomerCenter();
        return;
      }

      // DO NOTHING, RC's customer center is not supported in web
    };

    const variablesPerPackage = parseOfferingIntoVariables(
      offering,
      translator,
    );

    return new Promise((resolve, reject) => {
      mount(Paywall, {
        target: certainHTMLTarget,
        props: {
          paywallData: offering.paywall_components!,
          selectedLocale: selectedLocale,
          onNavigateToUrlClicked: navigateToUrl,
          onVisitCustomerCenterClicked: onVisitCustomerCenterClicked,
          onBackClicked: () => {
            if (paywallParams.onBack) {
              paywallParams.onBack();
              return;
            }

            // Opinionated approach
            // closing the current purchase and emptying the paywall.
            certainHTMLTarget.innerHTML = "";
            Logger.debugLog("Purchase cancelled by user");
            reject(new PurchasesError(ErrorCode.UserCancelledError));
          },
          onRestorePurchasesClicked: onRestorePurchasesClicked,
          onPurchaseClicked: (selectedPackageId: string) => {
            startPurchaseFlow(selectedPackageId)
              .then((purchaseResult) => {
                resolve(purchaseResult);
              })
              .catch((err) => reject(err));
          },
          onError: (err: unknown) => reject(err),
          variablesPerPackage,
        },
      });
    });
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
    const {
      rcPackage,
      purchaseOption,
      htmlTarget,
      customerEmail,
      selectedLocale = englishLocale,
      defaultLocale = englishLocale,
    } = params;
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

    const appUserId = this._appUserId;

    Logger.debugLog(
      `Presenting purchase form for package ${rcPackage.identifier}`,
    );

    const localeToBeUsed = selectedLocale || defaultLocale;

    const purchaseOptionToUse =
      purchaseOption ?? rcPackage.webBillingProduct.defaultPurchaseOption;

    const event = createCheckoutSessionStartEvent({
      appearance: this._brandingInfo?.appearance,
      rcPackage,
      purchaseOptionToUse,
      customerEmail,
    });
    this.eventsTracker.trackSDKEvent(event);

    const utmParamsMetadata = this._flags.autoCollectUTMAsMetadata
      ? autoParseUTMParams()
      : {};
    const metadata = { ...utmParamsMetadata, ...(params.metadata || {}) };

    let component: ReturnType<typeof mount> | null = null;

    const finalBrandingInfo: BrandingInfoResponse | null = this._brandingInfo;

    if (finalBrandingInfo && params.brandingAppearanceOverride) {
      finalBrandingInfo.appearance = params.brandingAppearanceOverride;
    }

    const isInElement = htmlTarget !== undefined;

    return new Promise((resolve, reject) => {
      if (!isInElement) {
        window.history.pushState({ checkoutOpen: true }, "");
      }

      const onClose = () => {
        const event = createCheckoutSessionEndClosedEvent();
        this.eventsTracker.trackSDKEvent(event);
        window.removeEventListener("popstate", onClose);

        if (component) {
          unmount(component);
        }

        certainHTMLTarget.innerHTML = "";

        Logger.debugLog("Purchase cancelled by user");
        reject(new PurchasesError(ErrorCode.UserCancelledError));
      };

      if (!isInElement) {
        window.addEventListener("popstate", onClose);
      }

      const onFinished = async (
        operationSessionId: string,
        redemptionInfo: RedemptionInfo | null,
      ) => {
        const event = createCheckoutSessionEndFinishedEvent({
          redemptionInfo,
        });
        this.eventsTracker.trackSDKEvent(event);
        Logger.debugLog("Purchase finished");

        if (component) {
          unmount(component);
        }

        certainHTMLTarget.innerHTML = "";
        // TODO: Add info about transaction in result.
        const purchaseResult: PurchaseResult = {
          customerInfo: await this._getCustomerInfoForUserId(appUserId),
          redemptionInfo: redemptionInfo,
          operationSessionId: operationSessionId,
        };
        resolve(purchaseResult);
      };

      const onError = (e: PurchaseFlowError) => {
        const event = createCheckoutSessionEndErroredEvent({
          errorCode: e.errorCode?.toString(),
          errorMessage: e.message,
        });
        this.eventsTracker.trackSDKEvent(event);

        if (component) {
          unmount(component);
        }

        certainHTMLTarget.innerHTML = "";
        reject(PurchasesError.getForPurchasesFlowError(e));
      };

      component = mount(PurchasesUi, {
        target: certainHTMLTarget,
        props: {
          isInElement: isInElement,
          appUserId,
          rcPackage,
          purchaseOption: purchaseOptionToUse,
          customerEmail,
          onFinished,
          onClose,
          onError,
          purchases: this,
          eventsTracker: this.eventsTracker,
          brandingInfo: this._brandingInfo,
          purchaseOperationHelper: this.purchaseOperationHelper,
          selectedLocale: localeToBeUsed,
          metadata: metadata,
          defaultLocale,
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
    validateAppUserId(newAppUserId);
    this._appUserId = newAppUserId;
    this.eventsTracker.updateUser(newAppUserId);
    // TODO: Cancel all pending requests if any.
    // TODO: What happens with a possibly initialized purchase?
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
      if (this.eventsTracker) {
        this.eventsTracker.dispose();
      }
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
   * The generated ID will be in the format: $RCAnonymousID:\<UUID without dashes\>
   * Example: $RCAnonymousID:123e4567e89b12d3a456426614174000
   * @returns A new anonymous app user ID string
   * @public
   */
  public static generateRevenueCatAnonymousAppUserId(): string {
    return `${ANONYMOUS_PREFIX}${generateUUID().replace(/-/g, "")}`;
  }

  /**
   * Track an event.
   * @param props - The properties of the event.
   * @internal
   */
  public _trackEvent(props: TrackEventProps): void {
    this.eventsTracker.trackExternalEvent(props);
  }
}
