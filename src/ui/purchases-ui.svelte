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
  import { translatorContextKey } from "./localization/constants";
  import {
    type PriceBreakdown,
    type TaxCustomerDetails,
    type CurrentPage,
    TaxCalculationStatus,
    TaxCalculationPendingReason,
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
  import type { TaxBreakdown } from "../networking/responses/checkout-calculate-tax-response";

  interface Props {
    customerEmail: string | undefined;
    appUserId: string;
    rcPackage: Package;
    purchaseOption: PurchaseOption;
    metadata: PurchaseMetadata | undefined;
    brandingInfo: BrandingInfoResponse | null;
    purchases: Purchases;
    eventsTracker: IEventsTracker;
    purchaseOperationHelper: PurchaseOperationHelper;
    selectedLocale: string;
    defaultLocale: string;
    customTranslations?: CustomTranslations;
    isInElement: boolean;
    onFinished: (
      operationSessionId: string,
      redemptionInfo: RedemptionInfo | null,
    ) => void;
    onError: (error: PurchaseFlowError) => void;
    onClose: (() => void) | undefined;
  }

  const {
    customerEmail,
    appUserId,
    rcPackage,
    purchaseOption,
    metadata,
    brandingInfo,
    purchases,
    eventsTracker,
    purchaseOperationHelper,
    selectedLocale,
    defaultLocale,
    customTranslations = {},
    isInElement,
    onFinished,
    onError,
    onClose,
  }: Props = $props();

  let productDetails: Product = rcPackage.webBillingProduct;
  let lastError: PurchaseFlowError | null = $state(null);
  const productId = rcPackage.webBillingProduct.identifier ?? null;

  let currentPage: CurrentPage | null = $state(null);
  let redemptionInfo: RedemptionInfo | null = $state(null);
  let operationSessionId: string | null = $state(null);
  let gatewayParams: GatewayParams = $state({});

  let taxCalculationStatus: TaxCalculationStatus = $state("disabled");
  let pendingReason: TaxCalculationPendingReason | null = $state(null);
  let taxAmountInMicros: number | null = $state(null);
  let taxBreakdown: TaxBreakdown[] | null = $state(null);
  let totalExcludingTaxInMicros: number | null = $state(
    productDetails.currentPrice.amountMicros,
  );
  let totalAmountInMicros: number | null = $state(
    productDetails.currentPrice.amountMicros,
  );

  let priceBreakdown: PriceBreakdown = $derived({
    currency: productDetails.currentPrice.currency,
    totalAmountInMicros,
    totalExcludingTaxInMicros,
    taxCalculationStatus,
    pendingReason,
    taxAmountInMicros,
    taxBreakdown,
  });

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

    currentPage = "payment-entry-loading";

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
        // If tax collection is enabled, we start in the state `disabled`
        if (
          ALLOW_TAX_CALCULATION_FF &&
          brandingInfo?.gateway_tax_collection_enabled
        ) {
          await refreshTaxCalculation();
        }
        return result;
      })
      .catch((e: PurchaseFlowError) => {
        handleError(e);
      });
  });

  const handleContinue = (params: ContinueHandlerParams = {}) => {
    if (params.error) {
      handleError(params.error);
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
    if (taxCalculationStatus !== "disabled") {
      taxCalculationStatus = "loading";
    }

    const taxCalculation = await purchaseOperationHelper.checkoutCalculateTax(
      taxCustomerDetails?.countryCode,
      taxCustomerDetails?.postalCode,
    );

    if (taxCalculation.error) {
      switch (taxCalculation.error) {
        case TaxCalculationError.Pending:
          taxCalculationStatus = "pending";
          pendingReason = null;
          break;
        case TaxCalculationError.Disabled:
          taxCalculationStatus = "disabled";
          pendingReason = null;
          break;
        case TaxCalculationError.InvalidLocation:
          taxCalculationStatus = "pending";
          pendingReason = "invalid_postal_code";
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

    taxCalculationStatus = "calculated";
    taxAmountInMicros = data.tax_amount_in_micros;
    totalExcludingTaxInMicros = data.total_excluding_tax_in_micros;
    totalAmountInMicros = data.total_amount_in_micros;
    taxBreakdown = data.pricing_phases.base.tax_breakdown;
    pendingReason = null;

    gatewayParams = {
      ...gatewayParams,
      elements_configuration: data.gateway_params.elements_configuration,
    };
  }

  const handleError = (e: PurchaseFlowError) => {
    const event = createCheckoutFlowErrorEvent({
      errorCode: e.getErrorCode().toString(),
      errorMessage: e.message,
    });
    eventsTracker.trackSDKEvent(event);
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
  {lastError}
  {gatewayParams}
  {purchaseOperationHelper}
  {isInElement}
  {priceBreakdown}
  customerEmail={customerEmail ?? null}
  {closeWithError}
  onContinue={handleContinue}
  {onClose}
  onTaxCustomerDetailsUpdated={refreshTaxCalculation}
/>
