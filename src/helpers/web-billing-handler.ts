import type { ProductsResponse } from "../networking/responses/products-response";
import type { PurchaseResult } from "../entities/purchase-result";
import type { Backend } from "../networking/backend";
import type { IEventsTracker } from "../behavioural-events/events-tracker";
import type { BrandingInfoResponse } from "../networking/responses/branding-response";
import type {
  BillingHandler,
  InternalPurchaseParams,
  SyncPurchasesResult,
} from "./billing-handler";
import type { PurchaseOperationHelper } from "./purchase-operation-helper";
import {
  type OperationSessionSuccessfulResult,
  type PurchaseFlowError,
} from "./purchase-operation-helper";
import { ErrorCode, PurchasesError } from "../entities/errors";
import { Logger } from "./logger";
import PurchasesUi from "../ui/purchases-ui.svelte";
import { mount, unmount } from "svelte";
import {
  createCheckoutSessionEndClosedEvent,
  createCheckoutSessionEndErroredEvent,
  createCheckoutSessionEndFinishedEvent,
  createCheckoutSessionStartEvent,
} from "../behavioural-events/sdk-event-helpers";
import { autoParseUTMParams } from "./utm-params";
import type { FlagsConfig } from "../entities/flags-config";
import { toCustomerInfo } from "../entities/customer-info";
import { englishLocale } from "../ui/localization/constants";

/**
 * Context object containing dependencies for WebBillingHandler.
 * @internal
 */
export interface WebBillingHandlerContext {
  backend: Backend;
  eventsTracker: IEventsTracker;
  purchaseOperationHelper: PurchaseOperationHelper;
  getBrandingInfo: () => BrandingInfoResponse | null;
  flags: FlagsConfig;
  isSandbox: boolean;
  onCacheInvalidate: () => void;
}

/**
 * Web Billing (Stripe/RC) implementation of BillingHandler.
 * Handles product fetching and purchases via RevenueCat's web billing infrastructure.
 * @internal
 */
export class WebBillingHandler implements BillingHandler {
  private readonly context: WebBillingHandlerContext;

  constructor(context: WebBillingHandlerContext) {
    this.context = context;
  }

  async getProducts(
    appUserId: string,
    productIds: string[],
    currency?: string,
  ): Promise<ProductsResponse> {
    return await this.context.backend.getProducts(
      appUserId,
      productIds,
      currency,
    );
  }

  async purchase(params: InternalPurchaseParams): Promise<PurchaseResult> {
    const {
      appUserId,
      rcPackage,
      purchaseOption,
      htmlTarget,
      customerEmail,
      selectedLocale = englishLocale,
      defaultLocale = englishLocale,
      skipSuccessPage = false,
      metadata,
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

    Logger.debugLog(
      `Presenting purchase form for package ${rcPackage.identifier}`,
    );

    const localeToBeUsed = selectedLocale || defaultLocale;

    const purchaseOptionToUse =
      purchaseOption ?? rcPackage.webBillingProduct.defaultPurchaseOption;

    const brandingInfo = this.context.getBrandingInfo();

    const event = createCheckoutSessionStartEvent({
      appearance: brandingInfo?.appearance,
      rcPackage,
      purchaseOptionToUse,
      customerEmail,
    });
    this.context.eventsTracker.trackSDKEvent(event);

    const utmParamsMetadata = this.context.flags.autoCollectUTMAsMetadata
      ? autoParseUTMParams()
      : {};
    const finalMetadata = { ...utmParamsMetadata, ...(metadata || {}) };

    let component: ReturnType<typeof mount> | null = null;

    const isInElement = htmlTarget !== undefined;

    return new Promise((resolve, reject) => {
      if (!isInElement) {
        window.history.pushState({ checkoutOpen: true }, "");
      }

      const onClose = () => {
        const event = createCheckoutSessionEndClosedEvent();
        this.context.eventsTracker.trackSDKEvent(event);
        window.removeEventListener("popstate", onClose as EventListener);

        if (component) {
          unmount(component);
        }

        certainHTMLTarget.innerHTML = "";

        Logger.debugLog("Purchase cancelled by user");
        reject(new PurchasesError(ErrorCode.UserCancelledError));
      };

      if (!isInElement) {
        window.addEventListener("popstate", onClose as EventListener);
      }

      const onFinished = async (
        operationResult: OperationSessionSuccessfulResult,
      ) => {
        const event = createCheckoutSessionEndFinishedEvent({
          redemptionInfo: operationResult.redemptionInfo,
        });
        this.context.eventsTracker.trackSDKEvent(event);
        this.context.onCacheInvalidate();
        Logger.debugLog("Purchase finished");

        if (component) {
          unmount(component);
        }

        certainHTMLTarget.innerHTML = "";

        const subscriberResponse =
          await this.context.backend.getCustomerInfo(appUserId);
        const customerInfo = toCustomerInfo(subscriberResponse);

        const purchaseResult: PurchaseResult = {
          customerInfo,
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
        });
        this.context.eventsTracker.trackSDKEvent(event);

        if (component) {
          unmount(component);
        }

        certainHTMLTarget.innerHTML = "";
        reject(PurchasesError.getForPurchasesFlowError(e));
      };

      // Create a minimal interface for isSandbox that the component needs
      const purchasesInterface = {
        isSandbox: () => this.context.isSandbox,
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
          purchases: purchasesInterface as never,
          eventsTracker: this.context.eventsTracker,
          brandingInfo: brandingInfo,
          purchaseOperationHelper: this.context.purchaseOperationHelper,
          selectedLocale: localeToBeUsed,
          metadata: finalMetadata,
          defaultLocale,
          skipSuccessPage,
        },
      });
    });
  }

  async syncPurchases(
    _appUserId: string,
    _reset: boolean,
  ): Promise<SyncPurchasesResult> {
    // Web billing doesn't have local purchase history to sync.
    // Customer info from RC backend is the source of truth.
    return { receipts: [], hasMore: false };
  }
}
