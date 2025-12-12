import type {
  Offering,
  Offerings,
  Package,
  Product,
} from "./entities/offerings";
import PurchasesUi from "./ui/purchases-ui.svelte";
import PaddlePurchasesUi from "./ui/paddle-purchases-ui.svelte";

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
import {
  isSimulatedStoreApiKey,
  isWebBillingSandboxApiKey,
  isPaddleApiKey,
} from "./helpers/api-key-helper";
import {
  type OperationSessionSuccessfulResult,
  type PurchaseFlowError,
  PurchaseOperationHelper,
} from "./helpers/purchase-operation-helper";
import { PaddleService } from "./paddle/paddle-service";
import { type LogHandler, type LogLevel } from "./entities/logging";
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
import { type PurchaseResult } from "./entities/purchase-result";
import { mount, unmount } from "svelte";
import { type PresentPaywallParams } from "./entities/present-paywall-params";
import { Paywall, type PaywallData } from "@revenuecat/purchases-ui-js";
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
import {
  defaultFlagsConfig,
  type FlagsConfig,
  supportedRCSources,
} from "./entities/flags-config";
import {
  type PurchasesConfig,
  type PurchasesContext,
} from "./entities/purchases-config";
import { generateUUID } from "./helpers/uuid-helper";
import type { PlatformInfo } from "./entities/platform-info";
import type { ReservedCustomerAttribute } from "./entities/attributes";
import { purchaseSimulatedStoreProduct } from "./helpers/simulated-store-purchase-helper";
import { postSimulatedStoreReceipt } from "./helpers/simulated-store-post-receipt-helper";
import { InMemoryCache } from "./helpers/in-memory-cache";
import type { VirtualCurrencies } from "./entities/virtual-currencies";
import { toVirtualCurrencies } from "./entities/virtual-currencies";
import type { IdentifyResult } from "./entities/identify-result";
import { parseOfferingIntoPackageInfoPerPackage } from "./helpers/paywall-package-info-helpers";
import type {
  ExpressPurchaseButtonUpdater,
  PresentExpressPurchaseButtonParams,
} from "./entities/present-express-purchase-button-params";
import { ExpressPurchaseButtonWrapper } from "./ui/express-purchase-button/express-purchase-button-wrapper.svelte";

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
export { ReservedCustomerAttribute } from "./entities/attributes";
export type { CustomerInfo } from "./entities/customer-info";
export type {
  EntitlementInfos,
  EntitlementInfo,
  Store,
  PeriodType,
  OwnershipType,
  SubscriptionInfo,
  NonSubscriptionTransaction,
} from "./entities/customer-info";
export {
  ErrorCode,
  PurchasesError,
  UninitializedPurchasesError,
} from "./entities/errors";
export type { PurchasesErrorExtra } from "./entities/errors";
export type { StoreTransaction } from "./entities/store-transaction";
export { PeriodUnit } from "./helpers/duration-helper";
export type { Period } from "./helpers/duration-helper";
export type { HttpConfig } from "./entities/http-config";
export type { FlagsConfig } from "./entities/flags-config";
export { LogLevel } from "./entities/logging";
export type { LogHandler } from "./entities/logging";
export type { IdentifyResult } from "./entities/identify-result";
export type { GetOfferingsParams } from "./entities/get-offerings-params";
export { OfferingKeyword } from "./entities/get-offerings-params";
export type { PurchaseParams } from "./entities/purchase-params";
export type { RedemptionInfo } from "./entities/redemption-info";
export type { PurchaseResult } from "./entities/purchase-result";
export type { BrandingAppearance } from "./entities/branding";
export type { PlatformInfo } from "./entities/platform-info";
export type { PurchasesConfig } from "./entities/purchases-config";
export type { VirtualCurrencies } from "./entities/virtual-currencies";
export type { VirtualCurrency } from "./entities/virtual-currency";
export type { PresentPaywallParams } from "./entities/present-paywall-params";
export type {
  PresentExpressPurchaseButtonParams,
  ExpressPurchaseButtonUpdater,
} from "./entities/present-express-purchase-button-params";

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
  private readonly _context?: PurchasesContext;

  /** @internal */
  private readonly backend: Backend;

  /** @internal */
  private readonly purchaseOperationHelper: PurchaseOperationHelper;

  /** @internal */
  private readonly eventsTracker: IEventsTracker;

  /** @internal */
  private static _platformInfo: PlatformInfo | undefined = undefined;

  /** @internal */
  private readonly inMemoryCache: InMemoryCache;

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
   * Set a custom log handler to handle SDK log messages with your own logging system.
   * If set to null, the SDK will use the default console logging.
   * @param handler - LogHandler function or null to use default console logging.
   */
  static setLogHandler(handler: LogHandler | null) {
    Logger.setLogHandler(handler);
  }

  /**
   * Meant to be used by RevenueCat hybrids SDKS only.
   * @experimental
   * */
  static setPlatformInfo(platformInfo: PlatformInfo) {
    Purchases._platformInfo = platformInfo;
  }

  /** @internal */
  static getPlatformInfo(): PlatformInfo | undefined {
    return Purchases._platformInfo;
  }

  /**
   * Get the singleton instance of Purchases. It's preferred to use the instance
   * obtained from the `configure` method when possible.
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
   * @param config - Configuration object containing apiKey, appUserId, and optional configurations.
   * @throws {@link PurchasesError} if the API key or user id are invalid.
   */
  static configure(config: PurchasesConfig): Purchases;

  /**
   * Legacy method to configure the Purchases SDK. This method is deprecated and will be removed in a future version.
   * @deprecated - please use the `configure` method with a {@link PurchasesConfig} object instead.
   * @param apiKey - RevenueCat API Key. Can be obtained from the RevenueCat dashboard.
   * @param appUserId - Your unique id for identifying the user.
   * @param httpConfig - Advanced http configuration to customise the SDK usage {@link HttpConfig}.
   * @param flags - Advanced functionality configuration {@link FlagsConfig}.
   * @throws {@link PurchasesError} if the API key or user id are invalid.
   */
  static configure(
    apiKey: string,
    appUserId: string,
    httpConfig?: HttpConfig,
    flags?: FlagsConfig,
  ): Purchases;

  static configure(
    configOrApiKey: PurchasesConfig | string,
    appUserId?: string,
    httpConfig?: HttpConfig,
    flags?: FlagsConfig,
  ): Purchases {
    if (Purchases.instance !== undefined) {
      Logger.warnLog(
        "Purchases is already initialized. You normally should only configure Purchases once. " +
          "Creating and returning new instance.",
      );
    }

    let config: PurchasesConfig;

    // Check if first argument is a configuration object
    if (typeof configOrApiKey === "object" && configOrApiKey !== null) {
      // Object-based configuration
      config = configOrApiKey;
    } else {
      // Legacy positional arguments - convert to PurchasesConfig
      if (typeof configOrApiKey !== "string") {
        throw new PurchasesError(
          ErrorCode.ConfigurationError,
          "API key must be provided as a string",
        );
      }
      if (typeof appUserId !== "string") {
        throw new PurchasesError(
          ErrorCode.ConfigurationError,
          "App user ID must be provided as a string",
        );
      }
      config = {
        apiKey: configOrApiKey,
        appUserId: appUserId,
        httpConfig: httpConfig,
        flags: flags,
      };
    }

    Purchases.configureInternal(config);
    return Purchases.getSharedInstance();
  }

  private static configureInternal(config: PurchasesConfig): void {
    const { apiKey, appUserId, httpConfig, flags, context } = config;
    const finalHttpConfig = httpConfig ?? defaultHttpConfig;
    const finalFlags = flags ?? defaultFlagsConfig;

    Purchases.validateConfig(config);
    Purchases.instance = new Purchases(
      apiKey,
      appUserId,
      finalHttpConfig,
      finalFlags,
      context,
    );
  }

  private static validateConfig(config: PurchasesConfig) {
    validateApiKey(config.apiKey);
    validateAppUserId(config.appUserId);
    validateProxyUrl(config.httpConfig?.proxyURL);
    validateAdditionalHeaders(config.httpConfig?.additionalHeaders);
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
  private async fetchAndCacheBrandingInfo(): Promise<void> {
    if (isSimulatedStoreApiKey(this._API_KEY)) {
      Logger.warnLog(
        "Branding info is not available for RC Test Store API keys.",
      );
      return;
    }
    this._brandingInfo = await this.backend.getBrandingInfo();
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
    context?: PurchasesContext,
  ) {
    this._API_KEY = apiKey;
    this._appUserId = appUserId;
    this._flags = { ...defaultFlagsConfig, ...flags };
    this._context = context;
    if (RC_ENDPOINT === undefined) {
      Logger.errorLog(
        "Project was build without some of the environment variables set",
      );
    }
    if (isWebBillingSandboxApiKey(apiKey)) {
      Logger.debugLog(
        "Initializing Purchases SDK with Web billing sandbox API Key",
      );
    } else if (isSimulatedStoreApiKey(apiKey)) {
      Logger.debugLog("Initializing Purchases SDK with RC Test store API Key.");
    }
    this.eventsTracker = new EventsTracker({
      apiKey: this._API_KEY,
      appUserId: this._appUserId,
      silent: !this._flags.collectAnalyticsEvents,
      rcSource: this._flags.rcSource ?? null,
      workflowContext: this._context?.workflowContext,
    });
    this.backend = new Backend(this._API_KEY, httpConfig, this._context);
    this.inMemoryCache = new InMemoryCache();
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
   * @param paywallParams - The parameters object to customise the paywall render. Check {@link PresentPaywallParams}
   * @returns Promise<PurchaseResult>
   */
  public async presentPaywall(
    paywallParams: PresentPaywallParams,
  ): Promise<PurchaseResult> {
    const htmlTarget = paywallParams.htmlTarget;

    let resolvedHTMLTarget =
      htmlTarget ?? document.getElementById("rcb-ui-pw-root");

    if (resolvedHTMLTarget === null) {
      const element = document.createElement("div");
      element.id = "rcb-ui-pw-root";
      element.className = "rcb-ui-pw-root";
      // one point less than the purchase flow modal.
      element.style.zIndex = `${PaywallDefaultContainerZIndex}`;
      element.style.position = "fixed";
      element.style.top = "0";
      element.style.left = "0";
      element.style.width = "100%";
      element.style.height = "100%";
      element.style.overflow = "auto";
      element.style.backgroundColor = "rgba(0, 0, 0, 0.4)";
      if (document.body.offsetWidth > 968) {
        element.style.display = "flex";
        element.style.justifyContent = "center";
        element.style.alignItems = "center";
      }
      element.style.transition = "opacity 0.3s";
      element.style.opacity = "0";
      document.body.appendChild(element);
      resolvedHTMLTarget = element;
    }

    if (resolvedHTMLTarget === null) {
      throw new Error(
        "Could not generate a mount point for the paywall widget",
      );
    }

    const certainHTMLTarget = resolvedHTMLTarget as unknown as HTMLElement;

    const offering = paywallParams.offering
      ? paywallParams.offering
      : (await this.getOfferings()).current;
    if (!offering) {
      throw new Error("No offering found.");
    }
    if (!offering.paywallComponents) {
      throw new Error("This offering doesn't have a paywall attached.");
    }

    if (!offering.uiConfig) {
      throw new Error(
        "No ui_config found for this offering, please contact support!",
      );
    }

    const calculateLocale = (
      paywallData: PaywallData,
      selectedLocale: string,
    ) => {
      const localesSupportedByPaywall: { [key: string]: string[] } = {};

      const toLocalePrefix = (potentialLocale: string) => {
        return potentialLocale.toLowerCase().split("_")[0];
      };

      Object.keys(paywallData.components_localizations).forEach((l) => {
        if (localesSupportedByPaywall[toLocalePrefix(l)] === undefined) {
          localesSupportedByPaywall[toLocalePrefix(l)] = [];
        }
        localesSupportedByPaywall[toLocalePrefix(l)].push(l);
      });

      const localesGroup =
        localesSupportedByPaywall[toLocalePrefix(selectedLocale)];
      if (!localesGroup) {
        return paywallData.default_locale;
      }

      const bestMatch = localesGroup.find(
        (l) => l.toLowerCase() === selectedLocale,
      );

      if (bestMatch) {
        return bestMatch;
      }

      // Finding best match for the selected locale group.
      return localesGroup[0];
    };

    // Resolving the correct locale to use.
    const selectedLocale = paywallParams.selectedLocale
      ? paywallParams.selectedLocale
      : navigator.language;

    const finalLocale = calculateLocale(
      offering.paywallComponents,
      selectedLocale,
    );

    const translator = new Translator(
      {},
      finalLocale,
      offering.paywallComponents.default_locale,
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
        selectedLocale: finalLocale,
        defaultLocale:
          offering.paywallComponents?.default_locale || englishLocale,
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

    const infoPerPackage = parseOfferingIntoPackageInfoPerPackage(offering);

    return new Promise((resolve, reject) => {
      const walletButtonRender = (
        element: HTMLElement,
        {
          selectedPackageId,
          onReady,
        }: { selectedPackageId: string; onReady?: () => void },
      ) => {
        const pkg = offering.packagesById[selectedPackageId];
        if (!pkg) {
          return {};
        }
        let buttonUpdater: ExpressPurchaseButtonUpdater | null = null;
        this.presentExpressPurchaseButton({
          rcPackage: pkg,
          customerEmail: paywallParams.customerEmail,
          htmlTarget: element,
          onButtonReady: (updater) => {
            buttonUpdater = updater;
            onReady?.();
          },
        })
          .then((purchaseResult) => {
            resolve(purchaseResult);
          })
          .catch((err) => reject(err));

        return {
          destroy() {
            element.innerHTML = "";
          },
          update(selectedPackageId: string) {
            if (buttonUpdater) {
              const pkg = offering.packagesById[selectedPackageId];
              if (!pkg) {
                return;
              }
              const purchaseOptionToUse =
                pkg.webBillingProduct.defaultPurchaseOption;
              buttonUpdater.updatePurchase(pkg, purchaseOptionToUse);
            }
          },
        };
      };

      certainHTMLTarget.innerHTML = "";
      const component: ReturnType<typeof mount> = mount(Paywall, {
        target: certainHTMLTarget,
        props: {
          paywallData: offering.paywallComponents!,
          selectedLocale: finalLocale,
          onNavigateToUrlClicked: navigateToUrl,
          onVisitCustomerCenterClicked: onVisitCustomerCenterClicked,
          uiConfig: offering.uiConfig!,
          onBackClicked: () => {
            if (paywallParams.onBack) {
              paywallParams.onBack();
              return;
            }
            if (component !== null) {
              component?.unmount();
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
          infoPerPackage,
          walletButtonRender: paywallParams.useExpressPurchaseButtons
            ? walletButtonRender
            : undefined,
        },
      });

      if (certainHTMLTarget.style.opacity === "0") {
        certainHTMLTarget.style.opacity = "1";
      }
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
   * Renders an Express Purchase button for the supported wallets (Apple Pay/Google Pay).
   * When clicked it uses the wallet UI to execute the purchase instead of
   * the checkout flow that would be shown with `.purchase`.
   * @internal
   * @param params - The parameters object to customise the purchase flow. Check {@link PurchaseParams}
   * @returns Promise<PurchaseResult>
   */
  @requiresLoadedResources
  public async presentExpressPurchaseButton(
    params: PresentExpressPurchaseButtonParams,
  ): Promise<PurchaseResult> {
    const {
      rcPackage,
      purchaseOption,
      htmlTarget,
      customerEmail,
      selectedLocale = englishLocale,
      defaultLocale = englishLocale,
      onButtonReady = () => {},
    } = params;

    if (htmlTarget === undefined) {
      throw new Error(
        "htmlTarget is required for presentExpressPurchaseButton",
      );
    }
    const appUserId = this._appUserId;

    const purchaseOptionToUse =
      purchaseOption ?? rcPackage.webBillingProduct.defaultPurchaseOption;

    const utmParamsMetadata = this._flags.autoCollectUTMAsMetadata
      ? autoParseUTMParams()
      : {};
    const metadata = { ...utmParamsMetadata, ...(params.metadata || {}) };

    const translator = new Translator({}, selectedLocale, defaultLocale);

    return new Promise((resolve, reject) => {
      const onFinished = async (
        operationResult: OperationSessionSuccessfulResult,
      ) => {
        const sessionEndFinishedEvent = createCheckoutSessionEndFinishedEvent({
          redemptionInfo: operationResult.redemptionInfo,
          mode: "express_purchase_button",
        });
        this.eventsTracker.trackSDKEvent(sessionEndFinishedEvent);

        Logger.debugLog("Purchase finished");

        const purchaseResult: PurchaseResult = {
          customerInfo: await this._getCustomerInfoForUserId(appUserId),
          redemptionInfo: operationResult.redemptionInfo,
          operationSessionId: operationResult.operationSessionId,
          storeTransaction: {
            storeTransactionId: operationResult.storeTransactionIdentifier,
            productIdentifier: rcPackage.webBillingProduct.identifier,
            purchaseDate: operationResult.purchaseDate,
          },
        };
        resolve(purchaseResult);
      };

      const onError = (e: PurchaseFlowError) => {
        const event = createCheckoutSessionEndErroredEvent({
          errorCode: e.errorCode?.toString(),
          errorMessage: e.message,
          mode: "express_purchase_button",
        });
        this.eventsTracker.trackSDKEvent(event);
        reject(e);
      };

      new ExpressPurchaseButtonWrapper(htmlTarget, onButtonReady, {
        appUserId,
        rcPackage,
        purchaseOption: purchaseOptionToUse,
        customerEmail,
        purchases: this,
        eventsTracker: this.eventsTracker,
        brandingInfo: this._brandingInfo,
        purchaseOperationHelper: this.purchaseOperationHelper,
        metadata: metadata,
        customTranslations: params.labelsOverride,
        translator,
        onFinished,
        onError,
      });
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
  public async purchase(params: PurchaseParams): Promise<PurchaseResult> {
    if (isSimulatedStoreApiKey(this._API_KEY)) {
      const purchaseResult = await purchaseSimulatedStoreProduct(
        params,
        this.backend,
        this._appUserId,
      );
      this.inMemoryCache.invalidateAllCaches();
      return purchaseResult;
    }

    const isPaddle = isPaddleApiKey(this._API_KEY);
    if (isPaddle) {
      return await this.performPaddlePurchase(params);
    }

    return await this.performWebBillingPurchase(params);
  }

  private async performWebBillingPurchase(
    params: PurchaseParams,
  ): Promise<PurchaseResult> {
    const {
      rcPackage,
      purchaseOption,
      htmlTarget,
      customerEmail,
      workflowPurchaseContext,
      selectedLocale = englishLocale,
      defaultLocale = englishLocale,
      skipSuccessPage = false,
    } = params;

    const certainHTMLTarget = this.resolveHTMLTarget(htmlTarget);

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

      const unmountPurchaseUi = () => {
        if (component) {
          unmount(component);
        }
        certainHTMLTarget.innerHTML = "";
      };

      const onClose = this.createCheckoutOnCloseHandler(
        reject,
        unmountPurchaseUi,
      );

      if (!isInElement && onClose) {
        window.addEventListener("popstate", onClose as EventListener);
      }

      const onFinished = this.createCheckoutOnFinishedHandler(
        resolve,
        appUserId,
        rcPackage,
        unmountPurchaseUi,
      );

      const onError = this.createCheckoutOnErrorHandler(
        reject,
        unmountPurchaseUi,
      );

      component = mount(PurchasesUi, {
        target: certainHTMLTarget,
        props: {
          isInElement: isInElement,
          appUserId,
          rcPackage,
          purchaseOption: purchaseOptionToUse,
          customerEmail,
          workflowPurchaseContext,
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
          customTranslations: params.labelsOverride,
          termsAndConditionsUrl: params.termsAndConditionsUrl,
          skipSuccessPage,
        },
      });
    });
  }

  private async performPaddlePurchase(
    params: PurchaseParams,
  ): Promise<PurchaseResult> {
    const {
      rcPackage,
      purchaseOption,
      customerEmail,
      selectedLocale = englishLocale,
      defaultLocale = englishLocale,
      skipSuccessPage = false,
      htmlTarget,
    } = params;
    const certainHTMLTarget = this.resolveHTMLTarget(htmlTarget);

    const appUserId = this._appUserId;

    Logger.debugLog(
      `Presenting Paddle checkout for package ${rcPackage.identifier}`,
    );

    const purchaseOptionToUse =
      purchaseOption ?? rcPackage.webBillingProduct.defaultPurchaseOption;

    const utmParamsMetadata = this._flags.autoCollectUTMAsMetadata
      ? autoParseUTMParams()
      : {};
    const metadata = {
      source: "paddle",
      ...utmParamsMetadata,
      ...(params.metadata || {}),
    };

    const finalBrandingInfo: BrandingInfoResponse | null = this._brandingInfo;

    if (finalBrandingInfo && params.brandingAppearanceOverride) {
      finalBrandingInfo.appearance = params.brandingAppearanceOverride;
    }

    const event = createCheckoutSessionStartEvent({
      appearance: this._brandingInfo?.appearance,
      rcPackage,
      purchaseOptionToUse,
      customerEmail,
    });
    this.eventsTracker.trackSDKEvent(event);

    const paddleService = new PaddleService(this.backend, this.eventsTracker);

    let component: ReturnType<typeof mount> | null = null;
    const isInElement = htmlTarget !== undefined;

    return new Promise((resolve, reject) => {
      if (!isInElement) {
        window.history.pushState({ checkoutOpen: true }, "");
      }

      const unmountPaddlePurchaseUi = () => {
        if (component) {
          unmount(component);
        }
        certainHTMLTarget.innerHTML = "";
      };

      const onClose =
        this.createCheckoutOnCloseHandler(reject, unmountPaddlePurchaseUi) ??
        // Always unmount PaddlePurchaseUi when the user closes the checkout modal
        (() => {
          unmountPaddlePurchaseUi();
        });

      const onFinished = this.createCheckoutOnFinishedHandler(
        resolve,
        appUserId,
        rcPackage,
        unmountPaddlePurchaseUi,
      );

      // Don't pass in unmountPaddlePurchaseUi to onError. We usually want to show
      // errors on PaddlePurchaseUi's error page instead of unmounting the UI.
      const onError = this.createCheckoutOnErrorHandler(reject);

      if (!component) {
        component = mount(PaddlePurchasesUi, {
          target: certainHTMLTarget,
          props: {
            eventsTracker: this.eventsTracker,
            brandingInfo: this._brandingInfo,
            selectedLocale: selectedLocale || defaultLocale,
            defaultLocale,
            customTranslations: params.labelsOverride,
            isInElement,
            onClose,
            onFinished,
            onError,
            skipSuccessPage,
            productDetails: rcPackage.webBillingProduct,
            rcPackage,
            appUserId,
            purchaseOption: purchaseOptionToUse,
            customerEmail,
            metadata,
            unmountPaddlePurchaseUi,
            paddleService,
          },
        });
      }
    });
  }

  /**
   * Uses htmlTarget if provided. Otherwise, looks for an element with id "rcb-ui-root".
   * If no element is found, creates a new div with className "rcb-ui-root".
   */
  private resolveHTMLTarget(htmlTarget?: HTMLElement): HTMLElement {
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

    return resolvedHTMLTarget;
  }

  private createCheckoutOnCloseHandler(
    reject: (error: PurchasesError) => void,
    callback?: () => void,
  ): (() => void) | undefined {
    const shouldPassOnCloseBehaviour =
      this._flags.rcSource && supportedRCSources.includes(this._flags.rcSource);

    if (shouldPassOnCloseBehaviour) {
      return undefined;
    }

    const onClose = () => {
      const event = createCheckoutSessionEndClosedEvent();
      this.eventsTracker.trackSDKEvent(event);
      window.removeEventListener("popstate", onClose as EventListener);

      callback?.();

      Logger.debugLog("Purchase cancelled by user");
      reject(new PurchasesError(ErrorCode.UserCancelledError));
    };

    return onClose;
  }

  private createCheckoutOnFinishedHandler(
    resolve: (value: PurchaseResult) => void,
    appUserId: string,
    rcPackage: Package,
    callback?: () => void,
  ): (operationResult: OperationSessionSuccessfulResult) => Promise<void> {
    const onFinished = async (
      operationResult: OperationSessionSuccessfulResult,
    ) => {
      const event = createCheckoutSessionEndFinishedEvent({
        redemptionInfo: operationResult.redemptionInfo,
      });
      this.eventsTracker.trackSDKEvent(event);
      this.inMemoryCache.invalidateAllCaches();
      Logger.debugLog("Purchase finished");

      callback?.();

      const purchaseResult: PurchaseResult = {
        customerInfo: await this._getCustomerInfoForUserId(appUserId),
        redemptionInfo: operationResult.redemptionInfo,
        operationSessionId: operationResult.operationSessionId,
        storeTransaction: {
          storeTransactionId: operationResult.storeTransactionIdentifier,
          productIdentifier: rcPackage.webBillingProduct.identifier,
          purchaseDate: operationResult.purchaseDate,
        },
      };
      resolve(purchaseResult);
    };
    return onFinished;
  }

  private createCheckoutOnErrorHandler(
    reject: (error: PurchasesError) => void,
    callback?: () => void,
  ): (error: PurchaseFlowError) => void {
    const onError = (e: PurchaseFlowError) => {
      const event = createCheckoutSessionEndErroredEvent({
        errorCode: e.errorCode?.toString(),
        errorMessage: e.message,
      });
      this.eventsTracker.trackSDKEvent(event);

      callback?.();
      reject(PurchasesError.getForPurchasesFlowError(e));
    };
    return onError;
  }

  /**
   * Used by internal RC code to detect if used a test store API key.
   * @internal
   */
  public _isConfiguredWithSimulatedStore(): boolean {
    return isSimulatedStoreApiKey(this._API_KEY);
  }

  /**
   * Whether wallet methods should be force-enabled in the Express Checkout Element.
   * @internal
   */
  public _shouldForceEnableWalletMethods(): boolean {
    return !!this._flags.forceEnableWalletMethods;
  }

  /**
   * Posts a simulated store receipt to the server.
   * @internal
   * @param product - The product for which we want to post the receipt for.
   * @returns Promise<PurchaseResult>
   */
  public async _postSimulatedStoreReceipt(
    product: Product,
  ): Promise<PurchaseResult> {
    if (!isSimulatedStoreApiKey(this._API_KEY)) {
      throw new PurchasesError(
        ErrorCode.ConfigurationError,
        "Posting a test store receipt is only available for RC Test Store API keys.",
      );
    }
    return await postSimulatedStoreReceipt(
      product,
      this.backend,
      this._appUserId,
    );
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
   * Sets attributes for the current user. Attributes are useful for storing additional, structured information on a customer that can be used elsewhere in the system.
   * For example, you could store your customer's email address or additional system identifiers through the applicable reserved attributes, or store arbitrary facts like onboarding survey responses, feature usage, or other dimensions as custom attributes.
   *
   * Note: Unlike our mobile SDKs, the web SDK does not cache or retry sending attributes if the request fails. If the request fails, the attributes will not be saved and you will need to retry the operation.
   *
   * @param attributes - A dictionary of attributes to set for the current user.
   * @throws {@link PurchasesError} if there is an error while setting the attributes or if the customer doesn't exist.
   */
  public async setAttributes(attributes: {
    [key: string | ReservedCustomerAttribute]: string | null;
  }): Promise<void> {
    /*
     * Ensure the customer exists by calling getCustomerInfo as setAttributes will throw an error
     * if the customer doesn't exist.
     *
     * Note: We may want to optimize this in the future by prefetching customer info during SDK initialization.
     */
    await this.getCustomerInfo();

    return await this.backend.setAttributes(this._appUserId, attributes);
  }

  /**
   * Change the current app user id. Returns the customer info for the new
   * user id.
   * @param newAppUserId - The user id to change to.
   */
  public async changeUser(newAppUserId: string): Promise<CustomerInfo> {
    await this.replaceUserId(newAppUserId);
    // TODO: Cancel all pending requests if any.
    // TODO: What happens with a possibly initialized purchase?
    return await this.getCustomerInfo();
  }

  /**
   * Identifies the current user ID with the provided appUserId, as long as the
   * previous user ID is an anonymous user ID. This will create an alias
   * between the two user ids in RevenueCat and replace the current user ID used.
   * If the old user ID is not anonymous, this method will change the current
   * user ID to the given appUserId without creating an alias.
   * @returns The customer info for the new user ID.
   * @throws {@link PurchasesError} if there is an error while performing the aliasing or fetching the customer info.
   * @param appUserId - The new user ID to identify the current user as.
   * @experimental
   */
  public async identifyUser(appUserId: string): Promise<IdentifyResult> {
    validateAppUserId(appUserId);

    if (appUserId === this._appUserId) {
      Logger.debugLog(
        `aliasUser called with the current appUserID: ${appUserId}. Ignoring.`,
      );
      return {
        customerInfo: await this.getCustomerInfo(),
        wasCreated: false,
      };
    }

    const result = await this.backend.identify(this._appUserId, appUserId);

    await this.replaceUserId(appUserId);

    return {
      customerInfo: toCustomerInfo(result),
      wasCreated: result.was_created,
    };
  }

  private async replaceUserId(newAppUserId: string): Promise<void> {
    validateAppUserId(newAppUserId);
    this._appUserId = newAppUserId;
    await this.eventsTracker.updateUser(newAppUserId);
    this.inMemoryCache.invalidateAllCaches();
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
    return (
      isWebBillingSandboxApiKey(this._API_KEY) ||
      isSimulatedStoreApiKey(this._API_KEY)
    );
  }

  /**
   * @returns Whether the current user is anonymous.
   */
  public isAnonymous(): boolean {
    return this._appUserId.startsWith(ANONYMOUS_PREFIX);
  }

  /**
   * Fetches the virtual currencies for the current subscriber.
   *
   * @returns {Promise<VirtualCurrencies>} A VirtualCurrencies object containing the subscriber's virtual currencies.
   */
  public async getVirtualCurrencies(): Promise<VirtualCurrencies> {
    return await this._getVirtualCurrenciesForUserId(this._appUserId);
  }

  /**
   * The currently cached {@link VirtualCurrencies} if one is available.
   * This value will remain null until virtual currencies have been fetched at
   * least once with {@link Purchases.getVirtualCurrencies} or an equivalent function.
   *
   * @returns {VirtualCurrencies | null} A {@link VirtualCurrencies} object containing the subscriber's virtual currencies,
   * or null if no cached data is available.
   */
  public getCachedVirtualCurrencies(): VirtualCurrencies | null {
    return this.inMemoryCache.getCachedVirtualCurrencies(this._appUserId, true);
  }

  /**
   * Invalidates the cache for virtual currencies.
   *
   * This is useful for cases where a virtual currency's balance might have been updated
   * in a different part of your system, like if you decreased a user's balance from the user spending a virtual currency,
   * or if you increased the balance from your backend using the server APIs.
   */
  public invalidateVirtualCurrenciesCache() {
    this.inMemoryCache.invalidateVirtualCurrenciesCache(this._appUserId);
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

  /** @internal  */
  private async _getVirtualCurrenciesForUserId(
    appUserId: string,
  ): Promise<VirtualCurrencies> {
    const cachedVirtualCurrencies =
      this.inMemoryCache.getCachedVirtualCurrencies(appUserId);

    if (cachedVirtualCurrencies) {
      Logger.debugLog("Vending VirtualCurrencies from cache.");
      return cachedVirtualCurrencies;
    }

    const virtualCurrenciesResponse =
      await this.backend.getVirtualCurrencies(appUserId);
    const virtualCurrencies = toVirtualCurrencies(virtualCurrenciesResponse);

    Logger.debugLog("VirtualCurrencies updated from the network.");

    this.inMemoryCache.cacheVirtualCurrencies(appUserId, virtualCurrencies);

    return virtualCurrencies;
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
