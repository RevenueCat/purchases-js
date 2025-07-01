<script lang="ts">
  import PaymentEntryPage from "./pages/payment-entry-page.svelte";
  import ErrorPage from "./pages/error-page.svelte";
  import SuccessPage from "./pages/success-page.svelte";
  import LoadingPage from "./pages/payment-entry-loading-page.svelte";
  import { type PriceBreakdown, type CurrentPage } from "./ui-types";
  import { type BrandingInfoResponse } from "../networking/responses/branding-response";
  import type { Product, PurchaseOption } from "../main";
  import ProductInfo from "./organisms/product-info.svelte";
  import {
    PurchaseFlowError,
    PurchaseOperationHelper,
  } from "../helpers/purchase-operation-helper";
  import Template from "./layout/template.svelte";
  import { type GatewayParams } from "../networking/responses/stripe-elements";
  import BrandingHeader from "./molecules/branding-header.svelte";

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
    defaultPriceBreakdown?: PriceBreakdown;
    closeWithError: () => void;
    onContinue: () => void;
    onError: (error: PurchaseFlowError) => void;
    onClose?: () => void;
  }

  const {
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
    defaultPriceBreakdown,
    closeWithError,
    onContinue,
    onError,
    onClose = undefined,
  }: Props = $props();

  let priceBreakdown: PriceBreakdown = $state(
    defaultPriceBreakdown ?? {
      currency: productDetails.currentPrice.currency,
      totalAmountInMicros: productDetails.currentPrice.amountMicros,
      totalExcludingTaxInMicros: productDetails.currentPrice.amountMicros,
      taxCalculationStatus: "unavailable",
      taxAmountInMicros: null,
      taxBreakdown: null,
    },
  );

  const onPriceBreakdownUpdated = (value: PriceBreakdown) => {
    priceBreakdown = value;
  };
</script>

<Template {brandingInfo} {isInElement} {isSandbox} {onClose}>
  {#snippet navbarHeaderContent()}
    <BrandingHeader
      {brandingInfo}
      {onClose}
      showCloseButton={!isInElement && !!onClose}
    />
  {/snippet}
  {#snippet navbarBodyContent()}
    <ProductInfo
      {productDetails}
      purchaseOption={purchaseOptionToUse}
      showProductDescription={brandingInfo?.appearance
        ?.show_product_description ?? false}
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
        {defaultPriceBreakdown}
        {onContinue}
        {onError}
        {onPriceBreakdownUpdated}
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
