<script lang="ts">
  import PaymentEntryPage from "./pages/payment-entry-page.svelte";
  import ErrorPage from "./pages/error-page.svelte";
  import SuccessPage from "./pages/success-page.svelte";
  import LoadingPage from "./pages/payment-entry-loading-page.svelte";
  import { type PriceBreakdown, type CurrentPage } from "./ui-types";
  import { type BrandingInfoResponse } from "../networking/responses/branding-response";
  import type { Product, PurchaseOption } from "../main";
  import { getInitialPriceFromPurchaseOption } from "../helpers/purchase-option-price-helper";
  import ProductInfo from "./organisms/product-info.svelte";
  import {
    PurchaseFlowError,
    PurchaseOperationHelper,
  } from "../helpers/purchase-operation-helper";
  import Template from "./layout/template.svelte";
  import { type GatewayParams } from "../networking/responses/stripe-elements";
  import BrandingHeader from "./molecules/branding-header.svelte";
  import type { CheckoutPricingResponse } from "../networking/responses/checkout-pricing-response";
  import { writable, type Writable } from "svelte/store";
  import type { TaxCustomerDetails } from "../stripe/stripe-service";

  interface Props {
    currentPage: CurrentPage;
    brandingInfo: BrandingInfoResponse | null;
    productDetails: Product;
    purchaseOptionToUse: PurchaseOption;
    isSandbox: boolean;
    lastError: PurchaseFlowError | null;
    purchaseOperationHelper: PurchaseOperationHelper;
    isInElement: boolean;
    gatewayParams: GatewayParams;
    managementUrl: string | null;
    customerEmail: string | null;
    forceEnableWalletMethods: boolean;
    defaultPriceBreakdown?: PriceBreakdown;
    termsAndConditionsUrl?: string;
    checkoutConsentRequired?: boolean;
    showDiscountCodeField?: boolean;
    draftDiscountCode?: string;
    appliedDiscountCode?: string | null;
    discountCodeError?: string | null;
    isUpdatingDiscountCode?: boolean;
    isDiscountCodeControlsEnabled?: boolean;
    closeWithError: () => void;
    onDraftDiscountCodeChange?: (discountCode: string) => void;
    onApplyDiscountCode?: () => void | Promise<void>;
    onRemoveDiscountCode?: () => void | Promise<void>;
    onPaymentProcessingChange?: (isProcessing: boolean) => void;
    onSessionPricingUpdated?: (
      pricingResponse: CheckoutPricingResponse,
      priceBreakdown: PriceBreakdown,
    ) => void;
    onContinue: () => void;
    onError: (error: PurchaseFlowError) => void;
    onClose?: () => void;
    hideBackButton?: boolean;
    lastTaxCustomerDetailsStore?: Writable<TaxCustomerDetails | null>;
  }

  let {
    currentPage,
    brandingInfo,
    productDetails,
    purchaseOptionToUse,
    isSandbox,
    lastError,
    purchaseOperationHelper,
    isInElement,
    gatewayParams,
    managementUrl,
    customerEmail,
    forceEnableWalletMethods,
    defaultPriceBreakdown,
    termsAndConditionsUrl,
    checkoutConsentRequired = false,
    showDiscountCodeField = false,
    draftDiscountCode = "",
    appliedDiscountCode = null,
    discountCodeError = null,
    isUpdatingDiscountCode = false,
    isDiscountCodeControlsEnabled = false,
    closeWithError,
    onDraftDiscountCodeChange = undefined,
    onApplyDiscountCode = undefined,
    onRemoveDiscountCode = undefined,
    onPaymentProcessingChange = undefined,
    onSessionPricingUpdated = undefined,
    onContinue,
    onError,
    onClose = undefined,
    hideBackButton = false,
    lastTaxCustomerDetailsStore = writable<TaxCustomerDetails | null>(null),
  }: Props = $props();

  const initialPrice = getInitialPriceFromPurchaseOption(
    productDetails,
    purchaseOptionToUse,
  );

  let priceBreakdown: PriceBreakdown = $state(
    defaultPriceBreakdown ?? {
      currency: initialPrice.currency,
      totalAmountInMicros: initialPrice.amountMicros,
      totalExcludingTaxInMicros: initialPrice.amountMicros,
      taxCalculationStatus: "unavailable",
      taxAmountInMicros: null,
      taxBreakdown: null,
    },
  );

  $effect(() => {
    const updatedInitialPrice = getInitialPriceFromPurchaseOption(
      productDetails,
      purchaseOptionToUse,
    );

    priceBreakdown = defaultPriceBreakdown ?? {
      currency: updatedInitialPrice.currency,
      totalAmountInMicros: updatedInitialPrice.amountMicros,
      totalExcludingTaxInMicros: updatedInitialPrice.amountMicros,
      taxCalculationStatus: "unavailable",
      taxAmountInMicros: null,
      taxBreakdown: null,
    };
  });

  const onPriceBreakdownUpdated = (value: PriceBreakdown) => {
    priceBreakdown = value;
  };
</script>

<Template {brandingInfo} {isInElement} {isSandbox} {onClose}>
  {#snippet navbarHeaderContent()}
    <BrandingHeader
      {brandingInfo}
      {onClose}
      showCloseButton={!isInElement && !!onClose && !hideBackButton}
    />
  {/snippet}
  {#snippet navbarBodyContent()}
    <ProductInfo
      {productDetails}
      purchaseOption={purchaseOptionToUse}
      showProductDescription={brandingInfo?.appearance
        ?.show_product_description ?? false}
      {showDiscountCodeField}
      discountCode={draftDiscountCode}
      {appliedDiscountCode}
      {discountCodeError}
      {isUpdatingDiscountCode}
      {isDiscountCodeControlsEnabled}
      onDiscountCodeChange={onDraftDiscountCodeChange}
      {onApplyDiscountCode}
      {onRemoveDiscountCode}
      {priceBreakdown}
    />
  {/snippet}
  {#snippet mainContent()}
    {#if currentPage === "payment-entry-loading"}
      <LoadingPage />
    {/if}
    {#if currentPage === "payment-entry"}
      <PaymentEntryPage
        {productDetails}
        purchaseOption={purchaseOptionToUse}
        {brandingInfo}
        {purchaseOperationHelper}
        {gatewayParams}
        {managementUrl}
        {customerEmail}
        {forceEnableWalletMethods}
        {defaultPriceBreakdown}
        {termsAndConditionsUrl}
        {checkoutConsentRequired}
        {onContinue}
        {onError}
        {onPriceBreakdownUpdated}
        {onSessionPricingUpdated}
        onProcessingStateChange={onPaymentProcessingChange}
        {lastTaxCustomerDetailsStore}
      />
    {/if}

    {#if currentPage === "error"}
      <ErrorPage
        {lastError}
        {productDetails}
        supportEmail={brandingInfo?.support_email ?? null}
        onDismiss={closeWithError}
        appName={brandingInfo?.app_name ?? null}
      />
    {/if}
    {#if currentPage === "success"}
      <SuccessPage {onContinue} />
    {/if}
  {/snippet}
</Template>
