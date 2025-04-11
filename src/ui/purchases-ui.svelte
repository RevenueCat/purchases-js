<script lang="ts">
  import { onMount, setContext, onDestroy } from "svelte";
  import {
    type Package,
    type Product,
    type PurchaseOption,
    type Purchases,
  } from "../main";
  import { type BrandingInfoResponse } from "../networking/responses/branding-response";

  import {
    PurchaseFlowError,
    PurchaseFlowErrorCode,
    PurchaseOperationHelper,
    TaxCalculationError,
  } from "../helpers/purchase-operation-helper";

  import { type RedemptionInfo } from "../entities/redemption-info";
  import {
    type CustomTranslations,
    Translator,
  } from "./localization/translator";
  import {
    englishLocale,
    translatorContextKey,
  } from "./localization/constants";
  import {
    type PriceBreakdown,
    type TaxCustomerDetails,
    type CurrentPage,
  } from "./ui-types";
  import PurchasesUiInner from "./purchases-ui-inner.svelte";
  import { type ContinueHandlerParams } from "./ui-types";
  import { type IEventsTracker } from "../behavioural-events/events-tracker";
  import { eventsTrackerContextKey } from "./constants";
  import { createCheckoutFlowErrorEvent } from "../behavioural-events/sdk-event-helpers";
  import type { PurchaseMetadata } from "../entities/offerings";
  import { writable } from "svelte/store";
  import { type GatewayParams } from "../networking/responses/stripe-elements";
  import { ALLOW_TAX_CALCULATION_FF } from "../helpers/constants";

  export let customerEmail: string | undefined;
  export let appUserId: string;
  export let rcPackage: Package;
  export let purchaseOption: PurchaseOption;
  export let metadata: PurchaseMetadata | undefined;
  export let brandingInfo: BrandingInfoResponse | null;
  export let onFinished: (
    operationSessionId: string,
    redemptionInfo: RedemptionInfo | null,
  ) => void;
  export let onError: (error: PurchaseFlowError) => void;
  // We don't have a close button in the UI, but we might add one soon
  export let onClose: (() => void) | undefined = undefined;
  export let purchases: Purchases;
  export let eventsTracker: IEventsTracker;
  export let purchaseOperationHelper: PurchaseOperationHelper;
  export let selectedLocale: string = englishLocale;
  export let defaultLocale: string = englishLocale;
  export let customTranslations: CustomTranslations = {};
  export let isInElement: boolean = false;

  let productDetails: Product = rcPackage.webBillingProduct;
  let lastError: PurchaseFlowError | null = null;
  const productId = rcPackage.webBillingProduct.identifier ?? null;

  let currentPage: CurrentPage | null = null;
  let redemptionInfo: RedemptionInfo | null = null;
  let operationSessionId: string | null = null;
  let gatewayParams: GatewayParams = {};

  let priceBreakdown: PriceBreakdown = {
    currency: productDetails.currentPrice.currency,
    totalAmountInMicros: productDetails.currentPrice.amountMicros,
    totalExcludingTaxInMicros: productDetails.currentPrice.amountMicros,
    taxCollectionEnabled: false,
    taxCalculationStatus: null,
    pendingReason: null,
    taxAmountInMicros: null,
    taxBreakdown: null,
  };

  // Setting the context for the Localized components
  let translator: Translator = new Translator(
    customTranslations,
    selectedLocale,
    defaultLocale,
  );
  var translatorStore = writable(translator);
  setContext(translatorContextKey, translatorStore);

  onMount(() => {
    if (!isInElement) {
      document.documentElement.style.height = "100%";
      document.body.style.height = "100%";
      document.documentElement.style.overflow = "hidden";
    }
  });

  onDestroy(() => {
    if (!isInElement) {
      document.documentElement.style.height = "auto";
      document.body.style.height = "auto";
      document.documentElement.style.overflow = "auto";
    }
  });

  setContext(eventsTrackerContextKey, eventsTracker);

  onMount(async () => {
    if (productId === null) {
      handleError(
        new PurchaseFlowError(
          PurchaseFlowErrorCode.ErrorSettingUpPurchase,
          "Product ID was not set before purchase.",
        ),
      );
      return;
    }

    if (!customerEmail) {
      currentPage = "email-entry";
    } else {
      currentPage = "payment-entry-loading";
      handleCheckoutStart();
    }
  });

  const handleCheckoutStart = () => {
    if (!customerEmail) {
      handleError(
        new PurchaseFlowError(PurchaseFlowErrorCode.MissingEmailError),
      );
      return;
    }

    purchaseOperationHelper
      .checkoutStart(
        appUserId,
        productId,
        purchaseOption,
        rcPackage.webBillingProduct.presentedOfferingContext,
        customerEmail,
        metadata,
      )
      .then((result) => {
        lastError = null;
        currentPage = "payment-entry";
        gatewayParams = result.gateway_params;
      })
      .then(async (result) => {
        if (
          ALLOW_TAX_CALCULATION_FF &&
          brandingInfo?.gateway_tax_collection_enabled
        ) {
          await refreshTaxCalculation();
          priceBreakdown.taxCollectionEnabled =
            priceBreakdown.taxCalculationStatus !== null;
        }
        return result;
      })
      .catch((e: PurchaseFlowError) => {
        handleError(e);
      });
  };

  const handleContinue = (params: ContinueHandlerParams = {}) => {
    if (params.error) {
      handleError(params.error);
      return;
    }

    if (currentPage === "email-entry") {
      if (params.authInfo) {
        customerEmail = params.authInfo.email;
        currentPage = "email-entry-processing";
      }

      handleCheckoutStart();
      return;
    }

    if (currentPage === "payment-entry") {
      currentPage = "payment-entry-processing";
      purchaseOperationHelper
        .pollCurrentPurchaseForCompletion()
        .then((pollResult) => {
          currentPage = "success";
          redemptionInfo = pollResult.redemptionInfo;
          operationSessionId = pollResult.operationSessionId;
        })
        .catch((error: PurchaseFlowError) => {
          handleError(error);
        });
      return;
    }

    if (currentPage === "success" || currentPage === "error") {
      onFinished(operationSessionId!, redemptionInfo);
      return;
    }

    currentPage = "success";
  };

  async function refreshTaxCalculation(
    taxCustomerDetails: TaxCustomerDetails | undefined = undefined,
  ) {
    if (priceBreakdown.taxCalculationStatus !== null) {
      priceBreakdown.taxCalculationStatus = "loading";
    }

    const taxCalculation = await purchaseOperationHelper.checkoutCalculateTax(
      taxCustomerDetails?.countryCode,
      taxCustomerDetails?.postalCode,
    );

    if (taxCalculation.error) {
      switch (taxCalculation.error) {
        case TaxCalculationError.Pending:
          priceBreakdown.taxCalculationStatus = "pending";
          break;
        case TaxCalculationError.Disabled:
          priceBreakdown.taxCalculationStatus = null;
          break;
        case TaxCalculationError.InvalidLocation:
          priceBreakdown.taxCalculationStatus = "pending";
          priceBreakdown.pendingReason = "invalid_postal_code";
          break;
        default:
          handleError(
            new PurchaseFlowError(
              PurchaseFlowErrorCode.ErrorSettingUpPurchase,
              "Unknown error without state set.",
            ),
          );
      }

      return;
    }

    const { data } = taxCalculation;
    priceBreakdown.taxCalculationStatus = "calculated";
    priceBreakdown.totalAmountInMicros = data.total_amount_in_micros;
    priceBreakdown.taxAmountInMicros = data.tax_amount_in_micros;
    priceBreakdown.totalExcludingTaxInMicros =
      data.total_excluding_tax_in_micros;
    priceBreakdown.taxBreakdown = data.pricing_phases.base.tax_breakdown;
    priceBreakdown.pendingReason = null;

    gatewayParams.elements_configuration =
      data.gateway_params.elements_configuration;
  }

  const handleError = (e: PurchaseFlowError) => {
    const event = createCheckoutFlowErrorEvent({
      errorCode: e.getErrorCode().toString(),
      errorMessage: e.message,
    });
    eventsTracker.trackSDKEvent(event);
    if (currentPage === "email-entry-processing" && e.isRecoverable()) {
      lastError = e;
      currentPage = "email-entry";
      return;
    }
    lastError = e;
    currentPage = "error";
  };

  const closeWithError = () => {
    onError(
      lastError ??
        new PurchaseFlowError(
          PurchaseFlowErrorCode.UnknownError,
          "Unknown error without state set.",
        ),
    );
  };
</script>

<PurchasesUiInner
  isSandbox={purchases.isSandbox()}
  currentPage={currentPage as CurrentPage}
  {brandingInfo}
  {productDetails}
  purchaseOptionToUse={purchaseOption}
  {handleContinue}
  {lastError}
  {gatewayParams}
  {purchaseOperationHelper}
  {closeWithError}
  {isInElement}
  {onClose}
  {priceBreakdown}
  onTaxCustomerDetailsUpdated={refreshTaxCalculation}
/>
